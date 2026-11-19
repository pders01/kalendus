import { expect } from 'chai';

import { EventBus } from '../../src/core/event-bus.js';
import { createApp } from '../../src/http/app.js';
import { calendarRemovalChannel } from '../../src/http/routes/calendars.js';
import { createCalendar } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

type App = ReturnType<typeof createApp>['app'];

async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            reader.read(),
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => reject(new Error('SSE delivery timeout')), 1000);
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}

async function read(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
    const chunk = await readChunk(reader);
    if (chunk.done) throw new Error('SSE stream closed before notification');
    return new TextDecoder().decode(chunk.value);
}

const invalidation = 'event: invalidated\ndata: {}\n\n';
const eventData = {
    heading: 'SSE event',
    content: 'Private event notes',
    date: {
        start: { year: 2026, month: 3, day: 15 },
        end: { year: 2026, month: 3, day: 15 },
    },
};
const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});
const post = (app: App, calId: string) =>
    app.request(`/api/calendars/${calId}/events`, json('POST', eventData));

describe('Stream Routes', () => {
    let app: App;
    let db: ReturnType<typeof createTestDb>;
    let eventBus: EventBus;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        eventBus = new EventBus();
        ({ app } = createApp({ db, eventBus, enableLogger: false, mode: 'public' }));
        const cal = createCalendar(db);
        calId = cal.id;
    });

    afterEach(() => {
        db.$client.close();
    });

    it('invalidates only the affected calendar after create, update and delete', async () => {
        const secondId = createCalendar(db).id;
        const first = await app.request(`/api/calendars/${calId}/stream`);
        const second = await app.request(`/api/calendars/${secondId}/stream`);
        const readers = [first.body!.getReader(), second.body!.getReader()] as const;
        try {
            expect(await read(readers[0])).to.include('event: connected');
            expect(await read(readers[1])).to.include('event: connected');
            let secondNotified = false;
            const nextOnSecond = read(readers[1]).then((message) => {
                secondNotified = true;
                return message;
            });
            // Keep cleanup from surfacing an unhandled reader rejection if an assertion fails.
            void nextOnSecond.catch(() => {});
            const created = await post(app, calId);
            expect(created.status).to.equal(201);
            const { id } = (await created.json()) as { id: string };
            expect(await read(readers[0])).to.equal(invalidation);
            await new Promise<void>((resolve) => setImmediate(resolve));
            expect(secondNotified).to.equal(false);

            expect((await post(app, secondId)).status).to.equal(201);
            expect(await nextOnSecond).to.equal(invalidation);
            const entryUrl = `/api/calendars/${calId}/events/${id}`;
            expect(
                (await app.request(entryUrl, json('PATCH', { heading: 'Updated' }))).status,
            ).to.equal(200);
            expect(await read(readers[0])).to.equal(invalidation);
            expect((await app.request(entryUrl, { method: 'DELETE' })).status).to.equal(200);
            expect(await read(readers[0])).to.equal(invalidation);
        } finally {
            await Promise.all(readers.map((reader) => reader.cancel()));
        }
        expect(eventBus.subscriberCount(`calendar:${calId}`)).to.equal(0);
        expect(eventBus.subscriberCount(`calendar:${secondId}`)).to.equal(0);
    });

    it('keeps event details private unless a separate whole-calendar grant is given', async () => {
        const checked: string[] = [];
        const protectedApp = createApp({
            db,
            eventBus,
            authorize: ({ request, action, calendarId }) => {
                const role = request.headers.get('X-Test-Role');
                return (
                    calendarId === calId &&
                    (role === 'whole-calendar' ||
                        (role === 'notification-only' && action === 'stream'))
                );
            },
            authorizeStreamDetails: async ({ request, calendarId }) => {
                const role = request.headers.get('X-Test-Role') ?? '';
                checked.push(role);
                return calendarId === calId && role === 'whole-calendar';
            },
        }).app;
        const url = `/api/calendars/${calId}`;
        const headers = (role: string) => ({ headers: { 'X-Test-Role': role } });
        expect((await protectedApp.request(`${url}/stream`, headers('blocked'))).status).to.equal(
            403,
        );
        expect(checked).to.deep.equal([]);
        expect(
            (
                await protectedApp.request(
                    `${url}/events?start=2026-03-15&end=2026-03-15`,
                    headers('notification-only'),
                )
            ).status,
        ).to.equal(403);

        const limited = await protectedApp.request(`${url}/stream`, headers('notification-only'));
        const full = await protectedApp.request(`${url}/stream`, headers('whole-calendar'));
        const readers = [limited.body!.getReader(), full.body!.getReader()] as const;
        try {
            expect(checked).to.deep.equal(['notification-only', 'whole-calendar']);
            expect(await read(readers[0])).to.include('event: connected');
            expect(await read(readers[1])).to.include('event: connected');
            const created = await post(app, calId);
            expect(created.status).to.equal(201);
            const entry = await created.json();
            expect(await read(readers[0])).to.equal(invalidation);
            expect(await read(readers[1])).to.equal(
                `event: created\ndata: ${JSON.stringify(entry)}\n\n`,
            );
        } finally {
            await Promise.all(readers.map((reader) => reader.cancel()));
        }
    });

    it('sends one final payload-free invalidation to open streams after a parent delete commits', async () => {
        const { app: wiredRoutes, syncService } = createApp({
            db,
            eventBus,
            mode: 'public',
            authorizeStreamDetails: ({ request }) => request.headers.has('X-Details'),
        });
        const url = `/api/calendars/${calId}`;
        expect((await post(app, calId)).status).to.equal(201);
        const streams = await Promise.all([
            wiredRoutes.request(`${url}/stream`),
            wiredRoutes.request(`${url}/stream`, { headers: { 'X-Details': 'true' } }),
        ]);
        const readers = streams.map((stream) => stream.body!.getReader());
        const snapshots: unknown[] = [];
        const unsubscribe = eventBus.subscribe(calendarRemovalChannel(calId), () => {
            snapshots.push(
                db.$client.prepare('SELECT count(*) AS n FROM calendars').get(),
                db.$client.prepare('SELECT count(*) AS n FROM events').get(),
            );
        });
        try {
            for (const reader of readers) expect(await read(reader)).to.include('event: connected');
            const terminated = readers.map(async (reader) => {
                expect(await read(reader)).to.equal(invalidation);
                expect(await readChunk(reader)).to.have.property('done', true);
            });
            const deletion = wiredRoutes.request(url, { method: 'DELETE' });
            const [deleted] = await Promise.all([deletion, ...terminated]);
            expect(deleted.status).to.equal(200);
            expect((await wiredRoutes.request(`${url}/stream`)).status).to.equal(404);
            expect((await wiredRoutes.request(url, { method: 'DELETE' })).status).to.equal(404);
            expect(snapshots).to.deep.equal([{ n: 0 }, { n: 0 }]);
        } finally {
            unsubscribe();
            await Promise.all(readers.map((reader) => reader.cancel()));
        }
        expect(syncService.subscriberCount(calId)).to.equal(0);
        expect(eventBus.subscriberCount(calendarRemovalChannel(calId))).to.equal(0);
    });

    it('rejects a stream if the calendar was removed while the details policy was pending', async () => {
        let notifyEntered!: () => void;
        const entered = new Promise<void>((resolve) => {
            notifyEntered = resolve;
        });
        let authorize!: (granted: boolean) => void;
        const grant = new Promise<boolean>((resolve) => {
            authorize = resolve;
        });
        const { app: wiredRoutes, syncService } = createApp({
            db,
            eventBus,
            mode: 'public',
            authorizeStreamDetails: () => {
                notifyEntered();
                return grant;
            },
        });
        const url = `/api/calendars/${calId}`;
        const opening = wiredRoutes.request(`${url}/stream`);
        await entered;
        try {
            expect((await wiredRoutes.request(url, { method: 'DELETE' })).status).to.equal(200);
        } finally {
            authorize(true);
        }
        const opened = await opening;
        try {
            expect(opened.status).to.equal(404);
            expect(syncService.subscriberCount(calId)).to.equal(0);
            expect(eventBus.subscriberCount(calendarRemovalChannel(calId))).to.equal(0);
        } finally {
            await opened.body?.cancel();
        }
    });

    it('does not open a stream when the details policy throws', async () => {
        const { app } = createApp({
            db,
            eventBus,
            authorize: () => true,
            authorizeStreamDetails: () => {
                throw new Error('Host policy unavailable');
            },
        });
        const response = await app.request(`/api/calendars/${calId}/stream`);
        expect(response.status).to.equal(500);
        expect(eventBus.subscriberCount(`calendar:${calId}`)).to.equal(0);
    });

    it('responds with SSE content-type', async () => {
        const controller = new AbortController();
        const res = await app.request(`/api/calendars/${calId}/stream`, {
            signal: controller.signal,
        });
        const reader = res.body!.getReader();
        try {
            expect(res.headers.get('content-type')).to.include('text/event-stream');
            const chunk = await reader.read();
            expect(new TextDecoder().decode(chunk.value)).to.include('event: connected');
            expect(eventBus.subscriberCount(`calendar:${calId}`)).to.equal(1);
        } finally {
            // In-process request signals do not cancel the live response body.
            await reader.cancel();
            controller.abort();
        }
        expect(eventBus.subscriberCount(`calendar:${calId}`)).to.equal(0);
    });
});
