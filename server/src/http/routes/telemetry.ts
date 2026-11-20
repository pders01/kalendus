import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';

import type { CalendarServiceImpl } from '../../core/calendar.service.js';
import { ValidationError } from '../../core/errors.js';
import type { TelemetryServiceImpl } from '../../core/telemetry.service.js';
import { telemetrySchema } from '../../core/validation.js';
import type { AuthorizationGuard } from '../authorization.js';
import { RateLimiter } from '../middleware/rate-limit.js';
import { validateRequest } from '../middleware/validator.js';
import { requireCalendar } from '../require-calendar.js';

export interface TelemetryRateOptions {
    limit?: number;
    windowMs?: number;
    capacity?: number;
}

export function telemetryRoutes(
    telemetryService: TelemetryServiceImpl,
    calendarService: CalendarServiceImpl,
    guard: AuthorizationGuard,
    { limit, windowMs, capacity }: TelemetryRateOptions = {},
) {
    const app = new Hono();
    const rate = new RateLimiter(limit, windowMs, capacity);
    const globalRate = new RateLimiter((limit ?? 60) * 10, windowMs, 1);
    const checkParentAndQuota = createMiddleware(async (c, next) => {
        const calendarId = c.req.param('calendarId')!;
        await requireCalendar(calendarService, calendarId);
        if (!globalRate.allow('global') || !rate.allow(calendarId)) {
            return c.json({ error: 'Telemetry rate exceeded' }, 429, {
                'Retry-After': String(Math.ceil(rate.windowMs / 1000)),
            });
        }
        return next();
    });

    app.post(
        '/:calendarId/telemetry',
        guard('telemetry', 'telemetry', 'calendarId'),
        checkParentAndQuota,
        validateRequest('json', telemetrySchema),
        async (c) => {
            const body = c.req.valid('json');
            const calendarId = c.req.param('calendarId');
            if (body.calendarId !== calendarId)
                throw new ValidationError('Calendar ID does not match route');
            await telemetryService.record({ ...body, calendarId });
            return c.json({ ok: true }, 202);
        },
    );

    return app;
}
