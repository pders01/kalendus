import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { EventServiceImpl } from '../../core/event.service.js';
import type { SyncServiceImpl } from '../../core/sync.service.js';
import { NotFoundError } from '../../core/errors.js';
import {
    createEventSchema,
    updateEventSchema,
    dateRangeQuerySchema,
} from '../middleware/validator.js';

export function eventRoutes(
    eventService: EventServiceImpl,
    syncService: SyncServiceImpl,
) {
    const app = new Hono();

    app.get(
        '/:calendarId/events',
        zValidator('query', dateRangeQuerySchema),
        async (c) => {
            const { start, end } = c.req.valid('query');
            const entries = await eventService.getByRange(
                c.req.param('calendarId'),
                start,
                end,
            );
            return c.json(entries);
        },
    );

    app.get(
        '/:calendarId/events/summary',
        zValidator('query', dateRangeQuerySchema),
        async (c) => {
            const { start, end } = c.req.valid('query');
            const summary = await eventService.getSummary(
                c.req.param('calendarId'),
                start,
                end,
            );
            return c.json(summary);
        },
    );

    app.post(
        '/:calendarId/events',
        zValidator('json', createEventSchema),
        async (c) => {
            const body = c.req.valid('json');
            const entry = await eventService.create(
                c.req.param('calendarId'),
                body,
            );
            syncService.broadcast({
                type: 'created',
                calendarId: c.req.param('calendarId'),
                event: entry,
            });
            return c.json(entry, 201);
        },
    );

    app.patch(
        '/:calendarId/events/:eventId',
        zValidator('json', updateEventSchema),
        async (c) => {
            const body = c.req.valid('json');
            const entry = await eventService.update(
                c.req.param('calendarId'),
                c.req.param('eventId'),
                body,
            );
            if (!entry)
                throw new NotFoundError(
                    'Event',
                    c.req.param('eventId'),
                );
            syncService.broadcast({
                type: 'updated',
                calendarId: c.req.param('calendarId'),
                event: entry,
            });
            return c.json(entry);
        },
    );

    app.delete('/:calendarId/events/:eventId', async (c) => {
        const deleted = await eventService.delete(
            c.req.param('calendarId'),
            c.req.param('eventId'),
        );
        if (!deleted)
            throw new NotFoundError('Event', c.req.param('eventId'));
        syncService.broadcast({
            type: 'deleted',
            calendarId: c.req.param('calendarId'),
            event: { id: c.req.param('eventId') },
        });
        return c.json({ ok: true });
    });

    return app;
}
