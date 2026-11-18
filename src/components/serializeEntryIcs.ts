import { DateTime } from 'luxon';

import type { CalendarDate, CalendarEntry, CalendarTime } from '../lms-calendar.js';

const CRLF = '\r\n';

function escapeText(value: string): string {
    return value.replace(/\r\n?|[\\,;\n]/g, (part) =>
        part.startsWith('\r') || part === '\n' ? '\\n' : '\\' + part,
    );
}

/** RFC 5545 counts octets, including the space starting each continuation. */
function foldLine(line: string): string {
    let result = '';
    let octets = 0;
    for (const char of line) {
        const point = char.codePointAt(0)!;
        const size = point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
        if (octets + size > 75) {
            result += CRLF + ' ';
            octets = 1;
        }
        result += char;
        octets += size;
    }
    return result;
}

const utcStamp = "yyyyMMdd'T'HHmmss'Z'";
const icsFormat = (value: DateTime, pattern: string) =>
    value.toFormat(pattern, {
        locale: 'en-US',
        numberingSystem: 'latn',
        outputCalendar: 'gregory',
    });

/** Serialize one VEVENT. Floating endpoints have no UTC suffix; zoned ones use UTC.
 * Like ingestion, reject nonexistent and ambiguous local wall times.
 */
export function serializeEntryIcs(
    entry: CalendarEntry,
    allDay: boolean,
    eventId?: string,
    fallbackUid = 'legacy@lms-calendar',
): string {
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
            ? `;VALUE=DATE:${icsFormat(value, 'yyyyMMdd')}`
            : entry.timeZone
              ? `:${icsFormat(value.toUTC(), utcStamp)}`
              : `:${icsFormat(value, "yyyyMMdd'T'HHmmss")}`;
    const id = eventId || entry.id;
    const uid = id ? `${encodeURIComponent(id)}@lms-calendar` : fallbackUid;
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LMS Calendar//EN',
        'BEGIN:VEVENT',
        `UID:${escapeText(uid)}`,
        `DTSTAMP:${icsFormat(DateTime.utc(), utcStamp)}`,
        `DTSTART${format(start)}`,
        // A DTSTART-only timed event has zero duration; equal DTEND is invalid.
        ...(allDay || end.toMillis() > start.toMillis() ? [`DTEND${format(end)}`] : []),
        `SUMMARY:${escapeText(entry.heading ?? '')}`,
        `DESCRIPTION:${escapeText(entry.content ?? '')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'END:VCALENDAR',
        '',
    ]
        .map(foldLine)
        .join(CRLF);
}
