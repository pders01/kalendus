/**
 * @jpahd/kalendus-server/adapters — barrel export for all client adapters.
 *
 * Browser-safe: does NOT pull in better-sqlite3 or any Node-only deps.
 */

// Vanilla fetch client
export { KalendusApiClient, toCalendarEntry } from './kalendus-api-client.js';

// Lit ReactiveController adapter
export { KalendusLitAdapter } from './kalendus-lit-adapter.js';
export type { KalendusLitAdapterOptions } from './kalendus-lit-adapter.js';

// Shared adapter types
export type {
    CalendarDate,
    CalendarTime,
    CalendarTimeInterval,
    CalendarDateInterval,
    CalendarEntry,
    ApiCalendarEntry,
    CalendarManifest,
    EventSummary,
    SseEventType,
    SyncMessage,
    KalendusClientOptions,
    CreateEventPayload,
    UpdateEventPayload,
} from './types.js';
