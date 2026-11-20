import { addDisplayDays } from '../lib/weekStartHelper.js';
import type { CalendarEntry } from '../lms-calendar.js';

/** Shared default action for inspector and inline Agenda export. */
export async function downloadEntryIcs(
    target: HTMLElement,
    entry: CalendarEntry,
    eventId?: string,
    heading?: string,
    identity: object = entry,
) {
    if (
        !target.dispatchEvent(
            new CustomEvent('export-entry', {
                detail: { entry, eventId: eventId ?? entry.id },
                cancelable: true,
                bubbles: true,
                composed: true,
            }),
        )
    )
        return;
    try {
        const { saveEntryIcs } = await import('./serializeEntryIcs.js');
        saveEntryIcs(entry, isAllDayExport(entry), eventId, heading, identity);
    } catch (error) {
        target.dispatchEvent(
            new CustomEvent('export-error', {
                detail: { error, entry, eventId },
                bubbles: true,
                composed: true,
            }),
        );
        throw error;
    }
}

/** Matches the boundary model's documented legacy promotion; explicit kinds always win. */
export function isAllDayExport(entry: CalendarEntry): boolean {
    if (entry.kind) return entry.kind === 'all-day';
    return (
        !entry.time ||
        entry.date.start.year !== entry.date.end.year ||
        entry.date.start.month !== entry.date.end.month ||
        entry.date.start.day !== entry.date.end.day ||
        entry.time.end.hour - entry.time.start.hour >= 23 ||
        entry.isContinuation === true
    );
}

/** Only a timed end at 24:00 is displayed on the next civil date. */
export function entryDisplayEndDate(entry: CalendarEntry, allDay: boolean) {
    const end = entry.date.end;
    return !allDay && entry.time?.end.hour === 24 ? addDisplayDays(end, 1) : end;
}

/** Load serialization only when the default export action needs it. */
export async function generateEntryIcs(
    entry: CalendarEntry,
    eventId?: string,
    identity: object = entry,
): Promise<string> {
    const { serializeEntryIcs } = await import('./serializeEntryIcs.js');
    return serializeEntryIcs(entry, isAllDayExport(entry), eventId, identity);
}
