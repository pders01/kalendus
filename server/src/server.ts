/**
 * @jpahd/kalendus-server — server-side library barrel export.
 *
 * Consumers embedding the Hono app import from the package root:
 *   import { createApp, createDb, EventBus } from '@jpahd/kalendus-server';
 */

// HTTP
export { createApp } from './http/app.js';
export type { AppDeps } from './http/app.js';

// Database
export { createDb, createInMemoryDb } from './db/connection.js';
export type { Db } from './db/connection.js';

// Schema
export { calendars, events } from './db/schema.js';

// Core — event bus
export { EventBus } from './core/event-bus.js';
export type { EventBusCallback } from './core/event-bus.js';

// Core — types / DTOs
export type {
    ApiCalendar,
    CreateCalendarDto,
    UpdateCalendarDto,
    ApiDate,
    ApiTime,
    ApiCalendarEntry,
    CreateEventDto,
    UpdateEventDto,
    SseEventType,
    SseEvent,
    EventSummary,
    CalendarManifest,
    TelemetryPayload,
    CalendarService,
    EventService,
} from './core/types.js';

// Core — errors
export { NotFoundError, ValidationError } from './core/errors.js';

// Core — service implementations
export { CalendarServiceImpl } from './core/calendar.service.js';
export { EventServiceImpl } from './core/event.service.js';
export { SyncServiceImpl } from './core/sync.service.js';
export { TelemetryServiceImpl } from './core/telemetry.service.js';
