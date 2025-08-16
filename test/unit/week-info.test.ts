import { expect } from 'chai';
import { DateTime } from 'luxon';

describe('Calendar Week Info Calculations', () => {
    function getWeekInfo(date: { year: number; month: number; day: number }) {
        const dt = DateTime.fromObject({
            year: date.year,
            month: date.month,
            day: date.day,
        });

        return {
            weekNumber: dt.weekNumber,
            weekYear: dt.weekYear,
        };
    }

    describe('Week number calculations', () => {
        it('should calculate correct week number for start of year', () => {
            // January 1, 2025 is a Wednesday - should be week 1
            const result = getWeekInfo({ year: 2025, month: 1, day: 1 });
            expect(result.weekNumber).to.equal(1);
            expect(result.weekYear).to.equal(2025);
        });

        it('should calculate correct week number for middle of year', () => {
            // August 16, 2025 is a Saturday - should be week 33
            const result = getWeekInfo({ year: 2025, month: 8, day: 16 });
            expect(result.weekNumber).to.equal(33);
            expect(result.weekYear).to.equal(2025);
        });

        it('should handle week year edge cases', () => {
            // December 30, 2024 is a Monday - should be week 1 of 2025
            const result = getWeekInfo({ year: 2024, month: 12, day: 30 });
            expect(result.weekNumber).to.equal(1);
            expect(result.weekYear).to.equal(2025);
        });

        it('should calculate week 53 for years that have it', () => {
            // Some years have 53 weeks - test with December 31, 2020 (Thursday)
            const result = getWeekInfo({ year: 2020, month: 12, day: 31 });
            expect(result.weekNumber).to.equal(53);
            expect(result.weekYear).to.equal(2020);
        });
    });

    describe('ISO week date system', () => {
        it('should follow ISO 8601 week numbering', () => {
            // ISO week-numbering year starts on the Monday of week 1
            // Week 1 is the first week with at least 4 days in the new year

            // Test known ISO week dates
            const testCases = [
                { date: { year: 2025, month: 1, day: 6 }, expectedWeek: 2 }, // First Monday of 2025
                { date: { year: 2025, month: 1, day: 13 }, expectedWeek: 3 }, // Second Monday of 2025
            ];

            testCases.forEach(({ date, expectedWeek }) => {
                const result = getWeekInfo(date);
                expect(result.weekNumber).to.equal(expectedWeek);
            });
        });
    });
});
