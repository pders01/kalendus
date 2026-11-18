import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import type { LitElement } from 'lit';

import '../../../src/lms-calendar.ts';
import type Entry from '../../../src/components/Entry.ts';
import type { Menu } from '../../../src/components/Menu.ts';
import type Month from '../../../src/components/Month.ts';
import type LMSCalendar from '../../../src/lms-calendar.ts';
import type { CalendarEntry } from '../../../src/lms-calendar.ts';

import brutalist from '../../../src/themes/brutalist.css?raw';
import defaultTheme from '../../../src/themes/default.css?raw';
import ink from '../../../src/themes/ink.css?raw';
import midnight from '../../../src/themes/midnight.css?raw';
import soft from '../../../src/themes/soft.css?raw';

const date = { year: 2026, month: 3, day: 10 };
const key = '2026-3-10';
const themes = { default: defaultTheme, soft, midnight, ink, brutalist };
type Theme = keyof typeof themes;
type View = 'month' | 'day' | 'week' | 'year';

function entries(locale: string): CalendarEntry[] {
    const arabic = locale === 'ar';
    return [
        {
            id: 'planning',
            kind: 'timed',
            date: { start: date, end: date },
            time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 30 } },
            heading: arabic ? 'اجتماع التخطيط' : 'Planning meeting',
            content: arabic ? 'مراجعة الجدول مع الفريق' : 'Review the schedule with the team.',
            color: '#21618c',
        },
        ...Array.from(
            { length: 7 },
            (_, index): CalendarEntry => ({
                id: `dense-${index}`,
                kind: 'timed',
                date: { start: date, end: date },
                time: {
                    start: { hour: 13, minute: index * 5 },
                    end: { hour: 14, minute: 30 },
                },
                heading: arabic ? `جلسة ${index + 1}` : `Overlapping session ${index + 1}`,
                content: arabic ? 'ملاحظات الجلسة' : 'Dense day regression sample.',
                color: index % 2 ? '#f2cc60' : '#782e91',
            }),
        ),
        {
            id: 'conference',
            kind: 'all-day',
            date: { start: { ...date, day: 9 }, end: { ...date, day: 12 } },
            heading: arabic ? 'المؤتمر' : 'Multi-day conference',
            content: arabic ? 'فعالية طوال اليوم' : 'All-day event spanning several dates.',
            color: '#13766b',
        },
        {
            id: 'holiday',
            kind: 'all-day',
            date: { start: date, end: date },
            heading: arabic ? 'عطلة' : 'Team holiday',
            content: '',
            color: '#f5b7b1',
        },
    ];
}

// updateComplete only settles one Lit host. Include nested shadow/light trees and
// rendering opportunities for ResizeObserver, slotchange and sizing controllers.
async function settle(calendar: LMSCalendar): Promise<void> {
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
    }, 'root commits its observed width before responsive assertions');
    const updates = (element: Element): Promise<unknown>[] => [
        ...('updateComplete' in element ? [(element as LitElement).updateComplete] : []),
        ...Array.from(element.children).flatMap(updates),
        ...Array.from(element.shadowRoot?.children ?? []).flatMap(updates),
    ];
    for (let pass = 0; pass < 3; pass++) {
        await Promise.all(updates(calendar));
        await nextFrame();
    }
    const animations = (element: Element): Animation[] => [
        ...element
            .getAnimations()
            .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity),
        ...Array.from(element.children).flatMap(animations),
        ...Array.from(element.shadowRoot?.children ?? []).flatMap(animations),
    ];
    await Promise.all(animations(calendar).map((animation) => animation.finished.catch(() => {})));
    await nextFrame();
}

