import { expect } from 'chai';

describe('Week View Rendering Calculations', () => {
    describe('Minute-to-pixel offset calculations', () => {
        const defaultMinuteHeight = 0.8; // matches --minute-height default

        it('should calculate correct pixel offset for hour labels', () => {
            // Each hour label is at hour * hourHeight pixels from top
            // hourHeight = 60 * minuteHeight
            const hourHeight = 60 * defaultMinuteHeight;

            function getHourLabelTop(hour: number): number {
                return hour * hourHeight;
            }

            expect(getHourLabelTop(0)).to.equal(0);
            expect(getHourLabelTop(1)).to.equal(48);
            expect(getHourLabelTop(12)).to.equal(576);
            expect(getHourLabelTop(23)).to.equal(1104);
            expect(getHourLabelTop(24)).to.equal(1152);
        });

        it('should calculate correct pixel offset for timed entries', () => {
            // Entries use top: startMinute * minuteHeight
            function getEntryTop(hour: number, minute: number): number {
                return (hour * 60 + minute) * defaultMinuteHeight;
            }

            // Midnight
            expect(getEntryTop(0, 0)).to.equal(0);
            // 1:00 AM
            expect(getEntryTop(1, 0)).to.equal(48);
            // 9:30 AM
            expect(getEntryTop(9, 30)).to.equal(456);
            // 12:00 PM (noon)
            expect(getEntryTop(12, 0)).to.equal(576);
            // 11:59 PM
            expect(getEntryTop(23, 59)).to.closeTo(1151.2, 0.01);
        });

        it('should calculate correct pixel height for entry duration', () => {
            function getEntryHeight(
                startHour: number, startMinute: number,
                endHour: number, endMinute: number,
            ): number {
                const startMinutes = startHour * 60 + startMinute;
                const endMinutes = endHour * 60 + endMinute;
                const duration = Math.max(endMinutes - startMinutes, 20);
                return duration * defaultMinuteHeight;
            }

            // 1 hour event
            expect(getEntryHeight(9, 0, 10, 0)).to.equal(48);
            // 30 minute event
            expect(getEntryHeight(14, 0, 14, 30)).to.equal(24);
            // Short event (< 20 min) clamped to 20 min minimum
            expect(getEntryHeight(10, 0, 10, 10)).to.equal(16); // 20 * 0.8
            // All-day-ish event (23 hours)
            expect(getEntryHeight(0, 0, 23, 0)).to.equal(1104);
        });

        it('should have total day height of 1152px at default minute height', () => {
            const totalDayHeight = 1440 * defaultMinuteHeight;
            expect(totalDayHeight).to.equal(1152);
        });

        it('should scale total day height with minute height', () => {
            // Double zoom
            expect(1440 * 1.6).to.equal(2304);
            // Half zoom
            expect(1440 * 0.4).to.equal(576);
            // Default
            expect(1440 * 0.8).to.equal(1152);
        });
    });

    describe('Grid column calculations', () => {
        it('should calculate correct grid column for days', () => {
            // Time column = 1
            // Monday = 2, Tuesday = 3, ..., Sunday = 8

            function getDayColumn(dayIndex: number): number {
                return dayIndex + 2;
            }

            expect(getDayColumn(0)).to.equal(2); // Monday
            expect(getDayColumn(1)).to.equal(3); // Tuesday
            expect(getDayColumn(6)).to.equal(8); // Sunday
        });
    });

    describe('Week date calculations', () => {
        it('should calculate correct week start (Monday) for given date', () => {
            function getWeekStartDate(date: {
                year: number;
                month: number;
                day: number;
            }): Date {
                const currentDate = new Date(
                    date.year,
                    date.month - 1,
                    date.day,
                );
                const dayOfWeek = currentDate.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() + mondayOffset);
                return weekStart;
            }

            // Test with a known Wednesday (2025-01-15)
            const wednesday = { year: 2025, month: 1, day: 15 };
            const weekStart = getWeekStartDate(wednesday);

            // Should be Monday (2025-01-13)
            expect(weekStart.getDate()).to.equal(13);
            expect(weekStart.getMonth()).to.equal(0); // January = 0
            expect(weekStart.getFullYear()).to.equal(2025);
            expect(weekStart.getDay()).to.equal(1); // Monday = 1
        });

        it('should generate 7 consecutive dates starting from Monday', () => {
            function getWeekDates(activeDate: {
                year: number;
                month: number;
                day: number;
            }) {
                const currentDate = new Date(
                    activeDate.year,
                    activeDate.month - 1,
                    activeDate.day,
                );
                const dayOfWeek = currentDate.getDay();
                const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() + mondayOffset);

                return Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(weekStart);
                    date.setDate(weekStart.getDate() + i);
                    return {
                        day: date.getDate(),
                        month: date.getMonth() + 1,
                        year: date.getFullYear(),
                    };
                });
            }

            const wednesday = { year: 2025, month: 1, day: 15 };
            const weekDates = getWeekDates(wednesday);

            expect(weekDates).to.have.length(7);

            // First date should be Monday (13th)
            expect(weekDates[0].day).to.equal(13);
            expect(weekDates[0].month).to.equal(1);

            // Last date should be Sunday (19th)
            expect(weekDates[6].day).to.equal(19);
            expect(weekDates[6].month).to.equal(1);
        });
    });
});
