import { expect, fixture, html } from '@open-wc/testing';
import '../../../src/components/Menu.ts';
import type { Menu } from '../../../src/components/Menu.ts';

// Mock types for testing
type CalendarDate = {
    day: number;
    month: number;
    year: number;
};

interface EventDetails {
    heading: string;
    content: string;
    time: string;
    date?: CalendarDate;
}

describe('Menu Component', () => {
    it('should render menu correctly', async () => {
        const el: Menu = await fixture(html` <lms-menu></lms-menu> `);

        expect(el).to.exist;
        expect(el.shadowRoot).to.exist;
    });

    it('should be hidden by default when open is false', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${false}></lms-menu>
        `);

        await el.updateComplete;

        const container = el.shadowRoot?.querySelector('div');
        expect(container?.hasAttribute('hidden')).to.be.true;
    });

    it('should be visible when open is true', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        const container = el.shadowRoot?.querySelector('div');
        expect(container?.hasAttribute('hidden')).to.be.false;
    });

    it('should display event details correctly', async () => {
        const eventDetails: EventDetails = {
            heading: 'Team Meeting',
            content: 'Discuss project status',
            time: '09:00 - 10:00',
            date: { day: 15, month: 9, year: 2023 },
        };

        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .eventDetails=${eventDetails}> </lms-menu>
        `);

        await el.updateComplete;

        const content = el.shadowRoot?.querySelector('.content');
        expect(content?.textContent).to.include('Team Meeting');
        expect(content?.textContent).to.include('Discuss project status');
        expect(content?.textContent).to.include('09:00 - 10:00');
        expect(content?.textContent).to.include('15/9/2023');
    });

    it('should display event details without date', async () => {
        const eventDetails: EventDetails = {
            heading: 'No Date Event',
            content: 'Event without date',
            time: '14:00 - 15:00',
        };

        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .eventDetails=${eventDetails}> </lms-menu>
        `);

        await el.updateComplete;

        const content = el.shadowRoot?.querySelector('.content');
        expect(content?.textContent).to.include('No Date Event');
        expect(content?.textContent).to.include('Event without date');
        expect(content?.textContent).to.include('14:00 - 15:00');
        expect(content?.textContent).to.not.include('Date:');
    });

    it('should have minimize functionality', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        // Initially not minimized
        expect(el.minimized).to.be.false;

        const minimizeButton = el.shadowRoot?.querySelector(
            '.header button[title="Minimize"]',
        ) as HTMLButtonElement;
        expect(minimizeButton).to.exist;

        // Click minimize button
        minimizeButton.click();
        await el.updateComplete;

        expect(el.minimized).to.be.true;

        // Content should be hidden when minimized
        const content = el.shadowRoot?.querySelector('.content');
        expect(content?.hasAttribute('hidden')).to.be.true;
    });

    it('should toggle minimize state', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        const minimizeButton = el.shadowRoot?.querySelector(
            '.header button[title="Minimize"]',
        ) as HTMLButtonElement;

        // First click - minimize
        minimizeButton.click();
        await el.updateComplete;
        expect(el.minimized).to.be.true;

        // Second click - restore
        minimizeButton.click();
        await el.updateComplete;
        expect(el.minimized).to.be.false;

        // Content should be visible again
        const content = el.shadowRoot?.querySelector('.content');
        expect(content?.hasAttribute('hidden')).to.be.false;
    });

    it('should have close functionality', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        let eventFired = false;
        el.addEventListener('menu-close', () => {
            eventFired = true;
        });

        const closeButton = el.shadowRoot?.querySelector(
            '.header button[title="Close"]',
        ) as HTMLButtonElement;
        expect(closeButton).to.exist;

        // Click close button
        closeButton.click();
        await el.updateComplete;

        expect(el.open).to.be.false;
        expect(el.minimized).to.be.false;
        expect(eventFired).to.be.true;
    });

    it('should render minimize button icon correctly', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        const minimizeButton = el.shadowRoot?.querySelector(
            '.header button[title="Minimize"]',
        ) as HTMLButtonElement;

        // Initially not minimized - should show minimize icon
        expect(minimizeButton.textContent?.trim()).to.equal('🗕');

        // After minimizing - should show restore icon
        minimizeButton.click();
        await el.updateComplete;
        expect(minimizeButton.textContent?.trim()).to.equal('🗖');
    });

    it('should have draggable header', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        const header = el.shadowRoot?.querySelector('.header') as HTMLElement;
        expect(header).to.exist;

        // Check computed style instead of inline style
        const computedStyle = window.getComputedStyle(header);
        expect(computedStyle.cursor).to.equal('grab');
        expect(header.getAttribute('title')).to.equal('Drag to move menu');
    });

    it('should display export functionality', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        const exportItem = el.shadowRoot?.querySelector(
            '.menu-item',
        ) as HTMLElement;
        expect(exportItem).to.exist;
        expect(exportItem.textContent?.trim()).to.equal('Export as ICS');
        expect(exportItem.getAttribute('title')).to.equal('Export as ICS');
    });

    it('should have proper CSS classes and structure', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true}></lms-menu>
        `);

        await el.updateComplete;

        // Check header structure
        const header = el.shadowRoot?.querySelector('.header');
        expect(header).to.exist;

        const title = header?.querySelector('.title');
        expect(title).to.exist;
        expect(title?.textContent?.trim()).to.equal('Event Details');

        // Check buttons
        const buttons = header?.querySelectorAll('button');
        expect(buttons).to.have.length(2);

        // Check content
        const content = el.shadowRoot?.querySelector('.content');
        expect(content).to.exist;
    });

    it('should support CSS custom properties', async () => {
        const el: Menu = await fixture(html`
            <lms-menu
                ?open=${true}
                style="
                    --menu-bg: #f0f0f0;
                    --menu-header-bg: #e0e0e0;
                "
            >
            </lms-menu>
        `);

        await el.updateComplete;

        const header = el.shadowRoot?.querySelector('.header');
        const content = el.shadowRoot?.querySelector('.content');

        expect(header).to.exist;
        expect(content).to.exist;
    });

    it('should handle empty event details gracefully', async () => {
        const eventDetails: EventDetails = {
            heading: '',
            content: '',
            time: '',
        };

        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .eventDetails=${eventDetails}> </lms-menu>
        `);

        await el.updateComplete;

        const content = el.shadowRoot?.querySelector('.content');
        expect(content).to.exist;

        // Should still render the structure even with empty details
        expect(content?.textContent).to.include('Title:');
        expect(content?.textContent).to.include('Time:');
        // Content/Notes should not appear when empty
        expect(content?.textContent).to.not.include('Notes:');
    });
});
