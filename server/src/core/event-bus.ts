export type EventBusCallback<T = unknown> = (data: T) => void;

/**
 * In-process pub/sub for SSE broadcasting.
 * Channels are keyed by calendar ID.
 */
export class EventBus {
    private _channels = new Map<string, Set<EventBusCallback>>();

    subscribe(channel: string, callback: EventBusCallback): () => void {
        if (!this._channels.has(channel)) {
            this._channels.set(channel, new Set());
        }
        this._channels.get(channel)!.add(callback);

        return () => {
            const subs = this._channels.get(channel);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    this._channels.delete(channel);
                }
            }
        };
    }

    publish(channel: string, data: unknown): void {
        const subs = this._channels.get(channel);
        if (!subs) return;
        for (const cb of subs) {
            cb(data);
        }
    }

    subscriberCount(channel: string): number {
        return this._channels.get(channel)?.size ?? 0;
    }

    clear(): void {
        this._channels.clear();
    }
}
