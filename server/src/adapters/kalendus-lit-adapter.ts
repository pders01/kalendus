/// <reference lib="dom" />

import { KalendusApiClient, KalendusHttpError } from './kalendus-api-client.js';
import type { CalendarEntry, CalendarState, KalendusClientOptions } from './types.js';

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
    /** For multiple calendars, slotted targets, or a target outside the host. */
    target?: CalendarTarget | (() => CalendarTarget | null);
    /** For hosts without queryable DOM; later canonical events replace this snapshot. */
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

/** Consumes calendar-state-change after committed render, including the initial state. */
export class KalendusLitAdapter implements ReactiveController {
    private _client: KalendusApiClient;
    private _entries: CalendarEntry[] = [];
    private _loading = false;
    private _error: Error | null = null;
    private _syncError: Error | null = null;
    private _target: CalendarTarget | null = null;
    private _connected = false;
    private _unsubInvalidate?: () => void;
    private _unsubReconcile?: () => void;
    private _controller?: AbortController;
    private _generation = 0;
    private _currentStart = '';
    private _currentEnd = '';
    private _key = '';
    private _visibleKey = '';
    private _pending: Promise<void> = Promise.resolve();
    private _dirty = false;
    private _queuedGeneration?: number;

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
        return this._loading;
    }
    get error(): Error | null {
        return this._error ?? this._syncError;
    }
    get client(): KalendusApiClient {
        return this._client;
    }

    private _onState = (event: Event): void => {
        if (this._target ? event.composedPath()[0] !== this._target : this.options.target) return;
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
        if (!this._target && this.options.initialState) this.setState(this.options.initialState);
        if (this.options.enableSync) {
            this._unsubInvalidate = this._client.onInvalidate(this._queueSyncRefresh);
            this._unsubReconcile = this._client.onReconcile(() => {
                if (this._syncError) {
                    this._syncError = null;
                    this._host.requestUpdate();
                }
                this._queueSyncRefresh();
            });
            this._syncError = null;
            try {
                this._client.connect();
            } catch (error) {
                this._syncError = error instanceof Error ? error : new Error(String(error));
                this._host.requestUpdate();
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
        if (target !== this._target) {
            this._target?.removeEventListener('calendar-state-change', this._onState);
            this._target = target as CalendarTarget | null;
            this._target?.addEventListener('calendar-state-change', this._onState);
        }
        if (this._target)
            this.setState({
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
        this._target = null;
        this._unsubInvalidate?.();
        this._unsubReconcile?.();
        this._client.disconnect();
        this._visibleKey = '';
        this._resetRange();
    }

    private _resetRange(): void {
        this._generation++;
        this._controller?.abort();
        this._controller = undefined;
        this._dirty = false;
        this._key = '';
        this._currentStart = '';
        this._currentEnd = '';
        this._loading = false;
        this._pending = Promise.resolve();
    }

    /** Accept the public snapshot, never recalculate responsive ranges or week starts here. */
    setState(state: unknown): void {
        if (!isState(state)) return;
        const { range } = state;
        const visibleKey = `${range.start}/${range.end}`;
        const changed = this._visibleKey !== visibleKey;
        this._visibleKey = visibleKey;
        const start = range.start < wireStart ? wireStart : range.start;
        const endExclusive =
            range.end === '10000-01-01' || range.end > wireEndExclusive
                ? wireEndExclusive
                : range.end;
        if (start < endExclusive) {
            void this.fetchRange(start, inclusiveEnd(endExclusive));
        } else if (this._key || this._entries.length || this._error) {
            // A wholly out-of-domain view is empty, not an invalid wire query.
            this._resetRange();
            this._entries = [];
            this._error = null;
            this._host.requestUpdate();
        }
        if (changed && this.options.enableTelemetry)
            void this._client.sendTelemetry('navigation', {
                activeDate: state.activeDate,
                viewMode: state.viewMode,
                firstDayOfWeek: state.firstDayOfWeek,
            });
    }

    /** Legacy queries use inclusive ends. Identical ranges dedupe unless forced to replace. */
    fetchRange(start: string, end: string, force = false): Promise<void> {
        if (!isIsoDate(start) || !isIsoDate(end) || start > end)
            return Promise.reject(new Error('Invalid date range'));
        const key = `${start}/${end}`;
        if (!force && key === this._key) return this._pending;
        this._key = key;
        this._currentStart = start;
        this._currentEnd = end;
        const generation = ++this._generation;
        this._controller?.abort();
        const controller = (this._controller = new AbortController());
        this._dirty = false;
        this._loading = true;
        this._error = null;
        this._pending = this._loadRange(start, end, generation, controller.signal);
        this._host.requestUpdate();
        return this._pending;
    }

    private async _loadRange(start: string, end: string, generation: number, signal: AbortSignal) {
        try {
            while (generation === this._generation) {
                this._dirty = false;
                try {
                    const entries = await this._client.fetchEvents(start, end, signal);
                    if (generation !== this._generation) return;
                    this._entries = entries;
                    this._error = null;
                } catch (error) {
                    // Even transports ignoring AbortSignal cannot publish stale failures.
                    if (generation !== this._generation) return;
                    // A missing or no longer authorized calendar must not leave stale entries on screen.
                    if (
                        error instanceof KalendusHttpError &&
                        [401, 403, 404, 410].includes(error.status)
                    )
                        this._entries = [];
                    this._error = error instanceof Error ? error : new Error(String(error));
                }
                if (!this._dirty) return;
                // Publish this result instead of starving the UI during sustained invalidations.
                this._host.requestUpdate();
            }
        } finally {
            if (generation === this._generation) {
                this._controller = undefined;
                this._loading = false;
                this._host.requestUpdate();
            }
        }
    }

    private _queueSyncRefresh = (): void => {
        if (!this._connected) return;
        // Mark a running read dirty before it can settle; it owns its trailing refresh.
        if (this._controller) {
            this._dirty = true;
            return;
        }
        const generation = this._generation;
        if (this._queuedGeneration === generation) return;
        this._queuedGeneration = generation;
        queueMicrotask(() => {
            if (this._queuedGeneration === generation) this._queuedGeneration = undefined;
            if (this._connected && this._generation === generation) void this.refresh();
        });
    };

    /** Refetch the current range immediately, aborting any existing read. */
    refresh(): Promise<void> {
        return this._currentStart
            ? this.fetchRange(this._currentStart, this._currentEnd, true)
            : Promise.resolve();
    }
}
