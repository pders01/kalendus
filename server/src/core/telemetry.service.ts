import type { TelemetryPayload } from './types.js';
import { telemetrySchema, validate } from './validation.js';

export interface TelemetryOptions {
    /** In-memory inspection only; zero disables retention. Default 1000. */
    capacity?: number;
    /** Default one hour. Expired records are pruned on reads/writes. */
    ttlMs?: number;
    sink?: (payload: TelemetryPayload) => void | Promise<void>;
    now?: () => number;
}

/** Bounded, best-effort telemetry. Sink failures never fail a successful API request. */
export class TelemetryServiceImpl {
    private _events: Array<{ at: number; payload: TelemetryPayload }> = [];
    private inFlight = 0;
    private readonly capacity: number;
    private readonly ttlMs: number;
    private readonly now: () => number;

    constructor(private options: TelemetryOptions = {}) {
        this.capacity = options.capacity ?? 1000;
        this.ttlMs = options.ttlMs ?? 3_600_000;
        this.now = options.now ?? Date.now;
        if (
            !Number.isInteger(this.capacity) ||
            this.capacity < 0 ||
            this.capacity > 100_000 ||
            !Number.isFinite(this.ttlMs) ||
            this.ttlMs <= 0
        )
            throw new Error('Invalid telemetry limits');
    }

    async record(payload: TelemetryPayload): Promise<void> {
        const value = structuredClone(validate(telemetrySchema, payload));
        const at = this.now();
        value.timestamp ??= new Date(at).toISOString();
        this.prune(at);
        if (this.capacity) {
            this._events.push({ at, payload: value });
            if (this._events.length > this.capacity)
                this._events.splice(0, this._events.length - this.capacity);
        }
        if (this.options.sink && this.inFlight < 8) {
            this.inFlight++;
            try {
                // At most eight deliveries; drop rather than queue behind a stalled sink.
                Promise.resolve(this.options.sink(structuredClone(value)))
                    .catch(() => {})
                    .finally(() => {
                        this.inFlight--;
                    });
            } catch {
                this.inFlight--; /* host owns sink observability and timeouts */
            }
        }
    }

    getEvents(): ReadonlyArray<TelemetryPayload> {
        this.prune(this.now());
        return structuredClone(this._events.map(({ payload }) => payload));
    }

    private prune(at: number): void {
        this._events = this._events.filter((event) => at - event.at < this.ttlMs);
    }

    clear(): void {
        this._events = [];
    }
}
