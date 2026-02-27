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

    events.forEach((event) => {
        if (event.isMultiDay) {
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
        return aDay - bDay;
    });

    // Track which rows are occupied on each day
    const rowOccupancy = new Map<number, Set<number>>();
    for (let day = 0; day < 7; day++) {
        rowOccupancy.set(day, new Set());
    }

    // Assign rows to multi-day events first
    multiDayEvents.forEach((event) => {
        let assignedRow = 0;
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
                    rowOccupancy.get(day)?.add(assignedRow);
                }
            } else {
                assignedRow++;
            }
        }
    });

    // Then assign rows to single-day events
    singleDayEvents.forEach((event) => {
        const day = event.days[0];
        let assignedRow = 0;

        while (rowOccupancy.get(day)?.has(assignedRow)) {
            assignedRow++;
        }

        eventRows.set(event.id, assignedRow);
        rowOccupancy.get(day)?.add(assignedRow);
    });

    // Compute total rows needed
    let maxRows = 0;
    rowOccupancy.forEach((rows) => {
        maxRows = Math.max(maxRows, rows.size);
    });

    return { rowAssignments: eventRows, totalRows: maxRows };
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
