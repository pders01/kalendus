import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import '../../../src/components/Day.ts';
import '../../../src/components/Week.ts';
import '../../../src/components/Entry.ts';
import type Day from '../../../src/components/Day.ts';
import type Entry from '../../../src/components/Entry.ts';
import type Week from '../../../src/components/Week.ts';
import { formatLocalizedTime, formatLocalizedTimeRange } from '../../../src/lib/localization.js';
import { ensureLocale } from '../../../src/lib/messages.js';

const date = { year: 2026, month: 6, day: 15 };
const time = { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 5 } };
const typography =
    '--entry-font-size:16px;--entry-line-height:1.25;--entry-padding:0.15em 0.3em;--entry-time-font-size:0.85em;--entry-title-wrap:nowrap';
const settle = async () => {
    for (let i = 0; i < 4; i++) await nextFrame();
};

function inside(child: Element, parent: Element) {
    const a = child.getBoundingClientRect();
    const b = parent.getBoundingClientRect();
    expect(a.left).to.be.at.least(b.left - 0.5);
    expect(a.right).to.be.at.most(b.right + 0.5);
    expect(a.top).to.be.at.least(b.top - 0.5);
    expect(a.bottom).to.be.at.most(b.bottom + 0.5);
}

async function grid(view: 'day' | 'week', fontSize = 16, dir = 'ltr') {
    const wrapper = await fixture<HTMLDivElement>(
        html`
            <div></div>
        `,
    );
    const el = document.createElement(`lms-calendar-${view}`) as Day | Week;
    el.activeDate = date;
    el.dir = dir;
    el.style.cssText = `width:800px;height:500px;font-size:${fontSize}px;--calendar-grid-columns-day:100px minmax(0,1fr);--calendar-grid-columns-week:100px repeat(7,minmax(0,1fr));--hour-indicator-font-size:0.8125em;--scroll-snap-type:y mandatory;--day-scroll-snap-type:y mandatory;--week-scroll-snap-type:y mandatory;--indicator-top:-5em`;
    wrapper.append(el);
    await el.updateComplete;
    await settle();
    return el;
}

