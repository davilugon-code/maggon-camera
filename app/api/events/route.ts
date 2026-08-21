import { NextResponse } from 'next/server';
import { getEvents, createEvent } from '@/lib/db';

export async function GET() {
  try {
    const events = await getEvents();
    return NextResponse.json({ success: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, date } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Event title is required' }, { status: 400 });
    }

    const id = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 6);

    const apiKey = `ls_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}`;

    const event = await createEvent({
      id,
      title,
      slug: id,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      apiKey,
      status: 'active',
    });

    return NextResponse.json({ success: true, event });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
