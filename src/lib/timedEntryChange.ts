import type {
    CalendarDate,
    CalendarEntry,
    CalendarTime,
    CalendarTimeInterval,
} from '../lms-calendar.js';
import { addCivilDays, civilDayDifference, normalizeEntries } from './calendarModel.js';

export type TimedEntryOperation = { kind: 'move' } | { kind: 'resize'; edge: 'start' | 'end' };

type Endpoint = { date: CalendarDate; time: CalendarTime };
type TimedCandidate<T extends CalendarEntry> = Omit<T, 'kind' | 'date' | 'time'> & {
    kind: 'timed';
    date: CalendarEntry['date'];
    time: CalendarTimeInterval;
};

const minutesPerDay = 1440;
const toMinute = ({ hour, minute }: CalendarTime) => hour * 60 + minute;

function shiftEndpoint(
    date: CalendarDate,
    time: CalendarTime,
    delta: number,
    isEnd: boolean,
): Endpoint {
    if (delta === 0) return { date: { ...date }, time: { ...time } };

    const total = toMinute(time) + delta;
    const days = Math.floor(total / minutesPerDay);
    const minute = total - days * minutesPerDay;
    try {
        return {
            date: addCivilDays(date, days),
            time: { hour: Math.floor(minute / 60), minute: minute % 60 },
        };
    } catch (error) {
        if (!(error instanceof RangeError) || !isEnd || minute !== 0) throw error;
        // The exclusive upper bound is representable as 9999-12-31 24:00.
        return { date: addCivilDays(date, days - 1), time: { hour: 24, minute: 0 } };
    }
}

/**
 * Produce a candidate for the entire original event, never its visible segment.
 * Delta is in civil grid minutes: a move preserves wall-clock duration and the
 * original zone (if any), while a resize changes only its chosen endpoint.
 * Return no candidate for invalid, unsupported, or unchanged schedules.
 */
export function proposeTimedEntryChange<T extends CalendarEntry>(
    entry: T,
    operation: TimedEntryOperation,
    deltaMinutes: number,
): TimedCandidate<T> | undefined {
    if (
        entry.kind !== 'timed' ||
        !entry.time ||
        (operation?.kind !== 'move' &&
            (operation?.kind !== 'resize' ||
                (operation.edge !== 'start' && operation.edge !== 'end'))) ||
        deltaMinutes === 0 ||
        !Number.isSafeInteger(deltaMinutes) ||
        !normalizeEntries([entry]).length
    ) {
        return undefined;
    }

    let start: Endpoint;
    let end: Endpoint;
    try {
        start = shiftEndpoint(
            entry.date.start,
            entry.time.start,
            operation.kind === 'move' || operation.edge === 'start' ? deltaMinutes : 0,
            false,
        );
        end = shiftEndpoint(
            entry.date.end,
            entry.time.end,
            operation.kind === 'move' || operation.edge === 'end' ? deltaMinutes : 0,
            true,
        );
    } catch (error) {
        if (error instanceof RangeError) return undefined;
        throw error;
    }
    const duration =
        civilDayDifference(start.date, end.date) * minutesPerDay +
        toMinute(end.time) -
        toMinute(start.time);
    // Point entries can move; resizing never collapses an interval to a point.
    if (operation.kind === 'resize' && duration <= 0) return undefined;

    const proposed: TimedCandidate<T> = {
        ...entry,
        kind: 'timed',
        date: { start: start.date, end: end.date },
        time: { start: start.time, end: end.time },
    };
    // Reuse ingestion rules, including DST gaps/repeated hours. Don't silently
    // shift, disambiguate, or turn an invalid drop into another local time.
    return normalizeEntries([proposed]).length ? proposed : undefined;
}
