import { Hono } from 'hono';

import type { CalendarServiceImpl } from '../../core/calendar.service.js';
import { NotFoundError } from '../../core/errors.js';
import type { AuthorizationGuard } from '../authorization.js';

export function manifestRoutes(calendarService: CalendarServiceImpl, guard: AuthorizationGuard) {
    const app = new Hono();

    app.get('/:calendarId/manifest', guard('manifest', 'read', 'calendarId'), async (c) => {
        const calendarId = c.req.param('calendarId');
        const manifest = await calendarService.getManifest(calendarId);
        if (!manifest) throw new NotFoundError('Calendar', calendarId);
        return c.json(manifest);
    });

    return app;
}
