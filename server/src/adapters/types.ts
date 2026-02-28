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

/** Options for the API client */
export interface KalendusClientOptions {
    baseUrl: string;
    calendarId: string;
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
