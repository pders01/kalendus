import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import type Week from '../../../src/components/Week.js';
import { getMessages } from '../../../src/lib/messages.js';
import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const activeDate = { year: 2026, month: 11, day: 17 };

async function settle(calendar: Calendar) {
    await calendar.localeReady;
    for (let i = 0; i < 5; i++) {
        await calendar.updateComplete;
        await nextFrame();
    }
}

const calendarView = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
const week = (calendar: Calendar) =>
    calendarView(calendar).querySelector<Week>('lms-calendar-week')!;
const header = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector('lms-calendar-header')!.shadowRoot!;
const pager = (calendar: Calendar) =>
    week(calendar).shadowRoot!.querySelectorAll<HTMLButtonElement>('.peek-indicator');

function assertPagerInView(calendar: Calendar) {
    const pane = calendarView(calendar).getBoundingClientRect();
    for (const button of pager(calendar)) {
        const box = button.getBoundingClientRect();
        expect(box.left).to.be.at.least(pane.left - 1);
        expect(box.right).to.be.at.most(pane.right + 1);
        expect(box.width).to.be.at.least(44);
        expect(box.height).to.be.at.least(44);
    }
}

function timedPosition(calendar: Calendar) {
    const view = week(calendar);
    const scroller = view.shadowRoot!.querySelector<HTMLElement>('.week-scroll')!;
    const inset = parseFloat(getComputedStyle(scroller).paddingTop);
    const scale = parseFloat(getComputedStyle(view).getPropertyValue('--minute-height'));
    return { scroller, inset, scale, minute: (scroller.scrollTop - inset) / scale };
}

const timedEntry = {
    id: 'briefing',
    heading: 'Morning briefing',
    kind: 'timed' as const,
    date: { start: activeDate, end: activeDate },
    time: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 30 } },
};

