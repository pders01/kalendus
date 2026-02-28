import type { EventBus } from './event-bus.js';
import type { SseEvent } from './types.js';

/**
 * Manages SSE broadcast subscriptions via the EventBus.
 * Each calendar ID has its own channel.
 */
export class SyncServiceImpl {
    constructor(private bus: EventBus) {}

    /** Subscribe to real-time events for a calendar. Returns unsubscribe fn. */
    subscribe(
        calendarId: string,
        callback: (event: SseEvent) => void,
    ): () => void {
        return this.bus.subscribe(
            this._channel(calendarId),
            callback as (data: unknown) => void,
        );
    }

    /** Broadcast a mutation event to all subscribers of a calendar. */
    broadcast(event: SseEvent): void {
        this.bus.publish(this._channel(event.calendarId), event);
    }

    subscriberCount(calendarId: string): number {
        return this.bus.subscriberCount(this._channel(calendarId));
    }

    private _channel(calendarId: string): string {
        return `calendar:${calendarId}`;
    }
}
