import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import '../../../src/components/Month.ts';
import '../../../src/components/Year.ts';
import '../../../src/components/Entry.ts';
import type Entry from '../../../src/components/Entry.ts';
import type Month from '../../../src/components/Month.ts';
import type Year from '../../../src/components/Year.ts';

const date = { year: 2026, month: 3, day: 10 };
const interval = { start: date, end: date };
const settle = async () => {
    await nextFrame();
    await nextFrame();
};
const dateButton = (el: Month | Year, key: string) =>
    el.shadowRoot!.querySelector<HTMLButtonElement>(`button[data-date="${key}"]`)!;

for (const tag of ['month', 'year'] as const) {
    describe(`${tag} date keyboard contract`, () => {
        let el: Month | Year;
        beforeEach(async () => {
            el =
                tag === 'month'
                    ? await fixture<Month>(
                          html`<lms-calendar-month .activeDate=${date} style="height:600px;width:900px"></lms-calendar-month>`,
                      )
                    : await fixture<Year>(
                          html`<lms-calendar-year .activeDate=${date} style="height:600px;width:900px"></lms-calendar-year>`,
                      );
        });
        it('has complete grid row/cell ownership and a bounded number of date tab stops', async () => {
            const grids = el.shadowRoot!.querySelectorAll('[role="grid"]');
            expect(grids.length).to.equal(tag === 'month' ? 1 : 12);
            for (const grid of grids) {
                expect(grid.querySelectorAll(':scope > [role="row"]').length).to.be.greaterThan(0);
                for (const row of grid.querySelectorAll('[role="row"]')) {
                    expect(row.querySelector('[role="gridcell"], [role="columnheader"]')).to.exist;
                }
            }
            expect(
                el.shadowRoot!.querySelectorAll('button[data-date][tabindex="0"]').length,
            ).to.equal(tag === 'month' ? 1 : 12);
            expect(el.shadowRoot!.querySelector('button[aria-selected]')).not.to.exist;
            await expect(el).to.be.accessible();
        });
        it('activates its native date label exactly once with click, Enter, and actual Space', async () => {
            const received: CalendarDate[] = [];
            el.addEventListener('expand', (event) =>
                received.push((event as CustomEvent).detail.date),
            );
            const button = dateButton(el, '2026-3-10');
            button.click();
            button.focus();
            await sendKeys({ press: 'Enter' });
            await sendKeys({ press: ' ' });
            expect(received).to.deep.equal([date, date, date]);
        });
        it('supports arrows, week boundaries, month paging and leap-day clamping without drilling', async () => {
            let expands = 0;
            el.addEventListener('expand', () => expands++);
            await el.focusDate(date);
            await sendKeys({ press: 'ArrowRight' });
            await settle();
            expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-11'));
            await sendKeys({ press: 'Home' });
            await settle();
            expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-9'));
            await sendKeys({ press: 'End' });
            await settle();
            expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-15'));
            await sendKeys({ press: 'ArrowUp' });
            await settle();
            expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-8'));
            await el.focusDate({ year: 2026, month: 3, day: 31 });
            await sendKeys({ press: 'PageUp' });
            await settle();
            expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-2-28'));
            expect(expands).to.equal(0);
        });
        it('reverses horizontal arrows in RTL while preserving chronological vertical movement', async () => {
            el.dir = 'rtl';
            await el.focusDate(date);
            await sendKeys({ press: 'ArrowLeft' });
            await settle();
            expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-11'));
            await sendKeys({ press: 'ArrowDown' });
            await settle();
            expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-18'));
        });
        it('keeps one active date in each grid after owner navigation', async () => {
            el.activeDate = { year: 2027, month: 2, day: 5 };
            await el.updateComplete;
            const active = dateButton(el, '2027-2-5');
            expect(active.tabIndex).to.equal(0);
            await el.focusDate();
            expect(el.shadowRoot!.activeElement).to.equal(active);
        });
    });
}

