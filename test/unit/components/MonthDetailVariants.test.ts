import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';

import type Menu from '../../../src/components/Menu.js';
import type Month from '../../../src/components/Month.js';
import { getMessageFormatters } from '../../../src/lib/messages.js';
import type Calendar from '../../../src/lms-calendar.js';
import type { MonthAgendaPresentation } from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = { year: 2026, month: 11, day: 17 };
const residency = (id = 'residency'): CalendarEntry => ({
    id,
    heading: `Artist ${id}`,
    kind: 'all-day',
    date: { start: { ...date, day: 13 }, end: { ...date, day: 23 } },
});
const timed = (id: number): CalendarEntry => ({
    id: `event-${id}`,
    heading: `Event ${id}`,
    kind: 'timed',
    date: { start: date, end: date },
    time: { start: { hour: 9, minute: id % 60 }, end: { hour: 10, minute: id % 60 } },
});
async function settle(calendar: Calendar) {
    for (let i = 0; i < 6; i++) {
        await calendar.updateComplete;
        for (const child of calendar.shadowRoot!.querySelectorAll<
            HTMLElement & { updateComplete?: Promise<boolean> }
        >('*'))
            if (child.updateComplete) await child.updateComplete;
        await nextFrame();
    }
}
async function make(entries: CalendarEntry[], policy: MonthAgendaPresentation, width = 358) {
    const calendar = await fixture<Calendar>(
        html`<lms-calendar locale="en" style=${`width:${width}px;height:720px`} .entries=${entries} .activeDate=${date} view-mode="month" month-presentation="presence" .monthAgendaPresentation=${policy}></lms-calendar>`,
    );
    await settle(calendar);
    return calendar;
}
const month = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector<Month>('lms-calendar-month')!;
const rows = (calendar: Calendar) =>
    [...calendar.shadowRoot!.querySelectorAll<HTMLButtonElement>('.agenda-event')].filter((row) =>
        row.checkVisibility(),
    );
const disclosure = (calendar: Calendar) =>
    calendar.shadowRoot!.querySelector<HTMLButtonElement>('.agenda-toggle')!;

async function mouseClick(element: HTMLElement) {
    element.scrollIntoView({ block: 'center', inline: 'center' });
    await nextFrame();
    const rect = element.getBoundingClientRect();
    await sendMouse({
        type: 'click',
        position: [Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2)],
    });
}

