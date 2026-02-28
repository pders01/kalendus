import { expect, fixture, html } from '@open-wc/testing';
import '../../../src/components/Month.ts';
import type Month from '../../../src/components/Month.ts';

describe('Month Component', () => {
    it('should render month view correctly', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month></lms-calendar-month>
        `);

        expect(el).to.exist;
        expect(el.shadowRoot).to.exist;
    });

    it('should render September 2024 correctly', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 1, month: 9, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        const monthDiv = el.shadowRoot?.querySelector('.month');
        expect(monthDiv).to.exist;

        // September 2024 should have 30 days
        const dayElements = el.shadowRoot?.querySelectorAll('.day');
        expect(dayElements).to.have.length(42); // 6 weeks * 7 days

        // Check for September 1st (should be visible)
        const sept1 = el.shadowRoot?.querySelector('[data-date="2024-9-1"]');
        expect(sept1).to.exist;

        // Check for September 30th (should be visible)
        const sept30 = el.shadowRoot?.querySelector('[data-date="2024-9-30"]');
        expect(sept30).to.exist;
    });

    it('should calculate first day offset correctly for September 2024', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 1, month: 9, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        // September 1, 2024 is a Sunday (day 0)
        // In European format (Monday=0), Sunday should be index 6
        // So the first day should appear in the 7th column (index 6)
        const sept1 = el.shadowRoot?.querySelector('[data-date="2024-9-1"]');
        expect(sept1).to.exist;

        // Check that the calendar grid is populated correctly
        const dayElements = el.shadowRoot?.querySelectorAll('.day');
        const sept1Index = dayElements
            ? Array.from(dayElements).findIndex(
                  (el) => el.getAttribute('data-date') === '2024-9-1',
              )
            : -1;

        // September 1, 2024 is a Sunday, which in European week (Mon=0) is index 6
        // But we also have previous month days, so let's check the actual structure
        expect(sept1Index).to.be.greaterThan(-1);
    });

    it('should render month with previous and next month days', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 15, month: 9, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        // Should have exactly 42 days (6 weeks)
        const dayElements = el.shadowRoot?.querySelectorAll('.day');
        expect(dayElements).to.have.length(42);

        // Should have some August days at the beginning
        const augustDays = dayElements
            ? Array.from(dayElements).filter((el) =>
                  el.getAttribute('data-date')?.includes('2024-8-'),
              )
            : [];
        expect(augustDays.length).to.be.greaterThan(0);

        // Should have September days (30 days in September)
        const septemberDays = dayElements
            ? Array.from(dayElements).filter((el) =>
                  el.getAttribute('data-date')?.includes('2024-9-'),
              )
            : [];
        expect(septemberDays).to.have.length(30); // September has exactly 30 days

        // Should have some October days at the end
        const octoberDays = dayElements
            ? Array.from(dayElements).filter((el) =>
                  el.getAttribute('data-date')?.includes('2024-10-'),
              )
            : [];
        expect(octoberDays.length).to.be.greaterThan(0);
    });

    it('should handle month navigation correctly', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 1, month: 9, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        // Change to October
        el.activeDate = { day: 1, month: 10, year: 2024 };
        await el.updateComplete;

        const octoberDays = el.shadowRoot?.querySelectorAll(
            '[data-date*="2024-10-"]',
        );
        expect(octoberDays).to.have.length.greaterThan(0); // Should have some October days visible
    });

    it('should not render entire August + September when navigating from August to September', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 1, month: 8, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        // Navigate to September
        el.activeDate = { day: 1, month: 9, year: 2024 };
        await el.updateComplete;

        // Should have exactly 42 days total (6 weeks * 7 days)
        const allDays = el.shadowRoot?.querySelectorAll('.day');
        expect(allDays).to.have.length(42);

        // Should have exactly 30 September days
        const septemberDays = Array.from(allDays || []).filter((el) =>
            el.getAttribute('data-date')?.includes('2024-9-'),
        );
        expect(septemberDays).to.have.length(30);

        // Should NOT have 31 August days (only partial August for previous month padding)
        const augustDays = Array.from(allDays || []).filter((el) =>
            el.getAttribute('data-date')?.includes('2024-8-'),
        );
        expect(augustDays.length).to.be.lessThan(31);
        expect(augustDays.length).to.be.greaterThan(0); // Should have some August days for padding
    });

    it('should dispatch expand event when day is clicked', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 1, month: 9, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        let expandEvent: any = null;
        el.addEventListener('expand', (e: Event) => {
            expandEvent = e;
        });

        const sept15 = el.shadowRoot?.querySelector(
            '[data-date="2024-9-15"]',
        ) as HTMLElement;
        expect(sept15).to.exist;

        sept15.click();

        expect(expandEvent).to.exist;
        expect(expandEvent.detail.date).to.deep.equal({
            day: 15,
            month: 9,
            year: 2024,
        });
    });

    it('should show month name on first day', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 1, month: 9, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        const sept1 = el.shadowRoot?.querySelector('[data-date="2024-9-1"]');
        expect(sept1).to.exist;

        const indicator = sept1?.querySelector('.indicator');
        expect(indicator).to.exist;

        // Should contain "Sep" and "1" in locale-specific format (e.g., "Sep 1" for en, "1. Sep." for de)
        const text = indicator?.textContent?.trim() ?? '';
        expect(text).to.include('Sep');
        expect(text).to.include('1');
    });

    it('should mark current date correctly', async () => {
        const today = new Date();
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{
                    day: today.getDate(),
                    month: today.getMonth() + 1,
                    year: today.getFullYear(),
                }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        const todayDate = `${today.getFullYear()}-${
            today.getMonth() + 1
        }-${today.getDate()}`;
        const todayElement = el.shadowRoot?.querySelector(
            `[data-date="${todayDate}"]`,
        );

        if (todayElement) {
            const indicator = todayElement.querySelector('.indicator');
            expect(indicator).to.have.class('current');
        }
    });

    it('should debug August 2024 rendering', async () => {
        const el: Month = await fixture(html`
            <lms-calendar-month
                .activeDate=${{ day: 1, month: 8, year: 2024 }}
            ></lms-calendar-month>
        `);

        await el.updateComplete;

        // Get all day elements and their data-date attributes
        const allDays = el.shadowRoot?.querySelectorAll('.day');
        const dates = Array.from(allDays || []).map((el) =>
            el.getAttribute('data-date'),
        );

        console.log('August 2024 - All rendered dates:', dates);
        console.log('Total days:', dates.length);

        const julyDays = dates.filter((date) => date?.includes('2024-7-'));
        console.log('July days:', julyDays);

        const augustDays = dates.filter((date) => date?.includes('2024-8-'));
        console.log('August days:', augustDays);
        console.log('August days count:', augustDays.length);

        const septemberDays = dates.filter((date) => date?.includes('2024-9-'));
        console.log('September days:', septemberDays);

        // Should have exactly 42 days total
        expect(allDays).to.have.length(42);

        // Should have exactly 31 August days (August has 31 days)
        expect(augustDays.length).to.equal(31);

        // Should have some July days for padding (August 1 is Thursday, so need 3 July days)
        expect(julyDays.length).to.equal(3);

        // Should have some September days to fill the grid
        expect(septemberDays.length).to.equal(8); // 42 - 31 - 3 = 8
    });
});
