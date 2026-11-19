import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';

import type Entry from '../../../src/components/Entry.js';
import type Menu from '../../../src/components/Menu.js';
import type Month from '../../../src/components/Month.js';
import { formatLocalizedTimeRange } from '../../../src/lib/localization.js';
import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';
import type { MonthPresentation, TimedEntryPresentation } from '../../../src/lms-calendar.js';

const date = { year: 2026, month: 11, day: 17 };
const timed = (id: string, start = 540, end = 545): CalendarEntry => ({
    id,
    heading: id,
    kind: 'timed',
    date: { start: date, end: date },
    time: {
        start: { hour: Math.floor(start / 60), minute: start % 60 },
        end: { hour: Math.floor(end / 60), minute: end % 60 },
    },
});
async function settle(calendar: Calendar) {
    for (let i = 0; i < 6; i++) {
        await calendar.updateComplete;
        for (const element of calendar.shadowRoot!.querySelectorAll<
            HTMLElement & { updateComplete?: Promise<boolean> }
        >('*')) {
            if (element.updateComplete) await element.updateComplete;
        }
        await nextFrame();
    }
}
async function make(entries: CalendarEntry[], view: 'month' | 'day' | 'week', width = 1000) {
    const calendar =
        await fixture<Calendar>(html`<lms-calendar locale="en" style=${`width:${width}px;height:720px;--week-day-count:2;--week-min-day-width:0`}
        .activeDate=${date} .entries=${entries} .viewMode=${view}></lms-calendar>`);
    await settle(calendar);
    return calendar;
}
const entries = (calendar: Calendar) => [
    ...calendar.shadowRoot!.querySelectorAll<Entry>('lms-calendar-entry[slot^="timed"]'),
];
const view = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector<HTMLElement>('lms-calendar-day, lms-calendar-week')!;
const scale = (calendar: Calendar) =>
    parseFloat(getComputedStyle(view(calendar)).getPropertyValue('--minute-height'));

function separated(a: Element, b: Element) {
    const first = a.getBoundingClientRect(),
        second = b.getBoundingClientRect();
    return (
        first.right <= second.left + 0.5 ||
        second.right <= first.left + 0.5 ||
        first.bottom <= second.top + 0.5 ||
        second.bottom <= first.top + 0.5
    );
}

