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

// RequestInit is shared by DOM and Node fetch typings; their helper aliases are not.
type FetchCredentials = NonNullable<RequestInit['credentials']>;
type FetchHeaders = NonNullable<RequestInit['headers']>;

/** A separately authenticated stream. Return a fresh transport; emit events after setup. */
export type StreamFactory = (
    url: string,
    init: { withCredentials: boolean; credentials: FetchCredentials },
) => StreamTransport;

/** Transport health only. Connected means the server sent its named `connected` event. */
export type StreamState =
    | { readonly status: 'disconnected' }
    | { readonly status: 'connecting' }
    | { readonly status: 'connected' }
    | {
          readonly status: 'error';
          readonly phase: 'startup' | 'transport';
          readonly error: Error;
      };

/** Options for the API client. Native EventSource cannot attach arbitrary auth headers. */
export interface KalendusClientOptions {
    baseUrl: string;
    calendarId: string;
    fetch?: typeof globalThis.fetch;
    credentials?: FetchCredentials;
    headers?: FetchHeaders | (() => FetchHeaders | Promise<FetchHeaders>);
    /** Opt in per known legacy record; consulted only for exact 00:00–23:59 times. */
    isLegacyAllDay?: (entry: ApiCalendarEntry) => boolean;
    /** Required for SSE with header auth or `credentials: 'omit'`. Also required with a
     * custom fetch unless the cookie-safe native opt-in below is set. REST alone needs no factory.
     */
    streamFactory?: StreamFactory;
    /** Confirm that `/stream` can safely use native cookies and needs nothing the custom
     * REST fetch adds or changes (e.g. auth, URL or cookie policy). Does not override the
     * restrictions on `headers` or `credentials: 'omit'`. Never use for bearer-auth SSE.
     */
    allowNativeEventSourceWithCustomFetch?: true;
}
