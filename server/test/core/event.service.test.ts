import { rejects } from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect } from 'chai';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import { ValidationError } from '../../src/core/errors.js';
import { EventServiceImpl } from '../../src/core/event.service.js';
import type { SseEvent } from '../../src/core/types.js';
import { createDb } from '../../src/db/connection.js';
import { migrateDb } from '../../src/db/migrate.js';
import * as schema from '../../src/db/schema.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

describe('EventService', () => {
    let service: EventServiceImpl;
    let db: ReturnType<typeof createTestDb>;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        service = new EventServiceImpl(db);
        const cal = createCalendar(db);
        calId = cal.id;
    });

    afterEach(() => db.$client.close());

    describe('create', () => {
        it('creates a timed event', async () => {
            const entry = await service.create(calId, {
                heading: 'Meeting',
                content: 'Standup',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 30 },
                },
            });

            expect(entry.heading).to.equal('Meeting');
            expect(entry.time).to.deep.equal({
                start: { hour: 9, minute: 0 },
                end: { hour: 9, minute: 30 },
            });
            expect(entry.calendarId).to.equal(calId);
        });

        it('creates an all-day event (no time)', async () => {
            const entry = await service.create(calId, {
                heading: 'All Day',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
            });

            expect(entry.time).to.be.null;
        });

        it('defaults content to null and color to #1976d2', async () => {
            const entry = await service.create(calId, {
                heading: 'Minimal',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
            });

            expect(entry.content).to.be.null;
            expect(entry.color).to.equal('#1976d2');
        });
    });

    describe('getByRange', () => {
        it('returns events overlapping with the range', async () => {
            createEvent(db, calId, {
                startYear: 2026,
                startMonth: 3,
                startDay: 10,
                endYear: 2026,
                endMonth: 3,
                endDay: 10,
            });
            createEvent(db, calId, {
                startYear: 2026,
                startMonth: 3,
                startDay: 15,
                endYear: 2026,
                endMonth: 3,
                endDay: 20,
            });
            createEvent(db, calId, {
                startYear: 2026,
                startMonth: 4,
                startDay: 1,
                endYear: 2026,
                endMonth: 4,
                endDay: 1,
            });

            const results = await service.getByRange(calId, '2026-03-12', '2026-03-25');
            expect(results).to.have.length(1);
            expect(results[0].date.start.day).to.equal(15);
        });

        it('returns multi-day events that span into the range', async () => {
            createEvent(db, calId, {
                heading: 'Conference',
                startYear: 2026,
                startMonth: 3,
                startDay: 8,
                endYear: 2026,
                endMonth: 3,
                endDay: 16,
            });

            const results = await service.getByRange(calId, '2026-03-12', '2026-03-14');
            expect(results).to.have.length(1);
            expect(results[0].heading).to.equal('Conference');
        });

        it('returns empty for no matches', async () => {
            createEvent(db, calId);
            const results = await service.getByRange(calId, '2025-01-01', '2025-01-31');
            expect(results).to.have.length(0);
        });
    });

    describe('getSummary', () => {
        it('returns per-day counts', async () => {
            createEvent(db, calId, {
                startYear: 2026,
                startMonth: 3,
                startDay: 15,
                endYear: 2026,
                endMonth: 3,
                endDay: 17,
            });
            createEvent(db, calId, {
                startYear: 2026,
                startMonth: 3,
                startDay: 15,
                endYear: 2026,
                endMonth: 3,
                endDay: 15,
            });

            const summary = await service.getSummary(calId, '2026-03-01', '2026-03-31');
            expect(summary['2026-03-15']).to.equal(2);
            expect(summary['2026-03-16']).to.equal(1);
            expect(summary['2026-03-17']).to.equal(1);
        });
    });

    describe('update', () => {
        it('returns null for non-existent event', async () => {
            const result = await service.update(calId, 'nope', {
                heading: 'X',
            });
            expect(result).to.be.null;
        });

        it('updates heading and time', async () => {
            const evt = createEvent(db, calId);
            const updated = await service.update(calId, evt.id, {
                heading: 'Updated',
                time: {
                    start: { hour: 14, minute: 0 },
                    end: { hour: 15, minute: 0 },
                },
            });
            expect(updated!.heading).to.equal('Updated');
            expect(updated!.time!.start.hour).to.equal(14);
        });

        it('keeps all legacy raw clock projections but only PATCHes complete stored clocks or repairs', async () => {
            const stored = (id: string) =>
                db.select().from(schema.events).where(eq(schema.events.id, id)).get();
            const day = '2026-03-15';
            const time = { start: { hour: 0, minute: 0 }, end: { hour: 1, minute: 0 } };
            // Cover every combination of present/null columns, including zero-valued fields.
            for (let mask = 0; mask < 16; mask++) {
                const clocks = {
                    startHour: mask & 1 ? 0 : null,
                    startMinute: mask & 2 ? 0 : null,
                    endHour: mask & 4 ? 1 : null,
                    endMinute: mask & 8 ? 0 : null,
                };
                const row = createEvent(db, calId, clocks);
                const raw = (await service.getByRange(calId, day, day)).find(
                    ({ id }) => id === row.id,
                );
                const readTime =
                    (mask & 3) === 3
                        ? {
                              start: time.start,
                              end: { hour: clocks.endHour ?? 23, minute: clocks.endMinute ?? 59 },
                          }
                        : null;
                expect(raw?.time, `clock mask ${mask}`).to.deep.equal(readTime);
                if (mask === 0 || mask === 15) {
                    expect(await service.update(calId, row.id, { heading: 'Changed' })).to.include({
                        heading: 'Changed',
                    });
                    expect(stored(row.id)).to.include(clocks);
                    continue;
                }

                await rejects(
                    service.update(calId, row.id, { heading: 'Changed', time: undefined }),
                    ValidationError,
                );
                const invalid = { start: time.start, end: time.start };
                await rejects(service.update(calId, row.id, { time: invalid }), ValidationError);
                expect(stored(row.id)).to.deep.equal(row);

                const reset = createEvent(db, calId, clocks);
                expect((await service.update(calId, reset.id, { time: null }))?.time).to.be.null;
                expect(stored(reset.id)).to.include({
                    startHour: null,
                    startMinute: null,
                    endHour: null,
                    endMinute: null,
                });
                expect((await service.update(calId, row.id, { time }))?.time).to.deep.equal(time);
                expect(stored(row.id)).to.include({
                    startHour: 0,
                    startMinute: 0,
                    endHour: 1,
                    endMinute: 0,
                });
            }
        });

        it('locks a concurrent writer before reading the interval used for PATCH validation', async () => {
            const dir = mkdtempSync(join(tmpdir(), 'kalendus-patch-'));
            const path = join(dir, 'events.db');
            const writer = createDb(path);
            const contender = createDb(path);
            try {
                migrateDb(writer);
                const calendar = createCalendar(writer);
                const event = createEvent(writer, calendar.id, {
                    startYear: 2026,
                    startMonth: 3,
                    startDay: 15,
                    endYear: 2026,
                    endMonth: 3,
                    endDay: 16,
                });
                contender.$client.pragma('busy_timeout = 0');
                const conflictingWrite = contender.$client.prepare(
                    'UPDATE events SET end_day = 15 WHERE id = ?',
                );
                let busy: unknown;
                let attempted = false;
                const observed = drizzle(writer.$client, {
                    schema,
                    logger: {
                        logQuery(query) {
                            if (attempted || !/^select .* from "events"/i.test(query)) return;
                            attempted = true;
                            try {
                                conflictingWrite.run(event.id);
                            } catch (error) {
                                busy = error;
                            }
                        },
                    },
                });
                const overnight = { start: { hour: 22, minute: 0 }, end: { hour: 1, minute: 0 } };
                await new EventServiceImpl(observed).update(calendar.id, event.id, {
                    time: overnight,
                });
                expect(attempted).to.equal(true);
                expect(busy).to.have.property('code', 'SQLITE_BUSY');

                const other = new EventServiceImpl(contender);
                const sameDay = { year: 2026, month: 3, day: 15 };
                const error = await other
                    .update(calendar.id, event.id, {
                        date: { start: sameDay, end: sameDay },
                    })
                    .catch((failure: unknown) => failure);
                expect(error).to.be.instanceOf(ValidationError);
                const [stored] = await other.getByRange(calendar.id, '2026-03-15', '2026-03-16');
                expect(stored.date.end.day).to.equal(16);
                expect(stored.time).to.deep.equal(overnight);
            } finally {
                contender.$client.close();
                writer.$client.close();
                rmSync(dir, { recursive: true, force: true });
            }
        });

        it('can set time to null (convert to all-day)', async () => {
            const evt = createEvent(db, calId);
            const updated = await service.update(calId, evt.id, {
                time: null,
            });
            expect(updated!.time).to.be.null;
        });
    });

    describe('mutation hook', () => {
        const day = { year: 2026, month: 3, day: 15 };
        const input = { heading: 'Created', date: { start: day, end: day } };
        const date = '2026-03-15';

        it('delivers each committed mutation with the canonical DTO and never delivers no-ops or rollbacks', async () => {
            const deliveries: {
                event: SseEvent;
                inTransaction: boolean;
                storedHeading?: string;
            }[] = [];
            service = new EventServiceImpl(db, (event) => {
                const stored = db
                    .select()
                    .from(schema.events)
                    .where(eq(schema.events.id, event.event.id))
                    .get();
                deliveries.push({
                    event,
                    inTransaction: db.$client.inTransaction,
                    storedHeading: stored?.heading,
                });
            });
            const entry = await service.create(calId, input);
            const updated = await service.update(calId, entry.id, { heading: 'Updated' });
            expect(updated?.createdAt).to.equal(entry.createdAt);
            expect(await service.getByRange(calId, date, date)).to.deep.equal([updated]);

            db.$client.exec(`
                CREATE TRIGGER rollback_patch AFTER UPDATE ON events WHEN NEW.heading = 'Aborted'
                BEGIN SELECT RAISE(ABORT, 'test patch rollback'); END;
                CREATE TRIGGER ignore_insert BEFORE INSERT ON events WHEN NEW.heading = 'Ignored'
                BEGIN SELECT RAISE(IGNORE); END;
            `);
            await rejects(
                service.update(calId, entry.id, { heading: 'Aborted' }),
                /test patch rollback/,
            );
            await rejects(
                service.create(calId, { ...input, heading: 'Ignored' }),
                /did not create a row/,
            );
            expect(await service.getByRange(calId, date, date)).to.deep.equal([updated]);

            expect(await service.update(calId, 'missing', { heading: 'Noop' })).to.be.null;
            expect(await service.delete(calId, entry.id)).to.be.true;
            expect(await service.delete(calId, entry.id)).to.be.false;
            expect(deliveries).to.deep.equal([
                {
                    event: { type: 'created', calendarId: calId, event: entry },
                    inTransaction: false,
                    storedHeading: 'Created',
                },
                {
                    event: { type: 'updated', calendarId: calId, event: updated },
                    inTransaction: false,
                    storedHeading: 'Updated',
                },
                {
                    event: { type: 'deleted', calendarId: calId, event: { id: entry.id } },
                    inTransaction: false,
                    storedHeading: undefined,
                },
            ]);
        });

        it('isolates callback mutation, throws and rejected promises from successful writes', async () => {
            service = new EventServiceImpl(db, ({ type, event }) => {
                if ('heading' in event) event.heading = 'Tampered';
                if (type === 'created') throw new Error('Synchronous callback failure');
                return Promise.reject(new Error('Asynchronous callback failure'));
            });
            const entry = await service.create(calId, input);
            expect(entry.heading).to.equal(input.heading);
            const updated = await service.update(calId, entry.id, { heading: 'Updated' });
            expect(updated?.heading).to.equal('Updated');
            expect(await service.getByRange(calId, date, date)).to.deep.equal([updated]);
            expect(await service.delete(calId, entry.id)).to.be.true;
            expect(await service.getByRange(calId, date, date)).to.be.empty;
        });

        it('rejects writes with a hook inside caller transactions before any delivery', async () => {
            const deliveries: SseEvent[] = [];
            service = new EventServiceImpl(db, (event) => deliveries.push(event));
            const row = createEvent(db, calId);
            const write = db.transaction(() => [
                service.create(calId, input),
                service.update(calId, row.id, { heading: 'Unexpected' }),
                service.delete(calId, row.id),
            ]);
            for (const pending of write) await rejects(pending, /service-owned transaction/);
            expect(deliveries).to.be.empty;
            expect(await service.getByRange(calId, date, date)).to.have.length(1);
            expect((await service.getByRange(calId, date, date))[0].heading).to.equal(row.heading);
        });
    });

    describe('delete', () => {
        it('returns false for non-existent event', async () => {
            const result = await service.delete(calId, 'nope');
            expect(result).to.be.false;
        });

        it('deletes an existing event', async () => {
            const evt = createEvent(db, calId);
            const result = await service.delete(calId, evt.id);
            expect(result).to.be.true;
        });
    });
});
