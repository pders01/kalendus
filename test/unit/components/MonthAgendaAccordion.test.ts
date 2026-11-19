import { expect, fixture, html } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import type { CalendarEntryRequest, CalendarState } from '../../../src/contracts.ts';
import type Calendar from '../../../src/lms-calendar.ts';
import type { CalendarEntry } from '../../../src/lms-calendar.ts';
import '../../../src/lms-calendar.ts';

const date = (day: number) => ({ year: 2026, month: 11, day });
const exhibition: CalendarEntry = {
    kind: 'all-day',
    id: 'exhibition',
    heading: 'Exhibition',
    date: { start: date(16), end: date(19) },
};
const workshop: CalendarEntry = {
    kind: 'timed',
    id: 'workshop',
    heading: 'Long workshop',
    date: { start: date(17), end: date(17) },
    time: { start: { hour: 9, minute: 0 }, end: { hour: 11, minute: 45 } },
    content: 'First paragraph.\n\nTwo <literal> lines.\n\nLast paragraph.',
};
const entries: CalendarEntry[] = [
    exhibition,
    workshop,
    ...Array.from(
        { length: 41 },
        (_, i): CalendarEntry => ({
            ...exhibition,
            id: `all-day-${i}`,
            heading: `All-day event ${i + 1}`,
            date: { start: date(17), end: date(17) },
        }),
    ),
    ...Array.from(
        { length: 15 },
        (_, i): CalendarEntry => ({
            ...workshop,
            id: `timed-${i}`,
            heading: `Timed event ${i + 1}`,
            content: ' ',
            time: { start: { hour: 13, minute: i }, end: { hour: 13, minute: i + 1 } },
        }),
    ),
];

async function make(locale = 'en', width = 288) {
    const calendar =
        await fixture<Calendar>(html`<lms-calendar .locale=${locale} .entries=${entries}
        .activeDate=${date(17)} month-presentation="presence" month-agenda-presentation="accordion"
        style="width:${width}px;font-size:24px"></lms-calendar>`);
    await calendar.localeReady;
    return calendar;
}

const month = (calendar: Calendar) => calendar.shadowRoot!.querySelector('lms-calendar-month')!;
const toolbar = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector('lms-calendar-header')!.shadowRoot!;
const button = (root: ShadowRoot | Element, selector: string) =>
    root.querySelector<HTMLButtonElement>(selector)!;
const row = (calendar: Calendar, title: string) =>
    [...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('.agenda-event')].find(
        (element) => element.querySelector('.agenda-title')?.textContent === title,
    )!;

async function select(calendar: Calendar) {
    button(month(calendar).shadowRoot!, '.indicator[data-date="2026-11-17"]').click();
    await calendar.updateComplete;
}

function recordRequest(calendar: Calendar, type: string, block = true) {
    const list: CalendarEntryRequest[] = [];
    calendar.addEventListener(type, (e) => {
        expect(e.cancelable).to.equal(true);
        list.push((e as CustomEvent<CalendarEntryRequest>).detail);
        if (block) e.preventDefault();
    });
    return list;
}

