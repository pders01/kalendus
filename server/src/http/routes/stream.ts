import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import type { SyncServiceImpl } from '../../core/sync.service.js';
import type { SseEvent } from '../../core/types.js';

export function streamRoutes(syncService: SyncServiceImpl) {
    const app = new Hono();

    app.get('/:calendarId/stream', (c) => {
        const calendarId = c.req.param('calendarId');

        return streamSSE(c, async (stream) => {
            // Send initial connected event
            await stream.writeSSE({
                event: 'connected',
                data: JSON.stringify({ calendarId }),
            });

            // Subscribe to calendar events
            const unsubscribe = syncService.subscribe(
                calendarId,
                async (event: SseEvent) => {
                    try {
                        await stream.writeSSE({
                            event: event.type,
                            data: JSON.stringify(event.event),
                        });
                    } catch {
                        // Client disconnected
                    }
                },
            );

            // Heartbeat every 30s to keep connection alive
            const heartbeat = setInterval(async () => {
                try {
                    await stream.writeSSE({
                        event: 'heartbeat',
                        data: JSON.stringify({
                            time: new Date().toISOString(),
                        }),
                    });
                } catch {
                    // Client disconnected
                }
            }, 30_000);

            // Cleanup on disconnect
            stream.onAbort(() => {
                unsubscribe();
                clearInterval(heartbeat);
            });

            // Keep stream open
            await new Promise<void>((resolve) => {
                stream.onAbort(() => resolve());
            });
        });
    });

    return app;
}
