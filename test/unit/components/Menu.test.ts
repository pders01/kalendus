import { expect, fixture, html } from '@open-wc/testing';
import '../../../src/components/Menu.ts';
import type { Menu } from '../../../src/components/Menu.ts';

type CalendarDate = {
    day: number;
    month: number;
    year: number;
};

interface EventDetails {
    heading: string;
    content: string;
    displayTime: string;
    date?: CalendarDate;
}

describe('Menu Component', () => {
    describe('open menu', () => {
        let el: Menu;

        before(async () => {
            el = await fixture(html`<lms-menu ?open=${true}></lms-menu>`);
        });

        it('should be visible when open is true', () => {
            expect(el.hasAttribute('open')).to.be.true;
        });

        it('should have role="dialog" with aria-modal on the card', () => {
            const card = el.shadowRoot?.querySelector('.card');
            expect(card).to.exist;
            expect(card?.getAttribute('role')).to.equal('dialog');
            expect(card?.getAttribute('aria-modal')).to.equal('true');
            expect(card?.getAttribute('aria-label')).to.equal('Event Details');
        });

        it('should display export button', () => {
            const exportBtn = el.shadowRoot?.querySelector('.export-btn') as HTMLButtonElement;
            expect(exportBtn).to.exist;
            expect(exportBtn.textContent?.trim()).to.equal('Export as ICS');
        });

        it('should have proper card structure', () => {
            const card = el.shadowRoot?.querySelector('.card');
            expect(card).to.exist;

            const header = card?.querySelector('.header');
            expect(header).to.exist;

            const title = header?.querySelector('.title');
            expect(title).to.exist;

            // Single close button
            const buttons = header?.querySelectorAll('button');
            expect(buttons).to.have.length(1);

            const actions = card?.querySelector('.actions');
            expect(actions).to.exist;
        });
    });

    it('should render menu correctly', async () => {
        const el: Menu = await fixture(html`<lms-menu></lms-menu>`);

        expect(el).to.exist;
        expect(el.shadowRoot).to.exist;
    });

    it('should be hidden by default when open is false', async () => {
        const el: Menu = await fixture(html`
            <lms-menu ?open=${false}></lms-menu>
        `);
        await el.updateComplete;

        // Host should not have the open attribute
        expect(el.hasAttribute('open')).to.be.false;
        // Host display should be none (via :host styles)
        const style = getComputedStyle(el);
        expect(style.display).to.equal('none');
    });

    it('should display event details correctly', async () => {
        const eventDetails: EventDetails = {
            heading: 'Team Meeting',
            content: 'Discuss project status',
            displayTime: '09:00 - 10:00',
            date: { day: 15, month: 9, year: 2023 },
        };

        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .eventDetails=${eventDetails}></lms-menu>
        `);
        await el.updateComplete;

        const title = el.shadowRoot?.querySelector('.title');
        expect(title?.textContent?.trim()).to.equal('Team Meeting');

        const metas = el.shadowRoot?.querySelectorAll('.meta');
        expect(metas).to.have.length(2);
        expect(metas?.[0].textContent?.trim()).to.equal('09:00 - 10:00');
        // Date meta contains formatted date
        expect(metas?.[1].textContent?.trim()).to.include('2023');

        const notes = el.shadowRoot?.querySelector('.notes');
        expect(notes).to.exist;
        expect(notes?.textContent?.trim()).to.equal('Discuss project status');
    });

    it('should display event details without date', async () => {
        const eventDetails: EventDetails = {
            heading: 'No Date Event',
            content: 'Event without date',
            displayTime: '14:00 - 15:00',
        };

        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .eventDetails=${eventDetails}></lms-menu>
        `);
        await el.updateComplete;

        const title = el.shadowRoot?.querySelector('.title');
        expect(title?.textContent?.trim()).to.equal('No Date Event');

        // Only one .meta element (time), no date meta
        const metas = el.shadowRoot?.querySelectorAll('.meta');
        expect(metas).to.have.length(1);
        expect(metas?.[0].textContent?.trim()).to.equal('14:00 - 15:00');
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

        const closeButton = el.shadowRoot?.querySelector('.close-btn') as HTMLButtonElement;
        expect(closeButton).to.exist;

        closeButton.click();
        await el.updateComplete;

        expect(el.open).to.be.false;
        expect(eventFired).to.be.true;
    });

    it('should not show notes when content is empty', async () => {
        const eventDetails: EventDetails = {
            heading: 'Quick Event',
            content: '',
            displayTime: '10:00 - 11:00',
        };

        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .eventDetails=${eventDetails}></lms-menu>
        `);
        await el.updateComplete;

        const notes = el.shadowRoot?.querySelector('.notes');
        expect(notes).to.be.null;
    });

    it('should accept anchorRect property', async () => {
        const rect = new DOMRect(100, 200, 150, 30);
        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .anchorRect=${rect}></lms-menu>
        `);
        await el.updateComplete;

        expect(el.anchorRect).to.equal(rect);
    });

    it('should support CSS custom properties', async () => {
        const el: Menu = await fixture(html`
            <lms-menu
                ?open=${true}
                style="--background-color: #f0f0f0;"
            ></lms-menu>
        `);
        await el.updateComplete;

        const card = el.shadowRoot?.querySelector('.card');
        expect(card).to.exist;
    });

    it('should handle empty event details gracefully', async () => {
        const eventDetails: EventDetails = {
            heading: '',
            content: '',
            displayTime: '',
        };

        const el: Menu = await fixture(html`
            <lms-menu ?open=${true} .eventDetails=${eventDetails}></lms-menu>
        `);
        await el.updateComplete;

        const title = el.shadowRoot?.querySelector('.title');
        expect(title).to.exist;
        // Should show fallback "No Title"
        expect(title?.textContent?.trim()).to.equal('No Title');
    });
});
