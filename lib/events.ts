import { EventEmitter } from 'events';
import { Photo } from './types';

// Global singleton EventEmitter across Next.js reloads
const globalEmitter = global as unknown as { __maggon_emitter?: EventEmitter };

export const photoEmitter = globalEmitter.__maggon_emitter || new EventEmitter();
if (process.env.NODE_ENV !== 'production') {
  globalEmitter.__maggon_emitter = photoEmitter;
}

// Increase max listeners for handling many guest connections per event
photoEmitter.setMaxListeners(200);

export function broadcastPhotoUpload(eventId: string, photo: Photo) {
  photoEmitter.emit(`photo:${eventId}`, photo);
}

export function subscribeToEventPhotos(eventId: string, callback: (photo: Photo) => void) {
  const eventName = `photo:${eventId}`;
  photoEmitter.on(eventName, callback);
  return () => {
    photoEmitter.off(eventName, callback);
  };
}
