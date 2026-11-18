import { expect } from 'chai';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { createApp, type AppDeps } from '../../src/http/app.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

const json = (method: string, body: unknown) => ({
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
});
const validEvent = {
    heading: 'Valid',
    date: { start: { year: 2024, month: 2, day: 29 }, end: { year: 2024, month: 2, day: 29 } },
    time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
};

describe('Security and validation boundaries', () => {
    let db: ReturnType<typeof createTestDb>;
    let id: string;
    beforeEach(() => {
        db = createTestDb();
        id = createCalendar(db).id;
    });
    afterEach(() => {
        db.$client.close();
    });
    const range = '?start=2024-02-01&end=2024-03-31';

    it('fails closed on every private API route, including collection create and stream', async () => {
        const { app } = createApp({ db });
        for (const [path, method] of [
            ['', 'POST'],
            ['/', 'POST'],
            [`/${id}`, 'GET'],
            [`/${id}`, 'PATCH'],
            [`/${id}`, 'DELETE'],
            [`/${id}/manifest`, 'GET'],
            [`/${id}/events${range}`, 'GET'],
            [`/${id}/events/summary${range}`, 'GET'],
            [`/${id}/events`, 'POST'],
            [`/${id}/events/example`, 'PATCH'],
            [`/${id}/events/example`, 'DELETE'],
            [`/${id}/stream`, 'GET'],
            [`/${id}/telemetry`, 'POST'],
        ])
            expect(
                (
                    await app.request(
                        `/api/calendars${path}`,
                        json(method, method === 'GET' ? undefined : {}),
                    )
                ).status,
                `${method} ${path}`,
            ).to.equal(403);
        expect((await app.request('/health')).status).to.equal(200);
    });

    it('supports cross-user, read-only, and independent stream policy', async () => {
        const otherId = createCalendar(db).id;
        const { app } = createApp({
            db,
            authorize: ({ request, calendarId, action }) =>
                request.headers.get('Authorization') === 'Bearer alice' &&
                calendarId === id &&
                action === 'read',
        });
        const headers = { Authorization: 'Bearer alice' };
        expect((await app.request(`/api/calendars/${id}`, { headers })).status).to.equal(200);
        expect((await app.request(`/api/calendars/${otherId}`, { headers })).status).to.equal(403);
        expect(
            (await app.request(`/api/calendars/${id}/events${range}`, { headers })).status,
        ).to.equal(200);
        expect((await app.request(`/api/calendars/${id}/stream`, { headers })).status).to.equal(
            403,
        );
        expect(
            (
                await app.request(`/api/calendars/${id}`, {
                    ...json('PATCH', { name: 'stolen' }),
                    headers: { ...headers, 'Content-Type': 'application/json' },
                })
            ).status,
        ).to.equal(403);
        expect((await app.request(`/api/calendars/${id}`)).status).to.equal(403);
        const event = createEvent(db, otherId);
        expect(
            (await app.request(`/api/calendars/${otherId}`, { method: 'DELETE', headers })).status,
        ).to.equal(403);
        expect(
            (
                await createApp({ db, mode: 'public' }).eventService.getByRange(
                    otherId,
                    '2026-03-15',
                    '2026-03-15',
                )
            )[0].id,
        ).to.equal(event.id);
    });

    it('keeps authorization scoped to the real calendar when mounted below a tenant prefix', async () => {
        const contexts: Array<{ calendarId?: string; resource: string; action: string }> = [];
        const { app } = createApp({
            db,
            authorize: (context) => {
                contexts.push(context);
                return context.calendarId === id && context.action === 'read';
            },
        });
        const host = new Hono();
        host.route('/tenants/:tenant', app);
        expect(
            (await host.request(`/tenants/alice/api/calendars/${id}/events${range}`)).status,
        ).to.equal(200);
        expect(contexts[0]).to.include({ calendarId: id, resource: 'event', action: 'read' });
        expect(
            (await host.request(`/tenants/alice/api/calendars/${id}`, { method: 'DELETE' })).status,
        ).to.equal(403);
    });

    it('explicit public mode does not override a configured policy', async () => {
        expect(
            (
                await createApp({ db, mode: 'public', authorize: () => false }).app.request(
                    `/api/calendars/${id}`,
                )
            ).status,
        ).to.equal(403);
    });

    it('allows exact credentialed CORS origins but rejects untrusted browser origins before policy', async () => {
        let calls = 0;
        const { app } = createApp({
            db,
            allowedOrigins: ['https://app.example'],
            allowCredentials: true,
            authorize: () => {
                calls++;
                return true;
            },
        });
        const denied = await app.request(`/api/calendars/${id}`, {
            headers: { Origin: 'https://evil.example' },
        });
        expect(denied.status).to.equal(403);
        expect(calls).to.equal(0);
        const allowed = await app.request(`/api/calendars/${id}`, {
            headers: { Origin: 'https://app.example' },
        });
        expect(allowed.status).to.equal(200);
        expect(allowed.headers.get('Access-Control-Allow-Origin')).to.equal('https://app.example');
        expect(allowed.headers.get('Access-Control-Allow-Credentials')).to.equal('true');
        const preflight = await app.request(`/api/calendars/${id}`, {
            method: 'OPTIONS',
            headers: { Origin: 'https://app.example', 'Access-Control-Request-Method': 'PATCH' },
        });
        expect(preflight.status).to.equal(204);
        const defaults = await createApp({ db, mode: 'public' }).app.request(
            `/api/calendars/${id}`,
        );
        expect(defaults.headers.get('Access-Control-Allow-Origin')).to.equal(null);
        expect(() => createApp({ db, allowedOrigins: ['*'] })).to.throw();
    });

    it('preserves malformed JSON and body-limit 4xx without leaking internal errors', async () => {
        const { app } = createApp({ db, mode: 'public' });
        expect(
            (
                await app.request(`/api/calendars/${id}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: '{',
                })
            ).status,
        ).to.equal(400);
        expect(
            (
                await app.request(
                    `/api/calendars/${id}/events`,
                    json('POST', { ...validEvent, content: 'x'.repeat(40_000) }),
                )
            ).status,
        ).to.equal(413);
        // A dishonest small Content-Length must not bypass the byte counter.
        expect(
            (
                await app.request(`/api/calendars/${id}/events`, {
                    ...json('POST', { ...validEvent, content: 'x'.repeat(40_000) }),
                    headers: { 'Content-Type': 'application/json', 'Content-Length': '1' },
                })
            ).status,
        ).to.equal(413);
    });

    it('preserves intentional HTTP exception headers and sanitizes unexpected failures', async () => {
        const { app } = createApp({ db });
        app.get('/intentional', () => {
            throw new HTTPException(401, {
                res: new Response('Login required', {
                    status: 401,
                    headers: { 'WWW-Authenticate': 'Bearer' },
                }),
            });
        });
        app.get('/unexpected', () => {
            throw new Error('private database secret');
        });
        const expected = await app.request('/intentional');
        expect(expected.status).to.equal(401);
        expect(expected.headers.get('WWW-Authenticate')).to.equal('Bearer');
        const log = console.error;
        try {
            console.error = () => {};
            const unexpected = await app.request('/unexpected');
            expect(unexpected.status).to.equal(500);
            expect(await unexpected.json()).to.deep.equal({ error: 'Internal server error' });
        } finally {
            console.error = log;
        }
    });

    it('rejects invalid dates/times/ranges/IDs and missing foreign parents without changing data', async () => {
        const { app, eventService } = createApp({ db, mode: 'public' });
        for (const day of [30, 31]) {
            const dto = structuredClone(validEvent);
            dto.date.start.day = day;
            expect(
                (await app.request(`/api/calendars/${id}/events`, json('POST', dto))).status,
            ).to.equal(400);
        }
        const reversed = structuredClone(validEvent);
        reversed.date.start.month = 3;
        expect(
            (await app.request(`/api/calendars/${id}/events`, json('POST', reversed))).status,
        ).to.equal(400);
        const time = structuredClone(validEvent);
        time.time.end.hour = 8;
        expect(
            (await app.request(`/api/calendars/${id}/events`, json('POST', time))).status,
        ).to.equal(400);
        time.time.end.hour = 24;
        expect(
            (await app.request(`/api/calendars/${id}/events`, json('POST', time))).status,
        ).to.equal(400);
        for (const query of [
            '?start=2023-02-29&end=2024-01-01',
            '?start=2024-03-01&end=2024-02-01',
            '?start=2024-01-01&end=2025-01-01',
        ]) {
            expect((await app.request(`/api/calendars/${id}/events${query}`)).status).to.equal(400);
        }
        expect((await app.request('/api/calendars/bad%20id')).status).to.equal(400);
        expect(
            (await app.request('/api/calendars/missing/events', json('POST', validEvent))).status,
        ).to.equal(404);
        expect(
            (
                await app.request(
                    `/api/calendars/${id}/events`,
                    json('POST', { ...validEvent, id: 'injected', calendarId: 'other' }),
                )
            ).status,
        ).to.equal(400);
        expect(await eventService.getByRange(id, '2024-01-01', '2024-12-31')).to.deep.equal([]);
    });

    it('validates a merged PATCH, leaves stored state unchanged, allows an explicit all-day conversion', async () => {
        const { app, eventService } = createApp({ db, mode: 'public' });
        const dto = structuredClone(validEvent);
        dto.date.end.day = 1;
        dto.date.end.month = 3;
        dto.time.start.hour = 23;
        dto.time.end.hour = 1;
        const event = await eventService.create(id, dto);
        const patch = { date: { start: dto.date.start, end: dto.date.start } };
        expect(
            (await app.request(`/api/calendars/${id}/events/${event.id}`, json('PATCH', patch)))
                .status,
        ).to.equal(400);
        expect((await eventService.getByRange(id, '2024-02-29', '2024-03-01'))[0]).to.deep.equal(
            event,
        );
        expect(
            (
                await app.request(
                    `/api/calendars/${id}/events/${event.id}`,
                    json('PATCH', { ...patch, time: null }),
                )
            ).status,
        ).to.equal(200);
    });

    it('does not misreport a committed mutation when sync subscribers throw/reject', async () => {
        const { app, eventBus } = createApp({ db, mode: 'public' });
        let received = 0;
        eventBus.subscribe(`calendar:${id}`, () => {
            throw new Error('subscriber failure');
        });
        eventBus.subscribe(`calendar:${id}`, async () => {
            throw new Error('async failure');
        });
        eventBus.subscribe(`calendar:${id}`, () => {
            received++;
        });
        const created = await app.request(`/api/calendars/${id}/events`, json('POST', validEvent));
        expect(created.status).to.equal(201);
        expect(received).to.equal(1);
        const event = (await created.json()) as { id: string };
        expect(
            (
                await app.request(
                    `/api/calendars/${id}/events/${event.id}`,
                    json('PATCH', { heading: 'Updated' }),
                )
            ).status,
        ).to.equal(200);
        expect(
            (await app.request(`/api/calendars/${id}/events/${event.id}`, { method: 'DELETE' }))
                .status,
        ).to.equal(200);
        expect(received).to.equal(3);
    });

    it('bounds telemetry metadata/body/rates and validates route IDs and parent existence', async () => {
        const options: AppDeps = {
            db,
            mode: 'public',
            telemetry: {
                capacity: 2,
                sink: () => {
                    throw new Error('sink');
                },
            },
            telemetryRate: { limit: 4 },
        };
        const { app, telemetryService } = createApp(options);
        const send = (body: unknown) =>
            app.request(`/api/calendars/${id}/telemetry`, json('POST', body));
        expect((await send({ action: 'nav', calendarId: 'other' })).status).to.equal(400);
        expect(
            (await send({ action: 'nav', calendarId: id, metadata: { huge: 'x'.repeat(5000) } }))
                .status,
        ).to.equal(400);
        const metadata = { view: 'week', context: { range: [1, 7], compact: true } };
        expect((await send({ action: 'nav', calendarId: id, metadata })).status).to.equal(202);
        expect((await send({ action: 'nav', calendarId: id })).status).to.equal(202);
        const limited = await send({ action: 'nav', calendarId: id });
        expect(limited.status).to.equal(429);
        expect(limited.headers.get('Retry-After')).to.equal('60');
        const recorded = telemetryService.getEvents();
        expect(recorded).to.have.length(2);
        expect(recorded[0].metadata).to.deep.equal(metadata);
        expect(
            (
                await app.request(
                    '/api/calendars/missing/telemetry',
                    json('POST', { action: 'nav', calendarId: 'missing' }),
                )
            ).status,
        ).to.equal(404);
    });

    it('preserves IDs through selecting/updating/deleting one of two identical records', async () => {
        const { eventService } = createApp({ db, mode: 'public' });
        const first = createEvent(db, id);
        const second = createEvent(db, id);
        expect(first.id).not.to.equal(second.id);
        await eventService.update(id, first.id, { heading: 'Only first' });
        await eventService.delete(id, first.id);
        const records = await eventService.getByRange(id, '2026-03-15', '2026-03-15');
        expect(records.map((event) => event.id)).to.deep.equal([second.id]);
        expect(records[0].heading).to.equal('Test Event');
    });
});
