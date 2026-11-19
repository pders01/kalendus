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
                expect(scroll.scrollTop, 'full day no longer needs vertical scrolling').to.equal(0);
                const resized = snapshot(calendar, view).values;
                expect(resized.timedContent).to.be.closeTo(resized.timedViewport, 1);
            });
        }

        it(`${view} adapts from 24-hour fit to native scrolling as the available text-relative height changes`, async () => {
            const wrapper = await fixture<HTMLDivElement>(html`
                <div style="display:grid;width:930px;height:720px">
                    <lms-calendar .activeDate=${date} view-mode=${view} style="height:100%;font:16px Arial"
                        .entries=${entries.slice(0, 1)}></lms-calendar>
                </div>
            `);
            const calendar = wrapper.querySelector<Calendar>('lms-calendar')!;
            await settle();
            const { scroll } = snapshot(calendar, view);
            const labels = [...scroll.querySelectorAll<HTMLElement>('.hour-label')];
            const check = (step: 1 | 2) => {
                expect(scroll.scrollHeight).to.be.closeTo(scroll.clientHeight, 1);
                expect(labels.filter((label) => label.getClientRects().length)).to.deep.equal(
                    labels.filter((_, hour) => hour % step === 0),
                );
                const rect = scroll.getBoundingClientRect();
                expect(labels[0].getBoundingClientRect().top).to.be.at.least(rect.top - 0.5);
                expect(labels[24].getBoundingClientRect().bottom).to.be.at.most(rect.bottom + 0.5);
                const scale = snapshot(calendar, view).values.minute;
                expect(
                    labels[24].getBoundingClientRect().top - labels[0].getBoundingClientRect().top,
                ).to.be.closeTo(1440 * scale, 0.5);
            };
            check(2);

            wrapper.style.height = '1050px';
            await settle();
            check(1);

            calendar.setAttribute('scroll-time-grid', '');
            await settle();
            expect(scroll.scrollHeight).to.be.greaterThan(scroll.clientHeight * 1.5);
            calendar.removeAttribute('scroll-time-grid');
            await settle();
            check(1);

            wrapper.style.height = '720px';
            calendar.style.fontSize = '28px';
            await settle();
            expect(scroll.scrollHeight).to.be.greaterThan(scroll.clientHeight * 1.5);
            scroll.scrollTop = 200;
            expect(scroll.scrollTop).to.be.closeTo(200, 1);
        });

        for (const dir of ['ltr', 'rtl'] as const) {
            it(`${view} keeps date, all-day and timed columns aligned as the all-day band scrolls (${dir})`, async () => {
                const calendar = await fixture<Calendar>(html`
                    <lms-calendar scroll-time-grid .initialDate=${date} view-mode=${view} dir=${dir}
                        .entries=${entries.slice(0, 1)}
                        style=${`width:900px; height:${dir === 'rtl' ? 390 : 760}px; font-size:${dir === 'rtl' ? 24 : 16}px`}
                    ></lms-calendar>
                `);
                await settle();
                const { scroll, values } = snapshot(calendar, view);
                const root = scroll.getRootNode() as ShadowRoot;
                const band = root.querySelector<HTMLElement>('.all-day-wrapper')!;
                const emulateClassic = /Chrom(e|ium)\//.test(navigator.userAgent);
                // Emulate a classic platform gutter in Chromium. WebKit's
                // custom scrollbar pseudo-element behaves differently from
                // native gutters; exercise its native layout instead.
                const style = document.createElement('style');
                const regions = `:is(.${view}-header, .all-day-wrapper, .${view === 'day' ? 'main' : 'week-scroll'})`;
                style.textContent = `${regions}::-webkit-scrollbar { width: 16px; }
                    ${regions}::-webkit-scrollbar-thumb { background: gray; }`;
                const align = (header: string, allDay: string, timed: string) => {
                    const bounds = (selector: string) =>
                        [...root.querySelectorAll(selector)].map((el) =>
                            el.getBoundingClientRect(),
                        );
                    const a = bounds(header),
                        b = bounds(allDay),
                        c = bounds(timed);
                    expect(a.length).to.be.greaterThan(0).and.equal(b.length).and.equal(c.length);
                    for (const [index, column] of a.entries()) {
                        for (const track of [b[index], c[index]]) {
                            expect(track.left).to.be.closeTo(column.left, 0.1);
                            expect(track.right).to.be.closeTo(column.right, 0.1);
                        }
                    }
                };
                const alignDates = () =>
                    align(
                        '.day-label',
                        view === 'day' ? '.all-day' : '.all-day-day-column',
                        view === 'day' ? '.timed-content' : '.day-column',
                    );
                alignDates();
                const minute = () => {
                    const inset = parseFloat(getComputedStyle(scroll).paddingTop);
                    return (scroll.scrollTop - inset) / snapshot(calendar, view).values.minute;
                };
                scroll.scrollTop = Math.round(
                    parseFloat(getComputedStyle(scroll).paddingTop) + 530 * values.minute,
                );
                band.style.maxBlockSize = 'none';
                if (emulateClassic) root.append(style);
                await settle();
                expect(band.scrollHeight).to.be.at.most(band.clientHeight + 1);
                alignDates();
                align('.time-header', '.all-day-time-header', '.time-labels');
                expect(minute()).to.be.closeTo(530, 2);

                band.style.maxBlockSize = '28px';
                await settle();
                expect(band.scrollHeight).to.be.greaterThan(band.clientHeight);
                band.scrollTop = band.scrollHeight;
                expect(band.scrollTop).to.be.greaterThan(0);
                alignDates();
                align('.time-header', '.all-day-time-header', '.time-labels');
                expect(minute()).to.be.closeTo(530, 2);
                if (emulateClassic) expect(scroll.offsetWidth - scroll.clientWidth).to.equal(16);
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
                    await fixture<Calendar>(html`<lms-calendar scroll-time-grid locale="en" style="width:530px;--height:900px"
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
