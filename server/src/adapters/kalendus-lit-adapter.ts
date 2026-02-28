/// <reference lib="dom" />

import { KalendusApiClient } from './kalendus-api-client.js';
import type {
    CalendarEntry,
    KalendusClientOptions,
    SyncMessage,
} from './types.js';

/**
 * Minimal ReactiveController interface — avoids importing Lit
 * so this file can be used in non-Lit contexts too.
 */
interface ReactiveControllerHost {
    addController(controller: ReactiveController): void;
    removeController?(controller: ReactiveController): void;
    requestUpdate(): void;
}

interface ReactiveController {
    hostConnected?(): void;
    hostDisconnected?(): void;
}

export interface KalendusLitAdapterOptions extends KalendusClientOptions {
    /** Auto-connect SSE for real-time sync? Default: false */
    enableSync?: boolean;
    /** Forward telemetry events? Default: false */
    enableTelemetry?: boolean;
}

/**
 * Lit ReactiveController that wires <lms-calendar> events to API calls.
 *
 * Usage:
 *   const adapter = new KalendusLitAdapter(this, { baseUrl, calendarId });
 *   // In render():  .entries=${this.adapter.entries}
 */
export class KalendusLitAdapter implements ReactiveController {
    private _host: ReactiveControllerHost;
    private _client: KalendusApiClient;
    private _entries: CalendarEntry[] = [];
    private _loading = false;
    private _error: Error | null = null;
    private _enableSync: boolean;
    private _enableTelemetry: boolean;
    private _unsubSync?: () => void;
    private _boundHandlers: {
        switchdate?: (e: Event) => void;
        switchview?: (e: Event) => void;
    } = {};

    // Current visible range (for re-fetching on sync events)
    private _currentStart: string = '';
    private _currentEnd: string = '';

    constructor(
        host: ReactiveControllerHost,
        options: KalendusLitAdapterOptions,
    ) {
        this._host = host;
        this._client = new KalendusApiClient(options);
        this._enableSync = options.enableSync ?? false;
        this._enableTelemetry = options.enableTelemetry ?? false;
        host.addController(this);
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

    hostConnected(): void {
        const host = this._host as unknown as EventTarget;

        this._boundHandlers.switchdate = (e: Event) => {
            this._handleNavigation((e as CustomEvent).detail);
        };

        this._boundHandlers.switchview = (e: Event) => {
            this._handleNavigation((e as CustomEvent).detail);
        };

        if (typeof host.addEventListener === 'function') {
            host.addEventListener('switchdate', this._boundHandlers.switchdate);
            host.addEventListener('switchview', this._boundHandlers.switchview);
        }

        if (this._enableSync) {
            this._client.connect();
            this._unsubSync = this._client.onSync((msg) =>
                this._handleSync(msg),
            );
        }
    }

    hostDisconnected(): void {
        const host = this._host as unknown as EventTarget;

        if (typeof host.removeEventListener === 'function') {
            if (this._boundHandlers.switchdate) {
                host.removeEventListener(
                    'switchdate',
                    this._boundHandlers.switchdate,
                );
            }
            if (this._boundHandlers.switchview) {
                host.removeEventListener(
                    'switchview',
                    this._boundHandlers.switchview,
                );
            }
        }

        this._unsubSync?.();
        this._client.disconnect();
        this._boundHandlers = {};
    }

    /** Manually fetch events for a date range */
    async fetchRange(start: string, end: string): Promise<void> {
        this._currentStart = start;
        this._currentEnd = end;
        this._loading = true;
        this._error = null;
        this._host.requestUpdate();

        try {
            this._entries = await this._client.fetchEvents(start, end);
        } catch (e) {
            this._error = e instanceof Error ? e : new Error(String(e));
        } finally {
            this._loading = false;
            this._host.requestUpdate();
        }
    }

    private _handleNavigation(detail: Record<string, unknown>): void {
        // The switchdate/switchview events contain the new active date
        // We compute the visible range based on view mode
        const activeDate = detail.activeDate as
            | { year: number; month: number; day: number }
            | undefined;
        const viewMode = detail.viewMode as string | undefined;

        if (!activeDate) return;

        const { start, end } = this._computeRange(activeDate, viewMode);
        this.fetchRange(start, end);

        if (this._enableTelemetry) {
            this._client.sendTelemetry('navigation', {
                viewMode,
                activeDate,
            });
        }
    }

    private _handleSync(_msg: SyncMessage): void {
        // Re-fetch the current range for accurate state on any sync event
        if (this._currentStart && this._currentEnd) {
            this.fetchRange(this._currentStart, this._currentEnd);
        }
    }

    private _computeRange(
        activeDate: { year: number; month: number; day: number },
        viewMode?: string,
    ): { start: string; end: string } {
        const d = new Date(
            activeDate.year,
            activeDate.month - 1,
            activeDate.day,
        );

        const fmt = (date: Date) =>
            `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        switch (viewMode) {
            case 'day':
                return { start: fmt(d), end: fmt(d) };

            case 'week': {
                const dayOfWeek = d.getDay();
                const monday = new Date(d);
                monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7));
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                return { start: fmt(monday), end: fmt(sunday) };
            }

            case 'year': {
                const yearStart = new Date(d.getFullYear(), 0, 1);
                const yearEnd = new Date(d.getFullYear(), 11, 31);
                return { start: fmt(yearStart), end: fmt(yearEnd) };
            }

            case 'month':
            default: {
                // Fetch 6-week range around the month for edge days
                const monthStart = new Date(
                    d.getFullYear(),
                    d.getMonth(),
                    1,
                );
                const startDow = monthStart.getDay();
                const rangeStart = new Date(monthStart);
                rangeStart.setDate(
                    rangeStart.getDate() - ((startDow + 6) % 7),
                );
                const rangeEnd = new Date(rangeStart);
                rangeEnd.setDate(rangeStart.getDate() + 41); // 6 weeks
                return { start: fmt(rangeStart), end: fmt(rangeEnd) };
            }
        }
    }
}
