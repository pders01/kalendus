import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { LitElement, nothing } from 'lit';

import type Entry from '../../../src/components/Entry.js';
import { generateEntryIcs } from '../../../src/components/entryExport.js';
import type { CalendarEntryRequest } from '../../../src/contracts.js';
import type LMSCalendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';
import { KalendusApiClient } from '../../src/adapters/kalendus-api-client.js';
import { KalendusLitAdapter } from '../../src/adapters/kalendus-lit-adapter.js';
import type { ApiCalendarEntry } from '../../src/adapters/types.js';

const day = (day: number) => ({ year: 2026, month: 3, day });
const persistentEvent: ApiCalendarEntry = {
    id: 'persistent-event',
    calendarId: 'persisted-calendar',
    heading: 'Identified',
    content: '',
    color: '#1976d2',
    date: { start: day(15), end: day(15) },
    time: null,
    createdAt: '',
    updatedAt: '',
};

class AdapterHost extends LitElement {
    showCalendar = true;
    requests: URL[] = [];
    records = [persistentEvent];
    adapter = new KalendusLitAdapter(this, {
        baseUrl: 'https://calendar.example',
        calendarId: 'persisted-calendar',
        fetch: async (url) => {
            this.requests.push(new URL(String(url)));
            return Response.json(this.records);
        },
    });
    render() {
        return this.showCalendar
            ? html`<lms-calendar locale="en" style="width:1000px;height:700px" .activeDate=${this.initialDate} .firstDayOfWeek=${0} .entries=${this.adapter.entries}></lms-calendar>`
            : nothing;
    }
    initialDate = { year: 2026, month: 3, day: 15 };
    get calendar(): LMSCalendar {
        return this.renderRoot.querySelector('lms-calendar')!;
    }
}
customElements.define('server-adapter-contract-host', AdapterHost);

async function settle(host: AdapterHost) {
    await host.updateComplete;
    await host.calendar.updateComplete;
    // Frames let the calendar observe layout and commit its responsive range.
    await nextFrame();
    await nextFrame();
    await host.updateComplete;
    await host.calendar.updateComplete;
    // Decoding a fetch body is independent of both frame and Lit update timing.
    await waitUntil(() => !host.adapter.loading, 'The adapter query did not settle');
    expect(host.adapter.error, 'The adapter query failed').to.equal(null);
    await host.updateComplete;
    await host.calendar.updateComplete;
}
function expectRange(host: AdapterHost) {
    const { start, end } = host.calendar.visibleRange;
    const inclusive = new Date(`${end}T00:00:00Z`);
    inclusive.setUTCDate(inclusive.getUTCDate() - 1);
    expect(host.requests.at(-1)!.searchParams.get('start')).to.equal(start);
    expect(host.requests.at(-1)!.searchParams.get('end')).to.equal(
        inclusive.toISOString().slice(0, 10),
    );
}
function clickHeader(host: AdapterHost, selector: string) {
    host.calendar
        .shadowRoot!.querySelector('lms-calendar-header')!
        .shadowRoot!.querySelector<HTMLButtonElement>(selector)!
        .click();
}

