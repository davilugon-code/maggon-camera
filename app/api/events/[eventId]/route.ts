import { NextResponse } from 'next/server';
import { getEventById, getPhotosByEventId, updateEvent, deleteEvent } from '@/lib/db';
import { deleteEventFiles } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await getEventById(params.eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const photos = await getPhotosByEventId(event.id);

    return NextResponse.json({
      success: true,
      event,
      photos,
    });
  } catch (error) {
    console.error('Error fetching event detail:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await request.json();
    const event = await getEventById(params.eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    const updated = await updateEvent(event.id, body);
    return NextResponse.json({ success: true, event: updated });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const event = await getEventById(params.eventId);
    if (!event) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    deleteEventFiles(event.id);
    await deleteEvent(event.id);

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
