-- LiveSnap Supabase PostgreSQL Database Schema
-- Execute this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1. Create Events Table
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_photos_count INT DEFAULT 0,
  total_downloads_count INT DEFAULT 0,
  total_storage_bytes BIGINT DEFAULT 0,
  cover_photo_url TEXT
);

-- 2. Create Photos Table
CREATE TABLE IF NOT EXISTS public.photos (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  width INT,
  height INT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security (RLS) & Allow Public Read/Insert
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access (For Guests)
CREATE POLICY "Allow public read access for events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public read access for photos" ON public.photos FOR SELECT USING (true);

-- Allow public insert/update/delete (or restrict using service role key)
CREATE POLICY "Allow public insert for events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for events" ON public.events FOR DELETE USING (true);

CREATE POLICY "Allow public insert for photos" ON public.photos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete for photos" ON public.photos FOR DELETE USING (true);

-- 4. Seed initial Demo Event
INSERT INTO public.events (id, title, slug, description, date, api_key, status)
VALUES (
  'demo-casamento',
  'Casamento Lucas & Mariana',
  'casamento-lucas-mariana',
  'Cobertura fotográfica ao vivo do casamento. Baixe suas fotos!',
  CURRENT_DATE::text,
  'ls_live_demo_key_2026',
  'active'
)
ON CONFLICT (id) DO NOTHING;
