import { subscribeToEventPhotos } from '@/lib/events';
import { Photo } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Send initial connection message
      const initialMsg = `data: ${JSON.stringify({ type: 'connected', eventId })}\n\n`;
      controller.enqueue(encoder.encode(initialMsg));

      // Subscribe to real-time photo uploads for this event
      const unsubscribe = subscribeToEventPhotos(eventId, (photo: Photo) => {
        try {
          const payload = `data: ${JSON.stringify({ type: 'new_photo', photo })}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          console.error('Error enqueuing SSE photo payload:', err);
        }
      });

      // Keep connection alive with periodic heartbeats
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'));
        } catch (e) {
          clearInterval(heartbeatInterval);
        }
      }, 25000);

      // Clean up when client disconnects
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch (e) {
          // Stream already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
