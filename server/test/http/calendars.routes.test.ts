import { expect } from 'chai';
import { createTestDb } from '../helpers/test-db.js';
import { createCalendar } from '../helpers/fixtures.js';
import { createApp } from '../../src/http/app.js';

describe('Calendar Routes', () => {
    let app: ReturnType<typeof createApp>['app'];
    let db: ReturnType<typeof createTestDb>;

    beforeEach(() => {
        db = createTestDb();
        ({ app } = createApp({ db, enableLogger: false }));
    });

    describe('POST /api/calendars', () => {
        it('creates a calendar', async () => {
            const res = await app.request('/api/calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'New Cal' }),
            });
            expect(res.status).to.equal(201);
            const body = await res.json();
            expect(body.name).to.equal('New Cal');
            expect(body.id).to.be.a('string');
        });

        it('validates required name', async () => {
            const res = await app.request('/api/calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(res.status).to.equal(400);
        });
    });

    describe('GET /api/calendars/:id', () => {
        it('returns a calendar', async () => {
            const cal = createCalendar(db, { name: 'Fetched' });
            const res = await app.request(`/api/calendars/${cal.id}`);
            expect(res.status).to.equal(200);
            const body = await res.json();
            expect(body.name).to.equal('Fetched');
        });

        it('returns 404 for missing calendar', async () => {
            const res = await app.request('/api/calendars/nonexistent');
            expect(res.status).to.equal(404);
        });
    });

    describe('PATCH /api/calendars/:id', () => {
        it('updates a calendar', async () => {
            const cal = createCalendar(db);
            const res = await app.request(`/api/calendars/${cal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated' }),
            });
            expect(res.status).to.equal(200);
            const body = await res.json();
            expect(body.name).to.equal('Updated');
        });

        it('returns 404 for missing calendar', async () => {
            const res = await app.request('/api/calendars/nope', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'X' }),
            });
            expect(res.status).to.equal(404);
        });
    });

    describe('DELETE /api/calendars/:id', () => {
        it('deletes a calendar', async () => {
            const cal = createCalendar(db);
            const res = await app.request(`/api/calendars/${cal.id}`, {
                method: 'DELETE',
            });
            expect(res.status).to.equal(200);
        });

        it('returns 404 for missing calendar', async () => {
            const res = await app.request('/api/calendars/nope', {
                method: 'DELETE',
            });
            expect(res.status).to.equal(404);
        });
    });
});
