import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { sendKeys, setViewport } from '@web/test-runner-commands';

import '../../../src/components/Entry.ts';
import '../../../src/components/Day.ts';
import '../../../src/components/Week.ts';
import type Day from '../../../src/components/Day.ts';
import type Entry from '../../../src/components/Entry.ts';
import type Week from '../../../src/components/Week.ts';
import { LayoutCalculator } from '../../../src/lib/LayoutCalculator.js';
import {
    formatLocalizedDate,
    formatLocalizedTime,
    formatLocalizedTimeRange,
} from '../../../src/lib/localization.js';
import { ensureLocale, getMessages } from '../../../src/lib/messages.js';
import { getWeekDates } from '../../../src/lib/weekStartHelper.js';

const date = { year: 2026, month: 6, day: 15 };
const interval = { start: date, end: date };
const time = { start: { hour: 9, minute: 30 }, end: { hour: 11, minute: 0 } };
const settle = async () => {
    await nextFrame();
    await nextFrame();
    await nextFrame();
};
const entryStyle =
    '--entry-font-size:16px;--entry-line-height:1.25;--entry-padding:0.15em 0.3em;--entry-gap:0.25em;--entry-time-font-size:0.85em;--entry-title-wrap:nowrap';

function expectInside(child: Element, parent: Element) {
    const inner = child.getBoundingClientRect();
    const outer = parent.getBoundingClientRect();
    expect(inner.left).to.be.at.least(outer.left - 0.5);
    expect(inner.right).to.be.at.most(outer.right + 0.5);
    expect(inner.top).to.be.at.least(outer.top - 0.5);
    expect(inner.bottom).to.be.at.most(outer.bottom + 0.5);
}

