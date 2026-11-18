import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys, setViewport } from '@web/test-runner-commands';

import '../../../src/lms-calendar.ts';
import type Menu from '../../../src/components/Menu.ts';
import type Month from '../../../src/components/Month.ts';
import { formatLocalizedTime, formatLocalizedTimeRange } from '../../../src/lib/localization.ts';
import { getMessageFormatters } from '../../../src/lib/messages.ts';
import type Calendar from '../../../src/lms-calendar.ts';

const date = { year: 2026, month: 6, day: 15 };
const settle = async (calendar: Calendar) => {
    await calendar.localeReady;
    await calendar.updateComplete;
    await waitUntil(() => {
        const container = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-container')!;
        const style = getComputedStyle(container);
        const width =
            container.getBoundingClientRect().width -
            parseFloat(style.borderLeftWidth) -
            parseFloat(style.borderRightWidth) -
            parseFloat(style.paddingLeft) -
            parseFloat(style.paddingRight);
        return width > 0 && Math.abs(calendar._calendarWidth - width) < 0.5;
    }, 'root commits its measured width before reflow assertions');
    for (let index = 0; index < 4; index++) {
        await calendar.updateComplete;
        for (const child of calendar.shadowRoot!.querySelectorAll(
            'lms-calendar-day, lms-calendar-week, lms-calendar-month, lms-calendar-year',
        )) {
            await (child as Calendar).updateComplete;
        }
        await nextFrame();
    }
};

function timeRange(entry: CalendarEntry, locale: string, card = false) {
    const { start, end } = entry.time!;
    // The card isolates the range in markup; the string formatter uses BiDi controls.
    if (card)
        return formatLocalizedTimeRange(
            start.hour,
            start.minute,
            end.hour,
            end.minute,
            locale,
        ).slice(1, -1);
    return getMessageFormatters(locale).timeRange(
        formatLocalizedTime(start.hour, start.minute, locale),
        formatLocalizedTime(end.hour, end.minute, locale),
    );
}

function readableTitle(control: HTMLElement, selector: string, heading: string) {
    expect(control, `${heading}: real control exists`).to.be.instanceOf(HTMLElement);
    const title =
        control.shadowRoot?.querySelector<HTMLElement>(selector) ??
        control.querySelector<HTMLElement>(selector);
    expect(title, `${heading}: title exists, never silently skip a missing card/row`).to.exist;
    expect(title!.textContent!.trim()).to.equal(heading);
    const box = control.getBoundingClientRect();
    const text = title!.getBoundingClientRect();
    expect(text.width, `${heading}: readable title space`).to.be.at.least(24);
    expect(text.left).to.be.at.least(box.left - 0.5);
    expect(text.right).to.be.at.most(box.right + 0.5);
    expect(text.top).to.be.at.least(box.top - 0.5);
    expect(text.bottom).to.be.at.most(box.bottom + 0.5);
}

