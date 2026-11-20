import { Hono } from 'hono';

import { NotFoundError } from '../../core/errors.js';
import type { EventServiceImpl } from '../../core/event.service.js';
import {
    createEventSchema,
    dateRangeQuerySchema,
    eventPageQuerySchema,
    updateEventSchema,
} from '../../core/validation.js';
import type { AuthorizationGuard } from '../authorization.js';
import { validateRequest } from '../middleware/validator.js';

export function eventRoutes(eventService: EventServiceImpl, guard: AuthorizationGuard) {
    const app = new Hono();
    const read = guard('event', 'read', 'calendarId');

    // The service checks the parent; after authorization malformed input wins over a missing parent.
    app.get(
        '/:calendarId/events',
        read,
        validateRequest('query', dateRangeQuerySchema),
        async (c) => {
            const { start, end } = c.req.valid('query');
            const entries = await eventService.getByRange(c.req.param('calendarId'), start, end);
            return c.json(entries);
        },
    );

    app.get(
        '/:calendarId/events/summary',
        read,
        validateRequest('query', dateRangeQuerySchema),
        async (c) => {
            const { start, end } = c.req.valid('query');
            const summary = await eventService.getSummary(c.req.param('calendarId'), start, end);
            return c.json(summary);
        },
    );

    app.get(
        '/:calendarId/events/page',
        read,
        validateRequest('query', eventPageQuerySchema),
        async (c) => {
            const { start, end, after, limit } = c.req.valid('query');
            const page = await eventService.getByRangePage(c.req.param('calendarId'), start, end, {
                after,
                limit,
            });
            return c.json(page);
        },
    );

    app.post(
        '/:calendarId/events',
        guard('event', 'create', 'calendarId'),
        validateRequest('json', createEventSchema),
        async (c) => {
            const entry = await eventService.create(c.req.param('calendarId'), c.req.valid('json'));
            return c.json(entry, 201);
        },
    );

    app.patch(
        '/:calendarId/events/:eventId',
        guard('event', 'write', 'calendarId', 'eventId'),
        validateRequest('json', updateEventSchema),
        async (c) => {
            const { calendarId, eventId } = c.req.param();
            const entry = await eventService.update(calendarId, eventId, c.req.valid('json'));
            if (!entry) throw new NotFoundError('Event', eventId);
            return c.json(entry);
        },
    );

    app.delete(
        '/:calendarId/events/:eventId',
        guard('event', 'delete', 'calendarId', 'eventId'),
        async (c) => {
            const { calendarId, eventId } = c.req.param();
            const deleted = await eventService.delete(calendarId, eventId);
            if (!deleted) throw new NotFoundError('Event', eventId);
            return c.json({ ok: true });
        },
    );

    return app;
}