describe('Free scrolling and bounded entry presentation', () => {
    for (const view of ['day', 'week'] as const) {
        it(`${view} ignores retired snap tokens and keeps arbitrary native scroll positions`, async () => {
            const el = await grid(view);
            const scroller = el.shadowRoot!.querySelector<HTMLElement>(
                view === 'day' ? '.main' : '.week-scroll',
            )!;
            expect(getComputedStyle(scroller).scrollSnapType).to.equal('none');
            expect(el.shadowRoot!.querySelector('.snap-target')).to.equal(null);
            for (const label of el.shadowRoot!.querySelectorAll('.hour-label')) {
                expect(getComputedStyle(label).scrollSnapAlign).to.equal('none');
                expect(getComputedStyle(label).scrollSnapStop).to.equal('normal');
            }
            const wheel = new WheelEvent('wheel', {
                deltaY: 37,
                bubbles: true,
                cancelable: true,
                composed: true,
            });
            scroller.dispatchEvent(wheel);
            expect(wheel.defaultPrevented).to.equal(false);
            scroller.scrollTop = 137;
            // Allow any former delayed wheel/scroll snapping to run, not just Lit's update.
            for (let frame = 0; frame < 24; frame++) await nextFrame();
            expect(scroller.scrollTop).to.be.closeTo(137, 1);
            scroller.focus();
            expect(el.shadowRoot!.activeElement).to.equal(scroller);
            await sendKeys({ press: 'PageDown' });
            for (let frame = 0; frame < 24; frame++) await nextFrame();
            expect(scroller.scrollTop).to.be.greaterThan(137);
        });

        for (const fontSize of [16, 32]) {
            it(`${view} budgets the midnight line box without shifting minute geometry (${fontSize}px, RTL)`, async () => {
                const el = await grid(view, fontSize, 'rtl');
                const scroller = el.shadowRoot!.querySelector<HTMLElement>(
                    view === 'day' ? '.main' : '.week-scroll',
                )!;
                const column = el.shadowRoot!.querySelector<HTMLElement>(
                    view === 'day' ? '.timed-content' : '.day-column',
                )!;
                const labels = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.hour-label')];
                const first = labels[0].querySelector('.indicator')!;
                expect(scroller.scrollTop, 'initial midnight scroll position').to.equal(0);
                inside(first, scroller);
                const labelBox = first.getBoundingClientRect();
                const origin = column.getBoundingClientRect().top;
                const padding = parseFloat(getComputedStyle(scroller).paddingTop);
                expect(padding).to.be.closeTo(labelBox.height / 2, 0.1);
                expect(origin).to.be.closeTo(scroller.getBoundingClientRect().top + padding, 0.5);
                expect((labelBox.top + labelBox.bottom) / 2).to.be.closeTo(origin, 0.5);
                const minute = parseFloat(getComputedStyle(el).getPropertyValue('--minute-height'));
                expect(
                    labels[12].getBoundingClientRect().top - labels[0].getBoundingClientRect().top,
                ).to.be.closeTo(720 * minute, 0.5);
                const entry = document.createElement('lms-calendar-entry') as Entry;
                entry.slot = view === 'day' ? 'timed' : 'timed-2026-6-15';
                entry.heading = 'At nine';
                entry.time = time;
                entry.style.cssText = `position:absolute;top:calc(540 * var(--minute-height));height:50px;${typography}`;
                el.append(entry);
                await entry.updateComplete;
                expect(entry.getBoundingClientRect().top - origin).to.be.closeTo(540 * minute, 0.5);
                scroller.scrollTop = scroller.scrollHeight;
                await settle();
                inside(labels[24].querySelector('.indicator')!, scroller);
            });
        }
    }

    for (const locale of ['en', 'de', 'ar']) {
        for (const density of ['compact', 'standard', 'full'] as const) {
            it(`shows a complete five-minute range at the minimum preview size (${locale}, ${density})`, async () => {
                await ensureLocale(locale);
                const canonical: CalendarEntry = {
                    id: 'five-minutes',
                    heading: 'Quick',
                    date: { start: date, end: date },
                    time,
                };
                const el =
                    await fixture<Entry>(html`<lms-calendar-entry heading="Quick" .time=${time} .canonicalEntry=${canonical}
                    .density=${density} .locale=${locale} dir=${locale === 'ar' ? 'rtl' : 'ltr'} data-height="compact"
                    style=${`${typography};width:220px;height:50px;--entry-compact-show-time:none`}
                ></lms-calendar-entry>`);
                await settle();
                const title = el.shadowRoot!.querySelector('.title')!;
                const metadata = el.shadowRoot!.querySelector<HTMLElement>('.time')!;
                expect(metadata.textContent).to.equal(formatLocalizedTimeRange(9, 0, 9, 5, locale));
                expect(getComputedStyle(metadata).display).not.to.equal('none');
                expect(getComputedStyle(metadata).whiteSpace).to.equal('nowrap');
                expect(parseFloat(getComputedStyle(metadata).fontSize)).to.be.at.least(12);
                expect(metadata.scrollWidth).to.be.at.most(metadata.clientWidth + 1);
                inside(title, el);
                inside(metadata, el);
                expect(el.getAttribute('aria-label')).to.include('Quick');
                expect(el.getAttribute('aria-label')).to.include(
                    formatLocalizedTimeRange(9, 0, 9, 5, locale),
                );
                let opened: CalendarEntry | undefined;
                el.addEventListener('open-menu', (event) => {
                    opened = (event as CustomEvent).detail.entry;
                });
                el.click();
                expect(opened).to.equal(canonical);
            });
        }
    }

    for (const dir of ['ltr', 'rtl']) {
        it(`clusters title and range in a wide Day card (${dir})`, async () => {
            const el =
                await fixture<Entry>(html`<lms-calendar-entry heading="Quick" .time=${time} dir=${dir}
                style=${`${typography};width:1200px;height:50px;--entry-layout:row`}
            ></lms-calendar-entry>`);
            await settle();
            const title = el.shadowRoot!.querySelector('.title')!.getBoundingClientRect();
            const metadata = el.shadowRoot!.querySelector('.time')!.getBoundingClientRect();
            const gap = dir === 'rtl' ? title.left - metadata.right : metadata.left - title.right;
            expect(gap).to.be.at.least(0);
            expect(gap).to.be.at.most(10);
            expect(Math.abs(title.top - metadata.top)).to.be.lessThan(10);
        });

        for (const mode of ['month-dot', 'month-span'] as const) {
            it(`keeps ${mode} text inside adjacent 24px Month rows (${dir})`, async () => {
                const wrapper =
                    await fixture<HTMLDivElement>(html`<div dir=${dir} style="display:grid;grid-template-rows:repeat(2,24px);width:130px">
                    ${[0, 1].map(
                        () => html`<lms-calendar-entry
                        heading="Long title that must ellipsize, never wrap into the next allocated row"
                        .time=${time} .displayMode=${mode} .density=${'standard'} data-height="full"
                        style=${`${typography};width:100%;height:100%;--entry-title-wrap:normal;--entry-layout:column;--entry-min-height:40px;--entry-month-padding:0`}
                    ></lms-calendar-entry>`,
                    )}
                </div>`);
                await settle();
                const entries = [...wrapper.querySelectorAll<Entry>('lms-calendar-entry')];
                for (const entry of entries) {
                    expect(entry.getBoundingClientRect().height).to.equal(24);
                    const main = entry.shadowRoot!.querySelector('.main')!;
                    const title = main.querySelector<HTMLElement>('.title')!;
                    inside(main, entry);
                    inside(title, entry);
                    expect(getComputedStyle(main).flexWrap).to.equal('nowrap');
                    expect(getComputedStyle(title).whiteSpace).to.equal('nowrap');
                    expect(getComputedStyle(title).textOverflow).to.equal('ellipsis');
                    expect(title.scrollWidth).to.be.greaterThan(title.clientWidth);
                    const metadata = main.querySelector<HTMLElement>('.time');
                    if (mode === 'month-dot') {
                        expect(metadata!.textContent).to.equal(formatLocalizedTime(9, 0, 'en'));
                        expect(metadata!.scrollWidth).to.be.at.most(metadata!.clientWidth + 1);
                        inside(metadata!, entry);
                    }
                }
                expect(entries[0].getBoundingClientRect().bottom).to.equal(
                    entries[1].getBoundingClientRect().top,
                );
            });
        }
    }
});
