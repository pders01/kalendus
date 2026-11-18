import {
    addCivilDays,
    parseCalendarDate,
    type CivilDate,
    type ExpandedCalendarEntry,
} from './calendarModel.js';
import { formatLocalizedDateInterval } from './localization.js';

export function formatMonthSpanRange(entry: ExpandedCalendarEntry, locale: string): string {
    if (entry.continuation.total < 2) return '';
    const start = parseCalendarDate(entry.startDate)!;
    return formatLocalizedDateInterval(
        start,
        addCivilDays(start, entry.continuation.total - 1),
        locale,
    );
}

/** One continuous event's occupied dates, clipped to one displayed week. */
export interface MonthSpan {
    entry: ExpandedCalendarEntry;
    startColumn: number;
    endColumn: number;
    /** Individual track 0/1; 2 means the displayed region exceeds that capacity. */
    row: number;
}

const key = (date: CivilDate) => `${date.year}-${date.month}-${date.day}`;

/** Uses already bounded segments; does not expand or reformat canonical lifetimes. */
export function buildMonthSpans(
    dates: readonly CivilDate[],
    entries: readonly ExpandedCalendarEntry[],
): MonthSpan[][] {
    const indices = new Map(dates.map((date, index) => [key(date), index]));
    const weeks = Array.from(
        { length: Math.ceil(dates.length / 7) },
        () => new Map<string, MonthSpan>(),
    );
    for (const entry of entries) {
        if (entry.continuation.total < 2) continue;
        const index = indices.get(key(entry.date.start));
        if (index === undefined) continue;
        const week = weeks[Math.floor(index / 7)],
            column = index % 7;
        let span = week.get(entry.occurrenceId);
        if (!span) {
            span = { entry, startColumn: column, endColumn: column, row: 0 };
            week.set(entry.occurrenceId, span);
        }
        if (column < span.startColumn) {
            span.startColumn = column;
            span.entry = entry;
        }
        span.endColumn = Math.max(span.endColumn, column);
    }
    // Allocate once across the entire displayed region, not independently per
    // week. A continuation must not silently change tracks at a week boundary.
    const id = (span: MonthSpan) => `${span.entry.startDate}:${span.entry.occurrenceId}`;
    const occupied = new Map<string, [start: number, end: number]>();
    weeks.forEach((week, index) => {
        for (const span of week.values()) {
            const key = id(span),
                start = index * 7 + span.startColumn,
                end = index * 7 + span.endColumn;
            const range = occupied.get(key);
            if (range) range[1] = end;
            else occupied.set(key, [start, end]);
        }
    });
    const rowAssignments = new Map<string, number>();
    const ends = [-1, -1];
    // Only allocate the two tracks we can actually paint. Overflow is a capacity
    // signal, not thousands of invisible lanes (or quadratic dense allocation).
    for (const [id, range] of [...occupied].sort(
        (a, b) => a[1][0] - b[1][0] || a[0].localeCompare(b[0]),
    )) {
        const row = ends.findIndex((end) => end < range[0]);
        rowAssignments.set(id, row < 0 ? 2 : row);
        if (row >= 0) ends[row] = range[1];
    }
    return weeks.map((week) => {
        const spans = [...week.values()];
        for (const span of spans) span.row = rowAssignments.get(id(span))!;
        return spans.sort(
            (a, b) =>
                a.row - b.row ||
                a.startColumn - b.startColumn ||
                a.entry.occurrenceId.localeCompare(b.entry.occurrenceId),
        );
    });
}
