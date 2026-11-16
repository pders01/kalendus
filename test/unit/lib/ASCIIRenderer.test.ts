import { expect } from 'chai';
import { LayoutCalculator } from '../../../src/lib/LayoutCalculator.js';
import { ASCIIRenderer } from '../../../src/lib/debug/ASCIIRenderer.js';

const event = {
    id: 'nine', heading: 'At nine', color: '#123456',
    startTime: { hour: 9, minute: 0 }, endTime: { hour: 10, minute: 0 },
};

describe('ASCIIRenderer', () => {
    it('shares the 09:00 origin between labels and boxes', () => {
        const layout = new LayoutCalculator().calculateLayout([event]);
        expect(new ASCIIRenderer(15, 5).render(layout)).to.equal([
            '09:00| ████████',
            '       ████████',
            '       ████████',
            '       ████████',
            '10:00|         ',
        ].join('\n'));
    });

    it('supports a midnight origin and the production pixel scale', () => {
        const layout = new LayoutCalculator({ minuteHeight: 2 }).calculateLayout([event]);
        const rows = new ASCIIRenderer(15, 12, { startMinute: 0, minutesPerRow: 60, minuteHeight: 2 }).render(layout).split('\n');
        expect(rows[0]).to.equal('00:00|         ');
        expect(rows[9]).to.equal('09:00| ████████');
        expect(rows[10]).to.equal('10:00|         ');
    });

    it('clips offscreen boxes and rejects invalid dimensions', () => {
        const early = { ...event, startTime: { hour: 1, minute: 0 }, endTime: { hour: 2, minute: 0 } };
        const layout = new LayoutCalculator().calculateLayout([early]);
        expect(new ASCIIRenderer().render(layout)).not.to.include('█');
        expect(() => new ASCIIRenderer(3)).to.throw(RangeError);
        expect(() => new ASCIIRenderer(80, 24, { minutesPerRow: 0 })).to.throw(RangeError);
    });
});
