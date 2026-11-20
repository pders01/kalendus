/// <reference lib="dom" />

import { KalendusApiClient, KalendusHttpError } from './kalendus-api-client.js';
import type { CalendarEntry, CalendarState, KalendusClientOptions, StreamState } from './types.js';

interface ReactiveControllerHost {
    addController(controller: ReactiveController): void;
    requestUpdate(): void;
    renderRoot?: ParentNode | null;
    querySelector?(selector: string): Element | null;
}
interface ReactiveController {
    hostConnected?(): void;
    hostUpdated?(): void;
    hostDisconnected?(): void;
}

/** Only public calendar properties are read; no private controller/shadow-child knowledge. */
export interface CalendarTarget extends EventTarget {
    readonly activeDate: CalendarState['activeDate'];
    readonly viewMode: CalendarState['viewMode'];
    readonly firstDayOfWeek: number;
    readonly visibleRange: CalendarState['range'];
}

export interface KalendusLitAdapterOptions extends KalendusClientOptions {
    enableSync?: boolean;
    enableTelemetry?: boolean;
    /** For multiple calendars, slotted targets, or a target outside the host.
     * A resolver is checked on connection and after host updates; return null to release the target.
     */
    target?: CalendarTarget | (() => CalendarTarget | null);
    /** Standalone seed on connection when neither a target nor a query is present.
     * Acquiring a target takes over; losing it does not replay this snapshot.
     */
    initialState?: CalendarState;
}

function isIsoDate(value: unknown): value is string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function isState(value: unknown): value is CalendarState {
    if (!value || typeof value !== 'object') return false;
    const state = value as CalendarState;
    const date = state.activeDate;
    return (
        !!date &&
        Number.isInteger(date.year) &&
        date.year >= 1 &&
        date.year <= 9999 &&
        Number.isInteger(date.month) &&
        Number.isInteger(date.day) &&
        isIsoDate(
            `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`,
        ) &&
        ['day', 'week', 'month', 'year'].includes(state.viewMode) &&
        Number.isInteger(state.firstDayOfWeek) &&
        state.firstDayOfWeek >= 0 &&
        state.firstDayOfWeek <= 6 &&
        !!state.range &&
        isIsoDate(state.range.start) &&
        (isIsoDate(state.range.end) || state.range.end === '10000-01-01') &&
        (state.range.end === '10000-01-01' || state.range.start < state.range.end)
    );
}
// Mirror the wire domain here without importing the server's runtime validators.
const wireStart = '1970-01-01';
const wireEndExclusive = '2101-01-01';

function inclusiveEnd(endExclusive: string): string {
    const end = new Date(`${endExclusive}T00:00:00Z`);
    end.setUTCDate(end.getUTCDate() - 1);
    return end.toISOString().slice(0, 10);
}

interface RangeRequest {
    readonly start: string;
    readonly end: string;
    readonly controller: AbortController;
    readonly pending: Promise<void>;
    loading: boolean;
    dirty: boolean;
}

/** Consumes calendar-state-change after committed render, including the initial state. */
export class KalendusLitAdapter implements ReactiveController {
    private _client: KalendusApiClient;
    private _entries: CalendarEntry[] = [];
    private _error: Error | null = null;
    // Undefined before discovery (host events can seed); null after losing a known target.
    private _target?: CalendarTarget | null;
    private _connected = false;
    private _unsubInvalidate?: () => void;
    private _unsubReconcile?: () => void;
    private _unsubStreamState?: () => void;
    private _range?: RangeRequest;
    private _queuedRefresh?: RangeRequest;
    private _visibleKey = '';
    private _hasCommittedState = false;
    private _manual = false;

    constructor(
        private _host: ReactiveControllerHost,
        private options: KalendusLitAdapterOptions,
    ) {
        this._client = new KalendusApiClient(options);
        _host.addController(this);
    }

    get entries(): CalendarEntry[] {
        return this._entries;
    }
    get loading(): boolean {
        return this._range?.loading ?? false;
    }
    /** Error from the current REST range load, not the stream. */
    get error(): Error | null {
        return this._error;
    }
    get streamState(): StreamState {
        return this._client.streamState;
    }
    get client(): KalendusApiClient {
        return this._client;
    }

    private _onState = (event: Event): void => {
        if (this._target) {
            // Consume at the target only, not again as the event bubbles to the host.
            if (event.currentTarget !== this._target || event.composedPath()[0] !== this._target)
                return;
        } else if (this._target === null || this.options.target) return;
        this.setState((event as CustomEvent).detail);
    };

    hostConnected(): void {
        if (this._connected) return;
        this._connected = true;
        (this._host as unknown as EventTarget).addEventListener?.(
            'calendar-state-change',
            this._onState,
        );
        this.hostUpdated();
        if (!this._connected) return;
        if (
            this._target === undefined &&
            !this._range &&
            !this._visibleKey &&
            this.options.initialState
        )
            this._applyState(this.options.initialState);
        if (!this._connected) return;
        this._unsubStreamState = this._client.onStreamStateChange(() => this._host.requestUpdate());
        if (this.options.enableSync) {
            this._unsubInvalidate = this._client.onInvalidate(this._queueSyncRefresh);
            this._unsubReconcile = this._client.onReconcile(this._queueSyncRefresh);
            try {
                this._client.connect();
            } catch {
                /* Startup failure is already reflected in streamState; REST stays independent. */
            }
        }
    }