describe('Narrow Week header in the library calendar', () => {
    for (const locale of ['en', 'ar']) {
        it(`keeps the pane and pager visible when a truly tiny embed needs panning (${locale})`, async () => {
            const calendar = await fixture<Calendar>(html`
                <lms-calendar locale=${locale} .activeDate=${activeDate} .entries=${[timedEntry]}
                    view-mode="week" style="width:230px;height:720px;font:24px Arial"></lms-calendar>
            `);
            await settle(calendar);
            const view = calendarView(calendar);
            const weekRoot = week(calendar).shadowRoot!;
            const overflow = view.scrollWidth - view.clientWidth;
            expect(overflow).to.be.greaterThan(0);
            assertPagerInView(calendar);
            const buttons = [...pager(calendar)];
            const messages = getMessages(locale);
            expect(buttons[0].getAttribute('aria-label')).to.include(messages.showEarlierDays);
            expect(buttons[1].getAttribute('aria-label')).to.include(messages.showLaterDays);
            expect(buttons[0].querySelector('.peek-glyph')!.textContent).to.equal('‹');
            expect(buttons[1].querySelector('.peek-glyph')!.textContent).to.equal('›');
            expect(getComputedStyle(weekRoot.querySelector('.window-range')!).display).to.equal(
                'none',
            );
            expect(weekRoot.querySelector('.window-position')!.textContent).to.equal(
                new Intl.NumberFormat(locale).format(2) +
                    '/' +
                    new Intl.NumberFormat(locale).format(7),
            );
            const rect = (el: Element) => el.getBoundingClientRect().x;
            const [previous, next] = buttons.map(rect);
            expect(locale === 'ar' ? previous > next : previous < next).to.equal(true);
            const label = weekRoot.querySelector('.day-label')!;
            const grid = weekRoot.querySelector('.day-column')!;
            const initial = [rect(label), rect(grid)];
            const step = locale === 'ar' ? -1 : 1;
            view.scrollLeft = step * overflow;
            await nextFrame();
            assertPagerInView(calendar);
            expect(rect(buttons[0])).to.be.closeTo(previous, 1);
            expect(rect(buttons[1])).to.be.closeTo(next, 1);
            expect(rect(label) - initial[0]).to.be.closeTo(-step * overflow, 1);
            expect(rect(grid) - initial[1]).to.be.closeTo(-step * overflow, 1);
        });
    }

    for (const locale of ['en', 'ar']) {
        for (const viewMode of ['day', 'week'] as const) {
            it(`fits the whole ${viewMode} column in a 288px embed with 24px text (${locale})`, async () => {
                const calendar = await fixture<Calendar>(html`
                    <lms-calendar locale=${locale} .activeDate=${activeDate} .entries=${[timedEntry]}
                        .viewMode=${viewMode} style="width:288px;height:500px;font:24px Arial"></lms-calendar>
                `);
                await settle(calendar);
                const pane = calendarView(calendar);
                const root = pane.querySelector(`lms-calendar-${viewMode}`)!.shadowRoot!;
                const timeline = root.querySelector<HTMLElement>('.main, .week-scroll')!;
                const column = timeline.querySelector('.timed-content, .day-column')!;
                const box = column.getBoundingClientRect();
                const visible = timeline.getBoundingClientRect();
                expect(box.width).to.be.at.least(128);
                expect(box.left).to.be.at.least(visible.left);
                expect(box.right).to.be.at.most(visible.right);
                expect(pane.scrollWidth).to.be.at.most(pane.clientWidth + 1);
                expect(timeline.scrollWidth).to.be.at.most(timeline.clientWidth + 1);
                const card = pane.querySelector('lms-calendar-entry')!.getBoundingClientRect();
                expect(card.left).to.be.at.least(box.left - 1);
                expect(card.right).to.be.at.most(box.right + 1);
                if (viewMode === 'week') assertPagerInView(calendar);
            });
        }
    }

    it('uses the compact pager in a wide but shallow embed without hiding the day headers', async () => {
        const calendar = await fixture<Calendar>(html`
            <lms-calendar .activeDate=${activeDate} .entries=${[timedEntry]}
                view-mode="week" style="inline-size:812px;block-size:358px;font:16px Arial"></lms-calendar>
        `);
        await settle(calendar);
        const root = week(calendar).shadowRoot!;
        const range = root.querySelector('.window-range')!;
        expect(getComputedStyle(range).display).to.equal('none');
        expect(root.querySelectorAll('.day-label').length).to.be.greaterThan(2);
        expect(
            root.querySelector('.peek-indicators')!.getBoundingClientRect().height,
        ).to.be.at.most(46);
        assertPagerInView(calendar);
        const [, later] = pager(calendar);
        expect(later.getAttribute('aria-label')).to.include(getMessages('en').showLaterDays);
        const short = timedPosition(calendar);
        short.scroller.scrollTop = short.inset + 520 * short.scale;

        calendar.style.blockSize = '640px';
        await settle(calendar);
        expect(getComputedStyle(range).display).not.to.equal('none');
        expect(timedPosition(calendar).minute).to.be.closeTo(520, 2);
    });

    it('steps days by keyboard, preserves the timed position, and still changes weeks with the top arrows', async () => {
        // January 2 is within a week that began in December.
        const date = { year: 2027, month: 1, day: 2 };
        const calendar = await fixture<Calendar>(html`
            <lms-calendar .activeDate=${date} view-mode="week"
                style="width:288px;height:720px;font:24px Arial"></lms-calendar>
        `);
        await settle(calendar);
        const period = header(calendar).querySelector('.week-range')!;
        const nominalWeek = period.textContent;
        const initial = timedPosition(calendar);
        initial.scroller.scrollTop = initial.inset + 520 * initial.scale;
        const [previous, next] = pager(calendar);
        next.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(calendar.activeDate).to.deep.equal({ year: 2027, month: 1, day: 3 });
        expect(next.disabled).to.equal(true);
        expect(period.textContent).to.equal(nominalWeek);
        const focused = week(calendar).shadowRoot!.activeElement as HTMLElement;
        expect(focused.dataset.date).to.equal('2027-1-3');
        expect(parseFloat(getComputedStyle(focused).outlineWidth)).to.be.at.least(2);
        expect(timedPosition(calendar).minute).to.be.closeTo(520, 2);
        previous.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(calendar.activeDate).to.deep.equal(date);
        expect(next.disabled).to.equal(false);
        const globalPrevious =
            header(calendar).querySelector<HTMLButtonElement>('button[name="previous"]')!;
        globalPrevious.click();
        await settle(calendar);
        expect(calendar.activeDate).to.deep.equal({ year: 2026, month: 12, day: 26 });
        expect(period.textContent).not.to.equal(nominalWeek);
        expect(timedPosition(calendar).minute).to.be.closeTo(520, 2);
    });

    for (const [locale, firstDay, start, end] of [
        ['en', 1, 4, 6],
        ['ar', 0, 3, 5],
    ] as const) {
        it(`opens the next condensed week at days 1–2 across the year boundary (${locale})`, async () => {
            const date = { year: 2026, month: 12, day: 31 };
            const calendar = await fixture<Calendar>(html`
                <lms-calendar locale=${locale} .firstDayOfWeek=${firstDay} .activeDate=${date}
                    view-mode="week" scroll-time-grid style="width:390px;height:720px;font:16px Arial"></lms-calendar>
            `);
            await settle(calendar);
            const [earlier, later] = pager(calendar);
            const position = week(calendar).shadowRoot!.querySelector('.window-position')!;
            const number = new Intl.NumberFormat(locale);
            const initial = timedPosition(calendar);
            initial.scroller.scrollTop = initial.inset + 520 * initial.scale;
            for (let i = 0; i < 6 && !later.disabled; i++) {
                later.click();
                await settle(calendar);
            }
            expect(later.disabled).to.equal(true);
            expect(position.textContent).to.equal(
                `${number.format(6)}–${number.format(7)}/${number.format(7)}`,
            );
            const states: (typeof calendar.visibleRange)[] = [];
            calendar.addEventListener('calendar-state-change', (event) =>
                states.push(event.detail.range),
            );
            const nextWeek =
                header(calendar).querySelector<HTMLButtonElement>('button[name="next"]')!;
            nextWeek.focus();
            await sendKeys({ press: 'Enter' });
            await settle(calendar);
            const range = { start: `2027-01-0${start}`, end: `2027-01-0${end}` };
            expect(calendar.activeDate).to.deep.equal({ year: 2027, month: 1, day: start });
            expect(calendar.visibleRange).to.deep.equal(range);
            expect(states).to.deep.equal([range]);
            expect(position.textContent).to.equal(
                `${number.format(1)}–${number.format(2)}/${number.format(7)}`,
            );
            expect(earlier.disabled).to.equal(true);
            expect(later.disabled).to.equal(false);
            expect(header(calendar).activeElement).to.equal(nextWeek);
            expect(timedPosition(calendar).minute).to.be.closeTo(520, 2);
        });
    }

    it('retains the active weekday when moving forward in a full seven-column week', async () => {
        const calendar = await fixture<Calendar>(html`
            <lms-calendar .activeDate=${activeDate} view-mode="week"
                style="width:1180px;height:720px;font:16px Arial"></lms-calendar>
        `);
        await settle(calendar);
        expect(pager(calendar)).to.have.length(0);
        header(calendar).querySelector<HTMLButtonElement>('button[name="next"]')!.click();
        await settle(calendar);
        expect(calendar.activeDate).to.deep.equal({ year: 2026, month: 11, day: 24 });
        expect(calendar.visibleRange).to.deep.equal({ start: '2026-11-23', end: '2026-11-30' });
    });

    it('uses the shared compact header without hiding supplied titles or wide captions', async () => {
        const title = 'Gemeinsamer Veranstaltungskalender für internationale Zusammenarbeit';
        const calendar = await fixture<Calendar>(html`
            <lms-calendar locale="de" .activeDate=${activeDate} view-mode="week"
                style="width:358px;height:720px"></lms-calendar>
        `);
        await settle(calendar);
        const identity = header(calendar).querySelector('.calendar-title')!;
        expect(getComputedStyle(identity).display).to.equal('none');
        calendar.heading = title;
        await settle(calendar);
        expect(identity.textContent).to.equal(title);
        expect(getComputedStyle(identity).display).not.to.equal('none');
        const controls = header(calendar).querySelector<HTMLElement>('.controls')!;
        expect(controls.scrollWidth).to.equal(controls.clientWidth);
        calendar.heading = undefined;
        calendar.viewMode = 'month';
        await settle(calendar);
        expect(getComputedStyle(identity).display).to.equal('none');
        calendar.style.width = '860px';
        calendar.style.setProperty('--week-day-count', '3');
        calendar.viewMode = 'week';
        await settle(calendar);
        expect(getComputedStyle(identity).display).not.to.equal('none');
        expect(
            getComputedStyle(week(calendar).shadowRoot!.querySelector('.window-range')!).display,
        ).not.to.equal('none');
        expect(
            getComputedStyle(pager(calendar)[1].querySelector('.peek-caption')!).display,
        ).not.to.equal('none');
    });
});
