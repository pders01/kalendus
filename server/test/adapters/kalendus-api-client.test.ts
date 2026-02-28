import { expect } from 'chai';
import { toCalendarEntry } from '../../src/adapters/kalendus-api-client.js';
import type { ApiCalendarEntry } from '../../src/adapters/types.js';

describe('KalendusApiClient', () => {
    describe('toCalendarEntry', () => {
        it('maps a timed event correctly', () => {
            const api: ApiCalendarEntry = {
                id: 'evt1',
                calendarId: 'cal1',
                heading: 'Meeting',
                content: 'Daily sync',
                color: '#1976d2',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.heading).to.equal('Meeting');
            expect(entry.content).to.equal('Daily sync');
            expect(entry.color).to.equal('#1976d2');
            expect(entry.isContinuation).to.be.false;
            expect(entry.time).to.deep.equal({
                start: { hour: 9, minute: 0 },
                end: { hour: 10, minute: 0 },
            });
        });

        it('defaults null time to all-day sentinel', () => {
            const api: ApiCalendarEntry = {
                id: 'evt2',
                calendarId: 'cal1',
                heading: 'All Day',
                content: null,
                color: '#ff0000',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
                time: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.time).to.deep.equal({
                start: { hour: 0, minute: 0 },
                end: { hour: 23, minute: 59 },
            });
        });

        it('defaults null content to empty string', () => {
            const api: ApiCalendarEntry = {
                id: 'evt3',
                calendarId: 'cal1',
                heading: 'No Content',
                content: null,
                color: '#000',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 15 },
                },
                time: {
                    start: { hour: 10, minute: 0 },
                    end: { hour: 11, minute: 0 },
                },
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.content).to.equal('');
        });

        it('always sets isContinuation to false', () => {
            const api: ApiCalendarEntry = {
                id: 'evt4',
                calendarId: 'cal1',
                heading: 'Multi-day',
                content: 'Conference',
                color: '#000',
                date: {
                    start: { year: 2026, month: 3, day: 15 },
                    end: { year: 2026, month: 3, day: 17 },
                },
                time: null,
                createdAt: '2026-01-01T00:00:00Z',
                updatedAt: '2026-01-01T00:00:00Z',
            };

            const entry = toCalendarEntry(api);
            expect(entry.isContinuation).to.be.false;
        });
    });
});
