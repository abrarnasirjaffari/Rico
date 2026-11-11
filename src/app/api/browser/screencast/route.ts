import { screencastManager, ScreencastFrame } from "@/lib/browser";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial Connection Handshake Event (with bots + recent activity)
      const statusPayload = screencastManager.getStatus();
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: ${JSON.stringify({
            status: "connected",
            info: statusPayload,
            bots: screencastManager.getBots(),
            activeBotId: screencastManager.getActiveBotId(),
            activities: screencastManager.getActivityHistory(),
          })}\n\n`
        )
      );

      // 2. Send current frame immediately so viewport is never blank
      const initialFrame = screencastManager.getLastFrame();
      if (initialFrame) {
        controller.enqueue(
          encoder.encode(`event: frame\ndata: ${JSON.stringify(initialFrame)}\n\n`)
        );
      }

      // 3. Subscribe to live CDP screencast frames
      const unsubscribeFrame = screencastManager.subscribe((frame: ScreencastFrame) => {
        try {
          controller.enqueue(
            encoder.encode(`event: frame\ndata: ${JSON.stringify(frame)}\n\n`)
          );
        } catch {
          unsubscribeFrame();
        }
      });

      // 4. Subscribe to live browser tab / helper bot state changes
      const unsubscribeBots = screencastManager.subscribeBots((bots, activeBotId) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: bots\ndata: ${JSON.stringify({ bots, activeBotId })}\n\n`
            )
          );
        } catch {
          unsubscribeBots();
        }
      });

      // 5. Subscribe to real-time agent browser activity logs
      const unsubscribeActivity = screencastManager.subscribeActivity((activity) => {
        try {
          controller.enqueue(
            encoder.encode(
              `event: activity\ndata: ${JSON.stringify(activity)}\n\n`
            )
          );
        } catch {
          unsubscribeActivity();
        }
      });

      // 6. Send keepalive ping every 10 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(pingInterval);
        }
      }, 10000);

      // 7. Cleanup on connection abort
      req.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        unsubscribeFrame();
        unsubscribeBots();
        unsubscribeActivity();
        try {
          controller.close();
        } catch {
          // ignore
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform, no-store, must-revalidate",
      Connection: "keep-alive",
      "Content-Encoding": "none",
      "X-Accel-Buffering": "no",
    },
  });
}
