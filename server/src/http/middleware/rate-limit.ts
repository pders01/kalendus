/** Bounded fixed-window limiter. Keys must come from trusted context, not forwarded IP headers. */
export class RateLimiter {
    private entries = new Map<string, { count: number; expires: number }>();
    constructor(
        readonly limit = 60,
        readonly windowMs = 60_000,
        readonly capacity = 1024,
        private now: () => number = Date.now,
    ) {
        if (
            !Number.isInteger(limit) ||
            limit < 1 ||
            !Number.isFinite(windowMs) ||
            windowMs <= 0 ||
            !Number.isInteger(capacity) ||
            capacity < 1
        )
            throw new Error('Invalid rate limits');
    }
    allow(key: string): boolean {
        const now = this.now();
        for (const [entryKey, value] of this.entries) {
            if (value.expires <= now) this.entries.delete(entryKey);
        }
        const entry = this.entries.get(key);
        if (entry) return ++entry.count <= this.limit;
        // Reject new keys at capacity instead of evicting active limits (which permits bypass).
        if (this.entries.size >= this.capacity) return false;
        this.entries.set(key, { count: 1, expires: now + this.windowMs });
        return true;
    }
    get size(): number {
        return this.entries.size;
    }
}
