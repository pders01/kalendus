import { DateTime, IANAZone } from 'luxon';

/** Civil dates are Gregorian values, never instants in the ambient time zone. */
export interface CivilDate {
    year: number;
    month: number;
    day: number;
}

export interface ModelTime {
    hour: number;
    minute: number;
}

export interface CalendarModelEntryInput {
    id?: string;
    kind?: 'all-day' | 'timed';
    date: { start: CivilDate; end: CivilDate };
    time?: { start: ModelTime; end: ModelTime };
    timeZone?: string;
    heading?: string;
    content?: string;
    color?: string;
    isContinuation?: boolean;
}

/** ISO dates form a half-open interval; only end may use the upper sentinel 10000-01-01. */
export interface CalendarDateRange {
    start: string;
    end: string;
}

export interface NormalizedCalendarEntry extends CalendarModelEntryInput {
    id: string;
    sourceId: string;
    occurrenceId: string;
    kind: 'all-day' | 'timed';
    temporalKind: 'all-day' | 'floating' | 'zoned' | 'legacy-daily';
    isAllDay: boolean;
    legacy: boolean;
    heading: string;
    content: string;
    color: string;
    /** The exact caller record, with original endpoints and any backend metadata. */
    sourceEntry: CalendarModelEntryInput;
    canonicalEntry: CalendarModelEntryInput;
    startDate: string;
    endDateExclusive: string;
    /** Civil day numbers in UTC, used only as a date arithmetic representation. */
    startDay: number;
    endDayExclusive: number;
}

export interface ExpandedCalendarEntry extends NormalizedCalendarEntry {
    segmentId: string;
    /** The displayed civil day, not the canonical event's date interval. */
    date: { start: CivilDate; end: CivilDate };
    time?: { start: ModelTime; end: ModelTime };
    isContinuation: boolean;
    continuation: { has: boolean; is: boolean; index: number; total: number };
}

export interface EntryValidationIssue {
    index: number;
    entry: unknown;
    reason: string;
}

const DAY_MS = 86_400_000;
const legacyIds = new WeakMap<object, string>();
let previousLegacyIds: WeakMap<object, Set<string>> | undefined;
// Preserve ID provenance independently of mutable caller records and synthetic IDs.
const normalizedRecords = new WeakMap<object, string | undefined>();
let nextLegacyId = 0;

/** Identify runtime-only IDs, including ones retained by an already-open inspector. */
export function isSyntheticEntryId(source: object, id: string): boolean {
    return legacyIds.get(source) === id || previousLegacyIds?.get(source)?.has(id) === true;
}

/** Prevent accidental unbounded eager expansion; supply a visible range instead. */
export const MAX_EXPANDED_SEGMENTS = 100_000;

/** Distinguish a recoverable expansion cap from an invalid caller-supplied range. */
export class CalendarExpansionError extends RangeError {
    constructor(
        public readonly code: 'segment-budget' | 'invalid-range',
        message: string,
    ) {
        super(message);
        this.name = 'CalendarExpansionError';
    }
}

const UPPER_BOUNDARY = '10000-01-01';
const UPPER_BOUNDARY_DAY = dayNumber({ year: 9999, month: 12, day: 31 }) + 1;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidCalendarDate(value: unknown): value is CivilDate {
    if (!isRecord(value)) return false;
    const { year, month, day } = value;
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false;
    if (
        (year as number) < 1 ||
        (year as number) > 9999 ||
        (month as number) < 1 ||
        (month as number) > 12
    )
        return false;
    return (
        (day as number) >= 1 &&
        (day as number) <= DateTime.utc(year as number, month as number).daysInMonth!
    );
}

/** 24:00 is allowed only as an end boundary, never as a time within a day. */
export function isValidCalendarTime(value: unknown, allowEndOfDay = false): value is ModelTime {
    if (!isRecord(value)) return false;
    const { hour, minute } = value;
    return (
        Number.isInteger(hour) &&
        Number.isInteger(minute) &&
        (minute as number) >= 0 &&
        (minute as number) <= 59 &&
        (((hour as number) >= 0 && (hour as number) <= 23) ||
            (allowEndOfDay && hour === 24 && minute === 0))
    );
}

