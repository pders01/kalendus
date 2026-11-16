import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

import type { SyncServiceImpl } from '../../core/sync.service.js';
import type { SseEvent } from '../../core/types.js';

/** In-memory invalidations, not a durable replay log. Every connection requires reconciliation. */
export function streamRoutes(syncService: SyncServiceImpl) {
    const app = new Hono();

    app.get('/:calendarId/stream', (c) => {
        const calendarId = c.req.param('calendarId');
        return streamSSE(c, async (stream) => {
            let pending = 0;
            let closed = false;
            let finish!: () => void;
            const done = new Promise<void>((resolve) => {
                finish = resolve;
            });
            const write = async (event: string, data: unknown) => {
                if (closed) return;
                // Disconnect a slow consumer rather than build an unbounded write queue.
                if (pending >= 32) {
                    stream.abort();
                    return;
                }
                pending++;
                try {
                    await stream.writeSSE({ event, data: JSON.stringify(data) });
                } catch {
                    stream.abort();
                } finally {
                    pending--;
                }
            };
            const unsubscribe = syncService.subscribe(calendarId, (event: SseEvent) =>
                write(event.type, event.event),
            );
            const heartbeat = setInterval(() => {
                if (!pending) void write('heartbeat', { time: new Date().toISOString() });
            }, 30_000);
            // Reconnects periodically re-run the host policy (session expiry/revocation).
            const lease = setTimeout(() => stream.abort(), 300_000);
            const cleanup = () => {
                if (closed) return;
                closed = true;
                unsubscribe();
                clearInterval(heartbeat);
                clearTimeout(lease);
                finish();
            };
            stream.onAbort(cleanup);
            try {
                await write('connected', { calendarId });
                await done;
            } finally {
                cleanup();
            }
        });
    });
    return app;
}
