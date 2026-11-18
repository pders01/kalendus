import { expect } from 'chai';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { EventServiceImpl } from '../../src/core/event.service.js';
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
        expect(await service.getSummary(calendarId, start, end)).to.deep.equal({
            [start]: 3,
            [end]: 2,
        });
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
