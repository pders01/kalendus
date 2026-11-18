import type { CalendarEntry } from '../lms-calendar.js';

const legacyUids = new WeakMap<object, string>();
let nextLegacyUid = 0;

/** Shared default action for inspector and inline Agenda export. */
export async function downloadEntryIcs(
    target: HTMLElement,
    entry: CalendarEntry,
    eventId?: string,
    heading?: string,
    identity = entry as object,
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
        if (!legacyUids.has(identity))
            legacyUids.set(identity, `legacy-${Date.now()}-${++nextLegacyUid}@lms-calendar`);
        const ics = await generateEntryIcs(entry, eventId, legacyUids.get(identity));
        const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${(heading || 'event').replace(/[\\/:*?"<>|]/g, '-')}.ics`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 0);
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

/** Load serialization only when the default export action needs it. */
export async function generateEntryIcs(
    entry: CalendarEntry,
    eventId?: string,
    fallbackUid?: string,
): Promise<string> {
    const { serializeEntryIcs } = await import('./serializeEntryIcs.js');
    return serializeEntryIcs(entry, isAllDayExport(entry), eventId, fallbackUid);
}
