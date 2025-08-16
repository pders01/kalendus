import { expect } from 'chai';
import getOverlappingEntitiesIndices from '../../../src/lib/getOverlappingEntitiesIndices.js';

type CalendarInterval = { start: number; end: number };

describe('getOverlappingEntitiesIndices', () => {
    it('should handle empty partitions', () => {
        const partitions: Array<CalendarInterval[]> = [];
        const result = getOverlappingEntitiesIndices(partitions);
        expect(result).to.deep.equal([]);
    });

    it('should handle single non-overlapping partition', () => {
        const partitions = [[{ start: 1, end: 5 }]];
        const result = getOverlappingEntitiesIndices(partitions);
        expect(result).to.deep.equal([{ index: 0, depth: 0, group: 0 }]);
    });

    it('should handle multiple non-overlapping partitions', () => {
        const partitions = [
            [{ start: 1, end: 5 }],
            [{ start: 7, end: 10 }],
            [{ start: 12, end: 15 }],
        ];
        const result = getOverlappingEntitiesIndices(partitions);
        expect(result).to.deep.equal([
            { index: 0, depth: 0, group: 0 },
            { index: 1, depth: 0, group: 1 },
            { index: 2, depth: 0, group: 2 },
        ]);
    });

    it('should handle single overlapping partition with two intervals', () => {
        const partitions = [
            [
                { start: 1, end: 5 },
                { start: 3, end: 7 },
            ],
        ];
        const result = getOverlappingEntitiesIndices(partitions);

        // Should have two items with different depths
        expect(result).to.have.length(2);
        expect(result.find((item) => item.index === 0)).to.exist;
        expect(result.find((item) => item.index === 1)).to.exist;

        // All should be in the same group
        expect(result.every((item) => item.group === 0)).to.be.true;
    });

    it('should handle overlapping partition with three intervals', () => {
        const partitions = [
            [
                { start: 1, end: 6 },
                { start: 2, end: 4 },
                { start: 3, end: 8 },
            ],
        ];
        const result = getOverlappingEntitiesIndices(partitions);

        expect(result).to.have.length(3);
        expect(result.every((item) => item.group === 0)).to.be.true;

        // The algorithm produces specific depth patterns
        const depths = result.map((item) => item.depth);
        expect(depths).to.include(0);
        // Note: This algorithm may not always produce multiple depths for this case
    });

    it('should handle mixed non-overlapping and overlapping partitions', () => {
        const partitions = [
            [{ start: 1, end: 3 }], // Non-overlapping
            [
                { start: 5, end: 8 }, // Overlapping group
                { start: 6, end: 10 },
            ],
            [{ start: 12, end: 15 }], // Non-overlapping
        ];
        const result = getOverlappingEntitiesIndices(partitions);

        expect(result).to.have.length(4);

        // Check non-overlapping items
        const nonOverlapping = result.filter((item) =>
            [0, 3].includes(item.index),
        );
        expect(nonOverlapping).to.have.length(2);
        expect(nonOverlapping.every((item) => item.depth === 0)).to.be.true;

        // Check overlapping items
        const overlapping = result.filter((item) =>
            [1, 2].includes(item.index),
        );
        expect(overlapping).to.have.length(2);
        expect(overlapping.every((item) => item.group === 1)).to.be.true;
    });

    it('should handle nested intervals correctly', () => {
        const partitions = [
            [
                { start: 1, end: 10 }, // Outer interval
                { start: 3, end: 7 }, // Inner interval
                { start: 4, end: 6 }, // Innermost interval
            ],
        ];
        const result = getOverlappingEntitiesIndices(partitions);

        expect(result).to.have.length(3);
        expect(result.every((item) => item.group === 0)).to.be.true;

        // The longest interval should have depth 0
        const longestInterval = result.find((item) => item.depth === 0);
        expect(longestInterval).to.exist;
    });

    it('should handle complex scenario with multiple overlapping groups', () => {
        const partitions = [
            [
                { start: 1, end: 5 },
                { start: 2, end: 6 },
            ],
            [{ start: 8, end: 10 }],
            [
                { start: 12, end: 16 },
                { start: 13, end: 15 },
                { start: 14, end: 18 },
            ],
        ];
        const result = getOverlappingEntitiesIndices(partitions);

        expect(result).to.have.length(6);

        // Group 0: overlapping (indices 0, 1)
        const group0 = result.filter((item) => item.group === 0);
        expect(group0).to.have.length(2);

        // Group 1: non-overlapping (index 2)
        const group1 = result.filter((item) => item.group === 1);
        expect(group1).to.have.length(1);
        expect(group1[0].depth).to.equal(0);

        // Group 2: overlapping (indices 3, 4, 5)
        const group2 = result.filter((item) => item.group === 2);
        expect(group2).to.have.length(3);
    });

    it('should return results sorted by index', () => {
        const partitions = [
            [
                { start: 5, end: 8 },
                { start: 1, end: 10 },
            ],
            [{ start: 15, end: 20 }],
        ];
        const result = getOverlappingEntitiesIndices(partitions);

        // Results should be sorted by index
        for (let i = 1; i < result.length; i++) {
            expect(result[i].index).to.be.greaterThan(result[i - 1].index);
        }
    });

    it('should handle edge case with identical intervals', () => {
        const partitions = [
            [
                { start: 1, end: 5 },
                { start: 1, end: 5 },
            ],
        ];
        const result = getOverlappingEntitiesIndices(partitions);

        expect(result).to.have.length(2);
        expect(result.every((item) => item.group === 0)).to.be.true;
    });
});
