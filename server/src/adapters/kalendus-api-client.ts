/// <reference lib="dom" />

import type {
    ApiCalendarEntry,
    CalendarEntry,
    CalendarManifest,
    CreateEventPayload,
    EventPage,
    EventPageOptions,
    EventSummary,
    KalendusClientOptions,
    StreamState,
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
    isCurrent: () => boolean,
    ...args: Args
) {
    for (const callback of [...callbacks]) {
        if (!isCurrent()) return;
        if (!callbacks.has(callback)) continue;
        try {
            callback(...args);
        } catch {
            /* isolate consumers */
        }
    }
}

function closeStream(source?: StreamTransport): void {
    try {
        source?.close();
    } catch {
        /* The transport is already detached; do not forward arbitrary transport errors. */
    }
}

export class KalendusHttpError extends Error {
    constructor(
        public readonly status: number,
        method: string,
        path: string,
    ) {
        super(`Kalendus ${method} ${path} failed: ${status}`);
        this.name = 'KalendusHttpError';
    }
}

/** Authenticated fetch plus an injectable SSE transport; safe to import without a DOM. */
export class KalendusApiClient {
    private readonly _baseUrl: string;
    private _connection?: { source?: StreamTransport };
    private _streamState: StreamState = { status: 'disconnected' };
    private _streamStateCallbacks = new Set<(state: StreamState) => void>();
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

    private range(start: string, end: string): URLSearchParams {
        return new URLSearchParams({ start, end });
    }

    private async request(path: string, init: RequestInit = {}): Promise<Response> {
        init.signal?.throwIfAborted();
        // A header provider can run arbitrary code or await a token refresh. Capture
        // this request's destination and transport before invoking it.
        const url = this.url(path);
        const fetch = this.options.fetch ?? globalThis.fetch;
        const credentials = this.options.credentials ?? 'same-origin';
        const configured =
            typeof this.options.headers === 'function'
                ? await this.options.headers()
                : this.options.headers;
        init.signal?.throwIfAborted();
        const headers = new Headers(configured);
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
        const res = await fetch(url, { ...init, headers, credentials });
        if (!res.ok)
            throw new KalendusHttpError(res.status, init.method ?? 'GET', path.split('?')[0]);
        return res;
    }

    async fetchEvents(start: string, end: string, signal?: AbortSignal): Promise<CalendarEntry[]> {
        return (await this.fetchRawEvents(start, end, signal)).map((api) => {
            const entry = toCalendarEntry(api);
            const time = api.time;
            if (
                time?.start.hour === 0 &&
                time.start.minute === 0 &&
                time.end.hour === 23 &&
                time.end.minute === 59 &&
                this.options.isLegacyAllDay?.(api) === true
            ) {
                entry.kind = 'all-day';
            }
            return entry;
        });
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

    /** Fetch exactly one raw page. Pass its nextCursor as `after` to continue. */
    async fetchRawEventPage(
        start: string,
        end: string,
        options: EventPageOptions = {},
        signal?: AbortSignal,
    ): Promise<EventPage> {
        const query = this.range(start, end);
        if (options.limit !== undefined) query.set('limit', String(options.limit));
        if (options.after !== undefined) query.set('after', options.after);
        return (await (
            await this.request(`/events/page?${query}`, { signal })
        ).json()) as EventPage;
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

    get streamState(): StreamState {
        return this._streamState;
    }

    private setStreamState(state: StreamState): void {
        if (state.status !== 'error' && this._streamState.status === state.status) return;
        this._streamState = state;
        notify(this._streamStateCallbacks, () => this._streamState === state, state);
    }

    private nativeStreamProblem(): string | undefined {
        if (this.options.headers !== undefined)
            return 'Header-auth SSE requires streamFactory; native EventSource cannot send headers';
        if (this.options.credentials === 'omit')
            return 'SSE credentials: omit requires streamFactory; native EventSource sends same-origin cookies';
        if (
            this.options.fetch !== undefined &&
            this.options.allowNativeEventSourceWithCustomFetch !== true
        )
            return 'SSE with custom fetch requires streamFactory (or allowNativeEventSourceWithCustomFetch for native cookie auth)';
        if (typeof EventSource === 'undefined') return 'SSE requires EventSource or streamFactory';
        return undefined;
    }

    /** Open a reconnecting transport. Synchronous startup failure also sets streamState. */
    connect(): void {
        if (this._connection) return;
        const connection: { source?: StreamTransport } = (this._connection = {});
        const isCurrent = () => this._connection === connection;
        this.setStreamState({ status: 'connecting' });
        if (!isCurrent()) return;

        let problem: string | undefined;
        try {
            const { streamFactory } = this.options;
            problem = streamFactory ? undefined : this.nativeStreamProblem();
            if (!problem) {
                const url = this.url('/stream');
                const credentials = this.options.credentials ?? 'same-origin';
                const withCredentials = credentials === 'include';
                const source = streamFactory
                    ? streamFactory(url, { withCredentials, credentials })
                    : new EventSource(url, { withCredentials });
                if (!isCurrent()) {
                    closeStream(source);
                    return;
                }
                connection.source = source;
                let attached = false;
                this.listenToStream(source, () => attached && isCurrent());
                attached = true;
                return;
            }
        } catch {
            /* Constructor/factory/listener errors may contain credentials or URLs. */
        }
        const error = new Error(problem ?? 'Could not start the SSE transport');
        if (isCurrent()) this.stopStream({ status: 'error', phase: 'startup', error });
        throw error;
    }

    private listenToStream(source: StreamTransport, isCurrent: () => boolean): void {
        const invalidate = () => notify(this._invalidateCallbacks, isCurrent);
        source.addEventListener('invalidated', invalidate);
        source.addEventListener('error', () => {
            if (!isCurrent() || this._streamState.status === 'error') return;
            this.setStreamState({
                status: 'error',
                phase: 'transport',
                error: new Error('SSE transport is unavailable'),
            });
        });
        source.addEventListener('connected', () => {
            if (!isCurrent()) return;
            this.setStreamState({ status: 'connected' });
            // Includes initial connect and every reconnect: missed messages have no replay log.
            notify(this._reconcileCallbacks, isCurrent);
        });
        for (const type of ['created', 'updated', 'deleted'] as const) {
            source.addEventListener(type, (event) => {
                if (!isCurrent()) return;
                let data: SyncMessage['data'];
                try {
                    data = JSON.parse((event as MessageEvent).data) as SyncMessage['data'];
                } catch {
                    return;
                }
                if (!data || typeof data.id !== 'string') return;
                notify(this._syncCallbacks, isCurrent, { type, data });
                // Current clients can refresh against both old and new servers.
                invalidate();
            });
        }
    }

    private stopStream(state: StreamState): void {
        const connection = this._connection;
        const previous = this._streamState;
        this._connection = undefined;
        closeStream(connection?.source);
        if (!this._connection && this._streamState === previous) this.setStreamState(state);
    }

    disconnect(): void {
        this.stopStream({ status: 'disconnected' });
    }

    /** Subscribe to transitions; read streamState for the current snapshot. */
    onStreamStateChange(callback: (state: StreamState) => void): () => void {
        this._streamStateCallbacks.add(callback);
        return () => {
            this._streamStateCallbacks.delete(callback);
        };
    }

    /** Legacy mutation messages with a string ID, never default invalidations. Does not validate DTO fields. */
    onSync(callback: (msg: SyncMessage) => void): () => void {
        this._syncCallbacks.add(callback);
        return () => {
            this._syncCallbacks.delete(callback);
        };
    }
    /** Refresh for a default invalidation or a decodable legacy mutation message with an ID. */
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