describe('Experimental presentation variants', () => {
    for (const width of [358, 1000]) {
        for (const mode of ['presence', 'previews'] as MonthPresentation[]) {
            it(`keeps ${mode} Month inline and complete at ${width}px`, async () => {
                const supplied = Array.from({ length: 10 }, (_, i) =>
                    timed(`event-${i}`, 540 + i * 30, 545 + i * 30),
                );
                const calendar = await make(supplied, 'month', width);
                calendar.style.removeProperty('height');
                calendar.monthPresentation = mode;
                // Explicit comparison modes override legacy drill-down; auto does not.
                calendar.monthDayBehavior = 'day';
                await settle(calendar);
                const range = JSON.stringify(calendar.visibleRange);
                const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
                expect(month.compact).to.equal(mode === 'presence');
                expect(month.selectedDate).to.deep.equal(date);
                expect(calendar.shadowRoot!.querySelectorAll('.agenda-event')).to.have.length(10);
                expect(
                    getComputedStyle(month.shadowRoot!.querySelector('.month')!).overflowY,
                ).to.equal('visible');
                const frame =
                    calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-container')!;
                expect(frame.scrollHeight).to.be.at.most(frame.clientHeight + 1);
                if (mode === 'previews') {
                    const visible = [...month.querySelectorAll<HTMLElement>('[slot="2026-11-17"]')];
                    const hidden = supplied.length - visible.length;
                    expect(
                        visible.every((entry) => !entry.hasAttribute('data-month-overflow')),
                    ).to.equal(true);
                    expect(visible.length).to.be.greaterThan(0);
                    expect(hidden).to.be.greaterThan(0);
                    expect(
                        month.shadowRoot!.querySelector('.summary[data-date="2026-11-17"]')!
                            .textContent,
                    ).to.include(`+${hidden}`);
                    const control = month.shadowRoot!.querySelector(
                        '.indicator[data-date="2026-11-17"]',
                    )!;
                    expect(control.getAttribute('aria-label')).to.include('10');
                    expect(getComputedStyle(control).boxShadow).not.to.equal('none');
                } else expect(month.querySelectorAll('lms-calendar-entry')).to.have.length(0);
                month
                    .shadowRoot!.querySelector<HTMLButtonElement>(
                        '.indicator[data-date="2026-11-20"]',
                    )!
                    .click();
                await settle(calendar);
                expect(calendar.viewMode).to.equal('month');
                expect(calendar.activeDate.day).to.equal(20);
                expect(JSON.stringify(calendar.visibleRange)).to.equal(range);
                expect(calendar.shadowRoot!.querySelectorAll('.agenda-event')).to.have.length(0);
                expect(calendar.shadowRoot!.querySelector('.date-agenda')!.textContent).to.include(
                    '0 events',
                );
            });
        }
    }

    it('preserves existing defaults and normalizes invalid comparison attributes', async () => {
        const calendar = await make([timed('briefing')], 'day');
        expect(calendar.monthPresentation).to.equal('auto');
        expect(calendar.timedEntryPresentation).to.equal('card');
        expect(entries(calendar)[0].displayMode).to.equal('default');
        calendar.setAttribute('month-presentation', 'unknown');
        calendar.setAttribute('timed-entry-presentation', 'unknown');
        await settle(calendar);
        expect(calendar.monthPresentation).to.equal('auto');
        expect(calendar.timedEntryPresentation).to.equal('card');
    });

    for (const mode of ['day', 'week'] as const) {
        it(`separates true duration from label size, preserving ${mode} identity, endpoints and scroll`, async () => {
            const supplied = timed('briefing');
            const before = JSON.stringify(supplied);
            const calendar = await make([supplied], mode);
            const original = entries(calendar)[0];
            const scroll =
                view(calendar).shadowRoot!.querySelector<HTMLElement>('.main, .week-scroll')!;
            scroll.scrollTop = 500 * scale(calendar);
            const minute = scroll.scrollTop / scale(calendar);
            const range = JSON.stringify(calendar.visibleRange);
            for (const presentation of ['marker', 'card', 'marker'] as TimedEntryPresentation[]) {
                calendar.timedEntryPresentation = presentation;
                await settle(calendar);
                const entry = entries(calendar)[0];
                expect(entry).to.equal(original);
                expect(entry.canonicalEntry).to.equal(supplied);
                expect(entry.time).to.deep.equal(supplied.time);
                const label = entry.shadowRoot!.querySelector('.time')!.textContent;
                expect(label?.replace(/[\u2066\u2069]/g, '')).to.equal(
                    formatLocalizedTimeRange(9, 0, 9, 5, 'en').slice(1, -1),
                );
                expect(entry.getBoundingClientRect().height).to.be.at.least(24);
                if (presentation === 'marker') {
                    const mark = entry.shadowRoot!.querySelector<HTMLElement>('.duration-mark')!;
                    expect(mark.getBoundingClientRect().height).to.be.closeTo(
                        5 * scale(calendar),
                        0.1,
                    );
                    expect(
                        entry.shadowRoot!.querySelector('.main')!.getBoundingClientRect().height,
                    ).to.be.greaterThan(mark.getBoundingClientRect().height);
                    expect(getComputedStyle(entry).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
                } else expect(entry.shadowRoot!.querySelector('.duration-mark')).to.equal(null);
                expect(scroll.scrollTop / scale(calendar)).to.be.closeTo(minute, 2);
                expect(getComputedStyle(scroll).scrollSnapType).to.equal('none');
                expect(JSON.stringify(calendar.visibleRange)).to.equal(range);
            }
            expect(JSON.stringify(supplied)).to.equal(before);
        });
    }

    for (const font of [16, 24]) {
        for (const direction of ['ltr', 'rtl'] as const) {
            it(`fits late-night marker labels without moving endpoints (${font}px ${direction})`, async () => {
                const calendar = await make(
                    [
                        timed('earlier late event', 1380, 1385),
                        timed('last five minutes', 1435, 1440),
                    ],
                    'day',
                );
                calendar.style.fontSize = `${font}px`;
                calendar.dir = direction;
                calendar.timedEntryPresentation = 'marker';
                await settle(calendar);
                const all = entries(calendar);
                expect(all).to.have.length(2);
                const labels = all.map((entry) => entry.shadowRoot!.querySelector('.main')!);
                expect(separated(labels[0], labels[1])).to.equal(true);
                const end = view(calendar)
                    .shadowRoot!.querySelector('.timed-content')!
                    .getBoundingClientRect().bottom;
                for (const label of labels)
                    expect(label.getBoundingClientRect().bottom).to.be.at.most(end + 1);
                const last = all.find((entry) => entry.eventId === 'last five minutes')!;
                const mark = last.shadowRoot!.querySelector('.duration-mark')!;
                expect(mark.getBoundingClientRect().height).to.be.closeTo(5 * scale(calendar), 0.1);
                expect(mark.getBoundingClientRect().bottom).to.be.closeTo(end, 0.5);
                expect(
                    last.shadowRoot!.querySelector('.label-leader')!.getBoundingClientRect().height,
                ).to.be.greaterThan(0);
            });
        }
    }

    it('represents a point with zero duration and a distinct symbol, not a fabricated minimum interval', async () => {
        const calendar = await make([timed('point', 585, 585)], 'day');
        calendar.timedEntryPresentation = 'marker';
        await settle(calendar);
        const point = entries(calendar)[0];
        const mark = point.shadowRoot!.querySelector<HTMLElement>('.duration-mark')!;
        expect(mark.hasAttribute('data-point')).to.equal(true);
        expect(mark.getBoundingClientRect().height).to.equal(0);
        expect(getComputedStyle(mark, '::before').transform).not.to.equal('none');
        expect(point.canonicalEntry!.time!.start).to.deep.equal(point.canonicalEntry!.time!.end);
    });

    it('does not apply timed marks to the all-day band', async () => {
        const allDay: CalendarEntry = {
            id: 'all-day',
            heading: 'all-day',
            kind: 'all-day',
            date: { start: date, end: date },
        };
        const calendar = await make([allDay, timed('briefing')], 'day');
        calendar.timedEntryPresentation = 'marker';
        await settle(calendar);
        const entry = calendar.shadowRoot!.querySelector<Entry>(
            'lms-calendar-entry[slot="all-day"]',
        )!;
        expect(entry.displayMode).to.equal('default');
        expect(entry.shadowRoot!.querySelector('.duration-mark')).to.equal(null);
    });

    for (const presentation of ['card', 'marker'] as TimedEntryPresentation[]) {
        it(`keeps canonical activation/export cancellation and real invoker return (${presentation})`, async () => {
            const supplied = timed('canonical');
            const calendar = await make([supplied], 'day');
            calendar.timedEntryPresentation = presentation;
            await settle(calendar);
            const entry = entries(calendar)[0];
            let activations = 0;
            const activation = (event: CustomEvent) => {
                activations++;
                expect(event.detail.entry).to.equal(supplied);
                expect(event.detail.eventId).to.equal('canonical');
                event.preventDefault();
            };
            calendar.addEventListener('entry-activate', activation);
            const label = entry.shadowRoot!.querySelector<HTMLElement>('.main')!;
            label.scrollIntoView({ block: 'center', inline: 'center' });
            await nextFrame();
            const rect = label.getBoundingClientRect();
            await sendMouse({
                type: 'click',
                position: [
                    Math.round(rect.x + rect.width / 2),
                    Math.round(rect.y + rect.height / 2),
                ],
            });
            await settle(calendar);
            expect(activations).to.equal(1);
            expect(calendar.shadowRoot!.querySelector<Menu>('lms-menu')!.open).to.equal(false);
            calendar.removeEventListener('entry-activate', activation);
            let anchored = false;
            entry.addEventListener(
                'open-menu',
                (event) => {
                    anchored = true;
                    const expected =
                        presentation === 'marker'
                            ? label.getBoundingClientRect()
                            : entry.getBoundingClientRect();
                    expect(event.detail.anchorRect.top).to.be.closeTo(expected.top, 0.1);
                    expect(event.detail.anchorRect.width).to.be.closeTo(expected.width, 0.1);
                },
                { once: true },
            );
            entry.focus();
            await sendKeys({ press: 'Enter' });
            await settle(calendar);
            const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
            expect(menu.open).to.equal(true);
            expect(anchored).to.equal(true);
            let exports = 0;
            calendar.addEventListener('export-entry', (event) => {
                exports++;
                expect(event.detail.entry).to.equal(supplied);
                expect(event.detail.eventId).to.equal('canonical');
                event.preventDefault();
            });
            menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
            expect(exports).to.equal(1);
            await sendKeys({ press: 'Escape' });
            await settle(calendar);
            expect(calendar.shadowRoot!.activeElement).to.equal(entry);
            expect(menu.open).to.equal(false);
        });

        it(`discloses exactly the same canonical dense events (${presentation})`, async () => {
            const supplied = Array.from({ length: 6 }, (_, i) => timed(`dense-${i}`, 540, 600));
            const calendar = await make(supplied, 'day', 390);
            calendar.timedEntryPresentation = presentation;
            await settle(calendar);
            const button = calendar.shadowRoot!.querySelector<HTMLButtonElement>('.time-group')!;
            expect(button).not.to.equal(null);
            button.click();
            await settle(calendar);
            const ids = [
                ...calendar.shadowRoot!.querySelectorAll<HTMLElement>('.agenda-event'),
            ].map((entry) => entry.dataset.eventId);
            expect(ids).to.have.members(supplied.map((entry) => entry.id));
            expect(ids).to.have.length(6);
        });
    }
});
