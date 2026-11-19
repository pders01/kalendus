import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';

import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = (day: number) => ({ year: 2026, month: 11, day });
const allDay = (id: string, start: number, end: number): CalendarEntry => ({
    id,
    heading: id,
    kind: 'all-day',
    date: { start: date(start), end: date(end) },
});
const bars = (calendar: Calendar, id: string) =>
    [...calendar.shadowRoot!.querySelectorAll('lms-calendar-entry')].filter(
        (entry) => entry.eventId === id,
    );

async function mount(view: 'month' | 'week', entries: CalendarEntry[], dir: 'ltr' | 'rtl' = 'ltr') {
    const calendar = await fixture<Calendar>(html`<lms-calendar .activeDate=${date(18)}
        view-mode=${view} dir=${dir} .entries=${entries}
        style="width:1320px;height:760px;--entry-border-radius:6px"
    ></lms-calendar>`);
    await calendar.localeReady;
    for (let i = 0; i < 5; i++) await nextFrame();
    return calendar;
}

function baseline(label: Element) {
    // An empty inline block has its baseline at its bottom border edge.
    const marker = document.createElement('span');
    marker.style.cssText = 'display:inline-block;width:0;height:0';
    label.append(marker);
    const y = marker.getBoundingClientRect().bottom;
    marker.remove();
    return y;
}

function expectSameColumns(bar: HTMLElement, dates: Element[]) {
    const positions = dates.map((element) => element.getBoundingClientRect());
    const bounds = bar.getBoundingClientRect();
    expect(bounds.left).to.be.closeTo(Math.min(...positions.map(({ left }) => left)), 2);
    expect(bounds.right).to.be.closeTo(Math.max(...positions.map(({ right }) => right)), 2);
}

