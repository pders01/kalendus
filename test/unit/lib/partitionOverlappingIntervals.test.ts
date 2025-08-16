import { expect } from 'chai';
import partitionOverlappingIntervals from '../../../src/lib/partitionOverlappingIntervals.js';

describe('partitionOverlappingIntervals', () => {
    it('should handle empty array', () => {
        const result = partitionOverlappingIntervals([]);
        expect(result).to.deep.equal([]);
    });

    it('should handle single interval', () => {
        const intervals = [{ start: 1, end: 5 }];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([[{ start: 1, end: 5 }]]);
    });

    it('should handle non-overlapping intervals', () => {
        const intervals = [
            { start: 1, end: 3 },
            { start: 5, end: 7 },
            { start: 9, end: 11 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [{ start: 1, end: 3 }],
            [{ start: 5, end: 7 }],
            [{ start: 9, end: 11 }],
        ]);
    });

    it('should group overlapping intervals', () => {
        const intervals = [
            { start: 1, end: 5 },
            { start: 3, end: 7 },
            { start: 6, end: 10 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [
                { start: 1, end: 5 },
                { start: 3, end: 7 },
                { start: 6, end: 10 },
            ],
        ]);
    });

    it('should handle partially overlapping intervals', () => {
        const intervals = [
            { start: 1, end: 4 },
            { start: 3, end: 6 },
            { start: 8, end: 10 },
            { start: 9, end: 12 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [
                { start: 1, end: 4 },
                { start: 3, end: 6 },
            ],
            [
                { start: 8, end: 10 },
                { start: 9, end: 12 },
            ],
        ]);
    });

    it('should handle intervals with same start', () => {
        const intervals = [
            { start: 1, end: 3 },
            { start: 1, end: 5 },
            { start: 1, end: 7 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [
                { start: 1, end: 3 },
                { start: 1, end: 5 },
                { start: 1, end: 7 },
            ],
        ]);
    });

    it('should handle intervals with same end', () => {
        const intervals = [
            { start: 1, end: 10 },
            { start: 5, end: 10 },
            { start: 8, end: 10 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [
                { start: 1, end: 10 },
                { start: 5, end: 10 },
                { start: 8, end: 10 },
            ],
        ]);
    });

    it('should handle nested intervals', () => {
        const intervals = [
            { start: 1, end: 10 },
            { start: 2, end: 3 },
            { start: 4, end: 5 },
            { start: 6, end: 7 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [
                { start: 1, end: 10 },
                { start: 2, end: 3 },
                { start: 4, end: 5 },
                { start: 6, end: 7 },
            ],
        ]);
    });

    it('should handle touching intervals (end equals next start)', () => {
        const intervals = [
            { start: 1, end: 3 },
            { start: 3, end: 5 },
            { start: 5, end: 7 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        // Touching intervals should not be grouped
        expect(result).to.deep.equal([
            [{ start: 1, end: 3 }],
            [{ start: 3, end: 5 }],
            [{ start: 5, end: 7 }],
        ]);
    });

    it('should handle complex overlapping scenario', () => {
        const intervals = [
            { start: 1, end: 4 },
            { start: 2, end: 6 },
            { start: 5, end: 8 },
            { start: 10, end: 15 },
            { start: 12, end: 14 },
            { start: 20, end: 25 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [
                { start: 1, end: 4 },
                { start: 2, end: 6 },
                { start: 5, end: 8 },
            ],
            [
                { start: 10, end: 15 },
                { start: 12, end: 14 },
            ],
            [{ start: 20, end: 25 }],
        ]);
    });

    it('should handle unsorted input intervals', () => {
        const intervals = [
            { start: 5, end: 8 },
            { start: 1, end: 4 },
            { start: 2, end: 6 },
        ];
        const result = partitionOverlappingIntervals(intervals);
        expect(result).to.deep.equal([
            [
                { start: 1, end: 4 },
                { start: 2, end: 6 },
                { start: 5, end: 8 },
            ],
        ]);
    });
});
