import { expect } from 'chai';

import { CalendarServiceImpl } from '../../src/core/calendar.service.js';
import { createCalendar } from '../helpers/fixtures.js';
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
    });

    describe('getManifest', () => {
        it('returns null for non-existent calendar', async () => {
            const result = await service.getManifest('nope');
            expect(result).to.be.null;
        });

        it('returns manifest data', async () => {
            const row = createCalendar(db, {
                name: 'Themed',
                themeTokens: JSON.stringify({ '--a': '1' }) as unknown as null,
            });
            const manifest = await service.getManifest(row.id);
            expect(manifest).to.not.be.null;
            expect(manifest!.name).to.equal('Themed');
        });
    });
});
