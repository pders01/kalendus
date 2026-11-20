import { rejects } from 'node:assert/strict';

import { expect } from 'chai';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { NotFoundError, ValidationError } from '../../src/core/errors.js';
import { EventServiceImpl } from '../../src/core/event.service.js';
import { eventPageQuerySchema } from '../../src/core/validation.js';
import { createInMemoryDb } from '../../src/db/connection.js';
import { migrateDb } from '../../src/db/migrate.js';
import * as schema from '../../src/db/schema.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';

const start = '2024-02-29';
const end = '2024-03-01';

describe('SQLite event range queries', () => {
    let db: ReturnType<typeof createInMemoryDb>;
    let calendarId: string;

    beforeEach(() => {
        db = createInMemoryDb();
        migrateDb(db);
        calendarId = createCalendar(db).id;
    });

    afterEach(() => db.$client.close());

    it('includes both boundaries and long-spanning events, without crossing calendars', async () => {
        const add = (id: string, start: string, end: string, calendar = calendarId) => {
            const [startYear, startMonth, startDay] = start.split('-').map(Number);
            const [endYear, endMonth, endDay] = end.split('-').map(Number);
            createEvent(db, calendar, {
                id,
                startYear,
                startMonth,
                startDay,
                endYear,
                endMonth,
                endDay,
            });
        };
        add('ends-at-start', '2023-12-31', start);
        add('leap-day', start, start);
        add('starts-at-end', end, '2025-01-01');
        add('spans-range', '1970-01-01', '2100-12-31');
        add('too-early-day', '2024-02-28', '2024-02-28');
        add('too-early-month', '2024-01-31', '2024-01-31');
        add('too-early-year', '2023-12-31', '2023-12-31');
        add('too-late-day', '2024-03-02', '2024-03-02');
        add('too-late-month', '2024-04-01', '2024-04-01');
        add('too-late-year', '2025-01-01', '2025-01-01');
        add('other-calendar', start, end, createCalendar(db).id);

        const service = new EventServiceImpl(db);
        const rows = await service.getByRange(calendarId, start, end);
        expect(rows.map(({ id }) => id)).to.have.members([
            'ends-at-start',
            'leap-day',
            'starts-at-end',
            'spans-range',
        ]);
        const paged = await service.getByRangePage(calendarId, start, end);
        expect(paged.entries.map(({ id }) => id)).to.deep.equal([
            'ends-at-start',
            'leap-day',
            'spans-range',
            'starts-at-end',
        ]);
        expect(paged.nextCursor).to.be.null;
        expect(await service.getSummary(calendarId, start, end)).to.deep.equal({
            [start]: 3,
            [end]: 2,
        });
    });

    it('does not let a reversed legacy row cancel valid summary counts', async () => {
        // The existing SQL migration permits these older rows, unlike current writes.
        createEvent(db, calendarId, {
            id: 'legacy-reversed',
            startYear: 2024,
            startMonth: 3,
            startDay: 2,
            endYear: 2024,
            endMonth: 2,
            endDay: 29,
        });
        createEvent(db, calendarId, {
            id: 'valid',
            startYear: 2024,
            startMonth: 2,
            startDay: 29,
            endYear: 2024,
            endMonth: 3,
            endDay: 2,
        });

        const service = new EventServiceImpl(db);
        expect(
            (await service.getByRange(calendarId, start, '2024-03-02')).map(({ id }) => id),
        ).to.have.members(['legacy-reversed', 'valid']);
        expect(await service.getSummary(calendarId, start, '2024-03-02')).to.deep.equal({
            [start]: 1,
            [end]: 1,
            '2024-03-02': 1,
        });
    });

    it('skips unparseable clipped legacy endpoints without changing raw reads', async () => {
        createEvent(db, calendarId, { id: 'bad-end', endMonth: 4, endDay: 0 });
        createEvent(db, calendarId, {
            id: 'bad-start',
            startDay: 32,
            endMonth: 4,
            endDay: 1,
        });
        createEvent(db, calendarId, { id: 'valid-march', startDay: 17, endDay: 17 });
        createEvent(db, calendarId, {
            id: 'valid-april',
            startMonth: 4,
            startDay: 2,
            endMonth: 4,
            endDay: 2,
        });

        const service = new EventServiceImpl(db);
        const range = ['2026-03-15', '2026-04-02'] as const;
        const rows = await service.getByRange(calendarId, ...range);
        expect(rows.map(({ id }) => id)).to.have.members([
            'bad-end',
            'bad-start',
            'valid-march',
            'valid-april',
        ]);
        expect(rows.find(({ id }) => id === 'bad-end')?.date.end).to.deep.equal({
            year: 2026,
            month: 4,
            day: 0,
        });
        const page = await service.getByRangePage(calendarId, ...range);
        expect(page.nextCursor).to.be.null;
        expect(page.entries).to.have.deep.members(rows);
        expect(await service.getSummary(calendarId, ...range)).to.deep.equal({
            '2026-03-17': 1,
            '2026-04-02': 1,
        });
    });

    it('skips a legacy interval reversed by date parsing even when its date keys are ordered', async () => {
        createEvent(db, calendarId, {
            startYear: 2023,
            startMonth: 2,
            startDay: 31,
            endYear: 2023,
            endMonth: 3,
            endDay: 1,
        });
        createEvent(db, calendarId, {
            startYear: 2023,
            startDay: 2,
            endYear: 2023,
            endDay: 2,
        });
        const service = new EventServiceImpl(db);
        expect(await service.getSummary(calendarId, '2023-02-28', '2023-03-03')).to.deep.equal({
            '2023-03-02': 1,
        });
    });

    it('keeps civil-date clipping and parseable legacy end dates without validating payloads', async () => {
        createEvent(db, calendarId, {
            startYear: 2024,
            startMonth: 2,
            startDay: 29,
            endYear: 2024,
            endMonth: 2,
            endDay: 30,
        });
        // A real SQLite read throws if heading is evaluated. Summaries only need the date columns.
        db.$client.exec(`
            ALTER TABLE events RENAME TO stored_events;
            CREATE VIEW events AS
                SELECT id, calendar_id, json_extract('invalid JSON', '$') AS heading, content, color,
                       start_year, start_month, start_day, end_year, end_month, end_day,
                       start_hour, start_minute, end_hour, end_minute, created_at, updated_at
                FROM stored_events;
        `);
        const service = new EventServiceImpl(db);
        await rejects(service.getByRange(calendarId, start, end), /malformed JSON/);
        expect(await service.getSummary(calendarId, start, start)).to.deep.equal({ [start]: 1 });
        // As before, UTC Date.parse treats this legacy February 30 as March 1.
        expect(await service.getSummary(calendarId, start, '2024-03-02')).to.deep.equal({
            [start]: 1,
            [end]: 1,
        });
    });

    it('summarizes and pages every event in a valid one-day range above the legacy 5000 cap', async () => {
        const ids = Array.from({ length: 5250 }, (_, i) => `entry-${String(i).padStart(4, '0')}`);
        const day = '2026-03-15';
        db.transaction(() => {
            for (const id of [...ids].reverse()) createEvent(db, calendarId, { id });
        });
        const service = new EventServiceImpl(db);
        await rejects(service.getByRange(calendarId, day, day), {
            name: 'ValidationError',
            message: /5000.*paged range query.*narrow the date range/,
        });
        expect(await service.getByRangePage(calendarId, day, day, { limit: 500 })).to.include({
            nextCursor: ids[499],
        });
        const found: string[] = [];
        let after: string | undefined;
        for (let i = 0; i < 21; i++) {
            const page = await service.getByRangePage(calendarId, day, day, { after });
            expect(page.entries).to.have.length(250);
            found.push(...page.entries.map(({ id }) => id));
            expect(page.nextCursor).to.equal(i === 20 ? null : ids[(i + 1) * 250 - 1]);
            after = page.nextCursor ?? undefined;
        }
        expect(found).to.deep.equal(ids);
        expect(await service.getSummary(calendarId, day, day)).to.deep.equal({
            [day]: found.length,
        });
    });

    it('rejects summaries above their independent budget without blocking paged detail', async () => {
        db.$client
            .prepare(`
            WITH RECURSIVE nums(n) AS (VALUES (1) UNION ALL SELECT n + 1 FROM nums WHERE n < 50001)
            INSERT INTO events (
                id, calendar_id, heading, start_year, start_month, start_day,
                end_year, end_month, end_day, created_at, updated_at
            )
            SELECT 'row-' || printf('%05d', n), ?, 'Limited', 2026, 3, 15,
                2026, 3, 15, '2026-03-15', '2026-03-15' FROM nums
        `)
            .run(calendarId);
        const day = '2026-03-15';
        const service = new EventServiceImpl(db);
        await rejects(service.getSummary(calendarId, day, day), {
            name: 'ValidationError',
            message: /Summary exceeds 50000 overlapping rows/,
        });
        expect(await service.getByRangePage(calendarId, day, day, { limit: 1 })).to.include({
            nextCursor: 'row-00001',
        });
    });

    it('seeks strictly after an ID even when the cursor row has been deleted', async () => {
        const day = '2026-03-15';
        for (const id of ['z', 'A', 'a', '_']) createEvent(db, calendarId, { id });
        const service = new EventServiceImpl(db);
        const first = await service.getByRangePage(calendarId, day, day, { limit: 2 });
        expect(first.entries.map(({ id }) => id)).to.deep.equal(['A', '_']);
        expect(first.nextCursor).to.equal('_');
        expect(await service.delete(calendarId, '_')).to.be.true;
        const last = await service.getByRangePage(calendarId, day, day, { limit: 2, after: '_' });
        expect(last.entries.map(({ id }) => id)).to.deep.equal(['a', 'z']);
        expect(last.nextCursor).to.be.null;
        expect(await service.getByRangePage(calendarId, day, day, { after: 'z' })).to.deep.equal({
            entries: [],
            nextCursor: null,
        });
    });

    it('validates page bounds and cursor syntax in the service and HTTP query schema', async () => {
        const service = new EventServiceImpl(db);
        for (const limit of [0, 501, 1.5, NaN]) {
            await rejects(
                service.getByRangePage(calendarId, start, end, { limit }),
                ValidationError,
            );
        }
        await rejects(
            service.getByRangePage(calendarId, start, end, { after: 'bad cursor' }),
            ValidationError,
        );
        await rejects(service.getByRangePage(calendarId, end, start), ValidationError);
        await rejects(service.getByRangePage(calendarId, start, '2025-03-01'), ValidationError);
        await rejects(service.getByRangePage('missing', start, end), NotFoundError);
        expect(eventPageQuerySchema.parse({ start, end })).to.deep.equal({
            start,
            end,
            limit: 250,
        });
        expect(
            eventPageQuerySchema.parse({ start, end, limit: '500', after: 'A_z-0' }),
        ).to.deep.equal({
            start,
            end,
            limit: 500,
            after: 'A_z-0',
        });
        for (const limit of ['', ' ', '0', '501', '1.5', '1e2', ['2', '3']]) {
            expect(eventPageQuerySchema.safeParse({ start, end, limit }).success).to.be.false;
        }
        expect(eventPageQuerySchema.safeParse({ start, end, after: '' }).success).to.be.false;
        expect(eventPageQuerySchema.safeParse({ start: end, end: start }).success).to.be.false;
    });

    it('uses the installed migration index for both calendar and start-date bounds', async () => {
        let boundQuery: { sql: string; params: unknown[] } | undefined;
        const loggedDb = drizzle(db.$client, {
            schema,
            logger: {
                logQuery(sql, params) {
                    if (sql.includes('from "events"')) boundQuery = { sql, params };
                },
            },
        });
        await new EventServiceImpl(loggedDb).getByRange(calendarId, start, end);
        if (!boundQuery) throw new Error('Expected a range query');

        const plan = db.$client
            .prepare(`EXPLAIN QUERY PLAN ${boundQuery.sql}`)
            .all(...boundQuery.params) as Array<{ detail: string }>;
        expect(plan.map(({ detail }) => detail).join('\n')).to.match(
            /SEARCH events USING INDEX idx_events_calendar_date \(calendar_id=\? AND [^\n]*start_year/,
        );
    });
});