describe('Real Lit calendar/adapter integration', () => {
    it('does not fall back to native EventSource for header auth, custom fetch or omitted cookies', () => {
        expect(() =>
            new KalendusApiClient({
                baseUrl: '',
                calendarId: 'private',
                headers: { Authorization: 'Bearer token' },
            }).connect(),
        ).to.throw('streamFactory');
        expect(() =>
            new KalendusApiClient({
                baseUrl: '',
                calendarId: 'private',
                credentials: 'omit',
            }).connect(),
        ).to.throw('streamFactory');
        expect(() =>
            new KalendusApiClient({
                baseUrl: '',
                calendarId: 'private',
                // A REST fixture is just as opaque as a wrapper that adds bearer auth.
                fetch: async () => Response.json([]),
            }).connect(),
        ).to.throw('streamFactory');
    });
    it('loads the initial rendered calendar with no header event or private access and preserves persistent ID', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        expect(host.requests.length).to.equal(1);
        expectRange(host);
        expect(host.adapter.entries[0].id).to.equal('persistent-event');
        expect(host.calendar.entries[0].id).to.equal('persistent-event');
        host.requestUpdate();
        await settle(host);
        expect(host.requests.length).to.equal(1);
    });

    it('keeps manual queries through Lit renders and same-range commits, then follows navigation again', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        const monthRange = host.calendar.visibleRange;
        await host.adapter.fetchRange('2026-04-01', '2026-04-03');
        host.requestUpdate();
        await settle(host);
        expect(host.requests).to.have.length(2);
        expect(host.requests.at(-1)!.search).to.equal('?start=2026-04-01&end=2026-04-03');

        const commits: Array<LMSCalendar['visibleRange']> = [];
        host.calendar.addEventListener('calendar-state-change', (event) => {
            commits.push(event.detail.range);
        });
        host.initialDate = day(16);
        host.requestUpdate();
        await settle(host);
        expect(commits).to.deep.equal([monthRange]);
        expect(host.requests).to.have.length(2);

        clickHeader(host, '[data-context="day"]');
        await settle(host);
        expect(commits.at(-1)).to.deep.equal(host.calendar.visibleRange);
        expect(host.requests).to.have.length(3);
        expectRange(host);
    });

    it('clears entries when Lit removes the child and reloads an identical range for a new child', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        const oldCalendar = host.calendar;
        expect(oldCalendar.entries.map(({ id }) => id)).to.deep.equal(['persistent-event']);
        host.showCalendar = false;
        host.requestUpdate();
        await host.updateComplete;
        expect(oldCalendar.isConnected).to.equal(false);
        expect(host.adapter.entries).to.deep.equal([]);
        await host.adapter.refresh();
        expect(host.requests).to.have.length(1);

        host.records = [{ ...persistentEvent, id: 'replacement' }];
        host.showCalendar = true;
        host.requestUpdate();
        await settle(host);
        expect(host.calendar).not.to.equal(oldCalendar);
        expect(host.requests).to.have.length(2);
        expect(host.requests[1].search).to.equal(host.requests[0].search);
        expect(host.calendar.entries.map(({ id }) => id)).to.deep.equal(['replacement']);
    });

    it('renders server overnight intervals as timed slices and exports their original endpoints', async () => {
        const overnight: ApiCalendarEntry = {
            ...persistentEvent,
            id: 'overnight',
            heading: 'Night shift',
            date: { start: day(15), end: day(16) },
            time: { start: { hour: 22, minute: 30 }, end: { hour: 6, minute: 0 } },
        };
        const midnight: ApiCalendarEntry = {
            ...persistentEvent,
            id: 'midnight',
            heading: 'Ends at midnight',
            date: { start: day(16), end: day(17) },
            time: { start: { hour: 23, minute: 30 }, end: { hour: 0, minute: 0 } },
        };
        const host = await fixture<AdapterHost>(
            html`<server-adapter-contract-host .records=${[overnight, midnight]}></server-adapter-contract-host>`,
        );
        await settle(host);
        host.calendar.viewMode = 'day';
        await settle(host);
        const timed = (id: string) =>
            host.calendar.shadowRoot!.querySelector<Entry>(`[slot="timed"][data-event-id="${id}"]`);
        expect(timed('overnight')?.time).to.deep.equal({
            start: overnight.time!.start,
            end: { hour: 24, minute: 0 },
        });

        // Update the owner's bound date so the fetch-triggered render retains it.
        host.initialDate = day(16);
        host.requestUpdate();
        await settle(host);
        expectRange(host);
        const continuation = timed('overnight');
        expect(continuation?.time).to.deep.equal({
            start: { hour: 0, minute: 0 },
            end: overnight.time!.end,
        });
        const midnightSlice = timed('midnight');
        expect(midnightSlice?.time?.end).to.deep.equal({ hour: 24, minute: 0 });
        for (const [card, record, from, to] of [
            [continuation, overnight, '20260315T223000', '20260316T060000'],
            [midnightSlice, midnight, '20260316T233000', '20260317T000000'],
        ] as const) {
            card!.click();
            await settle(host);
            const menu = host.calendar.shadowRoot!.querySelector('lms-menu')!;
            let request: CalendarEntryRequest | undefined;
            host.calendar.addEventListener(
                'export-entry',
                (event) => {
                    event.preventDefault();
                    request = event.detail;
                },
                { once: true },
            );
            menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
            expect(request, 'the inspector requests export of the original event').to.exist;
            const { entry, eventId } = request!;
            expect(eventId).to.equal(record.id);
            expect(entry.date).to.deep.equal(record.date);
            expect(entry.time).to.deep.equal(record.time);
            const ics = await generateEntryIcs(entry, eventId);
            expect(ics).to.include(`DTSTART:${from}\r\n`);
            expect(ics).to.include(`DTEND:${to}\r\n`);
            menu.shadowRoot!.querySelector<HTMLButtonElement>('.close-btn')!.click();
            await settle(host);
        }
        host.initialDate = day(17);
        host.requestUpdate();
        await settle(host);
        expectRange(host);
        expect(timed('midnight')).to.equal(null);
    });

    it('tracks real next/previous/today and every view button using committed ranges', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        for (const selector of [
            '[name="next"]',
            '[name="previous"]',
            '[name="today"]',
            '[data-context="week"]',
            '[data-context="day"]',
            '[data-context="year"]',
            '[data-context="month"]',
        ]) {
            const before = host.requests.length;
            clickHeader(host, selector);
            await settle(host);
            expect(host.requests.length, selector).to.be.greaterThan(before);
            expectRange(host);
        }
    });

    it('tracks real month date activation and keyboard page navigation', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        const before = host.requests.length;
        const month = host.calendar.shadowRoot!.querySelector('lms-calendar-month')!;
        month
            .shadowRoot!.querySelector<HTMLButtonElement>('button.indicator[tabindex="0"]')!
            .dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: 'PageDown',
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                }),
            );
        await settle(host);
        expect(host.requests.length).to.be.greaterThan(before);
        expectRange(host);
        month
            .shadowRoot!.querySelector<HTMLButtonElement>('button.indicator[tabindex="0"]')!
            .click();
        await settle(host);
        expect(host.calendar.viewMode).to.equal('day');
        expectRange(host);
    });

    it('tracks real year month/week/day drill-down controls, not synthetic header payloads', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        for (const [selector, view] of [
            ['.month-label', 'month'],
            ['.cw-label', 'week'],
            ['.day-cell', 'day'],
        ] as const) {
            host.calendar.yearDrillTarget = 'day';
            host.calendar.viewMode = 'year';
            await settle(host);
            const year = host.calendar.shadowRoot!.querySelector('lms-calendar-year')!;
            year.shadowRoot!.querySelector<HTMLButtonElement>(selector)!.click();
            await settle(host);
            expect(host.calendar.viewMode).to.equal(view);
            expectRange(host);
        }
    });

    it('retains Month and its fetch range for default compact date selection', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        host.calendar.style.width = '500px';
        await settle(host);
        const range = { ...host.calendar.visibleRange };
        const requests = host.requests.length;
        const month = host.calendar.shadowRoot!.querySelector('lms-calendar-month')!;
        month
            .shadowRoot!.querySelector<HTMLButtonElement>(
                'button.indicator[data-date="2026-3-16"]',
            )!
            .click();
        await settle(host);
        expect(host.calendar.viewMode).to.equal('month');
        expect(host.calendar.activeDate).to.deep.equal({ year: 2026, month: 3, day: 16 });
        expect(host.calendar.visibleRange).to.deep.equal(range);
        expect(host.requests.length).to.equal(requests);
        expect(host.calendar.shadowRoot!.querySelector('.date-agenda')!.textContent).to.include(
            '0 events',
        );
        host.remove();
    });

    it('tracks owner-assigned state, all week starts, responsive resize, opt-in day drill and reconnect', async () => {
        const host = await fixture<AdapterHost>(
            html`
                <server-adapter-contract-host></server-adapter-contract-host>
            `,
        );
        await settle(host);
        host.calendar.viewMode = 'week';
        await settle(host);
        const wideRange = { ...host.calendar.visibleRange };
        host.calendar.style.width = '500px';
        await settle(host);
        expect(host.calendar.visibleRange).not.to.deep.equal(wideRange);
        expectRange(host);
        host.calendar.style.width = '1000px';
        await settle(host);
        expectRange(host);
        for (let day = 0; day < 7; day++) {
            host.calendar.firstDayOfWeek = day;
            await settle(host);
            expectRange(host);
        }
        host.calendar.viewMode = 'month';
        host.calendar.monthDayBehavior = 'day';
        host.calendar.activeDate = { year: 2026, month: 3, day: 15 };
        host.calendar.style.width = '500px';
        await settle(host);
        expectRange(host);
        const month = host.calendar.shadowRoot!.querySelector('lms-calendar-month')!;
        const summary = month.shadowRoot!.querySelector<HTMLButtonElement>(
            'button.indicator[data-date="2026-3-15"]',
        );
        expect(summary).not.to.equal(null);
        expect(summary!.getAttribute('aria-label')).to.include('1 event');
        summary!.click();
        await settle(host);
        expect(host.calendar.viewMode).to.equal('day');
        expectRange(host);
        const count = host.requests.length;
        host.remove();
        document.body.append(host);
        await settle(host);
        expect(host.requests.length).to.be.greaterThan(count);
        expectRange(host);
        host.remove();
    });
});
