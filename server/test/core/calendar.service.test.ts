import { rejects } from 'node:assert/strict';

import { expect } from 'chai';

import { CalendarServiceImpl } from '../../src/core/calendar.service.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

describe('CalendarService', () => {
    let service: CalendarServiceImpl;
    let db: ReturnType<typeof createTestDb>;

    beforeEach(() => {
        db = createTestDb();
        service = new CalendarServiceImpl(db);
    });

    afterEach(() => db.$client.close());

    describe('create', () => {
        it('creates a calendar with defaults', async () => {
            const cal = await service.create({ name: 'My Cal' });
            expect(cal.name).to.equal('My Cal');
            expect(cal.locale).to.equal('en');
            expect(cal.firstDayOfWeek).to.equal(1);
            expect(cal.color).to.equal('#000000');
            expect(cal.id).to.be.a('string');
            expect(cal.createdAt).to.be.a('string');
        });

        it('creates a calendar with custom values', async () => {
            const cal = await service.create({
                name: 'German Cal',
                locale: 'de',
                firstDayOfWeek: 0,
                color: '#ff0000',
                themeTokens: { '--bg': '#fff' },
            });
            expect(cal.locale).to.equal('de');
            expect(cal.firstDayOfWeek).to.equal(0);
            expect(cal.color).to.equal('#ff0000');
            expect(cal.themeTokens).to.deep.equal({ '--bg': '#fff' });
        });
    });

    describe('getById', () => {
        it('returns null for non-existent calendar', async () => {
            const result = await service.getById('nonexistent');
            expect(result).to.be.null;
        });

        it('returns the calendar by id', async () => {
            const row = createCalendar(db, { name: 'Fetched' });
            const cal = await service.getById(row.id);
            expect(cal).to.not.be.null;
            expect(cal!.name).to.equal('Fetched');
        });
    });

    describe('update', () => {
        it('returns null for non-existent calendar', async () => {
            const result = await service.update('nope', { name: 'X' });
            expect(result).to.be.null;
        });

        it('updates only specified fields', async () => {
            const row = createCalendar(db, { name: 'Original' });
            const updated = await service.update(row.id, {
                name: 'Updated',
            });
            expect(updated!.name).to.equal('Updated');
            expect(updated!.locale).to.equal('en'); // unchanged
        });

        it('returns the PATCH statement row rather than a separate read', async () => {
            const row = createCalendar(db);
            db.$client.exec(`
                CREATE TRIGGER rename_after_patch AFTER UPDATE ON calendars WHEN NEW.name = 'Patched'
                BEGIN UPDATE calendars SET name = 'Renamed' WHERE id = NEW.id; END;
            `);
            expect(await service.update(row.id, { name: 'Patched' })).to.include({
                name: 'Patched',
                createdAt: row.createdAt,
            });
            expect(await service.getById(row.id)).to.include({ name: 'Renamed' });
        });
    });

    describe('delete', () => {
        it('returns false for non-existent calendar', async () => {
            const result = await service.delete('nope');
            expect(result).to.be.false;
        });

        it('deletes an existing calendar', async () => {
            const row = createCalendar(db);
            const result = await service.delete(row.id);
            expect(result).to.be.true;
            const fetched = await service.getById(row.id);
            expect(fetched).to.be.null;
        });

        it('notifies once after a successful cascade, not on missing rows or rolled-back deletes', async () => {
            const row = createCalendar(db);
            const event = createEvent(db, row.id);
            const selectEvent = db.$client.prepare('SELECT id FROM events WHERE id = ?');
            const observed: unknown[] = [];
            service = new CalendarServiceImpl(db, (id) => {
                observed.push({
                    id,
                    inTransaction: db.$client.inTransaction,
                    event: selectEvent.get(event.id),
                });
            });
            db.$client.exec(`
                CREATE TRIGGER rollback_cascade AFTER DELETE ON events
                BEGIN SELECT RAISE(ABORT, 'test cascade rollback'); END;
            `);
            await rejects(service.delete(row.id), /test cascade rollback/);
            expect(await service.getById(row.id)).not.to.be.null;
            expect(selectEvent.get(event.id)).to.deep.equal({ id: event.id });
            expect(observed).to.be.empty;

            db.$client.exec('DROP TRIGGER rollback_cascade');
            expect(await service.delete(row.id)).to.be.true;
            expect(await service.delete(row.id)).to.be.false;
            expect(await service.getById(row.id)).to.be.null;
            expect(selectEvent.get(event.id)).to.be.undefined;
            expect(observed).to.deep.equal([
                { id: row.id, inTransaction: false, event: undefined },
            ]);
        });

        it('isolates synchronous and asynchronous removal callback failures', async () => {
            let calls = 0;
            service = new CalendarServiceImpl(db, () => {
                if (++calls === 1) throw new Error('Synchronous callback failure');
                return Promise.reject(new Error('Asynchronous callback failure'));
            });
            const a = createCalendar(db);
            const b = createCalendar(db);
            expect(await service.delete(a.id)).to.be.true;
            expect(await service.delete(b.id)).to.be.true;
            expect(await service.getById(a.id)).to.be.null;
            expect(await service.getById(b.id)).to.be.null;
            expect(calls).to.equal(2);
        });

        it('rejects removals with a hook inside caller transactions before any delivery', async () => {
            const deliveries: string[] = [];
            service = new CalendarServiceImpl(db, (id) => deliveries.push(id));
            const row = createCalendar(db);
            const write = db.transaction(() => [service.delete(row.id)]);
            await rejects(write[0], /service-owned transaction/);
            expect(await service.getById(row.id)).not.to.be.null;
            expect(deliveries).to.be.empty;
        });
    });

    describe('getManifest', () => {
        it('returns null for non-existent calendar', async () => {
            const result = await service.getManifest('nope');
            expect(result).to.be.null;
        });
    });
});
