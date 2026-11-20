import { Hono } from 'hono';

import type { CalendarServiceImpl } from '../../core/calendar.service.js';
import { NotFoundError } from '../../core/errors.js';
import { createCalendarSchema, updateCalendarSchema } from '../../core/validation.js';
import type { AuthorizationGuard } from '../authorization.js';
import { validateRequest } from '../middleware/validator.js';

export function calendarRoutes(calendarService: CalendarServiceImpl, guard: AuthorizationGuard) {
    const app = new Hono();

    app.get('/:calendarId', guard('calendar', 'read', 'calendarId'), async (c) => {
        const calendarId = c.req.param('calendarId');
        const cal = await calendarService.getById(calendarId);
        if (!cal) throw new NotFoundError('Calendar', calendarId);
        return c.json(cal);
    });

    app.post(
        '/',
        guard('calendar', 'create'),
        validateRequest('json', createCalendarSchema),
        async (c) => {
            const body = c.req.valid('json');
            const cal = await calendarService.create(body);
            return c.json(cal, 201);
        },
    );

    // As with event routes, validate the authorized payload before the service's lookup.
    app.patch(
        '/:calendarId',
        guard('calendar', 'write', 'calendarId'),
        validateRequest('json', updateCalendarSchema),
        async (c) => {
            const calendarId = c.req.param('calendarId');
            const cal = await calendarService.update(calendarId, c.req.valid('json'));
            if (!cal) throw new NotFoundError('Calendar', calendarId);
            return c.json(cal);
        },
    );

    app.delete('/:calendarId', guard('calendar', 'delete', 'calendarId'), async (c) => {
        const calendarId = c.req.param('calendarId');
        const deleted = await calendarService.delete(calendarId);
        if (!deleted) throw new NotFoundError('Calendar', calendarId);
        return c.json({ ok: true });
    });

    return app;
}
