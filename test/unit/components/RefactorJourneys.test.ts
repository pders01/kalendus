import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import { DateTime } from 'luxon';

import type Entry from '../../../src/components/Entry.js';
import type Header from '../../../src/components/Header.js';
import type Menu from '../../../src/components/Menu.js';
import type Month from '../../../src/components/Month.js';
import type Week from '../../../src/components/Week.js';
import { getMessageFormatters } from '../../../src/lib/messages.js';
import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = { year: 2026, month: 11, day: 17 };
const timed = (id: string, start: number, end: number, day = 17): CalendarEntry => ({
    id,
    heading: id,
    kind: 'timed',
    date: { start: { ...date, day }, end: { ...date, day } },
    time: {
        start: { hour: Math.floor(start / 60), minute: start % 60 },
        end: { hour: Math.floor(end / 60), minute: end % 60 },
    },
});
async function settle(calendar: Calendar) {
    for (let n = 0; n < 6; n++) {
        await calendar.updateComplete;
        for (const child of calendar.shadowRoot!.querySelectorAll<
            HTMLElement & { updateComplete?: Promise<boolean> }
        >('*'))
            if (child.updateComplete) await child.updateComplete;
        await nextFrame();
    }
}
async function make(entries: CalendarEntry[], width = 358, font = 16, locale = 'en') {
    const calendar =
        await fixture<Calendar>(html`<lms-calendar .entries=${entries} .activeDate=${date} locale=${locale}
        style=${`width:${width}px;height:720px;font-size:${font}px`} view-mode="month" month-presentation="presence" month-agenda-presentation="preview"></lms-calendar>`);
    await settle(calendar);
    return calendar;
}
const rows = (calendar: Calendar) => [
    ...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('.agenda-event'),
];
const toggle = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector<HTMLButtonElement>('.agenda-toggle')!;
const month = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
const rect = (element: Element) => element.getBoundingClientRect();
const actionLabel = (button: HTMLButtonElement) =>
    [...button.children]
        .filter((label) => getComputedStyle(label).visibility !== 'hidden')
        .map((label) => label.textContent)
        .join('');
function inside(child: Element, parent: Element) {
    const a = rect(child),
        b = rect(parent);
    expect(a.left).to.be.at.least(b.left - 1);
    expect(a.right).to.be.at.most(b.right + 1);
    expect(a.top).to.be.at.least(b.top - 1);
    expect(a.bottom).to.be.at.most(b.bottom + 1);
}

