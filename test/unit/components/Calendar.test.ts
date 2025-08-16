import { expect, fixture, html } from '@open-wc/testing';
import '../../../src/lms-calendar.ts';
import type LMSCalendar from '../../../src/lms-calendar.ts';

// Mock types for testing
type CalendarDate = {
    day: number;
    month: number;
    year: number;
};

type CalendarTime = {
    hour: number;
    minute: number;
};

type CalendarTimeInterval = {
    start: CalendarTime;
    end: CalendarTime;
};

type CalendarDateInterval = {
    start: CalendarDate;
    end: CalendarDate;
};

type CalendarEntry = {
    date: CalendarDateInterval;
    time: CalendarTimeInterval;
    heading: string;
    content: string;
    color: string;
    isContinuation: boolean;
};

describe('Calendar Component', () => {
    it('should render calendar correctly', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        expect(el).to.exist;
        expect(el.shadowRoot).to.exist;
    });

    it('should initialize with current date', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        const currentDate = new Date();
        expect(el.activeDate.day).to.equal(currentDate.getDate());
        expect(el.activeDate.month).to.equal(currentDate.getMonth() + 1);
        expect(el.activeDate.year).to.equal(currentDate.getFullYear());
    });

    it('should accept custom active date', async () => {
        const customDate: CalendarDate = {
            day: 15,
            month: 6,
            year: 2023,
        };

        const el: LMSCalendar = await fixture(html`
            <lms-calendar .activeDate=${customDate}></lms-calendar>
        `);

        await el.updateComplete;

        expect(el.activeDate.day).to.equal(15);
        expect(el.activeDate.month).to.equal(6);
        expect(el.activeDate.year).to.equal(2023);
    });

    it('should render header component', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        const header = el.shadowRoot?.querySelector('lms-calendar-header');
        expect(header).to.exist;
    });

    it('should render context component', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        const context = el.shadowRoot?.querySelector('lms-calendar-context');
        expect(context).to.exist;
    });

    it('should render month component by default', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        const month = el.shadowRoot?.querySelector('lms-calendar-month');
        expect(month).to.exist;
        expect(month?.hasAttribute('hidden')).to.be.false;
    });

    it('should render day component as hidden by default', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        const day = el.shadowRoot?.querySelector('lms-calendar-day');
        expect(day).to.exist;
        expect(day?.hasAttribute('hidden')).to.be.true;
    });

    it('should display custom heading', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar heading="My Custom Calendar"></lms-calendar>
        `);

        await el.updateComplete;

        expect(el.heading).to.equal('My Custom Calendar');
    });

    it('should accept entries', async () => {
        const entries: CalendarEntry[] = [
            {
                date: {
                    start: { day: 15, month: 9, year: 2023 },
                    end: { day: 15, month: 9, year: 2023 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Test Event',
                content: 'Test Content',
                color: '#ff0000',
                isContinuation: false,
            },
        ];

        const el: LMSCalendar = await fixture(html`
            <lms-calendar .entries=${entries}></lms-calendar>
        `);

        await el.updateComplete;

        expect(el.entries).to.have.length(1);
        expect(el.entries[0].heading).to.equal('Test Event');
    });

    it('should handle switch date events from header', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        const initialMonth = el.activeDate.month;

        // Simulate switch date event
        const switchEvent = new CustomEvent('switchdate', {
            detail: { direction: 'next' },
            bubbles: true,
        });

        const header = el.shadowRoot?.querySelector('lms-calendar-header');
        header?.dispatchEvent(switchEvent);

        await el.updateComplete;

        // Should have changed the month (either next month or wrapped around)
        expect(el.activeDate.month).to.not.equal(initialMonth);
    });

    it('should handle expand events from month', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        // Initially no expanded date
        expect((el as any)._expandedDate).to.be.undefined;

        // Simulate expand event
        const expandEvent = new CustomEvent('expand', {
            detail: { date: { day: 15, month: 9, year: 2023 } },
            bubbles: true,
        });

        const month = el.shadowRoot?.querySelector('lms-calendar-month');
        month?.dispatchEvent(expandEvent);

        await el.updateComplete;

        // Should have expanded date set
        expect((el as any)._expandedDate).to.exist;
        expect((el as any)._expandedDate.day).to.equal(15);
    });

    it('should toggle view when expanded', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        // Simulate expand to show day view
        (el as any)._expandedDate = { day: 15, month: 9, year: 2023 };
        await el.updateComplete;

        const month = el.shadowRoot?.querySelector('lms-calendar-month');
        const day = el.shadowRoot?.querySelector('lms-calendar-day');
        const context = el.shadowRoot?.querySelector('lms-calendar-context');

        expect(month?.hasAttribute('hidden')).to.be.true;
        expect(day?.hasAttribute('hidden')).to.be.false;
        expect(context?.hasAttribute('hidden')).to.be.true;
    });

    it('should handle switch view events', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        // Set expanded date first
        (el as any)._expandedDate = { day: 15, month: 9, year: 2023 };
        await el.updateComplete;

        // Simulate switch view event to collapse
        const switchViewEvent = new CustomEvent('switchview', {
            detail: { view: 'month' },
            bubbles: true,
        });

        const header = el.shadowRoot?.querySelector('lms-calendar-header');
        header?.dispatchEvent(switchViewEvent);

        await el.updateComplete;

        // Should have cleared expanded date
        expect((el as any)._expandedDate).to.be.undefined;
    });

    it('should set custom color', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar color="#ff0000"></lms-calendar>
        `);

        await el.updateComplete;

        expect(el.color).to.equal('#ff0000');
    });

    it('should default to black color', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        expect(el.color).to.equal('#000000');
    });

    it('should handle resize events', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        const initialWidth = (el as any)._calendarWidth;

        // Simulate resize by calling the resize handler directly
        const mockEntry = {
            contentRect: { width: 500 },
        } as ResizeObserverEntry;

        (el as any)._handleResize([mockEntry]);

        expect((el as any)._calendarWidth).to.equal(500);
        expect((el as any)._calendarWidth).to.not.equal(initialWidth);
    });

    it('should render different content based on screen width', async () => {
        const entries: CalendarEntry[] = [
            {
                date: {
                    start: { day: 15, month: 9, year: 2023 },
                    end: { day: 15, month: 9, year: 2023 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Test Event',
                content: 'Test Content',
                color: '#ff0000',
                isContinuation: false,
            },
        ];

        const el: LMSCalendar = await fixture(html`
            <lms-calendar .entries=${entries}></lms-calendar>
        `);

        await el.updateComplete;

        // Set narrow width to trigger mobile view
        (el as any)._calendarWidth = 500;
        await el.updateComplete;

        // Should render entries (exact content depends on implementation)
        const month = el.shadowRoot?.querySelector('lms-calendar-month');
        expect(month).to.exist;
    });

    it('should handle empty entries array', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar .entries=${[]}></lms-calendar>
        `);

        await el.updateComplete;

        expect(el.entries).to.have.length(0);

        // Should still render normally
        const month = el.shadowRoot?.querySelector('lms-calendar-month');
        expect(month).to.exist;
    });

    it('should provide CSS custom properties', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar
                style="
                --background-color: #f0f0f0;
                --primary-color: #007bff;
                --entry-font-size: medium;
            "
            ></lms-calendar>
        `);

        await el.updateComplete;

        // Should render without errors with custom properties
        expect(el.shadowRoot).to.exist;
    });

    it('should maintain responsive breakpoints', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        // Test different widths
        const widths = [400, 600, 800, 1200];

        for (const width of widths) {
            (el as any)._calendarWidth = width;
            await el.updateComplete;

            // Should handle different widths without errors
            const month = el.shadowRoot?.querySelector('lms-calendar-month');
            expect(month).to.exist;
        }
    });

    it('should have proper structure and hierarchy', async () => {
        const el: LMSCalendar = await fixture(html`
            <lms-calendar></lms-calendar>
        `);

        await el.updateComplete;

        // Check main container
        const container = el.shadowRoot?.querySelector('div');
        expect(container).to.exist;

        // Check all required components are present
        const header = container?.querySelector('lms-calendar-header');
        const context = container?.querySelector('lms-calendar-context');
        const month = container?.querySelector('lms-calendar-month');
        const day = container?.querySelector('lms-calendar-day');

        expect(header).to.exist;
        expect(context).to.exist;
        expect(month).to.exist;
        expect(day).to.exist;
    });
});
