import { expect, fixture, html, nextFrame } from '@open-wc/testing';

import '../../../src/components/Week.ts';
import '../../../src/components/Day.ts';
import '../../../src/components/Entry.ts';
import type Day from '../../../src/components/Day.ts';
import type Week from '../../../src/components/Week.ts';
const date = { year: 2026, month: 3, day: 10 };
const interval = { start: date, end: date };
const settle = async () => {
    await nextFrame();
    await nextFrame();
    await nextFrame();
};

describe('Time-grid lifecycle and actual row geometry', () => {
    for (const view of ['day', 'week'] as const) {
        it(`${view} reacquires size observations after remove/reappend and actual resizing`, async () => {
            const container = await fixture<HTMLDivElement>(
                html`
                    <div style="height: 600px; width: 900px"></div>
                `,
            );
            const element = document.createElement(`lms-calendar-${view}`) as Day | Week;
            element.style.cssText =
                '--view-container-height:100%;--day-header-height:40px;--calendar-grid-columns-week:60px repeat(7,minmax(0,1fr));--calendar-grid-columns-day:60px 1fr';
            container.append(element);
            await element.updateComplete;
            await settle();
            expect(parseFloat(element.style.getPropertyValue('--minute-height'))).to.be.closeTo(
                560 / 720,
                0.01,
            );
            element.remove();
            container.style.height = '800px';
            container.append(element);
            await settle();
            expect(parseFloat(element.style.getPropertyValue('--minute-height'))).to.be.closeTo(
                760 / 720,
                0.01,
            );
            container.style.height = '500px';
            await settle();
            expect(parseFloat(element.style.getPropertyValue('--minute-height'))).to.be.closeTo(
                44 / 60,
                0.01,
            );
            expect(parseFloat(element.style.getPropertyValue('--hour-height'))).to.be.closeTo(
                44,
                0.01,
            );
            expect(parseFloat(element.style.getPropertyValue('--half-day-height'))).to.be.closeTo(
                528,
                0.01,
            );
            expect(parseFloat(element.style.getPropertyValue('--day-total-height'))).to.be.closeTo(
                1056,
                0.01,
            );
        });
    }
    it('keeps the Tuesday–Wednesday row gap instead of compressing B upward when A ends', async () => {
        const el =
            await fixture<Week>(html`<lms-calendar-week .activeDate=${date} .allDayRowCount=${2}
            style="height:600px;width:900px;--calendar-grid-columns-week:60px repeat(7,minmax(0,1fr));--day-header-height:40px">
            <lms-calendar-entry heading="A" .date=${interval} slot="all-day-2026-3-10" style="--all-day-row:0;order:0"></lms-calendar-entry>
            <lms-calendar-entry heading="B Tue" .date=${interval} slot="all-day-2026-3-10" style="--all-day-row:1;order:1"></lms-calendar-entry>
            <lms-calendar-entry heading="B Wed" .date=${interval} slot="all-day-2026-3-11" style="--all-day-row:1;order:1"></lms-calendar-entry>
        </lms-calendar-week>`);
        await settle();
        const entries = el.querySelectorAll<HTMLElement>('lms-calendar-entry');
        expect(entries[1].getBoundingClientRect().top).to.be.closeTo(
            entries[2].getBoundingClientRect().top,
            0.5,
        );
        expect(
            entries[1].getBoundingClientRect().top - entries[0].getBoundingClientRect().top,
        ).to.be.at.least(24);
        expect(entries[2].getBoundingClientRect().height).to.be.at.least(24);
    });
    it('bounds the all-day band, preserves its scroll access, and leaves the timed grid usable', async () => {
        const el =
            await fixture<Day>(html`<lms-calendar-day .activeDate=${date} .allDayRowCount=${20}
            style="height:600px;width:900px;--calendar-grid-columns-day:60px 1fr;--day-header-height:40px">
            ${Array.from({ length: 20 }, (_, row) => html`<lms-calendar-entry heading=${`All day ${row}`} .date=${interval} slot="all-day" style=${`--all-day-row:${row}`}></lms-calendar-entry>`)}
        </lms-calendar-day>`);
        await settle();
        const band = el.shadowRoot!.querySelector<HTMLElement>('.all-day-wrapper')!;
        const schedule = el.shadowRoot!.querySelector<HTMLElement>('.container')!;
        expect(band.getBoundingClientRect().height).to.be.at.most(211);
        expect(band.scrollHeight).to.be.greaterThan(band.clientHeight);
        expect(band.tabIndex).to.equal(0);
        expect(schedule.getBoundingClientRect().height).to.be.greaterThan(300);
        const last = el.querySelector<HTMLElement>('lms-calendar-entry:last-child')!;
        last.focus();
        last.scrollIntoView({ block: 'nearest' });
        await settle();
        expect(band.scrollTop).to.be.greaterThan(0);
        expect(last.getBoundingClientRect().bottom).to.be.at.most(
            band.getBoundingClientRect().bottom + 1,
        );
    });
    it('retains legacy order-only row placement as an explicit geometric fallback', async () => {
        const el =
            await fixture<Day>(html`<lms-calendar-day .allDayRowCount=${3} style="height:600px;width:900px">
            <lms-calendar-entry slot="all-day" heading="First" style="order:0"></lms-calendar-entry>
            <lms-calendar-entry slot="all-day" heading="Third" style="order:2"></lms-calendar-entry>
        </lms-calendar-day>`);
        await settle();
        const [first, third] = Array.from(el.querySelectorAll<HTMLElement>('lms-calendar-entry'));
        expect(third.getBoundingClientRect().top - first.getBoundingClientRect().top).to.be.closeTo(
            56,
            1,
        );
    });
});
