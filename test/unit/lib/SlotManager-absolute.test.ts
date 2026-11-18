import { expect } from 'chai';

import { LayoutCalculator } from '../../../src/lib/LayoutCalculator.js';
import {
    SlotManager,
    type PositionConfig,
    type LayoutDimensions,
} from '../../../src/lib/SlotManager.js';

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
            expect(css).to.include('inset-inline-start: 10%');
            expect(css).to.include('z-index: 5');
            expect(css).to.include('opacity: 0.9');
            expect(css).to.include('grid-column: unset');
            expect(css).to.include('grid-row: unset');
            expect(css).to.include('margin-inline-start: 0');
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

    describe('validated geometry and focus order', () => {
        const date = { year: 2026, month: 3, day: 2 };
        const time = { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } };

        it('never emits positive tabindex for day, week or all-day entries', () => {
            for (const viewMode of ['day', 'week', 'month'] as const) {
                for (const isAllDay of [true, false]) {
                    expect(
                        sm.calculateAccessibility({
                            viewMode,
                            date,
                            activeDate: date,
                            time,
                            isAllDay,
                        }).tabIndex,
                    ).to.equal(0);
                }
            }
        });

        it('reports impossible dates, clock values, reversed intervals and missing active weeks', () => {
            const base: PositionConfig = { viewMode: 'week', date, activeDate: date, time };
            for (const config of [
                { ...base, date: { year: 2026, month: 2, day: 30 } },
                { ...base, time: { start: { hour: 25, minute: 0 }, end: { hour: 26, minute: 0 } } },
                { ...base, time: { start: time.end, end: time.start } },
                { ...base, activeDate: undefined },
                { ...base, firstDayOfWeek: 9 },
            ]) {
                expect(sm.validatePosition(config as PositionConfig).valid).to.equal(false);
            }
        });

        it('rejects dates outside the full or condensed week instead of using column zero', () => {
            const outside = { year: 2026, month: 3, day: 10 };
            expect(sm.getWeekDayIndex(outside, date)).to.equal(-1);
            expect(sm.getIndexInDates(outside, [date])).to.equal(-1);
            expect(
                sm.validatePosition({ viewMode: 'week', date: outside, activeDate: date, time })
                    .valid,
            ).to.equal(false);
            expect(
                sm.validatePosition({
                    viewMode: 'week',
                    date: { ...date, day: 3 },
                    activeDate: date,
                    time,
                    weekDates: [date],
                }).valid,
            ).to.equal(false);
            expect(
                sm.validatePosition({ viewMode: 'day', date: outside, activeDate: date, time })
                    .valid,
            ).to.equal(false);
        });

        it('uses the calculator duration authority including non-default scale/minimum', () => {
            const calculator = new LayoutCalculator({ minuteHeight: 2, eventMinHeight: 60 });
            const short = { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 5 } };
            const box = calculator.calculateLayout([
                { id: 'x', heading: '', color: '', startTime: short.start, endTime: short.end },
            ]).boxes[0];
            const position = sm.calculatePosition({ viewMode: 'day', date, time: short });
            const css = sm.generatePositionCSS(position, box, short);
            expect(box.durationMinutes).to.equal(30);
            expect(css).to.include('height: calc(30 * var(--minute-height))');
        });

        it('keeps one-based grid line endpoints correct for a full hour and point events', () => {
            const position = { slotName: 'legacy', useDirectGrid: false };
            const layout = { width: 100, x: 0, zIndex: 1, opacity: 1 };
            expect(sm.generatePositionCSS(position, layout, time)).to.include(
                '--start-slot: 541/601',
            );
            expect(
                sm.generatePositionCSS(position, layout, { start: time.start, end: time.start }),
            ).to.include('--start-slot: 541/542');
        });
    });

    describe('pxToTime helper', () => {
        it('converts and clamps actual offsets and falls back on invalid scale tokens', () => {
            const original = globalThis.getComputedStyle;
            const host = {} as Element;
            let token = '2';
            globalThis.getComputedStyle = (() =>
                ({
                    getPropertyValue: () => token,
                }) as unknown as CSSStyleDeclaration) as typeof getComputedStyle;
            try {
                expect(sm.pxToTime(120, host)).to.deep.equal({ hour: 1, minute: 0 });
                expect(sm.pxToTime(-100, host)).to.deep.equal({ hour: 0, minute: 0 });
                expect(sm.pxToTime(99999, host)).to.deep.equal({ hour: 23, minute: 59 });
                token = '-1';
                expect(sm.pxToTime(48, host)).to.deep.equal({ hour: 1, minute: 0 });
                expect(() => sm.pxToTime(NaN, host)).to.throw(RangeError);
            } finally {
                globalThis.getComputedStyle = original;
            }
        });
    });
});
