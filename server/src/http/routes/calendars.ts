import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { CalendarServiceImpl } from '../../core/calendar.service.js';
import { NotFoundError } from '../../core/errors.js';
import {
    createCalendarSchema,
    updateCalendarSchema,
} from '../middleware/validator.js';

export function calendarRoutes(calendarService: CalendarServiceImpl) {
    const app = new Hono();

    app.get('/:id', async (c) => {
        const cal = await calendarService.getById(c.req.param('id'));
        if (!cal) throw new NotFoundError('Calendar', c.req.param('id'));
        return c.json(cal);
    });

    app.post(
        '/',
        zValidator('json', createCalendarSchema),
        async (c) => {
            const body = c.req.valid('json');
            const cal = await calendarService.create(body);
            return c.json(cal, 201);
        },
    );

    app.patch(
        '/:id',
        zValidator('json', updateCalendarSchema),
        async (c) => {
            const body = c.req.valid('json');
            const cal = await calendarService.update(
                c.req.param('id'),
                body,
            );
            if (!cal)
                throw new NotFoundError('Calendar', c.req.param('id'));
            return c.json(cal);
        },
    );

    app.delete('/:id', async (c) => {
        const deleted = await calendarService.delete(c.req.param('id'));
        if (!deleted)
            throw new NotFoundError('Calendar', c.req.param('id'));
        return c.json({ ok: true });
    });

    return app;
}
