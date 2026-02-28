import { expect } from 'chai';
import { createTestDb } from '../helpers/test-db.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createApp } from '../../src/http/app.js';

describe('Event Routes', () => {
    let app: ReturnType<typeof createApp>['app'];
    let db: ReturnType<typeof createTestDb>;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        ({ app } = createApp({ db, enableLogger: false }));
        const cal = createCalendar(db);
        calId = cal.id;
    });

    describe('GET /api/calendars/:id/events', () => {
        it('returns events in date range', async () => {
            createEvent(db, calId, {
                startYear: 2026, startMonth: 3, startDay: 15,
                endYear: 2026, endMonth: 3, endDay: 15,
            });

            const res = await app.request(
                `/api/calendars/${calId}/events?start=2026-03-01&end=2026-03-31`,
            );
            expect(res.status).to.equal(200);
            const body = await res.json();
            expect(body).to.have.length(1);
        });

        it('validates query params', async () => {
            const res = await app.request(
                `/api/calendars/${calId}/events`,
            );
            expect(res.status).to.equal(400);
        });
    });

    describe('GET /api/calendars/:id/events/summary', () => {
        it('returns per-day counts', async () => {
            createEvent(db, calId, {
                startYear: 2026, startMonth: 3, startDay: 15,
                endYear: 2026, endMonth: 3, endDay: 16,
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

    describe('POST /api/calendars/:id/events', () => {
        it('creates an event', async () => {
            const res = await app.request(
                `/api/calendars/${calId}/events`,
                {
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
                },
            );
            expect(res.status).to.equal(201);
            const body = await res.json();
            expect(body.heading).to.equal('New Event');
            expect(body.id).to.be.a('string');
        });

        it('validates required heading', async () => {
            const res = await app.request(
                `/api/calendars/${calId}/events`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        date: {
                            start: { year: 2026, month: 3, day: 15 },
                            end: { year: 2026, month: 3, day: 15 },
                        },
                    }),
                },
            );
            expect(res.status).to.equal(400);
        });
    });

    describe('PATCH /api/calendars/:id/events/:eventId', () => {
        it('updates an event', async () => {
            const evt = createEvent(db, calId);
            const res = await app.request(
                `/api/calendars/${calId}/events/${evt.id}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ heading: 'Updated' }),
                },
            );
            expect(res.status).to.equal(200);
            const body = await res.json();
            expect(body.heading).to.equal('Updated');
        });

        it('returns 404 for missing event', async () => {
            const res = await app.request(
                `/api/calendars/${calId}/events/nope`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ heading: 'X' }),
                },
            );
            expect(res.status).to.equal(404);
        });
    });

    describe('DELETE /api/calendars/:id/events/:eventId', () => {
        it('deletes an event', async () => {
            const evt = createEvent(db, calId);
            const res = await app.request(
                `/api/calendars/${calId}/events/${evt.id}`,
                { method: 'DELETE' },
            );
            expect(res.status).to.equal(200);
        });

        it('returns 404 for missing event', async () => {
            const res = await app.request(
                `/api/calendars/${calId}/events/nope`,
                { method: 'DELETE' },
            );
            expect(res.status).to.equal(404);
        });
    });
});
