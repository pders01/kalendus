import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';

import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = { year: 2026, month: 11, day: 15 };
const event = (id: string, hour = 8): CalendarEntry => ({
    id,
    heading: id,
    kind: 'timed',
    content: 'Real supplied event',
    date: { start: date, end: date },
    time: { start: { hour, minute: 0 }, end: { hour: hour + 1, minute: 0 } },
});
async function settle(c: Calendar) {
    for (let n = 0; n < 5; n++) {
        await c.updateComplete;
        for (const e of c.shadowRoot!.querySelectorAll<
            HTMLElement & { updateComplete?: Promise<boolean> }
        >('*')) {
            if (e.updateComplete) await e.updateComplete;
        }
        await nextFrame();
    }
}
async function make(
    width = 358,
    entries: CalendarEntry[] = [],
    mode: 'month' | 'week' | 'day' = 'month',
) {
    const c =
        await fixture<Calendar>(html`<lms-calendar locale="en" style=${`width:${width}px;height:720px`}
        .activeDate=${date} .entries=${entries} .viewMode=${mode}></lms-calendar>`);
    await settle(c);
    return c;
}
const grid = (c: Calendar) =>
    c.shadowRoot!.querySelector<HTMLElement>('lms-calendar-day, lms-calendar-week')!;
const scroller = (c: Calendar) =>
    grid(c).shadowRoot!.querySelector<HTMLElement>('.main, .week-scroll')!;
const scale = (c: Calendar) =>
    parseFloat(getComputedStyle(grid(c)).getPropertyValue('--minute-height'));

