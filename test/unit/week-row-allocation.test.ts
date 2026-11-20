import { expect } from 'chai';

import { layoutAllDaySegments } from '../../src/lib/allDayLayout.js';
import { expandEntries } from '../../src/lib/calendarModel.js';

const date = (day: number) => ({ year: 2026, month: 3, day });
const span = (id: string, start: number, end: number) => ({
    id,
    kind: 'all-day',
    heading: id,
    date: { start: date(start), end: date(end) },
});

describe('Week view row placements', () => {
    it('keeps overlapping spans on one lane across their visible columns', () => {
        const entries = expandEntries([
            span('full-week', 2, 8),
            span('wed-fri', 4, 6),
            span('tue-wed', 3, 4),
        ]);
        const { placements } = layoutAllDaySegments(
            entries.map((entry) => ({ entry, column: entry.date.start.day - 2 })),
        );
        const coordinates = (id: string) =>
            placements
                .filter(({ entry }) => entry.sourceId === id)
                .map(({ row, column }) => [row, column]);

        expect(coordinates('full-week')).to.deep.equal(
            Array.from({ length: 7 }, (_, column) => [0, column]),
        );
        expect(coordinates('tue-wed')).to.deep.equal([
            [1, 1],
            [1, 2],
        ]);
        expect(coordinates('wed-fri')).to.deep.equal([
            [2, 2],
            [2, 3],
            [2, 4],
        ]);
    });
});
