import type { ExpandedCalendarEntry } from './calendarModel.js';

export interface AllDayEvent {
    id: string;
    days: number[];
    isMultiDay: boolean;
}

export interface AllDayLayoutResult {
    rowAssignments: Map<string, number>;
    totalRows: number;
}

/**
 * Allocate row positions for all-day events so they don't overlap.
 * Multi-day events are placed first, then single-day events fill remaining slots.
 */
export function allocateAllDayRows(events: AllDayEvent[]): AllDayLayoutResult {
    const eventRows = new Map<string, number>();

    if (events.length === 0) {
        return { rowAssignments: eventRows, totalRows: 0 };
    }

    const multiDayEvents: AllDayEvent[] = [];
    const singleDayEvents: AllDayEvent[] = [];

    const seenIds = new Set<string>();
    events.forEach((event) => {
        if (
            !event.id ||
            seenIds.has(event.id) ||
            event.days.length === 0 ||
            event.days.length > 7 ||
            new Set(event.days).size !== event.days.length ||
            event.days.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
        ) {
            throw new RangeError(
                'All-day events need unique IDs and nonempty day indices in [0, 6]',
            );
        }
        seenIds.add(event.id);
        if (event.isMultiDay || event.days.length > 1) {
            multiDayEvents.push(event);
        } else {
            singleDayEvents.push(event);
        }
    });

    // Sort multi-day events by start day, then by id
    multiDayEvents.sort((a, b) => {
        const aMinDay = Math.min(...a.days);
        const bMinDay = Math.min(...b.days);
        if (aMinDay !== bMinDay) return aMinDay - bMinDay;
        return a.id.localeCompare(b.id);
    });

    // Sort single-day events by day
    singleDayEvents.sort((a, b) => {
        const aDay = Math.min(...a.days);
        const bDay = Math.min(...b.days);
        return aDay - bDay || a.id.localeCompare(b.id);
    });

    // Track which rows are occupied on each day
    const rowOccupancy = new Map<number, Set<number>>();
    const nextFree = new Map<number, number>();
    for (let day = 0; day < 7; day++) {
        rowOccupancy.set(day, new Set());
        nextFree.set(day, 0);
    }
    const occupy = (day: number, row: number) => {
        const rows = rowOccupancy.get(day)!;
        rows.add(row);
        let free = nextFree.get(day)!;
        while (rows.has(free)) free++;
        nextFree.set(day, free);
    };

    // Assign rows to multi-day events first
    multiDayEvents.forEach((event) => {
        // Every earlier row is occupied on at least one of these days.
        let assignedRow = Math.max(...event.days.map((day) => nextFree.get(day)!));
        let foundRow = false;

        while (!foundRow) {
            let rowAvailable = true;
            for (const day of event.days) {
                if (rowOccupancy.get(day)?.has(assignedRow)) {
                    rowAvailable = false;
                    break;
                }
            }

            if (rowAvailable) {
                foundRow = true;
                eventRows.set(event.id, assignedRow);
                for (const day of event.days) {
                    occupy(day, assignedRow);
                }
            } else {
                assignedRow++;
            }
        }
    });

    // Then assign rows to single-day events
    singleDayEvents.forEach((event) => {
        const day = event.days[0];
        const assignedRow = nextFree.get(day)!;
        eventRows.set(event.id, assignedRow);
        occupy(day, assignedRow);
    });

    // Compute total rows needed
    let maxRows = 0;
    eventRows.forEach((row) => {
        // A day can have gaps: set cardinality is not the last occupied row.
        maxRows = Math.max(maxRows, row + 1);
    });

    return { rowAssignments: eventRows, totalRows: maxRows };
}

/**
 * Coalesce visible segments into row requests, then return one placement per
 * input segment in the same order. The caller supplies display columns (not
 * the canonical continuation indices) so span edges follow the visible window.
 */
export function layoutAllDaySegments<
    T extends Pick<ExpandedCalendarEntry, 'occurrenceId' | 'continuation'>,
>(segments: readonly { entry: T; column: number }[]) {
    const events = new Map<string, AllDayEvent>();
    for (const { entry, column } of segments) {
        const id = entry.occurrenceId;
        let event = events.get(id);
        if (!event) {
            event = { id, days: [], isMultiDay: entry.continuation.total > 1 };
            events.set(id, event);
        }
        event.days.push(column);
    }

    const { rowAssignments, totalRows } = allocateAllDayRows([...events.values()]);
    const placements = segments.map(({ entry, column }) => {
        const days = events.get(entry.occurrenceId)!.days;
        return {
            entry,
            row: rowAssignments.get(entry.occurrenceId)!,
            spanClass: computeSpanClass({
                continuationIndex: column,
                totalDays: entry.continuation.total,
                visibleStartIndex: Math.min(...days),
                visibleEndIndex: Math.max(...days),
            }),
        };
    });
    return { placements, totalRows };
}

/**
 * Determine the span class for an all-day entry based on its position within a multi-day span.
 */
export function computeSpanClass(entry: {
    continuationIndex: number;
    totalDays: number;
    visibleStartIndex: number;
    visibleEndIndex: number;
}): 'first-day' | 'middle-day' | 'last-day' | 'single-day' {
    const { continuationIndex, totalDays, visibleStartIndex, visibleEndIndex } = entry;

    if (totalDays <= 1) {
        return 'single-day';
    }

    const isFirst = continuationIndex === visibleStartIndex;
    const isLast = continuationIndex === visibleEndIndex;

    if (isFirst && isLast) {
        return 'single-day';
    }
    if (isFirst) {
        return 'first-day';
    }
    if (isLast) {
        return 'last-day';
    }
    return 'middle-day';
}
