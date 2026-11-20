import { expect } from 'chai';

import { prepareAgendaEntries } from '../../../src/lib/agendaEntries.js';
import { joinVisibleSpans, layoutAllDaySegments } from '../../../src/lib/allDayLayout.js';
import { expandEntries, type CalendarModelEntryInput } from '../../../src/lib/calendarModel.js';
import { buildMonthPreviews } from '../../../src/lib/monthPreviews.js';
import {
    gainsTimedDetail,
    getDenseTimedGroups,
    layoutTimedEntries,
} from '../../../src/lib/timedLayout.js';
import { getMonthCalendarArray } from '../../../src/lib/weekStartHelper.js';

const date = (day: number) => ({ year: 2026, month: 11, day });
const allDay = (id: string, start = 17, end = start): CalendarModelEntryInput => ({
    id,
    heading: id,
    kind: 'all-day',
    date: { start: date(start), end: date(end) },
});
const timed = (id: string, hour: number, day = 17): CalendarModelEntryInput => ({
    id,
    heading: id,
    kind: 'timed',
    date: { start: date(day), end: date(day) },
    time: { start: { hour, minute: 0 }, end: { hour: hour + 1, minute: 0 } },
});
const segments = (entries: CalendarModelEntryInput[]) =>
    Object.freeze(
        expandEntries(entries).map((entry) =>
            Object.freeze({ ...entry, originalIndex: entries.indexOf(entry.sourceEntry) }),
        ),
    );
const ids = (entries: readonly { sourceId: string }[]) => entries.map((entry) => entry.sourceId);

describe('Timed layout data', () => {
    const geometry = { minuteHeight: 0.8, eventMinHeight: 24 };
    const at = (minute: number) => ({ hour: Math.floor(minute / 60), minute: minute % 60 });
    const interval = (id: string, start: number, end: number): CalendarModelEntryInput => ({
        ...timed(id, 0),
        time: { start: at(start), end: at(end) },
    });

    it('fits a late marker label without changing the displayed or canonical endpoints', () => {
        const endingAtMidnight: CalendarModelEntryInput = {
            ...interval('late', 1430, 0),
            date: { start: date(17), end: date(18) },
        };
        const input = segments([endingAtMidnight]);
        expect(input).to.have.length(1);
        const [segment] = input;
        const fractionalGeometry = { ...geometry, eventMinHeight: 25 };
        const [card] = layoutTimedEntries(input, fractionalGeometry, false).boxes;
        const [marker] = layoutTimedEntries(input, fractionalGeometry, true).boxes;

        expect(card.y).to.be.closeTo(1430 * geometry.minuteHeight, 1e-9);
        expect(marker.y).to.be.closeTo(1408 * geometry.minuteHeight, 1e-9);
        expect(marker.y + marker.height).to.be.closeTo(1440 * geometry.minuteHeight, 1e-9);
        expect(marker.id).to.equal(segment.segmentId);
        expect(segment.time).to.deep.equal({ start: at(1430), end: at(1440) });
        expect(segment.canonicalEntry).to.equal(endingAtMidnight);
        expect(endingAtMidnight.date.end).to.deep.equal(date(18));
        expect(endingAtMidnight.time).to.deep.equal({ start: at(1430), end: at(0) });
    });

    it('keeps touching minimum-height boxes separate and reports them in input order', () => {
        const input = segments([interval('later', 570, 575), interval('earlier', 540, 545)]);
        const { boxes } = layoutTimedEntries(input, geometry, false);
        expect(boxes.map((box) => box.id)).to.deep.equal(input.map((entry) => entry.segmentId));
        expect(boxes.map((box) => box.durationMinutes)).to.deep.equal([30, 30]);
        expect(boxes.map((box) => box.columnCount)).to.deep.equal([1, 1]);
        expect(boxes[1].y + boxes[1].height).to.equal(boxes[0].y);
        expect(boxes[0].group).not.to.equal(boxes[1].group);
    });

    it('prefers scrollable detail when fitting creates or joins groups', () => {
        const hourly = segments([
            interval('early', 540, 545),
            interval('middle', 600, 605),
            interval('late', 660, 665),
        ]);
        expect(gainsTimedDetail(hourly, 0.3, 0.75, 42, 200, 128)).to.equal(true);
        expect(gainsTimedDetail(hourly, 0.3, 0.75, 42, 400, 128)).to.equal(false);

        const twoGroups = segments([
            interval('a', 480, 540),
            interval('b', 480, 540),
            interval('c', 555, 615),
            interval('d', 555, 615),
        ]);
        expect(gainsTimedDetail(twoGroups, 0.3, 0.75, 42, 200, 128)).to.equal(true);
        expect(gainsTimedDetail(twoGroups.slice(0, 2), 0.3, 0.75, 42, 200, 128)).to.equal(false);
    });

    it('uses peak lane count to disclose an entire connected group only below the width threshold', () => {
        const input = segments([
            interval('c', 580, 610),
            interval('single', 660, 690),
            interval('a', 540, 570),
            interval('b', 560, 590),
        ]);
        const { boxes } = layoutTimedEntries(input, geometry, false);
        expect(boxes.map((box) => box.columnCount)).to.deep.equal([2, 1, 2, 2]);
        expect(getDenseTimedGroups(boxes, 256, 128).size).to.equal(0);
        expect([...getDenseTimedGroups(boxes, 255, 128)]).to.deep.equal([
            [boxes[0].group, [0, 2, 3]],
        ]);
        expect([...getDenseTimedGroups(boxes, 100, 128).values()]).to.deep.equal([[0, 2, 3]]);
    });
});

