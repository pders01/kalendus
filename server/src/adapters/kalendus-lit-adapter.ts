/// <reference lib="dom" />

import { KalendusApiClient } from './kalendus-api-client.js';
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
function inclusiveEnd(endExclusive: string): string {
    if (endExclusive === '10000-01-01') return '9999-12-31';
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
    private _target: CalendarTarget | null = null;
    private _connected = false;
    private _unsubSync?: () => void;
    private _unsubReconcile?: () => void;
    private _controller?: AbortController;
    private _generation = 0;
    private _currentStart = '';
    private _currentEnd = '';
    private _key = '';
    private _pending: Promise<void> = Promise.resolve();
    private _refreshQueued = false;

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
        return this._error;
    }
    get client(): KalendusApiClient {
        return this._client;
    }

    private _onState = (event: Event): void => {
        if (this._target && !event.composedPath().includes(this._target)) return;
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
            this._unsubSync = this._client.onSync(this._queueRefresh);
            this._unsubReconcile = this._client.onReconcile(this._queueRefresh);
            try {
                this._client.connect();
            } catch (error) {
                this._error = error instanceof Error ? error : new Error(String(error));
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
        this._unsubSync?.();
        this._unsubReconcile?.();
        this._client.disconnect();
        this._generation++;
        this._controller?.abort();
        this._key = '';
        this._loading = false;
    }

    /** Accept the public snapshot, never recalculate responsive ranges or week starts here. */
    setState(state: unknown): void {
        if (!isState(state)) return;
        const end = inclusiveEnd(state.range.end);
        const changed = this._key !== `${state.range.start}/${end}`;
        void this.fetchRange(state.range.start, end);
        if (changed && this.options.enableTelemetry)
            void this._client.sendTelemetry('navigation', {
                activeDate: state.activeDate,
                viewMode: state.viewMode,
                firstDayOfWeek: state.firstDayOfWeek,
            });
    }

    /** Legacy server queries use inclusive ends. Identical ranges dedupe; force refresh retries. */
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
        this._loading = true;
        this._error = null;
        this._host.requestUpdate();
        this._pending = (async () => {
            try {
                const entries = await this._client.fetchEvents(start, end, controller.signal);
                if (generation === this._generation) this._entries = entries;
            } catch (error) {
                // Even transports ignoring AbortSignal cannot publish stale failures.
                if (generation === this._generation && !controller.signal.aborted) {
                    this._error = error instanceof Error ? error : new Error(String(error));
                }
            } finally {
                if (generation === this._generation) {
                    this._loading = false;
                    this._host.requestUpdate();
                }
            }
        })();
        return this._pending;
    }

    private _queueRefresh = (): void => {
        if (this._refreshQueued) return;
        this._refreshQueued = true;
        queueMicrotask(() => {
            this._refreshQueued = false;
            if (this._connected) void this.refresh();
        });
    };

    refresh(): Promise<void> {
        return this._currentStart
            ? this.fetchRange(this._currentStart, this._currentEnd, true)
            : Promise.resolve();
    }
}
