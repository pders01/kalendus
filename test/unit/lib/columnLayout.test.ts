import { expect } from 'chai';

import { LayoutCalculator, type LayoutBox } from '../../../src/lib/LayoutCalculator.js';

const time = (minutes: number) => ({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
const event = (id: string, start: number, end: number) => ({
    id,
    heading: id,
    color: '#2563a6',
    startTime: time(start),
    endTime: time(end),
});
const columns = (events: ReturnType<typeof event>[]) =>
    new LayoutCalculator({ layoutMode: 'columns' }).calculateLayout(events).boxes;
const byId = (boxes: LayoutBox[]) => [...boxes].sort((a, b) => a.id.localeCompare(b.id));

function assertNonoverlapping(boxes: LayoutBox[]) {
    for (let a = 0; a < boxes.length; a++) {
        for (let b = a + 1; b < boxes.length; b++) {
            const first = boxes[a];
            const second = boxes[b];
            if (first.y < second.y + second.height && second.y < first.y + first.height) {
                expect(
                    first.x + first.width <= second.x + 1e-9 ||
                        second.x + second.width <= first.x + 1e-9,
                    `${first.id} and ${second.id} must have separate display lanes`,
                ).to.equal(true);
            }
        }
    }
}

describe('Opt-in equal-width time-grid columns', () => {
    const events = [
        event('long', 540, 840),
        event('early', 540, 570),
        event('persistent', 550, 720),
        event('late', 580, 630),
    ];

    it('preserves the exact default cascade contract and omits column-only metadata', () => {
        const implicit = new LayoutCalculator().calculateLayout(events);
        const explicit = new LayoutCalculator({ layoutMode: 'cascade' }).calculateLayout(events);
        expect(implicit).to.deep.equal(explicit);
        expect(implicit.boxes[0].width).to.equal(100);
        for (const box of implicit.boxes) {
            expect(box).not.to.have.property('columnIndex');
            expect(box).not.to.have.property('columnCount');
        }
    });

    it('does not create false overlap at font-relative hour boundaries', () => {
        const result = new LayoutCalculator({
            layoutMode: 'columns',
            minuteHeight: 44 / 60,
            eventMinHeight: 44,
        }).calculateLayout([event('first-hour', 480, 540), event('next-hour', 540, 600)]);
        expect(result.boxes.map((box) => box.columnCount)).to.deep.equal([1, 1]);
        expect(result.boxes[0].group).not.to.equal(result.boxes[1].group);
        expect(result.boxes[0].height).to.be.closeTo(44, 1e-9);
        expect(result.boxes[1].height).to.be.closeTo(44, 1e-9);
        assertNonoverlapping(result.boxes);
    });

    it('allocates even the longest event and reuses the lowest free lane', () => {
        const boxes = columns(events);
        expect(boxes.map((box) => box.id)).to.deep.equal(events.map((item) => item.id));
        expect(boxes.map((box) => box.columnIndex)).to.deep.equal([0, 1, 2, 1]);
        for (const box of boxes) {
            expect(box.columnCount).to.equal(3);
            expect(box.width).to.be.closeTo(100 / 3, 1e-9);
            expect(box.x).to.be.closeTo(box.columnIndex! * (100 / 3), 1e-9);
            expect(box.opacity).to.equal(1);
            expect(box.x + box.width).to.be.at.most(100 + 1e-9);
        }
        assertNonoverlapping(boxes);
    });

    it('uses peak concurrency, not the size of a transitively connected group', () => {
        const boxes = columns([
            event('a', 540, 580),
            event('b', 570, 610),
            event('c', 600, 640),
            event('d', 630, 670),
            event('separate', 670, 720),
        ]);
        expect(boxes.map((box) => box.columnCount)).to.deep.equal([2, 2, 2, 2, 1]);
        expect(boxes.map((box) => box.columnIndex)).to.deep.equal([0, 1, 0, 1, 0]);
        expect(boxes.map((box) => box.group)).to.deep.equal([0, 0, 0, 0, 1]);
        assertNonoverlapping(boxes);
    });

    it('uses minimum display intervals for point/short events without changing input endpoints', () => {
        const items = [
            event('point', 540, 540),
            event('short', 550, 551),
            event('later', 570, 580),
        ];
        const original = structuredClone(items);
        const boxes = columns(items);
        expect(items).to.deep.equal(original);
        expect(boxes.map((box) => box.durationMinutes)).to.deep.equal([20, 20, 20]);
        expect(boxes.map((box) => box.columnIndex)).to.deep.equal([0, 1, 0]);
        expect(boxes.map((box) => box.columnCount)).to.deep.equal([2, 2, 1]);
        assertNonoverlapping(boxes);
    });

    it('retains custom scale, minimum geometry and the 24:00 endpoint', () => {
        const boxes = new LayoutCalculator({
            layoutMode: 'columns',
            minuteHeight: 2,
            eventMinHeight: 60,
        }).calculateLayout([event('point', 1410, 1410), event('end', 1420, 1440)]).boxes;
        expect(boxes.map((box) => box.y)).to.deep.equal([2820, 2840]);
        expect(boxes.map((box) => box.height)).to.deep.equal([60, 60]);
        expect(boxes.map((box) => box.durationMinutes)).to.deep.equal([30, 30]);
        expect(boxes.map((box) => box.columnCount)).to.deep.equal([2, 2]);
        assertNonoverlapping(boxes);
    });

    it('is deterministic under caller reordering, including tied starts and durations', () => {
        const items = [...events, event('tie-z', 540, 570), event('tie-a', 540, 570)];
        expect(byId(columns([...items].reverse()))).to.deep.equal(byId(columns(items)));
    });

    it('handles an empty input, half-open adjacency and zero configured minimum', () => {
        expect(columns([])).to.deep.equal([]);
        const boxes = new LayoutCalculator({
            layoutMode: 'columns',
            eventMinHeight: 0,
        }).calculateLayout([
            event('a', 540, 560),
            event('b', 560, 580),
            event('point', 580, 580),
        ]).boxes;
        expect(boxes.map((box) => box.group)).to.deep.equal([0, 1, 2]);
        expect(boxes.map((box) => box.width)).to.deep.equal([100, 100, 100]);
        expect(boxes[2].durationMinutes).to.equal(0);
        const coincident = new LayoutCalculator({
            layoutMode: 'columns',
            eventMinHeight: 0,
        }).calculateLayout([event('p', 580, 580), event('q', 580, 580)]).boxes;
        expect(coincident.map((box) => box.columnCount)).to.deep.equal([2, 2]);
    });

    it('rejects invalid times, reversed intervals and invalid scales in columns too', () => {
        const calculator = new LayoutCalculator({ layoutMode: 'columns' });
        expect(() => calculator.calculateLayout([event('reversed', 600, 540)])).to.throw(
            RangeError,
        );
        expect(() => calculator.calculateLayout([event('invalid', 1440, 1440)])).to.throw(
            RangeError,
        );
        expect(() => new LayoutCalculator({ layoutMode: 'columns', minuteHeight: 0 })).to.throw(
            RangeError,
        );
        expect(() => new LayoutCalculator({ layoutMode: 'columns', eventMinHeight: -1 })).to.throw(
            RangeError,
        );
    });

    it('allocates an extreme dense group without synthesizing or dropping identities', () => {
        const items = Array.from({ length: 12000 }, (_, index) => event(`id-${index}`, 540, 600));
        const boxes = columns(items);
        expect(boxes).to.have.length(items.length);
        expect(new Set(boxes.map((box) => box.columnIndex)).size).to.equal(items.length);
        for (let index = 0; index < boxes.length; index++) {
            expect(boxes[index].id).to.equal(items[index].id);
            expect(boxes[index].columnCount).to.equal(items.length);
            expect(boxes[index].width).to.equal(100 / items.length);
        }
    });
});
