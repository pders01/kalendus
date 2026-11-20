import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { NotFoundError } from '../../core/errors.js';
import type { EventServiceImpl } from '../../core/event.service.js';
import {
    createEventSchema,
    updateEventSchema,
    dateRangeQuerySchema,
} from '../middleware/validator.js';

export function eventRoutes(eventService: EventServiceImpl) {
    const app = new Hono();

    app.get('/:calendarId/events', zValidator('query', dateRangeQuerySchema), async (c) => {
        const { start, end } = c.req.valid('query');
        const entries = await eventService.getByRange(c.req.param('calendarId'), start, end);
        return c.json(entries);
    });

    app.get('/:calendarId/events/summary', zValidator('query', dateRangeQuerySchema), async (c) => {
        const { start, end } = c.req.valid('query');
        const summary = await eventService.getSummary(c.req.param('calendarId'), start, end);
        return c.json(summary);
    });

    app.post('/:calendarId/events', zValidator('json', createEventSchema), async (c) => {
        const body = c.req.valid('json');
        const entry = await eventService.create(c.req.param('calendarId'), body);
        return c.json(entry, 201);
    });

    app.patch('/:calendarId/events/:eventId', zValidator('json', updateEventSchema), async (c) => {
        const body = c.req.valid('json');
        const entry = await eventService.update(
            c.req.param('calendarId'),
            c.req.param('eventId'),
            body,
        );
        if (!entry) throw new NotFoundError('Event', c.req.param('eventId'));
        return c.json(entry);
    });

    app.delete('/:calendarId/events/:eventId', async (c) => {
        const deleted = await eventService.delete(
            c.req.param('calendarId'),
            c.req.param('eventId'),
        );
        if (!deleted) throw new NotFoundError('Event', c.req.param('eventId'));
        return c.json({ ok: true });
    });

    return app;
}
