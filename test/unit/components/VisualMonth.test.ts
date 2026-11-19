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
    for (const { activeDate, paddingYear, validTarget, behavior } of [
        {
            activeDate: { year: 1, month: 1, day: 1 },
            paddingYear: 0,
            validTarget: { year: 1, month: 1, day: 2 },
            behavior: 'auto',
        },
        {
            activeDate: { year: 9999, month: 12, day: 31 },
            paddingYear: 10000,
            validTarget: { year: 9999, month: 11, day: 30 },
            behavior: 'day',
        },
    ]) {
        it(`keeps year ${paddingYear} display padding inert without disabling valid dates`, async () => {
            const calendar = await fixture<Calendar>(html`<lms-calendar .activeDate=${activeDate}
                .firstDayOfWeek=${0} .monthDayBehavior=${behavior} .monthAgendaPresentation=${'accordion'}
                style="width:900px;height:660px"></lms-calendar>`);
            await settleCalendar(calendar);
            const root = calendar.shadowRoot!;
            const month = root.querySelector<Month>('lms-calendar-month')!;
            const padding = month.shadowRoot!.querySelectorAll<HTMLElement>(
                `.day[data-date^="${paddingYear}-"]`,
            );
            const emitted: string[] = [];
            month.addEventListener('expand', (e) => emitted.push(e.type));
            month.addEventListener('date-summary', (e) => emitted.push(e.type));
            expect(padding.length).to.be.greaterThan(0);
            for (const cell of padding) {
                cell.click();
                const indicator = cell.querySelector<HTMLButtonElement>('.indicator')!;
                const summary = cell.querySelector<HTMLButtonElement>('.summary')!;
                expect(indicator.disabled).to.equal(true);
                expect(indicator.tabIndex).to.equal(-1);
                expect(summary.disabled).to.equal(true);
                indicator.click();
                // Bypass native disabled behavior to exercise the shared emitter too.
                indicator.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                summary.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            }
            await calendar.updateComplete;
            expect(emitted).to.be.empty;
            expect(calendar.activeDate).to.deep.equal(activeDate);
            expect(calendar.viewMode).to.equal('month');
            expect(root.querySelector('#agenda-date')).not.to.exist;

            const { year, month: targetMonth, day } = validTarget;
            const indicator = month.shadowRoot!.querySelector<HTMLButtonElement>(
                `.indicator[data-date="${year}-${targetMonth}-${day}"]`,
            )!;
            expect(indicator.disabled).to.equal(false);
            indicator.click();
            await calendar.updateComplete;
            expect(emitted).to.deep.equal(['expand']);
            expect(calendar.activeDate).to.deep.equal(validTarget);
            expect(calendar.viewMode).to.equal(behavior === 'day' ? 'day' : 'month');
            if (behavior === 'auto') expect(root.querySelector('#agenda-date')).to.exist;
        });
    }

    it('keeps headers and overflow controls whole in a short bounded Month', async () => {
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
        expect(calendar.getBoundingClientRect().height).to.equal(380);
        const viewport = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
        expect(viewport.scrollHeight).to.be.greaterThan(viewport.clientHeight);
        const mounted = month.querySelectorAll('lms-calendar-entry').length;
        expect(mounted).to.be.lessThan(6);
        expect(summary(month).querySelector('slot')!.textContent).to.equal(`+${6 - mounted}`);
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

    it('fills a tall grid embed with six equal weeks, and resizes previews to fit', async () => {
        const frame = await fixture<HTMLElement>(html`
            <div style="display:grid;inline-size:900px;block-size:1180px">
                <lms-calendar .activeDate=${date} .entries=${entryList(12)}
                    .monthDayBehavior=${'day'} style="font-size:16px"></lms-calendar>
            </div>
        `);
        const calendar = frame.querySelector<Calendar>('lms-calendar')!;
        await settleCalendar(calendar);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        const grid = month.shadowRoot!.querySelector('.month')!;
        const rows = [...grid.querySelectorAll('.week')];
        expect(rows).to.have.length(6);
        const heights = rows.map((row) => row.getBoundingClientRect().height);
        expect(Math.min(...heights)).to.be.greaterThan(104);
        expect(Math.max(...heights) - Math.min(...heights)).to.be.below(0.1);
        expect(grid.getBoundingClientRect().bottom).to.be.closeTo(
            frame.getBoundingClientRect().bottom - 1,
            1,
        );
        const tall = month.querySelectorAll('lms-calendar-entry').length;
        expect(tall).to.be.greaterThan(3);

        frame.style.blockSize = '840px';
        await settleCalendar(calendar);
        expect(month.querySelectorAll('lms-calendar-entry').length).to.be.lessThan(tall);
        expect(grid.getBoundingClientRect().bottom).to.be.closeTo(
            frame.getBoundingClientRect().bottom - 1,
            1,
        );

        const viewport = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
        frame.style.blockSize = '540px';
        await settleCalendar(calendar);
        expect(viewport.scrollHeight).to.equal(viewport.clientHeight);
        expect(month.querySelectorAll('lms-calendar-entry')).to.have.length(0);

        frame.style.blockSize = '380px';
        await settleCalendar(calendar);
        expect(calendar.getBoundingClientRect().height).to.equal(380);
        expect(viewport.scrollHeight).to.be.greaterThan(viewport.clientHeight);
        viewport.scrollTop = viewport.scrollHeight;
        expect(grid.getBoundingClientRect().bottom).to.be.closeTo(
            calendar.getBoundingClientRect().bottom - 1,
            1,
        );
    });

    it('mounts only fitting previews for a thousand events and keeps the full date list reachable', async () => {
        const entries = entryList(1000);
        const calendar =
            await fixture<Calendar>(html`<lms-calendar .activeDate=${{ ...date, day: 14 }}
            .entries=${entries} .monthAgendaPresentation=${'accordion'}
            style="width:900px;font-size:16px"></lms-calendar>`);
        await settleCalendar(calendar);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        const mounted = [...month.querySelectorAll<HTMLElement>('lms-calendar-entry')];
        expect(mounted.length).to.be.within(1, 3);
        expect(mounted.map((entry) => entry.dataset.eventId)).to.deep.equal(
            entries.slice(0, mounted.length).map((entry) => entry.id),
        );
        expect(summary(month).querySelector('slot')!.textContent).to.equal(
            `+${new Intl.NumberFormat('en').format(entries.length - mounted.length)}`,
        );
        expect(
            month.shadowRoot!.getElementById(`summary-description-${key}`)!.textContent,
        ).to.include(getMessageFormatters('en').eventCount(entries.length));
        summary(month).click();
        await calendar.updateComplete;
        const root = calendar.shadowRoot!;
        expect(root.querySelectorAll('.agenda-event')).to.have.length(50);
        expect(root.querySelectorAll('.agenda-title')[49].textContent).to.equal('Event 50');
        root.querySelector<HTMLButtonElement>('.agenda-more')!.click();
        await calendar.updateComplete;
        expect(root.querySelectorAll('.agenda-title')[99].textContent).to.equal('Event 100');
        let activated: string | undefined;
        calendar.addEventListener(
            'entry-activate',
            (event) => {
                activated = (event as CustomEvent<{ eventId: string }>).detail.eventId;
                event.preventDefault();
            },
            { once: true },
        );
        root.querySelectorAll<HTMLButtonElement>('.agenda-event')[99].click();
        expect(activated).to.equal('visual-99');
        expect(calendar.entries).to.equal(entries);
    });

    it('recomputes previews after a row-token change and returns displaced focus to the disclosure', async () => {
        const calendar = await fixture<Calendar>(html`<lms-calendar .activeDate=${date}
            .entries=${entryList(4)} style="width:900px;font-size:16px;--month-week-height:12em"></lms-calendar>`);
        await settleCalendar(calendar);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        const cards = () => [...month.querySelectorAll<Entry>('lms-calendar-entry')];
        const initial = cards();
        expect(initial).to.have.length(4);
        expect(summary(month).hidden).to.equal(true);
        initial[3].focus();
        expect(calendar.shadowRoot!.activeElement).to.equal(initial[3]);
        calendar.style.setProperty('--all-day-row-height', '3rem');
        await waitUntil(() => month.shadowRoot!.activeElement === summary(month));
        expect(cards().length).to.be.within(1, 3);
        expect(cards()[0]).to.equal(initial[0]);
        expect(initial[3].isConnected).to.equal(false);
        expect(summary(month).querySelector('slot')!.textContent).to.equal(
            `+${4 - cards().length}`,
        );
        calendar.style.removeProperty('--all-day-row-height');
        await waitUntil(() => summary(month).hidden && cards().length === 4);
        expect(cards()[0]).to.equal(initial[0]);
        expect(month.shadowRoot!.activeElement).to.equal(
            month.shadowRoot!.querySelector(`.indicator[data-date="${key}"]`),
        );
    });

    it('counts events rather than empty span lanes and restores the same row placements on growth', async () => {
        const end = { ...date, day: 17 };
        const allDay = (id: string, endDay: number): CalendarEntry => ({
            id,
            kind: 'all-day',
            heading: id,
            date: { start: date, end: { ...date, day: endDay } },
        });
        const entries = [
            allDay('a', 16),
            allDay('b', 16),
            allDay('c', 16),
            allDay('d', 17),
            { ...entryList(1)[0], date: { start: end, end } },
        ];
        const calendar = await fixture<Calendar>(html`<lms-calendar .activeDate=${date}
            .entries=${entries} style="width:900px;font-size:16px"></lms-calendar>`);
        await settleCalendar(calendar);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        const lastDate = '2026-6-17';
        const footer = month.shadowRoot!.querySelector<HTMLButtonElement>(
            `.summary[data-date="${lastDate}"]`,
        )!;
        const cards = () => [
            ...month.querySelectorAll<Entry>(`lms-calendar-entry[slot="${lastDate}"]`),
        ];
        expect(cards()).to.have.length(0);
        expect(footer.hidden).to.equal(false);
        expect(footer.querySelector('slot')!.textContent).to.equal('+2');
        calendar.style.setProperty('--month-week-height', '14em');
        await waitUntil(() => footer.hidden && cards().length === 1);
        expect(cards()[0].dataset.eventId).to.equal('visual-0');
        expect(cards()[0].style.getPropertyValue('--all-day-row')).to.equal('4');
        const bar = month.querySelector<Entry>('[data-event-id="d"]')!;
        expect(bar.style.getPropertyValue('--all-day-row')).to.equal('3');
        expect(bar.date).to.deep.equal({ start: date, end });
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

    it('restores preview focus to the date when compact Month hides its overflow button', async () => {
        const calendar = await fixture<Calendar>(html`<lms-calendar .activeDate=${date}
            .entries=${entryList(12)} style="width:900px;height:880px;font-size:16px"></lms-calendar>`);
        await settleCalendar(calendar);
        const month = calendar.shadowRoot!.querySelector('lms-calendar-month')!;
        await waitUntil(() => !summary(month).hidden && month.querySelector('lms-calendar-entry'));
        const preview = month.querySelector('lms-calendar-entry')!;
        const indicator = month.shadowRoot!.querySelector(`.indicator[data-date="${key}"]`)!;
        // The root chooses a replacement before Month has repainted its controls.
        month.compact = true;
        expect(summary(month).hidden).to.equal(false);
        expect(month.previewFocusTarget(key)).to.equal(indicator);
        month.compact = false;
        preview.focus();
        expect(calendar.shadowRoot!.activeElement).to.equal(preview);

        calendar.style.width = '390px';
        await settleCalendar(calendar);
        expect(month.compact).to.equal(true);
        expect(summary(month).hidden).to.equal(true);
        expect(month.shadowRoot!.activeElement).to.equal(indicator);
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
            expect(calendar.getBoundingClientRect().height).to.equal(380);
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
        expect(entry.shadowRoot!.querySelector('.time')).to.equal(null);
    });
});