describe('Holistic time-grid and entry presentation', () => {
    afterEach(async () => {
        await setViewport({ width: 1024, height: 768 });
    });

    for (const locale of ['en', 'de', 'ar']) {
        it(`leads Month rows with the complete localized time and meaningful title space (${locale})`, async () => {
            await ensureLocale(locale);
            const el = await fixture<Entry>(html`<lms-calendar-entry
                .locale=${locale} .time=${time} heading="Recognizable meeting title in full DOM"
                .displayMode=${'month-dot'} dir=${locale === 'ar' ? 'rtl' : 'ltr'}
                style=${`${entryStyle};width:230px;--entry-color:teal;--entry-handle-display:block;--entry-handle-width:4px`}
            ></lms-calendar-entry>`);
            await settle();
            const main = el.shadowRoot!.querySelector('.main')!;
            const title = main.querySelector('.title')!;
            const metadata = main.querySelector('.time')!;
            expect(main.firstElementChild).to.equal(metadata);
            expect(metadata.textContent).to.equal(formatLocalizedTime(9, 30, locale));
            expect(title.textContent).to.equal('Recognizable meeting title in full DOM');
            expect(title.getBoundingClientRect().width).to.be.at.least(48);
            expect(el.shadowRoot!.querySelector('.color-dot')).to.equal(null);
            expect(getComputedStyle(el, '::before').width).to.equal('4px');
            expectInside(title, el);
            expectInside(metadata, el);
            if (metadata.getBoundingClientRect().top === title.getBoundingClientRect().top) {
                if (locale === 'ar')
                    expect(metadata.getBoundingClientRect().left).to.be.at.least(
                        title.getBoundingClientRect().right,
                    );
                else
                    expect(metadata.getBoundingClientRect().right).to.be.at.most(
                        title.getBoundingClientRect().left,
                    );
            }
        });
    }

    it('keeps a narrow Month preview in its allocated row with complete time and an ellipsized title', async () => {
        const el = await fixture<Entry>(html`<lms-calendar-entry heading="Important first title"
            .displayMode=${'month-dot'} .time=${time} style=${`${entryStyle};width:90px`}
        ></lms-calendar-entry>`);
        await settle();
        const title = el.shadowRoot!.querySelector('.title')!;
        const metadata = el.shadowRoot!.querySelector('.time')!;
        expect(title.getBoundingClientRect().width).to.be.greaterThan(0);
        expect(getComputedStyle(title).visibility).to.equal('visible');
        expect(getComputedStyle(title).textOverflow).to.equal('ellipsis');
        expect(getComputedStyle(metadata).display).not.to.equal('none');
        expect(metadata.textContent).to.equal(formatLocalizedTime(9, 30, 'en'));
        expect(metadata.scrollWidth).to.be.at.most(metadata.clientWidth + 1);
        expect(getComputedStyle(el.shadowRoot!.querySelector('.main')!).flexWrap).to.equal(
            'nowrap',
        );
        expect(el.getBoundingClientRect().height).to.equal(24);
        expectInside(title, el);
        expectInside(metadata, el);
    });

    it('puts default-card titles before metadata and stacks within a narrow embed on a wide viewport', async () => {
        await setViewport({ width: 1280, height: 900 });
        const el = await fixture<Entry>(html`<lms-calendar-entry heading="Never lose this heading"
            .time=${time} style=${`${entryStyle};width:180px;--entry-layout:row`}
        ></lms-calendar-entry>`);
        await settle();
        const main = el.shadowRoot!.querySelector('.main')!;
        const title = main.querySelector('.title')!;
        const metadata = main.querySelector('.time')!;
        expect(main.firstElementChild).to.equal(title);
        expect(title.getBoundingClientRect().width).to.be.at.least(48);
        expect(metadata.getBoundingClientRect().top).to.be.at.least(
            title.getBoundingClientRect().bottom,
        );
        expect(metadata.textContent).to.equal(formatLocalizedTimeRange(9, 30, 11, 0, 'en'));
        expect(metadata.scrollWidth).to.be.at.most(metadata.clientWidth + 1);
        expectInside(title, el);
        expectInside(metadata, el);
    });

    it('does not repeat visual titles on continuation slices, but keeps names, text and keyboard feedback', async () => {
        const container = await fixture<HTMLDivElement>(html`<div>
            ${['first-day', 'middle-day', 'last-day', 'single-day'].map(
                (spanClass) => html`
                <lms-calendar-entry class=${spanClass} heading="Conference complete title"
                    .date=${interval} .displayMode=${'month-span'} .isContinuation=${true}
                    style=${`${entryStyle};width:200px`}
                ></lms-calendar-entry>
            `,
            )}
        </div>`);
        await settle();
        const entries = [...container.querySelectorAll<Entry>('lms-calendar-entry')];
        for (let index = 0; index < entries.length; index++) {
            const entry = entries[index];
            const title = entry.shadowRoot!.querySelector('.title')!;
            expect(title.textContent).to.equal('Conference complete title');
            expect(entry.getAttribute('aria-label')).to.include('Conference complete title');
            expect(getComputedStyle(title).visibility).to.equal(
                index === 1 || index === 2 ? 'hidden' : 'visible',
            );
            expect(entry.getBoundingClientRect().height).to.be.at.least(24);
        }
        await sendKeys({ press: 'Tab' });
        entries[1].focus();
        await settle();
        expect(entries[1].matches(':focus-visible')).to.equal(true);
        expect(
            getComputedStyle(entries[1].shadowRoot!.querySelector('.title')!).visibility,
        ).to.equal('visible');
        expect(getComputedStyle(entries[1]).outlineStyle).to.equal('solid');
    });

    it('preserves canonical identity and exactly-once Enter/Space activation from a continuation', async () => {
        const canonical: CalendarEntry = {
            id: 'real-event',
            heading: 'Canonical conference',
            kind: 'all-day',
            date: { start: date, end: { ...date, day: 18 } },
            content: 'Original description',
        };
        const el = await fixture<Entry>(html`<lms-calendar-entry class="middle-day"
            heading=${canonical.heading} .date=${interval} .canonicalEntry=${canonical}
            .eventId=${canonical.id} .displayMode=${'month-span'} style=${entryStyle}
        ></lms-calendar-entry>`);
        const requests: CustomEvent[] = [];
        el.addEventListener('open-menu', (event) => {
            requests.push(event as CustomEvent);
            event.preventDefault();
        });
        el.focus();
        await sendKeys({ press: 'Enter' });
        expect(requests).to.have.length(1);
        await sendKeys({ press: ' ' });
        expect(requests).to.have.length(2);
        for (const request of requests) {
            expect(request.detail.entry).to.equal(canonical);
            expect(request.detail.eventId).to.equal('real-event');
            expect(request.cancelable).to.equal(true);
        }
    });

    for (const view of ['day', 'week'] as const) {
        it(`${view} has one visible all-day label, a separate timed region and complete date context`, async () => {
            const today = new Date();
            const activeDate = {
                year: today.getFullYear(),
                month: today.getMonth() + 1,
                day: today.getDate(),
            };
            const el = document.createElement(`lms-calendar-${view}`) as Day | Week;
            el.activeDate = activeDate;
            el.allDayRowCount = 1;
            el.style.cssText =
                'width:700px;height:500px;--calendar-grid-columns-day:64px minmax(0,1fr);--calendar-grid-columns-week:64px repeat(7,minmax(0,1fr));--day-header-height:40px';
            const container = await fixture<HTMLDivElement>(
                html`
                    <div></div>
                `,
            );
            container.append(el);
            await el.updateComplete;
            await settle();
            const band = el.shadowRoot!.querySelector<HTMLElement>('.all-day-wrapper')!;
            const label = el.shadowRoot!.querySelector('.all-day-time-header')!;
            expect(label.textContent).to.equal(getMessages('en').allDay);
            expect(el.shadowRoot!.querySelectorAll('.all-day-time-header')).to.have.length(1);
            expect(band.getAttribute('aria-labelledby')).to.equal(label.id);
            expect(band.tabIndex).to.equal(0);
            const current = el.shadowRoot!.querySelector('[aria-current="date"]')!;
            expect(current.getAttribute('aria-label')).to.include(
                formatLocalizedDate(activeDate.day, activeDate.month, activeDate.year, 'en'),
            );
            const badge = current.querySelector('.day-number')!;
            expect(getComputedStyle(badge).borderRadius).to.equal('50%');
            expectInside(badge, current);
            expect(
                el.shadowRoot!.querySelector(view === 'day' ? '.timed-content' : '.week-scroll'),
            ).not.to.equal(null);
        });
    }

    it('provides localized local-window context and native controls without global navigation events', async () => {
        await ensureLocale('de');
        const dates = getWeekDates(date, 1);
        const el = await fixture<Week>(html`<lms-calendar-week locale="de" .activeDate=${date}
            .visibleDates=${dates.slice(0, 3)} .visibleStartIndex=${0} .visibleLength=${3}
            style="height:600px;width:320px;--calendar-grid-columns-week:48px repeat(3,minmax(0,1fr))"
        ></lms-calendar-week>`);
        await settle();
        const controls = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.peek-indicator')];
        const msg = getMessages('de');
        expect(controls).to.have.length(2);
        expect(controls[0].disabled).to.equal(true);
        expect(controls[1].disabled).to.equal(false);
        expect(controls[0].textContent).to.include(msg.previous);
        expect(controls[1].textContent).to.include(msg.next);
        expect(el.shadowRoot!.querySelector('.window-position')!.textContent).to.equal('1–3/7');
        for (const [index, control] of controls.entries()) {
            expect(control.getAttribute('aria-label')).to.include(
                index ? msg.showLaterDays : msg.showEarlierDays,
            );
            expect(control.getAttribute('aria-label')).to.include(
                formatLocalizedDate(15, 6, 2026, 'de'),
            );
            expect(control.getAttribute('aria-label')).to.include(
                formatLocalizedDate(17, 6, 2026, 'de'),
            );
            expect(control.getBoundingClientRect().width).to.be.at.least(24);
            expect(control.getBoundingClientRect().height).to.be.at.least(24);
        }
        const navigations: CustomEvent[] = [];
        let expansions = 0;
        el.addEventListener('peek-navigate', (event) => navigations.push(event as CustomEvent));
        el.addEventListener('expand', () => expansions++);
        controls[1].focus();
        await sendKeys({ press: 'Enter' });
        expect(navigations).to.have.length(1);
        expect(navigations[0].detail).to.deep.equal({ date: dates[3], direction: 'next' });
        expect(expansions).to.equal(0);
        el.visibleStartIndex = 4;
        el.visibleDates = dates.slice(4);
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.window-position')!.textContent).to.equal('5–7/7');
        expect(controls[0].disabled).to.equal(false);
        expect(controls[1].disabled).to.equal(true);
    });

    it('reflows local controls and complete date badges at enlarged text sizes without borrowing an active-state surface', async () => {
        await setViewport({ width: 1280, height: 900 });
        const dates = getWeekDates(date, 1);
        const el = await fixture<Week>(html`<lms-calendar-week .activeDate=${date}
            .visibleDates=${dates.slice(0, 3)} .visibleStartIndex=${0} .visibleLength=${3}
            style="width:280px;height:600px;font-size:32px;--calendar-grid-columns-week:48px repeat(3,minmax(0,1fr));--background-color:white;--text-color:black;--peek-active-bg:black;--day-header-height:40px"
        ></lms-calendar-week>`);
        await settle();
        const group = el.shadowRoot!.querySelector('.peek-indicators')!;
        expect(getComputedStyle(group).backgroundColor).to.equal('rgb(255, 255, 255)');
        for (const control of group.querySelectorAll('button')) {
            expectInside(control, group);
            expect(control.getBoundingClientRect().height).to.be.at.least(24);
        }
        expectInside(el.shadowRoot!.querySelector('.window-context')!, group);
        for (const label of el.shadowRoot!.querySelectorAll('.day-label')) {
            for (const part of label.children) expectInside(part, label);
        }
        expect(
            el.shadowRoot!.querySelector('.week-scroll')!.getBoundingClientRect().height,
        ).to.be.greaterThan(200);
    });

    it('localizes the numeric window and preserves chronological glyphs and logical placement in RTL', async () => {
        await ensureLocale('ar');
        const dates = getWeekDates(date, 1);
        const el =
            await fixture<Week>(html`<lms-calendar-week locale="ar" dir="rtl" .activeDate=${date}
            .visibleDates=${dates.slice(1, 4)} .visibleStartIndex=${1} .visibleLength=${3}
            style="height:600px;width:400px;--calendar-grid-columns-week:48px repeat(3,minmax(0,1fr))"
        ></lms-calendar-week>`);
        await settle();
        const number = new Intl.NumberFormat('ar');
        expect(el.shadowRoot!.querySelector('.window-position')!.textContent).to.equal(
            `${number.format(2)}–${number.format(4)}/${number.format(7)}`,
        );
        const [previous, next] = [
            ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.peek-indicator'),
        ];
        expect(previous.querySelector('span')!.textContent).to.equal('‹');
        expect(next.querySelector('span')!.textContent).to.equal('›');
        expect(previous.getBoundingClientRect().left).to.be.greaterThan(
            next.getBoundingClientRect().left,
        );
        const names = [...el.shadowRoot!.querySelectorAll('.day-label')].map((label) =>
            label.getAttribute('aria-label'),
        );
        expect(names[0]).to.include(formatLocalizedDate(16, 6, 2026, 'ar'));
    });

    it('renders every simultaneous event in its own lane, with readable title/metadata and real activation', async () => {
        const events = [
            {
                id: 'long',
                heading: 'Long event',
                startTime: { hour: 9, minute: 0 },
                endTime: { hour: 12, minute: 0 },
                color: 'teal',
            },
            {
                id: 'short',
                heading: 'Short event',
                startTime: { hour: 9, minute: 0 },
                endTime: { hour: 9, minute: 5 },
                color: 'teal',
            },
            {
                id: 'later',
                heading: 'Later event',
                startTime: { hour: 9, minute: 10 },
                endTime: { hour: 10, minute: 0 },
                color: 'teal',
            },
        ];
        const boxes = new LayoutCalculator({
            layoutMode: 'columns',
            eventMinHeight: 50,
        }).calculateLayout(events).boxes;
        const el = await fixture<Day>(html`<lms-calendar-day .activeDate=${date}
            style="width:900px;height:600px;--calendar-grid-columns-day:60px minmax(0,1fr)">
            ${events.map((event, index) => {
                const box = boxes[index];
                return html`<lms-calendar-entry slot="timed" .eventId=${event.id} heading=${event.heading}
                    .date=${interval} .time=${{ start: event.startTime, end: event.endTime }}
                    style=${`${entryStyle};position:absolute;top:${box.y}px;inset-inline-start:${box.x}%;width:${box.width}%;height:${box.height}px;--entry-layout:column`}
                ></lms-calendar-entry>`;
            })}
        </lms-calendar-day>`);
        await settle();
        const scroller = el.shadowRoot!.querySelector<HTMLElement>('.main')!;
        expect(getComputedStyle(scroller).scrollSnapType).to.equal('none');
        scroller.scrollTop = 540;
        await settle();
        const entries = [...el.querySelectorAll<Entry>('lms-calendar-entry')];
        for (let index = 0; index < entries.length; index++) {
            expect(boxes[index].columnCount).to.equal(3);
            const title = entries[index].shadowRoot!.querySelector('.title')!;
            const metadata = entries[index].shadowRoot!.querySelector('.time')!;
            expect(title.getBoundingClientRect().width).to.be.at.least(48);
            expectInside(title, entries[index]);
            expectInside(metadata, entries[index]);
        }
        expect(entries[0].getBoundingClientRect().right).to.be.at.most(
            entries[2].getBoundingClientRect().left + 0.5,
        );
        let id = '';
        el.addEventListener('open-menu', (event) => {
            id = (event as CustomEvent).detail.eventId;
        });
        entries[1].focus();
        await sendKeys({ press: 'Enter' });
        expect(id).to.equal('short');
    });
});
