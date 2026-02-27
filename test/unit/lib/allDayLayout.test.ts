import { expect } from 'chai';
import { allocateAllDayRows, computeSpanClass, type AllDayEvent } from '../../../src/lib/allDayLayout.js';

describe('allDayLayout', () => {
    describe('allocateAllDayRows', () => {
        it('should return empty result for no events', () => {
            const result = allocateAllDayRows([]);
            expect(result.totalRows).to.equal(0);
            expect(result.rowAssignments.size).to.equal(0);
        });

        it('should assign row 0 to a single multi-day event', () => {
            const events: AllDayEvent[] = [
                { id: 'e1', days: [0, 1, 2], isMultiDay: true },
            ];
            const result = allocateAllDayRows(events);
            expect(result.rowAssignments.get('e1')).to.equal(0);
            expect(result.totalRows).to.equal(1);
        });

        it('should assign row 0 to a single-day event', () => {
            const events: AllDayEvent[] = [
                { id: 'e1', days: [3], isMultiDay: false },
            ];
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

    describe('computeSpanClass', () => {
        it('should return single-day for single-day events', () => {
            expect(computeSpanClass({
                continuationIndex: 0,
                totalDays: 1,
                visibleStartIndex: 0,
                visibleEndIndex: 0,
            })).to.equal('single-day');
        });

        it('should return first-day for the start of a multi-day event', () => {
            expect(computeSpanClass({
                continuationIndex: 1,
                totalDays: 3,
                visibleStartIndex: 1,
                visibleEndIndex: 3,
            })).to.equal('first-day');
        });

        it('should return last-day for the end of a multi-day event', () => {
            expect(computeSpanClass({
                continuationIndex: 3,
                totalDays: 3,
                visibleStartIndex: 1,
                visibleEndIndex: 3,
            })).to.equal('last-day');
        });

        it('should return middle-day for middle of a multi-day event', () => {
            expect(computeSpanClass({
                continuationIndex: 2,
                totalDays: 4,
                visibleStartIndex: 1,
                visibleEndIndex: 4,
            })).to.equal('middle-day');
        });

        it('should return single-day when visible start equals visible end', () => {
            expect(computeSpanClass({
                continuationIndex: 2,
                totalDays: 5,
                visibleStartIndex: 2,
                visibleEndIndex: 2,
            })).to.equal('single-day');
        });

        it('should handle event starting before visible week boundary', () => {
            // Event spans days 5-8, but only days 0-6 are visible in week
            // If we only see day 0 (which is continuation index 5 in the original span)
            expect(computeSpanClass({
                continuationIndex: 0,
                totalDays: 4,
                visibleStartIndex: 0,
                visibleEndIndex: 2,
            })).to.equal('first-day');
        });

        it('should handle event ending after visible week boundary', () => {
            expect(computeSpanClass({
                continuationIndex: 6,
                totalDays: 10,
                visibleStartIndex: 4,
                visibleEndIndex: 6,
            })).to.equal('last-day');
        });
    });
});
