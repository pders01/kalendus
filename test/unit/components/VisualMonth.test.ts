import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import '../../../src/lms-calendar.ts';
import type Entry from '../../../src/components/Entry.ts';
import type Month from '../../../src/components/Month.ts';
import { getMessageFormatters } from '../../../src/lib/messages.ts';
import type Calendar from '../../../src/lms-calendar.ts';

const date = { year: 2026, month: 6, day: 15 };
const key = '2026-6-15';
const settle = async (month: Month) => {
    // Preserve the original geometry regression's intent without rewriting
    // historical captures: current Month budgets rows in normal document flow.
    for (let index = 0; index < 4; index++) {
        await month.updateComplete;
        await nextFrame();
    }
};
async function settleCalendar(calendar: Calendar) {
    await calendar.localeReady;
    await calendar.updateComplete;
    await waitUntil(() => {
        const container = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-container')!;
        const style = getComputedStyle(container);
        const width =
            container.getBoundingClientRect().width -
            parseFloat(style.borderLeftWidth) -
            parseFloat(style.borderRightWidth) -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight);
        return width > 0 && Math.abs(calendar._calendarWidth - width) < 0.5;
    }, 'root commits its measured width');
    await calendar.updateComplete;
    const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month');
    if (month) await settle(month);
}
const summary = (month: Month) =>
    month.shadowRoot!.querySelector<HTMLButtonElement>(`.day[data-date="${key}"] .summary`)!;
const entryList = (count: number): CalendarEntry[] =>
    Array.from({ length: count }, (_, index) => ({
        id: `visual-${index}`,
        date: { start: date, end: date },
        heading: `Event ${index + 1}`,
        time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
    }));

