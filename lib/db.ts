import fs from 'fs';
import path from 'path';
import { Event, Photo } from './types';
import { supabase, isSupabaseConfigured } from './supabase';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface Schema {
  events: Event[];
  photos: Photo[];
}

const DEFAULT_SCHEMA: Schema = {
  events: [
    {
      id: 'demo-casamento',
      title: 'Casamento Lucas & Mariana',
      slug: 'casamento-lucas-mariana',
      description: 'Cobertura fotográfica ao vivo do casamento. Baixe suas fotos!',
      date: new Date().toISOString().split('T')[0],
      apiKey: 'ls_live_demo_key_2026',
      status: 'active',
      createdAt: new Date().toISOString(),
      totalPhotosCount: 0,
      totalDownloadsCount: 0,
      totalStorageBytes: 0,
    },
  ],
  photos: [],
};

// ----------------------------------------------------
// LOCAL JSON DB FALLBACK IMPLEMENTATION
// ----------------------------------------------------
function ensureDbExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_SCHEMA, null, 2), 'utf-8');
  }
}

function readDb(): Schema {
  ensureDbExists();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as Schema;
  } catch (error) {
    console.error('Failed to read db.json:', error);
    return DEFAULT_SCHEMA;
  }
}

function writeDb(data: Schema) {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ----------------------------------------------------
// PUBLIC UNIFIED API (SUPABASE POSTGRESQL + LOCAL FALLBACK)
// ----------------------------------------------------

export async function getEvents(): Promise<Event[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        title: row.title,
        slug: row.slug,
        description: row.description,
        date: row.date,
        apiKey: row.api_key,
        status: row.status,
        createdAt: row.created_at,
        totalPhotosCount: row.total_photos_count || 0,
        totalDownloadsCount: row.total_downloads_count || 0,
        totalStorageBytes: Number(row.total_storage_bytes || 0),
        coverPhotoUrl: row.cover_photo_url,
      }));
    }
  }
  return readDb().events;
}

export async function getEventById(id: string): Promise<Event | undefined> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .or(`id.eq.${id},slug.eq.${id}`)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        title: data.title,
        slug: data.slug,
        description: data.description,
        date: data.date,
        apiKey: data.api_key,
        status: data.status,
        createdAt: data.created_at,
        totalPhotosCount: data.total_photos_count || 0,
        totalDownloadsCount: data.total_downloads_count || 0,
        totalStorageBytes: Number(data.total_storage_bytes || 0),
        coverPhotoUrl: data.cover_photo_url,
      };
    }
  }

  const db = readDb();
  return db.events.find((e) => e.id === id || e.slug === id);
}

export async function createEvent(
  data: Omit<Event, 'createdAt' | 'totalPhotosCount' | 'totalDownloadsCount' | 'totalStorageBytes'>
): Promise<Event> {
  const createdAt = new Date().toISOString();
  const newEvent: Event = {
    ...data,
    createdAt,
    totalPhotosCount: 0,
    totalDownloadsCount: 0,
    totalStorageBytes: 0,
  };

  if (isSupabaseConfigured && supabase) {
    await supabase.from('events').insert({
      id: newEvent.id,
      title: newEvent.title,
      slug: newEvent.slug,
      description: newEvent.description,
      date: newEvent.date,
      api_key: newEvent.apiKey,
      status: newEvent.status,
      created_at: createdAt,
      total_photos_count: 0,
      total_downloads_count: 0,
      total_storage_bytes: 0,
    });
    return newEvent;
  }

  const db = readDb();
  db.events.push(newEvent);
  writeDb(db);
  return newEvent;
}

export async function updateEvent(id: string, partial: Partial<Event>): Promise<Event | null> {
  if (isSupabaseConfigured && supabase) {
    const updatePayload: Record<string, any> = {};
    if (partial.title !== undefined) updatePayload.title = partial.title;
    if (partial.description !== undefined) updatePayload.description = partial.description;
    if (partial.status !== undefined) updatePayload.status = partial.status;
    if (partial.coverPhotoUrl !== undefined) updatePayload.cover_photo_url = partial.coverPhotoUrl;

    const { data, error } = await supabase
      .from('events')
      .update(updatePayload)
      .or(`id.eq.${id},slug.eq.${id}`)
      .select()
      .single();

    if (!error && data) {
      return getEventById(id) as Promise<Event>;
    }
  }

  const db = readDb();
  const index = db.events.findIndex((e) => e.id === id || e.slug === id);
  if (index === -1) return null;

  db.events[index] = { ...db.events[index], ...partial };
  writeDb(db);
  return db.events[index];
}

