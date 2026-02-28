/** API-level calendar DTO */
export interface ApiCalendar {
    id: string;
    name: string;
    locale: string;
    firstDayOfWeek: number;
    color: string;
    themeTokens: Record<string, string> | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateCalendarDto {
    name: string;
    locale?: string;
    firstDayOfWeek?: number;
    color?: string;
    themeTokens?: Record<string, string>;
}

export interface UpdateCalendarDto {
    name?: string;
    locale?: string;
    firstDayOfWeek?: number;
    color?: string;
    themeTokens?: Record<string, string> | null;
}

/** API-level date with year/month/day */
export interface ApiDate {
    year: number;
    month: number;
    day: number;
}

/** API-level time with hour/minute */
export interface ApiTime {
    hour: number;
    minute: number;
}

/**
 * API-level calendar entry.
 * `time` is optional (null = all-day event).
 * `content` is optional (empty = no description).
 * `isContinuation` is NOT exposed — the component computes it.
 */
export interface ApiCalendarEntry {
    id: string;
    calendarId: string;
    heading: string;
    content: string | null;
    color: string;
    date: {
        start: ApiDate;
        end: ApiDate;
    };
    time: {
        start: ApiTime;
        end: ApiTime;
    } | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEventDto {
    heading: string;
    content?: string;
    color?: string;
    date: {
        start: ApiDate;
        end: ApiDate;
    };
    time?: {
        start: ApiTime;
        end: ApiTime;
    };
}

export interface UpdateEventDto {
    heading?: string;
    content?: string | null;
    color?: string;
    date?: {
        start: ApiDate;
        end: ApiDate;
    };
    time?: {
        start: ApiTime;
        end: ApiTime;
    } | null;
}

/** SSE event types */
export type SseEventType = 'created' | 'updated' | 'deleted';

export interface SseEvent {
    type: SseEventType;
    calendarId: string;
    event: ApiCalendarEntry | { id: string };
}

/** Event summary: date string → count */
export type EventSummary = Record<string, number>;

/** Calendar manifest (theme + locale metadata) */
export interface CalendarManifest {
    id: string;
    name: string;
    locale: string;
    firstDayOfWeek: number;
    color: string;
    themeTokens: Record<string, string> | null;
}

/** Telemetry payload */
export interface TelemetryPayload {
    action: string;
    calendarId: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
}

/** Service interfaces */
export interface CalendarService {
    getById(id: string): Promise<ApiCalendar | null>;
    create(dto: CreateCalendarDto): Promise<ApiCalendar>;
    update(id: string, dto: UpdateCalendarDto): Promise<ApiCalendar | null>;
    delete(id: string): Promise<boolean>;
    getManifest(id: string): Promise<CalendarManifest | null>;
}

export interface EventService {
    getByRange(
        calendarId: string,
        start: string,
        end: string,
    ): Promise<ApiCalendarEntry[]>;
    getSummary(
        calendarId: string,
        start: string,
        end: string,
    ): Promise<EventSummary>;
    create(
        calendarId: string,
        dto: CreateEventDto,
    ): Promise<ApiCalendarEntry>;
    update(
        calendarId: string,
        eventId: string,
        dto: UpdateEventDto,
    ): Promise<ApiCalendarEntry | null>;
    delete(calendarId: string, eventId: string): Promise<boolean>;
}
