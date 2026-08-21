import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string; type: string; filename: string } }
) {
  try {
    const { eventId, type, filename } = params;
    
    // Safety check for path traversal
    if (filename.includes('..') || type.includes('..') || eventId.includes('..')) {
      return new Response('Invalid path', { status: 400 });
    }

    const UPLOAD_BASE_DIR = process.env.LOCAL_UPLOAD_PATH || './public/uploads';
    const filePath = path.join(UPLOAD_BASE_DIR, eventId, type, filename);

    if (!fs.existsSync(filePath)) {
      return new Response('Image not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    let contentType = 'image/jpeg';
    if (filename.endsWith('.png')) contentType = 'image/png';
    else if (filename.endsWith('.webp')) contentType = 'image/webp';

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new Response('Internal error', { status: 500 });
  }
}
