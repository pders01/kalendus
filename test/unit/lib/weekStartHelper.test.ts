import { expect } from 'chai';
import {
    getWeekStartOffset,
    getWeekDates,
    getFirstDayOffset,
    getWeekdayOrder,
    getFirstDayForLocale,
    type FirstDayOfWeek,
} from '../../../src/lib/weekStartHelper.js';

describe('weekStartHelper', () => {
    describe('getWeekStartOffset', () => {
        it('should return 0 when jsDayOfWeek equals firstDay', () => {
            expect(getWeekStartOffset(1, 1)).to.equal(0); // Monday, Monday-first
            expect(getWeekStartOffset(0, 0)).to.equal(0); // Sunday, Sunday-first
            expect(getWeekStartOffset(6, 6)).to.equal(0); // Saturday, Saturday-first
        });

        it('should handle Monday-first (firstDay=1)', () => {
            // JS: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
            expect(getWeekStartOffset(0, 1)).to.equal(6); // Sunday → 6 days from Monday
            expect(getWeekStartOffset(1, 1)).to.equal(0); // Monday → 0
            expect(getWeekStartOffset(2, 1)).to.equal(1); // Tuesday → 1
            expect(getWeekStartOffset(3, 1)).to.equal(2); // Wednesday → 2
            expect(getWeekStartOffset(4, 1)).to.equal(3); // Thursday → 3
            expect(getWeekStartOffset(5, 1)).to.equal(4); // Friday → 4
            expect(getWeekStartOffset(6, 1)).to.equal(5); // Saturday → 5
        });

        it('should handle Sunday-first (firstDay=0)', () => {
            expect(getWeekStartOffset(0, 0)).to.equal(0); // Sunday → 0
            expect(getWeekStartOffset(1, 0)).to.equal(1); // Monday → 1
            expect(getWeekStartOffset(6, 0)).to.equal(6); // Saturday → 6
        });

        it('should handle Saturday-first (firstDay=6)', () => {
            expect(getWeekStartOffset(6, 6)).to.equal(0); // Saturday → 0
            expect(getWeekStartOffset(0, 6)).to.equal(1); // Sunday → 1
            expect(getWeekStartOffset(5, 6)).to.equal(6); // Friday → 6
        });
    });

    describe('getWeekDates', () => {
        // 2026-02-28 is a Saturday (JS getDay()=6)
        const saturday: CalendarDate = { year: 2026, month: 2, day: 28 };

        it('should return Mon-Sun for Monday-first', () => {
            const dates = getWeekDates(saturday, 1);
            expect(dates).to.have.length(7);
            // Week of Feb 28 2026 (Saturday): Monday=Feb 23 .. Sunday=Mar 1
            expect(dates[0]).to.deep.equal({ year: 2026, month: 2, day: 23 }); // Mon
            expect(dates[6]).to.deep.equal({ year: 2026, month: 3, day: 1 });  // Sun
        });

        it('should return Sun-Sat for Sunday-first', () => {
            const dates = getWeekDates(saturday, 0);
            expect(dates).to.have.length(7);
            // Sunday-first week containing Feb 28 (Sat): Sun=Feb 22 .. Sat=Feb 28
            expect(dates[0]).to.deep.equal({ year: 2026, month: 2, day: 22 }); // Sun
            expect(dates[6]).to.deep.equal({ year: 2026, month: 2, day: 28 }); // Sat
        });

        it('should return Sat-Fri for Saturday-first', () => {
            const dates = getWeekDates(saturday, 6);
            expect(dates).to.have.length(7);
            // Saturday-first week containing Feb 28 (Sat): Sat=Feb 28 .. Fri=Mar 6
            expect(dates[0]).to.deep.equal({ year: 2026, month: 2, day: 28 }); // Sat
            expect(dates[6]).to.deep.equal({ year: 2026, month: 3, day: 6 });  // Fri
        });

        it('should handle month boundaries', () => {
            // Jan 1 2026 is a Thursday
            const jan1: CalendarDate = { year: 2026, month: 1, day: 1 };
            const dates = getWeekDates(jan1, 1);
            // Monday-first: Mon Dec 29 2025 .. Sun Jan 4 2026
            expect(dates[0]).to.deep.equal({ year: 2025, month: 12, day: 29 });
            expect(dates[6]).to.deep.equal({ year: 2026, month: 1, day: 4 });
        });
    });

    describe('getFirstDayOffset', () => {
        it('should compute correct offset for Monday-first', () => {
            // Jan 1 2026 is Thursday (JS getDay()=4)
            // Monday-first: offset = (4-1+7)%7 = 3
            const jan2026: CalendarDate = { year: 2026, month: 1, day: 1 };
            expect(getFirstDayOffset(jan2026, 1)).to.equal(3);
        });

        it('should compute correct offset for Sunday-first', () => {
            // Jan 1 2026 is Thursday (JS getDay()=4)
            // Sunday-first: offset = (4-0+7)%7 = 4
            const jan2026: CalendarDate = { year: 2026, month: 1, day: 1 };
            expect(getFirstDayOffset(jan2026, 0)).to.equal(4);
        });

        it('should return 0 when month starts on firstDay', () => {
            // Feb 2026 starts on Sunday (JS getDay()=0)
            const feb2026: CalendarDate = { year: 2026, month: 2, day: 1 };
            expect(getFirstDayOffset(feb2026, 0)).to.equal(0);
        });

        it('should handle Saturday-first', () => {
            // Feb 2026 starts on Sunday (JS getDay()=0)
            // Saturday-first: offset = (0-6+7)%7 = 1
            const feb2026: CalendarDate = { year: 2026, month: 2, day: 1 };
            expect(getFirstDayOffset(feb2026, 6)).to.equal(1);
        });
    });

    describe('getWeekdayOrder', () => {
        it('should return [1..7] for Monday-first (Luxon order)', () => {
            expect(getWeekdayOrder(1)).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
        });

        it('should return [7,1..6] for Sunday-first', () => {
            expect(getWeekdayOrder(0)).to.deep.equal([7, 1, 2, 3, 4, 5, 6]);
        });

        it('should return [6,7,1..5] for Saturday-first', () => {
            expect(getWeekdayOrder(6)).to.deep.equal([6, 7, 1, 2, 3, 4, 5]);
        });

        it('should return [3,4,5,6,7,1,2] for Wednesday-first', () => {
            expect(getWeekdayOrder(3 as FirstDayOfWeek)).to.deep.equal([3, 4, 5, 6, 7, 1, 2]);
        });

        it('should always return exactly 7 elements', () => {
            for (let i = 0; i < 7; i++) {
                const order = getWeekdayOrder(i as FirstDayOfWeek);
                expect(order).to.have.length(7);
                // All values should be 1-7 with no duplicates
                const sorted = [...order].sort();
                expect(sorted).to.deep.equal([1, 2, 3, 4, 5, 6, 7]);
            }
        });
    });

    describe('getFirstDayForLocale', () => {
        it('should return Sunday (0) for US English', () => {
            expect(getFirstDayForLocale('en-US')).to.equal(0);
            expect(getFirstDayForLocale('en')).to.equal(0);
        });

        it('should return Monday (1) for British English', () => {
            expect(getFirstDayForLocale('en-GB')).to.equal(1);
        });

        it('should return Monday (1) for German', () => {
            expect(getFirstDayForLocale('de')).to.equal(1);
            expect(getFirstDayForLocale('de-DE')).to.equal(1);
        });

        it('should return Sunday (0) for Japanese', () => {
            expect(getFirstDayForLocale('ja')).to.equal(0);
            expect(getFirstDayForLocale('ja-JP')).to.equal(0);
        });

        it('should return Saturday (6) for Arabic', () => {
            expect(getFirstDayForLocale('ar')).to.equal(6);
            expect(getFirstDayForLocale('ar-SA')).to.equal(6);
        });

        it('should fall back to language-only when region not found', () => {
            expect(getFirstDayForLocale('de-AT')).to.equal(1); // Austrian German → de → 1
            expect(getFirstDayForLocale('fr-BE')).to.equal(1); // Belgian French → fr → 1
        });

        it('should default to Monday (1) for unknown locales', () => {
            expect(getFirstDayForLocale('xx')).to.equal(1);
            expect(getFirstDayForLocale('unknown')).to.equal(1);
        });
    });
});
