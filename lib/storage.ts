import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const UPLOAD_BASE_DIR = process.env.LOCAL_UPLOAD_PATH || './public/uploads';

// Ensure upload directory exists
export function ensureStorageDirs(eventId: string) {
  const eventOriginals = path.join(UPLOAD_BASE_DIR, eventId, 'originals');
  const eventThumbnails = path.join(UPLOAD_BASE_DIR, eventId, 'thumbnails');

  if (!fs.existsSync(eventOriginals)) {
    fs.mkdirSync(eventOriginals, { recursive: true });
  }
  if (!fs.existsSync(eventThumbnails)) {
    fs.mkdirSync(eventThumbnails, { recursive: true });
  }
}

export interface SaveFileResult {
  filename: string;
  originalUrl: string;
  thumbnailUrl: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  originalFilePath: string;
}

export async function processAndSaveImage(
  eventId: string,
  buffer: Buffer,
  originalFilename: string
): Promise<SaveFileResult> {
  ensureStorageDirs(eventId);

  const timestamp = Date.now();
  const sanitizedName = originalFilename
    .replace(/[^a-zA-Z0-9_.-]/g, '_')
    .replace(/\.[^/.]+$/, '');
  const ext = '.jpg';
  const filename = `${timestamp}_${sanitizedName}${ext}`;

  const originalPath = path.join(UPLOAD_BASE_DIR, eventId, 'originals', filename);
  const thumbnailPath = path.join(UPLOAD_BASE_DIR, eventId, 'thumbnails', filename);

  // 1. Process Metadata & Original Image (Auto-orient EXIF rotate, high quality JPEG)
  const image = sharp(buffer);
  const metadata = await image.metadata();

  await image
    .rotate() // Auto-orient according to EXIF data from Canon camera
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(originalPath);

  // 2. Generate Optimized Thumbnail (600px width max, quality 80)
  await sharp(buffer)
    .rotate()
    .resize({ width: 600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, progressive: true })
    .toFile(thumbnailPath);

  const stats = fs.statSync(originalPath);

  // Return public web accessible URLs (served from Next.js /public static folder or dynamic route)
  const originalUrl = `/uploads/${eventId}/originals/${filename}`;
  const thumbnailUrl = `/uploads/${eventId}/thumbnails/${filename}`;

  return {
    filename,
    originalUrl,
    thumbnailUrl,
    sizeBytes: stats.size,
    width: metadata.width,
    height: metadata.height,
    originalFilePath: originalPath,
  };
}

export function deleteEventFiles(eventId: string) {
  const eventDir = path.join(UPLOAD_BASE_DIR, eventId);
  if (fs.existsSync(eventDir)) {
    fs.rmSync(eventDir, { recursive: true, force: true });
  }
}

export function deletePhotoFiles(eventId: string, filename: string) {
  const originalPath = path.join(UPLOAD_BASE_DIR, eventId, 'originals', filename);
  const thumbnailPath = path.join(UPLOAD_BASE_DIR, eventId, 'thumbnails', filename);

  if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
  if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
}
