import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

import type { CalendarServiceImpl } from '../../core/calendar.service.js';
import { NotFoundError } from '../../core/errors.js';
import type { SyncServiceImpl } from '../../core/sync.service.js';
import type { AuthorizationGuard, StreamDetailsPolicy } from '../authorization.js';
import { requireCalendar } from '../require-calendar.js';

/** In-memory invalidations, not a durable replay log. Every connection requires reconciliation. */
export function streamRoutes(
    syncService: SyncServiceImpl,
    calendarService: CalendarServiceImpl,
    guard: AuthorizationGuard,
    authorizeDetails?: StreamDetailsPolicy,
) {
    const app = new Hono();

    app.get('/:calendarId/stream', guard('stream', 'stream', 'calendarId'), async (c) => {
        const calendarId = c.req.param('calendarId');
        // Hono matches HEAD through GET. Do not start a stream that it would discard.
        if (c.req.raw.method === 'HEAD') {
            await requireCalendar(calendarService, calendarId);
            return c.body(null, 200, { 'Content-Type': 'text/event-stream' });
        }

        // A separate grant is needed to disclose records. Watch for removals while
        // awaiting it and recheck storage before handing off to the live subscriptions.
        let removed = false;
        const unwatch = syncService.onCalendarRemoved(calendarId, () => {
            removed = true;
        });
        let includeDetails: boolean;
        try {
            await requireCalendar(calendarService, calendarId);
            if (removed) throw new NotFoundError('Calendar', calendarId);
            includeDetails =
                (await authorizeDetails?.({ request: c.req.raw, calendarId })) === true;
            await requireCalendar(calendarService, calendarId);
            if (removed) throw new NotFoundError('Calendar', calendarId);
        } finally {
            unwatch();
        }
        // The live subscriptions start synchronously; no await between revalidation and handoff.
        return streamSSE(c, async (stream) => {
            let pending = 0;
            let closed = false;
            let terminating = false;
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
            const unsubscribe = syncService.subscribe(calendarId, (event) => {
                if (terminating) return;
                return includeDetails ? write(event.type, event.event) : write('invalidated', {});
            });
            const unsubscribeRemoval = syncService.onCalendarRemoved(calendarId, async () => {
                if (closed || terminating) return;
                terminating = true;
                try {
                    await write('invalidated', {});
                } finally {
                    cleanup();
                }
            });
            const heartbeat = setInterval(() => {
                if (!pending && !terminating)
                    void write('heartbeat', { time: new Date().toISOString() });
            }, 30_000);
            // Reconnects periodically re-run the host policy (session expiry/revocation).
            const lease = setTimeout(() => stream.abort(), 300_000);
            const cleanup = () => {
                if (closed) return;
                closed = true;
                unsubscribe();
                unsubscribeRemoval();
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
