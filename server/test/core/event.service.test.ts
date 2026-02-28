import { expect } from 'chai';
import { createTestDb } from '../helpers/test-db.js';
import { createCalendar, createEvent } from '../helpers/fixtures.js';
import { EventServiceImpl } from '../../src/core/event.service.js';

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
                startYear: 2026, startMonth: 3, startDay: 10,
                endYear: 2026, endMonth: 3, endDay: 10,
            });
            createEvent(db, calId, {
                startYear: 2026, startMonth: 3, startDay: 15,
                endYear: 2026, endMonth: 3, endDay: 20,
            });
            createEvent(db, calId, {
                startYear: 2026, startMonth: 4, startDay: 1,
                endYear: 2026, endMonth: 4, endDay: 1,
            });

            const results = await service.getByRange(
                calId,
                '2026-03-12',
                '2026-03-25',
            );
            expect(results).to.have.length(1);
            expect(results[0].date.start.day).to.equal(15);
        });

        it('returns multi-day events that span into the range', async () => {
            createEvent(db, calId, {
                heading: 'Conference',
                startYear: 2026, startMonth: 3, startDay: 8,
                endYear: 2026, endMonth: 3, endDay: 16,
            });

            const results = await service.getByRange(
                calId,
                '2026-03-12',
                '2026-03-14',
            );
            expect(results).to.have.length(1);
            expect(results[0].heading).to.equal('Conference');
        });

        it('returns empty for no matches', async () => {
            createEvent(db, calId);
            const results = await service.getByRange(
                calId,
                '2025-01-01',
                '2025-01-31',
            );
            expect(results).to.have.length(0);
        });
    });

    describe('getSummary', () => {
        it('returns per-day counts', async () => {
            createEvent(db, calId, {
                startYear: 2026, startMonth: 3, startDay: 15,
                endYear: 2026, endMonth: 3, endDay: 17,
            });
            createEvent(db, calId, {
                startYear: 2026, startMonth: 3, startDay: 15,
                endYear: 2026, endMonth: 3, endDay: 15,
            });

            const summary = await service.getSummary(
                calId,
                '2026-03-01',
                '2026-03-31',
            );
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

        it('can set time to null (convert to all-day)', async () => {
            const evt = createEvent(db, calId);
            const updated = await service.update(calId, evt.id, {
                time: null,
            });
            expect(updated!.time).to.be.null;
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