describe('Integrated refactor journeys and representation limits', () => {
    for (const locale of ['en', 'ar-u-nu-arab']) {
        it(`keeps expansion in the date header, stable across opening, policy and date changes (${locale})`, async () => {
            const calendar = await make(
                Array.from({ length: 18 }, (_, n) => timed(`Event ${n}`, 540 + n, 545 + n)),
                358,
                24,
                locale,
            );
            const action = toggle(calendar);
            expect(action.closest('header')).not.to.equal(null);
            action.scrollIntoView({ block: 'center' });
            action.focus();
            await nextFrame();
            const before = rect(action);
            const beforeHeader = rect(calendar.shadowRoot!.querySelector('.date-agenda > header')!);
            expect(rows(calendar)).to.have.length(3);
            expect(action.getAttribute('aria-controls')).to.equal('agenda-events');
            expect(actionLabel(action)).to.equal(
                getMessageFormatters(locale).agendaAction(false, true),
            );
            action.focus();
            await sendKeys({ press: 'Enter' });
            await settle(calendar);
            expect(toggle(calendar)).to.equal(action);
            expect(calendar.shadowRoot!.activeElement).to.equal(action);
            expect(rows(calendar)).to.have.length(18);
            expect(action.getAttribute('aria-expanded')).to.equal('true');
            expect(actionLabel(action)).to.equal(
                getMessageFormatters(locale).agendaAction(true, true),
            );
            for (const key of ['x', 'y', 'width', 'height'] as const)
                expect(rect(action)[key], key).to.be.closeTo(before[key], 0.1);
            expect(
                rect(calendar.shadowRoot!.querySelector('.date-agenda > header')!).height,
            ).to.equal(beforeHeader.height);
            inside(action, calendar.shadowRoot!.querySelector('.date-agenda')!);
            calendar.monthAgendaPresentation = 'on-demand';
            await settle(calendar);
            expect(toggle(calendar).getAttribute('aria-expanded')).to.equal('false');
            expect(rows(calendar)).to.have.length(0);
            expect(actionLabel(toggle(calendar))).to.equal(
                getMessageFormatters(locale).agendaAction(false, false),
            );
            toggle(calendar).click();
            await settle(calendar);
            expect(rows(calendar)).to.have.length(18);
            expect(actionLabel(toggle(calendar))).to.equal(
                getMessageFormatters(locale).agendaAction(true, false),
            );
        });
    }

    it('uses date totals, including one-day events, rather than a fake aggregate lifetime', async () => {
        const spans = Array.from(
            { length: 40 },
            (_, n): CalendarEntry => ({
                id: `span-${n}`,
                heading: `Same-color span ${n}`,
                kind: 'all-day',
                color: '#1976d2',
                date: {
                    start: { ...date, day: 13 + (n % 3) },
                    end: { ...date, day: 20 + (n % 5) },
                },
            }),
        );
        const calendar = await make(
            [...spans, timed('One-day event', 600, 605)],
            358,
            24,
            'ar-u-nu-arab',
        );
        const view = month(calendar);
        const grid = view.shadowRoot!.querySelector('.month')!;
        expect(grid.getAttribute('data-span-presentation')).to.equal('counts');
        expect(view.shadowRoot!.querySelectorAll('.span-mark')).to.have.length(0);
        const control = view.shadowRoot!.querySelector('.indicator[data-date="2026-11-17"]')!;
        const count = control.querySelector('.activity[data-count-summary]')!;
        expect(count.textContent).to.equal(new Intl.NumberFormat('ar-u-nu-arab').format(41));
        inside(count, control);
        expect(control.getAttribute('aria-label')).to.include(
            getMessageFormatters('ar-u-nu-arab').eventCount(41),
        );
        toggle(calendar).click();
        await settle(calendar);
        expect(rows(calendar).map((row) => row.dataset.eventId)).to.have.members([
            ...spans.map((e) => e.id),
            'One-day event',
        ]);
        const late = view.shadowRoot!.querySelector('.indicator[data-date="2026-11-24"]')!;
        expect(late.querySelector('.activity[data-count-summary]')).not.to.equal(null);
        expect(late.querySelector('.span-mark')).to.equal(null);
    });

    it('selects an occupied date, inspects/exports its real event and returns before changing view', async () => {
        const target = timed('Found on another date', 660, 665, 19);
        const calendar = await make([timed('Starting date', 540, 545), target]);
        const initialRange = JSON.stringify(calendar.visibleRange);
        const control = month(calendar).shadowRoot!.querySelector<HTMLButtonElement>(
            '.indicator[data-date="2026-11-19"]',
        )!;
        expect(control.getAttribute('aria-label')).to.include('1 event');
        control.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(calendar.activeDate.day).to.equal(19);
        expect(JSON.stringify(calendar.visibleRange)).to.equal(initialRange);
        const row = rows(calendar)[0];
        expect(row.textContent).to.include(target.heading);
        row.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
        expect(menu.open).to.equal(true);
        expect(menu.eventDetails.entry).to.equal(target);
        let exports = 0;
        calendar.addEventListener('export-entry', (event) => {
            exports++;
            expect(event.detail.entry).to.equal(target);
            event.preventDefault();
        });
        menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        expect(exports).to.equal(1);
        await sendKeys({ press: 'Escape' });
        await settle(calendar);
        expect(calendar.shadowRoot!.activeElement).to.equal(row);
        const header = calendar.shadowRoot!.querySelector<Header>('lms-calendar-header')!;
        const dayButton = [
            ...header.shadowRoot!.querySelectorAll<HTMLButtonElement>('button'),
        ].find((button) => button.textContent?.trim() === 'Day')!;
        dayButton.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(calendar.viewMode).to.equal('day');
        expect(calendar.activeDate.day).to.equal(19);
        expect(header.shadowRoot!.activeElement).to.equal(dayButton);
        expect(
            calendar.shadowRoot!.querySelector<Entry>('lms-calendar-entry[slot="timed"]')!
                .canonicalEntry,
        ).to.equal(target);
    });

    it('preserves date and viewed time through adaptive Week resize and Year/Month return', async () => {
        const calendar = await make([timed('Morning event', 540, 570)]);
        calendar.viewMode = 'day';
        await settle(calendar);
        const position = () => {
            const child = calendar.shadowRoot!.querySelector<HTMLElement>(
                'lms-calendar-day,lms-calendar-week',
            )!;
            const scroll = child.shadowRoot!.querySelector<HTMLElement>('.main,.week-scroll')!;
            const scale = parseFloat(getComputedStyle(child).getPropertyValue('--minute-height'));
            return { scroll, scale, inset: parseFloat(getComputedStyle(scroll).paddingTop) };
        };
        const day = position();
        day.scroll.scrollTop = day.inset + 540 * day.scale;
        await nextFrame();
        calendar.viewMode = 'week';
        await settle(calendar);
        const week = calendar.shadowRoot!.querySelector<Week>('lms-calendar-week')!;
        const before = week.visibleDates.length;
        expect(before).to.be.lessThan(7);
        expect(week.shadowRoot!.querySelector('.window-context')).not.to.equal(null);
        const check = () => {
            expect(calendar.activeDate).to.deep.equal(date);
            expect(week.visibleDates.some((value) => value.day === date.day)).to.equal(true);
            expect(calendar.visibleRange).to.deep.equal({
                start: DateTime.fromObject(week.visibleDates[0], { zone: 'UTC' }).toISODate(),
                end: DateTime.fromObject(week.visibleDates.at(-1)!, { zone: 'UTC' })
                    .plus({ days: 1 })
                    .toISODate(),
            });
            const current = position();
            expect((current.scroll.scrollTop - current.inset) / current.scale).to.be.closeTo(
                540,
                2,
            );
        };
        check();
        calendar.style.width = '1000px';
        await settle(calendar);
        expect(week.visibleDates.length).to.be.greaterThan(before);
        check();
        calendar.style.display = 'none';
        await settle(calendar);
        calendar.style.display = '';
        await settle(calendar);
        check();
        calendar.viewMode = 'year';
        await settle(calendar);
        expect(calendar.activeDate).to.deep.equal(date);
        calendar.viewMode = 'month';
        await settle(calendar);
        expect(calendar.activeDate).to.deep.equal(date);
        expect(calendar.shadowRoot!.querySelector('.date-agenda')).not.to.equal(null);
        calendar.viewMode = 'day';
        await settle(calendar);
        const restored = position();
        expect((restored.scroll.scrollTop - restored.inset) / restored.scale).to.be.closeTo(540, 2);
    });

    for (const view of ['day', 'week'] as const) {
        for (const width of [358, 1000]) {
            it(`reaches complete late-night cards without shifting minute geometry (${view}, ${width}px)`, async () => {
                const supplied = [
                    timed('Near midnight', 1435, 1440),
                    timed('Late point', 1439, 1439),
                ];
                const calendar = await make(supplied, width);
                calendar.style.setProperty('--week-day-count', '1');
                calendar.style.setProperty('--week-mobile-day-count', '1');
                calendar.style.setProperty('--week-min-day-width', '0');
                calendar.viewMode = view;
                await settle(calendar);
                const child = calendar.shadowRoot!.querySelector<HTMLElement>(
                    `lms-calendar-${view}`,
                )!;
                const scroll = child.shadowRoot!.querySelector<HTMLElement>('.main,.week-scroll')!;
                const column = child.shadowRoot!.querySelector('.timed-content,.day-column')!;
                const scale = parseFloat(
                    getComputedStyle(child).getPropertyValue('--minute-height'),
                );
                expect(rect(column).height).to.be.closeTo(1440 * scale, 0.1);
                const entries = [
                    ...calendar.shadowRoot!.querySelectorAll<Entry>(
                        'lms-calendar-entry[slot^="timed"]',
                    ),
                ];
                expect(entries).to.have.length(2);
                scroll.scrollTop = scroll.scrollHeight;
                await settle(calendar);
                for (const entry of entries) {
                    const start = entry.time!.start.hour * 60 + entry.time!.start.minute;
                    expect(rect(entry).top - rect(column).top).to.be.closeTo(start * scale, 0.5);
                    inside(entry, scroll);
                    inside(entry.shadowRoot!.querySelector('.title')!, entry);
                    inside(entry.shadowRoot!.querySelector('.time')!, entry);
                    expect(entry.canonicalEntry).to.equal(
                        supplied.find((source) => source.id === entry.eventId),
                    );
                }
                expect(getComputedStyle(scroll).scrollSnapType).to.equal('none');
            });
        }
    }

    for (const width of [358, 1000]) {
        it(`puts a short title and close on one row while long content scrolls independently (${width}px)`, async () => {
            const calendar = await make([timed('Five-minute briefing', 540, 545)], width);
            rows(calendar)[0].focus();
            rows(calendar)[0].click();
            await settle(calendar);
            const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
            const root = menu.shadowRoot!;
            const card = root.querySelector('.card')!;
            const close = root.querySelector<HTMLElement>('.close-btn')!;
            const title = root.querySelector<HTMLElement>('.title')!;
            expect(rect(title).top).to.be.lessThan(rect(close).bottom);
            expect(rect(title).bottom).to.be.greaterThan(rect(close).top);
            expect(rect(card).height).to.be.lessThan(250);
            menu.eventDetails = {
                ...menu.eventDetails,
                heading: 'Long heading '.repeat(200),
                content: 'Long notes. '.repeat(2000),
            };
            await settle(calendar);
            const body = root.querySelector<HTMLElement>('.body')!;
            const exportButton = root.querySelector<HTMLElement>('.export-btn')!;
            expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
            const closeBefore = rect(close),
                exportBefore = rect(exportButton);
            body.scrollTop = body.scrollHeight;
            await nextFrame();
            inside(close, card);
            inside(exportButton, card);
            expect(rect(close).y).to.equal(closeBefore.y);
            expect(rect(exportButton).y).to.equal(exportBefore.y);
        });
    }
});
