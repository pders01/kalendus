import { layoutAllDaySegments, type computeSpanClass } from './allDayLayout.js';
import type { CivilDate, ExpandedCalendarEntry } from './calendarModel.js';

type OrderedEntry = ExpandedCalendarEntry & { originalIndex: number };
type MonthPreview<T> = { entry: T; spanClass?: ReturnType<typeof computeSpanClass> };

/** The array index is the visual row. Empty lanes are significant. */
export type MonthPreviewRows<T> = Readonly<
    Record<string, readonly (MonthPreview<T> | undefined)[]>
>;

const slotKey = ({ year, month, day }: CivilDate) => `${year}-${month}-${day}`;

function sortMonthEntries<T extends OrderedEntry>(entries: T[]) {
    const order = (entry: T) => entry.originalIndex - (entry.continuation.has ? 1000 : 0);
    return entries.sort((a, b) => order(a) - order(b));
}

/** Assign rows to already bounded display segments without changing the entries. */
export function buildMonthPreviews<T extends OrderedEntry>(
    dates: readonly CivilDate[],
    entries: readonly T[],
): MonthPreviewRows<T> {
    const previews: Record<string, Array<MonthPreview<T> | undefined>> = {};
    const allDay: T[] = [];
    const timed: T[] = [];
    for (const entry of entries) (entry.isAllDay ? allDay : timed).push(entry);

    const indices = new Map(dates.map((date, index) => [slotKey(date), index]));
    const weeks: Array<Array<{ entry: T; column: number }>> = Array.from(
        { length: Math.ceil(dates.length / 7) },
        () => [],
    );
    for (const entry of sortMonthEntries(allDay)) {
        const index = indices.get(slotKey(entry.date.start));
        if (index !== undefined) weeks[Math.floor(index / 7)].push({ entry, column: index % 7 });
    }

    for (const week of weeks) {
        const { placements } = layoutAllDaySegments(week);
        for (const { entry, row, spanClass } of placements)
            (previews[slotKey(entry.date.start)] ??= [])[row] = { entry, spanClass };
    }

    // Timed rows start after the last occupied span lane, not the all-day count.
    for (const entry of sortMonthEntries(timed))
        (previews[slotKey(entry.date.start)] ??= []).push({ entry });
    return previews;
}