/** Sortable ISO key for an already validated civil date. */
export function civilDateKey(date: CivilDate): string {
    return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export function calendarDateToISO(date: CivilDate): string {
    if (!isValidCalendarDate(date)) throw new RangeError('Invalid calendar date');
    return civilDateKey(date);
}

export function parseCalendarDate(value: unknown): CivilDate | undefined {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
    const date = {
        year: Number(value.slice(0, 4)),
        month: Number(value.slice(5, 7)),
        day: Number(value.slice(8, 10)),
    };
    return isValidCalendarDate(date) ? date : undefined;
}

function dayNumber(date: CivilDate): number {
    return DateTime.utc(date.year, date.month, date.day).toMillis() / DAY_MS;
}

function dateFromDay(day: number): CivilDate {
    const date = DateTime.fromMillis(day * DAY_MS, { zone: 'UTC' });
    return { year: date.year, month: date.month, day: date.day };
}

export function addCivilDays(date: CivilDate, days: number): CivilDate {
    if (!isValidCalendarDate(date) || !Number.isInteger(days))
        throw new RangeError('Invalid civil date arithmetic');
    const result = dateFromDay(dayNumber(date) + days);
    if (!isValidCalendarDate(result))
        throw new RangeError('Calendar date is outside supported years 1–9999');
    return result;
}

export function civilDayDifference(start: CivilDate, end: CivilDate): number {
    if (!isValidCalendarDate(start) || !isValidCalendarDate(end))
        throw new RangeError('Invalid calendar date');
    return dayNumber(end) - dayNumber(start);
}

function minutes(time: ModelTime): number {
    return time.hour * 60 + time.minute;
}

function copyDate(date: CivilDate): CivilDate {
    return { year: date.year, month: date.month, day: date.day };
}

function copyTime(time: ModelTime): ModelTime {
    return { hour: time.hour, minute: time.minute };
}

function validZonedEndpoint(date: CivilDate, time: ModelTime, zone: string): boolean {
    // Reject gaps (Luxon otherwise shifts them forward) and ambiguous repeated times.
    const targetDate = time.hour === 24 ? dateFromDay(dayNumber(date) + 1) : date;
    const hour = time.hour === 24 ? 0 : time.hour;
    const { year, month, day } = targetDate;
    const result = DateTime.fromObject({ year, month, day, hour, minute: time.minute }, { zone });
    return (
        result.isValid &&
        result.year === targetDate.year &&
        result.month === targetDate.month &&
        result.day === targetDate.day &&
        result.hour === hour &&
        result.minute === time.minute &&
        result.getPossibleOffsets().length === 1
    );
}

/**
 * Strict, non-throwing ingestion. Invalid records are dropped individually and may be
 * reported with onInvalid. First valid record wins for duplicate caller IDs or
 * repeated source objects, including mixed raw/normalized input. Caller IDs are
 * authoritative. Synthetic IDs survive reordering of the same object unless a
 * caller ID in the incoming array claims that ID; only the synthetic ID is replaced.
 * Distinct objects without caller IDs remain independent, even with identical data.
 *
 * Legacy date ends are inclusive; a supplied time is a repeated daily window.
 * Explicit timed endpoints describe one continuous interval (end is exclusive).
 * Explicit all-day date ends remain inclusive and any time field is ignored.
 * Zero-duration timed records are supported as point events with minimum geometry.
 */
export function normalizeEntries(
    entries: readonly unknown[],
    onInvalid?: (issue: EntryValidationIssue) => void,
): NormalizedCalendarEntry[] {
    if (!Array.isArray(entries)) return [];
    const result: NormalizedCalendarEntry[] = [];
    // Reserve caller IDs before allocating/reusing any fallback, regardless of order
    // or validity of the rest of a record. Trusted snapshots retain their provenance.
    const reservedIds = new Set<string>();
    for (const value of entries) {
        if (!isRecord(value)) continue;
        const id = normalizedRecords.has(value) ? normalizedRecords.get(value) : value.id;
        if (typeof id === 'string' && id.trim().length > 0) reservedIds.add(id);
    }
    const acceptedSources = new WeakSet<object>();
    const acceptedCallerIds = new Set<string>();
    const acceptedPublicIds = new Set<string>();
    const claimIdentity = (
        source: object,
        callerId: string | undefined,
        reject: (reason: string) => void,
    ): string | undefined => {
        if (acceptedSources.has(source)) {
            reject('Duplicate source object; first valid record wins');
            return undefined;
        }
        if (callerId !== undefined && acceptedCallerIds.has(callerId)) {
            reject('Duplicate entry ID; first valid record wins');
            return undefined;
        }
        let sourceId = callerId;
        if (sourceId === undefined) {
            sourceId = legacyIds.get(source);
            if (!sourceId || reservedIds.has(sourceId) || acceptedPublicIds.has(sourceId)) {
                if (sourceId) {
                    const previous = (previousLegacyIds ??= new WeakMap());
                    const ids = previous.get(source);
                    if (ids) ids.add(sourceId);
                    else previous.set(source, new Set([sourceId]));
                }
                do {
                    sourceId = `legacy:${++nextLegacyId}`;
                } while (reservedIds.has(sourceId) || acceptedPublicIds.has(sourceId));
                legacyIds.set(source, sourceId);
            }
        }
        acceptedSources.add(source);
        if (callerId !== undefined) acceptedCallerIds.add(callerId);
        acceptedPublicIds.add(sourceId);
        return sourceId;
    };
    entries.forEach((value, index) => {
        const reject = (reason: string) => onInvalid?.({ index, entry: value, reason });
        if (!isRecord(value)) {
            reject('Entry must be an object');
            return;
        }
        if (normalizedRecords.has(value)) {
            const normalized = value as unknown as NormalizedCalendarEntry;
            const callerId = normalizedRecords.get(value);
            const sourceId = claimIdentity(normalized.sourceEntry, callerId, reject);
            if (sourceId === undefined) return;
            if (sourceId === normalized.sourceId) {
                result.push(normalized);
            } else {
                // Re-key only owned identity fields; retain frozen temporal snapshots.
                const rebased = Object.freeze({
                    ...normalized,
                    id: sourceId,
                    sourceId,
                    occurrenceId: JSON.stringify(['legacy', sourceId]),
                });
                normalizedRecords.set(rebased, callerId);
                result.push(rebased);
            }
            return;
        }
        const { date, time, kind, timeZone, id } = value;
        if (!isRecord(date) || !isValidCalendarDate(date.start) || !isValidCalendarDate(date.end)) {
            reject('Invalid date interval');
            return;
        }
        if (kind !== undefined && kind !== 'all-day' && kind !== 'timed') {
            reject('Invalid temporal kind');
            return;
        }
        if (id !== undefined && (typeof id !== 'string' || id.trim().length === 0)) {
            reject('Invalid entry ID');
            return;
        }
        if (value.isContinuation !== undefined && typeof value.isContinuation !== 'boolean') {
            reject('Invalid continuation flag');
            return;
        }
        if (
            timeZone !== undefined &&
            (typeof timeZone !== 'string' || !IANAZone.isValidZone(timeZone))
        ) {
            reject('Invalid IANA time zone');
            return;
        }
        for (const field of ['heading', 'content', 'color'] as const) {
            if (value[field] !== undefined && typeof value[field] !== 'string') {
                reject(`Invalid ${field}`);
                return;
            }
        }
        const startDay = dayNumber(date.start);
        const endDay = dayNumber(date.end);
        if (startDay > endDay) {
            reject('Reversed date interval');
            return;
        }
        const legacy = kind === undefined;
        let normalizedTime: NormalizedCalendarEntry['time'];
        if (kind !== 'all-day' && time !== undefined) {
            if (
                !isRecord(time) ||
                !isValidCalendarTime(time.start) ||
                !isValidCalendarTime(time.end, true)
            ) {
                reject('Invalid time interval');
                return;
            }
            normalizedTime = { start: copyTime(time.start), end: copyTime(time.end) };
        }
        if (kind === 'timed' && !normalizedTime) {
            reject('Timed entry requires time endpoints');
            return;
        }
        if (normalizedTime) {
            const startMinute = minutes(normalizedTime.start);
            const endMinute = minutes(normalizedTime.end);
            if ((legacy || startDay === endDay) && endMinute < startMinute) {
                reject('Reversed time interval');
                return;
            }
            if (
                typeof timeZone === 'string' &&
                (!validZonedEndpoint(date.start, normalizedTime.start, timeZone) ||
                    !validZonedEndpoint(date.end, normalizedTime.end, timeZone))
            ) {
                reject('Nonexistent or ambiguous zoned endpoint');
                return;
            }
        }
        // Preserve documented legacy promotion; never apply it to explicit timed records.
        const isAllDay =
            kind === 'all-day' ||
            (legacy &&
                (!normalizedTime ||
                    startDay !== endDay ||
                    normalizedTime.end.hour - normalizedTime.start.hour >= 23 ||
                    value.isContinuation === true));
        let endDayExclusive = endDay + 1;
        if (
            kind === 'timed' &&
            normalizedTime &&
            minutes(normalizedTime.end) === 0 &&
            endDay > startDay
        ) {
            endDayExclusive = endDay;
        }
        const sourceId = claimIdentity(value, id as string | undefined, reject);
        if (sourceId === undefined) return;
        const sourceEntry = value as unknown as CalendarModelEntryInput;
        const normalized: NormalizedCalendarEntry = {
            id: sourceId,
            sourceId,
            occurrenceId: JSON.stringify([id === undefined ? 'legacy' : 'id', sourceId]),
            kind: isAllDay ? 'all-day' : 'timed',
            temporalKind:
                legacy && normalizedTime
                    ? 'legacy-daily'
                    : isAllDay
                      ? 'all-day'
                      : timeZone
                        ? 'zoned'
                        : 'floating',
            isAllDay,
            legacy,
            date: { start: copyDate(date.start), end: copyDate(date.end) },
            time: normalizedTime,
            timeZone: timeZone as string | undefined,
            heading: (value.heading as string | undefined) ?? '',
            content: (value.content as string | undefined) ?? '',
            color: (value.color as string | undefined) ?? '',
            sourceEntry,
            canonicalEntry: sourceEntry,
            startDay,
            endDayExclusive,
            startDate: calendarDateToISO(date.start),
            // ISO supports the exclusive upper boundary of the last supported year.
            endDateExclusive:
                endDayExclusive === UPPER_BOUNDARY_DAY
                    ? UPPER_BOUNDARY
                    : calendarDateToISO(dateFromDay(endDayExclusive)),
        };
        // Trusted normalized records can be reused without revalidating on every
        // viewport change. Freeze only owned snapshots, never the caller's record.
        Object.freeze(normalized.date.start);
        Object.freeze(normalized.date.end);
        Object.freeze(normalized.date);
        if (normalized.time) {
            Object.freeze(normalized.time.start);
            Object.freeze(normalized.time.end);
            Object.freeze(normalized.time);
        }
        Object.freeze(normalized);
        normalizedRecords.set(normalized, id as string | undefined);
        result.push(normalized);
    });
    return result;
}

/** Expand only the intersection with range. No offscreen per-day work is performed. */
export function expandEntries(
    entries: readonly unknown[],
    range?: CalendarDateRange,
): ExpandedCalendarEntry[] {
    let rangeStart = -Infinity;
    let rangeEnd = Infinity;
    if (range) {
        const start = parseCalendarDate(range.start);
        const end = parseCalendarDate(range.end);
        const endDay = range.end === UPPER_BOUNDARY ? UPPER_BOUNDARY_DAY : end && dayNumber(end);
        if (!start || endDay === undefined || endDay < dayNumber(start))
            throw new CalendarExpansionError('invalid-range', 'Invalid half-open visible range');
        rangeStart = dayNumber(start);
        rangeEnd = endDay;
    }
    const normalized = normalizeEntries(entries);
    const count = normalized.reduce(
        (sum, entry) =>
            sum +
            Math.max(
                0,
                Math.min(entry.endDayExclusive, rangeEnd) - Math.max(entry.startDay, rangeStart),
            ),
        0,
    );
    if (count > MAX_EXPANDED_SEGMENTS)
        throw new CalendarExpansionError(
            'segment-budget',
            'Expansion exceeds segment budget; supply a smaller visible range',
        );
    const expanded: ExpandedCalendarEntry[] = [];
    for (const entry of normalized) {
        const first = Math.max(entry.startDay, rangeStart);
        const end = Math.min(entry.endDayExclusive, rangeEnd);
        const total = entry.endDayExclusive - entry.startDay;
        for (let day = first; day < end; day++) {
            const index = day - entry.startDay;
            const date = dateFromDay(day);
            let time = entry.time && {
                start: copyTime(entry.time.start),
                end: copyTime(entry.time.end),
            };
            if (!entry.legacy && entry.kind === 'timed' && entry.time) {
                const canonicalEndDay = dayNumber(entry.date.end);
                time = {
                    start:
                        day === entry.startDay
                            ? copyTime(entry.time.start)
                            : { hour: 0, minute: 0 },
                    end:
                        day === canonicalEndDay
                            ? copyTime(entry.time.end)
                            : { hour: 24, minute: 0 },
                };
            }
            expanded.push({
                ...entry,
                segmentId: JSON.stringify([entry.occurrenceId, calendarDateToISO(date)]),
                date: { start: copyDate(date), end: copyDate(date) },
                time,
                isContinuation: index > 0,
                continuation: { has: index < total - 1, is: index > 0, index, total },
            });
        }
    }
    return expanded;
}
