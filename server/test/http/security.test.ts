import { expect } from 'chai';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { createApp, type AppDeps } from '../../src/http/app.js';
import type { AuthorizationRequest } from '../../src/http/authorization.js';
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
            [`/${id}`, 'GET'],
            [`/${id}`, 'HEAD'],
            [`/${id}`, 'PATCH'],
            [`/${id}`, 'DELETE'],
            [`/${id}/manifest`, 'GET'],
            [`/${id}/events${range}`, 'GET'],
            [`/${id}/events/summary${range}`, 'GET'],
            [`/${id}/events/summary${range}`, 'HEAD'],
            [`/${id}/events`, 'POST'],
            [`/${id}/events/example`, 'PATCH'],
            [`/${id}/events/example`, 'DELETE'],
            [`/${id}/stream`, 'GET'],
            [`/${id}/stream`, 'HEAD'],
            [`/${id}/telemetry`, 'POST'],
        ])
            expect(
                (
                    await app.request(
                        `/api/calendars${path}`,
                        json(method, method === 'GET' || method === 'HEAD' ? undefined : {}),
                    )
                ).status,
                `${method} ${path}`,
            ).to.equal(403);
        expect((await app.request('/health')).status).to.equal(200);
    });

    it('does not invent an ACL context for unmatched routes under the protected prefix', async () => {
        const contexts: AuthorizationRequest[] = [];
        const { app } = createApp({
            db,
            authorize: (context) => {
                contexts.push(context);
                return false;
            },
        });
        for (const [method, path] of [
            ['POST', '/api/calendars/'],
            ['PUT', `/api/calendars/${id}`],
            ['GET', `/api/calendars/${id}/events/missing`],
            ['HEAD', `/api/calendars/${id}/unknown`],
        ]) {
            const response = await app.request(path, { method });
            expect(response.status, `${method} ${path}`).to.equal(404);
            expect(response.headers.get('Cache-Control')).to.equal('no-store');
            expect(response.headers.get('X-Content-Type-Options')).to.equal('nosniff');
        }
        expect(contexts).to.deep.equal([]);
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

    it('passes the exact route authorization context through a tenant mount, including HEAD', async () => {
        const contexts: AuthorizationRequest[] = [];
        const { app } = createApp({
            db,
            authorize: (context) => {
                contexts.push(context);
                return true;
            },
        });
        const host = new Hono();
        host.route('/tenants/:tenant', app);
        const prefix = '/tenants/acme/api/calendars';
        // Static GET/HEAD endpoints must not turn into event IDs; those same IDs are valid on mutations.
        createEvent(db, id, { id: 'summary' });
        type Case = {
            path: string;
            method: string;
            resource: AuthorizationRequest['resource'];
            action: AuthorizationRequest['action'];
            calendarId?: string;
            eventId?: string;
            status: number;
            body?: unknown;
        };
        const reads = [
            [`/${id}`, 'calendar', 'read'],
            [`/${id}/manifest`, 'manifest', 'read'],
            [`/${id}/events${range}`, 'event', 'read'],
            [`/${id}/events/summary${range}`, 'event', 'read'],
            [`/${id}/stream`, 'stream', 'stream'],
        ] as const;
        const cases: Case[] = [
            {
                path: '',
                method: 'POST',
                resource: 'calendar',
                action: 'create',
                status: 201,
                body: { name: 'New' },
            },
            ...reads.flatMap(([path, resource, action]) =>
                ['GET', 'HEAD'].map((method) => ({
                    path,
                    method,
                    resource,
                    action,
                    calendarId: id,
                    status: 200,
                })),
            ),
            {
                path: `/${id}`,
                method: 'PATCH',
                resource: 'calendar',
                action: 'write',
                calendarId: id,
                status: 200,
                body: { name: 'Updated' },
            },
            {
                path: `/${id}/events`,
                method: 'POST',
                resource: 'event',
                action: 'create',
                calendarId: id,
                status: 201,
                body: validEvent,
            },
            {
                path: `/${id}/events/summary`,
                method: 'PATCH',
                resource: 'event',
                action: 'write',
                calendarId: id,
                eventId: 'summary',
                status: 200,
                body: { heading: 'Updated' },
            },
            {
                path: `/${id}/events/summary`,
                method: 'DELETE',
                resource: 'event',
                action: 'delete',
                calendarId: id,
                eventId: 'summary',
                status: 200,
            },
            {
                path: `/${id}/telemetry`,
                method: 'POST',
                resource: 'telemetry',
                action: 'telemetry',
                calendarId: id,
                status: 202,
                body: { action: 'view', calendarId: id },
            },
            {
                path: `/${id}`,
                method: 'DELETE',
                resource: 'calendar',
                action: 'delete',
                calendarId: id,
                status: 200,
            },
        ];
        for (const { path, method, resource, action, calendarId, eventId, status, body } of cases) {
            const label = `${method} ${path}`;
            const res = await host.request(`${prefix}${path}`, json(method, body));
            try {
                expect(res.status, label).to.equal(status);
                expect(contexts, label).to.have.length(1);
                const { request, ...context } = contexts.pop()!;
                expect(context, label).to.deep.equal({ resource, action, calendarId, eventId });
                expect(request.method, label).to.equal(method);
                expect(request.url, label).to.equal(`http://localhost${prefix}${path}`);
                expect(res.headers.get('Cache-Control'), label).to.equal('no-store');
                expect(res.headers.get('X-Content-Type-Options'), label).to.equal('nosniff');
                if (method === 'HEAD') expect(res.body, label).to.equal(null);
            } finally {
                await res.body?.cancel();
            }
        }
    });

    it('denies before looking up a parent or interpreting input, with no cross-calendar mutation', async () => {
        const foreignId = createCalendar(db).id;
        const { id: eventId, heading } = createEvent(db, foreignId);
        const missingId = 'missing';
        const { app, eventService } = createApp({
            db,
            authorize: ({ calendarId }) => calendarId === id,
        });
        for (const target of [foreignId, missingId]) {
            const denied = await app.request(`/api/calendars/${target}/events/${eventId}`, {
                ...json('PATCH', {}),
                body: '{',
            });
            expect(denied.status).to.equal(403);
            expect(await denied.text()).to.equal('Access denied');
            expect(denied.headers.get('Cache-Control')).to.equal('no-store');
            expect(denied.headers.get('X-Content-Type-Options')).to.equal('nosniff');
            const deniedHead = await app.request(`/api/calendars/${target}/events/summary`, {
                method: 'HEAD',
            });
            expect(deniedHead.status).to.equal(403);
            expect(deniedHead.body).to.equal(null);
        }
        const ownerEvent = `/api/calendars/${id}/events/${eventId}`;
        expect(
            (await app.request(ownerEvent, json('PATCH', { heading: 'stolen' }))).status,
        ).to.equal(404);
        expect((await app.request(ownerEvent, { method: 'DELETE' })).status).to.equal(404);
        const entries = await eventService.getByRange(foreignId, '2026-03-15', '2026-03-15');
        expect(entries.map(({ id, heading }) => ({ id, heading }))).to.deep.equal([
            { id: eventId, heading },
        ]);
    });

    it('validates authorized input before a service-owned parent lookup, but keeps telemetry parent-first', async () => {
        const { app } = createApp({ db, mode: 'public', telemetryRate: { limit: 1 } });
        const prefix = '/api/calendars/missing';
        expect((await app.request(prefix, json('PATCH', { name: '' }))).status).to.equal(400);
        expect((await app.request(prefix, json('PATCH', { name: 'Valid' }))).status).to.equal(404);
        expect((await app.request(`${prefix}/events`, json('POST', {}))).status).to.equal(400);
        expect((await app.request(`${prefix}/events`, json('POST', validEvent))).status).to.equal(
            404,
        );
        expect((await app.request(`${prefix}/events`)).status).to.equal(400);
        expect((await app.request(`${prefix}/events${range}`)).status).to.equal(404);
        expect((await app.request(`${prefix}/telemetry`, json('POST', {}))).status).to.equal(404);
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
        expect(denied.headers.get('Cache-Control')).to.equal('no-store');
        expect(calls).to.equal(0);
        const headDenied = await app.request(`/api/calendars/${id}/events/summary${range}`, {
            method: 'HEAD',
            headers: { Origin: 'https://evil.example' },
        });
        expect(headDenied.status).to.equal(403);
        expect(headDenied.body).to.equal(null);
        expect(headDenied.headers.get('X-Content-Type-Options')).to.equal('nosniff');
        expect(calls).to.equal(0);
        const allowed = await app.request(`/api/calendars/${id}`, {
            method: 'HEAD',
            headers: { Origin: 'https://app.example' },
        });
        expect(allowed.status).to.equal(200);
        expect(allowed.body).to.equal(null);
        expect(calls).to.equal(1);
        expect(allowed.headers.get('Access-Control-Allow-Origin')).to.equal('https://app.example');
        expect(allowed.headers.get('Access-Control-Allow-Credentials')).to.equal('true');
        const preflight = await app.request(`/api/calendars/${id}`, {
            method: 'OPTIONS',
            headers: { Origin: 'https://app.example', 'Access-Control-Request-Method': 'HEAD' },
        });
        expect(preflight.status).to.equal(204);
        expect(preflight.headers.get('Access-Control-Allow-Methods')?.split(',')).to.include(
            'HEAD',
        );
        expect(preflight.headers.get('Cache-Control')).to.equal('no-store');
        const blockedPreflight = await app.request(`/api/calendars/${id}`, {
            method: 'OPTIONS',
            headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'HEAD' },
        });
        expect(blockedPreflight.status).to.equal(403);
        expect(blockedPreflight.headers.get('Access-Control-Allow-Origin')).to.equal(null);
        expect(calls).to.equal(1);
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
        const limited = await app.request(`/api/calendars/${id}/events`, {
            ...json('POST', { ...validEvent, content: 'x'.repeat(40_000) }),
            headers: { 'Content-Type': 'application/json', 'Content-Length': '1' },
        });
        expect(limited.status).to.equal(413);
        expect(limited.headers.get('Cache-Control')).to.equal('no-store');
        expect(limited.headers.get('X-Content-Type-Options')).to.equal('nosniff');
    });

    it('preserves intentional HTTP exception headers and sanitizes unexpected failures', async () => {
        const { app } = createApp({
            db,
            authorize: () => {
                throw new HTTPException(401, {
                    res: new Response('Login required', {
                        status: 401,
                        headers: { 'WWW-Authenticate': 'Bearer' },
                    }),
                });
            },
        });
        app.get('/unexpected', () => {
            throw new Error('private database secret');
        });
        for (const method of ['GET', 'HEAD']) {
            const expected = await app.request(`/api/calendars/${id}`, { method });
            expect(expected.status).to.equal(401);
            expect(expected.headers.get('WWW-Authenticate')).to.equal('Bearer');
            expect(expected.headers.get('Cache-Control')).to.equal('no-store');
            expect(await expected.text()).to.equal(method === 'GET' ? 'Login required' : '');
        }
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

    it('uses the same validation error for POST and merged PATCH, leaving stored state unchanged', async () => {
        const { app, eventService } = createApp({ db, mode: 'public' });
        const dto = structuredClone(validEvent);
        dto.date.end.day = 1;
        dto.date.end.month = 3;
        dto.time.start.hour = 23;
        dto.time.end.hour = 1;
        const event = await eventService.create(id, dto);
        const patch = { date: { start: dto.date.start, end: dto.date.start } };
        const url = `/api/calendars/${id}/events`;
        const created = await app.request(url, json('POST', { ...dto, ...patch }));
        const updated = await app.request(`${url}/${event.id}`, json('PATCH', patch));
        expect(created.status).to.equal(400);
        expect(updated.status).to.equal(400);
        const postError = await created.json();
        expect(postError).to.deep.equal({
            error: 'Invalid input',
            details: {
                time: [
                    'Timed intervals must end after they start; use the next date for overnight events',
                ],
            },
        });
        expect(await updated.json()).to.deep.equal(postError);
        expect(await eventService.getByRange(id, '2024-02-29', '2024-03-01')).to.deep.equal([
            event,
        ]);
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

    it('keeps a global telemetry quota without charging denied attempts', async () => {
        const { app, telemetryService } = createApp({
            db,
            telemetryRate: { limit: 1 },
            authorize: ({ request }) => request.headers.get('Authorization') === 'Bearer allowed',
        });
        const send = (calendarId: string, authorize: boolean) => {
            const init = json('POST', { action: 'nav', calendarId });
            return app.request(`/api/calendars/${calendarId}/telemetry`, {
                ...init,
                headers: authorize
                    ? { ...init.headers, Authorization: 'Bearer allowed' }
                    : init.headers,
            });
        };
        expect((await send(id, false)).status).to.equal(403);
        expect((await send(id, true)).status).to.equal(202);
        for (let i = 0; i < 9; i++)
            expect((await send(createCalendar(db).id, true)).status).to.equal(202);
        const limited = await send(createCalendar(db).id, true);
        expect(limited.status).to.equal(429);
        expect(limited.headers.get('Retry-After')).to.equal('60');
        expect(telemetryService.getEvents()).to.have.length(10);
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
