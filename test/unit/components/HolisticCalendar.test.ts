import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import type Menu from '../../../src/components/Menu.js';
import type Month from '../../../src/components/Month.js';
import type { CalendarEntryRequest, CalendarState } from '../../../src/contracts.js';
import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = { year: 2026, month: 6, day: 15 };
const tomorrow = { ...date, day: 16 };
const timed = (id: string, day = date, extra: Partial<CalendarEntry> = {}): CalendarEntry => ({
    id,
    kind: 'timed',
    heading: `Appointment ${id}`,
    content: 'Canonical notes',
    date: { start: day, end: day },
    time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
    ...extra,
});

async function settle(calendar: Calendar) {
    await calendar.updateComplete;
    await nextFrame();
    await nextFrame();
    await calendar.updateComplete;
}

async function calendar(
    entries: CalendarEntry[] = [],
    width = 358,
    viewMode: 'month' | 'day' | 'week' = 'month',
) {
    const element =
        await fixture<Calendar>(html`<lms-calendar locale="en" style=${`width:${width}px;height:720px`}
        .activeDate=${date} .entries=${entries} .viewMode=${viewMode}></lms-calendar>`);
    await waitUntil(
        () =>
            element._calendarWidth ===
            element.shadowRoot!.querySelector<HTMLElement>('.calendar-container')!.clientWidth,
        'the embed width must be observed before asserting responsive behavior',
    );
    await settle(element);
    return element;
}

const rows = (element: Calendar) => [
    ...element.shadowRoot!.querySelectorAll<HTMLButtonElement>('.agenda-event'),
];
const month = (element: Calendar) =>
    element.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
const dateButton = (element: Calendar, day: number) =>
    month(element).shadowRoot!.querySelector<HTMLButtonElement>(
        `.indicator[data-date="2026-6-${day}"]`,
    )!;

