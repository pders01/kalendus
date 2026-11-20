import { rejects } from 'node:assert/strict';

import { expect } from 'chai';

import type {
    ApiCalendarEntry,
    EventPage,
    KalendusClientOptions,
    StreamFactory,
    StreamState,
} from '../../src/adapters/index.js';
import { KalendusApiClient, toCalendarEntry } from '../../src/adapters/kalendus-api-client.js';

const withEventSource = async (value: unknown, check: () => void | Promise<void>) => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'EventSource');
    Object.defineProperty(globalThis, 'EventSource', { configurable: true, value });
    try {
        await check();
    } finally {
        if (previous) Object.defineProperty(globalThis, 'EventSource', previous);
        else Reflect.deleteProperty(globalThis, 'EventSource');
    }
};

class FixtureStream extends EventTarget {
    closed = false;
    close() {
        this.closed = true;
    }
}

type NativeOpen = FixtureStream & { url: string; init: EventSourceInit };

const withNativeFixture = async (check: (opens: NativeOpen[]) => void | Promise<void>) => {
    const opens: NativeOpen[] = [];
    class NativeStream extends FixtureStream {
        constructor(
            readonly url: string,
            readonly init: EventSourceInit,
        ) {
            super();
            opens.push(this);
        }
    }
    await withEventSource(NativeStream, () => check(opens));
};

