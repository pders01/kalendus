import { expect, fixture, html } from '@open-wc/testing';
import { sendKeys, setViewport } from '@web/test-runner-commands';

import '../../../src/components/Year.ts';
import type Year from '../../../src/components/Year.ts';
import type { DensityMode } from '../../../src/components/Year.ts';
import { getMessageFormatters, getMessages } from '../../../src/lib/messages.ts';
import '../../../src/lms-calendar.ts';
import type Calendar from '../../../src/lms-calendar.ts';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const rect = (element: Element) => element.getBoundingClientRect();

async function overview(width: number, densityMode: DensityMode = 'dot', fontSize = 16) {
    const element = await fixture<Year>(html`
        <lms-calendar-year
            style="inline-size: ${width}px; block-size: 644px; font: ${fontSize}px Arial; --year-cell-size: 1.8em; --year-cw-width: 1.8em; --year-grid-columns-tablet: 2; --year-grid-columns-mobile: 1"
            .activeDate=${{ year: 2026, month: 1, day: 31 }}
            .densityMode=${densityMode}
            .entrySumByDay=${{ '2026-1-15': 12, '2026-1-16': 100 }}
        ></lms-calendar-year>
    `);
    await element.updateComplete;
    await frame();
    return element;
}

function rowLengths(element: Year) {
    const rows = new Map<number, number>();
    for (const month of element.shadowRoot!.querySelectorAll('.mini-month')) {
        const top = Math.round(rect(month).top);
        rows.set(top, (rows.get(top) ?? 0) + 1);
    }
    return [...rows.values()];
}

function contains(inner: Element, outer: Element) {
    const a = rect(inner);
    const b = rect(outer);
    expect(a.left).to.be.at.least(b.left - 1);
    expect(a.right).to.be.at.most(b.right + 1);
    expect(a.top).to.be.at.least(b.top - 1);
    expect(a.bottom).to.be.at.most(b.bottom + 1);
}

function usableMonths(element: Year, minimum = 24) {
    for (const month of element.shadowRoot!.querySelectorAll<HTMLElement>('.mini-month')) {
        expect(month.scrollWidth).to.be.at.most(month.clientWidth + 1);
        for (const row of month.querySelectorAll('.day-row')) {
            const targets = [...row.querySelectorAll('button')];
            for (const target of targets) {
                expect(rect(target).width).to.be.at.least(minimum);
                expect(rect(target).height).to.be.at.least(minimum);
                contains(target, row);
            }
            targets.sort((a, b) => rect(a).left - rect(b).left);
            for (let i = 1; i < targets.length; i++) {
                expect(rect(targets[i - 1]).right).to.be.at.most(rect(targets[i]).left + 0.5);
            }
        }
        const headers = [...month.querySelectorAll('.weekday-header > span')];
        for (const row of month.querySelectorAll('.day-row')) {
            [...row.children].forEach((cell, index) => {
                expect(
                    Math.abs(
                        (rect(cell).left + rect(cell).right) / 2 -
                            (rect(headers[index]).left + rect(headers[index]).right) / 2,
                    ),
                ).to.be.lessThan(1);
            });
        }
    }
}

