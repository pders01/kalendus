import { expect } from 'chai';

import { CalendarServiceImpl } from '../../src/core/calendar.service.js';
import { ValidationError, NotFoundError } from '../../src/core/errors.js';
import { EventServiceImpl } from '../../src/core/event.service.js';
import { TelemetryServiceImpl } from '../../src/core/telemetry.service.js';
import { MAX_QUERY_RESULTS } from '../../src/core/validation.js';
import { RateLimiter } from '../../src/http/middleware/rate-limit.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

async function rejects(
    promise: Promise<unknown>,
    kind: abstract new (...args: never[]) => Error,
): Promise<void> {
    let error: unknown;
    try {
        await promise;
    } catch (caught) {
        error = caught;
    }
    expect(error).to.be.instanceOf(kind);
}

describe('Core boundary regressions', () => {
    it('bounds telemetry capacity, TTL, snapshots, and concurrent stalled sink deliveries', async () => {
        let now = 0;
        let deliveries = 0;
        const telemetry = new TelemetryServiceImpl({
            capacity: 2,
            ttlMs: 100,
            now: () => now,
            sink: () => {
                deliveries++;
                return new Promise(() => {});
            },
        });
        const payload = { action: 'nav', calendarId: 'one', metadata: { nested: { value: 1 } } };
        for (let index = 0; index < 20; index++) await telemetry.record(payload);
        payload.metadata.nested.value = 2;
        expect(deliveries).to.equal(8);
        expect(telemetry.getEvents()).to.have.length(2);
        const snapshot = telemetry.getEvents();
        expect(snapshot[0].metadata).to.deep.equal({ nested: { value: 1 } });
        snapshot[0].metadata!.nested = 'mutated';
        expect(telemetry.getEvents()[0].metadata).to.deep.equal({ nested: { value: 1 } });
        now = 100;
        expect(telemetry.getEvents()).to.deep.equal([]);
        const disabled = new TelemetryServiceImpl({
            capacity: 0,
            sink: async () => {
                throw new Error('sink');
            },
        });
        await disabled.record(payload);
        expect(disabled.getEvents()).to.deep.equal([]);
    });

    it('rejects oversized/deep/non-JSON metadata without throwing an internal exception', async () => {
        const telemetry = new TelemetryServiceImpl();
        const base = { action: 'nav', calendarId: 'one' };
        const cyclic: Record<string, unknown> = {};
        cyclic.self = cyclic;
        let deep: Record<string, unknown> = {};
        for (let index = 0; index < 10; index++) deep = { child: deep };
        for (const metadata of [
            cyclic,
            deep,
            { nonfinite: Infinity },
            { text: 'x'.repeat(5000) },
            Object.fromEntries(Array.from({ length: 33 }, (_, i) => [`key${i}`, i])),
        ]) {
            await rejects(telemetry.record({ ...base, metadata }), ValidationError);
        }
        expect(telemetry.getEvents()).to.have.length(0);
    });

    it('rejects new rate keys at capacity, prunes expired keys, and cannot evade a full window', () => {
        let now = 0;
        const limiter = new RateLimiter(1, 100, 2, () => now);
        expect(limiter.allow('a')).to.equal(true);
        expect(limiter.allow('b')).to.equal(true);
        expect(limiter.allow('c')).to.equal(false);
        expect(limiter.allow('a')).to.equal(false);
        expect(limiter.size).to.equal(2);
        now = 100;
        expect(limiter.allow('c')).to.equal(true);
        expect(limiter.size).to.equal(1);
    });

    it('enforces validation for direct service callers, including foreign keys and IDs', async () => {
        const db = createTestDb();
        try {
            const calendars = new CalendarServiceImpl(db);
            const events = new EventServiceImpl(db);
            const id = createCalendar(db).id;
            const dto = {
                heading: 'Invalid',
                date: {
                    start: { year: 2025, month: 2, day: 29 },
                    end: { year: 2025, month: 3, day: 1 },
                },
            };
            await rejects(events.create(id, dto), ValidationError);
            await rejects(events.create('missing', dto), NotFoundError);
            await rejects(events.getByRange(id, '2025-04-31', '2025-05-01'), ValidationError);
            await rejects(calendars.getById('bad id'), ValidationError);
            await rejects(calendars.create({ name: 'x', firstDayOfWeek: 7 }), ValidationError);
            const overnight = createEvent(db, id, {
                startYear: 2024,
                startMonth: 2,
                startDay: 29,
                endYear: 2024,
                endMonth: 3,
                endDay: 1,
                startHour: 23,
                endHour: 1,
            });
            await rejects(
                events.update(id, overnight.id, {
                    date: {
                        start: { year: 2024, month: 2, day: 29 },
                        end: { year: 2024, month: 2, day: 29 },
                    },
                    time: undefined,
                }),
                ValidationError,
            );
        } finally {
            db.$client.close();
        }
    });

    it('bounds result cardinality without silently losing matching events', async () => {
        const db = createTestDb();
        try {
            const id = createCalendar(db).id;
            db.transaction(() => {
                for (let index = 0; index <= MAX_QUERY_RESULTS; index++)
                    createEvent(db, id, { id: `event-${index}` });
            });
            await rejects(
                new EventServiceImpl(db).getByRange(id, '2026-03-15', '2026-03-15'),
                ValidationError,
            );
        } finally {
            db.$client.close();
        }
    });

    for (const tz of ['UTC', 'America/New_York', 'Pacific/Apia']) {
        it(`clips summaries to a single civil date independent of ambient TZ (${tz})`, async () => {
            const before = process.env.TZ;
            process.env.TZ = tz;
            const db = createTestDb();
            try {
                const id = createCalendar(db).id;
                // Includes Apia's skipped local 2011-12-30 and spans many years.
                createEvent(db, id, {
                    startYear: 1970,
                    startMonth: 1,
                    startDay: 1,
                    endYear: 2100,
                    endMonth: 12,
                    endDay: 31,
                });
                const service = new EventServiceImpl(db);
                expect(await service.getSummary(id, '2011-12-30', '2011-12-30')).to.deep.equal({
                    '2011-12-30': 1,
                });
                expect(await service.getSummary(id, '2024-03-09', '2024-03-11')).to.deep.equal({
                    '2024-03-09': 1,
                    '2024-03-10': 1,
                    '2024-03-11': 1,
                });
            } finally {
                db.$client.close();
                if (before === undefined) delete process.env.TZ;
                else process.env.TZ = before;
            }
        });
    }
});
