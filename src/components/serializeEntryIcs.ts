import { DateTime, IANAZone } from 'luxon';

import {
    isSyntheticEntryId,
    isValidCalendarDate,
    isValidCalendarTime,
} from '../lib/calendarModel.js';
import type { CalendarEntry, CalendarTime } from '../lms-calendar.js';

const CRLF = '\r\n';
const generatedUids = new WeakMap<object, string>();

function portableUid(entry: CalendarEntry, eventId: string | undefined, identity: object): string {
    const id = eventId && !isSyntheticEntryId(entry, eventId) ? eventId : entry.id;
    if (id) return `${encodeURIComponent(id)}@lms-calendar`;
    let uid = generatedUids.get(identity);
    if (!uid) {
        // Available even in non-secure browser contexts. Use a separate namespace from caller IDs.
        const random = crypto.getRandomValues(new Uint32Array(4));
        const hex = Array.from(random, (part) => part.toString(16).padStart(8, '0')).join('');
        uid = `${hex}@generated.lms-calendar`;
        generatedUids.set(identity, uid);
    }
    return uid;
}

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
    identity: object = entry,
): string {
    const {
        timeZone,
        date: { start: startDate, end: endDate },
    } = entry;
    if (!isValidCalendarDate(startDate) || !isValidCalendarDate(endDate))
        throw new Error('Invalid event date interval');
    const civilStart = DateTime.utc(startDate.year, startDate.month, startDate.day);
    const civilEnd = DateTime.utc(endDate.year, endDate.month, endDate.day);
    if (civilEnd < civilStart) throw new Error('Invalid event date interval');
    let start = civilStart;
    let end = civilEnd.plus({ days: 1 });
    if (!allDay) {
        if (
            timeZone !== undefined &&
            (typeof timeZone !== 'string' || !IANAZone.isValidZone(timeZone))
        )
            throw new Error('Invalid IANA time zone');
        if (!entry.time) throw new Error('Timed events require a time interval');
        if (!isValidCalendarTime(entry.time.start) || !isValidCalendarTime(entry.time.end, true))
            throw new Error('Invalid event time');
        const endpoint = (date: DateTime, time: CalendarTime) => {
            const target = time.hour === 24 ? date.plus({ days: 1 }) : date;
            const hour = time.hour === 24 ? 0 : time.hour;
            const result = DateTime.fromObject(
                {
                    year: target.year,
                    month: target.month,
                    day: target.day,
                    hour,
                    minute: time.minute,
                },
                { zone: timeZone ?? 'UTC' },
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
        start = endpoint(civilStart, entry.time.start);
        end = endpoint(civilEnd, entry.time.end);
        if (end < start) throw new Error('Event end precedes start');
        if (timeZone) {
            start = start.toUTC();
            end = end.toUTC();
        }
    }
    const format = (value: DateTime) =>
        allDay
            ? `;VALUE=DATE:${icsFormat(value, 'yyyyMMdd')}`
            : `:${icsFormat(value, timeZone ? utcStamp : "yyyyMMdd'T'HHmmss")}`;
    const hasFourDigitYear = (value: DateTime) => value.year >= 1 && value.year <= 9999;
    if (!hasFourDigitYear(start)) throw new RangeError('ICS DTSTART is outside years 1–9999');
    let endProperty: string | undefined;
    // A DTSTART-only timed event has zero duration; equal DTEND is invalid.
    if (end.toMillis() > start.toMillis()) {
        if (hasFourDigitYear(end)) {
            endProperty = `DTEND${format(end)}`;
        } else {
            // DATE needs whole days; timed differences are civil for floating values and UTC
            // for zoned values, measured after disambiguating both endpoints.
            const duration = end.diff(
                start,
                allDay ? 'days' : ['days', 'hours', 'minutes', 'seconds'],
            );
            endProperty = `DURATION:${duration.toISO()}`;
        }
    }
    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//LMS Calendar//EN',
        'BEGIN:VEVENT',
        `UID:${escapeText(portableUid(entry, eventId, identity))}`,
        `DTSTAMP:${icsFormat(DateTime.utc(), utcStamp)}`,
        `DTSTART${format(start)}`,
        ...(endProperty ? [endProperty] : []),
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

/** Run browser download setup only after the cancelable default action is accepted. */
export function saveEntryIcs(
    entry: CalendarEntry,
    allDay: boolean,
    eventId?: string,
    heading?: string,
    identity: object = entry,
) {
    const ics = serializeEntryIcs(entry, allDay, eventId, identity);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(heading || 'event').replace(/[\\/:*?"<>|]/g, '-')}.ics`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}
