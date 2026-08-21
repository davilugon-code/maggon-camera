import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { getEventById, getPhotosByEventId, incrementEventDownloads } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await getEventById(params.eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const photoIdsParam = searchParams.get('ids');

    let photos = await getPhotosByEventId(event.id);

    if (photoIdsParam) {
      const selectedIds = photoIdsParam.split(',').map((id) => id.trim()).filter(Boolean);
      if (selectedIds.length > 0) {
        photos = photos.filter((p) => selectedIds.includes(p.id));
      }
    }

    if (photos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma foto selecionada ou disponível para download' },
        { status: 400 }
      );
    }

    // Increment download counter in DB
    await incrementEventDownloads(event.id, photos.length);

    // Create streamable ZIP response
    const archive = archiver('zip', {
      zlib: { level: 5 }, // Compression level
    });

    const UPLOAD_BASE_DIR = process.env.LOCAL_UPLOAD_PATH || './public/uploads';

    // Append each photo file to the archive
    photos.forEach((photo, index) => {
      const filePath = path.join(UPLOAD_BASE_DIR, event.id, 'originals', photo.filename);
      if (fs.existsSync(filePath)) {
        const cleanName = `Maggon_${index + 1}_${photo.filename}`;
        archive.file(filePath, { name: cleanName });
      }
    });

    const sanitizedTitle = event.title
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const zipFilename = `Maggon_${sanitizedTitle}_${Date.now()}.zip`;

    // Convert archiver stream to standard Web Response Stream
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => controller.enqueue(chunk));
        archive.on('end', () => controller.close());
        archive.on('error', (err) => controller.error(err));
        archive.finalize();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating zip download:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate ZIP archive' }, { status: 500 });
  }
}
