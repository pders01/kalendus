import { expect } from 'chai';

import {
    addCivilDays,
    CalendarExpansionError,
    calendarDateToISO,
    civilDateKey,
    civilDayDifference,
    expandEntries,
    isValidCalendarDate,
    isValidCalendarTime,
    normalizeEntries,
    parseCalendarDate,
    type CalendarModelEntryInput,
    type EntryValidationIssue,
} from '../../../src/lib/calendarModel.js';

const date = (year: number, month: number, day: number) => ({ year, month, day });
const time = (hour: number, minute = 0) => ({ hour, minute });
function entry(start = date(2026, 3, 7), end = start): CalendarModelEntryInput {
    return { date: { start, end }, heading: 'Same title' };
}

describe('calendarModel', () => {
    describe('strict civil validation', () => {
        it('accepts real leap days and years below 100 without Date constructor remapping', () => {
            expect(isValidCalendarDate(date(2024, 2, 29))).to.equal(true);
            expect(calendarDateToISO(addCivilDays(date(4, 2, 28), 1))).to.equal('0004-02-29');
            expect(civilDayDifference(date(2024, 2, 28), date(2024, 3, 1))).to.equal(2);
        });
        it('orders lookup keys by civil date across year digit boundaries', () => {
            const first = civilDateKey(date(999, 12, 31));
            const second = civilDateKey(date(1000, 1, 1));
            expect(first).to.equal(calendarDateToISO(date(999, 12, 31)));
            expect([second, first].sort()).to.deep.equal(['0999-12-31', '1000-01-01']);
        });
        it('rejects impossible, fractional, nonfinite and malformed dates', () => {
            for (const value of [
                null,
                {},
                [],
                '2026-02-01',
                date(2026, 2, 29),
                date(2024, 2, 30),
                date(2026, 0, 1),
                date(2026, 13, 1),
                date(0, 1, 1),
                date(2026, 3, 1.5),
                date(NaN, 1, 1),
                { year: '2026', month: 1, day: 1 },
            ]) {
                expect(isValidCalendarDate(value), JSON.stringify(value)).to.equal(false);
            }
            expect(parseCalendarDate('2026-02-30')).to.equal(undefined);
            expect(parseCalendarDate('2026-2-01')).to.equal(undefined);
            expect(parseCalendarDate('2026-02-01T00:00:00Z')).to.equal(undefined);
        });
        it('allows only integer clock values and end-only 24:00', () => {
            expect(isValidCalendarTime(time(24))).to.equal(false);
            expect(isValidCalendarTime(time(24), true)).to.equal(true);
            for (const value of [
                time(-1),
                time(25),
                time(24, 1),
                time(9, 60),
                time(1.5),
                time(9, -1),
                null,
                { hour: '9', minute: 0 },
            ]) {
                expect(isValidCalendarTime(value, true)).to.equal(false);
            }
        });
        it('drops bad records individually and reports their original indices', () => {
            const good = entry();
            const issues: number[] = [];
            const result = normalizeEntries(
                [
                    null,
                    good,
                    { date: null },
                    entry(date(2026, 2, 30)),
                    entry(date(2026, 3, 10), date(2026, 3, 9)),
                    { ...good, kind: 'unknown' },
                    { ...good, content: 9 },
                ],
                (issue) => issues.push(issue.index),
            );
            expect(result).to.have.length(1);
            expect(result[0].sourceEntry).to.equal(good);
            expect(issues).to.deep.equal([0, 2, 3, 4, 5, 6]);
        });
        it('rejects reversed legacy windows and reversed same-day explicit intervals', () => {
            const reversed = { start: time(15), end: time(9) };
            expect(
                normalizeEntries([
                    { ...entry(), time: reversed },
                    { ...entry(), kind: 'timed', time: reversed },
                    { ...entry(date(2026, 3, 7), date(2026, 3, 9)), time: reversed },
                ]),
            ).to.deep.equal([]);
        });
        it('accepts absent content and time without mutating frozen caller input', () => {
            const input = Object.freeze({
                date: Object.freeze({
                    start: Object.freeze(date(2026, 3, 7)),
                    end: Object.freeze(date(2026, 3, 7)),
                }),
            });
            const result = expandEntries([input])[0];
            expect(result.heading).to.equal('');
            expect(result.content).to.equal('');
            expect(result.isAllDay).to.equal(true);
            expect(result.canonicalEntry).to.equal(input);
        });
    });

    describe('identity and canonical source', () => {
        it('distinguishes identical-looking legacy objects and preserves identity through reorder', () => {
            const a = entry();
            const b = entry();
            const first = normalizeEntries([a, b]);
            const reordered = normalizeEntries([b, a]);
            expect(first[0].id).not.to.equal(first[1].id);
            expect(reordered.map((e) => e.occurrenceId)).to.deep.equal([
                first[1].occurrenceId,
                first[0].occurrenceId,
            ]);
            expect(normalizeEntries([entry()])[0].id).not.to.equal(first[0].id);
        });
        it('prefers caller IDs across reconstructed objects and preserves backend metadata', () => {
            const source = { ...entry(), id: 'backend:42', calendarId: 'work' };
            const first = expandEntries([source])[0];
            const replaced = expandEntries([{ ...source }])[0];
            expect(first.id).to.equal('backend:42');
            expect(first.sourceId).to.equal('backend:42');
            expect(first.segmentId).to.equal(replaced.segmentId);
            expect(first.canonicalEntry).to.equal(source);
            expect(first.sourceEntry).to.equal(source);
            expect(first.canonicalEntry.date).to.equal(source.date);
        });
        it('keeps the first valid caller ID and reports later duplicates at their input indices', () => {
            const invalid = { ...entry(), id: 'same-id', content: 42 };
            const first = { ...entry(), id: 'same-id', heading: 'First valid' };
            const duplicate = { ...entry(), id: 'same-id', heading: 'Duplicate' };
            const issues: EntryValidationIssue[] = [];
            const normalized = normalizeEntries([invalid, first, duplicate], (issue) =>
                issues.push(issue),
            );
            expect(normalized).to.have.length(1);
            expect(normalized[0].sourceEntry).to.equal(first);
            expect(normalized[0].sourceId).to.equal('same-id');
            expect(issues.map((issue) => issue.index)).to.deep.equal([0, 2]);
            expect(issues[1].entry).to.equal(duplicate);
            expect(issues[1].reason).to.contain('Duplicate entry ID');
            const segments = expandEntries([invalid, first, duplicate]);
            expect(segments).to.have.length(1);
            expect(new Set(segments.map((segment) => segment.segmentId)).size).to.equal(
                segments.length,
            );
        });
        it('rejects repeated legacy references without merging distinct identical-looking objects', () => {
            const first = entry();
            const independent = entry();
            const issues: EntryValidationIssue[] = [];
            const normalized = normalizeEntries([first, first, independent, first], (issue) =>
                issues.push(issue),
            );
            expect(normalized.map((item) => item.sourceEntry)).to.deep.equal([first, independent]);
            expect(new Set(normalized.map((item) => item.sourceId)).size).to.equal(2);
            expect(issues.map((issue) => issue.index)).to.deep.equal([1, 3]);
            expect(
                issues.every((issue) => issue.reason.includes('Duplicate source object')),
            ).to.equal(true);
            expect(expandEntries([first, first, independent])).to.have.length(2);
        });
        it('deduplicates normalized arrays and raw/normalized mixtures in either order', () => {
            for (const withId of [false, true]) {
                const source = withId ? { ...entry(), id: 'mixed-id' } : entry();
                const first = normalizeEntries([source])[0];
                const second = normalizeEntries([source])[0];
                for (const inputs of [
                    [first, first],
                    [first, second],
                    [source, first],
                    [first, source],
                ]) {
                    const issues: EntryValidationIssue[] = [];
                    const normalized = normalizeEntries(inputs, (issue) => issues.push(issue));
                    expect(normalized).to.have.length(1);
                    expect(normalized[0].sourceEntry).to.equal(source);
                    expect(normalized[0].sourceId).to.equal(first.sourceId);
                    expect(issues.map((issue) => issue.index)).to.deep.equal([1]);
                    expect(expandEntries(inputs)).to.have.length(1);
                }
            }
        });
        it('applies first-record-wins to reconstructed authoritative records, including trusted snapshots', () => {
            const a = { ...entry(), id: 'authoritative' };
            const b = { ...entry(), id: a.id };
            const na = normalizeEntries([a])[0];
            const nb = normalizeEntries([b])[0];
            for (const inputs of [
                [na, nb],
                [nb, na],
                [na, b],
                [b, na],
            ]) {
                const issues: EntryValidationIssue[] = [];
                const normalized = normalizeEntries(inputs, (issue) => issues.push(issue));
                expect(normalized).to.have.length(1);
                expect(normalized[0].sourceEntry).to.equal(inputs[0] === na ? a : b);
                expect(normalized[0].id).to.equal(a.id);
                expect(issues[0].reason).to.contain('Duplicate entry ID');
                expect(expandEntries(inputs)).to.have.length(1);
            }
        });
        it('reserves every caller ID before allocating new legacy IDs in either input order', () => {
            for (const legacyFirst of [true, false]) {
                const seedId = normalizeEntries([entry()])[0].sourceId;
                const nextId = `legacy:${Number(seedId.split(':')[1]) + 1}`;
                const legacy = entry();
                const authoritative = { ...entry(), id: nextId };
                const inputs = legacyFirst ? [legacy, authoritative] : [authoritative, legacy];
                const normalized = normalizeEntries(inputs);
                const caller = normalized.find((item) => item.sourceEntry === authoritative)!;
                const fallback = normalized.find((item) => item.sourceEntry === legacy)!;
                expect(caller.sourceId).to.equal(nextId);
                expect(caller.id).to.equal(nextId);
                expect(fallback.sourceId).not.to.equal(nextId);
                expect(new Set(normalized.map((item) => item.sourceId)).size).to.equal(2);
                expect(authoritative.id).to.equal(nextId);
                expect(legacy.id).to.equal(undefined);
            }
        });
        it('reserves IDs even on invalid records without letting them claim the first valid slot', () => {
            const legacy = entry();
            const priorId = normalizeEntries([legacy])[0].sourceId;
            const invalid = { ...entry(), id: priorId, content: 42 };
            const normalized = normalizeEntries([legacy, invalid]);
            expect(normalized).to.have.length(1);
            expect(normalized[0].sourceId).not.to.equal(priorId);
        });
        it('re-keys reused fallback IDs when a later authoritative object claims them, regardless of input form/order', () => {
            for (const legacyNormalized of [false, true]) {
                for (const callerNormalized of [false, true]) {
                    for (const legacyFirst of [false, true]) {
                        const legacy = entry();
                        const prior = normalizeEntries([legacy])[0];
                        const caller = { ...entry(), id: prior.sourceId };
                        const fallbackInput = legacyNormalized ? prior : legacy;
                        const callerInput = callerNormalized
                            ? normalizeEntries([caller])[0]
                            : caller;
                        const inputs = legacyFirst
                            ? [fallbackInput, callerInput]
                            : [callerInput, fallbackInput];
                        const normalized = normalizeEntries(inputs);
                        expect(normalized).to.have.length(2);
                        const rebased = normalized.find((item) => item.sourceEntry === legacy)!;
                        const authoritative = normalized.find(
                            (item) => item.sourceEntry === caller,
                        )!;
                        expect(authoritative.sourceId).to.equal(prior.sourceId);
                        expect(rebased.sourceId).not.to.equal(authoritative.sourceId);
                        expect(new Set(normalized.map((item) => item.occurrenceId)).size).to.equal(
                            2,
                        );
                        expect(
                            new Set(expandEntries(normalized).map((item) => item.segmentId)).size,
                        ).to.equal(2);
                        expect(normalizeEntries([legacy])[0].sourceId).to.equal(rebased.sourceId);
                        expect(Object.isFrozen(rebased)).to.equal(true);
                        expect(Object.isFrozen(rebased.date.start)).to.equal(true);
                        expect(rebased.canonicalEntry).to.equal(legacy);
                        expect(prior.sourceId).to.equal(caller.id);
                        expect(legacy.id).to.equal(undefined);
                        expect(Object.isFrozen(legacy)).to.equal(false);
                    }
                }
            }
        });
        it('preserves normalized ID provenance and temporal snapshots after caller mutation', () => {
            const source = { ...entry(), id: 'original-id' };
            const normalized = normalizeEntries([source])[0];
            source.id = 'changed-id';
            source.date.start.day = 8;
            const result = normalizeEntries([normalized, { ...entry(), id: 'original-id' }]);
            expect(result).to.have.length(1);
            expect(result[0]).to.equal(normalized);
            expect(result[0].id).to.equal('original-id');
            expect(result[0].date.start.day).to.equal(7);
            expect(result[0].sourceEntry.id).to.equal('changed-id');
        });
        it('freezes owned normalized snapshots without freezing the canonical caller record', () => {
            const source = { ...entry(), kind: 'timed', time: { start: time(9), end: time(10) } };
            const normalized = normalizeEntries([source])[0];
            expect(Object.isFrozen(normalized)).to.equal(true);
            expect(Object.isFrozen(normalized.date.start)).to.equal(true);
            expect(Object.isFrozen(normalized.time!.start)).to.equal(true);
            expect(Object.isFrozen(source)).to.equal(false);
            expect(normalizeEntries([normalized])[0]).to.equal(normalized);
        });

        it('copies normalized dates/times while retaining original canonical endpoints', () => {
            const source = {
                ...entry(date(2026, 3, 7), date(2026, 3, 9)),
                kind: 'timed' as const,
                time: { start: time(23), end: time(1) },
            };
            const normalized = normalizeEntries([source]);
            const segments = expandEntries(normalized);
            expect(segments[1].canonicalEntry.date.end.day).to.equal(9);
            expect(segments[1].date.start.day).to.equal(8);
            segments[0].date.start.day = 1;
            segments[0].time!.start.hour = 9;
            expect(source.date.start.day).to.equal(7);
            expect(normalized[0].date.start.day).to.equal(7);
            expect(source.time.start.hour).to.equal(23);
            expect(segments[1].time!.start.hour).to.equal(0);
        });
    });

    describe('bounded civil expansion', () => {
        for (const zone of ['UTC', 'America/New_York', 'Europe/Berlin', 'Pacific/Apia']) {
            it(`preserves DST, leap, year and skipped civil dates under ${zone}`, () => {
                const previous = process.env.TZ;
                process.env.TZ = zone;
                try {
                    for (const [start, end, expected] of [
                        [
                            date(2026, 3, 7),
                            date(2026, 3, 9),
                            ['2026-03-07', '2026-03-08', '2026-03-09'],
                        ],
                        [
                            date(2026, 10, 31),
                            date(2026, 11, 2),
                            ['2026-10-31', '2026-11-01', '2026-11-02'],
                        ],
                        [
                            date(2026, 3, 28),
                            date(2026, 3, 30),
                            ['2026-03-28', '2026-03-29', '2026-03-30'],
                        ],
                        [
                            date(2026, 10, 24),
                            date(2026, 10, 26),
                            ['2026-10-24', '2026-10-25', '2026-10-26'],
                        ],
                        [
                            date(2024, 2, 28),
                            date(2024, 3, 1),
                            ['2024-02-28', '2024-02-29', '2024-03-01'],
                        ],
                        [date(2025, 12, 31), date(2026, 1, 1), ['2025-12-31', '2026-01-01']],
                        [
                            date(2011, 12, 29),
                            date(2011, 12, 31),
                            ['2011-12-29', '2011-12-30', '2011-12-31'],
                        ],
                    ] as const) {
                        const segments = expandEntries([entry(start, end)]);
                        expect(segments.map((e) => calendarDateToISO(e.date.start))).to.deep.equal(
                            expected,
                        );
                        expect(
                            segments.every((e) => e.continuation.total === expected.length),
                        ).to.equal(true);
                    }
                } finally {
                    if (previous === undefined) delete process.env.TZ;
                    else process.env.TZ = previous;
                }
            });
        }
        it('clips a 9999-year source before doing per-day work and retains absolute continuation indices', () => {
            const source = entry(date(1, 1, 1), date(9999, 12, 31));
            const result = expandEntries([source], { start: '2026-03-07', end: '2026-03-10' });
            expect(result).to.have.length(3);
            expect(result[0].continuation.index).to.equal(
                civilDayDifference(source.date.start, date(2026, 3, 7)),
            );
            expect(result[0].continuation.total).to.equal(3652059);
            expect(result[0].continuation.has).to.equal(true);
            expect(result[0].canonicalEntry).to.equal(source);
        });
        it('does not expand offscreen sources, and the end of the visible range is exclusive', () => {
            const source = entry(date(2026, 3, 1), date(2026, 3, 31));
            expect(
                expandEntries([source], { start: '2026-04-01', end: '2026-04-02' }),
            ).to.deep.equal([]);
            expect(
                expandEntries([source], { start: '2026-03-15', end: '2026-03-16' }).map(
                    (s) => s.date.start.day,
                ),
            ).to.deep.equal([15]);
            expect(
                expandEntries([source], { start: '2026-03-15', end: '2026-03-15' }),
            ).to.deep.equal([]);
        });
        it('rejects invalid ranges and unbounded eager expansion instead of truncating silently', () => {
            expect(() =>
                expandEntries([entry()], { start: '2026-02-30', end: '2026-03-01' }),
            ).to.throw(RangeError);
            expect(() =>
                expandEntries([entry()], { start: '2026-03-10', end: '2026-03-09' }),
            ).to.throw(RangeError);
            expect(() => expandEntries([entry(date(1, 1, 1), date(9999, 12, 31))])).to.throw(
                'segment budget',
            );
        });
        it('expands the final supported civil day using only the exclusive upper sentinel', () => {
            const source = entry(date(9999, 12, 30), date(9999, 12, 31));
            const range = { start: '9999-12-31', end: '10000-01-01' };
            const normalized = normalizeEntries([source]);
            expect(normalized[0].endDateExclusive).to.equal(range.end);
            for (const inputs of [[source], normalized]) {
                const result = expandEntries(inputs, range);
                expect(result.map((item) => calendarDateToISO(item.date.start))).to.deep.equal([
                    '9999-12-31',
                ]);
                expect(result[0].continuation).to.deep.equal({
                    has: false,
                    is: true,
                    index: 1,
                    total: 2,
                });
            }
            expect(
                expandEntries([source], { start: '9999-12-30', end: '9999-12-31' }),
            ).to.have.length(1);
            expect(parseCalendarDate('10000-01-01')).to.equal(undefined);
            expect(isValidCalendarDate(date(10000, 1, 1))).to.equal(false);
            expect(normalizeEntries([entry(date(10000, 1, 1))])).to.deep.equal([]);
            expect(() => addCivilDays(date(9999, 12, 31), 1)).to.throw(RangeError);
        });
        it('exports typed, RangeError-compatible failures for invalid ranges versus segment budgets', () => {
            for (const range of [
                { start: '2026-02-30', end: '2026-03-01' },
                { start: '2026-03-10', end: '2026-03-09' },
                { start: '10000-01-01', end: '10000-01-01' },
                { start: '9999-12-31', end: '10000-01-02' },
                { start: '9999-12-31', end: '+010000-01-01' },
                { start: '9999-12-31', end: '10001-01-01' },
            ]) {
                let thrown: unknown;
                try {
                    expandEntries([entry()], range);
                } catch (error) {
                    thrown = error;
                }
                expect(thrown).to.be.instanceOf(RangeError);
                expect(thrown).to.be.instanceOf(CalendarExpansionError);
                expect((thrown as CalendarExpansionError).code).to.equal('invalid-range');
                expect((thrown as Error).name).to.equal('CalendarExpansionError');
            }
            let thrown: unknown;
            try {
                expandEntries([entry(date(1, 1, 1), date(9999, 12, 31))]);
            } catch (error) {
                thrown = error;
            }
            expect(thrown).to.be.instanceOf(RangeError);
            expect(thrown).to.be.instanceOf(CalendarExpansionError);
            expect((thrown as CalendarExpansionError).code).to.equal('segment-budget');
            expect((thrown as Error).message).to.contain('segment budget');
        });
        it('bounds 10,000 long offscreen entries to zero generated segments', function () {
            this.timeout(10000);
            const inputs = Array.from({ length: 10000 }, (_, id) => ({
                ...entry(date(1, 1, 1), date(1900, 1, 1)),
                id: String(id),
            }));
            expect(expandEntries(inputs, { start: '2026-03-01', end: '2026-04-01' })).to.deep.equal(
                [],
            );
        });
    });

    describe('explicit temporal kinds and legacy compatibility', () => {
        it('slices a continuous overnight interval without all-day or continuation promotion', () => {
            const source = {
                ...entry(date(2026, 3, 7), date(2026, 3, 8)),
                kind: 'timed',
                time: { start: time(23), end: time(1) },
            };
            const result = expandEntries([source]);
            expect(result.map((e) => e.time)).to.deep.equal([
                { start: time(23), end: time(24) },
                { start: time(0), end: time(1) },
            ]);
            expect(result.map((e) => e.isAllDay)).to.deep.equal([false, false]);
            expect(result.map((e) => e.kind)).to.deep.equal(['timed', 'timed']);
            expect(result[1].isContinuation).to.equal(true);
            expect(result[1].canonicalEntry).to.equal(source);
            expect(new Set(result.map((e) => e.segmentId)).size).to.equal(2);
        });
        it('slices first/interior/last days and excludes an exact midnight endpoint', () => {
            const result = expandEntries([
                {
                    ...entry(date(2026, 3, 7), date(2026, 3, 9)),
                    kind: 'timed',
                    time: { start: time(23), end: time(1) },
                },
            ]);
            expect(result.map((e) => e.time)).to.deep.equal([
                { start: time(23), end: time(24) },
                { start: time(0), end: time(24) },
                { start: time(0), end: time(1) },
            ]);
            const fullDays = expandEntries([
                {
                    ...entry(date(2026, 3, 7), date(2026, 3, 9)),
                    kind: 'timed',
                    time: { start: time(0), end: time(0) },
                },
            ]);
            expect(fullDays).to.have.length(2);
            expect(fullDays.every((e) => e.kind === 'timed' && !e.isAllDay)).to.equal(true);
            expect(fullDays.map((e) => e.time!.end)).to.deep.equal([time(24), time(24)]);
        });
        it('keeps long and 24-hour explicit intervals timed, and permits point events', () => {
            for (const end of [time(23), time(23, 59), time(24), time(0)]) {
                const result = expandEntries([
                    { ...entry(), kind: 'timed', time: { start: time(0), end } },
                ]);
                expect(result).to.have.length(1);
                expect(result[0].isAllDay).to.equal(false);
                expect(result[0].time!.end).to.deep.equal(end);
            }
        });
        it('retains midnight points and continuous end-only 24:00 on the final supported day', () => {
            const finalDate = date(9999, 12, 31);
            const range = { start: '9999-12-31', end: '10000-01-01' };
            const point = {
                ...entry(finalDate),
                kind: 'timed',
                time: { start: time(0), end: time(0) },
            };
            const pointSegments = expandEntries([point], range);
            expect(pointSegments).to.have.length(1);
            expect(pointSegments[0].time).to.deep.equal(point.time);
            expect(pointSegments[0].isAllDay).to.equal(false);
            const continuous = {
                ...entry(date(9999, 12, 30), finalDate),
                kind: 'timed',
                time: { start: time(23), end: time(24) },
            };
            const result = expandEntries([continuous]);
            expect(result.map((item) => item.time)).to.deep.equal([
                { start: time(23), end: time(24) },
                { start: time(0), end: time(24) },
            ]);
            expect(expandEntries([continuous], range)).to.have.length(1);
            expect(result.every((item) => !item.isAllDay)).to.equal(true);
        });
        it('ignores time for explicit all-day input, even a malformed time', () => {
            const result = expandEntries([
                { ...entry(), kind: 'all-day', time: { start: time(25), end: null } },
            ]);
            expect(result).to.have.length(1);
            expect(result[0].time).to.equal(undefined);
            expect(result[0].temporalKind).to.equal('all-day');
        });
        it('retains inclusive legacy daily windows instead of reinterpreting them as continuous', () => {
            const source = {
                ...entry(date(2026, 3, 7), date(2026, 3, 9)),
                time: { start: time(9), end: time(17) },
            };
            const result = expandEntries([source]);
            expect(result).to.have.length(3);
            expect(result.every((e) => e.temporalKind === 'legacy-daily' && e.isAllDay)).to.equal(
                true,
            );
            expect(result.map((e) => e.time)).to.deep.equal([
                source.time,
                source.time,
                source.time,
            ]);
            expect(result[2].continuation).to.deep.equal({
                has: false,
                is: true,
                index: 2,
                total: 3,
            });
        });
        it('retains the legacy midnight–23:59 all-day sentinel and accepts end-only 24:00', () => {
            for (const end of [time(23, 59), time(24)]) {
                const result = normalizeEntries([{ ...entry(), time: { start: time(0), end } }]);
                expect(result).to.have.length(1);
                expect(result[0].isAllDay).to.equal(true);
            }
        });
    });

    describe('zone policy', () => {
        it('uses only civil date fields for zoned validation and retains metadata on the caller record', () => {
            const input = {
                kind: 'timed',
                timeZone: 'America/New_York',
                date: {
                    start: Object.freeze({ ...date(2026, 3, 8), calendarId: 'work' }),
                    end: Object.freeze({ ...date(2026, 3, 8), hour: 2 }),
                },
                time: { start: time(3), end: time(24) },
                calendarId: 'work',
            };
            const sibling = entry();
            const issues: EntryValidationIssue[] = [];
            const result = normalizeEntries([input, sibling], (issue) => issues.push(issue));
            expect(issues).to.deep.equal([]);
            expect(result.map((record) => record.sourceEntry)).to.deep.equal([input, sibling]);
            expect(result[0].canonicalEntry).to.equal(input);
            expect(result[0].canonicalEntry.date).to.equal(input.date);
            expect(input.date.start.calendarId).to.equal('work');
            expect(input.date.end.hour).to.equal(2);
            expect(result[0].date).to.deep.equal({
                start: date(2026, 3, 8),
                end: date(2026, 3, 8),
            });
        });
        it('rejects unknown zones, nonexistent spring times and ambiguous autumn endpoints', () => {
            const at = (start: ReturnType<typeof date>, timeZone: string, hour: number) => ({
                ...entry(start),
                kind: 'timed',
                timeZone,
                time: { start: time(hour, 30), end: time(4) },
            });
            expect(
                normalizeEntries([
                    at(date(2026, 3, 8), 'Not/AZone', 1),
                    at(date(2026, 3, 8), 'America/New_York', 2),
                    at(date(2026, 11, 1), 'America/New_York', 1),
                ]),
            ).to.deep.equal([]);
        });
        it('retains an explicit IANA zone and valid civil slices across DST', () => {
            const input = {
                ...entry(date(2026, 3, 7), date(2026, 3, 9)),
                kind: 'timed',
                timeZone: 'America/New_York',
                time: { start: time(23), end: time(1) },
            };
            const result = expandEntries([input]);
            expect(result).to.have.length(3);
            expect(
                result.every(
                    (e) => e.temporalKind === 'zoned' && e.timeZone === 'America/New_York',
                ),
            ).to.equal(true);
            expect(result[1].time).to.deep.equal({ start: time(0), end: time(24) });
        });
    });
});
