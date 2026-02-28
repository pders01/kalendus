import { expect, fixture, html } from '@open-wc/testing';
import '../../../src/components/Day.ts';
import type Day from '../../../src/components/Day.ts';

describe('Day Component', () => {
    it('should render day view correctly', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        expect(el).to.exist;
        expect(el.shadowRoot).to.exist;
    });

    it('should render 25 hours (0-24)', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        const hourElements = el.shadowRoot?.querySelectorAll('.hour');
        expect(hourElements).to.have.length(25); // 0-24 hours
    });

    it('should render hour indicators correctly', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        const indicators = el.shadowRoot?.querySelectorAll('.indicator');
        expect(indicators).to.have.length(25);

        // Check first hour (00:00)
        const firstHour = indicators?.[0];
        expect(firstHour?.textContent?.trim()).to.equal('00:00');

        // Check 10th hour (09:00)
        const tenthHour = indicators?.[9];
        expect(tenthHour?.textContent?.trim()).to.equal('09:00');

        // Check 11th hour (10:00) - no leading zero
        const eleventhHour = indicators?.[10];
        expect(eleventhHour?.textContent?.trim()).to.equal('10:00');

        // Check last hour (24:00)
        const lastHour = indicators?.[24];
        expect(lastHour?.textContent?.trim()).to.equal('24:00');
    });

    it('should render hour separators correctly', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        const separators = el.shadowRoot?.querySelectorAll('.separator');
        expect(separators).to.have.length(24); // No separator for first hour (index 0)
    });

    it('should render all-day slot', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day .allDayRowCount=${1}></lms-calendar-day>
        `);

        await el.updateComplete;

        const allDaySlot = el.shadowRoot?.querySelector('slot[name="all-day"]');
        expect(allDaySlot).to.exist;
        expect(allDaySlot?.id).to.equal('all-day');
    });

    it('should render hour slots for each hour', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        // Check that we have slots for hours 0-24
        for (let hour = 0; hour <= 24; hour++) {
            const hourSlot = el.shadowRoot?.querySelector(
                `slot[name="${hour}"]`,
            );
            expect(hourSlot).to.exist;
        }
    });

    it('should start with sidebar hidden', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        const sidebar = el.shadowRoot?.querySelector('.sidebar');
        expect(sidebar).to.have.attribute('hidden');

        const main = el.shadowRoot?.querySelector('.main');
        expect(main).to.have.class('w-100');
        expect(main).to.not.have.class('w-70');
    });

    it('should show sidebar when _hasActiveSidebar is true', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        // Simulate sidebar activation
        (el as unknown as { _hasActiveSidebar: boolean })._hasActiveSidebar =
            true;
        await el.updateComplete;

        const sidebar = el.shadowRoot?.querySelector('.sidebar');
        expect(sidebar).to.not.have.attribute('hidden');

        const main = el.shadowRoot?.querySelector('.main');
        expect(main).to.have.class('w-70');
        expect(main).to.not.have.class('w-100');
    });

    it('should handle slot changes for all-day events', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day .allDayRowCount=${2}>
                <div slot="all-day">All day event 1</div>
                <div slot="all-day">All day event 2</div>
            </lms-calendar-day>
        `);

        await el.updateComplete;

        const container = el.shadowRoot?.querySelector(
            '.container',
        ) as HTMLDivElement;
        expect(container).to.exist;

        // Container height should be adjusted based on all-day events
        // Should be: calc(100% - 3.5em - 48px) for 2 events (2 * 24px)
        expect(container.style.height).to.include('48px');
    });

    it('should render grid with correct number of rows', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        const main = el.shadowRoot?.querySelector('.main');
        const computedStyle = window.getComputedStyle(main as Element);

        // Should have 1440 grid rows (24 hours * 60 minutes)
        // The computed style will show 'repeat(1440, 1fr)' as individual values
        const rowCount = computedStyle.gridTemplateRows.split(' ').length;
        expect(rowCount).to.equal(1440);
    });

    it('should calculate correct grid positions for hour indicators', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        const hourElements = el.shadowRoot?.querySelectorAll('.hour');

        // Check first hour (hour 0) - should span rows 1-60
        const firstHour = hourElements?.[0] as HTMLElement;
        expect(firstHour.style.gridRow.replace(/\s/g, '')).to.equal('1/60');

        // Check hour 1 - should span rows 61-120
        const secondHour = hourElements?.[1] as HTMLElement;
        expect(secondHour.style.gridRow.replace(/\s/g, '')).to.equal('61/120');

        // Check last hour (hour 24) - should be at row 1440
        const lastHour = hourElements?.[24] as HTMLElement;
        expect(lastHour.style.gridRow).to.equal('1440');
    });

    it('should position separators correctly', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        const separators = el.shadowRoot?.querySelectorAll('.separator');

        // First separator (for hour 1) should be at row 60
        const firstSeparator = separators?.[0] as HTMLElement;
        expect(firstSeparator.style.gridRow).to.equal('60');

        // Second separator (for hour 2) should be at row 120
        const secondSeparator = separators?.[1] as HTMLElement;
        expect(secondSeparator.style.gridRow).to.equal('120');
    });

    it('should have correct CSS classes and structure', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day .allDayRowCount=${1}></lms-calendar-day>
        `);

        await el.updateComplete;

        // Check all-day section
        const allDay = el.shadowRoot?.querySelector('.all-day');
        expect(allDay).to.exist;

        // Check container
        const container = el.shadowRoot?.querySelector('.container');
        expect(container).to.exist;

        // Check main grid
        const main = el.shadowRoot?.querySelector('.main');
        expect(main).to.exist;

        // Check sidebar
        const sidebar = el.shadowRoot?.querySelector('.sidebar');
        expect(sidebar).to.exist;
        expect(sidebar).to.have.class('w-30');
    });

    it('should handle empty slots gracefully', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day></lms-calendar-day>
        `);

        await el.updateComplete;

        // All slots should exist even when empty (no all-day slot when allDayRowCount=0)
        const allSlots = el.shadowRoot?.querySelectorAll('slot');
        expect(allSlots).to.have.length(25); // 25 hour slots (all-day omitted when count=0)
    });

    it('should support custom CSS properties', async () => {
        const el: Day = await fixture(html`
            <lms-calendar-day
                style="
                --day-header-height: 4em;
                --day-gap: 2px;
                --day-padding: 1em;
            "
            ></lms-calendar-day>
        `);

        await el.updateComplete;

        const container = el.shadowRoot?.querySelector('.container');
        const main = el.shadowRoot?.querySelector('.main');

        expect(container).to.exist;
        expect(main).to.exist;
    });
});
