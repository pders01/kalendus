import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { TelemetryServiceImpl } from '../../core/telemetry.service.js';
import { telemetrySchema } from '../middleware/validator.js';

export function telemetryRoutes(
    telemetryService: TelemetryServiceImpl,
) {
    const app = new Hono();

    app.post(
        '/:calendarId/telemetry',
        zValidator('json', telemetrySchema),
        async (c) => {
            const body = c.req.valid('json');
            // Fire-and-forget: don't await in production
            await telemetryService.record({
                ...body,
                calendarId: c.req.param('calendarId'),
            });
            return c.json({ ok: true }, 202);
        },
    );

    return app;
}