describe('KalendusApiClient', () => {
    it('does not open native SSE when only custom fetch supplies bearer auth', async () => {
        await withNativeFixture(async (opens) => {
            let restReads = 0;
            const backend: typeof fetch = async (_url, init) => {
                if (new Headers(init?.headers).get('Authorization') !== 'Bearer fixture-token')
                    return new Response(null, { status: 401 });
                restReads++;
                return Response.json([]);
            };
            const client = new KalendusApiClient({
                baseUrl: 'https://api.example',
                calendarId: 'cal1',
                fetch: (url, init) => {
                    const headers = new Headers(init?.headers);
                    headers.set('Authorization', 'Bearer fixture-token');
                    return backend(url, { ...init, headers });
                },
            });
            const range = ['2026-03-15', '2026-03-17'] as const;
            expect(await client.fetchEvents(...range)).to.deep.equal([]);
            expect(restReads).to.equal(1);
            expect(() => client.connect()).to.throw('streamFactory');
            expect(opens).to.have.length(0);
            expect(client.streamState).to.include({ status: 'error', phase: 'startup' });
            expect(await client.fetchEvents(...range)).to.deep.equal([]);
            expect(restReads).to.equal(2);
        });
    });

    it('requests exactly one raw page with encoded cursor, configured auth, credentials and abort signal', async () => {
        const page: EventPage = { entries: [], nextCursor: 'opaque+cursor/=?& more' };
        const requests: Array<{ url: URL; init: RequestInit }> = [];
        const client = new KalendusApiClient({
            baseUrl: 'https://api.example/path/',
            calendarId: 'cal/1',
            headers: async () => ({ Authorization: 'Bearer page-reader' }),
            credentials: 'include',
            fetch: async (input, init) => {
                requests.push({ url: new URL(String(input)), init: init! });
                return Response.json(page);
            },
        });
        const signal = new AbortController().signal;
        const range = ['2026-03-15', '2026-03-17'] as const;
        expect(
            await client.fetchRawEventPage(...range, { limit: 2, after: page.nextCursor! }, signal),
        ).to.deep.equal(page);
        expect(requests).to.have.length(1);
        const [{ url, init }] = requests;
        expect(url.pathname).to.equal('/path/api/calendars/cal%2F1/events/page');
        expect(Object.fromEntries(url.searchParams)).to.deep.equal({
            start: range[0],
            end: range[1],
            limit: '2',
            after: page.nextCursor,
        });
        expect(init.method ?? 'GET').to.equal('GET');
        expect(new Headers(init.headers).get('Authorization')).to.equal('Bearer page-reader');
        expect(init.credentials).to.equal('include');
        expect(init.signal).to.equal(signal);

        await client.fetchRawEventPage(...range);
        expect(requests).to.have.length(2);
        expect(Object.fromEntries(requests[1].url.searchParams)).to.deep.equal({
            start: range[0],
            end: range[1],
        });
    });

    it('keeps one REST request on its original URL, transport and credentials while headers resolve', async () => {
        let resolveHeaders!: (headers: HeadersInit) => void;
        const calls: Array<{ transport: string; request: Request }> = [];
        const transport =
            (label: string): typeof fetch =>
            async (url, init) => {
                calls.push({ transport: label, request: new Request(url, init) });
                return Response.json([]);
            };
        const options: KalendusClientOptions = {
            baseUrl: 'https://api.example',
            calendarId: 'original',
            credentials: 'omit',
            headers: () => new Promise((resolve) => (resolveHeaders = resolve)),
            fetch: transport('original'),
        };
        const client = new KalendusApiClient(options);
        const range = ['2026-03-15', '2026-03-17'] as const;
        const first = client.fetchRawEvents(...range);
        options.calendarId = 'new';
        options.credentials = 'include';
        options.headers = () => ({ Authorization: 'Bearer new' });
        options.fetch = transport('new');
        resolveHeaders({ Authorization: 'Bearer original' });
        await first;
        await client.fetchRawEvents(...range);

        expect(calls.map(({ transport }) => transport)).to.deep.equal(['original', 'new']);
        expect(calls.map(({ request }) => new URL(request.url).pathname)).to.deep.equal([
            '/api/calendars/original/events',
            '/api/calendars/new/events',
        ]);
        expect(calls.map(({ request }) => request.credentials)).to.deep.equal(['omit', 'include']);
        expect(calls.map(({ request }) => request.headers.get('Authorization'))).to.deep.equal([
            'Bearer original',
            'Bearer new',
        ]);
    });

    it('skips the header provider and fetch for a request already canceled', async () => {
        let headers = 0;
        let sends = 0;
        const client = new KalendusApiClient({
            baseUrl: 'https://api.example',
            calendarId: 'cal1',
            headers: () => {
                headers++;
                return {};
            },
            fetch: async () => {
                sends++;
                return Response.json([]);
            },
        });
        const reason = new Error('Request superseded');
        const result = client.fetchRawEvents('2026-03-15', '2026-03-17', AbortSignal.abort(reason));
        await rejects(result, (error) => error === reason);
        expect({ headers, sends }).to.deep.equal({ headers: 0, sends: 0 });
    });

    it('does not dispatch a canceled request when async headers finish', async () => {
        let resolveHeaders!: (headers: HeadersInit) => void;
        let sends = 0;
        const client = new KalendusApiClient({
            baseUrl: 'https://api.example',
            calendarId: 'cal1',
            headers: () => new Promise((resolve) => (resolveHeaders = resolve)),
            fetch: async () => {
                sends++;
                return Response.json([]);
            },
        });
        const controller = new AbortController();
        const reason = new Error('Request superseded');
        const result = client.fetchRawEvents('2026-03-15', '2026-03-17', controller.signal);
        controller.abort(reason);
        resolveHeaders({});
        await rejects(result, (error) => error === reason);
        expect(sends).to.equal(0);
    });

    it('preserves native cookies by default or with explicit opt-in for a REST fetch fixture', async () => {
        await withNativeFixture((opens) => {
            const options = { baseUrl: '/calendar-api', calendarId: 'cal1' };
            const defaultClient = new KalendusApiClient(options);
            defaultClient.connect();
            defaultClient.connect();
            expect(opens).to.have.length(1);
            expect(opens[0].url).to.equal('/calendar-api/api/calendars/cal1/stream');
            expect(opens[0].init).to.deep.equal({ withCredentials: false });
            expect(defaultClient.streamState.status).to.equal('connecting');
            opens[0].dispatchEvent(new Event('connected'));
            expect(defaultClient.streamState.status).to.equal('connected');
            defaultClient.disconnect();
            expect(opens[0].closed).to.equal(true);

            const optIn = {
                ...options,
                fetch: async () => Response.json([]),
                allowNativeEventSourceWithCustomFetch: true,
                credentials: 'include',
            } satisfies KalendusClientOptions;
            const cookieClient = new KalendusApiClient(optIn);
            cookieClient.connect();
            expect(opens).to.have.length(2);
            expect(opens[1].init).to.deep.equal({ withCredentials: true });
            cookieClient.disconnect();

            for (const incompatible of [
                { headers: () => ({ Authorization: 'Bearer fixture-token' }) },
                { credentials: 'omit' as const },
            ]) {
                const client = new KalendusApiClient({ ...optIn, ...incompatible });
                expect(() => client.connect()).to.throw('streamFactory');
            }
            expect(opens).to.have.length(2);
        });
    });

    it('imports the adapter barrel and constructs clients without EventSource', async () => {
        await withEventSource(undefined, async () => {
            const { KalendusApiClient, KalendusLitAdapter } =
                await import('../../src/adapters/index.js');
            const options = { baseUrl: '', calendarId: 'cal1' };
            const adapter = new KalendusLitAdapter(
                { addController() {}, requestUpdate() {} },
                {
                    ...options,
                    enableSync: true,
                },
            );
            expect(adapter.streamState.status).to.equal('disconnected');
            const client = new KalendusApiClient(options);
            expect(() => client.connect()).to.throw('SSE requires EventSource or streamFactory');
            expect(client.streamState).to.include({ status: 'error', phase: 'startup' });
            client.disconnect();
            expect(client.streamState.status).to.equal('disconnected');
        });
    });

    it('cleans up partial startup without forwarding raw errors or events from a failed attachment', () => {
        const stream = new FixtureStream();
        let fail = true;
        const badStream = {
            addEventListener(type: string, listener: (event: Event) => void) {
                stream.addEventListener(type, listener);
                if (type === 'connected')
                    throw new Error('https://api.example/?token=fixture-secret');
            },
            close: () => stream.close(),
        };
        const goodStream = new FixtureStream();
        const streamFactory: StreamFactory = () => (fail ? badStream : goodStream);
        const client = new KalendusApiClient({ baseUrl: '', calendarId: 'cal1', streamFactory });
        const states: StreamState[] = [];
        const off = client.onStreamStateChange((state) => states.push(state));
        let reconciles = 0;
        client.onReconcile(() => reconciles++);
        expect(() => client.connect()).to.throw(/^Could not start the SSE transport$/);
        expect(stream.closed).to.equal(true);
        expect(states.map(({ status }) => status)).to.deep.equal(['connecting', 'error']);
        expect(client.streamState).to.include({ status: 'error', phase: 'startup' });
        if (client.streamState.status !== 'error') throw new Error('Expected startup failure');
        expect(client.streamState.error.message).to.equal('Could not start the SSE transport');
        stream.dispatchEvent(new Event('connected'));
        expect(reconciles).to.equal(0);
        expect(states).to.have.length(2);

        off();
        fail = false;
        client.connect();
        stream.dispatchEvent(new Event('connected'));
        expect(reconciles).to.equal(0);
        expect(client.streamState.status).to.equal('connecting');
        goodStream.dispatchEvent(new Event('connected'));
        expect(reconciles).to.equal(1);
        expect(states).to.have.length(2);
        client.disconnect();
    });

    it('stops a named event mid-notification when a subscriber disconnects', () => {
        const stream = new FixtureStream();
        const client = new KalendusApiClient({
            baseUrl: '',
            calendarId: 'cal1',
            streamFactory: () => stream,
        });
        const states: string[] = [];
        client.onStreamStateChange(({ status }) => {
            if (status === 'connected') client.disconnect();
        });
        client.onStreamStateChange(({ status }) => states.push(status));
        let reconciles = 0;
        client.onReconcile(() => reconciles++);
        client.connect();
        stream.dispatchEvent(new Event('connected'));
        expect(reconciles).to.equal(0);
        expect(states).to.deep.equal(['connecting', 'disconnected']);
        expect(stream.closed).to.equal(true);
    });

    it('separates change notifications from record delivery and reconnect', () => {
        const stream = new FixtureStream();
        const client = new KalendusApiClient({
            baseUrl: '',
            calendarId: 'cal1',
            streamFactory: () => stream,
        });
        const calls: string[] = [];
        const off = client.onInvalidate(() => calls.push('refresh'));
        client.onReconcile(() => calls.push('reconcile'));
        client.onSync(({ type, data }) => calls.push(`${type}:${data.id}`));
        client.connect();
        stream.dispatchEvent(new MessageEvent('invalidated', { data: '{}' }));
        expect(calls).to.deep.equal(['refresh']);
        stream.dispatchEvent(new MessageEvent('updated', { data: '{"id":"legacy"}' }));
        stream.dispatchEvent(new MessageEvent('updated', { data: '{}' }));
        stream.dispatchEvent(new MessageEvent('connected'));
        expect(calls).to.deep.equal(['refresh', 'updated:legacy', 'refresh', 'reconcile']);
        off();
        stream.dispatchEvent(new MessageEvent('invalidated', { data: '{}' }));
        client.disconnect();
        stream.dispatchEvent(new MessageEvent('connected'));
        expect(calls).to.have.length(4);
    });

    it('interprets only explicitly identified legacy sentinels as all-day', async () => {
        const legacy: ApiCalendarEntry = {
            id: 'legacy-all-day',
            calendarId: 'cal1',
            heading: 'Imported all-day event',
            content: null,
            color: '#000',
            date: {
                start: { year: 2026, month: 3, day: 15 },
                end: { year: 2026, month: 3, day: 17 },
            },
            time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
        };
        const modern = { ...legacy, id: 'modern-timed' };
        const nearMatch = {
            ...legacy,
            id: 'near-match',
            time: { start: { hour: 0, minute: 1 }, end: { hour: 23, minute: 59 } },
        };
        const rows = [legacy, modern, nearMatch];
        const options = { baseUrl: '', calendarId: 'cal1', fetch: async () => Response.json(rows) };
        const range = ['2026-03-15', '2026-03-17'] as const;
        const defaults = await new KalendusApiClient(options).fetchEvents(...range);
        expect(defaults.map(({ kind }) => kind)).to.deep.equal(['timed', 'timed', 'timed']);

        const optedIn = new KalendusApiClient({
            ...options,
            isLegacyAllDay: ({ id }) => id === legacy.id || id === nearMatch.id,
        });
        const entries = await optedIn.fetchEvents(...range);
        expect(entries.map(({ kind }) => kind)).to.deep.equal(['all-day', 'timed', 'timed']);
        expect(entries[0].time).to.deep.equal(legacy.time);
        expect(await optedIn.fetchRawEvents(...range)).to.deep.equal(rows);
    });

    describe('toCalendarEntry', () => {
        it('maps a timed event correctly', () => {
            const api: ApiCalendarEntry = {
                id: 'evt1',
                calendarId: 'cal1',
                heading: 'Meeting',
                content: 'Daily sync',
                color: '#1976d2',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.kind).to.equal('timed');
            expect(entry.heading).to.equal('Meeting');
            expect(entry.content).to.equal('Daily sync');
            expect(entry.color).to.equal('#1976d2');
            expect(entry.isContinuation).to.be.false;
            expect(entry.time).to.deep.equal({
                start: { hour: 9, minute: 0 },
                end: { hour: 10, minute: 0 },
            });
        });

        it('marks null time as all-day and retains the compatibility sentinel', () => {
            const api: ApiCalendarEntry = {
                id: 'evt2',
                calendarId: 'cal1',
                heading: 'All Day',
                content: null,
                color: '#ff0000',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
                time: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.kind).to.equal('all-day');
            expect(entry.time).to.deep.equal({
                start: { hour: 0, minute: 0 },
                end: { hour: 23, minute: 59 },
            });
        });

        it('defaults null content to empty string', () => {
            const api: ApiCalendarEntry = {
                id: 'evt3',
                calendarId: 'cal1',
                heading: 'No Content',
                content: null,
                color: '#000',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
                time: {
                    start: { hour: 10, minute: 0 },
                    end: { hour: 11, minute: 0 },
                },
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.content).to.equal('');
        });

        it('always sets isContinuation to false', () => {
            const api: ApiCalendarEntry = {
                id: 'evt4',
                calendarId: 'cal1',
                heading: 'Multi-day',
                content: 'Conference',
                color: '#000',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 17 },
                },
                time: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.isContinuation).to.be.false;
        });
    });
});
