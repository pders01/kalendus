import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { resetMouse, sendKeys, sendMouse, setViewport } from '@web/test-runner-commands';

import {
    enableEntryInteractions,
    type EntryChangeRequest,
    type EntryInteractions,
} from '../../../src/entry-interactions.js';
import type Calendar from '../../../src/lms-calendar.js';
import type { CalendarEntry } from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';

const date = Object.freeze({ year: 2026, month: 11, day: 17 });
const time = (hour: number, minute = 0) => ({ hour, minute });
const entry = Object.freeze({
    kind: 'timed' as const,
    id: 'lecture-42',
    heading: 'Lecture',
    date: Object.freeze({ start: date, end: date }),
    time: Object.freeze({ start: Object.freeze(time(9)), end: Object.freeze(time(10, 30)) }),
    revision: 7,
});
const move = { kind: 'move' } as const;
const resizeEnd = { kind: 'resize', edge: 'end' } as const;

async function setup(
    viewMode: 'day' | 'week' = 'day',
    dir = 'ltr',
    source: CalendarEntry = entry,
    activeDate = date,
) {
    const frame = await fixture<HTMLElement>(html`
        <div><lms-calendar .entries=${[source]} .activeDate=${activeDate} .viewMode=${viewMode}
            dir=${dir} style="width:970px;height:590px;font:16px Arial"></lms-calendar></div>
    `);
    const calendar = frame.querySelector<Calendar>('lms-calendar')!;
    await calendar.localeReady;
    const root = calendar.shadowRoot!;
    const grid = () => root.querySelector(`lms-calendar-${viewMode}`)!;
    await waitUntil(() => grid()?.shadowRoot?.querySelector('slot[name^="timed"]'));
    for (let frame = 0; frame < 5; frame++) await nextFrame();
    const scroller = grid().shadowRoot!.querySelector<HTMLElement>('.main, .week-scroll')!;
    const column = () => scroller.querySelector<HTMLElement>('.timed-content, .day-column')!;
    const scale = column().getBoundingClientRect().height / 1440;
    scroller.scrollTop = Math.round(480 * scale);
    await nextFrame();
    const requests: EntryChangeRequest[] = [];
    const activations: Event[] = [];
    frame.addEventListener('entry-change-request', (e) => requests.push(e.detail));
    frame.addEventListener('entry-activate', (e) => {
        activations.push(e);
        e.preventDefault();
    });
    const card = () =>
        root.querySelector<HTMLElement>(`lms-calendar-entry[data-event-id="${source.id}"]`)!;
    return { calendar, scroller, grid, card, scale, requests, activations };
}

const pointerAt = ([x, y]: [number, number]) =>
    sendMouse({ type: 'move', position: [Math.round(x), Math.round(y)] });
const press = () => sendMouse({ type: 'down' });
const release = () => sendMouse({ type: 'up' });

function point(card: HTMLElement, edge?: 'start' | 'end'): [number, number] {
    const box = card.getBoundingClientRect();
    return [
        Math.round(box.left + box.width / 2),
        Math.round(
            edge === 'start'
                ? box.top + 3
                : edge === 'end'
                  ? box.bottom - 3
                  : box.top + box.height / 2,
        ),
    ];
}

