import { expect } from 'chai';
import { SlotManager, type PositionConfig, type LayoutDimensions } from '../../../src/lib/SlotManager.js';

describe('SlotManager — absolute positioning path', () => {
    let sm: SlotManager;

    beforeEach(() => {
        sm = new SlotManager();
    });

    describe('_calculateDayPosition (via calculatePosition)', () => {
        it('should return useAbsolutePosition:true and slotName:"timed" for timed entries', () => {
            const config: PositionConfig = {
                viewMode: 'day',
                date: { year: 2026, month: 2, day: 28 },
                time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
            };
            const pos = sm.calculatePosition(config);
            expect(pos.useAbsolutePosition).to.be.true;
            expect(pos.slotName).to.equal('timed');
            expect(pos.useDirectGrid).to.be.false;
        });

        it('should return slotName:"all-day" for all-day entries (unchanged path)', () => {
            const config: PositionConfig = {
                viewMode: 'day',
                date: { year: 2026, month: 2, day: 28 },
                isAllDay: true,
            };
            const pos = sm.calculatePosition(config);
            expect(pos.useAbsolutePosition).to.be.undefined;
            expect(pos.slotName).to.equal('all-day');
        });
    });

    describe('_calculateWeekPosition (via calculatePosition)', () => {
        const activeDate = { year: 2026, month: 3, day: 2 }; // Monday

        it('should return useAbsolutePosition:true and timed-YYYY-M-D slot for timed entries', () => {
            const config: PositionConfig = {
                viewMode: 'week',
                date: { year: 2026, month: 3, day: 3 }, // Tuesday
                time: { start: { hour: 14, minute: 30 }, end: { hour: 15, minute: 0 } },
                activeDate,
                firstDayOfWeek: 1,
            };
            const pos = sm.calculatePosition(config);
            expect(pos.useAbsolutePosition).to.be.true;
            expect(pos.slotName).to.equal('timed-2026-3-3');
            expect(pos.useDirectGrid).to.be.false;
            expect(pos.dayIndex).to.equal(1); // Tuesday = index 1 in Mon-start week
        });

        it('should keep all-day events on old slot-based path', () => {
            const config: PositionConfig = {
                viewMode: 'week',
                date: { year: 2026, month: 3, day: 4 }, // Wednesday
                isAllDay: true,
                activeDate,
                firstDayOfWeek: 1,
            };
            const pos = sm.calculatePosition(config);
            expect(pos.useAbsolutePosition).to.be.undefined;
            expect(pos.slotName).to.equal('all-day-2026-3-4');
            expect(pos.isAllDay).to.be.true;
        });
    });

    describe('generatePositionCSS — absolute path', () => {
        it('should produce correct position:absolute CSS for timed entries', () => {
            const position = {
                slotName: 'timed',
                useDirectGrid: false,
                useAbsolutePosition: true,
            };
            const layout: LayoutDimensions = {
                width: 80,
                x: 10,
                zIndex: 5,
                opacity: 0.9,
            };
            const time = { start: { hour: 9, minute: 30 }, end: { hour: 10, minute: 45 } };

            const css = sm.generatePositionCSS(position, layout, time);

            // startMinute = 9*60+30 = 570
            // endMinute = 10*60+45 = 645
            // duration = 645-570 = 75
            expect(css).to.include('position: absolute');
            expect(css).to.include('top: calc(570 * var(--minute-height))');
            expect(css).to.include('height: calc(75 * var(--minute-height))');
            expect(css).to.include('width: 80%');
            expect(css).to.include('left: 10%');
            expect(css).to.include('z-index: 5');
            expect(css).to.include('opacity: 0.9');
            expect(css).to.include('grid-column: unset');
            expect(css).to.include('grid-row: unset');
            expect(css).to.include('margin-left: 0');
        });

        it('should clamp short events to minimum 20 minutes', () => {
            const position = {
                slotName: 'timed',
                useDirectGrid: false,
                useAbsolutePosition: true,
            };
            const layout: LayoutDimensions = { width: 100, x: 0, zIndex: 1, opacity: 1 };
            const time = { start: { hour: 10, minute: 0 }, end: { hour: 10, minute: 5 } };

            const css = sm.generatePositionCSS(position, layout, time);
            // Duration = 5, clamped to 20
            expect(css).to.include('height: calc(20 * var(--minute-height))');
        });

        it('should still produce grid-based CSS for useDirectGrid path', () => {
            const position = {
                slotName: '',
                useDirectGrid: true,
                gridColumn: 3,
                gridRow: '61/120',
            };
            const layout: LayoutDimensions = { width: 100, x: 0, zIndex: 1, opacity: 1 };

            const css = sm.generatePositionCSS(position, layout);
            expect(css).to.include('grid-column: 3');
            expect(css).to.include('grid-row: 61/120');
            expect(css).to.not.include('position: absolute');
        });
    });

    describe('Month view — unchanged', () => {
        it('should produce date-based slot for month view', () => {
            const config: PositionConfig = {
                viewMode: 'month',
                date: { year: 2026, month: 2, day: 28 },
            };
            const pos = sm.calculatePosition(config);
            expect(pos.slotName).to.equal('2026-2-28');
            expect(pos.useAbsolutePosition).to.be.undefined;
            expect(pos.useDirectGrid).to.be.false;
        });
    });

    describe('pxToTime helper', () => {
        it('should exist on SlotManager instances', () => {
            expect(sm.pxToTime).to.be.a('function');
        });

        // pxToTime requires a real DOM element (getComputedStyle).
        // Full DOM tests belong in test/unit/components/ with @open-wc/testing.
        // Here we verify the method signature and existence only.
    });
});