    /** Lit calls this after every host render, including when an existing child first appears. */
    hostUpdated(): void {
        if (!this._connected) return;
        const explicit = this.options.target;
        const target =
            (typeof explicit === 'function' ? explicit() : explicit) ??
            (explicit
                ? null
                : (this._host.renderRoot?.querySelector('lms-calendar') ??
                  this._host.querySelector?.('lms-calendar'))) ??
            null;
        if (target !== this._target && (target || this._target)) {
            this._target?.removeEventListener('calendar-state-change', this._onState);
            this._target = target as CalendarTarget | null;
            this._target?.addEventListener('calendar-state-change', this._onState);
            this._hasCommittedState = false;
            this._visibleKey = '';
            this._manual = false;
            this._clearRange();
        }
        // Before the first valid commit, the public getters can provisionally seed a
        // late/older target. Never let a provisional read displace an explicit query.
        if (this._target && !this._hasCommittedState && !this._manual)
            this._applyState({
                activeDate: this._target.activeDate,
                viewMode: this._target.viewMode,
                firstDayOfWeek: this._target.firstDayOfWeek,
                range: this._target.visibleRange,
            });
    }

    hostDisconnected(): void {
        this._connected = false;
        (this._host as unknown as EventTarget).removeEventListener?.(
            'calendar-state-change',
            this._onState,
        );
        this._target?.removeEventListener('calendar-state-change', this._onState);
        this._target = undefined;
        this._unsubInvalidate?.();
        this._unsubReconcile?.();
        this._unsubStreamState?.();
        this._client.disconnect();
        this._hasCommittedState = false;
        this._visibleKey = '';
        this._manual = false;
        this._clearRange();
    }

    private _clearRange(): void {
        const previous = this._range;
        const changed = previous || this._entries.length || this._error;
        this._range = undefined;
        this._entries = [];
        this._error = null;
        if (previous?.loading) previous.controller.abort();
        if (changed && this._connected) this._host.requestUpdate();
    }

    /** Supply a committed public snapshot (e.g. when forwarding the canonical event). */
    setState(state: unknown): void {
        this._applyState(state, true);
    }

    private _applyState(state: unknown, committed = false): void {
        if (!isState(state)) return;
        if (committed) this._hasCommittedState = true;
        const { range } = state;
        const visibleKey = `${range.start}/${range.end}`;
        if (this._visibleKey === visibleKey) return;
        this._visibleKey = visibleKey;
        this._manual = false;
        const start = range.start < wireStart ? wireStart : range.start;
        const endExclusive =
            range.end === '10000-01-01' || range.end > wireEndExclusive
                ? wireEndExclusive
                : range.end;
        if (start < endExclusive) {
            void this._readRange(start, inclusiveEnd(endExclusive));
        } else {
            // A wholly out-of-domain view is empty, not an invalid wire query.
            this._clearRange();
        }
        if (this.options.enableTelemetry)
            void this._client.sendTelemetry('navigation', {
                activeDate: state.activeDate,
                viewMode: state.viewMode,
                firstDayOfWeek: state.firstDayOfWeek,
            });
    }

    /** Inclusive, unclipped manual query. Identical bounds dedupe unless forced.
     * The query stands until the next committed visible range change or target lifecycle boundary.
     */
    fetchRange(start: string, end: string, force = false): Promise<void> {
        if (!isIsoDate(start) || !isIsoDate(end) || start > end)
            return Promise.reject(new Error('Invalid date range'));
        this._manual = true;
        return this._readRange(start, end, force);
    }

    private _readRange(start: string, end: string, force = false): Promise<void> {
        const previous = this._range;
        if (!force && previous?.start === start && previous.end === end) return previous.pending;

        // Publish the complete request before abort handlers or custom fetch can reenter.
        let finish!: (result?: PromiseLike<void>) => void;
        const request: RangeRequest = {
            start,
            end,
            controller: new AbortController(),
            pending: new Promise((resolve) => {
                finish = resolve;
            }),
            loading: true,
            dirty: false,
        };
        this._range = request;
        this._error = null;
        if (previous?.loading) previous.controller.abort();
        if (this._range === request) {
            finish(this._loadRange(request));
            if (this._range === request) this._host.requestUpdate();
        } else finish();
        return request.pending;
    }

    private async _loadRange(request: RangeRequest): Promise<void> {
        const { start, end, controller } = request;
        try {
            while (this._range === request) {
                request.dirty = false;
                try {
                    const entries = await this._client.fetchEvents(start, end, controller.signal);
                    if (this._range !== request) return;
                    this._entries = entries;
                    this._error = null;
                } catch (error) {
                    // Even transports ignoring AbortSignal cannot publish stale failures.
                    if (this._range !== request) return;
                    // A missing or no longer authorized calendar must not leave stale entries on screen.
                    if (
                        error instanceof KalendusHttpError &&
                        [401, 403, 404, 410].includes(error.status)
                    )
                        this._entries = [];
                    this._error = error instanceof Error ? error : new Error(String(error));
                }
                if (!request.dirty) return;
                // Publish this result instead of starving the UI during sustained invalidations.
                this._host.requestUpdate();
            }
        } finally {
            request.loading = false;
            if (this._range === request) this._host.requestUpdate();
        }
    }

    private _queueSyncRefresh = (): void => {
        const request = this._range;
        if (!this._connected || !request) return;
        // Mark a running read dirty before it can settle; it owns its trailing refresh.
        if (request.loading) {
            request.dirty = true;
            return;
        }
        if (this._queuedRefresh === request) return;
        this._queuedRefresh = request;
        queueMicrotask(() => {
            if (this._queuedRefresh === request) this._queuedRefresh = undefined;
            if (this._connected && this._range === request) void this.refresh();
        });
    };

    /** Refetch the current range immediately, aborting any existing read. */
    refresh(): Promise<void> {
        const request = this._range;
        return request ? this._readRange(request.start, request.end, true) : Promise.resolve();
    }
}
