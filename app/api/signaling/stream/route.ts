import { NextRequest } from 'next/server';
import { signalingHub } from '@/lib/signaling-hub';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const peerId = searchParams.get('peerId');

  if (!roomId || !peerId) {
    return new Response('Missing roomId or peerId parameter', { status: 400 });
  }

  let intervalId: NodeJS.Timeout | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      signalingHub.addSubscriber(roomId, peerId, controller);

      // Send initial connection ACK
      const encoder = new TextEncoder();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', peerId, roomId, timestamp: Date.now() })}\n\n`)
      );

      // Heartbeat ping every 15s to keep connection alive through proxies
      intervalId = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          if (intervalId) clearInterval(intervalId);
        }
      }, 15000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
      signalingHub.removeSubscriber(roomId, peerId);
    },
  });

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    if (intervalId) clearInterval(intervalId);
    signalingHub.removeSubscriber(roomId, peerId);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