async function inspectExactGroup(
    calendar: Calendar,
    sources: CalendarEntry[],
    activateId?: string,
) {
    const previousView = calendar.viewMode;
    const previousDate = calendar.activeDate;
    await waitUntil(() => calendar.shadowRoot!.querySelectorAll('[data-density-key]').length === 1);
    const triggers = [
        ...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('[data-density-key]'),
    ];
    expect(triggers).to.have.length(1);
    const trigger = triggers[0];
    const densityKey = trigger.dataset.densityKey;
    expect(trigger).to.be.instanceOf(HTMLButtonElement);
    expect(trigger.textContent).to.include(
        getMessageFormatters(calendar.locale).eventCount(sources.length),
    );
    expect(trigger.getBoundingClientRect().width).to.be.at.least(24);
    trigger.focus();
    await sendKeys({ press: 'Enter' });
    await settle(calendar);
    const list = calendar.shadowRoot!.querySelector<HTMLElement>('[data-density-list]');
    expect(list, 'disclosure opens exact real events').to.exist;
    expect(calendar.shadowRoot!.activeElement).to.equal(list!.querySelector('#agenda-date'));
    const rows = [...list!.querySelectorAll<HTMLButtonElement>('.agenda-event')];
    expect(rows.map((row) => row.dataset.eventId)).to.deep.equal(
        sources.map((source) => source.id),
    );
    for (const [index, row] of rows.entries()) {
        readableTitle(row, '.agenda-title', sources[index].heading!);
        expect(row.querySelector('.agenda-time')!.textContent).to.equal(
            timeRange(sources[index], calendar.locale),
        );
        expect(row.getAttribute('aria-label')).to.include(sources[index].heading!);
    }
    if (activateId) {
        const row = rows.find((row) => row.dataset.eventId === activateId)!;
        expect(row).to.be.instanceOf(HTMLButtonElement);
        let canonical: CalendarEntry | undefined;
        calendar.addEventListener(
            'entry-activate',
            (event) => {
                canonical = (event as CustomEvent).detail.entry;
            },
            { once: true },
        );
        row.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
        expect(menu.open).to.equal(true);
        expect(canonical).to.deep.equal(sources.find((source) => source.id === activateId));
        expect(menu.eventDetails.heading).to.equal(canonical!.heading);
        await sendKeys({ press: 'Escape' });
        await settle(calendar);
        expect(menu.open).to.equal(false);
        expect(calendar.shadowRoot!.activeElement).to.equal(row);
    }
    const close = list!.querySelector<HTMLButtonElement>('button.agenda-action')!;
    close.focus();
    await sendKeys({ press: 'Enter' });
    await settle(calendar);
    expect(calendar.viewMode).to.equal(previousView);
    expect(calendar.activeDate).to.deep.equal(previousDate);
    expect(calendar.shadowRoot!.querySelector('[data-density-list]')).not.to.exist;
    const restored = calendar.shadowRoot!.querySelector<HTMLButtonElement>('[data-density-key]')!;
    expect(restored.dataset.densityKey).to.equal(densityKey);
    await waitUntil(
        () => calendar.shadowRoot!.activeElement === restored,
        'focus returns to the group',
    );
}