describe('Shorter selected-date Month lists', () => {
    for (const policy of ['preview', 'on-demand'] as const) {
        for (const width of [358, 1000]) {
            it(`discloses the same complete rows without duplicate visible entries (${policy}, ${width}px)`, async () => {
                const supplied = [residency(), ...Array.from({ length: 7 }, (_, i) => timed(i))];
                const calendar = await make(supplied, policy, width);
                const range = JSON.stringify(calendar.visibleRange);
                const control = disclosure(calendar);
                expect(disclosure(calendar).getAttribute('aria-expanded') === 'true').to.equal(
                    false,
                );
                expect(rows(calendar)).to.have.length(policy === 'preview' ? 3 : 0);
                expect(control.querySelector('.when-closed')!.textContent).to.equal(
                    getMessageFormatters('en').agendaAction(false, policy === 'preview'),
                );
                expect(control.getBoundingClientRect().height).to.be.at.least(44);
                control.focus();
                await sendKeys({ press: 'Enter' });
                await settle(calendar);
                expect(disclosure(calendar).getAttribute('aria-expanded') === 'true').to.equal(
                    true,
                );
                expect(rows(calendar)).to.have.length(8);
                expect(rows(calendar).map((row) => row.dataset.eventId)).to.have.members(
                    supplied.map((entry) => entry.id),
                );
                expect(calendar.shadowRoot!.activeElement).to.equal(control);
                expect(
                    [...calendar.shadowRoot!.querySelectorAll<HTMLElement>('.agenda-group')].filter(
                        (group) => group.checkVisibility(),
                    ),
                ).to.have.length(1);
                expect(calendar.viewMode).to.equal('month');
                expect(JSON.stringify(calendar.visibleRange)).to.equal(range);
                const frame =
                    calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-container')!;
                expect(frame.scrollHeight).to.be.at.most(frame.clientHeight + 1);
                expect(
                    getComputedStyle(month(calendar).shadowRoot!.querySelector('.month')!)
                        .overflowY,
                ).to.equal('visible');
                await sendKeys({ press: ' ' });
                await settle(calendar);
                expect(disclosure(calendar).getAttribute('aria-expanded') === 'true').to.equal(
                    false,
                );
                expect(rows(calendar)).to.have.length(policy === 'preview' ? 3 : 0);
                expect(calendar.shadowRoot!.activeElement).to.equal(control);
            });
        }

        it(`retains the 50-row bound, continues on request, and resets on date changes (${policy})`, async () => {
            const calendar = await make(
                Array.from({ length: 90 }, (_, i) => timed(i)),
                policy,
            );
            const original = disclosure(calendar);
            expect(calendar.shadowRoot!.querySelectorAll('.agenda-event').length).to.be.at.most(53);
            original.click();
            await settle(calendar);
            expect(rows(calendar)).to.have.length(50);
            calendar.shadowRoot!.querySelector<HTMLButtonElement>('.agenda-more')!.click();
            await settle(calendar);
            expect(disclosure(calendar)).to.equal(original);
            expect(original.getAttribute('aria-expanded') === 'true').to.equal(true);
            expect(rows(calendar)).to.have.length(90);
            calendar.activeDate = { ...date, day: 20 };
            await settle(calendar);
            expect(rows(calendar)).to.have.length(0);
            expect(calendar.shadowRoot!.querySelector('.agenda-toggle')).to.equal(null);
            calendar.activeDate = { ...date };
            await settle(calendar);
            expect(disclosure(calendar).getAttribute('aria-expanded') === 'true').to.equal(false);
            disclosure(calendar).click();
            await settle(calendar);
            expect(rows(calendar)).to.have.length(50);
        });

        it(`keeps canonical activation/export and actual row focus return inside an open disclosure (${policy})`, async () => {
            const supplied = Array.from({ length: 7 }, (_, i) => timed(i));
            const calendar = await make(supplied, policy);
            const details = disclosure(calendar);
            details.click();
            await settle(calendar);
            const row = rows(calendar).find((row) => row.dataset.eventId === 'event-6')!;
            await mouseClick(row);
            await settle(calendar);
            const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
            expect(menu.open).to.equal(true);
            expect(menu.eventDetails.entry).to.equal(supplied[6]);
            let exported = false;
            calendar.addEventListener('export-entry', (event) => {
                exported = true;
                expect(event.detail.entry).to.equal(supplied[6]);
                event.preventDefault();
            });
            menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
            expect(exported).to.equal(true);
            await sendKeys({ press: 'Escape' });
            await settle(calendar);
            expect(details.getAttribute('aria-expanded') === 'true').to.equal(true);
            expect(calendar.shadowRoot!.activeElement).to.equal(row);
        });
    }

    it('does not add a redundant disclosure to a preview containing at most three events', async () => {
        const calendar = await make([timed(1), timed(2)], 'preview');
        expect(rows(calendar)).to.have.length(2);
        expect(calendar.shadowRoot!.querySelector('.agenda-toggle')).to.equal(null);
    });

    it('keeps the existing full-list default and normalizes an invalid attribute', async () => {
        const calendar = await make([timed(1), timed(2)], 'full');
        expect(calendar.monthAgendaPresentation).to.equal('full');
        calendar.setAttribute('month-agenda-presentation', 'invalid');
        await settle(calendar);
        expect(calendar.monthAgendaPresentation).to.equal('full');
        expect(rows(calendar)).to.have.length(2);
    });

    it('does not apply Month disclosure policy to a Day density list', async () => {
        const calendar = await make(
            Array.from({ length: 6 }, (_, i) => timed(i)),
            'on-demand',
        );
        calendar.viewMode = 'day';
        await settle(calendar);
        calendar.shadowRoot!.querySelector<HTMLButtonElement>('.time-group')!.click();
        await settle(calendar);
        expect(rows(calendar)).to.have.length(6);
        expect(calendar.shadowRoot!.querySelector('.agenda-toggle')).to.equal(null);
    });
});

