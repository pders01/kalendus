import { layoutAllDaySegments } from './allDayLayout.js';
import type { CivilDate, ExpandedCalendarEntry } from './calendarModel.js';
import { dateSlotKey } from './entrySlots.js';

type OrderedEntry = ExpandedCalendarEntry & { originalIndex: number };
/** Dates are in display order; the array index is the visual row. */
export type MonthPreviewRows<T> = Readonly<Record<string, readonly (T | undefined)[]>>;

function sortMonthEntries<T extends OrderedEntry>(entries: T[]) {
    const order = (entry: T) => entry.originalIndex - (entry.continuation.has ? 1000 : 0);
    return entries.sort((a, b) => order(a) - order(b));
}

/** Assign rows to already bounded display segments without changing the entries. */
export function buildMonthPreviews<T extends OrderedEntry>(
    dates: readonly CivilDate[],
    entries: readonly T[],
): MonthPreviewRows<T> {
    const previews: Record<string, Array<T | undefined>> = Object.fromEntries(
        dates.map((date) => [dateSlotKey(date), []]),
    );
    const allDay: T[] = [];
    const timed: T[] = [];
    for (const entry of entries) (entry.isAllDay ? allDay : timed).push(entry);

    const indices = new Map(dates.map((date, index) => [dateSlotKey(date), index]));
    const weeks: Array<Array<{ entry: T; column: number }>> = Array.from(
        { length: Math.ceil(dates.length / 7) },
        () => [],
    );
    for (const entry of sortMonthEntries(allDay)) {
        const index = indices.get(dateSlotKey(entry.date.start));
        if (index !== undefined) weeks[Math.floor(index / 7)].push({ entry, column: index % 7 });
    }

    for (const week of weeks) {
        const { placements } = layoutAllDaySegments(week);
        for (const { entry, row } of placements)
            previews[dateSlotKey(entry.date.start)][row] = entry;
    }

    // Timed rows start after the last occupied span lane, not the all-day count.
    for (const entry of sortMonthEntries(timed))
        previews[dateSlotKey(entry.date.start)]?.push(entry);
    return previews;
}
