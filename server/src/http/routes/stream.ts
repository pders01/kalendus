import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';

import type { CalendarServiceImpl } from '../../core/calendar.service.js';
import { NotFoundError } from '../../core/errors.js';
import type { EventBus } from '../../core/event-bus.js';
import type { SyncServiceImpl } from '../../core/sync.service.js';
import type { StreamDetailsPolicy } from '../authorization.js';
import { calendarRemovalChannel } from './calendars.js';

interface CalendarLifecycle {
    eventBus: EventBus;
    calendarService: Pick<CalendarServiceImpl, 'getById'>;
}

/** In-memory invalidations, not a durable replay log. Every connection requires reconciliation. */
export function streamRoutes(
    syncService: SyncServiceImpl,
    authorizeDetails?: StreamDetailsPolicy,
    lifecycle?: CalendarLifecycle,
) {
    const app = new Hono();

    app.get('/:calendarId/stream', async (c) => {
        const calendarId = c.req.param('calendarId');
        // createApp has already enforced stream access. A second, explicit grant
        // is needed to disclose records. Check before opening the response stream.
        const includeDetails =
            (await authorizeDetails?.({ request: c.req.raw, calendarId })) === true;
        const channel = calendarRemovalChannel(calendarId);
        if (lifecycle) {
            // Revalidate after the details policy, watching for removals across the await.
            let removed = false;
            const unwatch = lifecycle.eventBus.subscribe(channel, () => {
                removed = true;
            });
            try {
                if (!(await lifecycle.calendarService.getById(calendarId)) || removed)
                    throw new NotFoundError('Calendar', calendarId);
            } finally {
                unwatch();
            }
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
            const unsubscribeRemoval = lifecycle?.eventBus.subscribe(channel, async () => {
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
                unsubscribeRemoval?.();
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