describe('Simpler Month continuity without a layout restructure', () => {
    const geometry = (view: Month) =>
        [...view.shadowRoot!.querySelectorAll<HTMLElement>('.weekdays, .week, .indicator')].map(
            (element) => {
                const { x, y, width, height } = element.getBoundingClientRect();
                return [x, y, width, height];
            },
        );

    for (const [width, font, dir] of [
        [358, 16, 'ltr'],
        [600, 16, 'ltr'],
        [358, 24, 'rtl'],
        [1000, 24, 'rtl'],
    ] as const) {
        it(`preserves every week/date position with or without markers (${width}px, ${font}px ${dir})`, async () => {
            const calendar = await make(
                [
                    residency(),
                    ...Array.from({ length: 10 }, (_, index) => residency(`overlap-${index}`)),
                ],
                'on-demand',
                width,
            );
            calendar.style.fontSize = `${font}px`;
            calendar.dir = dir;
            await settle(calendar);
            const view = month(calendar),
                populated = geometry(view);
            const height = calendar.getBoundingClientRect().height;
            const spans = view.spans;
            view.spans = [];
            await settle(calendar);
            expect(geometry(view)).to.deep.equal(populated);
            expect(calendar.getBoundingClientRect().height).to.equal(height);
            view.spans = spans;
            await settle(calendar);
            expect(geometry(view)).to.deep.equal(populated);
            expect(view.shadowRoot!.querySelectorAll('.month > .week')).to.have.length(6);
            expect(
                view.shadowRoot!.querySelectorAll('.week-spans, .week-group, details, .span-band'),
            ).to.have.length(0);
            const strip = view.shadowRoot!.querySelector<HTMLElement>('.month-strip')!;
            expect(strip.scrollHeight).to.be.at.most(strip.clientHeight + 1);
        });
    }

    for (const dir of ['ltr', 'rtl'] as const) {
        it(`connects adjacent occupied dates and gives a one-day tail an actual end cap (${dir})`, async () => {
            const calendar = await make([residency()], 'on-demand', 600);
            calendar.dir = dir;
            await settle(calendar);
            const view = month(calendar);
            const marks = [...view.shadowRoot!.querySelectorAll<HTMLElement>('.span-mark')];
            expect(marks).to.have.length(11);
            expect(marks.filter((mark) => !mark.hasAttribute('data-before'))).to.have.length(1);
            expect(marks.filter((mark) => !mark.hasAttribute('data-after'))).to.have.length(1);
            for (const day of [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]) {
                const indicator = view.shadowRoot!.querySelector<HTMLButtonElement>(
                    `.indicator[data-date="2026-11-${day}"]`,
                )!;
                const mark = indicator.querySelector<HTMLElement>('.span-mark')!;
                expect(mark).not.to.equal(null);
                expect(mark.textContent).to.equal('');
                expect(mark.closest('.span-marks')!.getAttribute('aria-hidden')).to.equal('true');
                expect(mark.hasAttribute('tabindex')).to.equal(false);
                expect(indicator.getBoundingClientRect().height).to.be.at.least(44);
                const bounds = indicator.getBoundingClientRect(),
                    box = mark.getBoundingClientRect();
                expect(box.height).to.equal(3);
                expect(box.top).to.be.at.least(
                    indicator.querySelector('.date-value')!.getBoundingClientRect().bottom,
                );
                expect(box.bottom).to.be.at.most(bounds.bottom);
                const start = dir === 'ltr' ? box.left - bounds.left : bounds.right - box.right;
                const end = dir === 'ltr' ? bounds.right - box.right : box.left - bounds.left;
                expect(start).to.be.closeTo(day === 13 ? 6 : 0, 0.1);
                expect(end).to.be.closeTo(day === 23 ? 6 : 0, 0.1);
            }
            const row = view
                .shadowRoot!.querySelector('.indicator[data-date="2026-11-17"]')!
                .closest('.week')!;
            const middle = [...row.querySelectorAll<HTMLElement>('.span-mark')]
                .map((mark) => mark.getBoundingClientRect())
                .sort((a, b) => a.x - b.x);
            for (let i = 1; i < middle.length; i++)
                expect(middle[i].left).to.be.closeTo(middle[i - 1].right, 0.1);
        });
    }

    it('keeps enlarged RTL date navigation usable on the existing horizontal axis', async () => {
        const calendar = await make([residency()], 'on-demand');
        calendar.dir = 'rtl';
        calendar.style.fontSize = '24px';
        await settle(calendar);
        const view = month(calendar);
        const strip = view.shadowRoot!.querySelector<HTMLElement>('.month-strip')!;
        expect(strip.scrollWidth).to.be.greaterThan(strip.clientWidth);
        expect(strip.scrollHeight).to.be.at.most(strip.clientHeight + 1);
        await view.focusDate({ ...date, day: 15 });
        await settle(calendar);
        const control = view.shadowRoot!.querySelector<HTMLElement>(
            '.indicator[data-date="2026-11-15"]',
        )!;
        const rect = control.getBoundingClientRect(),
            bounds = strip.getBoundingClientRect();
        expect(view.shadowRoot!.activeElement).to.equal(control);
        expect(rect.left).to.be.at.least(bounds.left - 1);
        expect(rect.right).to.be.at.most(bounds.right + 1);
    });

    it('selects a date from a marker, then inspects/exports the whole event from its readable row', async () => {
        const source = residency();
        const calendar = await make([source], 'preview', 600);
        const view = month(calendar);
        const tail = view.shadowRoot!.querySelector<HTMLElement>(
            '.indicator[data-date="2026-11-23"] .span-mark',
        )!;
        let activated = 0;
        calendar.addEventListener('entry-activate', (event) => {
            activated++;
            expect(event.detail.entry).to.equal(source);
        });
        await mouseClick(tail);
        await settle(calendar);
        expect(calendar.activeDate).to.deep.equal({ ...date, day: 23 });
        expect(calendar.viewMode).to.equal('month');
        expect(activated).to.equal(0); // A thin decoration is not an event-sized hit target.
        const row = rows(calendar)[0];
        expect(row.textContent).to.include(source.heading).and.include('13').and.include('23');
        await mouseClick(row);
        await settle(calendar);
        expect(activated).to.equal(1);
        const menu = calendar.shadowRoot!.querySelector<Menu>('lms-menu')!;
        expect(menu.open).to.equal(true);
        expect(menu.eventDetails.entry).to.equal(source);
        let exported = false;
        calendar.addEventListener('export-entry', (event) => {
            exported = true;
            expect(event.detail.entry).to.equal(source);
            expect(event.detail.eventId).to.equal(source.id);
            event.preventDefault();
        });
        menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        expect(exported).to.equal(true);
        await sendKeys({ press: 'Escape' });
        await settle(calendar);
        expect(calendar.shadowRoot!.activeElement).to.equal(row);
    });

    it('bounds decorations and keeps every overlapped event reachable through the selected-date list', async () => {
        const supplied = Array.from({ length: 53 }, (_, index) => residency(`span-${index}`));
        const calendar = await make(supplied, 'on-demand', 600);
        const view = month(calendar);
        const indicator = view.shadowRoot!.querySelector<HTMLElement>(
            '.indicator[data-date="2026-11-17"]',
        )!;
        expect(indicator.getAttribute('aria-label')).to.include('53 events');
        const countLabel = indicator.querySelector<HTMLElement>('.activity[data-count-summary]')!;
        expect(parseFloat(getComputedStyle(countLabel).fontSize)).to.be.at.least(12);
        expect(countLabel.getBoundingClientRect().bottom).to.be.at.most(
            indicator.getBoundingClientRect().bottom,
        );

        expect(indicator.querySelectorAll('.span-mark')).to.have.length(0);
        expect(indicator.querySelector('.activity[data-count-summary]')!.textContent).to.equal(
            '53',
        );
        expect(indicator.querySelectorAll('.span-overflow, button button')).to.have.length(0);
        expect(view.shadowRoot!.querySelectorAll('.span-mark')).to.have.length(0);
        expect(
            view.shadowRoot!.querySelectorAll('.activity[data-count-summary][data-active]'),
        ).to.have.length(11);
        expect(view.shadowRoot!.querySelectorAll('details, .span-band')).to.have.length(0);
        const scroll = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
        const clientLeft = () => scroll.getBoundingClientRect().left + scroll.clientLeft;
        const left = clientLeft();
        const width = scroll.clientWidth;
        const before = geometry(view);
        expect(scroll.scrollHeight).to.equal(scroll.clientHeight);
        disclosure(calendar).click();
        await settle(calendar);
        expect(rows(calendar)).to.have.length(50);
        calendar.shadowRoot!.querySelector<HTMLButtonElement>('.agenda-more')!.click();
        await settle(calendar);
        expect(rows(calendar)).to.have.length(53);
        expect(rows(calendar).map((row) => row.dataset.eventId)).to.have.members(
            supplied.map((entry) => entry.id),
        );
        expect(scroll.scrollHeight).to.be.greaterThan(scroll.clientHeight);
        // A classic scrollbar can consume space as the shared view starts scrolling.
        // The grid must keep its vertical geometry and fill the new width proportionally.
        const after = geometry(view);
        const scale = scroll.clientWidth / width;
        const nextLeft = clientLeft();
        const tolerance = scale === 1 ? 0 : 0.05; // Only allow fractional track rounding.
        expect(after).to.have.length(before.length);
        before.forEach(([x, y, w, h], index) => {
            const [nextX, nextY, nextW, nextH] = after[index];
            expect([nextY, nextH]).to.deep.equal([y, h]);
            expect(nextX).to.be.closeTo(nextLeft + (x - left) * scale, tolerance);
            expect(nextW).to.be.closeTo(w * scale, tolerance);
        });
        disclosure(calendar).click();
        await settle(calendar);
        expect(geometry(view)).to.deep.equal(before);
    });

    it('keeps one count vocabulary across the Month even after concurrency falls', async () => {
        const supplied = [17, 18, 23].map((end, index) => ({
            ...residency(`${index}-overlap`),
            date: { start: { ...date, day: 16 }, end: { ...date, day: end } },
        }));
        const calendar = await make(supplied, 'preview', 600);
        const view = month(calendar);
        const early = view.shadowRoot!.querySelector('.indicator[data-date="2026-11-17"]')!;
        expect(early.querySelector('.activity[data-count-summary]')!.textContent).to.equal('3');
        expect(view.shadowRoot!.querySelectorAll('.span-mark')).to.have.length(0);
        for (const day of [19, 20, 21, 22, 23]) {
            const control = view.shadowRoot!.querySelector<HTMLElement>(
                `.indicator[data-date="2026-11-${day}"]`,
            )!;
            expect(control.querySelector('.activity[data-count-summary]')!.textContent).to.equal(
                '1',
            );
            expect(control.getAttribute('aria-label')).to.include('1 event');
        }
    });

    it('ends a timed midnight-exclusive span on the last occupied date, not its canonical end date', async () => {
        const source: CalendarEntry = {
            ...residency(),
            kind: 'timed',
            date: { start: { ...date, day: 16 }, end: { ...date, day: 18 } },
            time: { start: { hour: 23, minute: 0 }, end: { hour: 0, minute: 0 } },
        };
        const calendar = await make([source], 'preview');
        const view = month(calendar);
        expect(view.shadowRoot!.querySelectorAll('.span-mark')).to.have.length(2);
        expect(
            view
                .shadowRoot!.querySelector('.indicator[data-date="2026-11-17"] .span-mark')!
                .hasAttribute('data-after'),
        ).to.equal(false);
        expect(
            view.shadowRoot!.querySelector('.indicator[data-date="2026-11-18"] .span-mark'),
        ).to.equal(null);
        await mouseClick(rows(calendar)[0]);
        await settle(calendar);
        expect(calendar.shadowRoot!.querySelector<Menu>('lms-menu')!.eventDetails.entry).to.equal(
            source,
        );
        expect(source.date.end).to.deep.equal({ ...date, day: 18 });
    });

    it('preserves cancelable canonical activation on the readable row after keyboard date selection', async () => {
        const source = residency();
        const calendar = await make([source], 'preview');
        const view = month(calendar);
        await view.focusDate({ ...date, day: 23 });
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(calendar.activeDate.day).to.equal(23);
        let activated = 0;
        calendar.addEventListener('entry-activate', (event) => {
            activated++;
            expect(event.detail.entry).to.equal(source);
            event.preventDefault();
        });
        const row = rows(calendar)[0];
        row.focus();
        await sendKeys({ press: 'Enter' });
        await settle(calendar);
        expect(activated).to.equal(1);
        expect(calendar.shadowRoot!.querySelector<Menu>('lms-menu')!.open).to.equal(false);
    });
});
