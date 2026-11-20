import type { EventBus } from './event-bus.js';
import type { SseEvent } from './types.js';

/**
 * Manages SSE broadcast subscriptions on the supplied bus.
 * Mutation events and removal signals have separate channels per calendar.
 */
export class SyncServiceImpl {
    constructor(private bus: EventBus) {}

    /** Subscribe to real-time events for a calendar. Returns unsubscribe fn. */
    subscribe(calendarId: string, callback: (event: SseEvent) => void): () => void {
        return this.bus.subscribe(this._channel(calendarId), callback as (data: unknown) => void);
    }

    /** Broadcast a mutation event to all subscribers of a calendar. */
    broadcast(event: SseEvent): void {
        this.bus.publish(this._channel(event.calendarId), event);
    }

    /** Subscribe to the calendar's removal signal, which has no payload. */
    onCalendarRemoved(calendarId: string, callback: () => unknown): () => void {
        return this.bus.subscribe(this._removalChannel(calendarId), () => callback());
    }

    /** Notify removal subscribers after the calendar deletion commits. */
    notifyCalendarRemoved(calendarId: string): void {
        this.bus.publish(this._removalChannel(calendarId), undefined);
    }

    subscriberCount(calendarId: string): number {
        return this.bus.subscriberCount(this._channel(calendarId));
    }

    private _channel(calendarId: string): string {
        return `calendar:${calendarId}`;
    }

    private _removalChannel(calendarId: string): string {
        return `calendar-removed:${calendarId}`;
    }
}
