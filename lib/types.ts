export interface Photo {
  id: string;
  eventId: string;
  filename: string;
  originalUrl: string;
  thumbnailUrl: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  uploadedAt: string; // ISO string
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description?: string;
  date: string;
  apiKey: string;
  status: 'active' | 'paused';
  createdAt: string;
  totalPhotosCount: number;
  totalDownloadsCount: number;
  totalStorageBytes: number;
  coverPhotoUrl?: string;
}

export interface EventStats {
  totalPhotos: number;
  totalDownloads: number;
  totalStorageBytes: number;
}
