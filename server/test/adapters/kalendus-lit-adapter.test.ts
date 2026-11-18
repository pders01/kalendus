import { expect } from 'chai';

import { KalendusApiClient, toCalendarEntry } from '../../src/adapters/kalendus-api-client.js';
import {
    KalendusLitAdapter,
    type CalendarTarget,
} from '../../src/adapters/kalendus-lit-adapter.js';
import type { ApiCalendarEntry, CalendarState, StreamTransport } from '../../src/adapters/types.js';
import { createApp } from '../../src/http/app.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

const state = (
    start: string,
    end: string,
    viewMode: CalendarState['viewMode'] = 'month',
    firstDayOfWeek = 0,
): CalendarState => ({
    activeDate: { year: 2024, month: 3, day: 10 },
    viewMode,
    firstDayOfWeek,
    range: { start, end },
});
const api = (id: string): ApiCalendarEntry => ({
    id,
    calendarId: 'calendar',
    heading: id,
    color: '#123456',
    content: null,
    date: { start: { year: 2024, month: 3, day: 10 }, end: { year: 2024, month: 3, day: 10 } },
    time: null,
    createdAt: '',
    updatedAt: '',
});
const response = (id: string) =>
    new Response(JSON.stringify([api(id)]), { headers: { 'Content-Type': 'application/json' } });
const flush = async () => {
    for (let count = 0; count < 12; count++) await Promise.resolve();
};
class Host extends EventTarget {
    updates = 0;
    addController() {}
    requestUpdate() {
        this.updates++;
    }
    renderRoot: { querySelector: (selector: string) => CalendarTarget | null } = {
        querySelector: () => null,
    };
}
class Target extends EventTarget implements CalendarTarget {
    constructor(public snapshot: CalendarState) {
        super();
    }
    get activeDate() {
        return this.snapshot.activeDate;
    }
    get viewMode() {
        return this.snapshot.viewMode;
    }
    get firstDayOfWeek() {
        return this.snapshot.firstDayOfWeek;
    }
    get visibleRange() {
        return this.snapshot.range;
    }
    navigate(snapshot: CalendarState) {
        this.snapshot = snapshot;
        this.dispatchEvent(
            new CustomEvent('calendar-state-change', {
                detail: snapshot,
                bubbles: true,
                composed: true,
            }),
        );
    }
}
class Stream extends EventTarget implements StreamTransport {
    closed = false;
    close() {
        this.closed = true;
    }
    connected() {
        this.dispatchEvent(new MessageEvent('connected', { data: '{}' }));
    }
}

