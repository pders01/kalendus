import { expect } from 'chai';

import { allocateAllDayRows, type AllDayEvent } from '../../../src/lib/allDayLayout.js';

describe('allDayLayout', () => {
    describe('allocateAllDayRows', () => {
        it('should return empty result for no events', () => {
            const result = allocateAllDayRows([]);
            expect(result.totalRows).to.equal(0);
            expect(result.rowAssignments.size).to.equal(0);
        });

        it('should assign row 0 to a single multi-day event', () => {
            const events: AllDayEvent[] = [{ id: 'e1', days: [0, 1, 2], isMultiDay: true }];
            const result = allocateAllDayRows(events);
            expect(result.rowAssignments.get('e1')).to.equal(0);
            expect(result.totalRows).to.equal(1);
        });

        it('should assign row 0 to a single-day event', () => {
            const events: AllDayEvent[] = [{ id: 'e1', days: [3], isMultiDay: false }];
            const result = allocateAllDayRows(events);
            expect(result.rowAssignments.get('e1')).to.equal(0);
            expect(result.totalRows).to.equal(1);
        });

        it('should place multi-day events before single-day events', () => {
            const events: AllDayEvent[] = [
                { id: 'single', days: [0], isMultiDay: false },
                { id: 'multi', days: [0, 1, 2], isMultiDay: true },
            ];
            const result = allocateAllDayRows(events);
            // Multi-day gets row 0, single-day gets row 1 (overlaps on day 0)
            expect(result.rowAssignments.get('multi')).to.equal(0);
            expect(result.rowAssignments.get('single')).to.equal(1);
        });

        it('should allow non-overlapping events to share rows', () => {
            const events: AllDayEvent[] = [
                { id: 'e1', days: [0, 1], isMultiDay: true },
                { id: 'e2', days: [3, 4], isMultiDay: true },
            ];
            const result = allocateAllDayRows(events);
            expect(result.rowAssignments.get('e1')).to.equal(0);
            expect(result.rowAssignments.get('e2')).to.equal(0);
            expect(result.totalRows).to.equal(1);
        });

        it('should separate overlapping multi-day events into different rows', () => {
            const events: AllDayEvent[] = [
                { id: 'e1', days: [0, 1, 2], isMultiDay: true },
                { id: 'e2', days: [1, 2, 3], isMultiDay: true },
            ];
            const result = allocateAllDayRows(events);
            expect(result.rowAssignments.get('e1')).to.equal(0);
            expect(result.rowAssignments.get('e2')).to.equal(1);
            expect(result.totalRows).to.equal(2);
        });

        it('counts the highest occupied row plus one when each day has gaps', () => {
            const result = allocateAllDayRows([
                { id: 'A', days: [0, 1], isMultiDay: true },
                { id: 'B', days: [0, 2], isMultiDay: true },
                { id: 'C', days: [1, 2], isMultiDay: true },
            ]);
            expect([...result.rowAssignments.values()]).to.deep.equal([0, 1, 2]);
            expect(result.totalRows).to.equal(3);
        });

        it('keeps duplicate-looking records distinct and allocation deterministic through reorder', () => {
            const events = [
                { id: 'B', days: [0], isMultiDay: false },
                { id: 'A', days: [0], isMultiDay: false },
            ];
            const first = allocateAllDayRows(events);
            const reordered = allocateAllDayRows([...events].reverse());
            expect([...first.rowAssignments]).to.deep.equal([...reordered.rowAssignments]);
            expect(first.totalRows).to.equal(2);
        });

        it('rejects empty, repeated, out-of-range and fractional days and duplicate IDs', () => {
            for (const days of [[], [7], [-1], [1.5], [0, 0]]) {
                expect(() => allocateAllDayRows([{ id: 'x', days, isMultiDay: true }])).to.throw(
                    RangeError,
                );
            }
            expect(() =>
                allocateAllDayRows([
                    { id: 'same', days: [0], isMultiDay: false },
                    { id: 'same', days: [1], isMultiDay: false },
                ]),
            ).to.throw(RangeError);
        });

        it('allocates 10,000 dense all-day records without rescanning every occupied prefix', function () {
            this.timeout(10000);
            const result = allocateAllDayRows(
                Array.from({ length: 10000 }, (_, i) => ({
                    id: String(i).padStart(5, '0'),
                    days: [0, 1, 2, 3, 4, 5, 6],
                    isMultiDay: true,
                })),
            );
            expect(result.rowAssignments.size).to.equal(10000);
            expect(result.totalRows).to.equal(10000);
        });

        it('should compute totalRows correctly for complex scenarios', () => {
            const events: AllDayEvent[] = [
                { id: 'e1', days: [0, 1, 2, 3, 4], isMultiDay: true },
                { id: 'e2', days: [0, 1], isMultiDay: true },
                { id: 'e3', days: [2, 3, 4], isMultiDay: true },
            ];
            const result = allocateAllDayRows(events);
            expect(result.rowAssignments.get('e1')).to.equal(0);
            expect(result.rowAssignments.get('e2')).to.equal(1);
            expect(result.rowAssignments.get('e3')).to.equal(1);
            expect(result.totalRows).to.equal(2);
        });
    });
});