describe('Date composite boundaries and week controls', () => {
    it('keeps a full year to 24 ordinary stops and exposes week activation through F2/Escape', async () => {
        const el = await fixture<Year>(
            html`<lms-calendar-year .activeDate=${date} style="height:600px;width:900px"></lms-calendar-year>`,
        );
        const ordinary = Array.from(
            el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button'),
        ).filter((button) => button.tabIndex === 0);
        expect(ordinary).to.have.length(24);
        await el.focusDate(date);
        await sendKeys({ press: 'F2' });
        await settle();
        const week = el.shadowRoot!.activeElement as HTMLButtonElement;
        expect(week.classList.contains('cw-label')).to.be.true;
        expect(week.tabIndex).to.equal(0);
        let result: { drillTarget: string; date: CalendarDate } | undefined;
        el.addEventListener('expand', (event) => {
            result = (event as CustomEvent).detail;
        });
        await sendKeys({ press: 'Enter' });
        expect(result!.drillTarget).to.equal('week');
        expect(result!.date).to.deep.equal({ year: 2026, month: 3, day: 9 });
        await sendKeys({ press: 'Escape' });
        await settle();
        expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-10'));
    });
    it('emits same-view navigation and retains focus when paging across a year', async () => {
        const el = await fixture<Year>(
            html`<lms-calendar-year .activeDate=${date} style="height:600px;width:900px"></lms-calendar-year>`,
        );
        let navigated: CalendarDate | undefined;
        el.addEventListener('date-navigate', (event) => {
            navigated = (event as CustomEvent).detail.date;
        });
        await el.focusDate(date);
        await sendKeys({ press: 'Shift+PageUp' });
        await settle();
        expect(navigated).to.deep.equal({ year: 2025, month: 3, day: 10 });
        expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2025-3-10'));
    });
    it('honors non-Monday week boundaries without changing native modified-key behavior', async () => {
        const el = await fixture<Month>(
            html`<lms-calendar-month .activeDate=${date} .firstDayOfWeek=${0} style="height:600px;width:900px"></lms-calendar-month>`,
        );
        await el.focusDate(date);
        await sendKeys({ press: 'Home' });
        await settle();
        expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-8'));
        await sendKeys({ press: 'End' });
        await settle();
        expect(el.shadowRoot!.activeElement).to.equal(dateButton(el, '2026-3-14'));
        const modified = new KeyboardEvent('keydown', {
            key: 'ArrowLeft',
            ctrlKey: true,
            cancelable: true,
        });
        dateButton(el, '2026-3-14').dispatchEvent(modified);
        expect(modified.defaultPrevented).to.be.false;
    });
});

describe('Month disclosure and event isolation', () => {
    it('uses a dedicated accessible summary button with visible count in its name', async () => {
        const el =
            await fixture<Month>(html`<lms-calendar-month .activeDate=${date} style="height:600px;width:500px">
            <span slot="summary-2026-3-10">3 events</span>
        </lms-calendar-month>`);
        await settle();
        let result: CalendarDate | undefined;
        let expands = 0;
        el.addEventListener('date-summary', (event) => {
            result = (event as CustomEvent).detail.date;
        });
        el.addEventListener('expand', () => expands++);
        const summary = el.shadowRoot!.querySelector<HTMLButtonElement>(
            '.day[data-date="2026-3-10"] .summary',
        )!;
        expect(summary.hidden).to.be.false;
        expect(summary.querySelector('slot')!.assignedElements()[0].textContent).to.equal(
            '3 events',
        );
        summary.focus();
        await sendKeys({ press: ' ' });
        expect(result).to.deep.equal(date);
        expect(expands).to.equal(0);
        expect(el.querySelector('lms-calendar-entry')).not.to.exist;
    });
    it('discloses dense days and removes clipped event targets from rendering, not just their tab order', async () => {
        const el =
            await fixture<Month>(html`<lms-calendar-month .activeDate=${date} .maxVisibleRows=${2} style="height:800px;width:900px">
            ${Array.from({ length: 5 }, (_, index) => html`<lms-calendar-entry slot="2026-3-10" heading=${`Event ${index}`} .date=${interval}></lms-calendar-entry>`)}
        </lms-calendar-month>`);
        await settle();
        const entries = el.querySelectorAll<HTMLElement>('lms-calendar-entry');
        expect(entries.length).to.equal(5);
        expect(getComputedStyle(entries[0]).display).not.to.equal('none');
        expect(getComputedStyle(entries[1]).display).not.to.equal('none');
        for (const entry of Array.from(entries).slice(2))
            expect(getComputedStyle(entry).display).to.equal('none');
        const summary = el.shadowRoot!.querySelector<HTMLButtonElement>(
            '.day[data-date="2026-3-10"] .summary',
        )!;
        expect(summary.textContent).to.include('5');
        expect(summary.hidden).to.be.false;
        let opens = 0;
        let expands = 0;
        el.addEventListener('open-menu', () => opens++);
        el.addEventListener('expand', () => expands++);
        entries[0].shadowRoot!.querySelector<HTMLElement>('.title')!.click();
        expect(opens).to.equal(1);
        expect(expands).to.equal(0);
    });
    it('preserves assigned all-day row gaps in actual month geometry', async () => {
        const el =
            await fixture<Month>(html`<lms-calendar-month .activeDate=${date} style="height:1000px;width:900px">
            <lms-calendar-entry slot="2026-3-10" style="--all-day-row:0" .date=${interval} heading="A"></lms-calendar-entry>
            <lms-calendar-entry slot="2026-3-10" style="--all-day-row:1" .date=${interval} heading="B Tue"></lms-calendar-entry>
            <lms-calendar-entry slot="2026-3-11" style="--all-day-row:1" .date=${interval} heading="B Wed"></lms-calendar-entry>
        </lms-calendar-month>`);
        await settle();
        const entries = el.querySelectorAll<HTMLElement>('lms-calendar-entry');
        const top = (entry: HTMLElement, key: string) =>
            entry.getBoundingClientRect().top -
            el.shadowRoot!.querySelector(`.day[data-date="${key}"]`)!.getBoundingClientRect().top;
        expect(top(entries[1], '2026-3-10')).to.be.closeTo(top(entries[2], '2026-3-11'), 0.5);
        expect(top(entries[1], '2026-3-10') - top(entries[0], '2026-3-10')).to.be.at.least(24);
    });
});

