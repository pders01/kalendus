import { DateTime } from 'luxon';

import type { CalendarDate, CalendarTime, CalendarEntry } from '../lms-calendar.js';

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

/** RFC 5545: legacy date ends are inclusive; exported DATE ends are exclusive.
 * Unzoned timed values remain floating. Explicit IANA zones are exported as UTC
 * instants, avoiding a partial/incorrect VTIMEZONE definition. Like ingestion,
 * export rejects nonexistent and ambiguous local wall times.
 */
export async function generateEntryIcs(
    entry: CalendarEntry,
    eventId?: string,
    fallbackUid = 'legacy@lms-calendar',
): Promise<string> {
    const { generateIcsEvent } = await import('ts-ics');
    const allDay = isAllDayExport(entry);
    const zone = entry.timeZone || 'UTC';
    const civilStart = DateTime.fromObject(entry.date.start, { zone: 'UTC' });
    const civilEnd = DateTime.fromObject(entry.date.end, { zone: 'UTC' });
    if (!civilStart.isValid || !civilEnd.isValid || civilEnd < civilStart)
        throw new Error('Invalid event date interval');
    let start = civilStart;
    let end = civilEnd.plus({ days: 1 });
    if (!allDay) {
        if (!entry.time) throw new Error('Timed events require a time interval');
        const endpoint = (date: CalendarDate, time: CalendarTime) => {
            if (
                !Number.isInteger(time.hour) ||
                !Number.isInteger(time.minute) ||
                time.hour < 0 ||
                time.hour > 24 ||
                time.minute < 0 ||
                time.minute > 59 ||
                (time.hour === 24 && time.minute !== 0)
            )
                throw new Error('Invalid event time');
            const target = DateTime.fromObject(date, { zone: 'UTC' }).plus({
                days: time.hour === 24 ? 1 : 0,
            });
            const hour = time.hour === 24 ? 0 : time.hour;
            const result = DateTime.fromObject(
                {
                    year: target.year,
                    month: target.month,
                    day: target.day,
                    hour,
                    minute: time.minute,
                },
                { zone },
            );
            if (
                !result.isValid ||
                result.year !== target.year ||
                result.month !== target.month ||
                result.day !== target.day ||
                result.hour !== hour ||
                result.minute !== time.minute ||
                result.getPossibleOffsets().length !== 1
            )
                throw new Error('Invalid, nonexistent or ambiguous event time or time zone');
            return result;
        };
        start = endpoint(entry.date.start, entry.time.start);
        end = endpoint(entry.date.end, entry.time.end);
        if (end < start) throw new Error('Event end precedes start');
    }
    const format = (value: DateTime) =>
        allDay
            ? `;VALUE=DATE:${value.toFormat('yyyyMMdd')}`
            : entry.timeZone
              ? `:${value.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}`
              : `:${value.toFormat("yyyyMMdd'T'HHmmss")}`;
    let event = generateIcsEvent({
        start: { date: start.toJSDate() },
        end: { date: end.toJSDate() },
        summary: entry.heading || '',
        description: entry.content || '',
        status: 'CONFIRMED',
        uid:
            eventId || entry.id
                ? `${encodeURIComponent(eventId || entry.id!)}@lms-calendar`
                : fallbackUid,
        stamp: { date: new Date() },
    })
        .trim()
        .replace(/^DTSTART[^\r\n]*/m, `DTSTART${format(start)}`)
        .replace(/^DTEND[^\r\n]*/m, `DTEND${format(end)}`);
    // A DTSTART-only timed event has zero duration under RFC 5545; equal DTEND is invalid.
    if (!allDay && start.toMillis() === end.toMillis())
        event = event.replace(/^DTEND[^\r\n]*(?:\r?\n)?/m, '');
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LMS Calendar//EN',
        event,
        'END:VCALENDAR',
        '',
    ].join('\r\n');
}