for (const dir of ['ltr', 'rtl'] as const) {
    describe(`Continuous all-day bars (${dir})`, () => {
        it('renders a Month bar once per visible week row with logical continuation edges', async () => {
            const event = allDay('Exhibition', 14, 18);
            const calendar = await mount('month', [event], dir);
            await waitUntil(() => bars(calendar, event.id!).length === 2);
            const [first, second] = bars(calendar, event.id!);
            const month = calendar.shadowRoot!.querySelector('lms-calendar-month')!.shadowRoot!;
            const days = (dates: number[]) =>
                dates.map((day) => month.querySelector(`.day[data-date="2026-11-${day}"]`)!);
            expectSameColumns(first, days([14, 15]));
            expectSameColumns(second, days([16, 17, 18]));
            expect(first.date).to.deep.equal({ start: date(14), end: date(15) });
            expect(second.date).to.deep.equal({ start: date(16), end: date(18) });
            expect(first.canonicalEntry).to.equal(event);
            expect(first.tabIndex).to.equal(0);
            expect(second.tabIndex).to.equal(0);
            expect(first.getAttribute('aria-label')).to.equal(second.getAttribute('aria-label'));
            expect(first.getAttribute('aria-label')).to.match(
                /Exhibition: .*Nov 14.*18, 2026.*, All Day/,
            );
            expect(getComputedStyle(first).borderStartStartRadius).to.equal('6px');
            expect(getComputedStyle(first).borderStartEndRadius).to.equal('0px');
            expect(getComputedStyle(second).borderStartStartRadius).to.equal('0px');
            expect(getComputedStyle(second).borderStartEndRadius).to.equal('6px');
        });

        it('aligns the baselines of Month preview times and titles in the same lane', async () => {
            const timed: CalendarEntry = {
                id: 'review',
                heading: 'Code Review',
                kind: 'timed',
                date: { start: date(18), end: date(18) },
                time: { start: { hour: 14, minute: 0 }, end: { hour: 15, minute: 30 } },
            };
            const calendar = await mount('month', [timed, allDay('Product Sprint', 20, 22)], dir);
            calendar.style.setProperty('--system-ui', 'system-ui, sans-serif');
            calendar.style.setProperty('--entry-font-size-lg', '16px');
            const [card] = bars(calendar, 'review');
            const [span] = bars(calendar, 'Product Sprint');
            const time = card.shadowRoot!.querySelector('.time')!;
            const title = card.shadowRoot!.querySelector('.title')!;
            const spanTitle = span.shadowRoot!.querySelector('.title')!;
            expect(getComputedStyle(time).fontSize).not.to.equal(getComputedStyle(title).fontSize);
            expect(baseline(time)).to.be.closeTo(baseline(title), 0.125);
            expect(baseline(spanTitle)).to.be.closeTo(baseline(title), 0.125);
        });

        it('renders one Week bar across the visible dates, without merging timed sessions', async () => {
            const event = allDay('Residency', 14, 24);
            const sessions = [17, 18].map(
                (day): CalendarEntry => ({
                    id: `session-${day}`,
                    heading: 'Daily session',
                    kind: 'timed',
                    date: { start: date(day), end: date(day) },
                    time: { start: { hour: 9, minute: 0 }, end: { hour: 11, minute: 0 } },
                }),
            );
            const overnight: CalendarEntry = {
                ...sessions[0],
                id: 'overnight',
                date: { start: date(18), end: date(19) },
                time: { start: { hour: 23, minute: 0 }, end: { hour: 2, minute: 0 } },
            };
            const calendar = await mount('week', [event, ...sessions, overnight], dir);
            expect(bars(calendar, event.id!)).to.have.length(1);
            const [bar] = bars(calendar, event.id!);
            const week = calendar.shadowRoot!.querySelector('lms-calendar-week')!;
            const columns = () => [...week.shadowRoot!.querySelectorAll('.day-label')];
            expectSameColumns(bar, columns());
            expect(bar.date).to.deep.equal({ start: date(16), end: date(22) });
            expect(bar.canonicalEntry).to.equal(event);
            expect(getComputedStyle(bar).borderStartStartRadius).to.equal('0px');
            expect(getComputedStyle(bar).borderStartEndRadius).to.equal('0px');
            for (const session of sessions) {
                const [card] = bars(calendar, session.id!);
                expect(card.slot).to.match(/^timed-/);
                expect(card.canonicalEntry).to.equal(session);
            }
            expect(bars(calendar, 'overnight').map((card) => card.slot)).to.deep.equal([
                'timed-2026-11-18',
                'timed-2026-11-19',
            ]);

            bar.focus();
            calendar.style.width = '530px';
            await waitUntil(() => week.visibleLength === 3 && bar.date?.start.day !== 16);
            expect(bars(calendar, event.id!)).to.deep.equal([bar]);
            expect(calendar.shadowRoot!.activeElement).to.equal(bar);
            expectSameColumns(bar, columns());

            const firstVisible = bar.slot.slice('all-day-'.length);
            calendar.style.setProperty('--week-mobile-day-count', '7');
            calendar.style.setProperty('--week-min-day-width', '0px');
            calendar.style.width = '460px';
            await waitUntil(() => !bar.isConnected);
            const count = calendar.shadowRoot!.querySelector(
                `[data-density-key="all-day:${firstVisible}"]`,
            );
            expect(count?.textContent?.trim()).to.equal('1');
            expect(calendar.shadowRoot!.activeElement).to.equal(count);
        });
    });
}

it('does not bridge a hidden Month lane and returns focus to the merged bar after the row grows', async () => {
    const events = ['a', 'b', 'c'].map((id) => allDay(id, 16, 22));
    const timed: CalendarEntry = {
        id: 'timed',
        kind: 'timed',
        date: { start: date(18), end: date(18) },
        time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
    };
    const calendar = await mount('month', [...events, timed]);
    calendar.style.setProperty('--month-week-height', '7.5em');
    await waitUntil(() => bars(calendar, 'c').length === 2);
    const [first, afterGap] = bars(calendar, 'c');
    expect([first.date, afterGap.date]).to.deep.equal([
        { start: date(16), end: date(17) },
        { start: date(19), end: date(22) },
    ]);
    const month = calendar.shadowRoot!.querySelector('lms-calendar-month')!;
    const summary = month.shadowRoot!.querySelector<HTMLButtonElement>(
        '.summary[data-date="2026-11-18"]',
    )!;
    expect(summary.hidden).to.equal(false);
    expect(summary.querySelector('slot')!.textContent).to.equal('+2');
    afterGap.focus();
    calendar.style.setProperty('--month-week-height', '10em');
    await waitUntil(() => summary.hidden && bars(calendar, 'c').length === 1);
    expect(first.date).to.deep.equal({ start: date(16), end: date(22) });
    expect(calendar.shadowRoot!.activeElement).to.equal(first);
});