describe('All-day placements', () => {
    it('allocates visible lanes without reordering or replacing input segments', () => {
        const span = allDay('span', 16, 20);
        const input = segments([span, allDay('single', 19)]);
        const entryOn = (day: number) =>
            input.find((entry) => entry.sourceId === 'span' && entry.date.start.day === day)!;
        const visible = [
            input.find((entry) => entry.sourceId === 'single')!,
            entryOn(19),
            entryOn(18),
            entryOn(17),
        ];
        const layout = layoutAllDaySegments(
            visible.map((entry) => Object.freeze({ entry, column: entry.date.start.day - 17 })),
        );
        expect(layout.totalRows).to.equal(2);
        expect(layout.placements.map(({ row, column }) => [row, column])).to.deep.equal([
            [1, 2],
            [0, 2],
            [0, 1],
            [0, 0],
        ]);
        layout.placements.forEach(({ entry }, index) => expect(entry).to.equal(visible[index]));
        expect(layout.placements[1].entry.canonicalEntry).to.equal(span);
        expect(layoutAllDaySegments([])).to.deep.equal({ placements: [], totalRows: 0 });
    });

    it('joins only adjacent visible dates in one week row and never joins timed segments', () => {
        const span = allDay('span', 14, 19);
        const overnight: CalendarModelEntryInput = {
            ...timed('overnight', 22),
            date: { start: date(17), end: date(18) },
            time: { start: { hour: 22, minute: 0 }, end: { hour: 8, minute: 0 } },
        };
        const parts = segments([span, overnight]).filter((entry) =>
            entry.isAllDay ? entry.date.start.day !== 17 : true,
        );
        const runs = joinVisibleSpans(
            parts.map((entry) => ({
                entry,
                row: 0,
                column: entry.date.start.day - 9,
            })),
        );
        expect(
            runs.map(({ entry, end, length }) => [
                entry.sourceId,
                entry.date.start.day,
                end.date.end.day,
                length,
            ]),
        ).to.deep.equal([
            ['span', 14, 15, 2],
            ['span', 16, 16, 1],
            ['span', 18, 19, 2],
            ['overnight', 17, 17, 1],
            ['overnight', 18, 18, 1],
        ]);
        expect(runs[0].entry.canonicalEntry).to.equal(span);
    });
});

