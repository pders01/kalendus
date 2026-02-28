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
    // --- shared fixture: heading only (read-only tests) ---
    describe('basic rendering', () => {
        let el: Entry;

        before(async () => {
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
            <lms-calendar-entry
                heading="Meeting"
                content="Discuss project status"
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement?.getAttribute('title')).to.equal(
            'Meeting: Discuss project status',
        );
    });

    it('should display time interval correctly', async () => {
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
        expect(timeElement?.textContent).to.equal('9:30 AM – 10:45 AM');
    });

    it('should format single digit hours and minutes with leading zeros', async () => {
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
        expect(timeElement?.textContent).to.equal('8:05 AM – 9:00 AM');
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

    it('should not render time in compact density', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="No Time Event" .density=${'compact'}></lms-calendar-entry>
        `);

        await el.updateComplete;

        // Compact density hides time — see docs/lit-attribute-testing-pitfall.md
        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement).to.not.exist;
    });

    it('should set data attributes correctly', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Data Event" content="Some content">
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement?.getAttribute('data-full-content')).to.equal(
            'Some content',
        );
    });

    it('should truncate long text with ellipsis', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Very Long Event Title That Should Be Truncated"
            >
            </lms-calendar-entry>
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
                style="
                    --entry-font-size: large;
                    --entry-padding: 1em;
                    --entry-border-radius: 8px;
                "
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

        const mainElement = el.shadowRoot?.querySelector(
            '.main',
        ) as HTMLElement;
        mainElement.click();

        expect((el as any)._highlighted).to.be.true;
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
        const originalDispatch = el.dispatchEvent.bind(el);
        el.dispatchEvent = ((event: Event) => {
            if (event.type === 'open-menu') {
                receivedDetail = (event as CustomEvent).detail;
                return true;
            }
            return originalDispatch(event);
        }) as typeof el.dispatchEvent;

        (el as any)._handleInteraction(new MouseEvent('click'));

        el.dispatchEvent = originalDispatch;

        expect(receivedDetail).to.exist;
        expect(receivedDetail.heading).to.equal('Menu Event');
        expect(receivedDetail.content).to.equal('Discuss roadmap');
        expect(receivedDetail.time).to.deep.equal(timeInterval);
        expect(receivedDetail.date).to.deep.equal(dateInterval.start);
        expect(receivedDetail.anchorRect).to.equal(anchorRect);
        expect(receivedDetail.displayTime).to.be.a('string').and.not.empty;
    });

    it('should handle keyboard interactions (Enter key)', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Keyboard Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        el.dispatchEvent(enterEvent);

        expect((el as any)._highlighted).to.be.true;
    });

    it('should handle keyboard interactions (Space key)', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Space Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
        el.dispatchEvent(spaceEvent);

        expect((el as any)._highlighted).to.be.true;
    });

    it('should ignore other keyboard keys', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Ignored Keys"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        el.dispatchEvent(escapeEvent);

        expect((el as any)._highlighted).to.not.be.true;
    });

    it('should handle events without date gracefully', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="No Date Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector(
            '.main',
        ) as HTMLElement;
        mainElement.click();

        expect((el as any)._highlighted).to.be.true;
    });

    it('should handle extended state correctly', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Extended Event"></lms-calendar-entry>
        `);

        (el as any)._extended = true;
        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement?.hasAttribute('data-extended')).to.be.true;
    });
});
