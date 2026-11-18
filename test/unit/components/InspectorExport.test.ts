import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys, sendMouse } from '@web/test-runner-commands';
import { convertIcsCalendar } from 'ts-ics';

import '../../../src/components/Menu.ts';
import { generateEntryIcs } from '../../../src/components/entryExport.ts';
import type { Menu } from '../../../src/components/Menu.ts';
import type { CalendarEntry } from '../../../src/lms-calendar.js';

const parseIcsCalendar = (source: string) => convertIcsCalendar(undefined, source);

const settle = async () => {
    await nextFrame();
    await nextFrame();
};
const start = { year: 2026, month: 3, day: 7 };
const end = { year: 2026, month: 3, day: 9 };
const allDay: CalendarEntry = {
    id: 'record-42',
    kind: 'all-day',
    date: { start, end },
    heading: 'Original event',
    content: 'Canonical notes',
};

describe('Non-modal event inspector interactions', () => {
    it('is visible without an anchor, viewport bounded, scrollable, named by its title, and structurally accessible', async () => {
        const el = await fixture<Menu>(
            html`<lms-menu .open=${true} .eventDetails=${{
                heading: 'Long inspector',
                content: 'Long notes '.repeat(2000),
                displayTime: 'All Day',
                entry: allDay,
            }} style="--menu-width:2000px"></lms-menu>`,
        );
        await settle();
        const card = el.shadowRoot!.querySelector<HTMLDialogElement>('.card')!;
        const rect = card.getBoundingClientRect();
        expect(card.matches(':popover-open')).to.be.true;
        expect(getComputedStyle(card).opacity).to.equal('1');
        expect(rect.width).to.be.greaterThan(100);
        expect(rect.left).to.be.at.least(0);
        expect(rect.right).to.be.at.most(window.innerWidth);
        expect(rect.top).to.be.at.least(0);
        expect(rect.bottom).to.be.at.most(window.innerHeight);
        const body = card.querySelector<HTMLElement>('.body')!;
        expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
        expect(card.scrollHeight).to.be.at.most(card.clientHeight + 1);
        await waitUntil(() => body.tabIndex === 0);
        body.focus();
        await sendKeys({ press: 'PageDown' });
        await waitUntil(() => body.scrollTop > 0);
        expect(card.scrollTop).to.equal(0);
        for (const button of card.querySelectorAll('button')) {
            const buttonRect = button.getBoundingClientRect();
            expect(buttonRect.top).to.be.at.least(rect.top);
            expect(buttonRect.bottom).to.be.at.most(rect.bottom);
        }
        expect(card.hasAttribute('aria-modal')).to.be.false;
        expect(document.body.inert).to.be.false;
        await expect(el).to.be.accessible();
    });
    it('allows Tab to leave, permits background focus, closes on Escape and returns focus to a connected invoker', async () => {
        const wrapper = await fixture<HTMLDivElement>(
            html`
                <div>
                    <button id="invoker">Open details</button><lms-menu></lms-menu
                    ><button id="after">Background action</button>
                </div>
            `,
        );
        const el = wrapper.querySelector<Menu>('lms-menu')!;
        const invoker = wrapper.querySelector<HTMLButtonElement>('#invoker')!;
        const after = wrapper.querySelector<HTMLButtonElement>('#after')!;
        invoker.focus();
        el.open = true;
        await el.updateComplete;
        await settle();
        const card = el.shadowRoot!.querySelector<HTMLDialogElement>('.card')!;
        expect(el.shadowRoot!.activeElement).to.equal(card.querySelector('.close-btn'));
        const exportButton = card.querySelector<HTMLButtonElement>('.export-btn')!;
        exportButton.focus();
        await sendKeys({ press: 'Tab' });
        expect(el.shadowRoot!.activeElement).not.to.equal(card.querySelector('.close-btn'));
        after.focus();
        await settle();
        expect(document.activeElement).to.equal(after);
        expect(el.open, 'leaving the non-modal surface dismisses without stealing focus').to.be
            .false;
        invoker.focus();
        el.open = true;
        await el.updateComplete;
        await settle();
        expect(el.shadowRoot!.activeElement).to.equal(card.querySelector('.close-btn'));
        await sendKeys({ press: 'Escape' });
        await settle();
        expect(el.open).to.be.false;
        expect(document.activeElement).to.equal(invoker);
    });
    it('returns to a logical fallback if the invoker disappears while open', async () => {
        const wrapper = await fixture<HTMLDivElement>(
            html`
                <div>
                    <button class="invoker">Event</button>
                    <main tabindex="-1">Calendar range</main>
                    <lms-menu></lms-menu>
                </div>
            `,
        );
        const invoker = wrapper.querySelector<HTMLButtonElement>('.invoker')!;
        const el = wrapper.querySelector<Menu>('lms-menu')!;
        const destination = wrapper.querySelector('main')!;
        invoker.focus();
        el.open = true;
        await el.updateComplete;
        await settle();
        invoker.remove();
        await sendKeys({ press: 'Escape' });
        await settle();
        expect(document.activeElement).to.equal(destination);
    });

    it('renders the canonical date span and time kind instead of a segment-only date', async () => {
        const el = await fixture<Menu>(
            html`<lms-menu .open=${true} .eventDetails=${{ entry: allDay, heading: 'Original event', content: '', displayTime: '9:00 AM', date: end }}></lms-menu>`,
        );
        const metadata = el.shadowRoot!.querySelectorAll('.meta');
        expect(metadata[0].textContent).to.include('All Day');
        expect(metadata[1].textContent).to.include('Mar 7, 2026');
        expect(metadata[1].textContent).to.include('Mar 9, 2026');
    });

    it('uses native outside-pointer light dismissal and emits one menu-close notification', async () => {
        const el = await fixture<Menu>(html`<lms-menu .open=${true}></lms-menu>`);
        await settle();
        let closes = 0;
        el.addEventListener('menu-close', () => closes++);
        await sendMouse({ type: 'click', position: [1, 1] });
        await settle();
        expect(el.open).to.be.false;
        expect(closes).to.equal(1);
    });
    it('provides a visible unclipped fallback portal with Escape, light-dismiss and cleanup when Popover is unavailable', async () => {
        const el = await fixture<Menu>(
            html`
                <lms-menu></lms-menu>
            `,
        );
        Object.defineProperty(el, '_hasPopover', { get: () => false });
        el.open = true;
        await el.updateComplete;
        await settle();
        const portal = document.querySelector<HTMLElement>('[data-calendar-inspector]')!;
        expect(portal).to.exist;
        const card = portal.shadowRoot!.querySelector<HTMLDialogElement>('.card')!;
        expect(card.open).to.be.true;
        expect(card.getBoundingClientRect().width).to.be.greaterThan(100);
        expect(portal.shadowRoot!.activeElement).to.equal(card.querySelector('.close-btn'));
        await sendKeys({ press: 'Escape' });
        await settle();
        expect(el.open).to.be.false;
        expect(document.querySelector('[data-calendar-inspector]')).not.to.exist;
        el.open = true;
        await el.updateComplete;
        await settle();
        await sendMouse({ type: 'click', position: [1, 1] });
        await settle();
        expect(el.open).to.be.false;
        el.open = true;
        await el.updateComplete;
        el.remove();
        expect(document.querySelector('[data-calendar-inspector]')).not.to.exist;
    });
    it('offers a public cancelable canonical export before creating a download', async () => {
        const el = await fixture<Menu>(
            html`<lms-menu .open=${true} .eventDetails=${{
                heading: 'Displayed slice',
                content: '',
                displayTime: 'All Day',
                date: end,
                entry: allDay,
                eventId: 'record-42',
            }}></lms-menu>`,
        );
        let received: CustomEvent | undefined;
        let downloads = 0;
        const original = URL.createObjectURL;
        URL.createObjectURL = () => {
            downloads++;
            return 'blob:test';
        };
        try {
            el.addEventListener('export-entry', (event) => {
                received = event as CustomEvent;
                event.preventDefault();
            });
            el.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
            await settle();
            expect(received).to.exist;
            expect(received!.cancelable && received!.bubbles && received!.composed).to.be.true;
            expect(received!.detail.entry).to.equal(allDay);
            expect(received!.detail.eventId).to.equal('record-42');
            expect(downloads).to.equal(0);
        } finally {
            URL.createObjectURL = original;
        }
    });
    it('runs the real export button default with canonical data and downloads a parseable file', async () => {
        const el = await fixture<Menu>(
            html`<lms-menu .open=${true} .eventDetails=${{ heading: 'Displayed slice', content: 'Slice notes', date: { ...start, day: 8 }, displayTime: 'All Day', entry: allDay, eventId: 'record-42' }}></lms-menu>`,
        );
        const create = URL.createObjectURL;
        const revoke = URL.revokeObjectURL;
        const click = HTMLAnchorElement.prototype.click;
        const blobs: Blob[] = [];
        let filename = '';
        let clicks = 0;
        let revoked = 0;
        URL.createObjectURL = ((blob: Blob) => {
            blobs.push(blob);
            return 'blob:test-export';
        }) as typeof URL.createObjectURL;
        URL.revokeObjectURL = () => {
            revoked++;
        };
        HTMLAnchorElement.prototype.click = function () {
            filename = this.download;
            clicks++;
        };
        try {
            el.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
            await waitUntil(() => blobs.length === 1);
            const result = await blobs[0].text();
            expect(clicks).to.equal(1);
            expect(filename).to.equal('Displayed slice.ics');
            expect(result).to.include('DTSTART;VALUE=DATE:20260307');
            expect(result).to.include('DTEND;VALUE=DATE:20260310');
            expect(parseIcsCalendar(result).events![0].summary).to.equal('Original event');
            await waitUntil(() => revoked === 1);
        } finally {
            URL.createObjectURL = create;
            URL.revokeObjectURL = revoke;
            HTMLAnchorElement.prototype.click = click;
        }
    });

    it('announces export failures instead of silently rejecting an async click', async () => {
        const el = await fixture<Menu>(html`<lms-menu .open=${true}></lms-menu>`);
        let error: unknown;
        el.addEventListener('export-error', (event) => {
            error = (event as CustomEvent).detail.error;
        });
        el.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        await settle();
        expect(error).to.be.instanceOf(Error);
        expect(el.shadowRoot!.querySelector('[role="alert"]')!.textContent).to.include('date');
        expect(el.shadowRoot!.querySelector('.export-btn')!.getAttribute('aria-disabled')).to.equal(
            'false',
        );
    });
});

