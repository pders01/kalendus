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
    it('should render entry correctly', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Test Event"></lms-calendar-entry>
        `);

        expect(el).to.exist;
        expect(el.shadowRoot).to.exist;
    });

    it('should display heading correctly', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Team Meeting"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const titleElement = el.shadowRoot?.querySelector('.title');
        expect(titleElement?.textContent).to.equal('Team Meeting');
    });

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

    it('should display only heading in title when content is empty', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Meeting"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement?.getAttribute('title')).to.equal('Meeting');
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
                density="standard"
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement?.textContent).to.equal('09:30 - 10:45');
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
                density="standard"
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement?.textContent).to.equal('08:05 - 09:00');
    });

    it('should display "All Day" for continuation events', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry
                heading="Conference"
                .isContinuation=${true}
                density="standard"
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
                density="standard"
            >
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement?.textContent).to.equal('All Day');
    });

    it('should not render time in compact density', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="No Time Event" density="compact"></lms-calendar-entry>
        `);

        await el.updateComplete;

        // Compact density hides time
        const timeElement = el.shadowRoot?.querySelector('.time');
        expect(timeElement).to.not.exist;
    });

    it('should be focusable and accessible', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Accessible Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        // Default tabindex is 0 (no accessibility config provided)
        expect(mainElement?.getAttribute('tabindex')).to.equal('0');
    });

    it('should handle click interactions', async () => {
        const dateInterval: CalendarDateInterval = {
            start: { day: 15, month: 9, year: 2023 },
            end: { day: 15, month: 9, year: 2023 },
        };

        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Clickable Event" .date=${dateInterval}>
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        // Simulate click
        const mainElement = el.shadowRoot?.querySelector(
            '.main',
        ) as HTMLElement;
        mainElement.click();

        // Check if element is highlighted after click
        expect((el as any)._highlighted).to.be.true;
    });

    it('should handle keyboard interactions (Enter key)', async () => {
        const dateInterval: CalendarDateInterval = {
            start: { day: 15, month: 9, year: 2023 },
            end: { day: 15, month: 9, year: 2023 },
        };

        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Keyboard Event" .date=${dateInterval}>
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        // Simulate Enter key press
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        el.dispatchEvent(enterEvent);

        // Check if element is highlighted after Enter
        expect((el as any)._highlighted).to.be.true;
    });

    it('should handle keyboard interactions (Space key)', async () => {
        const dateInterval: CalendarDateInterval = {
            start: { day: 15, month: 9, year: 2023 },
            end: { day: 15, month: 9, year: 2023 },
        };

        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Space Event" .date=${dateInterval}>
            </lms-calendar-entry>
        `);

        await el.updateComplete;

        // Simulate Space key press
        const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
        el.dispatchEvent(spaceEvent);

        // Check if element is highlighted after Space
        expect((el as any)._highlighted).to.be.true;
    });

    it('should ignore other keyboard keys', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Ignored Keys"></lms-calendar-entry>
        `);

        await el.updateComplete;

        // Simulate other key press
        const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
        el.dispatchEvent(escapeEvent);

        // Check that element is not highlighted
        expect((el as any)._highlighted).to.not.be.true;
    });

    it('should handle events without date gracefully', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="No Date Event"></lms-calendar-entry>
        `);

        await el.updateComplete;

        // Simulate click without date
        const mainElement = el.shadowRoot?.querySelector(
            '.main',
        ) as HTMLElement;
        mainElement.click();

        // Should still highlight but not create menu
        expect((el as any)._highlighted).to.be.true;
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

    it('should handle extended state correctly', async () => {
        const el: Entry = await fixture(html`
            <lms-calendar-entry heading="Extended Event"></lms-calendar-entry>
        `);

        // Set extended state
        (el as any)._extended = true;
        await el.updateComplete;

        const mainElement = el.shadowRoot?.querySelector('.main');
        expect(mainElement?.hasAttribute('data-extended')).to.be.true;
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
});
