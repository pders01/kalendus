import { expect, fixture, html } from '@open-wc/testing';

import '../../../src/components/Entry.ts';
import type Entry from '../../../src/components/Entry.ts';

// Mock types for testing
type CalendarTime = {
    hour: number;
    minute: number;
};

type CalendarTimeInterval = {
    start: CalendarTime;
    end: CalendarTime;
};

type CalendarDate = {
    day: number;
    month: number;
    year: number;
};

type CalendarDateInterval = {
    start: CalendarDate;
    end: CalendarDate;
};

describe('Entry Component', () => {
    // Each test owns a connected fixture; open-wc cleans fixtures after each test.
    describe('basic rendering', () => {
        let el: Entry;

        beforeEach(async () => {
            el = await fixture(html`
                <lms-calendar-entry heading="Test Event"></lms-calendar-entry>
            `);
            await el.updateComplete;
        });

        it('should render entry correctly', function () {
            expect(el).to.exist;
            expect(el.shadowRoot).to.exist;
        });

        it('should display heading correctly', function () {
            const titleElement = el.shadowRoot?.querySelector('.title');
            expect(titleElement?.textContent).to.equal('Test Event');
        });

        it('should display only heading in title when content is empty', function () {
            const mainElement = el.shadowRoot?.querySelector('.main');
            expect(mainElement?.getAttribute('title')).to.equal('Test Event');
        });

        it('should be focusable and accessible', function () {
            expect(el.tabIndex).to.equal(0);
            expect(el.getAttribute('role')).to.equal('button');
            expect(el.getAttribute('aria-label')).to.be.a('string').and.not.empty;
        });
    });

    // --- tests with unique props (each needs its own fixture) ---

    it('should display heading and content in title', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Meeting" content="Discuss project status"> </lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement?.getAttribute('title')).to.equal('Meeting: Discuss project status');
    });

    it('should display both endpoints of a standard time interval', async () => {
        const timeInterval: CalendarTimeInterval = {
            start: { hour: 9, minute: 30 },
            end: { hour: 10, minute: 45 },
        };

        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Meeting"
                .time=${timeInterval}
                .density=${'standard'}
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement?.textContent).to.equal('\u20669:30 AM – 10:45 AM\u2069');
        expect(el.getAttribute('aria-label')).to.include('9:30 AM – 10:45 AM');
    });

    it('should preserve minute padding in the complete time range', async () => {
        const timeInterval: CalendarTimeInterval = {
            start: { hour: 8, minute: 5 },
            end: { hour: 9, minute: 0 },
        };

        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Morning Meeting"
                .time=${timeInterval}
                .density=${'standard'}
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement?.textContent).to.equal('\u20668:05 AM – 9:00 AM\u2069');
    });

    it('should display "All Day" for continuation events', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Conference"
                .isContinuation=${true}
                .density=${'standard'}
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement?.textContent).to.equal('All Day');
    });

    it('should detect all-day events ending at 24:00', async () => {
        const timeInterval: CalendarTimeInterval = {
            start: { hour: 0, minute: 0 },
            end: { hour: 24, minute: 0 },
        };

        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="All Day Event"
                .time=${timeInterval}
                .density=${'standard'}
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement?.textContent).to.equal('All Day');
    });

    it('should retain the real range in a compact minimum-height preview', async () => {
        const timeInterval: CalendarTimeInterval = {
            start: { hour: 9, minute: 0 },
            end: { hour: 9, minute: 5 },
        };
        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Quick Event"
                .time=${timeInterval}
                .density=${'compact'}
                data-height="compact"
                style="--entry-compact-show-time:none"
            ></lms-calendar-entry>
        `);
        await el.updateComplete;

        const timeElement = el.shadowRoot!.querySelector<HTMLElement>('.time')!;
        expect(timeElement.textContent).to.equal('\u20669:00 AM – 9:05 AM\u2069');
        expect(getComputedStyle(timeElement).display).not.to.equal('none');
        expect(el.time).to.equal(timeInterval);
        expect(el.getAttribute('aria-label')).to.include('9:00 AM – 9:05 AM');
    });

    it('should keep Month previews start-only while retaining the full accessible range', async () => {
        const el = await fixture<Entry>(html`
            <lms-calendar-entry
                heading="Month Event"
                .displayMode=${'month-dot'}
                .time=${{ start: { hour: 9, minute: 30 }, end: { hour: 10, minute: 45 } }}
            ></lms-calendar-entry>
        `);
        expect(el.shadowRoot!.querySelector('.time')?.textContent).to.equal('9:30 AM');
        expect(el.getAttribute('aria-label')).to.include('9:30 AM – 10:45 AM');

        el.displayMode = 'month-span';
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.time')).to.equal(null);
        expect(el.getAttribute('aria-label')).to.include('9:30 AM – 10:45 AM');
    });

    it('should set data attributes correctly', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Data Event" content="Some content"> </lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement?.getAttribute('data-full-content')).to.equal('Some content');
    });

    it('should truncate long text with ellipsis', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Very Long Event Title That Should Be Truncated"> </lms-calendar-entry>
        `);

        await el.updateComplete;

        const titleSpan = el.shadowRoot?.querySelector('.title');
        const computedStyle = window.getComputedStyle(titleSpan as Element);

        expect(computedStyle.overflow).to.equal('hidden');
        expect(computedStyle.textOverflow).to.equal('ellipsis');
    });

    it('should support CSS custom properties', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Styled Event"
                style="--entry-font-size: large; --entry-padding: 1em; --entry-border-radius: 8px"
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement).to.exist;
    });

    // --- interaction tests (each needs a fresh fixture) ---

    it('should handle click interactions', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Clickable Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main') as HTMLElement;
        mainElement.click();
        await el.updateComplete;

        expect(el.hasAttribute('data-highlighted')).to.be.true;
        expect(el.hasAttribute('aria-selected')).to.be.false;
    });

    // --- highlight / a11y regression (full lifecycle) ---

    it('should set data-highlighted on click', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Highlight Test"></lms-calendar-entry>
        `);
        await el.updateComplete;

        el.click();
        await el.updateComplete;

        expect(el.hasAttribute('data-highlighted')).to.be.true;
    });

    it('should clear its visual highlight without unsupported button selection ARIA', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Clear Test"></lms-calendar-entry>
        `);
        await el.updateComplete;

        el.click();
        await el.updateComplete;
        expect(el.hasAttribute('aria-selected')).to.be.false;
        expect(el.hasAttribute('data-highlighted')).to.be.true;

        el.clearSelection();
        await el.updateComplete;

        expect(el.hasAttribute('aria-selected')).to.be.false;
        expect(el.hasAttribute('data-highlighted')).to.be.false;
    });

    it('should re-highlight after clearSelection() (not stuck on first click)', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Re-highlight Test"></lms-calendar-entry>
        `);
        await el.updateComplete;

        // First click
        el.click();
        await el.updateComplete;
        expect(el.hasAttribute('data-highlighted')).to.be.true;

        // Clear
        el.clearSelection();
        await el.updateComplete;
        expect(el.hasAttribute('data-highlighted')).to.be.false;

        // Second click should re-highlight
        el.click();
        await el.updateComplete;
        expect(el.hasAttribute('aria-selected')).to.be.false;
        expect(el.hasAttribute('data-highlighted')).to.be.true;
    });

    it('should emit open-menu with event details when date is provided', async () => {
        const dateInterval: CalendarDateInterval = {
            start: { day: 15, month: 9, year: 2023 },
            end: { day: 15, month: 9, year: 2023 },
        };
        const timeInterval: CalendarTimeInterval = {
            start: { hour: 9, minute: 0 },
            end: { hour: 10, minute: 30 },
        };

        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Menu Event"
                content="Discuss roadmap"
                .date=${dateInterval}
                .time=${timeInterval}
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const anchorRect = new DOMRect(12, 34, 120, 42);
        (el as HTMLElement).getBoundingClientRect = () => anchorRect;

        let receivedDetail: any;
        let receivedEvent: CustomEvent | undefined;
        el.addEventListener(
            'open-menu',
            (event) => {
                receivedEvent = event as CustomEvent;
                receivedDetail = receivedEvent.detail;
                event.preventDefault();
            },
            { once: true },
        );

        el.click();

        expect(receivedEvent?.bubbles).to.equal(true);
        expect(receivedEvent?.composed).to.equal(true);
        expect(receivedEvent?.cancelable).to.equal(true);
        expect(receivedEvent?.defaultPrevented).to.equal(true);

        expect(receivedDetail).to.exist;
        expect(receivedDetail.heading).to.equal('Menu Event');
        expect(receivedDetail.content).to.equal('Discuss roadmap');
        expect(receivedDetail.time).to.deep.equal(timeInterval);
        expect(receivedDetail.date).to.deep.equal(dateInterval.start);
        expect(receivedDetail.anchorRect).to.equal(anchorRect);
        expect(receivedDetail.displayTime).to.be.a('string').and.not.empty;
    });

    for (const key of ['Enter', ' ']) {
        it(`should activate the canonical event exactly once with ${key === ' ' ? 'Space' : key}`, async () => {
            const canonical: CalendarEntry = {
                id: 'canonical-event',
                kind: 'timed',
                heading: 'Original event',
                content: 'Original details',
                date: {
                    start: { year: 2026, month: 6, day: 15 },
                    end: { year: 2026, month: 6, day: 16 },
                },
                time: { start: { hour: 23, minute: 0 }, end: { hour: 1, minute: 0 } },
            };
            const el = await fixture<Entry>(html`
                <lms-calendar-entry
                    heading="Displayed continuation"
                    kind="timed"
                    .isContinuation=${true}
                    .canonicalEntry=${canonical}
                    .date=${{ start: canonical.date.end, end: canonical.date.end }}
                    .time=${{ start: { hour: 0, minute: 0 }, end: canonical.time!.end }}
                ></lms-calendar-entry>
            `);
            const opened: CustomEvent[] = [];
            el.addEventListener('open-menu', (event) => {
                opened.push(event as CustomEvent);
                event.preventDefault();
            });
            el.focus();
            expect(document.activeElement === el).to.equal(true);
            expect(opened.length).to.equal(0);
            const down = new KeyboardEvent('keydown', { key, cancelable: true });
            el.dispatchEvent(down);
            expect(down.defaultPrevented).to.equal(true);
            expect(opened.length).to.equal(key === ' ' ? 0 : 1);
            el.dispatchEvent(new KeyboardEvent('keyup', { key, cancelable: true }));
            await el.updateComplete;

            expect(opened.length).to.equal(1);
            const detail = opened[0].detail;
            expect(detail.entry === canonical).to.equal(true);
            expect(detail.time === canonical.time).to.equal(true);
            expect(detail.date).to.deep.equal(canonical.date.start);
            expect(detail.heading).to.equal(canonical.heading);
            expect(detail.content).to.equal(canonical.content);
            expect(detail.eventId).to.equal(canonical.id);
            expect(detail.displayTime).to.include('11:00 PM');
            expect(detail.displayTime).to.include('1:00 AM');
            expect(el.hasAttribute('data-highlighted')).to.equal(true);
        });
    }

    it('should handle keyboard interactions (Enter key)', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Keyboard Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        el.dispatchEvent(enterEvent);
        await el.updateComplete;

        expect(el.hasAttribute('data-highlighted')).to.be.true;
    });

    it('should handle keyboard interactions (Space key)', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Space Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const spaceEvent = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
        el.dispatchEvent(spaceEvent);
        expect(spaceEvent.defaultPrevented).to.be.true;
        expect(el.hasAttribute('data-highlighted')).to.be.false;
        el.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }));
        await el.updateComplete;

        expect(el.hasAttribute('data-highlighted')).to.be.true;
    });

    it('should ignore other keyboard keys', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Ignored Keys"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        el.dispatchEvent(escapeEvent);
        await el.updateComplete;

        expect(el.hasAttribute('data-highlighted')).to.equal(false);
        expect(el.hasAttribute('aria-selected')).to.equal(false);
    });

    it('should handle events without date gracefully', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="No Date Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main') as HTMLElement;
        mainElement.click();
        await el.updateComplete;

        expect(el.hasAttribute('data-highlighted')).to.be.true;
    });
});
