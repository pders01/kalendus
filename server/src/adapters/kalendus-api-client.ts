/// <reference lib="dom" />

import type {
    ApiCalendarEntry,
    CalendarEntry,
    CalendarManifest,
    CreateEventPayload,
    EventSummary,
    KalendusClientOptions,
    StreamTransport,
    SyncMessage,
    UpdateEventPayload,
} from './types.js';

/** Each mapping owns its nested values, including the legacy all-day sentinel. */
export function toCalendarEntry(api: ApiCalendarEntry): CalendarEntry {
    return {
        id: api.id,
        calendarId: api.calendarId,
        // Non-null server times are one floating interval, not legacy daily windows.
        kind: api.time ? 'timed' : 'all-day',
        date: { start: { ...api.date.start }, end: { ...api.date.end } },
        time: api.time
            ? { start: { ...api.time.start }, end: { ...api.time.end } }
            : {
                  start: { hour: 0, minute: 0 },
                  end: { hour: 23, minute: 59 },
              },
        heading: api.heading,
        content: api.content ?? '',
        color: api.color,
        isContinuation: false,
    };
}

function notify<Args extends unknown[]>(
    callbacks: ReadonlySet<(...args: Args) => void>,
    ...args: Args
) {
    for (const callback of [...callbacks]) {
        try {
            callback(...args);
        } catch {
            /* isolate consumers */
        }
    }
}

/** Authenticated fetch plus an injectable SSE transport; safe to import without a DOM. */
export class KalendusApiClient {
    private readonly _baseUrl: string;
    private _eventSource: StreamTransport | null = null;
    private _syncCallbacks = new Set<(msg: SyncMessage) => void>();
    private _invalidateCallbacks = new Set<() => void>();
    private _reconcileCallbacks = new Set<() => void>();

    constructor(private options: KalendusClientOptions) {
        this._baseUrl = options.baseUrl.replace(/\/$/, '');
    }

    get calendarId(): string {
        return this.options.calendarId;
    }

    private url(path: string): string {
        return `${this._baseUrl}/api/calendars/${encodeURIComponent(this.calendarId)}${path}`;
    }

    private range(start: string, end: string): string {
        return new URLSearchParams({ start, end }).toString();
    }

    private async request(path: string, init: RequestInit = {}): Promise<Response> {
        const configured =
            typeof this.options.headers === 'function'
                ? await this.options.headers()
                : this.options.headers;
        const headers = new Headers(configured);
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
        const res = await (this.options.fetch ?? globalThis.fetch)(this.url(path), {
            ...init,
            headers,
            credentials: this.options.credentials ?? 'same-origin',
        });
        if (!res.ok)
            throw new Error(
                `Kalendus ${init.method ?? 'GET'} ${path.split('?')[0]} failed: ${res.status}`,
            );
        return res;
    }

    async fetchEvents(start: string, end: string, signal?: AbortSignal): Promise<CalendarEntry[]> {
        return (await this.fetchRawEvents(start, end, signal)).map(toCalendarEntry);
    }

    async fetchRawEvents(
        start: string,
        end: string,
        signal?: AbortSignal,
    ): Promise<ApiCalendarEntry[]> {
        return (await (
            await this.request(`/events?${this.range(start, end)}`, { signal })
        ).json()) as ApiCalendarEntry[];
    }

    async fetchSummary(start: string, end: string, signal?: AbortSignal): Promise<EventSummary> {
        return (await (
            await this.request(`/events/summary?${this.range(start, end)}`, { signal })
        ).json()) as EventSummary;
    }

    async createEvent(payload: CreateEventPayload): Promise<ApiCalendarEntry> {
        return (await (
            await this.request('/events', this.json('POST', payload))
        ).json()) as ApiCalendarEntry;
    }

    async updateEvent(eventId: string, payload: UpdateEventPayload): Promise<ApiCalendarEntry> {
        return (await (
            await this.request(
                `/events/${encodeURIComponent(eventId)}`,
                this.json('PATCH', payload),
            )
        ).json()) as ApiCalendarEntry;
    }

    async deleteEvent(eventId: string): Promise<void> {
        await this.request(`/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
    }

    async fetchManifest(): Promise<CalendarManifest> {
        return (await (await this.request('/manifest')).json()) as CalendarManifest;
    }

    private json(method: string, payload: unknown): RequestInit {
        return {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        };
    }

    async sendTelemetry(action: string, metadata?: Record<string, unknown>): Promise<void> {
        try {
            await this.request(
                '/telemetry',
                this.json('POST', { action, calendarId: this.calendarId, metadata }),
            );
        } catch {
            /* best effort; never break navigation */
        }
    }

    /** Open a reconnecting transport. For header auth, a custom streamFactory is mandatory. */
    connect(): void {
        if (this._eventSource) return;
        const factory =
            this.options.streamFactory ??
            ((url, init) => {
                if (typeof EventSource === 'undefined')
                    throw new Error('SSE requires EventSource or streamFactory');
                if (this.options.headers)
                    throw new Error(
                        'Header-auth SSE requires streamFactory; native EventSource cannot send headers',
                    );
                if (this.options.credentials === 'omit')
                    throw new Error(
                        'SSE credentials: omit requires streamFactory; native EventSource sends same-origin cookies',
                    );
                return new EventSource(url, { withCredentials: init.withCredentials });
            });
        const source = factory(this.url('/stream'), {
            withCredentials: this.options.credentials === 'include',
            credentials: this.options.credentials ?? 'same-origin',
        });
        this._eventSource = source;
        const invalidate = () => {
            if (this._eventSource === source) notify(this._invalidateCallbacks);
        };
        source.addEventListener('invalidated', invalidate);
        source.addEventListener('connected', () => {
            // Includes initial connect and every reconnect: missed messages have no replay log.
            if (this._eventSource === source) notify(this._reconcileCallbacks);
        });
        for (const type of ['created', 'updated', 'deleted'] as const) {
            source.addEventListener(type, (event) => {
                if (this._eventSource !== source) return;
                let data: SyncMessage['data'];
                try {
                    data = JSON.parse((event as MessageEvent).data) as SyncMessage['data'];
                } catch {
                    return;
                }
                if (!data || typeof data.id !== 'string') return;
                notify(this._syncCallbacks, { type, data });
                // Current clients can refresh against both old and new servers.
                invalidate();
            });
        }
    }

    disconnect(): void {
        const source = this._eventSource;
        this._eventSource = null;
        source?.close();
    }

    /** Compatibility: only record-bearing mutation events, never default invalidations. */
    onSync(callback: (msg: SyncMessage) => void): () => void {
        this._syncCallbacks.add(callback);
        return () => {
            this._syncCallbacks.delete(callback);
        };
    }
    /** Refresh for either a default invalidation or a legacy mutation message. */
    onInvalidate(callback: () => void): () => void {
        this._invalidateCallbacks.add(callback);
        return () => {
            this._invalidateCallbacks.delete(callback);
        };
    }

    onReconcile(callback: () => void): () => void {
        this._reconcileCallbacks.add(callback);
        return () => {
            this._reconcileCallbacks.delete(callback);
        };
    }
}
