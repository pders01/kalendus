import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';

import '../../../src/lms-calendar.ts';
import type Day from '../../../src/components/Day.ts';
import type Entry from '../../../src/components/Entry.ts';
import { LayoutCalculator } from '../../../src/lib/LayoutCalculator.js';
import { SlotManager } from '../../../src/lib/SlotManager.js';
import type Calendar from '../../../src/lms-calendar.ts';

const date = { year: 2026, month: 6, day: 15 };
const time = (minutes: number) => ({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
const event = (id: string, start: number, end: number): CalendarEntry => ({
    id,
    heading: id,
    date: { start: date, end: date },
    time: { start: time(start), end: time(end) },
});
const overlapping = () => [
    event('background', 540, 840),
    event('early', 540, 570),
    event('persistent', 550, 720),
    event('late', 580, 630),
];
const settle = async () => {
    for (let frame = 0; frame < 4; frame++) await nextFrame();
};
const entryAt = (root: Document | ShadowRoot, x: number, y: number) =>
    root.elementsFromPoint(x, y).find((element) => element.tagName === 'LMS-CALENDAR-ENTRY');

async function scrollToNine(day: Day) {
    await day.updateComplete;
    await settle();
    const scroller = day.shadowRoot!.querySelector<HTMLElement>('.main')!;
    const column = day.shadowRoot!.querySelector<HTMLElement>('.timed-content')!;
    const minute = parseFloat(getComputedStyle(day).getPropertyValue('--minute-height'));
    const padding = parseFloat(getComputedStyle(scroller).paddingTop);
    expect(getComputedStyle(scroller).scrollSnapType).to.equal('none');
    // Minute zero is the timed column's origin, not the scroller's border edge.
    // Preserve the axis line-box inset while bringing 09:00 into view.
    scroller.scrollTop +=
        column.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        540 * minute -
        padding;
    await settle();
    return { column, minute };
}

function expectOpaque(entries: Entry[]) {
    for (const entry of entries) {
        expect(getComputedStyle(entry).opacity).to.equal('1');
        expect(getComputedStyle(entry).backgroundColor).to.equal('rgb(255, 255, 255)');
    }
}

describe('Rendered time-grid overlap policies', () => {
    it('keeps every root column heading hit-testable without painting over concurrent cards', async () => {
        const calendar = await fixture<Calendar>(html`
            <lms-calendar .viewMode=${'day'} .activeDate=${date} .entries=${overlapping()}
                style="width:900px;height:760px;--background-color:white"
            ></lms-calendar>
        `);
        await waitUntil(
            () => calendar.shadowRoot!.querySelectorAll('lms-calendar-entry').length === 4,
        );
        const day = calendar.shadowRoot!.querySelector<Day>('lms-calendar-day')!;
        const { column, minute } = await scrollToNine(day);
        const entries = [...calendar.shadowRoot!.querySelectorAll<Entry>('lms-calendar-entry')];
        expect(calendar.shadowRoot!.querySelector('.time-group')).to.equal(null);
        expectOpaque(entries);
        for (const entry of entries) {
            const box = entry.getBoundingClientRect();
            const start = entry.time!.start.hour * 60 + entry.time!.start.minute;
            expect(box.top - column.getBoundingClientRect().top).to.be.closeTo(start * minute, 0.5);
            const title = entry.shadowRoot!.querySelector('.title')!.getBoundingClientRect();
            expect(title.width).to.be.at.least(48);
            expect(title.left).to.be.at.least(box.left);
            expect(title.right).to.be.at.most(box.right);
            expect(
                entryAt(calendar.shadowRoot!, title.left + 4, title.top + title.height / 2) ===
                    entry,
            ).to.equal(true);
        }
        // Only temporally concurrent cards require distinct horizontal space; a
        // later card may reuse an earlier card's lane after its display interval.
        for (let i = 0; i < entries.length; i++) {
            for (let j = i + 1; j < entries.length; j++) {
                const a = entries[i].getBoundingClientRect();
                const b = entries[j].getBoundingClientRect();
                if (Math.max(a.top, b.top) < Math.min(a.bottom, b.bottom) - 0.5) {
                    expect(Math.min(a.right, b.right) - Math.max(a.left, b.left)).to.be.at.most(
                        0.5,
                    );
                }
            }
        }
        const late = entries.find((entry) => entry.heading === 'late')!;
        const title = late.shadowRoot!.querySelector('.title')!.getBoundingClientRect();
        let activated = '';
        calendar.addEventListener('entry-activate', (event) => {
            activated = (event as CustomEvent).detail.eventId;
            event.preventDefault();
        });
        (
            calendar.shadowRoot!.elementFromPoint(
                title.left + 4,
                title.top + title.height / 2,
            ) as HTMLElement
        ).click();
        await waitUntil(() => activated !== '');
        expect(activated).to.equal('late');
    });

    it('discloses only the unreadable root group instead of overlapping its cards', async () => {
        const calendar = await fixture<Calendar>(html`
            <lms-calendar .viewMode=${'day'} .activeDate=${date}
                .entries=${[...overlapping(), event('outside-group', 900, 930)]}
                style="width:360px;height:760px"
            ></lms-calendar>
        `);
        await waitUntil(() => calendar.shadowRoot!.querySelectorAll('.time-group').length === 1);
        await settle();
        expect(calendar.shadowRoot!.querySelectorAll('lms-calendar-entry').length).to.equal(1);
        expect(calendar.shadowRoot!.querySelector<Entry>('lms-calendar-entry')!.heading).to.equal(
            'outside-group',
        );
        const disclosure = calendar.shadowRoot!.querySelector<HTMLButtonElement>('.time-group')!;
        expect(disclosure.getAttribute('aria-label')).to.include('4 events');
        disclosure.click();
        await waitUntil(() => calendar.shadowRoot!.querySelector('[data-density-list]') !== null);
        const headings = [...calendar.shadowRoot!.querySelectorAll('.agenda-title')]
            .map((title) => title.textContent)
            .sort();
        expect(headings).to.deep.equal(['background', 'early', 'late', 'persistent']);
        expect(calendar.shadowRoot!.querySelector('.date-agenda')!.textContent).not.to.include(
            'outside-group',
        );
    });

    // Migration of the historical cascade paint-order regression: the root now
    // opts into columns/disclosure, so it can no longer exercise reused cascade
    // depths. Keep the original four intervals in a standalone consumer of the
    // calculator's compatibility default, with an explicit depth-only negative
    // control. Do not count the root's non-overlap test as cascade evidence.
    it('preserves standalone cascade paint order when a later card reuses a shallower depth', async () => {
        const events = overlapping();
        const boxes = new LayoutCalculator().calculateLayout(
            events.map((entry) => ({
                id: entry.id!,
                heading: entry.heading!,
                startTime: entry.time!.start,
                endTime: entry.time!.end,
                color: 'teal',
            })),
        ).boxes;
        const slots = new SlotManager();
        const day = await fixture<Day>(html`
            <lms-calendar-day .activeDate=${date}
                style="width:900px;height:760px;--calendar-grid-columns-day:64px minmax(0,1fr);--entry-font-size:16px;--entry-line-height:1.25;--entry-padding:0.15em 0.3em;--entry-title-wrap:nowrap;--entry-background-color:white"
            >
                ${events.map((entry, index) => {
                    const position = slots.calculatePosition({
                        viewMode: 'day',
                        date,
                        time: entry.time,
                    });
                    // As in the root adapter, readability requires opaque cards;
                    // the calculator's legacy opacity values remain API-compatible.
                    const style = slots.generatePositionCSS(
                        position,
                        { ...boxes[index], opacity: 1 },
                        entry.time,
                    );
                    return html`<lms-calendar-entry slot=${position.slotName}
                        heading=${entry.heading!} .eventId=${entry.id} .canonicalEntry=${entry}
                        .date=${entry.date} .time=${entry.time} style=${style}
                    ></lms-calendar-entry>`;
                })}
            </lms-calendar-day>
        `);
        await scrollToNine(day);
        const entries = [...day.querySelectorAll<Entry>('lms-calendar-entry')];
        await Promise.all(entries.map((entry) => entry.updateComplete));
        expectOpaque(entries);
        const lateIndex = events.findIndex((entry) => entry.id === 'late');
        const persistentIndex = events.findIndex((entry) => entry.id === 'persistent');
        const late = entries[lateIndex];
        const persistent = entries[persistentIndex];
        const last = late.getBoundingClientRect();
        const earlier = persistent.getBoundingClientRect();
        const x = Math.max(last.left, earlier.left) + 8;
        const y = last.top + 12;
        expect(boxes[lateIndex].depth).to.be.lessThan(boxes[persistentIndex].depth);
        expect(x).to.be.lessThan(Math.min(last.right, earlier.right));
        expect(y).to.be.lessThan(earlier.bottom);
        expect(entryAt(document, x, y) === late).to.equal(true);

        const originalZIndex = late.style.zIndex;
        try {
            // Reproduce the old depth-only ordering: persistent covers late.
            late.style.zIndex = String(101 + boxes[lateIndex].depth);
            expect(entryAt(document, x, y) === persistent).to.equal(true);
        } finally {
            late.style.zIndex = originalZIndex;
        }
        expect(entryAt(document, x, y) === late).to.equal(true);
        let activated: CustomEvent | undefined;
        day.addEventListener('open-menu', (event) => {
            activated = event as CustomEvent;
            event.preventDefault();
        });
        (document.elementFromPoint(x, y) as HTMLElement).click();
        expect(activated?.detail.eventId).to.equal('late');
        expect(activated?.detail.entry === events[lateIndex]).to.equal(true);
    });
});