describe('Library Month Agenda accordion', () => {
    it('keeps the same event metadata across plain and accordion rows', async () => {
        const calendar = await make();
        calendar.entries = [exhibition, workshop];
        calendar.monthAgendaPresentation = 'full';
        await calendar.updateComplete;
        const metadata = (selector: string) =>
            calendar.shadowRoot!.querySelector(selector)?.textContent;
        const plain = row(calendar, 'Long workshop');
        const time = metadata('.agenda-time');
        const span = metadata('.agenda-span-range');
        const color = plain.style.getPropertyValue('--list-event-color');
        expect(time).to.include('9:00');
        expect(span).not.to.be.empty;
        expect(plain.firstElementChild?.className).to.equal('agenda-time');
        expect(plain.getAttribute('aria-label')).to.include('Long workshop');

        calendar.monthAgendaPresentation = 'accordion';
        await calendar.updateComplete;
        await select(calendar);
        const disclosure = row(calendar, 'Long workshop');
        expect(disclosure.firstElementChild?.className).to.equal('agenda-title');
        expect(disclosure.hasAttribute('aria-label')).to.equal(false);
        expect(metadata('.agenda-time')).to.equal(time);
        expect(metadata('.agenda-span-range')).to.equal(span);
        expect(disclosure.style.getPropertyValue('--list-event-color')).to.equal(color);
        disclosure.click();
        await calendar.updateComplete;
        expect(disclosure.getAttribute('aria-expanded')).to.equal('true');
        expect(metadata('.agenda-details p')).to.equal(workshop.content);
    });

    it('uses one selected date, complete sections, and the real Week/Month switcher', async () => {
        const calendar = await make();
        const root = calendar.shadowRoot!;
        const head = toolbar(calendar);
        const sharedHeader = root.querySelector('lms-calendar-header')!;
        expect(getComputedStyle(head.querySelector('.controls')!).borderBlockEndWidth).to.equal(
            '1px',
        );
        expect(
            getComputedStyle(month(calendar).shadowRoot!.querySelector('.month')!)
                .borderBlockStartWidth,
        ).to.equal('0px');
        expect(month(calendar).getBoundingClientRect().top).to.be.closeTo(
            sharedHeader.getBoundingClientRect().bottom,
            1,
        );
        expect(root.querySelector('.agenda-back')).to.equal(null);
        const states: CalendarState[] = [];
        calendar.addEventListener('calendar-state-change', (event) => states.push(event.detail));
        await select(calendar);
        expect(calendar.viewMode).to.equal('month');
        expect(month(calendar)).to.equal(null);
        const agenda = root.querySelector('.date-agenda')!;
        expect(getComputedStyle(agenda).borderBlockStartWidth).to.equal('0px');
        expect(agenda.getBoundingClientRect().top).to.be.closeTo(
            sharedHeader.getBoundingClientRect().bottom,
            1,
        );
        expect(root.querySelectorAll('.all-day .agenda-event')).to.have.length(42);
        expect(root.querySelectorAll('.agenda-events:not(.all-day) .agenda-event')).to.have.length(
            16,
        );
        expect(root.querySelector('.agenda-more, .agenda-toggle, .agenda-details')).to.equal(null);
        expect(states).to.have.length(1);
        expect(states[0].range).to.deep.equal({ start: '2026-11-17', end: '2026-11-18' });
        expect(root.activeElement?.id).to.equal('agenda-date');
        expect(root.querySelector('.date-agenda > header > .agenda-back')?.textContent).to.include(
            'Month',
        );
        const [toTimed, toAllDay] = root.querySelectorAll<HTMLButtonElement>(
            '.agenda-section-heading button',
        );
        toTimed.click();
        expect(root.activeElement?.id).to.equal('agenda-timed');
        toAllDay.click();
        expect(root.activeElement?.id).to.equal('agenda-all-day');
        row(calendar, 'Long workshop').click();
        await calendar.updateComplete;
        const week = button(head, '[data-context="week"]');
        week.focus();
        week.click();
        await calendar.updateComplete;
        expect(calendar.activeDate).to.deep.equal(date(17));
        expect(root.querySelector('lms-calendar-week')).to.exist;
        expect(root.querySelector('.date-agenda')).to.equal(null);
        expect(head.activeElement).to.equal(week);
        const back = button(head, '[data-context="month"]');
        back.focus();
        back.click();
        await calendar.updateComplete;
        expect(row(calendar, 'Long workshop').getAttribute('aria-expanded')).to.equal('true');
        expect(head.activeElement).to.equal(back);
        button(head, '[name="next"]').click();
        await calendar.updateComplete;
        expect(calendar.activeDate).to.deep.equal(date(18));
        expect(root.querySelectorAll('.agenda-section-heading button')).to.have.length(0);
        button(head, '[name="previous"]').click();
        await calendar.updateComplete;
        expect(row(calendar, 'Long workshop').getAttribute('aria-expanded')).to.equal('true');
    });

    it('focuses the date without stretching the heading across a wide Agenda', async () => {
        const calendar = await make('en', 900);
        await select(calendar);
        const heading = calendar.shadowRoot!.querySelector('#agenda-date')!;
        expect(calendar.shadowRoot!.activeElement).to.equal(heading);
        expect(heading.getBoundingClientRect().width).to.be.lessThan(
            heading.parentElement!.getBoundingClientRect().width / 2,
        );
    });

    it('keeps a divider before the contextual list under a borderless Month grid', async () => {
        const calendar = await make();
        calendar.monthAgendaPresentation = 'full';
        await calendar.updateComplete;
        const list = calendar.shadowRoot!.querySelector(
            'lms-calendar-month[compact] + .date-agenda',
        )!;
        expect(getComputedStyle(list).borderBlockStartWidth).to.equal('1px');
    });

    it('keeps Timed reachable on dates that need a continuation, and shows empty dates without shortcuts', async () => {
        const calendar = await make();
        const root = calendar.shadowRoot!;
        calendar.entries = [
            ...entries,
            ...Array.from({ length: 12 }, (_, i) => ({
                ...exhibition,
                id: `extra-${i}`,
                date: { start: date(17), end: date(17) },
            })),
        ];
        await calendar.updateComplete;
        await select(calendar);
        expect(root.querySelectorAll('.all-day .agenda-event')).to.have.length(50);
        expect(row(calendar, 'Long workshop')).to.exist;
        button(root, '.agenda-more').click();
        await calendar.updateComplete;
        expect(root.querySelectorAll('.all-day .agenda-event')).to.have.length(54);
        calendar.activeDate = date(20);
        await calendar.updateComplete;
        expect(root.querySelector('.agenda-count')?.textContent).to.equal('0 events');
        expect(root.querySelector('.agenda-event, .agenda-section-heading button')).to.equal(null);
    });

    it('preserves caller cancellation, text, endpoints, and keyboard return without a popup', async () => {
        const calendar = await make();
        const root = calendar.shadowRoot!;
        await select(calendar);
        const requests = recordRequest(calendar, 'entry-activate', false);
        calendar.addEventListener('entry-activate', (event) => event.preventDefault(), {
            once: true,
        });
        const trigger = row(calendar, 'Long workshop');
        trigger.focus();
        await sendKeys({ press: 'Enter' });
        await calendar.updateComplete;
        expect(trigger.getAttribute('aria-expanded')).to.equal('false');
        expect(requests[0].entry).to.equal(workshop);
        expect(requests[0].eventId).to.equal('workshop');
        await sendKeys({ press: 'Enter' });
        await calendar.updateComplete;
        expect(trigger.getAttribute('aria-expanded')).to.equal('true');
        expect(trigger.textContent).to.include('Description');
        expect(row(calendar, 'Timed event 1').textContent).not.to.include('Description');
        expect(root.querySelector('.agenda-details p')?.textContent).to.equal(workshop.content);
        expect(root.querySelector('.agenda-details literal, lms-menu[open]')).to.equal(null);
        const exports = recordRequest(calendar, 'export-entry');
        const download = button(root, '.agenda-details button');
        download.focus();
        await sendKeys({ press: 'Enter' });
        expect(exports).to.have.length(1);
        expect(exports[0].entry).to.equal(workshop);
        expect(exports[0].eventId).to.equal('workshop');
        expect(download.getBoundingClientRect().height).to.be.at.least(44);
        download.focus();
        await sendKeys({ press: 'Escape' });
        await calendar.updateComplete;
        expect(root.activeElement).to.equal(trigger);
        expect(trigger.getAttribute('aria-expanded')).to.equal('false');
    });

    it('underlines the canonical multi-day dates without changing selection or totals (RTL)', async () => {
        const calendar = await make('ar');
        const root = calendar.shadowRoot!;
        const initialGrid = month(calendar).shadowRoot!;
        const total = initialGrid.querySelector(
            'button[data-date="2026-11-17"] .activity',
        )?.textContent;
        await select(calendar);
        row(calendar, 'Exhibition').click();
        await calendar.updateComplete;
        expect(root.querySelector('.agenda-details button')?.textContent).to.include('تنزيل');
        const exports = recordRequest(calendar, 'export-entry');
        button(root, '.agenda-details button').click();
        expect(exports[0].entry).to.equal(exhibition);
        const back = button(root, '.agenda-back');
        expect(back.textContent).to.include('شهر');
        expect(back.getBoundingClientRect().height).to.be.at.least(44);
        back.focus();
        await sendKeys({ press: 'Enter' });
        await calendar.updateComplete;
        const grid = month(calendar).shadowRoot!;
        await month(calendar).updateComplete;
        await new Promise(requestAnimationFrame);
        expect(grid.activeElement?.getAttribute('data-date')).to.equal('2026-11-17');
        expect(calendar.getAttribute('dir')).to.equal('rtl');
        expect(
            [...grid.querySelectorAll<HTMLButtonElement>('[data-traced-date]')].map(
                (cell) => cell.dataset.date,
            ),
        ).to.deep.equal(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19']);
        expect(grid.querySelector('[aria-selected="true"]')?.getAttribute('data-date')).to.equal(
            '2026-11-17',
        );
        expect(
            grid.querySelector('button[data-date="2026-11-17"] .activity')?.textContent,
        ).to.equal(total);
        await select(calendar);
        row(calendar, 'Long workshop').click();
        await calendar.updateComplete;
        button(root, '.agenda-back').click();
        await calendar.updateComplete;
        await month(calendar).updateComplete;
        expect(month(calendar).shadowRoot!.querySelector('[data-traced-date]')).to.equal(null);
    });
});
