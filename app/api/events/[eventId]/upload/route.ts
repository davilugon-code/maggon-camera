import { NextResponse } from 'next/server';
import { getEventById, addPhotoToEvent } from '@/lib/db';
import { processAndSaveImage } from '@/lib/storage';
import { broadcastPhotoUpload } from '@/lib/events';
import { Photo } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await getEventById(params.eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    if (event.status === 'paused') {
      return NextResponse.json(
        { success: false, error: 'Event upload is currently paused by photographer' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const apiKey = request.headers.get('x-api-key') || (formData.get('apiKey') as string);

    // Validate API Key
    if (apiKey !== event.apiKey) {
      return NextResponse.json({ success: false, error: 'Invalid API Key' }, { status: 401 });
    }

    const file = (formData.get('file') || formData.get('image')) as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No image file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process original and generate optimized thumbnail
    const result = await processAndSaveImage(event.id, buffer, file.name || 'photo.jpg');

    const photo: Photo = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventId: event.id,
      filename: result.filename,
      originalUrl: result.originalUrl,
      thumbnailUrl: result.thumbnailUrl,
      sizeBytes: result.sizeBytes,
      width: result.width,
      height: result.height,
      uploadedAt: new Date().toISOString(),
    };

    // Save to DB
    await addPhotoToEvent(event.id, photo);

    // Broadcast in real-time to all connected mobile guests via SSE
    broadcastPhotoUpload(event.id, photo);

    return NextResponse.json({
      success: true,
      message: 'Photo uploaded and broadcasted in real-time',
      photo,
    });
  } catch (error) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ success: false, error: 'Upload failed: ' + String(error) }, { status: 500 });
  }
}