describe('Calendar review corrections: flow, orientation and truthful disclosure', () => {
    it('paints current-day text against a supported opaque contrast surface', async () => {
        const c = await make();
        const m = c.shadowRoot!.querySelector('lms-calendar-month')!;
        const today = m.shadowRoot!.querySelector<HTMLElement>('.current .date-value');
        // The live current date need not be in this fixed fixture month.
        const control = today ?? m.shadowRoot!.querySelector<HTMLElement>('.date-value')!;
        control.parentElement!.classList.add('current');
        const style = getComputedStyle(control);
        expect(style.backgroundColor).not.to.equal('rgba(0, 0, 0, 0)');
        expect(style.color).not.to.equal(style.backgroundColor);
        expect(
            CSS.supports(
                'background-color',
                getComputedStyle(c).getPropertyValue('--current-day-bg').trim(),
            ),
        ).to.equal(true);
    });

    for (const width of [358, 1100]) {
        it(`does not make fitting Month content scroll at ${width}px`, async () => {
            const c = await make(width);
            const container = c.shadowRoot!.querySelector<HTMLElement>('.calendar-container')!;
            const region = c.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
            const m = c.shadowRoot!.querySelector('lms-calendar-month')!;
            const month = m.shadowRoot!.querySelector<HTMLElement>('.month')!;
            for (const e of [container, region, month]) {
                expect(e.scrollHeight, e.className).to.be.at.most(e.clientHeight + 1);
                expect(e.scrollWidth, e.className).to.be.at.most(e.clientWidth + 1);
            }
        });
    }

    it('lets an unsized contextual Month list grow the host and push following content down', async () => {
        const wrap = await fixture<HTMLDivElement>(html`<div>
            <lms-calendar locale="en" style="width:358px" .activeDate=${date}
                .entries=${Array.from({ length: 40 }, (_, i) => event(String(i)))}></lms-calendar>
            <p class="following">Following document content</p>
        </div>`);
        const c = wrap.querySelector<Calendar>('lms-calendar')!;
        await settle(c);
        const list = c.shadowRoot!.querySelector<HTMLElement>('.date-agenda')!;
        const last = [...list.querySelectorAll('.agenda-event')].at(-1)!;
        expect(c.getBoundingClientRect().height).to.be.greaterThan(720);
        expect(wrap.querySelector('.following')!.getBoundingClientRect().top).to.be.at.least(
            last.getBoundingClientRect().bottom,
        );
        expect(c.getBoundingClientRect().bottom).to.be.at.least(
            list.getBoundingClientRect().bottom,
        );
    });

    for (const layout of ['block', 'grid', 'flex'] as const) {
        it(`honors a supplied height across all four views without moving adjacent content (${layout})`, async () => {
            const wrap = await fixture<HTMLDivElement>(html`
                <div>
                    <div style=${`display:${layout};flex-direction:column;width:965px;height:720px`}>
                        <lms-calendar locale="en" .activeDate=${date}
                            style=${layout === 'flex' ? 'flex:1' : ''}
                            .entries=${[event('morning')]}></lms-calendar>
                    </div>
                    <p>After the calendar</p>
                </div>
            `);
            const calendar = wrap.querySelector<Calendar>('lms-calendar')!;
            const panel = calendar.parentElement!;
            const sibling = wrap.querySelector('p')!;
            const root = calendar.shadowRoot!;
            const header = root.querySelector('header')!;
            const view = root.querySelector('.calendar-view')!;
            const top = (element: Element) => element.getBoundingClientRect().top;
            await settle(calendar);
            const toolbarTop = top(header);
            const viewTop = top(view);
            const siblingTop = top(sibling);
            for (const mode of ['week', 'year', 'day', 'month'] as const) {
                calendar.viewMode = mode;
                await settle(calendar);
                expect(calendar.getBoundingClientRect().height).to.equal(panel.clientHeight);
                expect(top(header)).to.be.closeTo(toolbarTop, 0.5);
                expect(top(view)).to.be.closeTo(viewTop, 0.5);
                expect(top(sibling)).to.be.closeTo(siblingTop, 0.5);
                expect(view.getBoundingClientRect().bottom).to.be.closeTo(
                    panel.getBoundingClientRect().bottom - 1,
                    0.5,
                );
            }
        });
    }

    it('scrolls a long Month list inside the supplied height and keeps the last event reachable', async () => {
        const calendar = await make(
            358,
            Array.from({ length: 40 }, (_, i) => event(String(i))),
        );
        const region = calendar.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
        const last = [...region.querySelectorAll<HTMLButtonElement>('.agenda-event')].at(-1)!;
        expect(calendar.getBoundingClientRect().height).to.equal(720);
        expect(region.scrollHeight).to.be.greaterThan(region.clientHeight);
        last.focus();
        await settle(calendar);
        expect(calendar.shadowRoot!.activeElement).to.equal(last);
        expect(region.scrollTop).to.be.greaterThan(0);
        expect(last.getBoundingClientRect().bottom).to.be.at.most(
            region.getBoundingClientRect().bottom + 1,
        );
    });

    it('preserves the semantic time anchor through Day → Week → Day without snapping', async () => {
        const c = await make(1100, [event('morning')], 'day');
        scroller(c).scrollTop = 480 * scale(c);
        const minute = scroller(c).scrollTop / scale(c);
        for (const mode of ['week', 'day'] as const) {
            c.shadowRoot!.querySelector('lms-calendar-header')!
                .shadowRoot!.querySelector<HTMLButtonElement>(`[data-context="${mode}"]`)!
                .click();
            await settle(c);
            expect(c.viewMode).to.equal(mode);
            expect(getComputedStyle(scroller(c)).scrollSnapType).to.equal('none');
            expect(scroller(c).scrollTop / scale(c)).to.be.closeTo(minute, 2);
        }
    });

    it('opens exactly the advertised overlap group, not all events for its date', async () => {
        const c = await make(
            358,
            [event('first'), event('second'), event('third'), event('later', 14)],
            'week',
        );
        await waitUntil(() => !!c.shadowRoot!.querySelector('.time-group'));
        const button = c.shadowRoot!.querySelector<HTMLButtonElement>('.time-group')!;
        expect(button.textContent).to.include('3 events');
        button.click();
        await settle(c);
        const rows = [...c.shadowRoot!.querySelectorAll('.agenda-event')];
        expect(rows).to.have.length(3);
        expect(rows.map((row) => row.querySelector('.agenda-title')!.textContent)).to.deep.equal([
            'first',
            'second',
            'third',
        ]);
        expect(c.shadowRoot!.querySelector('.date-agenda')!.textContent).not.to.include('later');
        expect(c.shadowRoot!.querySelectorAll('.agenda-count')[1].textContent).to.equal('3 events');
        for (const row of rows)
            expect(row.querySelector('.agenda-time')!.textContent).to.include('9:00');
    });

    it('keeps a solitary event readable with deliberate horizontal panning in a tiny embed', async () => {
        const c = await make(120, [event('single')], 'day');
        const region = c.shadowRoot!.querySelector<HTMLElement>('.calendar-view')!;
        expect(region.scrollWidth).to.be.greaterThan(region.clientWidth);
        expect(getComputedStyle(region).overflowX).to.equal('auto');
        const entry = c.shadowRoot!.querySelector('lms-calendar-entry')!;
        expect(entry.getBoundingClientRect().width).to.be.at.least(128);
        const main = entry.shadowRoot!.querySelector<HTMLElement>('.main')!;
        expect(main.scrollHeight).to.be.at.most(entry.getBoundingClientRect().height + 2);
    });
});
