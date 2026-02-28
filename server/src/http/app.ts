import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { Db } from '../db/connection.js';
import { EventBus } from '../core/event-bus.js';
import { CalendarServiceImpl } from '../core/calendar.service.js';
import { EventServiceImpl } from '../core/event.service.js';
import { SyncServiceImpl } from '../core/sync.service.js';
import { TelemetryServiceImpl } from '../core/telemetry.service.js';
import { errorHandler } from './middleware/error-handler.js';
import { calendarRoutes } from './routes/calendars.js';
import { eventRoutes } from './routes/events.js';
import { streamRoutes } from './routes/stream.js';
import { telemetryRoutes } from './routes/telemetry.js';
import { manifestRoutes } from './routes/manifest.js';

export interface AppDeps {
    db: Db;
    eventBus?: EventBus;
    enableLogger?: boolean;
}

export function createApp(deps: AppDeps) {
    const { db, eventBus = new EventBus(), enableLogger = true } = deps;

    const app = new Hono();

    // Global middleware
    app.use('*', cors());
    if (enableLogger) {
        app.use('*', logger());
    }

    // Services
    const calendarService = new CalendarServiceImpl(db);
    const eventService = new EventServiceImpl(db);
    const syncService = new SyncServiceImpl(eventBus);
    const telemetryService = new TelemetryServiceImpl();

    // Routes — all under /api/calendars
    app.route('/api/calendars', calendarRoutes(calendarService));
    app.route('/api/calendars', eventRoutes(eventService, syncService));
    app.route('/api/calendars', streamRoutes(syncService));
    app.route('/api/calendars', telemetryRoutes(telemetryService));
    app.route('/api/calendars', manifestRoutes(calendarService));

    // Error handler
    app.onError(errorHandler);

    // Health check
    app.get('/health', (c) => c.json({ status: 'ok' }));

    return { app, calendarService, eventService, syncService, telemetryService, eventBus };
}
