import { expect } from 'chai';

import { createApp } from '../../src/http/app.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

describe('Event Routes', () => {
    let app: ReturnType<typeof createApp>['app'];
    let db: ReturnType<typeof createTestDb>;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        ({ app } = createApp({ db, enableLogger: false, mode: 'public' }));
        const cal = createCalendar(db);
        calId = cal.id;
    });

    afterEach(() => db.$client.close());

    describe('GET /api/calendars/:id/events', () => {
        it('returns events in date range', async () => {
            createEvent(db, calId, {
                startYear: 2026,
                startMonth: 3,
                startDay: 15,
                endYear: 2026,
                endMonth: 3,
                endDay: 15,
            });

            const res = await app.request(
                `/api/calendars/${calId}/events?start=2026-03-01&end=2026-03-31`,
            );
            expect(res.status).to.equal(200);
            const body = await res.json();
            expect(body).to.have.length(1);
        });

        it('validates query params', async () => {
            const res = await app.request(`/api/calendars/${calId}/events`);
            expect(res.status).to.equal(400);
        });
    });

    describe('GET /api/calendars/:id/events/summary', () => {
        it('returns per-day counts', async () => {
            createEvent(db, calId, {
                startYear: 2026,
                startMonth: 3,
                startDay: 15,
                endYear: 2026,
                endMonth: 3,
                endDay: 16,
            });

            const res = await app.request(
                `/api/calendars/${calId}/events/summary?start=2026-03-01&end=2026-03-31`,
            );
            expect(res.status).to.equal(200);
            const body = await res.json();
            expect(body['2026-03-15']).to.equal(1);
            expect(body['2026-03-16']).to.equal(1);
        });
    });

    describe('GET /api/calendars/:calendarId/events/page', () => {
        const range = '?start=2026-03-15&end=2026-03-15';

        it('pages by exclusive ID across identical entries with the same overlap rules as the list', async () => {
            createEvent(db, calId, { id: 'z-identical' });
            createEvent(db, calId, { id: 'm-identical' });
            createEvent(db, calId, { id: 'a-overlap', startDay: 14 });
            createEvent(db, calId, { id: 'n-outside', startDay: 16, endDay: 16 });
            createEvent(db, createCalendar(db).id, { id: 'b-foreign' });
            const url = `/api/calendars/${calId}/events`;
            const unpaged = await app.request(`${url}${range}&limit=1`);
            expect(unpaged.status).to.equal(200);
            const entries = (await unpaged.json()) as { id: string }[];
            expect(entries.map(({ id }) => id)).to.have.members([
                'a-overlap',
                'm-identical',
                'z-identical',
            ]);
            const byId = new Map(entries.map((entry) => [entry.id, entry]));

            for (const [suffix, ids, nextCursor] of [
                ['', ['a-overlap', 'm-identical'], 'm-identical'],
                ['&after=m-identical', ['z-identical'], null],
                ['&after=n-cursor-with-no-record', ['z-identical'], null],
                ['&after=z-identical', [], null],
            ] as const) {
                const result = await app.request(`${url}/page${range}&limit=2${suffix}`);
                expect(result.status).to.equal(200);
                expect(await result.json()).to.deep.equal({
                    entries: ids.map((id) => byId.get(id)),
                    nextCursor,
                });
            }
        });

        it('rejects invalid civil ranges, cursors and limits with field-keyed errors', async () => {
            const url = `/api/calendars/${calId}/events/page`;
            for (const [query, field] of [
                ['?start=1969-12-31&end=1970-01-01', 'start'],
                ['?start=2026-02-29&end=2026-03-01', 'start'],
                ['?start=2026-03-16&end=2026-03-15', 'input'],
                ['?start=2026-03-15&end=2027-03-16', 'input'],
                [`${range}&after=bad%2Fid`, 'after'],
                [`${range}&after=`, 'after'],
                [`${range}&limit=0`, 'limit'],
                [`${range}&limit=10000`, 'limit'],
                [`${range}&limit=1.5`, 'limit'],
                [`${range}&limit=1&limit=2`, 'limit'],
            ]) {
                const result = await app.request(`${url}${query}`);
                expect(result.status, query).to.equal(400);
                const error = await result.json();
                expect(error.error, query).to.equal('Invalid input');
                expect(error.details, query).to.have.property(field).that.is.an('array');
                expect(error.details[field].length, query).to.be.greaterThan(0);
            }
        });
    });

    describe('POST /api/calendars/:id/events', () => {
        it('creates an event', async () => {
            const res = await app.request(`/api/calendars/${calId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    heading: 'New Event',
                    date: {
                        start: { year: 2026, month: 3, day: 15 },
                        end: { year: 2026, month: 3, day: 15 },
                    },
                    time: {
                        start: { hour: 10, minute: 0 },
                        end: { hour: 11, minute: 0 },
                    },
                }),
            });
            expect(res.status).to.equal(201);
            const body = await res.json();
            expect(body.heading).to.equal('New Event');
            expect(body.id).to.be.a('string');
        });

        it('validates required heading', async () => {
            const res = await app.request(`/api/calendars/${calId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: {
                        start: { year: 2026, month: 3, day: 15 },
                        end: { year: 2026, month: 3, day: 15 },
                    },
                }),
            });
            expect(res.status).to.equal(400);
        });
    });

    describe('PATCH /api/calendars/:id/events/:eventId', () => {
        it('updates an event', async () => {
            const evt = createEvent(db, calId);
            const res = await app.request(`/api/calendars/${calId}/events/${evt.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ heading: 'Updated' }),
            });
            expect(res.status).to.equal(200);
            const body = await res.json();
            expect(body.heading).to.equal('Updated');
        });

        it('returns 404 for missing event', async () => {
            const res = await app.request(`/api/calendars/${calId}/events/nope`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ heading: 'X' }),
            });
            expect(res.status).to.equal(404);
        });
    });

    describe('DELETE /api/calendars/:id/events/:eventId', () => {
        it('deletes an event', async () => {
            const evt = createEvent(db, calId);
            const res = await app.request(`/api/calendars/${calId}/events/${evt.id}`, {
                method: 'DELETE',
            });
            expect(res.status).to.equal(200);
        });

        it('returns 404 for missing event', async () => {
            const res = await app.request(`/api/calendars/${calId}/events/nope`, {
                method: 'DELETE',
            });
            expect(res.status).to.equal(404);
        });
    });
});
