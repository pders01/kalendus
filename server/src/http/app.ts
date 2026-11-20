import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';

import { CalendarServiceImpl } from '../core/calendar.service.js';
import { EventBus } from '../core/event-bus.js';
import { EventServiceImpl } from '../core/event.service.js';
import { SyncServiceImpl } from '../core/sync.service.js';
import type { TelemetryOptions } from '../core/telemetry.service.js';
import { TelemetryServiceImpl } from '../core/telemetry.service.js';
import type { Db } from '../db/connection.js';
import {
    createAuthorizationGuard,
    type AuthorizationPolicy,
    type StreamDetailsPolicy,
} from './authorization.js';
import { boundedBody } from './middleware/body-limit.js';
import { errorHandler } from './middleware/error-handler.js';
import { calendarRoutes } from './routes/calendars.js';
import { eventRoutes } from './routes/events.js';
import { manifestRoutes } from './routes/manifest.js';
import { streamRoutes } from './routes/stream.js';
import { telemetryRoutes, type TelemetryRateOptions } from './routes/telemetry.js';

export interface AppDeps {
    db: Db;
    eventBus?: EventBus;
    /** Use the same owner object with a shared bus for multiple handles to one database. */
    eventBusScope?: object;
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
    telemetryRate?: TelemetryRateOptions;
}

export function createApp(deps: AppDeps) {
    const { db, enableLogger = false } = deps;
    const eventBus = deps.eventBus?.scopedTo(deps.eventBusScope ?? db) ?? new EventBus();
    const guard = createAuthorizationGuard(deps);
    const app = new Hono();

    const origins = new Set(deps.allowedOrigins ?? []);
    for (const origin of origins) {
        if (new URL(origin).origin !== origin || origin === 'null')
            throw new Error('CORS requires exact HTTP(S) origins');
        if (!/^https?:/.test(origin)) throw new Error('CORS requires HTTP(S) origins');
    }
    app.use('/api/calendars/*', async (c, next) => {
        c.header('Cache-Control', 'no-store');
        c.header('X-Content-Type-Options', 'nosniff');
        const origin = c.req.header('Origin');
        if (origin && origin !== new URL(c.req.url).origin && !origins.has(origin)) {
            throw new HTTPException(403, { message: 'Origin not allowed' });
        }
        await next();
        // Hono's SSE helper sets its own Cache-Control; this prefix must stay no-store.
        c.header('Cache-Control', 'no-store');
        c.header('X-Content-Type-Options', 'nosniff');
    });
    app.use(
        '*',
        cors({
            origin: (origin) => (origins.has(origin) ? origin : undefined),
            credentials: deps.allowCredentials ?? false,
            allowMethods: ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
            allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
        }),
    );
    if (enableLogger) app.use('*', logger());
    app.use('*', boundedBody(deps.maxBodyBytes));

    const syncService = new SyncServiceImpl(eventBus);
    const calendarService = new CalendarServiceImpl(db, (id) =>
        syncService.notifyCalendarRemoved(id),
    );
    const eventService = new EventServiceImpl(db, (event) => syncService.broadcast(event));
    const telemetryService = new TelemetryServiceImpl(deps.telemetry);

    app.route('/api/calendars', calendarRoutes(calendarService, guard));
    app.route('/api/calendars', eventRoutes(eventService, guard));
    app.route(
        '/api/calendars',
        streamRoutes(syncService, calendarService, guard, deps.authorizeStreamDetails),
    );
    app.route(
        '/api/calendars',
        telemetryRoutes(telemetryService, calendarService, guard, deps.telemetryRate),
    );
    app.route('/api/calendars', manifestRoutes(calendarService, guard));

    // Error handler
    app.onError(errorHandler);

    // Health check
    app.get('/health', (c) => c.json({ status: 'ok' }));

    return { app, calendarService, eventService, syncService, telemetryService, eventBus };
}