export async function deleteEvent(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('events').delete().or(`id.eq.${id},slug.eq.${id}`);
    return !error;
  }

  const db = readDb();
  const initialLength = db.events.length;
  db.events = db.events.filter((e) => e.id !== id && e.slug !== id);
  db.photos = db.photos.filter((p) => p.eventId !== id);
  writeDb(db);
  return db.events.length < initialLength;
}

export async function getPhotosByEventId(eventId: string): Promise<Photo[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: false });

    if (!error && data) {
      return data.map((row) => ({
        id: row.id,
        eventId: row.event_id,
        filename: row.filename,
        originalUrl: row.original_url,
        thumbnailUrl: row.thumbnail_url,
        sizeBytes: Number(row.size_bytes),
        width: row.width,
        height: row.height,
        uploadedAt: row.uploaded_at,
      }));
    }
  }

  const db = readDb();
  return db.photos.filter((p) => p.eventId === eventId);
}

export async function addPhotoToEvent(eventId: string, photo: Photo): Promise<Event | null> {
  if (isSupabaseConfigured && supabase) {
    // 1. Insert photo row into Supabase PostgreSQL
    await supabase.from('photos').insert({
      id: photo.id,
      event_id: eventId,
      filename: photo.filename,
      original_url: photo.originalUrl,
      thumbnail_url: photo.thumbnailUrl,
      size_bytes: photo.sizeBytes,
      width: photo.width,
      height: photo.height,
      uploaded_at: photo.uploadedAt,
    });

    // 2. Fetch current event to increment counters
    const currentEvent = await getEventById(eventId);
    if (currentEvent) {
      const newCount = currentEvent.totalPhotosCount + 1;
      const newBytes = currentEvent.totalStorageBytes + photo.sizeBytes;
      const cover = currentEvent.coverPhotoUrl || photo.thumbnailUrl;

      await supabase
        .from('events')
        .update({
          total_photos_count: newCount,
          total_storage_bytes: newBytes,
          cover_photo_url: cover,
        })
        .eq('id', eventId);
    }
    return getEventById(eventId) as Promise<Event>;
  }

  const db = readDb();
  db.photos.push(photo);

  const eventIndex = db.events.findIndex((e) => e.id === eventId || e.slug === eventId);
  if (eventIndex !== -1) {
    db.events[eventIndex].totalPhotosCount += 1;
    db.events[eventIndex].totalStorageBytes += photo.sizeBytes;
    if (!db.events[eventIndex].coverPhotoUrl) {
      db.events[eventIndex].coverPhotoUrl = photo.thumbnailUrl;
    }
  }

  writeDb(db);
  return eventIndex !== -1 ? db.events[eventIndex] : null;
}

export async function incrementEventDownloads(eventId: string, count: number = 1) {
  if (isSupabaseConfigured && supabase) {
    const currentEvent = await getEventById(eventId);
    if (currentEvent) {
      await supabase
        .from('events')
        .update({
          total_downloads_count: currentEvent.totalDownloadsCount + count,
        })
        .eq('id', eventId);
    }
    return;
  }

  const db = readDb();
  const eventIndex = db.events.findIndex((e) => e.id === eventId || e.slug === eventId);
  if (eventIndex !== -1) {
    db.events[eventIndex].totalDownloadsCount += count;
    writeDb(db);
  }
}

export async function deletePhoto(eventId: string, photoId: string): Promise<Photo | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: photoData } = await supabase
      .from('photos')
      .select('*')
      .eq('id', photoId)
      .single();

    if (photoData) {
      await supabase.from('photos').delete().eq('id', photoId);
      const currentEvent = await getEventById(eventId);
      if (currentEvent) {
        await supabase
          .from('events')
          .update({
            total_photos_count: Math.max(0, currentEvent.totalPhotosCount - 1),
            total_storage_bytes: Math.max(0, currentEvent.totalStorageBytes - Number(photoData.size_bytes)),
          })
          .eq('id', eventId);
      }
    }
    return photoData as any;
  }

  const db = readDb();
  const photoIndex = db.photos.findIndex((p) => p.id === photoId && p.eventId === eventId);
  if (photoIndex === -1) return null;

  const [removed] = db.photos.splice(photoIndex, 1);
  const eventIndex = db.events.findIndex((e) => e.id === eventId || e.slug === eventId);
  if (eventIndex !== -1) {
    db.events[eventIndex].totalPhotosCount = Math.max(0, db.events[eventIndex].totalPhotosCount - 1);
    db.events[eventIndex].totalStorageBytes = Math.max(0, db.events[eventIndex].totalStorageBytes - removed.sizeBytes);
  }

  writeDb(db);
  return removed;
}
