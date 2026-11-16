import { expect, fixture, html, nextFrame } from '@open-wc/testing';

import type { CalendarState } from '../../../src/contracts.js';
import { MAX_EXPANDED_SEGMENTS } from '../../../src/lib/calendarModel.js';
import type LMSCalendar from '../../../src/lms-calendar.js';
import type { CalendarEntry } from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const march = { year: 2026, month: 3, day: 15 };
const april = { year: 2026, month: 4, day: 20 };
const event = (date = march, extra: Partial<CalendarEntry> = {}): CalendarEntry => ({
    date: { start: date, end: date },
    heading: 'Visible appointment',
    content: 'Details',
    color: '#24558a',
    ...extra,
});

async function settle(el: LMSCalendar) {
    await el.updateComplete;
    await nextFrame();
    await nextFrame();
    await el.updateComplete;
}

async function calendar(entries: CalendarEntry[] = [], width = 1000): Promise<LMSCalendar> {
    const el = await fixture<LMSCalendar>(html`
        <lms-calendar locale="en" style=${`width:${width}px;height:700px`}
            .activeDate=${{ ...march }} .entries=${entries}></lms-calendar>
    `);
    await settle(el);
    return el;
}

describe('Calendar public contracts and audit regressions', () => {
    it('rebuilds all-day month layout when navigating without replacing entries (C01)', async () => {
        const el = await calendar([event(april)]);
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(0);
        el.activeDate = april;
        await settle(el);
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(1);
        expect(el.shadowRoot!.querySelector('lms-calendar-entry')!.heading).to.equal(
            'Visible appointment',
        );
    });

    it('keeps visible-range expansion bounded even for a multi-year event (C08)', async () => {
        const el = await calendar([
            event(march, {
                date: {
                    start: { year: 2025, month: 1, day: 1 },
                    end: { year: 2027, month: 12, day: 31 },
                },
            }),
        ]);
        const entries = el.shadowRoot!.querySelectorAll('lms-calendar-entry');
        expect(entries.length).to.be.greaterThan(0);
        expect(entries.length).to.be.at.most(42);
    });

    it('exposes immutable public navigation and a committed half-open range (C10)', async () => {
        const el = await calendar();
        const supplied = { ...april };
        el.activeDate = supplied;
        supplied.day = 1;
        el.viewMode = 'day';
        let state: CalendarState | undefined;
        el.addEventListener('calendar-state-change', (e) => {
            state = (e as CustomEvent<CalendarState>).detail;
        });
        await settle(el);
        expect(el.activeDate.day).to.equal(20);
        const returned = el.activeDate;
        returned.day = 2;
        expect(el.activeDate.day).to.equal(20);
        expect(state!.viewMode).to.equal('day');
        expect(state!.range).to.deep.equal({ start: '2026-04-20', end: '2026-04-21' });
        expect(el.visibleRange).to.deep.equal(state!.range);
        expect(Object.isFrozen(state)).to.equal(true);
        expect(Object.isFrozen(state!.activeDate)).to.equal(true);
        expect(Object.isFrozen(state!.range)).to.equal(true);
        expect(el.shadowRoot!.querySelector('lms-calendar-day')).to.exist;
    });

    it('gives identical-looking entries distinct identities (C05)', async () => {
        const el = await calendar([event(), event()]);
        const entries = [...el.shadowRoot!.querySelectorAll('lms-calendar-entry')];
        expect(entries).to.have.length(2);
        expect(entries[0].eventId).to.be.a('string');
        expect(entries[0].eventId).not.to.equal(entries[1].eventId);
    });

    it('lets a host cancel open-menu before the built-in inspector opens (C11)', async () => {
        const el = await calendar([event()]);
        el.addEventListener('open-menu', (e) => e.preventDefault());
        const entry = el.shadowRoot!.querySelector('lms-calendar-entry')!;
        entry.dispatchEvent(
            new CustomEvent('open-menu', {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    heading: entry.heading,
                    content: 'Details',
                    displayTime: '',
                    entry: event(),
                },
            }),
        );
        await settle(el);
        expect(el.shadowRoot!.querySelector('lms-menu')!.hasAttribute('open')).to.equal(false);
    });

    it('exposes a separate cancelable canonical activation request (C11)', async () => {
        const source = event(march, { id: 'persistent-42' });
        const el = await calendar([source]);
        let request: CustomEvent | undefined;
        el.addEventListener('entry-activate', (e) => {
            request = e as CustomEvent;
            e.preventDefault();
        });
        const entry = el.shadowRoot!.querySelector('lms-calendar-entry')!;
        entry.dispatchEvent(
            new CustomEvent('open-menu', {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    heading: source.heading,
                    content: source.content,
                    displayTime: '',
                    entry: source,
                    eventId: source.id,
                },
            }),
        );
        await settle(el);
        expect(request).to.exist;
        expect(request!.detail.entry.id).to.equal('persistent-42');
        expect(el.shadowRoot!.querySelector('lms-menu')!.hasAttribute('open')).to.equal(false);
    });

    it('renders working native mobile count controls with the correct date (A02)', async () => {
        const el = await calendar([event()], 500);
        const month = el.shadowRoot!.querySelector('lms-calendar-month')!;
        const button = month.shadowRoot!.querySelector<HTMLButtonElement>(
            'button.summary:not([hidden])',
        );
        expect(button, `real summary button at width ${el.getBoundingClientRect().width}`).to.exist;
        button!.click();
        await settle(el);
        expect(el.viewMode).to.equal('day');
        expect(el.activeDate).to.deep.equal(march);
        expect(el.shadowRoot!.activeElement, 'logical focus after drill-down').not.to.equal(null);
    });

    it('keeps automatic direction reactive and declares language (A12)', async () => {
        const el = await calendar();
        el.locale = 'ar';
        await el.localeReady;
        await settle(el);
        expect(el.dir).to.equal('auto');
        expect(el.getAttribute('dir')).to.equal('rtl');
        expect(el.lang).to.equal('ar');
        el.locale = 'en';
        await el.localeReady;
        await settle(el);
        expect(el.getAttribute('dir')).to.equal('ltr');
        el.dir = 'rtl';
        await settle(el);
        expect(el.getAttribute('dir')).to.equal('rtl');
    });

    it('uses a concise status rather than making the entire view live (A11)', async () => {
        const el = await calendar();
        const view = el.shadowRoot!.querySelector('[role="region"]');
        expect(view).to.exist;
        expect(view!.hasAttribute('aria-live')).to.equal(false);
        expect(el.shadowRoot!.querySelector('[role="status"]')!.textContent!.trim()).not.to.equal(
            '',
        );
    });

    it('wires the accent property without overriding an explicit primary token (Q09)', async () => {
        const el = await calendar();
        el.color = '#ff0000';
        await settle(el);
        expect(getComputedStyle(el).getPropertyValue('--primary-color').trim()).to.equal(
            'rgb(255, 0, 0)',
        );
        el.style.setProperty('--primary-color', '#123456');
        await settle(el);
        expect(getComputedStyle(el).getPropertyValue('--primary-color').trim()).to.equal('#123456');
    });

    it('preserves legacy padding tokens while giving logical overrides precedence (Q09)', async () => {
        const el = await calendar();
        el.style.setProperty('--header-info-padding-left', '31px');
        el.style.setProperty('--header-buttons-padding-right', '29px');
        await settle(el);
        const header = el.shadowRoot!.querySelector('lms-calendar-header')!;
        const info = header.shadowRoot!.querySelector<HTMLElement>('.info')!;
        const buttons = header.shadowRoot!.querySelector<HTMLElement>('.buttons')!;
        expect(getComputedStyle(info).paddingInlineStart).to.equal('31px');
        expect(getComputedStyle(buttons).paddingInlineEnd).to.equal('29px');
        el.style.setProperty('--header-info-padding-inline-start', '19px');
        await settle(el);
        expect(getComputedStyle(info).paddingInlineStart).to.equal('19px');
    });

    it('does not interpolate untrusted color declarations into styles (Q05)', async () => {
        const el = await calendar([event(march, { color: 'red; position:fixed; --injected:yes' })]);
        const entry = el.shadowRoot!.querySelector('lms-calendar-entry')!;
        expect(entry.style.getPropertyValue('--injected')).to.equal('');
        expect(entry.style.position).not.to.equal('fixed');
    });

    it('preserves canonical continuous endpoints on a timed continuation (C03/C07)', async () => {
        const source = event(march, {
            id: 'overnight',
            kind: 'timed',
            date: { start: march, end: { ...march, day: 16 } },
            time: { start: { hour: 22, minute: 0 }, end: { hour: 2, minute: 0 } },
        });
        const el = await calendar([source]);
        el.activeDate = { ...march, day: 16 };
        el.viewMode = 'day';
        await settle(el);
        const entry = el.shadowRoot!.querySelector('lms-calendar-entry')!;
        expect(entry.slot).to.equal('timed');
        expect(getComputedStyle(entry).top).to.equal('0px');
        expect(entry.canonicalEntry!.date).to.deep.equal(source.date);
        expect(entry.canonicalEntry!.time).to.deep.equal(source.time);
        expect(entry.time!.start).to.deep.equal({ hour: 0, minute: 0 });
        expect(entry.time!.end).to.deep.equal({ hour: 2, minute: 0 });
    });

    it('reconnects the actual resize observer and switches mobile controls (Q08/Q09)', async () => {
        const el = await calendar([event()]);
        expect(el.shadowRoot!.querySelector('[slot^="summary-"]')).not.to.exist;
        const parent = el.parentElement!;
        el.remove();
        el.style.width = '500px';
        parent.append(el);
        await settle(el);
        expect(el.shadowRoot!.querySelector('[slot^="summary-"]')).to.exist;
        el.style.width = '1000px';
        await settle(el);
        expect(el.shadowRoot!.querySelector('[slot^="summary-"]')).not.to.exist;
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(1);
    });

    it('preserves keyed event DOM and focus through a source reorder (A08)', async () => {
        const firstSource = event(march, { id: 'first' });
        const secondSource = event(march, { id: 'second' });
        const el = await calendar([firstSource, secondSource]);
        const first = el.shadowRoot!.querySelector<HTMLElement>('[data-event-id="first"]')!;
        first.focus();
        el.entries = [secondSource, firstSource];
        await settle(el);
        expect(
            el.shadowRoot!.querySelector('[data-event-id="first"]') === first,
            'same keyed DOM node',
        ).to.equal(true);
        expect(el.shadowRoot!.activeElement === first, 'focus follows the stable event').to.equal(
            true,
        );
    });

    it('recomputes the reported spillover range when week start changes (C01/C10)', async () => {
        const el = await calendar([event()]);
        expect(el.visibleRange.start).to.equal('2026-02-23');
        el.firstDayOfWeek = 0;
        await settle(el);
        expect(el.visibleRange.start).to.equal('2026-03-01');
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(1);
    });

    it('uses display minimum geometry consistently for close short events (C09)', async () => {
        const el = await calendar([
            event(march, {
                id: 'short-a',
                time: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 1 } },
            }),
            event(march, {
                id: 'short-b',
                time: { start: { hour: 9, minute: 25 }, end: { hour: 9, minute: 26 } },
            }),
        ]);
        el.viewMode = 'day';
        await settle(el);
        const entries = [...el.shadowRoot!.querySelectorAll<HTMLElement>('lms-calendar-entry')];
        const firstBox = entries[0].getBoundingClientRect();
        const secondBox = entries[1].getBoundingClientRect();
        expect(firstBox.bottom).to.be.greaterThan(secondBox.top);
        expect(entries[0].style.insetInlineStart).not.to.equal(entries[1].style.insetInlineStart);
        expect(firstBox.height).to.be.at.least(24);
        expect(secondBox.height).to.be.at.least(24);
    });

    it('realizes shared month rows and places timed entries after gapped all-day rows (C04)', async () => {
        const day = (n: number) => ({ year: 2026, month: 3, day: n });
        const el = await calendar([
            event(day(9), { id: 'row-a', kind: 'all-day', date: { start: day(9), end: day(10) } }),
            event(day(10), {
                id: 'row-b',
                kind: 'all-day',
                date: { start: day(10), end: day(11) },
            }),
            event(day(10), {
                id: 'row-timed',
                kind: 'timed',
                time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
            }),
        ]);
        const spans = [...el.shadowRoot!.querySelectorAll<HTMLElement>('[data-event-id="row-b"]')];
        expect(spans).to.have.length(2);
        expect(
            Math.abs(spans[0].getBoundingClientRect().top - spans[1].getBoundingClientRect().top),
        ).to.be.lessThan(1);
        const timed = el.shadowRoot!.querySelector<HTMLElement>('[data-event-id="row-timed"]')!;
        expect(timed.style.getPropertyValue('--all-day-row')).to.equal('2');
    });

    it('bounds every public view range to supported civil dates and one exclusive sentinel', async () => {
        const minimum = { year: 1, month: 1, day: 1 };
        const maximum = { year: 9999, month: 12, day: 31 };
        const el = await calendar([event(minimum), event(maximum)]);
        el.firstDayOfWeek = 0;
        for (const active of [minimum, maximum]) {
            for (const view of ['month', 'week', 'day', 'year'] as const) {
                el.activeDate = active;
                el.viewMode = view;
                await settle(el);
                expect(el.visibleRange.start).to.match(/^\d{4}-\d{2}-\d{2}$/);
                if (active.year === 1) expect(el.visibleRange.start).to.equal('0001-01-01');
                else expect(el.visibleRange.end).to.equal('10000-01-01');
            }
        }
    });

    it('rejects duplicate authoritative records before all-day allocation (C05/C06)', async () => {
        const el = await calendar();
        let rejected = 0;
        el.addEventListener('entries-invalid', (e) => {
            rejected = e.detail.issues.length;
        });
        const source = event(march, { id: 'authoritative', kind: 'all-day', heading: 'First' });
        el.entries = [source, source, { ...source, heading: 'Duplicate' }];
        await settle(el);
        expect(rejected).to.equal(2);
        const entries = [...el.shadowRoot!.querySelectorAll('lms-calendar-entry')];
        expect(entries).to.have.length(1);
        expect(entries[0].canonicalEntry!.heading).to.equal('First');
    });

    it('surfaces the segment budget without rendering a partial dataset and recovers (C08)', async () => {
        const el = await calendar();
        let failure: { code: string; limit: number } | undefined;
        el.addEventListener('entries-error', (e) => {
            failure = e.detail;
        });
        el.entries = Array.from({ length: MAX_EXPANDED_SEGMENTS + 1 }, (_, i) =>
            event(march, { id: `budget-${i}` }),
        );
        await settle(el);
        expect(failure!.code).to.equal('segment-budget');
        expect(failure!.limit).to.equal(MAX_EXPANDED_SEGMENTS);
        expect(el.shadowRoot!.querySelector('[role="alert"]')).to.exist;
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(0);
        el.entries = [event()];
        await settle(el);
        expect(el.shadowRoot!.querySelector('[role="alert"]')).not.to.exist;
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(1);
    });

    it('reports invalid inputs without losing valid events (C06)', async () => {
        const el = await calendar();
        let invalid = 0;
        el.addEventListener('entries-invalid', (e) => {
            invalid = (e as CustomEvent).detail.issues.length;
        });
        el.entries = [event(), event({ year: 2026, month: 2, day: 31 })];
        await settle(el);
        expect(invalid).to.equal(1);
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(1);
    });
});
