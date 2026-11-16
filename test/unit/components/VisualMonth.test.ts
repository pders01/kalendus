import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import '../../../src/lms-calendar.ts';
import type Entry from '../../../src/components/Entry.ts';
import type Month from '../../../src/components/Month.ts';
import type Calendar from '../../../src/lms-calendar.ts';

const date = { year: 2026, month: 6, day: 15 };
const key = '2026-6-15';
const settle = async (month: Month) => {
    // Settle resize -> slot measurement -> reactive footer updates in both
    // the pre-correction source and current source, without requiring new markup.
    for (let index = 0; index < 4; index++) {
        await month.updateComplete;
        await nextFrame();
    }
};
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
    it('keeps weekday headers separate from dates and whole count controls inside a short calendar', async () => {
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .activeDate=${date} .entries=${entryList(6)} style="width:752px;height:380px"></lms-calendar>`,
        );
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        await settle(month);
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
        expect(month.shadowRoot!.querySelectorAll('button.indicator')).to.have.length(42);
    });

    it('uses available height instead of an unconditional two-row cap or redundant footer', async () => {
        const month =
            await fixture<Month>(html`<lms-calendar-month .activeDate=${date} style="display:block;height:700px;width:900px;font-size:16px">
            ${entryList(3).map((entry) => html`<lms-calendar-entry slot=${key} .heading=${entry.heading}></lms-calendar-entry>`)}
        </lms-calendar-month>`);
        await settle(month);
        expect(month.querySelectorAll('[data-month-overflow]')).to.have.length(0);
        expect(summary(month).hidden).to.equal(true);
        const entries = [...month.querySelectorAll('lms-calendar-entry')];
        for (let index = 1; index < entries.length; index++) {
            expect(entries[index].getBoundingClientRect().top).to.be.at.least(
                entries[index - 1].getBoundingClientRect().bottom,
            );
        }
    });

    it('counts only hidden entries in the overflow affordance, retains the total in its description, and recovers after resize', async () => {
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
        month.style.height = '1100px';
        await waitUntil(() => month.querySelectorAll('[data-month-overflow]').length === 0);
        await month.updateComplete;
        expect(summary(month).hidden).to.equal(true);
    });

    for (const locale of ['en', 'ar']) {
        it(`keeps narrow ${locale} counts on one line, named by date and keyboard-activatable`, async () => {
            const calendar = await fixture<Calendar>(
                html`<lms-calendar .activeDate=${date} .entries=${entryList(6)} .locale=${locale} style="width:288px;height:660px"></lms-calendar>`,
            );
            await calendar.localeReady;
            const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
            await waitUntil(() => !summary(month).hidden);
            await month.updateComplete;
            const button = summary(month);
            const slotted = button.querySelector('slot')!.assignedElements()[0];
            expect(slotted.textContent).to.equal(new Intl.NumberFormat(locale).format(6));
            const rect = button.getBoundingClientRect();
            expect(rect.height).to.be.at.least(24);
            expect(rect.height).to.be.at.most(32);
            const cell = button.closest('.day')!.getBoundingClientRect();
            expect(rect.left).to.be.at.least(cell.left);
            expect(rect.right).to.be.at.most(cell.right);
            const ids = button.getAttribute('aria-labelledby')!.split(' ');
            expect(
                ids.map((id) => month.shadowRoot!.getElementById(id)!.textContent).join(' '),
            ).to.include('2026');
            let count = 0;
            calendar.addEventListener('date-summary', () => count++);
            button.focus();
            await sendKeys({ press: ' ' });
            expect(count).to.equal(1);
            await calendar.updateComplete;
            expect(calendar.viewMode).to.equal('day');
            expect(calendar.activeDate).to.deep.equal(date);
        });
    }

    it('spends all-day band width on the heading without removing all-day information from the accessible name', async () => {
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .viewMode=${'week'} .activeDate=${date} .entries=${[{ id: 'all-day-visual', date: { start: date, end: date }, heading: 'Design conference', kind: 'all-day' }]} style="width:1136px;height:760px"></lms-calendar>`,
        );
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
