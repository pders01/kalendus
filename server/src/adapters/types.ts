/// <reference lib="dom" />

/**
 * Client-side types that mirror the component's global types.
 * These are used by the adapters to produce the correct shape.
 */

export interface CalendarDate {
    day: number;
    month: number;
    year: number;
}

export interface CalendarTime {
    hour: number;
    minute: number;
}

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
    date: CalendarDateInterval;
    time: CalendarTimeInterval;
    heading: string;
    content: string;
    color: string;
    isContinuation: boolean;
}

export interface ApiCalendarEntry {
    id: string;
    calendarId: string;
    heading: string;
    content: string | null;
    color: string;
    date: {
        start: CalendarDate;
        end: CalendarDate;
    };
    time: {
        start: CalendarTime;
        end: CalendarTime;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CalendarManifest {
    id: string;
    name: string;
    locale: string;
    firstDayOfWeek: number;
    color: string;
    themeTokens: Record<string, string> | null;
}

export interface EventSummary {
    [date: string]: number;
}

/** SSE event types sent by the server */
export type SseEventType = 'created' | 'updated' | 'deleted';

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

/** Options for creating events via the API */
export interface CreateEventPayload {
    heading: string;
    content?: string;
    color?: string;
    date: {
        start: CalendarDate;
        end: CalendarDate;
    };
    time?: {
        start: CalendarTime;
        end: CalendarTime;
    };
}

export interface UpdateEventPayload {
    heading?: string;
    content?: string | null;
    color?: string;
    date?: {
        start: CalendarDate;
        end: CalendarDate;
    };
    time?: {
        start: CalendarTime;
        end: CalendarTime;
    } | null;
}