// These are integration tests of the live root, not standalone look-alike markup.
describe('Holistic calendar information architecture', () => {
    it('uses quiet compact date presence and one readable selected-date list', async () => {
        const element = await calendar([timed('one'), timed('two'), timed('tomorrow', tomorrow)]);
        await waitUntil(() => month(element).compact);
        expect(
            month(element).shadowRoot!.querySelectorAll('.summary:not([hidden])'),
        ).to.have.length(0);
        expect(
            month(element).shadowRoot!.querySelectorAll('.activity[data-active]'),
        ).to.have.length(2);
        expect(dateButton(element, 15).getAttribute('aria-label')).to.include('2 events');
        expect(dateButton(element, 16).getAttribute('aria-label')).to.include('1 event');
        expect(element.shadowRoot!.querySelector('.agenda-count')!.textContent).to.equal(
            '2 events',
        );
        expect(
            rows(element).map((row) => row.querySelector('.agenda-title')!.textContent),
        ).to.deep.equal(['Appointment one', 'Appointment two']);
        for (const row of rows(element))
            expect(row.getBoundingClientRect().height).to.be.at.least(44);
    });

    it('selects a compact date without changing view or fetched civil range', async () => {
        const element = await calendar([timed('one'), timed('tomorrow', tomorrow)]);
        const range = element.visibleRange;
        const changes: CalendarState[] = [];
        element.addEventListener('calendar-state-change', (event) => changes.push(event.detail));
        dateButton(element, 16).focus();
        await sendKeys({ press: 'Enter' });
        await settle(element);
        expect(element.viewMode).to.equal('month');
        expect(element.activeDate).to.deep.equal(tomorrow);
        expect(element.visibleRange).to.deep.equal(range);
        expect(changes).to.have.length(1);
        expect(changes[0].range).to.deep.equal(range);
        expect(month(element).shadowRoot!.activeElement).to.equal(dateButton(element, 16));
        expect(
            dateButton(element, 16).closest('[role="gridcell"]')!.getAttribute('aria-selected'),
        ).to.equal('true');
        expect(rows(element)).to.have.length(1);
        expect(rows(element)[0].textContent).to.include('Appointment tomorrow');
    });

    it('provides an explicit legacy drill-to-Day behavior', async () => {
        const element = await calendar([timed('one')]);
        element.monthDayBehavior = 'day';
        await settle(element);
        dateButton(element, 15).click();
        await settle(element);
        expect(element.viewMode).to.equal('day');
        expect(element.activeDate).to.deep.equal(date);
        expect(element.shadowRoot!.querySelector('.date-agenda')).to.equal(null);
    });

    it('can opt into the same inline structure in a wide embed', async () => {
        const element = await calendar([timed('one')], 1100);
        expect(month(element).compact).to.equal(false);
        element.monthDayBehavior = 'inline';
        await settle(element);
        expect(month(element).compact).to.equal(true);
        expect(rows(element)).to.have.length(1);
    });

    it('keeps canonical activation/export cancelable from an inline row', async () => {
        const original = timed('continuous', date, {
            date: { start: date, end: { ...date, day: 17 } },
            time: { start: { hour: 9, minute: 0 }, end: { hour: 11, minute: 30 } },
        });
        const element = await calendar([original]);
        let activated: CalendarEntryRequest | undefined;
        element.addEventListener(
            'entry-activate',
            (event) => {
                activated = event.detail;
                event.preventDefault();
            },
            { once: true },
        );
        rows(element)[0].click();
        await settle(element);
        const inspector = element.shadowRoot!.querySelector<Menu>('lms-menu')!;
        expect(inspector.open).to.equal(false);
        expect(activated!.eventId).to.equal('continuous');
        expect(activated!.entry.date).to.deep.equal(original.date);
        expect(activated!.entry.time).to.deep.equal(original.time);
        // Canonical requests retain the caller's authoritative object; only
        // normalized layout snapshots/state are frozen (calendarModel contract).
        expect(activated!.entry).to.equal(original);
        expect(Object.isFrozen(original)).to.equal(false);
        const range = element.visibleRange;
        rows(element)[0].click();
        await waitUntil(() => inspector.open);
        await inspector.updateComplete;
        expect(inspector.placement).to.equal('anchor');
        expect(inspector.containment).to.equal(element.shadowRoot!.querySelector('.calendar-view'));
        expect(element.visibleRange).to.deep.equal(range);
        let exported: CalendarEntryRequest | undefined;
        element.addEventListener(
            'export-entry',
            (event) => {
                exported = event.detail;
                event.preventDefault();
            },
            { once: true },
        );
        inspector.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        await settle(element);
        expect(exported!.eventId).to.equal('continuous');
        expect(exported!.entry.date).to.deep.equal(original.date);
        expect(exported!.entry.time).to.deep.equal(original.time);
        inspector.shadowRoot!.querySelector<HTMLButtonElement>('.close-btn')!.click();
        await waitUntil(() => !inspector.open);
        await settle(element);
        expect(element.shadowRoot!.activeElement).to.equal(rows(element)[0]);
    });

    it('renders an all-day group label once rather than once per row', async () => {
        const entries = ['one', 'two'].map((id) =>
            timed(id, date, { kind: 'all-day', time: undefined }),
        );
        const element = await calendar(entries);
        expect(element.shadowRoot!.querySelectorAll('.agenda-group')).to.have.length(1);
        expect(element.shadowRoot!.querySelector('.agenda-group')!.textContent).to.equal('All Day');
        expect(element.shadowRoot!.querySelectorAll('.agenda-time')).to.have.length(0);
        for (const row of rows(element))
            expect(row.getAttribute('aria-label')).to.include('All Day');
    });

    it('bounds large list DOM with an explicit continuation rather than silent truncation', async () => {
        const element = await calendar(
            Array.from({ length: 75 }, (_, index) => timed(String(index))),
        );
        expect(rows(element)).to.have.length(50);
        expect(element.shadowRoot!.querySelector('.agenda-count')!.textContent).to.equal(
            '75 events',
        );
        const more = element.shadowRoot!.querySelector<HTMLButtonElement>('.agenda-more')!;
        expect(more.textContent).to.include('25 more events');
        more.click();
        await settle(element);
        expect(rows(element)).to.have.length(75);
        expect(element.shadowRoot!.querySelector('.agenda-more')).to.equal(null);
    });

    it('does not announce an empty result while the owner reports loading or a fetch failure', async () => {
        const element = await calendar();
        element.loading = true;
        await settle(element);
        expect(element.shadowRoot!.querySelector('.agenda-count')).to.equal(null);
        expect(
            element.shadowRoot!.querySelector('.calendar-view')!.getAttribute('aria-busy'),
        ).to.equal('true');
        expect(element.shadowRoot!.querySelector('progress')).not.to.equal(null);
        element.loading = false;
        element.error = '<Failed to load>';
        await settle(element);
        expect(element.shadowRoot!.querySelector('.agenda-count')).to.equal(null);
        expect(element.shadowRoot!.querySelector('.calendar-error')!.textContent).to.equal(
            '<Failed to load>',
        );
        expect(element.shadowRoot!.querySelector('Failed')).to.equal(null);
        element.error = '';
        await settle(element);
        expect(element.shadowRoot!.querySelector('.agenda-count')!.textContent).to.equal(
            '0 events',
        );
    });

    it('allocates readable wide-Day overlap lanes without physical occlusion', async () => {
        const element = await calendar(
            ['one', 'two', 'three'].map((id) => timed(id)),
            1100,
            'day',
        );
        const cards = [
            ...element.shadowRoot!.querySelectorAll<HTMLElement>(
                'lms-calendar-entry[slot="timed"]',
            ),
        ];
        expect(cards).to.have.length(3);
        expect(element.shadowRoot!.querySelector('.time-group')).to.equal(null);
        const boxes = cards
            .map((card) => card.getBoundingClientRect())
            .sort((a, b) => a.left - b.left);
        for (let index = 1; index < boxes.length; index++)
            expect(boxes[index].left).to.be.at.least(boxes[index - 1].right - 0.5);
        for (const card of cards)
            expect(
                card.shadowRoot!.querySelector('.title')!.getBoundingClientRect().width,
            ).to.be.at.least(24);
    });

    it('discloses the exact timed group without changing Week state, then restores place', async () => {
        const groupEntries = Array.from({ length: 8 }, (_, index) =>
            timed(`dense-${index}`, tomorrow),
        );
        const outsideGroup = timed('elsewhere', tomorrow, {
            time: { start: { hour: 17, minute: 0 }, end: { hour: 18, minute: 0 } },
        });
        const element = await calendar(
            [...groupEntries, outsideGroup, timed('other-date')],
            358,
            'week',
        );
        await waitUntil(() => !!element.shadowRoot!.querySelector('.time-group'));
        const states: CalendarState[] = [];
        const activated: CalendarEntry[] = [];
        element.addEventListener('calendar-state-change', ({ detail }) => states.push(detail));
        element.addEventListener('entry-activate', (event) => {
            activated.push(event.detail.entry);
            event.preventDefault();
        });
        const view = element.shadowRoot!.querySelector('lms-calendar-week')!;
        const scroller = view.shadowRoot!.querySelector<HTMLElement>('.week-scroll')!;
        expect(getComputedStyle(scroller).scrollSnapType).to.equal('none');
        scroller.scrollTop = 180;
        const before = scroller.scrollTop;
        const originalRange = element.visibleRange;
        const group = element.shadowRoot!.querySelector<HTMLButtonElement>('.time-group')!;
        const key = group.dataset.densityKey;
        expect(group.getAttribute('aria-label')).to.include('8 events');
        group.focus();
        await sendKeys({ press: 'Enter' });
        await settle(element);
        expect(element.viewMode).to.equal('week');
        expect(element.activeDate).to.deep.equal(date);
        expect(element.visibleRange).to.deep.equal(originalRange);
        expect(activated).to.have.length(0);
        expect(rows(element).map((row) => row.dataset.eventId)).to.deep.equal(
            groupEntries.map(({ id }) => id),
        );
        expect(element.shadowRoot!.activeElement?.id).to.equal('agenda-date');
        expect(element.shadowRoot!.activeElement?.textContent).to.equal('Jun 16, 2026');
        rows(element)[0].click();
        await settle(element);
        expect(activated[0]).to.equal(groupEntries[0]);
        const close = element.shadowRoot!.querySelector<HTMLButtonElement>('.density-list-close')!;
        expect(close.textContent).to.equal('Close');
        expect(close.getBoundingClientRect().height).to.be.at.least(44);
        expect(close.getBoundingClientRect().width).to.be.at.least(44);
        close.focus();
        await sendKeys({ press: 'Enter' });
        await settle(element);
        expect(element.viewMode).to.equal('week');
        expect(element.visibleRange).to.deep.equal(originalRange);
        const restored = element
            .shadowRoot!.querySelector('lms-calendar-week')!
            .shadowRoot!.querySelector<HTMLElement>('.week-scroll')!;
        expect(restored.scrollTop).to.be.closeTo(before, 1);
        expect((element.shadowRoot!.activeElement as HTMLElement).dataset.densityKey).to.equal(key);
        expect(states).to.have.length(0);

        // A real date/view change dismisses the list without restoring stale state.
        element.shadowRoot!.querySelector<HTMLButtonElement>('.time-group')!.click();
        await settle(element);
        element.activeDate = { ...date, day: 22 };
        element.viewMode = 'day';
        await settle(element);
        expect(element.shadowRoot!.querySelector('[data-density-list]')).to.equal(null);
        expect(element.shadowRoot!.querySelector('lms-calendar-day')).not.to.equal(null);
        expect(states).to.have.length(1);
        expect(states[0].activeDate.day).to.equal(22);
    });
});
