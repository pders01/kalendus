import type { TelemetryPayload } from './types.js';

/**
 * Fire-and-forget telemetry sink.
 * In production this would forward to an analytics backend;
 * here it collects events in memory for inspection.
 */
export class TelemetryServiceImpl {
    private _events: TelemetryPayload[] = [];

    async record(payload: TelemetryPayload): Promise<void> {
        this._events.push({
            ...payload,
            timestamp: payload.timestamp ?? new Date().toISOString(),
        });
    }

    getEvents(): ReadonlyArray<TelemetryPayload> {
        return this._events;
    }

    clear(): void {
        this._events = [];
    }
}
