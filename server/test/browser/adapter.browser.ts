import { expect, fixture, html, nextFrame } from '@open-wc/testing';
import { LitElement } from 'lit';

import type LMSCalendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';
import { KalendusApiClient } from '../../src/adapters/kalendus-api-client.js';
import { KalendusLitAdapter } from '../../src/adapters/kalendus-lit-adapter.js';

class AdapterHost extends LitElement {
    requests: URL[] = [];
    adapter = new KalendusLitAdapter(this, {
        baseUrl: 'https://calendar.example',
        calendarId: 'persisted-calendar',
        fetch: async (url) => {
            this.requests.push(new URL(String(url)));
            return new Response(
                JSON.stringify([
                    {
                        id: 'persistent-event',
                        calendarId: 'persisted-calendar',
                        heading: 'Identified',
                        content: '',
                        color: '#1976d2',
                        date: {
                            start: { year: 2026, month: 3, day: 15 },
                            end: { year: 2026, month: 3, day: 15 },
                        },
                        time: null,
                        createdAt: '',
                        updatedAt: '',
                    },
                ]),
            );
        },
    });
    render() {
        return html`<lms-calendar locale="en" style="width:1000px;height:700px" .activeDate=${this.initialDate} .firstDayOfWeek=${0} .entries=${this.adapter.entries}></lms-calendar>`;
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
    await nextFrame();
    await nextFrame();
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
    it('does not silently use native EventSource for header auth or cookie-omitting credentials', () => {
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