describe('Canonical RFC 5545 export content', () => {
    it('exports canonical all-day endpoints as DATE values with exclusive DTEND and stable UID', async () => {
        const first = await generateEntryIcs(allDay);
        const second = await generateEntryIcs(allDay);
        expect(first).to.include('DTSTART;VALUE=DATE:20260307');
        expect(first).to.include('DTEND;VALUE=DATE:20260310');
        expect(first).to.include('UID:record-42@lms-calendar');
        expect(second.match(/^UID:.*$/m)![0]).to.equal(first.match(/^UID:.*$/m)![0]);
        const parsed = parseIcsCalendar(first);
        expect(parsed.events).to.have.length(1);
        expect(parsed.events![0].summary).to.equal('Original event');
        expect(parsed.events![0].start.type).to.equal('DATE');
    });
    it('round-trips mixed newline styles and escaped punctuation as calendar text', async () => {
        const heading = 'Notes, by date; now';
        const content = 'First\r\nSecond\rThird\nFourth, with a comma; and a backslash: \\.';
        const result = await generateEntryIcs({ ...allDay, heading, content });
        expect(result.replaceAll('\r\n', '')).not.to.match(/[\r\n]/);
        const [parsed] = parseIcsCalendar(result).events!;
        expect(parsed.summary).to.equal(heading);
        expect(parsed.description).to.equal(content.replace(/\r\n?/g, '\n'));
    });

    it('folds UTF-8 physical lines without splitting Unicode code points', async () => {
        const heading = 'Kalenderüberblick 📅 日本語 '.repeat(8).trimEnd();
        const content = 'Résumé — 📌 لقاء — 日本語 '.repeat(20).trimEnd();
        const result = await generateEntryIcs({ ...allDay, heading, content });
        const lines = result.split('\r\n');
        expect(lines.some((line) => line.startsWith(' '))).to.be.true;
        const encoder = new TextEncoder();
        for (const line of lines) {
            const bytes = encoder.encode(line);
            expect(bytes.byteLength, line).to.be.at.most(75);
            expect(new TextDecoder('utf-8', { fatal: true }).decode(bytes)).to.equal(line);
        }
        const [parsed] = parseIcsCalendar(result).events!;
        expect(parsed.summary).to.equal(heading);
        expect(parsed.description).to.equal(content);
    });

    it('preserves documented legacy multi-day promotion while explicit timed kinds retain timestamps', async () => {
        const entry = {
            ...allDay,
            kind: undefined,
            time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
        };
        expect(await generateEntryIcs(entry)).to.include('DTSTART;VALUE=DATE:20260307');
        expect(await generateEntryIcs({ ...entry, kind: 'timed' })).to.include(
            'DTSTART:20260307T090000',
        );
    });

    it('preserves overnight and multi-day original endpoints rather than using the displayed date', async () => {
        const entry: CalendarEntry = {
            ...allDay,
            kind: 'timed',
            time: { start: { hour: 23, minute: 30 }, end: { hour: 1, minute: 15 } },
        };
        const result = await generateEntryIcs(entry);
        expect(result).to.include('DTSTART:20260307T233000');
        expect(result).to.include('DTEND:20260309T011500');
        expect(result).not.to.include('DTSTART:20260307T233000Z');
        expect(parseIcsCalendar(result).events).to.have.length(1);
    });
    it('converts explicitly zoned endpoints to correct UTC instants across DST', async () => {
        const entry: CalendarEntry = {
            ...allDay,
            kind: 'timed',
            timeZone: 'America/New_York',
            time: { start: { hour: 23, minute: 0 }, end: { hour: 1, minute: 0 } },
        };
        const result = await generateEntryIcs(entry);
        expect(result).to.include('DTSTART:20260308T040000Z');
        expect(result).to.include('DTEND:20260309T050000Z');
        expect(parseIcsCalendar(result).events).to.have.length(1);
    });
    it('rejects ambiguous repeated wall times consistently with ingestion and supports zero-duration timed events', async () => {
        const day = { year: 2026, month: 11, day: 1 };
        const entry: CalendarEntry = {
            ...allDay,
            kind: 'timed',
            date: { start: day, end: day },
            timeZone: 'America/New_York',
            time: { start: { hour: 1, minute: 30 }, end: { hour: 2, minute: 30 } },
        };
        let rejected = false;
        try {
            await generateEntryIcs(entry);
        } catch {
            rejected = true;
        }
        expect(rejected).to.be.true;
        const zero = await generateEntryIcs({
            ...entry,
            time: { start: { hour: 9, minute: 30 }, end: { hour: 9, minute: 30 } },
        });
        expect(zero).to.include('DTSTART:20261101T143000Z');
        expect(zero).not.to.include('DTEND');
        expect(parseIcsCalendar(zero).events).to.have.length(1);
    });

    it('rejects nonexistent local wall times and unsupported zones rather than exporting silently shifted events', async () => {
        const entry: CalendarEntry = {
            ...allDay,
            kind: 'timed',
            date: { start: { ...start, day: 8 }, end },
            timeZone: 'America/New_York',
            time: { start: { hour: 2, minute: 30 }, end: { hour: 3, minute: 30 } },
        };
        let rejected = false;
        try {
            await generateEntryIcs(entry);
        } catch {
            rejected = true;
        }
        expect(rejected).to.be.true;
        rejected = false;
        try {
            await generateEntryIcs({ ...entry, timeZone: 'Not/AZone' });
        } catch {
            rejected = true;
        }
        expect(rejected).to.be.true;
    });
});
