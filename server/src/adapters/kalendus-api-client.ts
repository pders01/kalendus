/// <reference lib="dom" />

import type {
    ApiCalendarEntry,
    CalendarEntry,
    CalendarManifest,
    CreateEventPayload,
    EventSummary,
    KalendusClientOptions,
    SyncMessage,
    UpdateEventPayload,
} from './types.js';

const ALL_DAY_TIME = {
    start: { hour: 0, minute: 0 },
    end: { hour: 23, minute: 59 },
} as const;

/** Convert an API entry to the component's CalendarEntry shape */
export function toCalendarEntry(api: ApiCalendarEntry): CalendarEntry {
    return {
        date: api.date,
        time: api.time ?? ALL_DAY_TIME,
        heading: api.heading,
        content: api.content ?? '',
        color: api.color,
        isContinuation: false,
    };
}

/**
 * Vanilla fetch + EventSource wrapper for the Kalendus API.
 * Framework-agnostic — works in any browser or Node 18+ environment.
 */
export class KalendusApiClient {
    private _baseUrl: string;
    private _calendarId: string;
    private _eventSource: EventSource | null = null;
    private _syncCallbacks: Array<(msg: SyncMessage) => void> = [];

    constructor(options: KalendusClientOptions) {
        this._baseUrl = options.baseUrl.replace(/\/$/, '');
        this._calendarId = options.calendarId;
    }

    get calendarId(): string {
        return this._calendarId;
    }

    /** Fetch events for a date range, already mapped to CalendarEntry[] */
    async fetchEvents(
        start: string,
        end: string,
    ): Promise<CalendarEntry[]> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/events?start=${start}&end=${end}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetchEvents failed: ${res.status}`);
        const entries = (await res.json()) as ApiCalendarEntry[];
        return entries.map(toCalendarEntry);
    }

    /** Fetch raw API entries (with IDs, for mutation) */
    async fetchRawEvents(
        start: string,
        end: string,
    ): Promise<ApiCalendarEntry[]> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/events?start=${start}&end=${end}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetchRawEvents failed: ${res.status}`);
        return (await res.json()) as ApiCalendarEntry[];
    }

    /** Fetch per-day event counts */
    async fetchSummary(
        start: string,
        end: string,
    ): Promise<EventSummary> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/events/summary?start=${start}&end=${end}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetchSummary failed: ${res.status}`);
        return (await res.json()) as EventSummary;
    }

    async createEvent(
        payload: CreateEventPayload,
    ): Promise<ApiCalendarEntry> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/events`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`createEvent failed: ${res.status}`);
        return (await res.json()) as ApiCalendarEntry;
    }

    async updateEvent(
        eventId: string,
        payload: UpdateEventPayload,
    ): Promise<ApiCalendarEntry> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/events/${eventId}`;
        const res = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`updateEvent failed: ${res.status}`);
        return (await res.json()) as ApiCalendarEntry;
    }

    async deleteEvent(eventId: string): Promise<void> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/events/${eventId}`;
        const res = await fetch(url, { method: 'DELETE' });
        if (!res.ok) throw new Error(`deleteEvent failed: ${res.status}`);
    }

    async fetchManifest(): Promise<CalendarManifest> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/manifest`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`fetchManifest failed: ${res.status}`);
        return (await res.json()) as CalendarManifest;
    }

    async sendTelemetry(
        action: string,
        metadata?: Record<string, unknown>,
    ): Promise<void> {
        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/telemetry`;
        // Fire-and-forget
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action,
                calendarId: this._calendarId,
                metadata,
            }),
        }).catch(() => {
            // Silently ignore telemetry failures
        });
    }

    /** Open SSE connection for real-time sync */
    connect(): void {
        if (this._eventSource) return;

        const url = `${this._baseUrl}/api/calendars/${this._calendarId}/stream`;
        this._eventSource = new EventSource(url);

        const handleEvent = (type: string) => (e: Event) => {
            const data = JSON.parse((e as MessageEvent).data);
            const msg: SyncMessage = {
                type: type as SyncMessage['type'],
                data,
            };
            for (const cb of this._syncCallbacks) {
                cb(msg);
            }
        };

        this._eventSource.addEventListener('created', handleEvent('created'));
        this._eventSource.addEventListener('updated', handleEvent('updated'));
        this._eventSource.addEventListener('deleted', handleEvent('deleted'));
    }

    /** Close SSE connection */
    disconnect(): void {
        this._eventSource?.close();
        this._eventSource = null;
    }

    /** Subscribe to SSE sync events. Returns unsubscribe function. */
    onSync(callback: (msg: SyncMessage) => void): () => void {
        this._syncCallbacks.push(callback);
        return () => {
            const idx = this._syncCallbacks.indexOf(callback);
            if (idx !== -1) this._syncCallbacks.splice(idx, 1);
        };
    }
}
