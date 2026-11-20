export type EventBusCallback<T = unknown> = (data: T) => unknown;

/**
 * In-process pub/sub for SSE broadcasting.
 * Each bus has its own string-keyed channels.
 */
export class EventBus {
    private readonly _channels = new Map<string, Map<symbol, EventBusCallback>>();
    private readonly _scopes = new WeakMap<object, EventBus>();

    /** The same receiver and weakly held owner share a child with independent channels. */
    scopedTo(owner: object): EventBus {
        let scope = this._scopes.get(owner);
        if (!scope) {
            scope = new EventBus();
            this._scopes.set(owner, scope);
        }
        return scope;
    }

    /** Each registration owns an idempotent unsubscribe handle, even for identical callbacks. */
    subscribe(channel: string, callback: EventBusCallback): () => void {
        const subscription = Symbol();
        let subs = this._channels.get(channel);
        if (!subs) {
            subs = new Map();
            this._channels.set(channel, subs);
        }
        subs.set(subscription, callback);

        return () => {
            const current = this._channels.get(channel);
            if (current?.delete(subscription) && current.size === 0) {
                this._channels.delete(channel);
            }
        };
    }

    publish(channel: string, data: unknown): void {
        const subs = this._channels.get(channel);
        if (!subs) return;
        // Publishing is post-commit best effort. One failed subscriber cannot change
        // the mutation outcome or prevent other subscribers from receiving it.
        for (const cb of [...subs.values()]) {
            try {
                Promise.resolve(cb(structuredClone(data))).catch(() => {});
            } catch {
                /* isolated subscriber failure */
            }
        }
    }

    subscriberCount(channel: string): number {
        return this._channels.get(channel)?.size ?? 0;
    }

    /** Clear only this bus's channels, not any child scopes. */
    clear(): void {
        this._channels.clear();
    }
}
