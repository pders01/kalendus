import { expect } from 'chai';
import { z } from 'zod';

import { KalendusApiClient } from '../../src/adapters/kalendus-api-client.js';
import { createApp } from '../../src/http/app.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

/**
 * Zod schema that validates the response matches ApiCalendarEntry shape.
 * This is a contract test — if the API response shape drifts, this catches it.
 */
const apiCalendarEntrySchema = z.object({
    id: z.string(),
    calendarId: z.string(),
    heading: z.string(),
    content: z.string().nullable(),
    color: z.string(),
    date: z.object({
        start: z.object({
            year: z.number(),
            month: z.number(),
            day: z.number(),
        }),
        end: z.object({
            year: z.number(),
            month: z.number(),
            day: z.number(),
        }),
    }),
    time: z
        .object({
            start: z.object({
                hour: z.number(),
                minute: z.number(),
            }),
            end: z.object({
                hour: z.number(),
                minute: z.number(),
            }),
        })
        .nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

const apiCalendarSchema = z.object({
    id: z.string(),
    name: z.string(),
    locale: z.string(),
    firstDayOfWeek: z.number(),
    color: z.string(),
    themeTokens: z.record(z.string(), z.string()).nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

describe('Contract: Response Shape Validation', () => {
    let app: ReturnType<typeof createApp>['app'];
    let db: ReturnType<typeof createTestDb>;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        ({ app } = createApp({ db, enableLogger: false, mode: 'public' }));
        const cal = createCalendar(db);
        calId = cal.id;
    });

    it('GET /api/calendars/:id matches ApiCalendar schema', async () => {
        const res = await app.request(`/api/calendars/${calId}`);
        const body = await res.json();
        const result = apiCalendarSchema.safeParse(body);
        expect(result.success).to.be.true;
    });

    it('round-trips populated and cleared theme tokens through CRUD and the client manifest', async () => {
        const themeTokens = { '--accent-color': '#223344', '--week-min-day-width': '9em' };
        const metadata = { name: 'Themed', locale: 'de', firstDayOfWeek: 0, color: '#223344' };
        const url = `/api/calendars/${calId}`;
        const client = new KalendusApiClient({
            baseUrl: 'https://calendar.example',
            calendarId: calId,
            fetch: async (input, init) => app.request(new Request(input, init)),
        });
        const patch = (tokens: typeof themeTokens | null, fields: Partial<typeof metadata> = {}) =>
            app.request(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...fields, themeTokens: tokens }),
            });
        expect((await patch(themeTokens, metadata)).status).to.equal(200);
        const stored = apiCalendarSchema.parse(await (await app.request(url)).json());
        expect(stored.themeTokens).to.deep.equal(themeTokens);
        expect(await client.fetchManifest()).to.deep.equal({ id: calId, ...metadata, themeTokens });
        const cleared = await patch(null);
        expect(cleared.status).to.equal(200);
        expect(apiCalendarSchema.parse(await cleared.json()).themeTokens).to.equal(null);
        expect(await client.fetchManifest()).to.deep.equal({
            id: calId,
            ...metadata,
            themeTokens: null,
        });
    });

    it('GET /api/calendars/:id/events returns ApiCalendarEntry[]', async () => {
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
        const body = await res.json();
        expect(body).to.be.an('array').with.length(1);

        const result = apiCalendarEntrySchema.safeParse(body[0]);
        if (!result.success) {
            console.error('Validation errors:', result.error.issues);
        }
        expect(result.success).to.be.true;
    });

    it('POST /api/calendars/:id/events returns ApiCalendarEntry', async () => {
        const res = await app.request(`/api/calendars/${calId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                heading: 'Contract Test',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
            }),
        });
        const body = await res.json();
        const result = apiCalendarEntrySchema.safeParse(body);
        if (!result.success) {
            console.error('Validation errors:', result.error.issues);
        }
        expect(result.success).to.be.true;
    });

    it('all-day event has time: null', async () => {
        const res = await app.request(`/api/calendars/${calId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                heading: 'All Day',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
            }),
        });
        const body = await res.json();
        expect(body.time).to.be.null;
    });
});
