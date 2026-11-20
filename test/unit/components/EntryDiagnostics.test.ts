import { expect, fixture, html } from '@open-wc/testing';

import '../../../src/lms-calendar.js';
import type { EntryValidationIssue } from '../../../src/lib/calendarModel.js';
import { getMessages } from '../../../src/lib/messages.js';
import type { CalendarEntry, default as LMSCalendar } from '../../../src/lms-calendar.js';

type ValidationEvent = HTMLElementEventMap['entries-invalid'];

const day = { year: 2026, month: 3, day: 7 };
const date = { start: day, end: day };
const card = (el: LMSCalendar) => el.shadowRoot!.querySelector('lms-calendar-entry');

async function calendar() {
    return fixture<LMSCalendar>(
        html`<lms-calendar locale="en" view-mode="day" .activeDate=${day}></lms-calendar>`,
    );
}

describe('Entry diagnostics at the public calendar boundary', () => {
    it('reports a bad collection after replacing the rendered entries, but not on attribute removal', async () => {
        const el = await calendar();
        const good = { date, heading: 'Visible event' };
        el.entries = [good];
        await el.updateComplete;
        expect(card(el)).not.to.equal(null);

        const reports: { issues: EntryValidationIssue[]; renderedEntry: boolean }[] = [];
        el.addEventListener('entries-invalid', (event) => {
            reports.push({
                issues: event.detail.issues,
                renderedEntry: Boolean(card(el)),
            });
        });
        Reflect.set(el, 'entries', good);
        await el.updateComplete;
        expect(reports).to.deep.equal([
            {
                issues: [{ index: -1, entry: good, reason: 'Entries must be an array' }],
                renderedEntry: false,
            },
        ]);
        expect(reports[0].issues[0].entry).to.equal(good);

        el.setAttribute('entries', JSON.stringify({ entries: [good] }));
        await el.updateComplete;
        expect(reports[1].issues[0].index).to.equal(-1);
        el.setAttribute('entries', JSON.stringify([good]));
        await el.updateComplete;
        expect(card(el)).not.to.equal(null);
        el.removeAttribute('entries');
        await el.updateComplete;
        expect(card(el)).to.equal(null);
        expect(reports).to.have.length(2);
    });

    it('rejects even offscreen untitled records while an empty string keeps canonical activation and export', async () => {
        const el = await calendar();
        const source = Object.freeze({ id: 'same-id', date, heading: '', content: 'Notes' });
        const missing = { id: source.id, date };
        const outsideDay = { ...day, month: 6 };
        const outside = { date: { start: outsideDay, end: outsideDay }, heading: undefined };
        let report: ValidationEvent | undefined;
        el.addEventListener('entries-invalid', (event) => (report = event));
        Reflect.set(el, 'entries', [missing, source, outside]);
        await el.updateComplete;
        expect(report?.bubbles).to.equal(true);
        expect(report?.composed).to.equal(true);
        expect(report?.cancelable).to.equal(false);
        expect(report?.detail.issues).to.deep.equal([
            { index: 0, entry: missing, reason: 'Invalid heading' },
            { index: 2, entry: outside, reason: 'Invalid heading' },
        ]);
        expect(el.shadowRoot!.querySelectorAll('lms-calendar-entry')).to.have.length(1);
        const entry = card(el)!;
        await entry.updateComplete;

        let activated: CalendarEntry | undefined;
        let exported: CalendarEntry | undefined;
        el.addEventListener('entry-activate', (event) => (activated = event.detail.entry));
        el.addEventListener('export-entry', (event) => {
            exported = event.detail.entry;
            event.preventDefault();
        });
        entry.click();
        const menu = el.shadowRoot!.querySelector('lms-menu')!;
        await el.updateComplete;
        await menu.updateComplete;
        expect(menu.open).to.equal(true);
        expect(menu.eventDetails.heading).to.equal(getMessages('en').noTitle);
        expect(activated).to.equal(source);
        menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        expect(exported).to.equal(source);
        expect(source.heading).to.equal('');
    });
});