describe('Year overview correction: fine-pointer geometry, focus and locale grammar', () => {
    before(function () {
        if (matchMedia('(pointer: coarse)').matches) this.skip();
    });
    beforeEach(async () => setViewport({ width: 1440, height: 720 }));
    afterEach(async () => setViewport({ width: 1024, height: 768 }));

    for (const density of ['dot', 'heatmap', 'count'] as const) {
        it(`fits all twelve ${density} mini-months in the default 1408 × 644 content area`, async () => {
            const element = await overview(1408, density);
            const columns = density === 'count' ? 4 : 6;
            expect(rowLengths(element)).to.deep.equal(Array(12 / columns).fill(columns));
            const scroller = element.shadowRoot!.querySelector<HTMLElement>('.scroll-container')!;
            expect(scroller.scrollHeight).to.be.at.most(scroller.clientHeight + 1);
            const months = [...element.shadowRoot!.querySelectorAll('.mini-month')];
            for (const month of months) contains(month, scroller);
            const last = months.at(-1)!;
            expect(rect(scroller).bottom - rect(last).bottom).to.be.closeTo(12, 1);
            const firstWeekTop = rect(months[0].querySelector('.day-row')!).top;
            for (const month of months.slice(0, columns)) {
                expect(rect(month.querySelector('.day-row')!).top).to.be.closeTo(firstWeekTop, 1);
            }
            usableMonths(element);
            const active = element.shadowRoot!.querySelector('[data-date="2026-1-15"]')!;
            const date = active.querySelector('.date-number')!;
            const activity = active.querySelector('.activity-slot')!;
            contains(date, active);
            contains(activity, active);
            expect(activity.getAttribute('aria-hidden')).to.equal('true');
            expect(activity.querySelector('button, [tabindex]')).to.equal(null);
            const overlapX =
                Math.min(rect(date).right, rect(activity).right) -
                Math.max(rect(date).left, rect(activity).left);
            const overlapY =
                Math.min(rect(date).bottom, rect(activity).bottom) -
                Math.max(rect(date).top, rect(activity).top);
            expect(overlapX > 0.5 && overlapY > 0.5).to.equal(false);
            if (density === 'count')
                expect(active.querySelector('.event-count')!.textContent).to.equal('12');
            else expect(active.querySelector('.activity-mark')).not.to.equal(null);
            if (density === 'heatmap') expect(active.getAttribute('data-density')).to.equal('4');
            if (density === 'dot') expect(active.classList.contains('has-events')).to.equal(true);
        });
    }

    for (const [width, columns] of [
        [480, 2],
        [680, 3],
        [960, 4],
        [1600, 6],
    ] as const) {
        it(`fills the available width with ${columns} columns in a ${width}px embed`, async () => {
            const element = await overview(width);
            expect(rowLengths(element)).to.deep.equal(Array(12 / columns).fill(columns));
            const scroller = element.shadowRoot!.querySelector('.scroll-container')!;
            const firstRow = [...element.shadowRoot!.querySelectorAll('.mini-month')].slice(
                0,
                columns,
            );
            const grid = rect(scroller);
            expect(rect(firstRow[0]).left - grid.left).to.be.closeTo(12, 1);
            expect(grid.right - rect(firstRow.at(-1)!).right).to.be.closeTo(12, 1);
            usableMonths(element);
        });
    }

    it('fits the same developer-sized grid area in Year, Week and Day, then scrolls Year at its readable minimum', async () => {
        const embed =
            await fixture<HTMLElement>(html`<div style="display:grid; inline-size:1408px; block-size:900px; font:16px Arial">
            <lms-calendar view-mode="year" .activeDate=${{ year: 2026, month: 1, day: 31 }}></lms-calendar>
        </div>`);
        const calendar = embed.querySelector<Calendar>('lms-calendar')!;
        const area = () => calendar.shadowRoot!.querySelector('.calendar-view')!;
        const belowToolbar = () => rect(calendar.shadowRoot!.querySelector('header')!).bottom;
        const year = () => area().querySelector<Year>('lms-calendar-year')!;
        const scroll = () => year().shadowRoot!.querySelector<HTMLElement>('.scroll-container')!;
        const target = () =>
            year().shadowRoot!.querySelector<HTMLButtonElement>('[data-date="2026-1-31"]')!;
        const settle = async () => {
            await calendar.updateComplete;
            await frame();
        };
        await settle();
        expect(rect(scroll()).height).to.be.closeTo(rect(area()).height, 1);
        expect(rowLengths(year())).to.deep.equal([4, 4, 4]);
        const tallTarget = rect(target()).height;
        for (const view of ['week', 'day', 'year'] as const) {
            calendar.viewMode = view;
            await settle();
            expect(rect(calendar).height).to.equal(900);
            expect(rect(area()).top).to.be.closeTo(belowToolbar(), 1);
            expect(rect(area()).bottom).to.be.closeTo(rect(embed).bottom, 1);
        }
        calendar.style.setProperty('--year-grid-columns', '6');
        await settle();
        expect(rowLengths(year())).to.deep.equal([6, 6]);
        calendar.style.removeProperty('--year-grid-columns');

        embed.style.blockSize = '660px';
        await settle();
        expect(rowLengths(year())).to.deep.equal([6, 6]);
        expect(scroll().scrollHeight).to.be.at.most(scroll().clientHeight + 1);

        embed.style.inlineSize = '960px';
        embed.style.blockSize = '1060px';
        await settle();
        expect(rowLengths(year())).to.deep.equal([3, 3, 3, 3]);
        expect(scroll().scrollHeight).to.be.at.most(scroll().clientHeight + 1);

        embed.style.blockSize = '320px';
        await settle();
        expect(rect(area()).bottom).to.be.closeTo(rect(embed).bottom, 1);
        expect(scroll().scrollHeight).to.be.greaterThan(scroll().clientHeight);
        expect(rect(target()).height).to.be.at.least(24).and.lessThan(tallTarget);
        await year().focusDate({ year: 2026, month: 12, day: 31 });
        await frame();
        expect(scroll().scrollTop).to.be.greaterThan(0);
        contains(year().shadowRoot!.activeElement!, scroll());
    });

    it('has a bounded Year viewport without an explicit embed height', async () => {
        const calendar = await fixture<Calendar>(
            html`<lms-calendar view-mode="year" style="inline-size:400px" .activeDate=${{ year: 2026, month: 1, day: 31 }}></lms-calendar>`,
        );
        await frame();
        const year = calendar.shadowRoot!.querySelector<Year>('lms-calendar-year')!;
        const scroller = year.shadowRoot!.querySelector<HTMLElement>('.scroll-container')!;
        expect(scroller.clientHeight).to.be.greaterThan(240).and.at.most(576);
        expect(scroller.scrollHeight).to.be.greaterThan(scroller.clientHeight);
        await year.focusDate({ year: 2026, month: 12, day: 31 });
        await frame();
        contains(year.shadowRoot!.activeElement!, scroller);
    });

    it('allows deliberate scrolling for enlarged text while retaining 44px targets and reachable December', async () => {
        const element = await overview(752, 'count', 32);
        expect(rowLengths(element)).to.deep.equal(Array(12).fill(1));
        usableMonths(element, 44);
        const scroller = element.shadowRoot!.querySelector<HTMLElement>('.scroll-container')!;
        expect(scroller.scrollHeight).to.be.greaterThan(scroller.clientHeight);
        await element.focusDate({ year: 2026, month: 12, day: 31 });
        await frame();
        expect(scroller.scrollTop).to.be.greaterThan(0);
        contains(element.shadowRoot!.activeElement!, scroller);
    });

    it('preserves native date drill, month roving, F2 week drill and Escape return in RTL', async () => {
        const element = await overview(480);
        element.dir = 'rtl';
        element.drillTarget = 'day';
        const events: CustomEvent[] = [];
        element.addEventListener('expand', (event) => events.push(event as CustomEvent));
        await element.focusDate({ year: 2026, month: 1, day: 31 });
        await sendKeys({ press: 'ArrowLeft' });
        await element.updateComplete;
        await frame();
        expect((element.shadowRoot!.activeElement as HTMLElement).dataset.date).to.equal(
            '2026-2-1',
        );
        // One date stop per mini-month, with the newly focused date roving in February.
        const february = element.shadowRoot!.activeElement!.closest('.mini-month')!;
        expect(february.querySelectorAll('.day-cell[tabindex="0"]')).to.have.length(1);
        await sendKeys({ press: 'Enter' });
        await sendKeys({ press: 'F2' });
        await element.updateComplete;
        await frame();
        expect(element.shadowRoot!.activeElement!.classList.contains('cw-label')).to.equal(true);
        expect(february.querySelectorAll('.day-cell[tabindex="0"]')).to.have.length(0);
        await sendKeys({ press: 'Enter' });
        await sendKeys({ press: 'Escape' });
        await element.updateComplete;
        await frame();
        expect((element.shadowRoot!.activeElement as HTMLElement).dataset.date).to.equal(
            '2026-2-1',
        );
        expect(element.shadowRoot!.activeElement!.matches(':focus-visible')).to.equal(true);
        expect(events.map((event) => event.detail)).to.deep.equal([
            { date: { year: 2026, month: 2, day: 1 }, drillTarget: 'day' },
            { date: { year: 2026, month: 2, day: 1 }, drillTarget: 'week' },
        ]);
        expect(events.every((event) => event.bubbles && event.composed)).to.equal(true);
    });

    it('gives the wide Year a readable weekday key, distinct week shortcuts, and complete counts', async () => {
        const element = await overview(1408);
        element.entrySumByDay = { '2026-1-15': 1 };
        await element.updateComplete;
        const root = element.shadowRoot!;
        expect(root.querySelector('#month-1')?.textContent?.trim()).to.equal('January');
        const columns = [
            ...root.querySelectorAll('.mini-month:first-child .weekday-header > span'),
        ];
        expect(columns.map((column) => column.textContent)).to.deep.equal([
            'CW',
            'Mon',
            'Tue',
            'Wed',
            'Thu',
            'Fri',
            'Sat',
            'Sun',
        ]);
        expect(getComputedStyle(columns[0]).borderInlineEndWidth).to.equal('1px');
        expect(root.querySelector('.cw-label')?.getAttribute('aria-label')).to.equal('Show week 1');
        expect(root.querySelector('[data-date="2026-1-15"]')?.getAttribute('aria-label')).to.match(
            /, 1 event$/,
        );
        expect(root.querySelector('[data-date="2026-1-14"]')?.getAttribute('aria-label')).to.match(
            /, 0 events$/,
        );
    });

    it('retains the current roving date when the parent re-supplies the date and refreshes entries', async () => {
        const element = await overview(1408);
        const root = element.shadowRoot!;
        await element.focusDate({ year: 2026, month: 1, day: 15 });
        const focused = root.activeElement;
        expect(focused?.getAttribute('data-date')).to.equal('2026-1-15');
        element.activeDate = { ...element.activeDate };
        element.entrySumByDay = { '2026-1-15': 1 };
        await element.updateComplete;
        expect(root.activeElement).to.equal(focused);
        expect(focused?.getAttribute('tabindex')).to.equal('0');
        expect(root.querySelector('[data-date="2026-1-31"]')?.getAttribute('tabindex')).to.equal(
            '-1',
        );
        expect(root.querySelector('.day-cell.selected')?.getAttribute('data-date')).to.equal(
            '2026-1-31',
        );
    });

    for (const locale of ['bn', 'ar', 'ja', 'th', 'fa', 'en-u-nu-arab']) {
        it(`formats Year/day/week numerals and Gregorian date grammar for ${locale}`, async () => {
            const element = await overview(1408, 'count');
            element.locale = locale;
            await element.updateComplete;
            const root = element.shadowRoot!;
            const number = new Intl.NumberFormat(locale, { useGrouping: false });
            const dateLocale = new Intl.Locale(locale, { calendar: 'gregory' }).toString();
            const date = new Intl.DateTimeFormat(dateLocale, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
                calendar: 'gregory',
            }).format(new Date(Date.UTC(2026, 0, 15)));
            const button = root.querySelector('[data-date="2026-1-15"]')!;
            expect(button.querySelector('.date-number')!.textContent).to.equal(number.format(15));
            expect(root.querySelector('.year-grid')!.getAttribute('aria-label')).to.equal(
                `${getMessages(locale).year} ${new Intl.DateTimeFormat(locale, { year: 'numeric', calendar: 'gregory', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, 0, 1)))}`,
            );
            expect(root.querySelector('.cw-label')!.textContent).to.equal(number.format(1));
            const labels = getMessageFormatters(locale);
            expect(root.querySelector('.cw-label')!.getAttribute('aria-label')).to.equal(
                labels.showWeek(1),
            );
            expect(button.getAttribute('aria-label')).to.equal(`${date}, ${labels.eventCount(12)}`);
            expect(button.querySelector('.event-count')!.textContent).to.equal(
                new Intl.NumberFormat(locale).format(12),
            );
        });
    }

    it('keeps today, selection and large counts in separate homes without overlap', async () => {
        const element = await overview(1408, 'count');
        const now = new Date();
        element.activeDate = {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
        };
        const key = `${element.activeDate.year}-${element.activeDate.month}-${element.activeDate.day}`;
        element.entrySumByDay = { [key]: 123456789 };
        element.style.setProperty('--current-day-bg', 'rgb(12, 34, 56)');
        await element.updateComplete;
        await frame();
        const button = element.shadowRoot!.querySelector(`[data-date="${key}"]`)!;
        const number = button.querySelector('.date-number')!;
        const slot = button.querySelector('.activity-slot')!;
        expect(button.classList.contains('current')).to.equal(true);
        expect(button.classList.contains('selected')).to.equal(true);
        expect(button.getAttribute('aria-current')).to.equal('date');
        expect(getComputedStyle(number).backgroundColor).to.equal('rgb(12, 34, 56)');
        expect(getComputedStyle(number).borderRadius).to.equal('50%');
        expect(getComputedStyle(slot).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
        contains(number, button);
        contains(slot, button);
        expect(rect(number).right).to.be.at.most(rect(slot).left + 0.5);
        const count = slot.querySelector<HTMLElement>('.event-count')!;
        expect(count.textContent).to.equal('123,456,789');
        expect(count.scrollWidth).to.be.at.most(count.clientWidth + 1);
        usableMonths(element);
    });

    it('retains explicit legacy grid and cell tokens, with scrolling rather than clipped targets', async () => {
        const element = await overview(680);
        element.style.setProperty('--year-grid-columns', '2');
        element.style.setProperty('--year-cell-size', '4em');
        element.style.setProperty('--year-cw-width', '4em');
        await frame();
        expect(rowLengths(element)).to.deep.equal(Array(6).fill(2));
        const month = element.shadowRoot!.querySelector<HTMLElement>('.mini-month')!;
        expect(month.scrollWidth).to.be.greaterThan(month.clientWidth);
        expect(getComputedStyle(month).overflowX).to.equal('auto');
        for (const target of month.querySelectorAll('.day-cell')) {
            expect(rect(target).width).to.be.at.least(52);
            expect(rect(target).height).to.be.at.least(52);
        }
    });
});

// Run with a hasTouch browser context as well as the standard fine-pointer one.
// These are different physical layouts, not relaxed versions of the same checks.
describe('Year overview correction: coarse-pointer geometry', () => {
    beforeEach(async () => setViewport({ width: 1440, height: 720 }));
    afterEach(async () => setViewport({ width: 1024, height: 768 }));
    it('retains 44px targets and balanced columns when physically possible', async function () {
        if (!matchMedia('(pointer: coarse)').matches) this.skip();
        const element = await overview(1408);
        expect(rowLengths(element)).to.deep.equal([3, 3, 3, 3]);
        usableMonths(element, 44);
        const scroller = element.shadowRoot!.querySelector<HTMLElement>('.scroll-container')!;
        expect(scroller.scrollHeight).to.be.greaterThan(scroller.clientHeight);
        await element.focusDate({ year: 2026, month: 12, day: 31 });
        await frame();
        contains(element.shadowRoot!.activeElement!, scroller);
    });
});
