import { expect } from 'chai';

import { expandEntries, type CalendarModelEntryInput } from '../../../src/lib/calendarModel.js';
import { buildMonthSpans, formatMonthSpanRange } from '../../../src/lib/monthSpans.js';
import { getMonthCalendarArray } from '../../../src/lib/weekStartHelper.js';

const active = { year: 2026, month: 11, day: 17 };
const date = (day: number) => ({ ...active, day });
const days = getMonthCalendarArray(active, 1);
const allDay = (id: string, start: number, end: number): CalendarModelEntryInput => ({
    id,
    heading: id,
    kind: 'all-day',
    date: { start: date(start), end: date(end) },
});

describe('Compact Month continuity bands', () => {
    it('keeps a single identity and correct coverage across three weekly fragments', () => {
        const source = allDay('residency', 13, 23);
        const segments = expandEntries([source]);
        const before = JSON.stringify(segments);
        const spans = buildMonthSpans(days, segments).flat();
        expect(spans.map((span) => [span.startColumn, span.endColumn])).to.deep.equal([
            [4, 6],
            [0, 6],
            [0, 0],
        ]);
        expect(spans.map((span) => span.entry.continuation.index)).to.deep.equal([0, 3, 10]);
        expect(new Set(spans.map((span) => span.entry.occurrenceId)).size).to.equal(1);
        expect(spans.every((span) => span.entry.canonicalEntry === source)).to.equal(true);
        expect(new Set(spans.map((span) => formatMonthSpanRange(span.entry, 'en'))).size).to.equal(
            1,
        );
        expect(JSON.stringify(segments)).to.equal(before);
        expect(Object.isFrozen(source)).to.equal(false);
    });

    it('represents continuous timed events, not just all-day spans', () => {
        const segments = expandEntries([
            {
                ...allDay('overnight', 16, 17),
                kind: 'timed',
                time: { start: { hour: 23, minute: 50 }, end: { hour: 0, minute: 10 } },
            },
        ]);
        const span = buildMonthSpans(days, segments).flat()[0];
        expect(span.entry.isAllDay).to.equal(false);
        expect([span.startColumn, span.endColumn]).to.deep.equal([0, 1]);
    });

    it('does not paint a midnight-exclusive end date as occupied', () => {
        const segments = expandEntries([
            {
                ...allDay('midnight', 16, 18),
                kind: 'timed',
                time: { start: { hour: 10, minute: 0 }, end: { hour: 0, minute: 0 } },
            },
        ]);
        const span = buildMonthSpans(days, segments).flat()[0];
        expect([span.startColumn, span.endColumn]).to.deep.equal([0, 1]);
        expect(span.entry.continuation.total).to.equal(2);
        expect(formatMonthSpanRange(span.entry, 'en'))
            .to.include('16')
            .and.include('17')
            .and.not.include('18');
    });

    it('leaves one-day events as activity rather than turning on full previews', () => {
        const segments = expandEntries([allDay('one-day', 17, 17)]);
        expect(buildMonthSpans(days, segments).flat()).to.have.length(0);
        expect(formatMonthSpanRange(segments[0], 'en')).to.equal('');
    });

    it('separates overlapping spans but reuses lanes for disjoint spans', () => {
        const spans = buildMonthSpans(
            days,
            expandEntries([
                allDay('first', 16, 17),
                allDay('second', 19, 20),
                allDay('overlap', 16, 20),
            ]),
        ).flat();
        const row = (id: string) => spans.find((span) => span.entry.sourceId === id)!.row;
        expect(row('first')).to.equal(row('second'));
        expect(row('overlap')).not.to.equal(row('first'));
    });

    it('does not hide an ongoing span behind later starts at a week boundary', () => {
        const spans = buildMonthSpans(
            days,
            expandEntries([
                allDay('residency', 13, 23),
                allDay('a-exhibition', 16, 19),
                allDay('b-visit', 16, 17),
                allDay('a-survey', 21, 24),
            ]),
        ).flat();
        expect(
            spans.filter((span) => span.entry.sourceId === 'residency').map((span) => span.row),
        ).to.deep.equal([0, 0, 0]);
    });

    it('keeps the second individual lane when earlier occupants finish before a new week', () => {
        const spans = buildMonthSpans(
            days,
            expandEntries([
                allDay('early', 13, 15),
                allDay('continuation', 14, 24),
                allDay('later', 16, 17),
            ]),
        ).flat();
        expect(
            spans.filter((span) => span.entry.sourceId === 'continuation').map((span) => span.row),
        ).to.deep.equal([1, 1, 1]);
    });

    it('uses a bounded overflow signal instead of allocating invisible high-density lanes', () => {
        const spans = buildMonthSpans(
            days,
            expandEntries(Array.from({ length: 1000 }, (_, n) => allDay(`dense-${n}`, 16, 17))),
        ).flat();
        expect(spans).to.have.length(1000);
        expect(spans.filter((span) => span.row === 0)).to.have.length(1);
        expect(spans.filter((span) => span.row === 1)).to.have.length(1);
        expect(spans.filter((span) => span.row === 2)).to.have.length(998);
    });

    it('is deterministic even if the already-expanded input is reversed', () => {
        const segments = expandEntries([allDay('first', 13, 23), allDay('second', 14, 20)]);
        expect(buildMonthSpans(days, [...segments].reverse())).to.deep.equal(
            buildMonthSpans(days, segments),
        );
    });

    it('respects a Sunday-first calendar rather than hardcoding Monday columns', () => {
        const spans = buildMonthSpans(
            getMonthCalendarArray(active, 0),
            expandEntries([allDay('weekend', 14, 16)]),
        ).flat();
        expect(spans.map((span) => [span.startColumn, span.endColumn])).to.deep.equal([
            [6, 6],
            [0, 1],
        ]);
    });

    it('retains continuation context while expanding only a visible slice of a long event', () => {
        const source: CalendarModelEntryInput = {
            id: 'long',
            heading: 'Long event',
            kind: 'all-day',
            date: {
                start: { year: 2020, month: 1, day: 1 },
                end: { year: 2030, month: 12, day: 31 },
            },
        };
        const segments = expandEntries([source], { start: '2026-10-26', end: '2026-12-07' });
        expect(segments).to.have.length(42);
        const spans = buildMonthSpans(days, segments).flat();
        expect(spans).to.have.length(6);
        expect(
            spans.every(
                (span) =>
                    span.entry.continuation.index > 0 &&
                    span.startColumn === 0 &&
                    span.endColumn === 6,
            ),
        ).to.equal(true);
        expect(formatMonthSpanRange(spans[0].entry, 'en')).to.include('2020').and.include('2030');
    });

    it('does not format the exclusive year-10000 sentinel as an occupied date', () => {
        const date = { year: 9999, month: 12, day: 31 };
        const source: CalendarModelEntryInput = {
            id: 'edge',
            heading: 'Year boundary event',
            kind: 'all-day',
            date: { start: { ...date, day: 29 }, end: date },
        };
        const segments = expandEntries([source], { start: '9999-12-01', end: '10000-01-01' });
        const spans = buildMonthSpans(getMonthCalendarArray(date, 1), segments).flat();
        expect(spans.length).to.be.greaterThan(0);
        for (const span of spans)
            expect(formatMonthSpanRange(span.entry, 'en'))
                .to.include('9999')
                .and.not.include('10000');
    });
});