describe('Entry activation boundary', () => {
    it('remains actionable after canceled activation and detach/reattach without duplicate listeners', async () => {
        const el = await fixture<Entry>(
            html`<lms-calendar-entry heading="Repeat activation" .date=${interval}></lms-calendar-entry>`,
        );
        let activations = 0;
        el.addEventListener('open-menu', (event) => {
            activations++;
            event.preventDefault();
        });
        el.click();
        el.click();
        expect(activations).to.equal(2);
        const container = el.parentElement!;
        el.remove();
        container.append(el);
        el.focus();
        await sendKeys({ press: 'Enter' });
        expect(activations).to.equal(3);
    });
    it('keeps an explicitly timed continuation distinct from all-day presentation', async () => {
        const time = { start: { hour: 0, minute: 0 }, end: { hour: 24, minute: 0 } };
        const canonical = { kind: 'timed', heading: 'Timed continuation', date: interval, time };
        const el = await fixture<Entry>(
            html`<lms-calendar-entry heading="Timed continuation" .isContinuation=${true} .time=${time} .canonicalEntry=${canonical}></lms-calendar-entry>`,
        );
        expect(el.shadowRoot!.querySelector('.time')!.textContent).not.to.include('All Day');
    });
    it('keeps visible title in names, rejects positive tab order, and emits canonical cancelable activation', async () => {
        const canonical = {
            id: 'event-1',
            kind: 'all-day',
            date: { start: date, end: { ...date, day: 12 } },
            heading: 'Visible title',
        };
        const el =
            await fixture<Entry>(html`<lms-calendar-entry heading="Visible title" .date=${interval}
            .canonicalEntry=${canonical} eventId="event-1" .accessibility=${{ tabIndex: 540, role: 'button', ariaLabel: 'March 10, 2026, 9 AM' }}></lms-calendar-entry>`);
        expect(el.tabIndex).to.equal(0);
        expect(el.getAttribute('aria-label')).to.include('Visible title');
        expect(el.hasAttribute('aria-selected')).to.be.false;
        let request: CustomEvent | undefined;
        el.addEventListener('open-menu', (event) => {
            request = event as CustomEvent;
            event.preventDefault();
        });
        el.focus();
        await sendKeys({ press: ' ' });
        expect(request).to.exist;
        expect(request!.cancelable).to.be.true;
        expect(request!.bubbles).to.be.true;
        expect(request!.composed).to.be.true;
        expect(request!.defaultPrevented).to.be.true;
        expect(request!.detail.entry).to.equal(canonical);
        expect(request!.detail.eventId).to.equal('event-1');
        await expect(el).to.be.accessible();
    });
});
