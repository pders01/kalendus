import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import { CalendarServiceImpl } from '../core/calendar.service.js';
import { NotFoundError } from '../core/errors.js';
import { EventBus } from '../core/event-bus.js';
import { EventServiceImpl } from '../core/event.service.js';
import { SyncServiceImpl } from '../core/sync.service.js';
import type { TelemetryOptions } from '../core/telemetry.service.js';
import { TelemetryServiceImpl } from '../core/telemetry.service.js';
import { idSchema, validate } from '../core/validation.js';
import type { Db } from '../db/connection.js';
import type {
    AuthorizationPolicy,
    AuthorizationRequest,
    StreamDetailsPolicy,
} from './authorization.js';
import { boundedBody } from './middleware/body-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { RateLimiter } from './middleware/rate-limit.js';
import { calendarRoutes } from './routes/calendars.js';
import { eventRoutes } from './routes/events.js';
import { manifestRoutes } from './routes/manifest.js';
import { streamRoutes } from './routes/stream.js';
import { telemetryRoutes } from './routes/telemetry.js';

export interface AppDeps {
    db: Db;
    eventBus?: EventBus;
    enableLogger?: boolean;
    /** Private is the default and denies all API access without authorize. */
    mode?: 'private' | 'public';
    authorize?: AuthorizationPolicy;
    /** Optional extra grant for full-calendar event details. Streams otherwise send only invalidations. */
    authorizeStreamDetails?: StreamDetailsPolicy;
    /** Exact browser origins, never '*'. Empty by default; same-origin remains supported. */
    allowedOrigins?: string[];
    allowCredentials?: boolean;
    maxBodyBytes?: number;
    telemetry?: TelemetryOptions;
    telemetryRate?: { limit?: number; windowMs?: number; capacity?: number };
}

export function createApp(deps: AppDeps) {
    const { db, eventBus = new EventBus(), enableLogger = false } = deps;

    const app = new Hono();

    const origins = new Set(deps.allowedOrigins ?? []);
    for (const origin of origins) {
        if (new URL(origin).origin !== origin || origin === 'null')
            throw new Error('CORS requires exact HTTP(S) origins');
        if (!/^https?:/.test(origin)) throw new Error('CORS requires HTTP(S) origins');
    }
    app.use(
        '*',
        cors({
            origin: (origin) => (origins.has(origin) ? origin : undefined),
            credentials: deps.allowCredentials ?? false,
            allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
            allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        }),
    );
    if (enableLogger) app.use('*', logger());
    app.use('*', boundedBody(deps.maxBodyBytes));

    // Services
    const calendarService = new CalendarServiceImpl(db);
    const eventService = new EventServiceImpl(db);
    const syncService = new SyncServiceImpl(eventBus);
    const telemetryService = new TelemetryServiceImpl(deps.telemetry);
    const rate = new RateLimiter(
        deps.telemetryRate?.limit,
        deps.telemetryRate?.windowMs,
        deps.telemetryRate?.capacity,
    );
    const globalRate = new RateLimiter(
        (deps.telemetryRate?.limit ?? 60) * 10,
        deps.telemetryRate?.windowMs,
        1,
    );

    app.use('/api/calendars/*', async (c, next) => {
        c.header('Cache-Control', 'no-store');
        c.header('X-Content-Type-Options', 'nosniff');
        const origin = c.req.header('Origin');
        if (origin && origin !== new URL(c.req.url).origin && !origins.has(origin)) {
            throw new HTTPException(403, { message: 'Origin not allowed' });
        }
        // The app may be embedded below a tenant/base-path prefix. IDs cannot
        // contain '/', so the last literal API boundary is unambiguous for valid routes.
        const boundary = '/api/calendars';
        const suffix = c.req.path.slice(c.req.path.lastIndexOf(boundary) + boundary.length);
        const parts = suffix.split('/').filter(Boolean);
        const [calendarId, subresource, eventId] = parts;
        if (calendarId) validate(idSchema, calendarId);
        if (eventId) validate(idSchema, eventId);
        const resource: AuthorizationRequest['resource'] =
            subresource === 'events'
                ? 'event'
                : subresource === 'stream'
                  ? 'stream'
                  : subresource === 'telemetry'
                    ? 'telemetry'
                    : subresource === 'manifest'
                      ? 'manifest'
                      : 'calendar';
        const action: AuthorizationRequest['action'] =
            resource === 'stream'
                ? 'stream'
                : resource === 'telemetry'
                  ? 'telemetry'
                  : c.req.method === 'GET'
                    ? 'read'
                    : c.req.method === 'DELETE'
                      ? 'delete'
                      : c.req.method === 'POST'
                        ? 'create'
                        : 'write';
        const granted = deps.authorize
            ? await deps.authorize({
                  request: c.req.raw,
                  action,
                  resource,
                  calendarId,
                  eventId:
                      resource === 'event' && !(eventId === 'summary' && c.req.method === 'GET')
                          ? eventId
                          : undefined,
              })
            : deps.mode === 'public';
        if (granted !== true) throw new HTTPException(403, { message: 'Access denied' });
        if (calendarId && !(await calendarService.getById(calendarId)))
            throw new NotFoundError('Calendar', calendarId);
        if (resource === 'telemetry' && (!globalRate.allow('global') || !rate.allow(calendarId!))) {
            return c.json({ error: 'Telemetry rate exceeded' }, 429, {
                'Retry-After': String(Math.ceil(rate.windowMs / 1000)),
            });
        }
        await next();
        return;
    });

    // Routes — all under /api/calendars
    app.route('/api/calendars', calendarRoutes(calendarService));
    app.route('/api/calendars', eventRoutes(eventService, syncService));
    app.route('/api/calendars', streamRoutes(syncService, deps.authorizeStreamDetails));
    app.route('/api/calendars', telemetryRoutes(telemetryService));
    app.route('/api/calendars', manifestRoutes(calendarService));

    // Error handler
    app.onError(errorHandler);

    // Health check
    app.get('/health', (c) => c.json({ status: 'ok' }));

    return { app, calendarService, eventService, syncService, telemetryService, eventBus };
}
