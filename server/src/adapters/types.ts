/// <reference lib="dom" />

// HTTP DTOs have one source of truth. The adapter's rendered entry and state
// snapshot are separate contracts, not aliases for the wire format.
import type {
    ApiCalendarEntry,
    ApiDate as CalendarDate,
    ApiTime as CalendarTime,
    SseEventType,
} from '../core/types.js';

export type { ApiCalendarEntry, CalendarDate, CalendarTime, SseEventType };

export type {
    CalendarManifest,
    CreateEventDto as CreateEventPayload,
    EventSummary,
    UpdateEventDto as UpdateEventPayload,
} from '../core/types.js';

export interface CalendarTimeInterval {
    start: CalendarTime;
    end: CalendarTime;
}

export interface CalendarDateInterval {
    start: CalendarDate;
    end: CalendarDate;
}

export interface CalendarEntry {
    id: string;
    calendarId: string;
    /** Returned by the adapter; optional for legacy caller-constructed entries. */
    kind?: 'all-day' | 'timed';
    date: CalendarDateInterval;
    time: CalendarTimeInterval;
    heading: string;
    content: string;
    color: string;
    isContinuation: boolean;
}

export interface SyncMessage {
    type: SseEventType;
    data: ApiCalendarEntry | { id: string };
}

/** Public calendar-state-change detail; structurally matches root src/contracts.ts. */
export interface CalendarState {
    activeDate: CalendarDate;
    viewMode: 'day' | 'week' | 'month' | 'year';
    firstDayOfWeek: number;
    /** Half-open ISO civil dates, already accounting for responsive/week-start layout. */
    range: { start: string; end: string };
}

export interface StreamTransport {
    addEventListener(type: string, listener: (event: Event) => void): void;
    close(): void;
}

/** Options for the API client. Native EventSource cannot attach arbitrary auth headers. */
export interface KalendusClientOptions {
    baseUrl: string;
    calendarId: string;
    fetch?: typeof globalThis.fetch;
    credentials?: RequestCredentials;
    headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
    /** Supply an authenticated/reconnecting transport for bearer-token SSE. */
    streamFactory?: (
        url: string,
        init: { withCredentials: boolean; credentials: RequestCredentials },
    ) => StreamTransport;
}