// These assert actual layout and discoverability, not just template shape or axe output.
describe('Month visual geometry and density', () => {
    it('keeps weekday headers and whole overflow controls separate in normal-flow Month despite a short legacy height', async () => {
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .activeDate=${date} .entries=${entryList(6)} .monthDayBehavior=${'day'} style="width:900px;height:380px"></lms-calendar>`,
        );
        await settleCalendar(calendar);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        expect(month.compact).to.equal(false);
        await waitUntil(() => !summary(month).hidden);
        const weekdays = month.shadowRoot!.querySelector('.weekdays')!.getBoundingClientRect();
        const firstRow = month.shadowRoot!.querySelector('.week')!.getBoundingClientRect();
        expect(weekdays.height).to.be.greaterThan(16);
        expect(firstRow.top).to.be.at.least(weekdays.bottom - 0.5);
        const cell = summary(month).closest('.day')!.getBoundingClientRect();
        const button = summary(month).getBoundingClientRect();
        expect(button.height).to.be.at.least(24);
        expect(button.top).to.be.at.least(cell.top);
        expect(button.bottom).to.be.at.most(cell.bottom + 0.5);
        const grid = month.shadowRoot!.querySelector('.month')!;
        expect(grid.scrollHeight).to.be.at.most(grid.clientHeight + 1);
        expect(getComputedStyle(grid).overflowY).to.equal('visible');
        expect(calendar.getBoundingClientRect().height).to.be.greaterThan(380);
        expect(
            calendar.shadowRoot!.querySelector('.calendar-view')!.getBoundingClientRect().bottom,
        ).to.be.at.least(grid.getBoundingClientRect().bottom);
        expect(month.querySelectorAll('lms-calendar-entry')).to.have.length(6);
        expect(month.shadowRoot!.querySelectorAll('button.indicator')).to.have.length(42);
        summary(month).focus();
        await sendKeys({ press: 'Enter' });
        await settleCalendar(calendar);
        expect(calendar.viewMode).to.equal('day');
        expect(calendar.activeDate).to.deep.equal(date);
        await waitUntil(
            () => calendar.shadowRoot!.querySelectorAll('lms-calendar-entry').length === 6,
        );
        expect(
            [...calendar.shadowRoot!.querySelectorAll<HTMLElement>('lms-calendar-entry')].map(
                (card) => card.dataset.eventId,
            ),
        ).to.deep.equal(entryList(6).map((entry) => entry.id));
    });

    it('uses an explicit readable week budget rather than an unconditional two-row cap or redundant footer', async () => {
        const month =
            await fixture<Month>(html`<lms-calendar-month .activeDate=${date} style="display:block;height:700px;width:900px;font-size:16px;--month-week-height:10em">
            ${entryList(3).map((entry) => html`<lms-calendar-entry slot=${key} .heading=${entry.heading}></lms-calendar-entry>`)}
        </lms-calendar-month>`);
        await settle(month);
        expect(month.querySelectorAll('[data-month-overflow]')).to.have.length(0);
        expect(summary(month).hidden).to.equal(true);
        const entries = [...month.querySelectorAll('lms-calendar-entry')];
        expect(entries).to.have.length(3);
        for (let index = 1; index < entries.length; index++) {
            expect(entries[index].getBoundingClientRect().top).to.be.at.least(
                entries[index - 1].getBoundingClientRect().bottom,
            );
        }
    });

    it('counts only hidden entries, retains the total, ignores viewport height and recovers with a larger week budget', async () => {
        const month =
            await fixture<Month>(html`<lms-calendar-month .activeDate=${date} style="display:block;height:380px;width:900px;font-size:16px">
            ${entryList(5).map((entry) => html`<lms-calendar-entry slot=${key} .heading=${entry.heading}></lms-calendar-entry>`)}
        </lms-calendar-month>`);
        await settle(month);
        const hidden = month.querySelectorAll('[data-month-overflow]').length;
        expect(hidden).to.be.greaterThan(0);
        expect(summary(month).querySelector('slot')!.textContent).to.equal(`+${hidden}`);
        expect(summary(month).getAttribute('aria-describedby')).to.equal(
            `summary-description-${key}`,
        );
        expect(
            month.shadowRoot!.getElementById(`summary-description-${key}`)!.textContent,
        ).to.include('5 events');
        expect(month.querySelectorAll('lms-calendar-entry')).to.have.length(5);
        month.style.height = '1100px';
        await settle(month);
        expect(month.querySelectorAll('[data-month-overflow]')).to.have.length(hidden);
        month.style.setProperty('--month-week-height', '14em');
        await waitUntil(() => month.querySelectorAll('[data-month-overflow]').length === 0);
        await month.updateComplete;
        expect(summary(month).hidden).to.equal(true);
    });

    for (const locale of ['en', 'ar']) {
        it(`keeps default compact ${locale} dates native and all six real contextual titles readable`, async () => {
            const calendar = await fixture<Calendar>(html`<lms-calendar
                .activeDate=${date} .entries=${entryList(6)} .locale=${locale}
                style="width:288px;height:380px"></lms-calendar>`);
            await settleCalendar(calendar);
            const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
            expect(month.compact).to.equal(true);
            const button = month.shadowRoot!.querySelector<HTMLButtonElement>(
                `button.indicator[data-date="${key}"]`,
            )!;
            expect(button).to.be.instanceOf(HTMLButtonElement);
            expect(button.querySelector('.activity[data-active]')).to.exist;
            expect(button.getBoundingClientRect().height).to.be.at.least(44);
            expect(summary(month).hidden).to.equal(true);
            button.focus();
            await sendKeys({ press: 'Enter' });
            await settleCalendar(calendar);
            expect(calendar.viewMode).to.equal('month');
            expect(month.shadowRoot!.activeElement).to.equal(button);
            expect(month.querySelectorAll('lms-calendar-entry')).to.have.length(0);
            const rows = [
                ...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('.agenda-event'),
            ];
            expect(rows.map((row) => row.dataset.eventId)).to.deep.equal(
                entryList(6).map((entry) => entry.id),
            );
            for (const [index, row] of rows.entries()) {
                expect(row).to.be.instanceOf(HTMLButtonElement);
                expect(row.getBoundingClientRect().height).to.be.at.least(44);
                const title = row.querySelector<HTMLElement>('.agenda-title')!;
                expect(title.textContent).to.equal(entryList(6)[index].heading);
                expect(title.getBoundingClientRect().width).to.be.at.least(24);
                expect(title.scrollWidth).to.be.at.most(title.clientWidth + 1);
                expect(row.querySelector('.agenda-time')!.textContent!.trim()).not.to.equal('');
            }
            const grid = month.shadowRoot!.querySelector<HTMLElement>('.month')!;
            expect(getComputedStyle(grid).overflowY).to.equal('visible');
            expect(grid.scrollHeight).to.be.at.most(grid.clientHeight + 1);
            expect(calendar.getBoundingClientRect().height).to.be.greaterThan(380);
        });

        it(`keeps narrow ${locale} presence/date controls count-named and keyboard day-drill available by opt-in`, async () => {
            const calendar = await fixture<Calendar>(
                html`<lms-calendar .activeDate=${date} .entries=${entryList(6)} .locale=${locale} .monthDayBehavior=${'day'} style="width:288px;height:660px"></lms-calendar>`,
            );
            await settleCalendar(calendar);
            const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
            expect(month.compact).to.equal(true);
            const button = month.shadowRoot!.querySelector<HTMLButtonElement>(
                `button.indicator[data-date="${key}"]`,
            )!;
            expect(button).to.be.instanceOf(HTMLButtonElement);
            expect(button.querySelector('.activity[data-active]')).to.exist;
            expect(button.getAttribute('aria-label')).to.include(
                getMessageFormatters(locale).eventCount(6),
            );
            expect(summary(month).hidden).to.equal(true);
            const rect = button.getBoundingClientRect();
            expect(rect.height).to.be.at.least(44);
            const cell = button.closest('.day')!.getBoundingClientRect();
            expect(rect.left).to.be.at.least(cell.left);
            expect(rect.right).to.be.at.most(cell.right);
            expect(button.getAttribute('aria-label')).to.include(
                new Intl.NumberFormat(locale, { useGrouping: false }).format(2026),
            );
            let count = 0;
            calendar.addEventListener('expand', () => count++);
            button.focus();
            await sendKeys({ press: ' ' });
            expect(count).to.equal(1);
            await settleCalendar(calendar);
            expect(calendar.viewMode).to.equal('day');
            expect(calendar.activeDate).to.deep.equal(date);
        });
    }

    it('spends all-day band width on the heading without removing all-day information from the accessible name', async () => {
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .viewMode=${'week'} .activeDate=${date} .entries=${[{ id: 'all-day-visual', date: { start: date, end: date }, heading: 'Design conference', kind: 'all-day' }]} style="width:1136px;height:760px"></lms-calendar>`,
        );
        await settleCalendar(calendar);
        await waitUntil(() => !!calendar.shadowRoot!.querySelector('lms-calendar-entry'));
        const entry = calendar.shadowRoot!.querySelector<Entry>('lms-calendar-entry')!;
        await entry.updateComplete;
        expect(entry.getAttribute('aria-label')).to.include('Design conference');
        expect(entry.getAttribute('aria-label')!.toLowerCase()).to.include('all day');
        const time = entry.shadowRoot!.querySelector('.time');
        expect(time).to.exist;
        expect(getComputedStyle(time!).display).to.equal('none');
    });
});
