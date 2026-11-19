import type { ExpandedCalendarEntry } from './calendarModel.js';

type OrderedEntry = ExpandedCalendarEntry & { originalIndex: number };

interface AgendaPageOptions {
    limit: number;
    /** Accordion pages give each section its own limit; density lists share one. */
    perSection: boolean;
    /** Collapsed preview count, including zero for on-demand. Omit for no disclosure. */
    previewSize?: number;
    expanded: boolean;
    allDayOnly?: boolean;
    segmentIds?: ReadonlySet<string>;
}

const startMinute = (entry: OrderedEntry) =>
    (entry.time?.start.hour ?? 0) * 60 + (entry.time?.start.minute ?? 0);

/** Select a page from one date's segments, preserving their original identity. */
export function prepareAgendaEntries<T extends OrderedEntry>(
    entries: readonly T[],
    { limit, perSection, previewSize, expanded, allDayOnly, segmentIds }: AgendaPageOptions,
) {
    const ordered = entries
        .filter((entry) =>
            allDayOnly ? entry.isAllDay : !segmentIds || segmentIds.has(entry.segmentId),
        )
        .sort(
            (a, b) =>
                Number(b.isAllDay) - Number(a.isAllDay) ||
                startMinute(a) - startMinute(b) ||
                a.originalIndex - b.originalIndex,
        );
    const total = ordered.length;
    const disclosure = previewSize !== undefined && total > previewSize;
    const collapsed = disclosure && !expanded;
    const pageSize = collapsed ? previewSize : limit;
    const firstTimed = ordered.findIndex((entry) => !entry.isAllDay);
    const timedStart = firstTimed < 0 ? total : firstTimed;
    const allDay = ordered.slice(0, Math.min(timedStart, pageSize));
    const timedLimit = perSection && !collapsed ? pageSize : pageSize - allDay.length;
    const timed = ordered.slice(timedStart, timedStart + timedLimit);
    return {
        allDay,
        timed,
        total,
        disclosure,
        remaining: collapsed ? 0 : total - allDay.length - timed.length,
    };
}
