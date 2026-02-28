import { expect, fixture, html } from '@open-wc/testing';
import '../../../src/components/Year.ts';
import type Year from '../../../src/components/Year.ts';

describe('Year Component', () => {
    describe('read-only (shared fixture, activeDate 2024-01-01)', () => {
        let el: Year;

        before(async () => {
            el = await fixture(html`
                <lms-calendar-year
                    .activeDate=${{ day: 1, month: 1, year: 2024 }}
                ></lms-calendar-year>
            `);
            await el.updateComplete;
        });

        it('should render year view correctly', function () {
            expect(el).to.exist;
            expect(el.shadowRoot).to.exist;
        });

        it('should render 12 mini-months', function () {
            const miniMonths = el.shadowRoot?.querySelectorAll('.mini-month');
            expect(miniMonths).to.have.length(12);
        });

        it('should show localized month labels', function () {
            const labels = el.shadowRoot?.querySelectorAll('.month-label');
            expect(labels).to.have.length(12);
            // First month label should contain January abbreviation
            expect(labels?.[0]?.textContent?.trim()).to.not.be.empty;
        });

        it('should render correct day numbers for January 2024', function () {
            // January 2024 has 31 days
            const janDayCells = el.shadowRoot?.querySelectorAll('[data-date^="2024-1-"]');
            expect(janDayCells).to.have.length(31);
        });
    });

    it('should highlight today', async () => {
        const today = new Date();
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{
                    day: today.getDate(),
                    month: today.getMonth() + 1,
                    year: today.getFullYear(),
                }}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        const currentCell = el.shadowRoot?.querySelector('.day-cell.current');
        expect(currentCell).to.exist;
        expect(currentCell?.textContent?.trim()).to.include(String(today.getDate()));
    });

    it('should show dot for days with events in dot mode', async () => {
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{ day: 1, month: 1, year: 2024 }}
                .densityMode=${'dot'}
                .entrySumByDay=${{ '2024-1-15': 3 }}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        const dayWithEvents = el.shadowRoot?.querySelector('[data-date="2024-1-15"]');
        expect(dayWithEvents).to.exist;
        expect(dayWithEvents?.classList.contains('has-events')).to.be.true;
    });

    it('should show density attribute in heatmap mode', async () => {
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{ day: 1, month: 1, year: 2024 }}
                .densityMode=${'heatmap'}
                .entrySumByDay=${{ '2024-1-15': 3, '2024-1-16': 10 }}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        const day15 = el.shadowRoot?.querySelector('[data-date="2024-1-15"]');
        expect(day15?.getAttribute('data-density')).to.equal('2'); // 3 events → bucket 2

        const day16 = el.shadowRoot?.querySelector('[data-date="2024-1-16"]');
        expect(day16?.getAttribute('data-density')).to.equal('4'); // 10 events → bucket 4
    });

    it('should show count in count mode', async () => {
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{ day: 1, month: 1, year: 2024 }}
                .densityMode=${'count'}
                .entrySumByDay=${{ '2024-1-15': 5 }}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        const day15 = el.shadowRoot?.querySelector('[data-date="2024-1-15"]');
        const countSpan = day15?.querySelector('.event-count');
        expect(countSpan).to.exist;
        expect(countSpan?.textContent?.trim()).to.equal('5');
    });

    it('should dispatch expand event on day click with drillTarget', async () => {
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{ day: 1, month: 1, year: 2024 }}
                .drillTarget=${'day'}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        let expandEvent: CustomEvent | null = null;
        el.addEventListener('expand', (e: Event) => {
            expandEvent = e as CustomEvent;
        });

        const jan15 = el.shadowRoot?.querySelector('[data-date="2024-1-15"]') as HTMLElement;
        expect(jan15).to.exist;
        jan15.click();

        expect(expandEvent).to.exist;
        expect(expandEvent!.detail.date).to.deep.equal({ year: 2024, month: 1, day: 15 });
        expect(expandEvent!.detail.drillTarget).to.equal('day');
    });

    it('should dispatch expand event on month label click with drillTarget month', async () => {
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{ day: 1, month: 1, year: 2024 }}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        let expandEvent: CustomEvent | null = null;
        el.addEventListener('expand', (e: Event) => {
            expandEvent = e as CustomEvent;
        });

        const monthLabels = el.shadowRoot?.querySelectorAll('.month-label');
        // Click March (index 2)
        (monthLabels?.[2] as HTMLElement)?.click();

        expect(expandEvent).to.exist;
        expect(expandEvent!.detail.date).to.deep.equal({ year: 2024, month: 3, day: 1 });
        expect(expandEvent!.detail.drillTarget).to.equal('month');
    });

    it('should handle February in leap year correctly', async () => {
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{ day: 1, month: 2, year: 2024 }}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        // February 2024 is a leap year → 29 days
        const febDays = el.shadowRoot?.querySelectorAll('[data-date^="2024-2-"]');
        expect(febDays).to.have.length(29);
    });

    it('should handle February in non-leap year correctly', async () => {
        const el: Year = await fixture(html`
            <lms-calendar-year
                .activeDate=${{ day: 1, month: 2, year: 2023 }}
            ></lms-calendar-year>
        `);

        await el.updateComplete;

        // February 2023 is not a leap year → 28 days
        const febDays = el.shadowRoot?.querySelectorAll('[data-date^="2023-2-"]');
        expect(febDays).to.have.length(28);
    });
});
