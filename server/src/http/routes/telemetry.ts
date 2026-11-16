import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { ValidationError } from '../../core/errors.js';
import type { TelemetryServiceImpl } from '../../core/telemetry.service.js';
import { telemetrySchema } from '../middleware/validator.js';

export function telemetryRoutes(telemetryService: TelemetryServiceImpl) {
    const app = new Hono();

    app.post('/:calendarId/telemetry', zValidator('json', telemetrySchema), async (c) => {
        const body = c.req.valid('json');
        if (body.calendarId !== c.req.param('calendarId'))
            throw new ValidationError('Calendar ID does not match route');
        await telemetryService.record({
            ...body,
            calendarId: c.req.param('calendarId'),
        });
        return c.json({ ok: true }, 202);
    });

    return app;
}