async function calendarFixture(
    theme: Theme,
    view: View,
    width: number,
    locale = 'en',
    monthDayBehavior: LMSCalendar['monthDayBehavior'] = 'auto',
): Promise<LMSCalendar> {
    const wrapper = await fixture<HTMLDivElement>(html`
        <div style=${`width:${width}px;height:720px;background:#fff;color:#111`}>
            <lms-calendar
                style="display:block;width:100%;height:100%"
                lang=${locale}
                .locale=${locale}
                .activeDate=${date}
                .viewMode=${view}
                .monthDayBehavior=${monthDayBehavior}
                .entries=${entries(locale)}
                .yearDensityMode=${'heatmap'}
                .heading=${locale === 'ar' ? 'تقويم الفريق' : 'Team calendar'}
            ></lms-calendar>
        </div>
    `);
    const sheet = document.createElement('style');
    sheet.textContent = themes[theme];
    wrapper.prepend(sheet);
    const calendar = wrapper.querySelector<LMSCalendar>('lms-calendar')!;
    await settle(calendar);
    expect(calendar.getBoundingClientRect().width).to.be.closeTo(width, 1);
    expect(calendar.shadowRoot!.querySelector('.locale-loading')).to.equal(null);
    expect(calendar.shadowRoot!.querySelector('[role="alert"]')).to.equal(null);
    expect(calendar.getAttribute('dir')).to.equal(locale.split('-')[0] === 'ar' ? 'rtl' : 'ltr');
    expect(calendar.shadowRoot!.querySelector(`lms-calendar-${view}`)).to.be.instanceOf(
        HTMLElement,
    );
    return calendar;
}

function header(calendar: LMSCalendar): ShadowRoot {
    return calendar.shadowRoot!.querySelector('lms-calendar-header')!.shadowRoot!;
}

async function switchView(calendar: LMSCalendar, view: View): Promise<void> {
    const button = header(calendar).querySelector<HTMLButtonElement>(`[data-context="${view}"]`)!;
    button.focus();
    await sendKeys({ press: 'Enter' });
    await settle(calendar);
    expect(calendar.viewMode).to.equal(view);
    expect(header(calendar).activeElement).to.equal(button);
    expect(button.getAttribute('aria-pressed')).to.equal('true');
}

async function openInspector(calendar: LMSCalendar): Promise<Entry> {
    const entry = Array.from(
        calendar
            .shadowRoot!.querySelector('lms-calendar-day')!
            .querySelectorAll<Entry>('lms-calendar-entry'),
    ).find((entry) => entry.eventId === 'planning')!;
    expect(entry, 'canonical timed sample is rendered by the real root').to.be.instanceOf(
        HTMLElement,
    );
    entry.scrollIntoView({ block: 'nearest' });
    entry.focus();
    await sendKeys({ press: 'Enter' });
    await settle(calendar);
    const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
    expect(menu.open).to.equal(true);
    const card = menu.shadowRoot!.querySelector<HTMLDialogElement>('.card')!;
    expect(card.matches(':popover-open') || card.open).to.equal(true);
    expect(card.hasAttribute('aria-modal')).to.equal(false);
    expect(calendar.inert).to.equal(false);
    expect(menu.shadowRoot!.activeElement).to.equal(card.querySelector('.close-btn'));
    expect(card.textContent).to.include(entry.heading);
    return entry;
}

// These are unmodified axe scans of the REAL root, including its slotted entries,
// header and inspector. Passing automated checks is not a WCAG/usability claim.
describe('Real-root automatic accessibility regressions', function () {
    this.timeout(15000);
    let scanFailures: string[];
    function scenario(title: string, run: () => Promise<void>): void {
        it(title, async () => {
            scanFailures = [];
            try {
                await run();
            } catch (error) {
                scanFailures.push(String(error));
            }
            if (scanFailures.length) throw new Error(scanFailures.join('\n\n'));
        });
    }
    // Keep exercising later UI states if an earlier state fails; report EVERY
    // unfiltered axe failure at the end of the scenario rather than skip a scan.
    async function scan(calendar: LMSCalendar): Promise<void> {
        try {
            await expect(calendar).to.be.accessible();
        } catch (error) {
            scanFailures.push(String(error));
        }
    }

    // Seven connected overlaps are represented by ONE real disclosure, not
    // seven unreadable cards. Account for every other real occurrence exactly.
    async function scanExactDenseGroup(calendar: LMSCalendar, viewMode: 'day' | 'week') {
        await waitUntil(
            () => calendar.shadowRoot!.querySelectorAll('[data-density-key]').length === 1,
        );
        await settle(calendar);
        const view = calendar.shadowRoot!.querySelector(`lms-calendar-${viewMode}`)!;
        const conferenceCount =
            viewMode === 'day'
                ? 1
                : [
                      ...view.shadowRoot!.querySelectorAll<HTMLButtonElement>(
                          'button.day-label[data-date]',
                      ),
                  ].filter((button) =>
                      ['2026-3-9', '2026-3-10', '2026-3-11', '2026-3-12'].includes(
                          button.dataset.date!,
                      ),
                  ).length;
        expect(conferenceCount, 'visible conference dates are represented').to.be.at.least(1);
        const cards = [...view.querySelectorAll<Entry>('lms-calendar-entry')];
        expect(cards.map((entry) => entry.eventId).sort()).to.deep.equal(
            [...Array(conferenceCount).fill('conference'), 'holiday', 'planning'].sort(),
        );
        for (const card of cards) {
            expect(card.getBoundingClientRect().height).to.be.at.least(24);
            expect(getComputedStyle(card).display).not.to.equal('none');
        }
        const trigger =
            calendar.shadowRoot!.querySelector<HTMLButtonElement>('[data-density-key]')!;
        expect(trigger).to.be.instanceOf(HTMLButtonElement);
        const densityKey = trigger.dataset.densityKey;
        expect(trigger.getBoundingClientRect().width).to.be.at.least(24);
        trigger.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        const list = calendar.shadowRoot!.querySelector<HTMLElement>('[data-density-list]');
        expect(list, 'keyboard opens the real connected group').to.exist;
        expect(calendar.shadowRoot!.activeElement).to.equal(list!.querySelector('#agenda-date'));
        const rows = [...list!.querySelectorAll<HTMLButtonElement>('.agenda-event')];
        expect(rows.map((row) => row.dataset.eventId)).to.deep.equal(
            Array.from({ length: 7 }, (_, index) => `dense-${index}`),
        );
        for (const [index, row] of rows.entries()) {
            expect(row).to.be.instanceOf(HTMLButtonElement);
            expect(row.querySelector('.agenda-title')!.textContent).to.equal(
                entries(calendar.locale)[index + 1].heading,
            );
            expect(row.querySelector('.agenda-time')!.textContent!.trim()).not.to.equal('');
        }
        await scan(calendar);
        const close = list!.querySelector<HTMLButtonElement>('button.agenda-action')!;
        close.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(calendar.viewMode).to.equal(viewMode);
        expect(calendar.shadowRoot!.querySelector('[data-density-list]')).not.to.exist;
        const restored =
            calendar.shadowRoot!.querySelector<HTMLButtonElement>('[data-density-key]')!;
        expect(restored.dataset.densityKey).to.equal(densityKey);
        await waitUntil(
            () => calendar.shadowRoot!.activeElement === restored,
            'focus returns to the disclosure',
        );
    }

    for (const theme of Object.keys(themes) as Theme[]) {
        describe(`${theme} shipped theme`, () => {
            scenario(
                'scans normal English Month with actual overflow and all-day entries',
                async () => {
                    const calendar = await calendarFixture(theme, 'month', 960);
                    const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
                    await waitUntil(
                        () =>
                            !!month.shadowRoot!.querySelector(
                                `.day[data-date="${key}"] .summary:not([hidden])`,
                            ),
                    );
                    const rendered = Array.from(
                        month.querySelectorAll<HTMLElement>('lms-calendar-entry'),
                    );
                    expect(rendered.length).to.be.greaterThan(8);
                    expect(rendered.map((entry) => entry.dataset.eventId).sort()).to.deep.equal(
                        [
                            ...Array(4).fill('conference'),
                            'holiday',
                            'planning',
                            ...Array.from({ length: 7 }, (_, index) => `dense-${index}`),
                        ].sort(),
                    );
                    expect(
                        rendered.some((entry) => getComputedStyle(entry).display === 'none'),
                    ).to.equal(true);
                    expect(
                        rendered.some((entry) => getComputedStyle(entry).display !== 'none'),
                    ).to.equal(true);
                    await scan(calendar);
                },
            );

            scenario(
                'scans narrow Arabic dense Day, then its keyboard-opened non-modal inspector',
                async () => {
                    const calendar = await calendarFixture(theme, 'day', 360, 'ar');
                    await scanExactDenseGroup(calendar, 'day');
                    await scan(calendar);
                    const invoker = await openInspector(calendar);
                    await scan(calendar);
                    await sendKeys({ press: 'Escape' });
                    await settle(calendar);
                    expect(calendar.shadowRoot!.querySelector<Menu>('lms-menu')!.open).to.equal(
                        false,
                    );
                    expect(invoker.isConnected).to.equal(true);
                    expect(calendar.shadowRoot!.activeElement).to.equal(invoker);
                },
            );

            scenario(
                'scans normal English Week reached through the persistent toolbar',
                async () => {
                    const calendar = await calendarFixture(theme, 'month', 960);
                    await switchView(calendar, 'week');
                    const week = calendar.shadowRoot!.querySelector('lms-calendar-week')!;
                    expect(week.querySelector('[slot^="all-day"]')).to.be.instanceOf(HTMLElement);
                    await scanExactDenseGroup(calendar, 'week');
                    await scan(calendar);
                },
            );

            scenario('scans narrow Arabic Year heatmap with real entry density', async () => {
                const calendar = await calendarFixture(theme, 'year', 360, 'ar');
                const year = calendar.shadowRoot!.querySelector('lms-calendar-year')!;
                expect(year.shadowRoot!.querySelectorAll('[role="grid"]')).to.have.length(12);
                expect(
                    year
                        .shadowRoot!.querySelector(`button[data-date="${key}"]`)!
                        .getAttribute('data-density'),
                ).to.equal('4');
                await scan(calendar);
            });
        });
    }

    scenario(
        'scans opt-in narrow Arabic Month day drill and the Day reached with actual Space',
        async () => {
            const calendar = await calendarFixture('default', 'month', 360, 'ar-u-nu-arab', 'day');
            const month = calendar.shadowRoot!.querySelector('lms-calendar-month')!;
            expect(month.querySelectorAll('lms-calendar-entry')).to.have.length(0);
            const summary = month.shadowRoot!.querySelector<HTMLButtonElement>(
                `button.indicator[data-date="${key}"]`,
            )!;
            expect(summary).to.be.instanceOf(HTMLButtonElement);
            expect(summary.querySelector('.activity[data-active]')).to.exist;
            expect(summary.getAttribute('aria-label')).to.include('٢٠٢٦');
            await scan(calendar);
            summary.focus();
            await sendKeys({ press: ' ' });
            await settle(calendar);
            expect(calendar.viewMode).to.equal('day');
            expect(calendar.activeDate).to.deep.equal(date);
            await scan(calendar);
        },
    );

    scenario(
        'scans default compact Arabic Month date selection, contextual rows and canonical activation',
        async () => {
            const calendar = await calendarFixture('default', 'month', 360, 'ar');
            const month = calendar.shadowRoot!.querySelector('lms-calendar-month')!;
            const button = month.shadowRoot!.querySelector<HTMLButtonElement>(
                `button.indicator[data-date="${key}"]`,
            )!;
            expect(button).to.be.instanceOf(HTMLButtonElement);
            expect(button.querySelector('.activity[data-active]')).to.exist;
            expect(month.shadowRoot!.querySelectorAll('.summary:not([hidden])')).to.have.length(0);
            button.focus();
            await sendKeys({ press: ' ' });
            await settle(calendar);
            expect(calendar.viewMode).to.equal('month');
            expect(month.shadowRoot!.activeElement).to.equal(button);
            const rows = [
                ...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('.agenda-event'),
            ];
            expect(rows.map((row) => row.dataset.eventId)).to.deep.equal([
                'conference',
                'holiday',
                'planning',
                ...Array.from({ length: 7 }, (_, index) => `dense-${index}`),
            ]);
            await scan(calendar);
            const row = rows.find((row) => row.dataset.eventId === 'planning')!;
            let activated: CalendarEntry | undefined;
            calendar.addEventListener('entry-activate', (event) => {
                activated = (event as CustomEvent).detail.entry;
            });
            row.focus();
            await sendKeys({ press: 'Enter' });
            await settle(calendar);
            expect(activated).to.deep.equal(entries('ar')[0]);
            expect(calendar.shadowRoot!.querySelector<Menu>('lms-menu')!.open).to.equal(true);
            await scan(calendar);
            await sendKeys({ press: 'Escape' });
            await settle(calendar);
            expect(calendar.shadowRoot!.querySelector<Menu>('lms-menu')!.open).to.equal(false);
            expect(calendar.shadowRoot!.activeElement).to.equal(row);
        },
    );

    scenario('scans normal English dense Day and its real all-day inspector', async () => {
        const calendar = await calendarFixture('soft', 'day', 960);
        const entry = Array.from(
            calendar
                .shadowRoot!.querySelector('lms-calendar-day')!
                .querySelectorAll<Entry>('lms-calendar-entry'),
        ).find((entry) => entry.eventId === 'conference')!;
        expect(entry).to.be.instanceOf(HTMLElement);
        await scan(calendar);
        entry.click();
        await settle(calendar);
        const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
        expect(menu.open).to.equal(true);
        expect(menu.shadowRoot!.textContent).to.include('Multi-day conference');
        await scan(calendar);
    });

    scenario('scans narrow Arabic condensed Week after toolbar navigation', async () => {
        const calendar = await calendarFixture('midnight', 'day', 360, 'ar');
        await switchView(calendar, 'week');
        const week = calendar.shadowRoot!.querySelector('lms-calendar-week')!;
        expect(week).to.be.instanceOf(HTMLElement);
        await scanExactDenseGroup(calendar, 'week');
        await scan(calendar);
    });

    scenario('scans normal English Year and the Month reached by keyboard drill', async () => {
        const calendar = await calendarFixture('brutalist', 'year', 960);
        await scan(calendar);
        const year = calendar.shadowRoot!.querySelector('lms-calendar-year')!;
        const button = year.shadowRoot!.querySelector<HTMLButtonElement>(
            `button[data-date="${key}"]`,
        )!;
        button.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(calendar.viewMode).to.equal('month');
        expect(calendar.activeDate).to.deep.equal(date);
        const month = calendar.shadowRoot!.querySelector('lms-calendar-month')!;
        expect(month.shadowRoot!.activeElement).to.equal(
            month.shadowRoot!.querySelector(`button[data-date="${key}"]`),
        );
        await scan(calendar);
    });
});
