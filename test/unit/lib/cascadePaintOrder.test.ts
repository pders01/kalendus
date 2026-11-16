import { expect } from 'chai';

import { LayoutCalculator } from '../../../src/lib/LayoutCalculator.js';

const time = (minutes: number) => ({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
const event = (id: string, start: number, end: number) => ({
    id,
    heading: id,
    color: '#2563a6',
    startTime: time(start),
    endTime: time(end),
});

// A short lane can become free while a deeper lane still contains a long event.
// Depth reuse is valid; reusing that depth's paint order hides the new heading.
describe('Cascade foreground paint order', () => {
    const events = [
        event('background', 540, 840),
        event('early', 540, 570),
        event('persistent', 550, 720),
        event('late', 580, 630),
    ];
    it('paints a later event above a still-running foreground event when reusing a lane', () => {
        const boxes = new LayoutCalculator().calculateLayout(events).boxes;
        const box = (id: string) => boxes.find((value) => value.id === id)!;
        expect(box('late').depth).to.equal(box('early').depth);
        expect(box('late').depth).to.be.lessThan(box('persistent').depth);
        expect(box('late').zIndex).to.be.greaterThan(box('persistent').zIndex);
        expect(box('background').zIndex).to.be.lessThan(
            Math.min(...boxes.filter((value) => value.depth > 0).map((value) => value.zIndex)),
        );
    });
    it('keeps paint order deterministic after caller reordering', () => {
        const paintOrder = (items: typeof events) =>
            new LayoutCalculator()
                .calculateLayout(items)
                .boxes.map(({ id, zIndex }) => ({ id, zIndex }))
                .sort((a, b) => a.id.localeCompare(b.id));
        expect(paintOrder([...events].reverse())).to.deep.equal(paintOrder(events));
    });
});
