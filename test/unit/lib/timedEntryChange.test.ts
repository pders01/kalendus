import { expect } from 'chai';

import { expandEntries } from '../../../src/lib/calendarModel.js';
import { proposeTimedEntryChange } from '../../../src/lib/timedEntryChange.js';
import type { CalendarEntry } from '../../../src/lms-calendar.js';

const date = (year: number, month: number, day: number) => ({ year, month, day });
const time = (hour: number, minute = 0) => ({ hour, minute });
const entry = (start = date(2026, 3, 7), end = start): CalendarEntry => ({
    id: 'event-42',
    kind: 'timed',
    heading: 'Maintenance',
    date: { start, end },
    time: { start: time(9), end: time(10) },
});
const move = { kind: 'move' } as const;
const resizeStart = { kind: 'resize', edge: 'start' } as const;
const resizeEnd = { kind: 'resize', edge: 'end' } as const;

describe('proposeTimedEntryChange', () => {
    it('moves the complete event across midnight and preserves identity and caller metadata', () => {
        const start = Object.freeze({ ...date(2024, 2, 28), label: 'Check-in' });
        const end = Object.freeze({ ...date(2024, 2, 29), label: 'Check-out' });
        const source = Object.freeze({
            ...entry(start, end),
            date: Object.freeze({ start, end, calendarId: 'ops' }),
            time: Object.freeze({
                start: Object.freeze({ ...time(23, 45), precision: 'reported' }),
                end: Object.freeze({ ...time(1), precision: 'estimated' }),
                unit: 'wall clock',
            }),
            revision: 4,
        });
        const [first, second] = expandEntries([source]);
        // Gesture code must use the canonical record when the grab begins on a slice.
        expect(second.canonicalEntry).to.equal(source);
        expect(first.canonicalEntry).to.equal(source);
        const proposed = proposeTimedEntryChange(source, move, 30)!;
        expect(proposed).to.deep.equal({
            ...source,
            date: { ...source.date, start: { ...start, day: 29 } },
            time: {
                ...source.time,
                start: { ...source.time.start, ...time(0, 15) },
                end: { ...source.time.end, ...time(1, 30) },
            },
        });
        expect(proposed.revision).to.equal(4);
        expect(source.date.start.day).to.equal(28);
        expect(source.time.start.hour).to.equal(23);
    });

    it('resizes just one canonical endpoint across dates, including an exclusive midnight', () => {
        const source = entry(date(2026, 3, 7), date(2026, 3, 8));
        const shorter = proposeTimedEntryChange(source, resizeEnd, -600)!;
        expect(shorter.date).to.deep.equal(source.date);
        expect(shorter.time).to.deep.equal({ start: time(9), end: time(0) });
        expect(expandEntries([shorter])).to.have.length(1);

        const earlier = proposeTimedEntryChange(source, resizeStart, -600)!;
        expect(earlier.date).to.deep.equal({ start: date(2026, 3, 6), end: source.date.end });
        expect(earlier.time).to.deep.equal({ start: time(23), end: time(10) });
        expect(earlier.date.end).not.to.equal(source.date.end);
        expect(earlier.time.end).not.to.equal(source.time!.end);
    });

    it('rejects no-ops, fractional deltas, unsupported kinds and collapsed or reversed resizes', () => {
        const source = entry();
        for (const delta of [0, 0.5, NaN, Infinity]) {
            expect(proposeTimedEntryChange(source, move, delta)).to.equal(undefined);
        }
        expect(proposeTimedEntryChange({ ...source, kind: 'all-day' }, move, 15)).to.equal(
            undefined,
        );
        expect(proposeTimedEntryChange({ ...source, kind: undefined }, move, 15)).to.equal(
            undefined,
        );
        expect(proposeTimedEntryChange(source, { kind: 'copy' } as never, 15)).to.equal(undefined);
        expect(proposeTimedEntryChange(source, { kind: 'resize' } as never, 15)).to.equal(
            undefined,
        );
        expect(proposeTimedEntryChange(source, resizeEnd, -60)).to.equal(undefined);
        expect(proposeTimedEntryChange(source, resizeStart, 61)).to.equal(undefined);
    });

    it('moves point events and handles the allowed end-of-day boundary without invalid dates', () => {
        const point = { ...entry(), time: { start: time(9), end: time(9) } };
        expect(proposeTimedEntryChange(point, move, -15)?.time).to.deep.equal({
            start: time(8, 45),
            end: time(8, 45),
        });
        const lastDay = date(9999, 12, 31);
        const last = {
            ...entry(lastDay),
            date: { start: lastDay, end: { ...lastDay, label: 'Final day' } },
            time: {
                start: { ...time(23), precision: 'estimated' },
                end: { ...time(23, 45), precision: 'reported' },
                unit: 'wall clock',
            },
        };
        const toBoundary = proposeTimedEntryChange(last, resizeEnd, 15);
        expect(toBoundary).to.deep.equal({
            ...last,
            time: { ...last.time, end: { ...last.time.end, ...time(24) } },
        });
        expect(proposeTimedEntryChange(last, move, 15)?.time).to.deep.equal({
            ...last.time,
            start: { ...last.time.start, ...time(23, 15) },
            end: { ...last.time.end, ...time(24) },
        });
        expect(proposeTimedEntryChange(last, resizeEnd, 16)).to.equal(undefined);
        expect(proposeTimedEntryChange(last, move, 16)).to.equal(undefined);
        expect(proposeTimedEntryChange(entry(date(1, 1, 1)), move, -541)).to.equal(undefined);
    });

    it('preserves zoned wall time, rejects gap and repeat endpoints, and never assigns a zone to floating entries', () => {
        const zone = 'America/New_York';
        const spring = {
            ...entry(date(2026, 3, 7)),
            time: { start: time(1, 30), end: time(2, 30) },
            timeZone: zone,
        };
        expect(proposeTimedEntryChange(spring, move, 1440)).to.equal(undefined);
        const floating = proposeTimedEntryChange({ ...spring, timeZone: undefined }, move, 1440)!;
        expect(floating.timeZone).to.equal(undefined);
        expect(floating.time).to.deep.equal(spring.time);
        const autumn = { ...spring, date: entry(date(2026, 10, 31)).date };
        expect(proposeTimedEntryChange(autumn, move, 1440)).to.equal(undefined);
        const valid = proposeTimedEntryChange(spring, move, 1440 + 120)!;
        expect(valid.timeZone).to.equal(zone);
        expect(valid.time).to.deep.equal({ start: time(3, 30), end: time(4, 30) });
    });
});