describe('Adapter public state contract (nonbrowser)', () => {
    it('initializes an already-rendered public target and dedupes event/hostUpdated; no private state required', async () => {
        const host = new Host();
        const target = new Target(state('2024-02-25', '2024-04-07'));
        host.renderRoot.querySelector = () => target;
        const urls: string[] = [];
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: 'https://api.example',
            calendarId: 'calendar',
            fetch: async (url) => {
                urls.push(String(url));
                return response('initial');
            },
        });
        adapter.hostConnected();
        await flush();
        expect(urls).to.have.length(1);
        expect(urls[0]).to.include('start=2024-02-25&end=2024-04-06');
        adapter.hostUpdated();
        target.navigate(target.snapshot);
        await flush();
        expect(urls).to.have.length(1);
        target.navigate(state('2024-03-10', '2024-03-11', 'day'));
        await flush();
        expect(urls[1]).to.include('start=2024-03-10&end=2024-03-10');
        expect(adapter.entries[0].id).to.equal('initial');
        adapter.hostDisconnected();
    });

    it('initializes after hostUpdated finds a new child and consumes canonical event without a queryable target', async () => {
        const host = new Host();
        const urls: string[] = [];
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: '',
            calendarId: 'calendar',
            fetch: async (url) => {
                urls.push(String(url));
                return response('late');
            },
        });
        adapter.hostConnected();
        expect(urls).to.have.length(0);
        host.dispatchEvent(
            new CustomEvent('calendar-state-change', {
                detail: state('2024-12-01', '2025-01-01'),
                bubbles: true,
                composed: true,
            }),
        );
        await flush();
        expect(urls[0]).to.include('end=2024-12-31');
        const target = new Target(state('2024-01-01', '2025-01-01', 'year'));
        host.renderRoot.querySelector = () => target;
        adapter.hostUpdated();
        await flush();
        expect(urls[1]).to.include('start=2024-01-01&end=2024-12-31');
        adapter.hostDisconnected();
    });

    it('converts the exclusive upper civil-date sentinel into a valid inclusive query', async () => {
        const host = new Host();
        const urls: string[] = [];
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: '',
            calendarId: 'calendar',
            initialState: {
                ...state('9999-12-31', '10000-01-01', 'day'),
                activeDate: { year: 9999, month: 12, day: 31 },
            },
            fetch: async (url) => {
                urls.push(String(url));
                return response('upper');
            },
        });
        adapter.hostConnected();
        await flush();
        expect(urls).to.have.length(1);
        expect(urls[0]).to.include('start=9999-12-31&end=9999-12-31');
        adapter.hostDisconnected();
    });

    it('uses exact provided responsive ranges and all seven first-day policies rather than recomputing Monday/six weeks', async () => {
        const host = new Host();
        const target = new Target(state('2024-03-10', '2024-03-17', 'week'));
        const urls: string[] = [];
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: '',
            calendarId: 'calendar',
            target,
            fetch: async (url) => {
                urls.push(String(url));
                return response('range');
            },
        });
        adapter.hostConnected();
        for (let day = 0; day < 7; day++) {
            const start = `2024-03-${String(10 + day).padStart(2, '0')}`;
            const end = `2024-03-${String(17 + day).padStart(2, '0')}`;
            target.navigate(state(start, end, 'week', day));
            await flush();
            expect(urls.at(-1)).to.include(`start=${start}&end=2024-03-${16 + day}`);
        }
        target.navigate(state('2024-02-25', '2024-03-31', 'month', 0));
        await flush();
        expect(urls.at(-1)).to.include('end=2024-03-30');
        adapter.hostDisconnected();
    });

    for (const staleRejects of [false, true])
        it(`latest request wins even when aborted transport ${staleRejects ? 'rejects late' : 'resolves late'}`, async () => {
            const host = new Host();
            const calls: Array<{
                resolve: (response: Response) => void;
                reject: (error: Error) => void;
                signal: AbortSignal;
            }> = [];
            const adapter = new KalendusLitAdapter(host as never, {
                baseUrl: '',
                calendarId: 'calendar',
                fetch: (_url, init) =>
                    new Promise((resolve, reject) => {
                        calls.push({ resolve, reject, signal: init!.signal! });
                    }),
            });
            const first = adapter.fetchRange('2024-01-01', '2024-01-31');
            const second = adapter.fetchRange('2024-02-01', '2024-02-29');
            expect(calls[0].signal.aborted).to.equal(true);
            calls[1].resolve(response('newest'));
            await second;
            const updates = host.updates;
            if (staleRejects) calls[0].reject(new Error('stale'));
            else calls[0].resolve(response('obsolete'));
            await first;
            expect(adapter.entries.map((entry) => entry.id)).to.deep.equal(['newest']);
            expect(adapter.error).to.equal(null);
            expect(adapter.loading).to.equal(false);
            expect(host.updates).to.equal(updates);
        });

    it('disconnect cancels work, reconnects listeners and reconciles missed mutations on connected', async () => {
        const host = new Host();
        const target = new Target(state('2024-03-10', '2024-03-11', 'day'));
        const streams: Stream[] = [];
        let requests = 0;
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: '',
            calendarId: 'calendar',
            target,
            enableSync: true,
            streamFactory: () => {
                const stream = new Stream();
                streams.push(stream);
                return stream;
            },
            fetch: async () => response(`revision-${++requests}`),
        });
        adapter.hostConnected();
        await flush();
        streams[0].connected();
        await flush();
        expect(requests).to.equal(2);
        // No mutation messages arrived during outage; reconnect must still replace entries.
        streams[0].connected();
        await flush();
        expect(adapter.entries[0].id).to.equal('revision-3');
        adapter.hostDisconnected();
        expect(streams[0].closed).to.equal(true);
        target.navigate(state('2024-03-11', '2024-03-12', 'day'));
        await flush();
        expect(requests).to.equal(3);
        adapter.hostConnected();
        await flush();
        expect(requests).to.equal(4);
        streams[0].connected();
        streams[0].dispatchEvent(new MessageEvent('invalidated', { data: '{}' }));
        await flush();
        expect(requests).to.equal(4);
        adapter.hostDisconnected();
    });

    it('coalesces mixed default and legacy invalidation bursts into one current-range refresh', async () => {
        const host = new Host();
        const target = new Target(state('2024-03-10', '2024-03-11', 'day'));
        const stream = new Stream();
        let requests = 0;
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: '',
            calendarId: 'calendar',
            target,
            enableSync: true,
            streamFactory: () => stream,
            fetch: async () => response(`burst-${++requests}`),
        });
        adapter.hostConnected();
        await flush();
        for (let i = 0; i < 50; i++) {
            stream.dispatchEvent(new MessageEvent('invalidated', { data: '{}' }));
            stream.dispatchEvent(
                new MessageEvent('updated', { data: JSON.stringify(api(String(i))) }),
            );
        }
        await flush();
        expect(requests).to.equal(2);
        expect(adapter.entries[0].id).to.equal('burst-2');
        adapter.hostDisconnected();
    });

    it('does not clear loading when a superseded request fails before the current one settles', async () => {
        const host = new Host();
        const calls: Array<{
            resolve: (response: Response) => void;
            reject: (error: Error) => void;
        }> = [];
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: '',
            calendarId: 'calendar',
            fetch: () => new Promise((resolve, reject) => calls.push({ resolve, reject })),
        });
        const first = adapter.fetchRange('2024-01-01', '2024-01-31');
        const second = adapter.fetchRange('2024-02-01', '2024-02-29');
        calls[0].reject(new Error('obsolete'));
        await first;
        expect(adapter.loading).to.equal(true);
        expect(adapter.error).to.equal(null);
        calls[1].resolve(response('current'));
        await second;
        expect(adapter.loading).to.equal(false);
    });

    it('current failures surface, refresh retries, and a detached in-flight request cannot publish', async () => {
        const host = new Host();
        let fail = true;
        let signal: AbortSignal | undefined;
        const adapter = new KalendusLitAdapter(host as never, {
            baseUrl: '',
            calendarId: 'calendar',
            fetch: async (_url, init) => {
                signal = init?.signal ?? undefined;
                if (fail) throw new Error('current failure');
                return response('retried');
            },
        });
        await adapter.fetchRange('2024-03-10', '2024-03-10');
        expect(adapter.error?.message).to.equal('current failure');
        fail = false;
        await adapter.refresh();
        expect(adapter.error).to.equal(null);
        expect(adapter.entries[0].id).to.equal('retried');
        const pending = adapter.refresh();
        adapter.hostDisconnected();
        await pending;
        expect(signal?.aborted).to.equal(true);
        expect(adapter.loading).to.equal(false);
    });

    it('preserves persistent identity and isolates nested mapped dates/times and all-day sentinels', () => {
        const original = api('one');
        const first = toCalendarEntry(original);
        const second = toCalendarEntry(api('two'));
        first.time.start.hour = 8;
        first.date.start.day = 20;
        expect(second.time.start.hour).to.equal(0);
        expect(original.date.start.day).to.equal(10);
        expect(first.id).to.equal('one');
        expect(second.id).to.equal('two');
    });

    it('selects/updates/deletes one identical-looking persisted entry through mapped client identity', async () => {
        const db = createTestDb();
        try {
            const calendarId = createCalendar(db).id;
            createEvent(db, calendarId);
            createEvent(db, calendarId);
            const { app } = createApp({
                db,
                authorize: ({ request }) => request.headers.get('Authorization') === 'Bearer owner',
            });
            const client = new KalendusApiClient({
                baseUrl: 'https://calendar.example',
                calendarId,
                headers: { Authorization: 'Bearer owner' },
                fetch: async (input, init) => app.request(new Request(input, init)),
            });
            const displayed = await client.fetchEvents('2026-03-15', '2026-03-15');
            expect(displayed).to.have.length(2);
            expect(displayed[0].id).not.to.equal(displayed[1].id);
            await client.updateEvent(displayed[0].id, { heading: 'Selected entry' });
            await client.deleteEvent(displayed[0].id);
            const remaining = await client.fetchEvents('2026-03-15', '2026-03-15');
            expect(remaining).to.have.length(1);
            expect(remaining[0].id).to.equal(displayed[1].id);
            expect(remaining[0].heading).to.equal('Test Event');
        } finally {
            db.$client.close();
        }
    });

    it('uses configured authorized fetch, credentials and custom SSE rather than pretending EventSource supports headers', async () => {
        const calls: RequestInit[] = [];
        const stream = new Stream();
        let streamInit: unknown;
        const client = new KalendusApiClient({
            baseUrl: 'https://api.example',
            calendarId: 'calendar',
            credentials: 'include',
            headers: async () => ({ Authorization: 'Bearer fresh', 'X-CSRF-Token': 'csrf' }),
            fetch: async (_url, init) => {
                calls.push(init!);
                return response('authorized');
            },
            streamFactory: (_url, init) => {
                streamInit = init;
                return stream;
            },
        });
        await client.fetchEvents('2024-03-10', '2024-03-10');
        expect(new Headers(calls[0].headers).get('Authorization')).to.equal('Bearer fresh');
        expect(calls[0].credentials).to.equal('include');
        client.connect();
        expect(streamInit).to.deep.equal({ withCredentials: true, credentials: 'include' });
        client.disconnect();
        expect(stream.closed).to.equal(true);
        // Node has no EventSource; lack of a custom transport is reported, not a global import crash.
        expect(() =>
            new KalendusApiClient({ baseUrl: '', calendarId: 'calendar' }).connect(),
        ).to.throw();
    });
});