describe('opt-in timed entry interactions', () => {
    let controller: EntryInteractions | undefined;
    before(async () => setViewport({ width: 1100, height: 700 }));
    afterEach(async () => {
        controller?.dispose();
        controller = undefined;
        await resetMouse();
    });

    it('offers controlled requests to callers without modifying entries or reflecting a change', async () => {
        const { calendar, requests } = await setup();
        controller = enableEntryInteractions(calendar, {
            canChange: (_entry, operation) => operation.kind === 'move',
        });
        const entries = calendar.entries;
        expect(controller.requestChange(entry, resizeEnd, 15)).to.equal(false);
        expect(controller.requestChange(entry, move, 0)).to.equal(false);
        expect(controller.requestChange({ ...entry }, move, 15)).to.equal(false);
        expect(controller.requestChange(entry, move, 15)).to.equal(true);
        expect(calendar.entries).to.equal(entries);
        expect(requests).to.have.length(1);
        expect(requests[0]).to.deep.equal({
            source: 'api',
            operation: move,
            eventId: entry.id,
            entry,
            proposed: { ...entry, time: { start: time(9, 15), end: time(10, 45) } },
        });
        expect(requests[0].entry).to.equal(entry);
        controller.dispose();
        expect(controller.requestChange(entry, move, 15)).to.equal(false);
        controller = enableEntryInteractions(calendar);
        expect(controller.requestChange(entry, resizeEnd, 15)).to.equal(true);
    });

    it('only proposes edits to the accepted record for a duplicate ID', async () => {
        const { calendar, requests } = await setup();
        const duplicate = { ...entry, heading: 'Duplicate' };
        const invalid = { ...entry, date: { start: { ...date, month: 0 }, end: date } };
        calendar.entries = [invalid, entry, duplicate];
        controller = enableEntryInteractions(calendar);
        expect(controller.requestChange(duplicate, move, 15)).to.equal(false);
        expect(requests).to.be.empty;
        expect(controller.requestChange(entry, move, 15)).to.equal(true);
        expect(requests[0].entry).to.equal(entry);
    });

    it('previews a snapped Day move and emits just one bubbling request without opening details', async () => {
        const { calendar, grid, card, scale, requests, activations } = await setup();
        const [x, y] = point(card());
        await sendMouse({ type: 'click', position: [x, y] });
        await waitUntil(() => activations.length === 1);
        controller = enableEntryInteractions(calendar);
        grid().shadowRoot!.querySelector<HTMLElement>('.main')!.focus();
        const before = card().getBoundingClientRect().top;
        await pointerAt([x, y]);
        await press();
        await pointerAt([x, y + scale * 32]);
        const preview = () => grid().shadowRoot!.querySelector('[data-kalendus-change-preview]');
        await waitUntil(preview);
        expect(card().getBoundingClientRect().top).to.equal(before);
        expect(requests).to.be.empty;
        await release();
        expect(preview()).not.to.exist;
        expect(requests).to.have.length(1);
        expect(requests[0].entry).to.equal(entry);
        expect(requests[0].proposed.time).to.deep.equal({ start: time(9, 30), end: time(11) });
        expect(requests[0].source).to.equal('pointer');
        expect(activations).to.have.length(1);
        expect(calendar.entries[0]).to.equal(entry);
        await sendMouse({ type: 'click', position: [x, y] });
        await waitUntil(() => activations.length === 2);
    });

    for (const dir of ['ltr', 'rtl']) {
        it(`moves between rendered Week columns using their civil dates (${dir})`, async () => {
            const { calendar, card, scale, requests } = await setup('week', dir);
            controller = enableEntryInteractions(calendar, { snapMinutes: 5 });
            const after =
                card().assignedSlot!.parentElement!.nextElementSibling!.getBoundingClientRect();
            const [x, y] = point(card());
            expect(dir === 'rtl' ? after.right < x : after.left > x).to.equal(true);
            await pointerAt([x, y]);
            await press();
            await pointerAt([after.left + after.width / 2, y + scale * 11]);
            await release();
            expect(requests).to.have.length(1);
            expect(requests[0].proposed.date).to.deep.equal({
                start: { ...date, day: 18 },
                end: { ...date, day: 18 },
            });
            expect(requests[0].proposed.time).to.deep.equal({
                start: time(9, 10),
                end: time(10, 40),
            });
        });
    }

    for (const edge of ['start', 'end'] as const) {
        it(`resizes only the ${edge} endpoint`, async () => {
            const { calendar, card, scale, requests } = await setup();
            controller = enableEntryInteractions(calendar);
            const [x, y] = point(card(), edge);
            await pointerAt([x, y]);
            await press();
            await pointerAt([x, y + scale * 15]);
            await release();
            expect(requests).to.have.length(1);
            expect(requests[0].operation).to.deep.equal({ kind: 'resize', edge });
            expect(requests[0].proposed.time).to.deep.equal({
                ...entry.time,
                [edge]: edge === 'start' ? time(9, 15) : time(10, 45),
            });
        });
    }

    for (const inTail of [false, true]) {
        it(`resizes the end past the grid with a 10-minute snap from ${inTail ? 'the minimum-height tail' : 'just inside midnight'}`, async () => {
            const originalTime = Object.freeze(
                inTail
                    ? { start: time(23, 43), end: time(23, 50) }
                    : { start: time(23), end: time(24) },
            );
            const source = Object.freeze({ ...entry, time: originalTime });
            const { calendar, card, grid, scroller, scale, requests, activations } = await setup(
                'day',
                'ltr',
                source,
            );
            controller = enableEntryInteractions(calendar, { snapMinutes: 10 });
            scroller.scrollTop = scroller.scrollHeight;
            await nextFrame();
            const [x, endGripY] = point(card(), 'end');
            const midnightY = card().assignedSlot!.parentElement!.getBoundingClientRect().bottom;
            const y = inTail ? endGripY : Math.floor(midnightY) - 1;
            const dropY = Math.round(y + scale * 10);
            if (inTail) expect(y).to.be.greaterThan(midnightY);
            else {
                expect(y).to.be.lessThan(midnightY);
                // Clamping at midnight would erase this entire 10-minute snap.
                expect(midnightY - y).to.be.lessThan(scale * 5);
            }
            expect(dropY).to.be.greaterThan(midnightY);
            expect(dropY).to.be.lessThan(
                scroller.getBoundingClientRect().top + scroller.clientHeight,
            );
            await pointerAt([x, y]);
            expect(card().getAttribute('data-kalendus-edit')).to.equal('resize');
            await press();
            await pointerAt([x, dropY]);
            const preview = () =>
                grid().shadowRoot!.querySelector('[data-kalendus-change-preview]');
            await waitUntil(preview, 'end resize did not preview a proposal');
            expect(requests).to.be.empty;
            await release();
            expect(requests).to.have.length(1);
            expect(requests[0]).to.deep.equal({
                source: 'pointer',
                eventId: source.id,
                entry: source,
                operation: resizeEnd,
                proposed: {
                    ...source,
                    date: { start: date, end: { ...date, day: 18 } },
                    time: { start: originalTime.start, end: time(0, inTail ? 0 : 10) },
                },
            });
            expect(preview()).not.to.exist;
            expect(activations).to.be.empty;
            expect(calendar.entries[0]).to.equal(source);
            expect(source.time).to.equal(originalTime);
        });
    }

    it('clears the preview and rejects an end resize past the supported date range', async () => {
        const lastDay = { year: 9999, month: 12, day: 31 };
        const source = {
            ...entry,
            date: { start: lastDay, end: lastDay },
            time: { start: time(23), end: time(24) },
        };
        const { calendar, card, grid, scroller, scale, requests } = await setup(
            'day',
            'ltr',
            source,
            lastDay,
        );
        controller = enableEntryInteractions(calendar, { snapMinutes: 10 });
        scroller.scrollTop = scroller.scrollHeight;
        await nextFrame();
        const [x] = point(card(), 'end');
        const midnightY = card().assignedSlot!.parentElement!.getBoundingClientRect().bottom;
        const y = Math.floor(midnightY) - 1;
        const preview = () => grid().shadowRoot!.querySelector('[data-kalendus-change-preview]');
        await pointerAt([x, y]);
        await press();
        await pointerAt([x, y - scale * 10]);
        await waitUntil(preview);
        await pointerAt([x, y + scale * 10]);
        await waitUntil(() => !preview());
        await release();
        expect(requests).to.be.empty;
        expect(calendar.entries[0]).to.equal(source);
    });

    it('does not offer a resize at a continuation boundary', async () => {
        const source = {
            ...entry,
            date: { start: { ...date, day: 16 }, end: date },
            time: { start: time(23), end: time(9, 30) },
        };
        const { calendar, card, scroller, scale, requests } = await setup('day', 'ltr', source);
        controller = enableEntryInteractions(calendar);
        scroller.scrollTop = 0;
        await nextFrame();
        const [x, y] = point(card(), 'start');
        await pointerAt([x, y]);
        expect(card().getAttribute('data-kalendus-grips')).to.equal('end');
        await press();
        await pointerAt([x, y + scale * 15]);
        await release();
        expect(requests).to.have.length(1);
        expect(requests[0].operation).to.deep.equal(move);
        expect(requests[0].entry).to.equal(source);
        expect(requests[0].proposed.date.start.day).to.equal(16);
        expect(requests[0].proposed.time).to.deep.equal({ start: time(23, 15), end: time(9, 45) });
    });

    it('scrolls a clipped Day timeline while the pointer stays near its bottom edge', async () => {
        const { calendar, card, scroller, requests } = await setup();
        controller = enableEntryInteractions(calendar);
        const [x, y] = point(card());
        const endY = scroller.getBoundingClientRect().bottom - 9;
        const scrollTop = scroller.scrollTop;
        await pointerAt([x, y]);
        await press();
        await pointerAt([x, endY]);
        await waitUntil(() => scroller.scrollTop > scrollTop + 25);
        await release();
        expect(requests).to.have.length(1);
        expect(requests[0].proposed.time!.start.hour).to.be.greaterThan(9);
    });

    for (const action of ['escape', 'outside', 'refetch', 'dispose'] as const) {
        it(`drops the preview without proposing any edits on ${action}`, async () => {
            const { calendar, card, grid, scale, requests, activations } = await setup();
            controller = enableEntryInteractions(calendar);
            const [x, y] = point(card());
            const preview = () =>
                grid().shadowRoot!.querySelector('[data-kalendus-change-preview]');
            await pointerAt([x, y]);
            await press();
            await pointerAt([x, y + scale * 15]);
            await waitUntil(preview);
            if (action === 'escape') await sendKeys({ press: 'Escape' });
            if (action === 'outside') await pointerAt([1020, y]);
            if (action === 'refetch') calendar.entries = [{ ...entry }];
            if (action === 'dispose') controller.dispose();
            await release();
            await nextFrame();
            expect(preview()).not.to.exist;
            expect(requests).to.be.empty;
            if (action !== 'dispose') expect(activations).to.be.empty;
        });
    }
});