describe('Month preview data', () => {
    it('keeps sparse span lanes, with timed rows after the last occupied lane', () => {
        const span = allDay('span', 16, 18);
        const input = segments([
            allDay('a', 16, 17),
            allDay('b', 16, 17),
            span,
            timed('timed', 9, 18),
        ]);
        const dates = getMonthCalendarArray(date(17), 1);
        const rows = buildMonthPreviews(dates, input);
        expect(Object.keys(rows)).to.deep.equal(
            dates.map(({ year, month, day }) => `${year}-${month}-${day}`),
        );
        const day = rows['2026-11-18'];
        expect(day).to.have.length(4);
        expect(day[0]).to.equal(undefined);
        expect(day[1]).to.equal(undefined);
        expect(day[2]).to.equal(
            input.find((entry) => entry.sourceId === 'span' && entry.date.start.day === 18),
        );
        expect(day[2]?.canonicalEntry).to.equal(span);
        expect(day[3]?.sourceId).to.equal('timed');
    });

    it('preserves the existing priority of continuing timed spans in Month previews', () => {
        const early = timed('early', 8);
        const overnight: CalendarModelEntryInput = {
            ...timed('overnight', 22),
            date: { start: date(17), end: date(18) },
            time: { start: { hour: 22, minute: 0 }, end: { hour: 8, minute: 0 } },
        };
        const rows = buildMonthPreviews(
            getMonthCalendarArray(date(17), 1),
            segments([early, overnight]),
        );
        expect(rows['2026-11-17'].map((row) => row?.sourceId)).to.deep.equal([
            'overnight',
            'early',
        ]);
        expect(rows['2026-11-18'][0]?.canonicalEntry).to.equal(overnight);
    });
});

describe('Agenda page data', () => {
    const options = { limit: 3, perSection: false, expanded: false };
    const input = segments([
        timed('late', 12),
        timed('early-a', 8),
        allDay('all-day-a'),
        timed('early-b', 8),
        allDay('all-day-b'),
        allDay('all-day-c'),
        allDay('all-day-d'),
    ]);

    it('applies independent accordion pages and keeps equal start times in source order', () => {
        const page = prepareAgendaEntries(input, { ...options, perSection: true });
        expect(ids(page.allDay)).to.deep.equal(['all-day-a', 'all-day-b', 'all-day-c']);
        expect(ids(page.timed)).to.deep.equal(['early-a', 'early-b', 'late']);
        expect(page.timed[0]).to.equal(input.find((entry) => entry.sourceId === 'early-a'));
        expect(page.total).to.equal(7);
        expect(page.remaining).to.equal(1);
        expect(page.disclosure).to.equal(false);
    });

    it('uses one shared quota for full and density lists', () => {
        const page = prepareAgendaEntries(input, { ...options, limit: 5 });
        expect(page.allDay).to.have.length(4);
        expect(ids(page.timed)).to.deep.equal(['early-a']);
        expect(page.remaining).to.equal(2);
    });

    it('keeps collapsed preview, on-demand and continuation policies separate', () => {
        const preview = { ...options, limit: 5, previewSize: 3 };
        expect(prepareAgendaEntries(input.slice(0, 3), preview).disclosure).to.equal(false);
        const collapsed = prepareAgendaEntries(input, preview);
        expect(collapsed.disclosure).to.equal(true);
        expect(collapsed.allDay.length + collapsed.timed.length).to.equal(3);
        expect(collapsed.remaining).to.equal(0);
        const expanded = prepareAgendaEntries(input, { ...preview, expanded: true });
        expect(expanded.disclosure).to.equal(true);
        expect(expanded.remaining).to.equal(2);
        const onDemand = prepareAgendaEntries(input, { ...options, previewSize: 0 });
        expect(onDemand).to.deep.equal({
            allDay: [],
            timed: [],
            total: 7,
            disclosure: true,
            remaining: 0,
        });
        expect(prepareAgendaEntries([], { ...options, previewSize: 0 }).disclosure).to.equal(false);
    });

    it('filters density lists to all-day events or exact selected segments', () => {
        const allDayPage = prepareAgendaEntries(input, { ...options, allDayOnly: true });
        expect(allDayPage.total).to.equal(4);
        expect(allDayPage.timed).to.have.length(0);
        const segment = input.find((entry) => entry.sourceId === 'early-b')!;
        const scoped = prepareAgendaEntries(input, {
            ...options,
            segmentIds: new Set([segment.segmentId]),
        });
        expect(scoped.total).to.equal(1);
        expect(scoped.timed[0]).to.equal(segment);
        expect(prepareAgendaEntries(input, { ...options, segmentIds: new Set() }).total).to.equal(
            0,
        );
    });
});
