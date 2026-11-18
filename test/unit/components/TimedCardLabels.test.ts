import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';

import type Entry from '../../../src/components/Entry.js';
import { formatLocalizedTime } from '../../../src/lib/localization.js';
import { ensureLocale } from '../../../src/lib/messages.js';
import type Calendar from '../../../src/lms-calendar.js';
import type { CalendarEntry } from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = { year: 2026, month: 11, day: 17 };
const time = { start: { hour: 9, minute: 5 }, end: { hour: 11, minute: 35 } };

function parts(entry: Entry) {
    const label = entry.shadowRoot!.querySelector<HTMLElement>('.timed-label')!;
    return {
        label,
        start: label.firstElementChild!,
        tail: label.lastElementChild!,
        box: label.getBoundingClientRect(),
    };
}

describe('Time labels on Day and Week cards', () => {
    for (const locale of ['en', 'de', 'ar']) {
        it(`fits whole localized labels to the actual card width (${locale})`, async () => {
            await ensureLocale(locale);
            const direction = locale === 'ar' ? 'rtl' : 'ltr';
            const entry =
                await fixture<Entry>(html`<lms-calendar-entry slot="timed" dir=${direction}
                .locale=${locale} .time=${time} heading="Recognizable event name"
                style="width:300px;height:56px;--entry-layout:column;--entry-padding:0.2em;
                    --entry-title-wrap:nowrap;--entry-font-size:18px;--entry-time-font-size:18px;
                    --entry-line-height:1.2;--entry-title-weight:500"
            ></lms-calendar-entry>`);
            const first = formatLocalizedTime(9, 5, locale);
            const last = formatLocalizedTime(11, 35, locale);
            const wide = parts(entry);
            expect(wide.start.textContent).to.equal(first);
            expect(wide.tail.textContent).to.equal(`– ${last}`);
            expect(wide.tail.getBoundingClientRect().x).to.be.greaterThan(
                wide.start.getBoundingClientRect().x,
            );
            expect(wide.tail.getBoundingClientRect().bottom).to.be.at.most(wide.box.bottom + 0.5);
            const name = entry.getAttribute('aria-label');
            expect(name).to.include(first);
            expect(name).to.include(last);

            entry.style.width = `${Math.ceil(wide.start.getBoundingClientRect().width + 18)}px`;
            await nextFrame();
            const short = parts(entry);
            expect(short.tail.getBoundingClientRect().top).to.be.at.least(short.box.bottom - 0.5);
            const start = short.start.getBoundingClientRect();
            expect(start.left).to.be.at.least(short.box.left - 0.5);
            expect(start.right).to.be.at.most(short.box.right + 0.5);
            expect(start.bottom).to.be.at.most(short.box.bottom + 0.5);
            expect(direction === 'rtl' ? start.right : start.left).to.be.closeTo(
                direction === 'rtl' ? short.box.right : short.box.left,
                0.5,
            );
            expect(entry.getAttribute('aria-label')).to.equal(name);
            expect(
                getComputedStyle(entry.shadowRoot!.querySelector('.title')!).fontWeight,
            ).to.equal('500');
            expect(entry.getBoundingClientRect().height).to.equal(56);
        });
    }

    it('shows a point once and keeps the midnight end on both the card and the inspector', async () => {
        const point: CalendarEntry = {
            id: 'point',
            heading: 'Point event',
            date: { start: date, end: date },
            time: { start: { hour: 12, minute: 0 }, end: { hour: 12, minute: 0 } },
        };
        const late: CalendarEntry = {
            id: 'midnight',
            heading: 'Midnight handoff',
            date: { start: date, end: date },
            time: { start: { hour: 23, minute: 55 }, end: { hour: 24, minute: 0 } },
        };
        const calendar =
            await fixture<Calendar>(html`<lms-calendar view-mode="day" .activeDate=${date}
            .entries=${[point, late]} style="width:390px;height:660px"></lms-calendar>`);
        const root = calendar.shadowRoot!;
        const card = (id: string) => root.querySelector<Entry>(`[data-event-id="${id}"]`)!;
        await waitUntil(() => card('midnight')?.shadowRoot?.querySelector('.timed-label'));
        const start = formatLocalizedTime(23, 55, 'en');
        const midnight = formatLocalizedTime(24, 0, 'en');
        const pin = parts(card('point'));
        expect(pin.label.children.length).to.equal(1);
        expect(pin.start.textContent).to.equal(formatLocalizedTime(12, 0, 'en'));
        const endOfDay = parts(card('midnight'));
        expect(endOfDay.start.textContent).to.equal(start);
        expect(endOfDay.tail.textContent).to.equal(`– ${midnight}`);
        expect(endOfDay.tail.getBoundingClientRect().bottom).to.be.at.most(
            endOfDay.box.bottom + 0.5,
        );
        let canonical: CalendarEntry | undefined;
        calendar.addEventListener('entry-activate', (event) => {
            canonical = event.detail.entry;
        });
        card('midnight').click();
        const menu = () => root.querySelector('lms-menu')?.shadowRoot;
        await waitUntil(() => menu()?.querySelector('dialog:is([open], :popover-open)'));
        const metadata = menu()!.querySelector('.meta')!.textContent;
        expect(metadata).to.include(start);
        expect(metadata).to.include(midnight);
        expect(canonical).to.equal(late);
    });
});
