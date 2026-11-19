import { expect, fixture, html } from '@open-wc/testing';

import '../../../src/components/Day.ts';
import type Day from '../../../src/components/Day.ts';

describe('Day Component', () => {
    describe('default fixture', () => {
        let el: Day;

        before(async () => {
            el = await fixture(html`
                <lms-calendar-day></lms-calendar-day>
            `);
        });

        it('should render day view correctly', () => {
            expect(el).to.exist;
            expect(el.shadowRoot).to.exist;
        });

        it('should render 25 hour labels (0-24)', () => {
            const hourElements = el.shadowRoot?.querySelectorAll('.hour-label');
            expect(hourElements).to.have.length(25);
        });

        it('should render timed-content with gradient separators', () => {
            const timedContent = el.shadowRoot?.querySelector('.timed-content');
            expect(timedContent).to.exist;

            // No longer has DOM separator elements — uses CSS gradient instead
            const separators = el.shadowRoot?.querySelectorAll('.separator');
            expect(separators).to.have.length(0);
        });

        it('should render a single timed slot', () => {
            // Should have a single "timed" slot instead of per-hour slots
            const timedSlot = el.shadowRoot?.querySelector('slot[name="timed"]');
            expect(timedSlot).to.exist;
        });

        it('should start with sidebar hidden', () => {
            const sidebar = el.shadowRoot?.querySelector('.sidebar');
            expect(sidebar).to.have.attribute('hidden');

            const main = el.shadowRoot?.querySelector('.main');
            expect(main).to.have.class('w-100');
            expect(main).to.not.have.class('w-70');
        });

        it('should handle empty slots gracefully', () => {
            // Should have 1 timed slot when allDayRowCount=0 (no all-day slot)
            const allSlots = el.shadowRoot?.querySelectorAll('slot');
            expect(allSlots).to.have.length(1); // just slot[name="timed"]
        });

        it('should use single-row grid with timed-content container', () => {
            const main = el.shadowRoot?.querySelector('.main');
            expect(main).to.exist;

            // Should have timed-content column
            const timedContent = el.shadowRoot?.querySelector('.timed-content');
            expect(timedContent).to.exist;

            // Should have time-labels column
            const timeLabels = el.shadowRoot?.querySelector('.time-labels');
            expect(timeLabels).to.exist;
        });

        it('should position hour labels with absolute top offsets', () => {
            const hourLabels = el.shadowRoot?.querySelectorAll('.hour-label');

            // Check first hour (hour 0) - should be at top: calc(0 * var(--hour-height))
            const firstHour = hourLabels?.[0] as HTMLElement;
            expect(firstHour.style.top).to.equal('calc(0 * var(--hour-height))');

            // Check hour 1 - should be at top: calc(1 * var(--hour-height))
            const secondHour = hourLabels?.[1] as HTMLElement;
            expect(secondHour.style.top).to.equal('calc(1 * var(--hour-height))');

            // Check last hour (hour 24) - should be at top: calc(24 * var(--hour-height))
            const lastHour = hourLabels?.[24] as HTMLElement;
            expect(lastHour.style.top).to.equal('calc(24 * var(--hour-height))');
        });
    });

    describe('all-day fixture', () => {
        let el: Day;

        before(async () => {
            el = await fixture(html`
                <lms-calendar-day .allDayRowCount=${1}></lms-calendar-day>
            `);
        });

        it('should render all-day slot', () => {
            const allDaySlot = el.shadowRoot?.querySelector('slot[name="all-day"]');
            expect(allDaySlot).to.exist;
            expect(allDaySlot?.id).to.equal('all-day');
        });

        it('should have 2 slots when allDayRowCount > 0', () => {
            const allSlots = el.shadowRoot?.querySelectorAll('slot');
            expect(allSlots).to.have.length(2); // slot[name="all-day"] + slot[name="timed"]
        });

        it('should have correct CSS classes and structure', () => {
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
    });

    describe('separate fixtures', () => {
        for (const [activeDate, weekday] of [
            [{ year: 1, month: 1, day: 1 }, 'Mon'],
            // The browser's Pacific/Apia time zone skipped this civil Friday.
            [{ year: 2011, month: 12, day: 30 }, 'Fri'],
        ] as const) {
            it(`labels ${activeDate.year}-${activeDate.month}-${activeDate.day} as ${weekday} regardless of the browser time zone`, async () => {
                const el = await fixture<Day>(html`
                    <lms-calendar-day .activeDate=${activeDate}></lms-calendar-day>
                `);
                expect(el.shadowRoot!.querySelector('.day-name')!.textContent).to.equal(weekday);
            });
        }

        it('should render hour indicators correctly', async () => {
            const el: Day = await fixture(html`
                <lms-calendar-day locale="de"></lms-calendar-day>
            `);

            await el.updateComplete;

            const indicators = el.shadowRoot?.querySelectorAll('.hour-label .indicator');
            expect(indicators).to.have.length(25);
            indicators!.forEach((label, hour) => {
                // Intl may zero-pad German hours even when `hour` is numeric.
                const clockHour = String(hour % 24);
                expect(label.textContent?.trim(), `hour ${hour}`).to.be.oneOf([
                    `${clockHour}:00`,
                    `${clockHour.padStart(2, '0')}:00`,
                ]);
            });
        });

        it('should show sidebar when _hasActiveSidebar is true', async () => {
            const el: Day = await fixture(html`
                <lms-calendar-day></lms-calendar-day>
            `);

            // Simulate sidebar activation
            (el as unknown as { _hasActiveSidebar: boolean })._hasActiveSidebar = true;
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

            const container = el.shadowRoot?.querySelector('.container') as HTMLDivElement;
            expect(container).to.exist;

            // Container uses flex: 1 to fill remaining space after all-day section.
            // The all-day-wrapper should be present when allDayRowCount > 0.
            const allDayWrapper = el.shadowRoot?.querySelector('.all-day-wrapper');
            expect(allDayWrapper).to.exist;
        });

        it('should support custom CSS properties', async () => {
            const el: Day = await fixture(html`
                <lms-calendar-day
                    style="--day-header-height: 4em; --day-gap: 2px; --day-padding: 1em"
                ></lms-calendar-day>
            `);

            await el.updateComplete;

            const container = el.shadowRoot?.querySelector('.container');
            const main = el.shadowRoot?.querySelector('.main');

            expect(container).to.exist;
            expect(main).to.exist;
        });
    });
});
