import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys, setViewport } from '@web/test-runner-commands';

import '../../../src/lms-calendar.ts';
import type Menu from '../../../src/components/Menu.ts';
import type Month from '../../../src/components/Month.ts';
import type Calendar from '../../../src/lms-calendar.ts';

const date = { year: 2026, month: 6, day: 15 };
const settle = async () => {
    for (let index = 0; index < 4; index++) await nextFrame();
};

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
        await settle();
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
            await settle();
            const short =
                calendar.shadowRoot!.querySelector<HTMLElement>('[data-event-id="short"]')!;
            // The outer display floor must include the text line's padding and
            // borders, not merely the smaller declared CSS min-height.
            expect(short.getBoundingClientRect().height).to.be.greaterThan(
                parseFloat(getComputedStyle(short).minHeight),
            );
            for (const id of ['short', 'all-day']) {
                const entry = calendar.shadowRoot!.querySelector<HTMLElement>(
                    `[data-event-id="${id}"]`,
                )!;
                const box = entry.getBoundingClientRect();
                const title = entry.shadowRoot!.querySelector('.title')!.getBoundingClientRect();
                expect(title.width, `${id}: visible title space`).to.be.at.least(24);
                expect(title.left).to.be.at.least(box.left);
                expect(title.right).to.be.at.most(box.right);
                expect(title.top).to.be.at.least(box.top);
                expect(title.bottom).to.be.at.most(box.bottom);
                const time = entry.shadowRoot!.querySelector('.time');
                if (time && getComputedStyle(time).display !== 'none') {
                    const interval = time.getBoundingClientRect();
                    expect(interval.top).to.be.at.least(box.top);
                    expect(interval.bottom).to.be.at.most(box.bottom);
                }
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

    it('keeps ordinary mobile Week titles beside their own times and keyboard-opens full details', async () => {
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
        await settle();
        const sync = calendar.shadowRoot!.querySelector<HTMLElement>('[data-event-id="sync"]')!;
        const box = sync.getBoundingClientRect();
        const title = sync.shadowRoot!.querySelector('.title')!.getBoundingClientRect();
        const time = sync.shadowRoot!.querySelector('.time')!.getBoundingClientRect();
        expect(title.width, 'Team sync must not disappear behind its time').to.be.at.least(24);
        expect(title.right).to.be.at.most(box.right);
        expect(time.top).to.be.at.least(title.bottom);
        expect(time.bottom).to.be.at.most(box.bottom);
        expect(sync.getAttribute('aria-label')).to.include('Team sync');
        sync.focus();
        await sendKeys({ press: 'Enter' });
        const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
        await waitUntil(() => menu.open);
        expect(menu.eventDetails.heading).to.equal('Team sync');
    });

    it('keeps enlarged mobile cells and counts intact, scrolls in two dimensions and drills with the keyboard', async () => {
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
            html`<lms-calendar .activeDate=${date} .entries=${entries} style="width:358px;height:660px"></lms-calendar>`,
        );
        await settle();
        const toolbar = calendar.shadowRoot!.querySelector('lms-calendar-header')!.shadowRoot!;
        const controls = [...toolbar.querySelectorAll('.context button')].map((button) =>
            button.getBoundingClientRect(),
        );
        expect(controls[0].top).to.equal(controls[1].top);
        expect(controls[2].top).to.equal(controls[3].top);
        expect(controls[2].top).to.be.at.least(controls[0].bottom);
        const month = calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
        const grid = month.shadowRoot!.querySelector<HTMLElement>('.month')!;
        await waitUntil(
            () =>
                !month.shadowRoot!.querySelector<HTMLButtonElement>(
                    '.day[data-date="2026-6-15"] .summary',
                )!.hidden,
        );
        expect(grid.scrollWidth).to.be.greaterThan(grid.clientWidth);
        const summary = month.shadowRoot!.querySelector<HTMLButtonElement>(
            '.day[data-date="2026-6-15"] .summary',
        )!;
        const cell = summary.closest('.day')!.getBoundingClientRect();
        const count = summary.getBoundingClientRect();
        expect(getComputedStyle(summary).fontSize).to.equal('24px');
        expect(count.right).to.be.at.most(cell.right);
        expect(count.bottom).to.be.at.most(cell.bottom);
        await month.focusDate({ ...date, day: 20 });
        expect(grid.scrollLeft).to.be.greaterThan(0);
        await sendKeys({ press: 'ArrowRight' });
        await sendKeys({ press: ' ' });
        await calendar.updateComplete;
        expect(calendar.viewMode).to.equal('day');
        expect(calendar.activeDate).to.deep.equal({ ...date, day: 21 });
        await waitUntil(() => !!calendar.shadowRoot!.querySelector('lms-calendar-entry'));
        const rendered = calendar.shadowRoot!.querySelector('lms-calendar-entry')!;
        expect(getComputedStyle(rendered).fontSize).to.equal('24px');
        expect(rendered.getBoundingClientRect().height).to.be.at.least(24);
    });
});
