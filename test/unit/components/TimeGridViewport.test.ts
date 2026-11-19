import { expect, fixture, html, nextFrame } from '@open-wc/testing';

import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = { year: 2026, month: 11, day: 17 };
const later = { ...date, day: 19 };
const entries: CalendarEntry[] = Array.from({ length: 42 }, (_, i) => ({
    id: `span-${i}`,
    heading: `Project ${i + 1}`,
    kind: 'all-day',
    date: { start: date, end: later },
}));
const settle = async () => {
    for (let i = 0; i < 8; i++) await nextFrame();
};

function snapshot(calendar: Calendar, view: 'day' | 'week') {
    const grid = calendar.shadowRoot!.querySelector(`lms-calendar-${view}`)!;
    const root = grid.shadowRoot!;
    const scroll = root.querySelector<HTMLElement>(view === 'week' ? '.week-scroll' : '.main')!;
    const allDay = root.querySelector<HTMLElement>('.all-day-wrapper');
    const minute = parseFloat(getComputedStyle(grid).getPropertyValue('--minute-height'));
    return {
        scroll,
        values: {
            calendar: calendar.clientHeight,
            grid: grid.clientHeight,
            timedViewport: scroll.clientHeight,
            timedContent: scroll.scrollHeight,
            allDay: allDay?.clientHeight ?? 0,
            minute,
        },
    };
}

describe('Day and Week viewport sizing', () => {
    for (const view of ['day', 'week'] as const) {
        for (const height of [220, 390]) {
            it(`${view} makes the timeline reachable at ${height}px with enlarged text`, async () => {
                const calendar = await fixture<Calendar>(html`
                    <lms-calendar locale="ar" dir="rtl" .initialDate=${date}
                        style=${`display:block; width:800px; height:${height}px; font-size:24px`}
                        view-mode=${view} .entries=${entries}></lms-calendar>
                `);
                await calendar.localeReady;
                await settle();
                const { scroll, values } = snapshot(calendar, view);
                const bounds = [
                    calendar,
                    ...calendar.shadowRoot!.querySelectorAll('.calendar-container, .time-grid'),
                    scroll,
                ];
                const visibleHeight = () => {
                    const rects = bounds.map((el) => el.getBoundingClientRect());
                    return (
                        Math.min(...rects.map(({ bottom }) => bottom)) -
                        Math.max(...rects.map(({ top }) => top))
                    );
                };
                expect(values.calendar).to.equal(height);
                expect(values.timedViewport).to.be.at.least(120);
                // A focused timeline must actually be visible, not just have a
                // large clientHeight behind an ancestor's clipping boundary.
                scroll.focus();
                await nextFrame();
                expect(visibleHeight()).to.be.at.least(118);
                expect(scroll.getRootNode()).to.have.property('activeElement', scroll);

                const inset = parseFloat(getComputedStyle(scroll).paddingTop);
                scroll.scrollTop = Math.round(inset + 530 * values.minute);
                calendar.style.height = '1400px';
                await settle();
                const resized = snapshot(calendar, view);
                expect(resized.values.minute).to.be.greaterThan(values.minute);
                expect((scroll.scrollTop - inset) / resized.values.minute).to.be.closeTo(530, 2);
            });
        }

        for (const dense of [false, true]) {
            it(`${view} settles without an explicit height (${dense ? 'dense' : 'sparse'})`, async () => {
                const calendar =
                    await fixture<Calendar>(html`<lms-calendar locale="en" style="width:430px" .activeDate=${date}
                    view-mode="month" .entries=${dense ? entries : entries.slice(0, 1)}></lms-calendar>`);
                calendar.viewMode = view;
                await calendar.updateComplete;
                await settle();
                const { values } = snapshot(calendar, view);
                expect(values.calendar).to.be.greaterThan(200).and.lessThan(1000);
                expect(values.timedViewport).to.be.greaterThan(120);
                expect(values.timedContent).to.be.lessThan(2000);
                expect(values.allDay).to.be.at.most(192);
                expect(values.minute).to.be.closeTo(
                    Math.max(values.timedViewport / 720, 44 / 60),
                    0.0001,
                );
                for (let frame = 0; frame < 5; frame++) {
                    await nextFrame();
                    expect(snapshot(calendar, view).values).to.deep.equal(values);
                }
            });
        }

        for (const dense of [false, true]) {
            it(`${view} honors a supplied height and preserves its visible minute on resize (${dense ? 'dense' : 'sparse'})`, async () => {
                const calendar =
                    await fixture<Calendar>(html`<lms-calendar locale="en" style="width:530px;--height:900px"
                    .activeDate=${date} view-mode=${view} .entries=${dense ? entries : entries.slice(0, 1)}></lms-calendar>`);
                await settle();
                const before = snapshot(calendar, view);
                expect(before.values.calendar).to.equal(900);
                const inset = parseFloat(getComputedStyle(before.scroll).paddingTop);
                before.scroll.scrollTop = Math.round(inset + 400 * before.values.minute);
                calendar.style.setProperty('--height', '640px');
                await settle();
                const after = snapshot(calendar, view);
                expect(after.values.calendar).to.equal(640);
                expect(after.values.minute).to.be.lessThan(before.values.minute);
                expect((after.scroll.scrollTop - inset) / after.values.minute).to.be.closeTo(
                    400,
                    2,
                );
                for (let frame = 0; frame < 5; frame++) {
                    await nextFrame();
                    expect(snapshot(calendar, view).values).to.deep.equal(after.values);
                }
            });
        }
    }
});