describe('Real-root Year overview and text-size reflow', () => {
    let rootFont: string;
    beforeEach(() => {
        rootFont = document.documentElement.style.fontSize;
    });
    afterEach(async () => {
        document.documentElement.style.fontSize = rootFont;
        await setViewport({ width: 1024, height: 768 });
    });

    it('fits twelve readable months at a wide embed while honoring an explicit legacy column override', async () => {
        await setViewport({ width: 1184, height: 824 });
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .viewMode=${'year'} .activeDate=${date} style="width:1136px;height:760px"></lms-calendar>`,
        );
        await settle(calendar);
        const year = calendar.shadowRoot!.querySelector('lms-calendar-year')!;
        const grid = year.shadowRoot!.querySelector<HTMLElement>('.year-grid')!;
        const scroller = year.shadowRoot!.querySelector<HTMLElement>('.scroll-container')!;
        expect(getComputedStyle(grid).gridTemplateColumns.split(' ')).to.have.length(4);
        expect(grid.querySelectorAll('.mini-month')).to.have.length(12);
        expect(scroller.scrollHeight).to.be.at.most(scroller.clientHeight + 1);
        const last = grid.querySelector('.mini-month:last-child')!.getBoundingClientRect();
        const view = scroller.getBoundingClientRect();
        expect(last.bottom).to.be.at.most(view.bottom);
        for (const button of grid.querySelectorAll('button[data-date]')) {
            const rect = button.getBoundingClientRect();
            expect(rect.width).to.be.at.least(24);
            expect(rect.height).to.be.at.least(24);
        }
        calendar.style.setProperty('--year-grid-columns', '3');
        await nextFrame();
        expect(getComputedStyle(grid).gridTemplateColumns.split(' ')).to.have.length(3);
    });

    for (const viewMode of ['day', 'week'] as const) {
        it(`retains whole all-day and short-event text lines at 2× text size in ${viewMode} view`, async () => {
            await setViewport({ width: 800, height: 824 });
            document.documentElement.style.fontSize = '32px';
            const entries: CalendarEntry[] = [
                {
                    id: 'all-day',
                    heading: 'Design conference',
                    kind: 'all-day',
                    date: { start: date, end: date },
                },
                {
                    id: 'short',
                    heading: 'Short event',
                    date: { start: date, end: date },
                    time: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 5 } },
                },
                {
                    id: 'long',
                    heading: 'Long event',
                    date: { start: date, end: date },
                    time: { start: { hour: 9, minute: 2 }, end: { hour: 11, minute: 0 } },
                },
            ];
            const calendar = await fixture<Calendar>(
                html`<lms-calendar .viewMode=${viewMode} .activeDate=${date} .entries=${entries} style="width:752px;height:760px"></lms-calendar>`,
            );
            await settle(calendar);
            // Day has room for two readable lanes; enlarged Week does not.
            // Keep exact coverage of ALL three titles instead of lowering a
            // rendered-card minimum or silently skipping a missing short card.
            const cardSources = viewMode === 'day' ? entries : entries.slice(0, 1);
            const cards = [
                ...calendar.shadowRoot!.querySelectorAll<HTMLElement>('lms-calendar-entry'),
            ];
            expect(cards.map((card) => card.dataset.eventId).sort()).to.deep.equal(
                cardSources.map((source) => source.id).sort(),
            );
            for (const source of cardSources) {
                const entry = cards.find((card) => card.dataset.eventId === source.id)!;
                readableTitle(entry, '.title', source.heading!);
                if (source.time) {
                    const box = entry.getBoundingClientRect();
                    const time = entry.shadowRoot!.querySelector<HTMLElement>('.time');
                    expect(time, `${source.id}: full time range exists`).to.exist;
                    expect(getComputedStyle(time!).display).not.to.equal('none');
                    expect(time!.textContent!.trim()).to.equal(
                        timeRange(source, calendar.locale, true),
                    );
                    const interval = time!.getBoundingClientRect();
                    expect(interval.top).to.be.at.least(box.top - 0.5);
                    expect(interval.bottom).to.be.at.most(box.bottom + 0.5);
                    expect(interval.width).to.be.greaterThan(0);
                    expect(time!.lastElementChild!.getBoundingClientRect().bottom).to.be.at.most(
                        interval.bottom + 0.5,
                    );
                    expect(time!.scrollWidth).to.be.at.most(time!.clientWidth + 1);
                }
            }
            if (viewMode === 'day') {
                const short = cards.find((card) => card.dataset.eventId === 'short')!;
                expect(short.getBoundingClientRect().height).to.be.greaterThan(
                    parseFloat(getComputedStyle(short).minHeight),
                );
                expect(calendar.shadowRoot!.querySelector('[data-density-key]')).not.to.exist;
            } else {
                await inspectExactGroup(calendar, entries.slice(1), 'short');
            }
            const view = calendar.shadowRoot!.querySelector(`lms-calendar-${viewMode}`)!;
            expect(
                getComputedStyle(view.shadowRoot!.querySelector('.day-label')!).fontSize,
            ).to.equal('32px');
            expect(
                parseFloat((view as HTMLElement).style.getPropertyValue('--hour-height')),
            ).to.be.at.least(88 - 0.001);
        });
    }

    it('discloses all ordinary mobile Week overlaps as exact readable title/time rows and keyboard-opens canonical details', async () => {
        await setViewport({ width: 390, height: 720 });
        const timed = (
            id: string,
            heading: string,
            start: number,
            minute: number,
            end: number,
        ): CalendarEntry => ({
            id,
            heading,
            date: { start: date, end: date },
            time: { start: { hour: start, minute }, end: { hour: end, minute: 0 } },
        });
        const entries = [
            timed('sprint', 'Sprint planning', 8, 30, 10),
            timed('review', 'Design review', 9, 0, 11),
            {
                ...timed('sync', 'Team sync', 10, 30, 11),
                time: { start: { hour: 10, minute: 30 }, end: { hour: 11, minute: 30 } },
            },
        ];
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .viewMode=${'week'} .activeDate=${date} .entries=${entries} style="width:358px;height:660px"></lms-calendar>`,
        );
        await settle(calendar);
        expect(calendar.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(0);
        await inspectExactGroup(calendar, entries, 'sync');
    });

    for (const viewMode of ['day', 'week'] as const) {
        for (const width of [160, 240]) {
            it(`preserves a readable minimum-width ${viewMode} time grid at a ${width}px tiny embed`, async () => {
                const source: CalendarEntry = {
                    id: 'tiny',
                    heading: 'Tiny event',
                    date: { start: date, end: date },
                    time: { start: { hour: 9, minute: 15 }, end: { hour: 10, minute: 45 } },
                };
                const calendar = await fixture<Calendar>(html`<lms-calendar
                    .viewMode=${viewMode} .activeDate=${date} .entries=${[source]}
                    style=${`width:${width}px;height:660px`}></lms-calendar>`);
                await settle(calendar);
                const region = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
                const view = region.querySelector<HTMLElement>(`lms-calendar-${viewMode}`)!;
                expect(view.getBoundingClientRect().width).to.be.at.least(240);
                expect(getComputedStyle(region).overflowX).to.equal('auto');
                expect(region.scrollWidth).to.be.at.least(240);
                if (width < 240) expect(region.scrollWidth).to.be.greaterThan(region.clientWidth);
                const cards = [...view.querySelectorAll<HTMLElement>('lms-calendar-entry')];
                expect(cards).to.have.length(1);
                expect(cards[0].dataset.eventId).to.equal(source.id);
                readableTitle(cards[0], '.title', source.heading);
                const time = cards[0].shadowRoot!.querySelector<HTMLElement>('.time')!;
                expect(time.textContent!.trim()).to.equal(timeRange(source, calendar.locale, true));
                expect(time.lastElementChild!.getBoundingClientRect().bottom).to.be.at.most(
                    time.getBoundingClientRect().bottom + 0.5,
                );
                expect(time.scrollWidth).to.be.at.most(time.clientWidth + 1);
                expect(calendar.shadowRoot!.querySelector('[data-density-key]')).not.to.exist;
            });
        }
    }

    it('keeps every default compact Month title in readable contextual rows at 2× text with page-owned vertical scroll', async () => {
        await setViewport({ width: 390, height: 720 });
        document.documentElement.style.fontSize = '32px';
        const sources: CalendarEntry[] = Array.from({ length: 6 }, (_, index) => ({
            id: `context-${index}`,
            heading: `Readable event ${index + 1}`,
            date: { start: date, end: date },
            time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
        }));
        const calendar = await fixture<Calendar>(html`<lms-calendar .activeDate=${date}
            .entries=${sources} style="width:358px;height:660px"></lms-calendar>`);
        await settle(calendar);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        expect(month.compact).to.equal(true);
        expect(month.querySelectorAll('lms-calendar-entry')).to.have.length(0);
        const rows = [...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('.agenda-event')];
        expect(rows.map((row) => row.dataset.eventId)).to.deep.equal(
            sources.map((source) => source.id),
        );
        for (const [index, row] of rows.entries()) {
            readableTitle(row, '.agenda-title', sources[index].heading);
            expect(row.querySelector('.agenda-time')!.textContent).to.equal(
                timeRange(sources[index], calendar.locale),
            );
        }
        const grid = month.shadowRoot!.querySelector<HTMLElement>('.month')!;
        const region = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
        expect(getComputedStyle(grid).overflowY).to.equal('visible');
        expect(getComputedStyle(region).overflowY).to.equal('visible');
        expect(grid.scrollHeight).to.be.at.most(grid.clientHeight + 1);
        expect(calendar.getBoundingClientRect().height).to.be.greaterThan(660);
        expect(document.scrollingElement!.scrollHeight).to.be.greaterThan(window.innerHeight);
    });

    it('keeps enlarged compact date/count names intact in page-owned vertical flow with explicit keyboard day drill', async () => {
        await setViewport({ width: 390, height: 720 });
        document.documentElement.style.fontSize = '32px';
        const entry = (id: string, day: number): CalendarEntry => ({
            id,
            heading: id,
            date: { start: { ...date, day }, end: { ...date, day } },
            time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
        });
        const entries = [
            ...Array.from({ length: 6 }, (_, index) => entry(`June 15 event ${index}`, 15)),
            entry('Font scales too', 21),
        ];
        const calendar = await fixture<Calendar>(
            html`<lms-calendar .activeDate=${date} .entries=${entries} .monthDayBehavior=${'day'} style="width:358px;height:660px"></lms-calendar>`,
        );
        await settle(calendar);
        const toolbar = calendar.shadowRoot!.querySelector('lms-calendar-header')!.shadowRoot!;
        const controls = [...toolbar.querySelectorAll('.context button')].map((button) =>
            button.getBoundingClientRect(),
        );
        expect(controls[0].top).to.equal(controls[1].top);
        expect(controls[2].top).to.equal(controls[3].top);
        expect(controls[2].top).to.be.at.least(controls[0].bottom);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        const grid = month.shadowRoot!.querySelector<HTMLElement>('.month')!;
        expect(month.compact).to.equal(true);
        const strip = month.shadowRoot!.querySelector<HTMLElement>('.month-strip')!;
        expect(strip.scrollWidth).to.be.greaterThan(strip.clientWidth);
        expect(getComputedStyle(strip).overflowX).to.equal('auto');
        expect(strip.scrollHeight).to.be.at.most(strip.clientHeight + 1);
        expect(grid.scrollWidth).to.be.at.most(grid.clientWidth + 1);
        expect(getComputedStyle(grid).overflowY).to.equal('visible');
        expect(grid.scrollHeight).to.be.at.most(grid.clientHeight + 1);
        const region = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
        expect(getComputedStyle(region).overflowY).to.equal('visible');
        const indicator = month.shadowRoot!.querySelector<HTMLButtonElement>(
            'button.indicator[data-date="2026-6-15"]',
        )!;
        expect(indicator).to.be.instanceOf(HTMLButtonElement);
        expect(indicator.getAttribute('aria-label')).to.include('6 events');
        expect(indicator.querySelector('.activity[data-active]')).to.exist;
        const cell = indicator.closest('.day')!.getBoundingClientRect();
        const control = indicator.getBoundingClientRect();
        expect(getComputedStyle(indicator).fontSize).to.equal('32px');
        expect(control.height).to.be.at.least(44);
        expect(control.right).to.be.at.most(cell.right);
        expect(control.bottom).to.be.at.most(cell.bottom);
        expect(calendar.getBoundingClientRect().height).to.be.greaterThan(660);
        await month.focusDate({ ...date, day: 20 });
        expect(month.shadowRoot!.activeElement).to.equal(
            month.shadowRoot!.querySelector('button.indicator[data-date="2026-6-20"]'),
        );
        const focused = month.shadowRoot!.activeElement!.getBoundingClientRect();
        expect(focused.left).to.be.at.least(strip.getBoundingClientRect().left - 1);
        expect(focused.right).to.be.at.most(strip.getBoundingClientRect().right + 1);
        // Month owns deliberate horizontal panning, never a vertical viewport.
        expect(document.scrollingElement!.scrollWidth).to.be.at.most(
            document.scrollingElement!.clientWidth + 1,
        );
        expect(document.scrollingElement!.scrollHeight).to.be.greaterThan(window.innerHeight);
        await sendKeys({ press: 'ArrowRight' });
        await sendKeys({ press: ' ' });
        await settle(calendar);
        expect(calendar.viewMode).to.equal('day');
        expect(calendar.activeDate).to.deep.equal({ ...date, day: 21 });
        await waitUntil(() => !!calendar.shadowRoot!.querySelector('lms-calendar-entry'));
        const rendered = calendar.shadowRoot!.querySelector('lms-calendar-entry')!;
        expect(getComputedStyle(rendered).fontSize).to.equal('24px');
        expect(rendered.getBoundingClientRect().height).to.be.at.least(24);
    });
});
