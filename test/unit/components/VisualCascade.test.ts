import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';

import '../../../src/lms-calendar.ts';
import type Entry from '../../../src/components/Entry.ts';
import type Calendar from '../../../src/lms-calendar.ts';

const date = { year: 2026, month: 6, day: 15 };
const time = (minutes: number) => ({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
const event = (id: string, start: number, end: number): CalendarEntry => ({
    id,
    heading: id,
    date: { start: date, end: date },
    time: { start: time(start), end: time(end) },
});

describe('Cascade rendered overlap', () => {
    it('keeps later headings hit-testable above earlier foreground cards, with opaque readable surfaces', async () => {
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .viewMode=${'day'} .activeDate=${date} .entries=${[event('background', 540, 840), event('early', 540, 570), event('persistent', 550, 720), event('late', 580, 630)]} style="width:900px;height:760px"></lms-calendar>`,
        );
        await waitUntil(
            () => calendar.shadowRoot!.querySelectorAll('lms-calendar-entry').length === 4,
        );
        const day = calendar.shadowRoot!.querySelector('lms-calendar-day')!;
        await (day as HTMLElement & { updateComplete: Promise<unknown> }).updateComplete;
        const scroller = day.shadowRoot!.querySelector<HTMLElement>('.main')!;
        scroller.style.scrollSnapType = 'none';
        scroller.scrollTop =
            540 * parseFloat(getComputedStyle(day).getPropertyValue('--minute-height'));
        await nextFrame();
        await nextFrame();
        const entries = [...calendar.shadowRoot!.querySelectorAll<Entry>('lms-calendar-entry')];
        const late = entries.find((entry) => entry.heading === 'late')!;
        const persistent = entries.find((entry) => entry.heading === 'persistent')!;
        const last = late.getBoundingClientRect();
        const earlier = persistent.getBoundingClientRect();
        const x = Math.max(last.left, earlier.left) + 8;
        const y = last.top + 12;
        expect(x).to.be.lessThan(Math.min(last.right, earlier.right));
        expect(y).to.be.lessThan(earlier.bottom);
        expect(
            calendar
                .shadowRoot!.elementsFromPoint(x, y)
                .find((element) => element.tagName === 'LMS-CALENDAR-ENTRY'),
        ).to.equal(late);
        for (const entry of entries) {
            expect(getComputedStyle(entry).opacity).to.equal('1');
            expect(getComputedStyle(entry).backgroundColor).to.equal('rgb(255, 255, 255)');
        }
        let activated = '';
        calendar.addEventListener('entry-activate', (event) => {
            activated = (event as CustomEvent).detail.eventId;
            event.preventDefault();
        });
        (calendar.shadowRoot!.elementFromPoint(x, y) as HTMLElement).click();
        await waitUntil(() => activated !== '');
        expect(activated).to.equal('late');
    });
});
