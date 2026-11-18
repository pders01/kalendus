import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = (day: number) => ({ year: 2026, month: 11, day });
const timed: CalendarEntry = {
    id: 'meeting',
    heading: 'Timed meeting',
    kind: 'timed',
    date: { start: date(18), end: date(18) },
    time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
};
const allDay = (id: string, start: number, end = start): CalendarEntry => ({
    id,
    heading: id,
    kind: 'all-day',
    date: { start: date(start), end: date(end) },
});
const controls = (calendar: Calendar) => [
    ...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('.all-day-count'),
];
const chips = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelectorAll('lms-calendar-entry[slot^="all-day-"]');
const timeScroll = (calendar: Calendar) =>
    calendar
        .shadowRoot!.querySelector('lms-calendar-week')!
        .shadowRoot!.querySelector<HTMLElement>('.week-scroll')!;

async function week(entries: CalendarEntry[], style = '') {
    return fixture<Calendar>(html`<lms-calendar locale="en" view-mode="week" .activeDate=${date(17)}
        style=${`width:430px;height:720px;${style}`} .entries=${entries}></lms-calendar>`);
}

describe('Dense Week all-day summary', () => {
    it('keeps sparse chips where their columns can show titles', async () => {
        const calendar = await week([allDay('Exhibition', 17, 18), timed]);
        await waitUntil(() => chips(calendar).length === 2);
        expect(controls(calendar)).to.have.length(0);
    });

    it('uses a summary before a thin column renders even one truncated chip', async () => {
        const calendar = await week(
            [allDay('Exhibition', 17, 18)],
            '--week-mobile-day-count:7;--week-min-day-width:0px;',
        );
        await waitUntil(() => controls(calendar).length === 2);
        expect(chips(calendar)).to.have.length(0);
        expect(controls(calendar).map((button) => button.textContent?.trim())).to.deep.equal([
            '1',
            '1',
        ]);
    });

    it('counts all-day events per date without mounting chips; filters the list and returns to the invoking count', async () => {
        const projects = Array.from({ length: 51 }, (_, i) => allDay(`Project ${i + 1}`, 17, 18));
        const canonical = allDay('Only on Wednesday', 18);
        const calendar = await week([...projects, canonical, timed]);
        const root = calendar.shadowRoot!;
        await waitUntil(() => controls(calendar).length === 2);
        expect(chips(calendar)).to.have.length(0);
        expect(root.querySelector('lms-calendar-entry[slot^="timed-"]')).not.to.equal(null);
        const [first, target] = controls(calendar);
        expect(first.textContent?.trim()).to.equal('51');
        expect(target.textContent?.trim()).to.equal('52');
        expect(target.getAttribute('aria-label')).to.match(/All Day.*Nov 18, 2026.*52 events/i);
        for (let i = 0; i < 4; i++) await nextFrame();
        const scroll = timeScroll(calendar);
        const weekGrid = calendar.shadowRoot!.querySelector('lms-calendar-week')!;
        const band = weekGrid.shadowRoot!.querySelector('.all-day-wrapper')!;
        expect(band.scrollHeight).to.equal(band.clientHeight);
        scroll.scrollTop = 270;
        const before = scroll.scrollTop;
        target.focus({ preventScroll: true });
        await sendKeys({ press: 'Enter' });
        await waitUntil(() => root.activeElement?.id === 'agenda-date');
        expect(calendar.viewMode).to.equal('week');
        expect(calendar.activeDate).to.deep.equal(date(17));
        const agenda = root.querySelector('[data-density-list]')!;
        expect(agenda.querySelector('h2')?.textContent).to.equal('Nov 18, 2026');
        expect(agenda.textContent?.trim()).to.include('52 events');
        expect(agenda.querySelectorAll('.agenda-event')).to.have.length(50);
        agenda.querySelector<HTMLButtonElement>('.agenda-more')!.click();
        await calendar.updateComplete;
        expect(agenda.querySelectorAll('.agenda-event')).to.have.length(52);
        expect(agenda.textContent).not.to.include('Timed meeting');
        let activated: CalendarEntry | undefined;
        calendar.addEventListener(
            'entry-activate',
            (event) => {
                event.preventDefault();
                activated = event.detail.entry;
            },
            { once: true },
        );
        agenda.querySelector<HTMLButtonElement>('[data-event-id="Only on Wednesday"]')!.click();
        await waitUntil(() => activated === canonical);
        calendar.entries = [...calendar.entries, allDay('Added while list is open', 18)];
        await waitUntil(() => agenda.querySelectorAll('.agenda-event').length === 53);
        agenda.querySelector<HTMLButtonElement>('header button')!.click();
        await waitUntil(
            () =>
                (root.activeElement as HTMLElement | null)?.dataset.densityKey ===
                target.dataset.densityKey,
        );
        expect(timeScroll(calendar).scrollTop).to.be.closeTo(before, 2);
        expect(calendar.activeDate).to.deep.equal(date(17));
        expect(controls(calendar).map((button) => button.textContent?.trim())).to.deep.equal([
            '51',
            '53',
        ]);
    });

    it('dismisses the date list when Week navigates to another date', async () => {
        const calendar = await week(
            Array.from({ length: 4 }, (_, i) => allDay(`Project ${i + 1}`, 17, 18)),
        );
        await waitUntil(() => controls(calendar).length === 2);
        controls(calendar)[0].click();
        await calendar.updateComplete;
        expect(calendar.shadowRoot!.querySelector('[data-density-list]')).not.to.equal(null);
        calendar.activeDate = date(24);
        await calendar.updateComplete;
        expect(calendar.shadowRoot!.querySelector('[data-density-list]')).to.equal(null);
        expect(calendar.shadowRoot!.querySelector('lms-calendar-week')).not.to.equal(null);
    });
});
