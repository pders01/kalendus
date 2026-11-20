import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';
import { HTTPException } from 'hono/http-exception';

import { EventBus } from '../../src/core/event-bus.js';
import { createDb } from '../../src/db/connection.js';
import { migrateDb } from '../../src/db/migrate.js';
import { createApp } from '../../src/http/app.js';
import { createCalendar } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

type App = ReturnType<typeof createApp>['app'];

function observeSubscriptions(bus: EventBus) {
    const subscribe = bus.subscribe.bind(bus);
    const channels = new Set<string>();
    let calls = 0;
    bus.subscribe = (channel, callback) => {
        calls++;
        channels.add(channel);
        return subscribe(channel, callback);
    };
    return {
        calls: () => calls,
        active: () => [...channels].reduce((sum, channel) => sum + bus.subscriberCount(channel), 0),
    };
}

function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((finish) => {
        resolve = finish;
    });
    return { promise, resolve };
}

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
    let sharedBus: EventBus;
    let eventBus: EventBus;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        sharedBus = new EventBus();
        ({ app, eventBus } = createApp({
            db,
            eventBus: sharedBus,
            enableLogger: false,
            mode: 'public',
        }));
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

    it('authorizes a stream HEAD and validates its parent without running the details policy or subscribing', async () => {
        let detailsCalls = 0;
        const { app, eventBus, syncService } = createApp({
            db,
            eventBus: sharedBus,
            authorize: ({ request, action, resource }) =>
                request.headers.has('X-Allowed') && action === 'stream' && resource === 'stream',
            authorizeStreamDetails: ({ request }) => {
                detailsCalls++;
                if (request.method === 'HEAD') throw new HTTPException(418);
                return true;
            },
        });
        const observed = observeSubscriptions(eventBus);
        const url = `/api/calendars/${calId}/stream`;
        const headers = { 'X-Allowed': 'yes' };
        const denied = await app.request(url, { method: 'HEAD' });
        const missing = await app.request('/api/calendars/missing/stream', {
            method: 'HEAD',
            headers,
        });
        const head = await app.request(url, { method: 'HEAD', headers });
        expect([denied.status, missing.status, head.status]).to.deep.equal([403, 404, 200]);
        expect(head.body).to.equal(null);
        expect(head.headers.get('Content-Type')).to.equal('text/event-stream');
        expect(detailsCalls).to.equal(0);
        expect(observed.calls()).to.equal(0);

        const get = await app.request(url, { headers });
        const reader = get.body!.getReader();
        try {
            expect(await read(reader)).to.include('event: connected');
            expect(get.headers.get('Content-Type')).to.equal(head.headers.get('Content-Type'));
            expect(detailsCalls).to.equal(1);
            expect(syncService.subscriberCount(calId)).to.equal(1);
            expect(observed.active()).to.equal(2);
        } finally {
            await reader.cancel();
        }
        expect(observed.active()).to.equal(0);
    });

    it('publishes direct service mutations and removal to a sibling app using the same store', async () => {
        const sibling = createApp({ db, eventBus: sharedBus });
        const { eventService, calendarService } = sibling;
        expect(sibling.eventBus).to.equal(eventBus);
        const res = await app.request(`/api/calendars/${calId}/stream`);
        const reader = res.body!.getReader();
        try {
            expect(await read(reader)).to.include('event: connected');
            const entry = await eventService.create(calId, eventData);
            expect(await read(reader)).to.equal(invalidation);
            expect(
                await eventService.update(calId, entry.id, { heading: 'Direct update' }),
            ).to.include({ heading: 'Direct update' });
            expect(await read(reader)).to.equal(invalidation);
            expect(await eventService.delete(calId, entry.id)).to.equal(true);
            expect(await read(reader)).to.equal(invalidation);
            expect(await calendarService.delete(calId)).to.equal(true);
            expect(await read(reader)).to.equal(invalidation);
            expect(await readChunk(reader)).to.have.property('done', true);
        } finally {
            await reader.cancel();
        }
        expect(sibling.syncService.subscriberCount(calId)).to.equal(0);
    });

    it('isolates mutations and removal from another store even with the same calendar ID and supplied bus', async () => {
        const otherDb = createTestDb();
        try {
            createCalendar(otherDb, { id: calId });
            const other = createApp({ db: otherDb, eventBus: sharedBus, mode: 'public' });
            const local = createApp({
                db,
                eventBus: sharedBus,
                mode: 'public',
                authorizeStreamDetails: () => true,
            });
            const url = `/api/calendars/${calId}`;
            const res = await local.app.request(`${url}/stream`);
            const reader = res.body!.getReader();
            try {
                expect(await read(reader)).to.include('event: connected');
                expect((await post(other.app, calId)).status).to.equal(201);
                expect((await other.app.request(url, { method: 'DELETE' })).status).to.equal(200);
                const entry = await local.eventService.create(calId, {
                    ...eventData,
                    heading: 'Local event',
                });
                expect(await read(reader)).to.equal(
                    `event: created\ndata: ${JSON.stringify(entry)}\n\n`,
                );
                expect(local.syncService.subscriberCount(calId)).to.equal(1);
            } finally {
                await reader.cancel();
            }
        } finally {
            otherDb.$client.close();
        }
    });

    it('can share an explicit bus scope across two SQLite handles to one store', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'kalendus-sse-scope-'));
        const path = join(dir, 'calendar.db');
        const readDb = createDb(path);
        const writeDb = createDb(path);
        try {
            migrateDb(writeDb);
            const eventBusScope = {};
            const options = { eventBus: sharedBus, eventBusScope };
            const subscriber = createApp({ db: readDb, ...options, mode: 'public' });
            const writer = createApp({ db: writeDb, ...options });
            const { id } = createCalendar(writeDb);
            expect(subscriber.eventBus).to.equal(writer.eventBus);
            const res = await subscriber.app.request(`/api/calendars/${id}/stream`);
            const reader = res.body!.getReader();
            try {
                expect(await read(reader)).to.include('event: connected');
                await writer.eventService.create(id, eventData);
                expect(await read(reader)).to.equal(invalidation);
                await writer.calendarService.delete(id);
                expect(await read(reader)).to.equal(invalidation);
                expect(await readChunk(reader)).to.have.property('done', true);
            } finally {
                await reader.cancel();
            }
        } finally {
            writeDb.$client.close();
            readDb.$client.close();
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('keeps event details private unless a separate whole-calendar grant is given', async () => {
        const checked: string[] = [];
        const protectedApp = createApp({
            db,
            eventBus: sharedBus,
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
        const {
            app: wiredRoutes,
            syncService,
            eventBus,
        } = createApp({
            db,
            eventBus: sharedBus,
            mode: 'public',
            authorizeStreamDetails: ({ request }) => request.headers.has('X-Details'),
        });
        const observed = observeSubscriptions(eventBus);
        const url = `/api/calendars/${calId}`;
        expect((await post(app, calId)).status).to.equal(201);
        const streams = await Promise.all([
            wiredRoutes.request(`${url}/stream`),
            wiredRoutes.request(`${url}/stream`, { headers: { 'X-Details': 'true' } }),
        ]);
        const readers = streams.map((stream) => stream.body!.getReader());
        const snapshots: unknown[] = [];
        const unsubscribe = syncService.onCalendarRemoved(calId, () => {
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
        expect(observed.active()).to.equal(0);
    });

    for (const recreate of [false, true]) {
        it(`rejects a stream if its parent is ${recreate ? 'deleted and recreated' : 'deleted without a signal'} during the details grant`, async () => {
            const entered = deferred<void>();
            const grant = deferred<boolean>();
            const wired = createApp({
                db,
                eventBus: sharedBus,
                mode: 'public',
                authorizeStreamDetails: () => {
                    entered.resolve();
                    return grant.promise;
                },
            });
            const observed = observeSubscriptions(wired.eventBus);
            const opening = wired.app.request(`/api/calendars/${calId}/stream`);
            await entered.promise;
            try {
                if (recreate) {
                    expect(await wired.calendarService.delete(calId)).to.equal(true);
                    createCalendar(db, { id: calId });
                } else {
                    const deleted = db.$client
                        .prepare('DELETE FROM calendars WHERE id = ?')
                        .run(calId);
                    expect(deleted.changes).to.equal(1);
                }
            } finally {
                grant.resolve(true);
            }
            const opened = await opening;
            try {
                expect(opened.status).to.equal(404);
                expect(wired.syncService.subscriberCount(calId)).to.equal(0);
                expect(observed.active()).to.equal(0);
            } finally {
                await opened.body?.cancel();
            }
        });
    }

    it('does not open a stream when the details policy throws', async () => {
        const { app, eventBus } = createApp({
            db,
            eventBus: sharedBus,
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
