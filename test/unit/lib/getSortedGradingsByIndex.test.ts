import { expect } from 'chai';
import getSortedGradingsByIndex from '../../../src/lib/getSortedGradingsByIndex.js';

describe('getSortedGradingsByIndex', () => {
    it('should handle empty array', () => {
        const result = getSortedGradingsByIndex([]);
        expect(result).to.deep.equal([]);
    });

    it('should handle single item', () => {
        const gradings = [{ index: 0, depth: 5, group: 0 }];
        const result = getSortedGradingsByIndex(gradings);
        expect(result).to.deep.equal([{ index: 0, depth: 0, group: 0 }]);
    });

    it('should rearrange depths within single group by index order', () => {
        const gradings = [
            { index: 2, depth: 1, group: 0 },
            { index: 0, depth: 3, group: 0 },
            { index: 1, depth: 0, group: 0 },
        ];
        const result = getSortedGradingsByIndex(gradings);
        expect(result).to.deep.equal([
            { index: 0, depth: 0, group: 0 },
            { index: 1, depth: 1, group: 0 },
            { index: 2, depth: 2, group: 0 },
        ]);
    });

    it('should handle multiple groups independently', () => {
        const gradings = [
            { index: 1, depth: 2, group: 0 },
            { index: 3, depth: 1, group: 1 },
            { index: 0, depth: 1, group: 0 },
            { index: 4, depth: 0, group: 1 },
        ];
        const result = getSortedGradingsByIndex(gradings);
        expect(result).to.deep.equal([
            { index: 0, depth: 0, group: 0 },
            { index: 1, depth: 1, group: 0 },
            { index: 3, depth: 0, group: 1 },
            { index: 4, depth: 1, group: 1 },
        ]);
    });

    it('should preserve group assignments', () => {
        const gradings = [
            { index: 5, depth: 10, group: 2 },
            { index: 1, depth: 5, group: 0 },
            { index: 3, depth: 8, group: 1 },
            { index: 0, depth: 3, group: 0 },
            { index: 4, depth: 2, group: 1 },
            { index: 6, depth: 1, group: 2 },
        ];
        const result = getSortedGradingsByIndex(gradings);

        // Check that groups are preserved
        expect(result.filter((item) => item.group === 0)).to.have.length(2);
        expect(result.filter((item) => item.group === 1)).to.have.length(2);
        expect(result.filter((item) => item.group === 2)).to.have.length(2);

        // Check depths are reset per group
        const group0 = result.filter((item) => item.group === 0);
        expect(group0.map((item) => item.depth)).to.deep.equal([0, 1]);

        const group1 = result.filter((item) => item.group === 1);
        expect(group1.map((item) => item.depth)).to.deep.equal([0, 1]);

        const group2 = result.filter((item) => item.group === 2);
        expect(group2.map((item) => item.depth)).to.deep.equal([0, 1]);
    });

    it('should maintain final sort by index', () => {
        const gradings = [
            { index: 10, depth: 0, group: 1 },
            { index: 5, depth: 0, group: 0 },
            { index: 15, depth: 0, group: 2 },
            { index: 2, depth: 0, group: 0 },
            { index: 8, depth: 0, group: 1 },
        ];
        const result = getSortedGradingsByIndex(gradings);

        // Should be sorted by index
        const indices = result.map((item) => item.index);
        expect(indices).to.deep.equal([2, 5, 8, 10, 15]);
    });

    it('should handle groups with different sizes', () => {
        const gradings = [
            { index: 0, depth: 0, group: 0 },
            { index: 1, depth: 0, group: 1 },
            { index: 2, depth: 0, group: 1 },
            { index: 3, depth: 0, group: 1 },
            { index: 4, depth: 0, group: 2 },
            { index: 5, depth: 0, group: 2 },
        ];
        const result = getSortedGradingsByIndex(gradings);

        // Group 0: 1 item (depth 0)
        const group0 = result.filter((item) => item.group === 0);
        expect(group0).to.have.length(1);
        expect(group0[0].depth).to.equal(0);

        // Group 1: 3 items (depths 0, 1, 2)
        const group1 = result.filter((item) => item.group === 1);
        expect(group1).to.have.length(3);
        expect(group1.map((item) => item.depth)).to.deep.equal([0, 1, 2]);

        // Group 2: 2 items (depths 0, 1)
        const group2 = result.filter((item) => item.group === 2);
        expect(group2).to.have.length(2);
        expect(group2.map((item) => item.depth)).to.deep.equal([0, 1]);
    });

    it('should handle unsorted input indices within groups', () => {
        const gradings = [
            { index: 7, depth: 999, group: 0 },
            { index: 3, depth: 888, group: 0 },
            { index: 1, depth: 777, group: 0 },
            { index: 5, depth: 666, group: 0 },
        ];
        const result = getSortedGradingsByIndex(gradings);

        // Should be sorted by index and depths reset
        expect(result).to.deep.equal([
            { index: 1, depth: 0, group: 0 },
            { index: 3, depth: 1, group: 0 },
            { index: 5, depth: 2, group: 0 },
            { index: 7, depth: 3, group: 0 },
        ]);
    });

    it('should handle duplicate indices in different groups', () => {
        const gradings = [
            { index: 1, depth: 5, group: 0 },
            { index: 1, depth: 10, group: 1 },
            { index: 2, depth: 3, group: 0 },
            { index: 2, depth: 8, group: 1 },
        ];
        const result = getSortedGradingsByIndex(gradings);

        expect(result).to.have.length(4);

        // Each group should have its own depth sequencing
        const group0Items = result.filter((item) => item.group === 0);
        expect(group0Items.map((item) => item.depth)).to.deep.equal([0, 1]);

        const group1Items = result.filter((item) => item.group === 1);
        expect(group1Items.map((item) => item.depth)).to.deep.equal([0, 1]);
    });

    it('should handle large depth values by resetting them', () => {
        const gradings = [
            { index: 0, depth: 1000000, group: 0 },
            { index: 1, depth: 5000, group: 0 },
            { index: 2, depth: 999999, group: 0 },
        ];
        const result = getSortedGradingsByIndex(gradings);

        // Depths should be reset to 0, 1, 2 based on index order
        expect(result).to.deep.equal([
            { index: 0, depth: 0, group: 0 },
            { index: 1, depth: 1, group: 0 },
            { index: 2, depth: 2, group: 0 },
        ]);
    });
});
