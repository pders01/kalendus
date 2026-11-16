/** Deterministic cascade layout. Collision intervals use the rendered minimum geometry. */
import { isValidCalendarTime } from './calendarModel.js';

interface CalendarEvent {
    id: string;
    heading: string;
    startTime: { hour: number; minute: number };
    endTime: { hour: number; minute: number };
    color: string;
}

interface GridConfig {
    minuteHeight: number;
    eventMinHeight: number;
}

export const MIN_EVENT_DURATION_MINUTES = 20;

/** Display geometry only: this does not change an event's semantic endpoints. */
export function getDisplayDurationMinutes(
    start: number,
    end: number,
    minimum = MIN_EVENT_DURATION_MINUTES,
): number {
    return Math.max(end - start, minimum);
}

export interface LayoutBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    /** Pass to SlotManager when using a custom minimum height/scale. */
    durationMinutes: number;
    depth: number;
    group: number;
    opacity: number;
    zIndex: number;
}

export interface LayoutResult {
    boxes: LayoutBox[];
}

interface Interval {
    index: number;
    id: string;
    start: number;
    end: number;
    duration: number;
}

/** Small binary heap: grouping/foreground depth reuse remain O(n log n), even when dense. */
class MinHeap<T> {
    private values: T[] = [];
    constructor(private compare: (a: T, b: T) => number) {}
    peek(): T | undefined {
        return this.values[0];
    }
    push(value: T): void {
        const values = this.values;
        let index = values.length;
        values.push(value);
        while (index > 0) {
            const parent = (index - 1) >> 1;
            if (this.compare(values[parent], value) <= 0) break;
            values[index] = values[parent];
            index = parent;
        }
        values[index] = value;
    }
    pop(): T | undefined {
        const values = this.values;
        const result = values[0];
        const last = values.pop();
        if (values.length && last !== undefined) {
            let index = 0;
            while (index * 2 + 1 < values.length) {
                let child = index * 2 + 1;
                if (child + 1 < values.length && this.compare(values[child + 1], values[child]) < 0)
                    child++;
                if (this.compare(last, values[child]) <= 0) break;
                values[index] = values[child];
                index = child;
            }
            values[index] = last;
        }
        return result;
    }
}

function compareIntervals(a: Interval, b: Interval): number {
    return (
        a.start - b.start ||
        b.duration - a.duration ||
        a.id.localeCompare(b.id) ||
        a.index - b.index
    );
}

export class LayoutCalculator {
    private config: GridConfig;

    constructor(config: Partial<GridConfig> = {}) {
        this.config = {
            minuteHeight: config.minuteHeight ?? 1,
            eventMinHeight: config.eventMinHeight ?? MIN_EVENT_DURATION_MINUTES,
        };
        if (
            !Number.isFinite(this.config.minuteHeight) ||
            this.config.minuteHeight <= 0 ||
            !Number.isFinite(this.config.eventMinHeight) ||
            this.config.eventMinHeight < 0
        ) {
            throw new RangeError('Invalid layout scale or minimum height');
        }
    }

    calculateLayout(events: CalendarEvent[]): LayoutResult {
        const minimum = this.config.eventMinHeight / this.config.minuteHeight;
        const intervals: Interval[] = events.map((event, index) => {
            if (
                !isValidCalendarTime(event.startTime) ||
                !isValidCalendarTime(event.endTime, true)
            ) {
                throw new RangeError('Invalid layout time');
            }
            const start = event.startTime.hour * 60 + event.startTime.minute;
            const semanticEnd = event.endTime.hour * 60 + event.endTime.minute;
            if (semanticEnd < start) throw new RangeError('Reversed layout interval');
            const duration = semanticEnd - start;
            // A zero configured minimum still needs a nonempty point collision interval.
            const end =
                start +
                getDisplayDurationMinutes(
                    start,
                    semanticEnd,
                    Math.max(minimum, Number.EPSILON * 1440),
                );
            return { index, id: event.id, start, end, duration };
        });
        intervals.sort(compareIntervals);

        // Sweep connected overlap components using the maximum end seen so far.
        const groups: Interval[][] = [];
        let groupEnd = -Infinity;
        for (const interval of intervals) {
            if (!groups.length || interval.start >= groupEnd) {
                groups.push([]);
                groupEnd = interval.end;
            } else {
                groupEnd = Math.max(groupEnd, interval.end);
            }
            groups[groups.length - 1].push(interval);
        }

        const boxes: LayoutBox[] = new Array(events.length);
        groups.forEach((group, groupId) => {
            // Keep the established full-width longest-event background policy.
            const background = group.reduce((best, item) =>
                item.duration > best.duration ? item : best,
            );
            const active = new MinHeap<{ end: number; depth: number }>(
                (a, b) => a.end - b.end || a.depth - b.depth,
            );
            const available = new MinHeap<number>((a, b) => a - b);
            const depths = new Map<number, number>();
            let nextDepth = 1;
            let maxDepth = 0;
            for (const interval of group) {
                if (interval === background) {
                    depths.set(interval.index, 0);
                    continue;
                }
                while (active.peek() && active.peek()!.end <= interval.start) {
                    available.push(active.pop()!.depth);
                }
                const depth = available.pop() ?? nextDepth++;
                depths.set(interval.index, depth);
                maxDepth = Math.max(maxDepth, depth);
                active.push({ end: interval.end, depth });
            }
            for (const [paintOrder, interval] of group.entries()) {
                const depth = depths.get(interval.index)!;
                const x = depth === 0 ? 0 : (depth / maxDepth) * 35;
                const durationMinutes = getDisplayDurationMinutes(
                    interval.start,
                    interval.start + interval.duration,
                    minimum,
                );
                boxes[interval.index] = {
                    id: interval.id,
                    x,
                    y: interval.start * this.config.minuteHeight,
                    width: 100 - x,
                    height: durationMinutes * this.config.minuteHeight,
                    durationMinutes,
                    depth,
                    group: groupId,
                    opacity: depth === 0 ? 0.95 : Math.max(0.85, 0.95 - depth * 0.05),
                    // A reused horizontal lane must not put a later heading below
                    // an earlier, still-running foreground card.
                    zIndex: depth === 0 ? 100 : 101 + paintOrder,
                };
            }
        });
        return { boxes };
    }
}
