import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';

import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';
import brutalist from '../../../src/themes/brutalist.css?raw';
import defaultTheme from '../../../src/themes/default.css?raw';
import ink from '../../../src/themes/ink.css?raw';

const date = { year: 2026, month: 11, day: 17 };
const timed: CalendarEntry = {
    id: 'workshop',
    kind: 'timed',
    heading: 'Workshop',
    date: { start: date, end: date },
    time: { start: { hour: 9, minute: 5 }, end: { hour: 11, minute: 35 } },
};

async function mount(source = '', width = 1100) {
    const wrapper = await fixture<HTMLDivElement>(html`
        <div style="font-family: Georgia, serif">
            <lms-calendar .activeDate=${date} .entries=${[timed]}
                style=${`width:${width}px;height:780px`}></lms-calendar>
        </div>
    `);
    if (source) {
        const sheet = document.createElement('style');
        sheet.textContent = source;
        wrapper.prepend(sheet);
    }
    return wrapper.querySelector('lms-calendar')!;
}

const family = (calendar: Calendar) =>
    getComputedStyle(calendar.shadowRoot!.querySelector('.calendar-container')!).fontFamily;

async function readCard(calendar: Calendar) {
    const view = calendar.viewMode;
    const root = calendar.shadowRoot!;
    const slot = view === 'month' ? '2026-11-17' : view === 'week' ? 'timed-2026-11-17' : 'timed';
    const selector = `lms-calendar-entry[slot="${slot}"]`;
    await waitUntil(() => !!root.querySelector(selector)?.shadowRoot?.querySelector('.time'));
    return root.querySelector<HTMLElement>(selector)!;
}

function check(element: Element, font: string, numeric = false) {
    const style = getComputedStyle(element);
    expect(style.fontFamily).to.equal(font);
    if (numeric) expect(style.fontVariantNumeric).to.equal('tabular-nums');
}

for (const [name, source] of Object.entries({ neutral: '', default: defaultTheme, ink })) {
    it(`uses the ${name} calendar family for titles, time labels and inspector controls`, async () => {
        const calendar = await mount(source);
        const root = calendar.shadowRoot!;
        await readCard(calendar);
        const font = family(calendar);
        if (name === 'neutral')
            expect(font).to.equal(getComputedStyle(calendar.parentElement!).fontFamily);
        else expect(font).to.include(name === 'ink' ? 'Georgia' : 'system-ui');
        for (const mode of ['month', 'day', 'week'] as const) {
            calendar.viewMode = mode;
            const card = await readCard(calendar);
            check(card.shadowRoot!.querySelector('.title')!, font);
            check(card.shadowRoot!.querySelector('.time')!, font, true);
            const grid = root.querySelector(`lms-calendar-${mode}`)!;
            if (mode !== 'month') check(grid.shadowRoot!.querySelector('.hour-label')!, font, true);
        }
        const header = root.querySelector('lms-calendar-header')!.shadowRoot!;
        check(header.querySelector('button')!, font);
        const card = await readCard(calendar);
        card.focus();
        card.click();
        const menu = root.querySelector('lms-menu')!;
        await waitUntil(() => menu.open && !!menu.shadowRoot!.querySelector('.card:popover-open'));
        check(menu.shadowRoot!.querySelector('.meta')!, font, true);
        check(menu.shadowRoot!.querySelector('.title')!, font);
        check(menu.shadowRoot!.querySelector('.export-btn')!, font);
    });
}

function firstBaseline(element: Element) {
    const marker = document.createElement('span');
    marker.style.cssText = 'display:inline-block;width:0;height:0';
    const text = [...element.childNodes].find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    )!;
    text.before(marker);
    const baseline = marker.getBoundingClientRect().bottom;
    marker.remove();
    return baseline;
}

function textBounds(element: Element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
}

