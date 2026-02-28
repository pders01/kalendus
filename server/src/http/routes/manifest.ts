import { Hono } from 'hono';
import type { CalendarServiceImpl } from '../../core/calendar.service.js';
import { NotFoundError } from '../../core/errors.js';

export function manifestRoutes(
    calendarService: CalendarServiceImpl,
) {
    const app = new Hono();

    app.get('/:calendarId/manifest', async (c) => {
        const manifest = await calendarService.getManifest(
            c.req.param('calendarId'),
        );
        if (!manifest)
            throw new NotFoundError(
                'Calendar',
                c.req.param('calendarId'),
            );
        return c.json(manifest);
    });

    return app;
}