for (const locale of ['en', 'ar']) {
    it(`centers the date number inside the Day today badge (${locale})`, async () => {
        const calendar = await mount();
        const now = new Date();
        calendar.activeDate = {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
        };
        calendar.viewMode = 'day';
        calendar.locale = locale;
        calendar.style.fontSize = '24px';
        await calendar.updateComplete;
        await calendar.localeReady;
        const day = calendar.shadowRoot!.querySelector('lms-calendar-day')!;
        await day.updateComplete;
        const badge = day.shadowRoot!.querySelector('[aria-current="date"] .day-number')!;
        expect(badge.textContent).to.equal(new Intl.NumberFormat(locale).format(now.getDate()));
        const center = ({ left, right }: DOMRect) => (left + right) / 2;
        expect(center(textBounds(badge))).to.be.closeTo(center(badge.getBoundingClientRect()), 0.5);
    });

    it(`aligns the toolbar period and subtitle on one inline start edge (${locale})`, async () => {
        const calendar = await mount(brutalist);
        calendar.locale = locale;
        calendar.heading = locale === 'ar' ? 'تقويمي' : 'My Calendar';
        await calendar.updateComplete;
        await calendar.localeReady;
        const header = calendar.shadowRoot!.querySelector('lms-calendar-header')!;
        await header.updateComplete;
        const period = header.shadowRoot!.querySelector('.view-detail.active')!;
        const subtitle = header.shadowRoot!.querySelector('.calendar-title')!;
        const edge = locale === 'ar' ? 'right' : 'left';
        for (const [width, font, padding] of [
            [1100, 16, 16],
            [360, 24, 36],
        ]) {
            calendar.style.width = `${width}px`;
            calendar.style.fontSize = `${font}px`;
            if (width === 360) calendar.style.setProperty('--header-info-padding-left', '1.5em');
            await nextFrame();
            expect(textBounds(period)[edge]).to.be.closeTo(textBounds(subtitle)[edge], 0.5);
            expect(getComputedStyle(subtitle).paddingInlineStart).to.equal(`${padding}px`);
            expect(getComputedStyle(subtitle.firstElementChild!).fontSize).to.equal(
                `${font * 0.875}px`,
            );
        }
    });

    it(`aligns Day and Week weekday and date labels on one baseline (${locale})`, async () => {
        const calendar = await mount();
        calendar.locale = locale;
        calendar.style.fontSize = '24px';
        await calendar.updateComplete;
        await calendar.localeReady;
        for (const view of ['day', 'week'] as const) {
            calendar.viewMode = view;
            await calendar.updateComplete;
            await nextFrame();
            const label = calendar
                .shadowRoot!.querySelector(`lms-calendar-${view}`)!
                .shadowRoot!.querySelector('.day-label')!;
            const weekday = label.querySelector('.day-name')!;
            const number = label.querySelector('.day-number')!;
            expect(firstBaseline(weekday)).to.be.closeTo(firstBaseline(number), 0.125);
            expect(number.getBoundingClientRect().height).to.be.at.least(36);
        }
    });

    it(`aligns Full Agenda times with the first line of a wrapping title (${locale})`, async () => {
        const calendar = await mount('', 550);
        const root = calendar.shadowRoot!;
        calendar.locale = locale;
        calendar.monthPresentation = 'presence';
        calendar.style.fontSize = '24px';
        calendar.entries = [
            { ...timed, heading: 'Long workshop with everyone in the local community studio' },
        ];
        await calendar.updateComplete;
        await calendar.localeReady;
        await waitUntil(() => !!root.querySelector('.date-agenda .agenda-event'));
        const title = root.querySelector<HTMLElement>('.agenda-title')!;
        const time = root.querySelector('.agenda-time')!;
        expect(title.clientHeight).to.be.greaterThan(30);
        expect(firstBaseline(time)).to.be.closeTo(firstBaseline(title), 0.125);
        calendar.style.width = '370px';
        await nextFrame();
        expect(title.getBoundingClientRect().top).to.be.at.least(
            time.getBoundingClientRect().bottom,
        );
    });
}

it('honors explicit Day/Week and Month time faces without changing event titles', async () => {
    const calendar = await mount();
    const font = family(calendar);
    calendar.parentElement!.style.setProperty('--entry-font-family', 'monospace');
    calendar.parentElement!.style.setProperty('--monospace-ui', 'sans-serif');
    calendar.style.setProperty('--entry-time-font', 'serif');
    const preview = await readCard(calendar);
    check(preview.shadowRoot!.querySelector('.time')!, 'serif');
    calendar.style.removeProperty('--entry-time-font');
    check(preview.shadowRoot!.querySelector('.time')!, 'sans-serif');
    calendar.viewMode = 'week';
    const card = await readCard(calendar);
    check(card.shadowRoot!.querySelector('.time')!, 'monospace');
    check(card.shadowRoot!.querySelector('.title')!, font);
});

it('scales the minimum time-label size with the document font size', async () => {
    const calendar = await mount();
    calendar.viewMode = 'day';
    const card = await readCard(calendar);
    const label = card.shadowRoot!.querySelector('.time')!;
    const root = document.documentElement;
    const previous = root.style.fontSize;
    try {
        root.style.fontSize = '24px';
        expect(getComputedStyle(label).fontSize).to.equal('18px');
    } finally {
        root.style.fontSize = previous;
    }
});

it('keeps enlarged RTL Agenda times and dense Week ranges in the selected family', async () => {
    const calendar = await mount('', 390);
    const root = calendar.shadowRoot!;
    calendar.locale = 'ar';
    calendar.monthAgendaPresentation = 'accordion';
    calendar.style.fontSize = '24px';
    calendar.style.setProperty('--system-ui', 'Arial, sans-serif');
    calendar.entries = Array.from({ length: 6 }, (_, index) => ({ ...timed, id: `${index}` }));
    await calendar.updateComplete;
    await calendar.localeReady;
    const month = root.querySelector('lms-calendar-month')!;
    await waitUntil(() => month.compact);
    month
        .shadowRoot!.querySelector<HTMLButtonElement>('.indicator[data-date="2026-11-17"]')!
        .click();
    await waitUntil(() => !!root.querySelector('.accordion-agenda .agenda-time'));
    const font = family(calendar);
    expect(calendar.dir).to.equal('auto');
    expect(calendar.getAttribute('dir')).to.equal('rtl');
    check(root.querySelector('.agenda-time')!, font, true);
    const week = root.querySelector('lms-calendar-header')!.shadowRoot!;
    week.querySelector<HTMLButtonElement>('button[data-context="week"]')!.click();
    await waitUntil(() => !!root.querySelector('.group-meta'));
    await nextFrame();
    check(root.querySelector('.group-meta')!, font, true);
});
