import { expect } from 'chai';
import DirectionalCalendarDateCalculator from '../../../src/lib/DirectionalCalendarDateCalculator.js';

describe('DirectionalCalendarDateCalculator', () => {
    let calculator: DirectionalCalendarDateCalculator;

    beforeEach(() => {
        calculator = new DirectionalCalendarDateCalculator({
            date: { year: 2023, month: 8, day: 15 },
            direction: 'next'
        });
    });

    describe('constructor and setters', () => {
        it('should initialize with empty constructor', () => {
            const calc = new DirectionalCalendarDateCalculator({});
            expect(() => calc.getDateByMonthInDirection()).to.throw('date is not set');
        });

        it('should allow setting date after construction', () => {
            const calc = new DirectionalCalendarDateCalculator({});
            calc.date = { year: 2023, month: 8, day: 15 };
            calc.direction = 'next';
            const result = calc.getDateByMonthInDirection();
            expect(result).to.deep.equal({
                year: 2023,
                month: 9,
                day: 15
            });
        });

        it('should throw on invalid date conversion', () => {
            const calc = new DirectionalCalendarDateCalculator({});
            expect(() => {
                calc.date = { year: -1, month: 13, day: 32 };
            }).to.throw("date couldn't be converted to DateTime object");
        });
    });

    describe('getDateByMonthInDirection', () => {
        it('should return next month when direction is "next"', () => {
            const result = calculator.getDateByMonthInDirection();
            expect(result).to.deep.equal({
                year: 2023,
                month: 9,
                day: 15
            });
        });

        it('should return previous month when direction is "previous"', () => {
            calculator.direction = 'previous';
            const result = calculator.getDateByMonthInDirection();
            expect(result).to.deep.equal({
                year: 2023,
                month: 7,
                day: 15
            });
        });

        describe('month transitions', () => {
            it('should handle year transition when going forward from December', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 12, day: 15 },
                    direction: 'next'
                });
                const result = calculator.getDateByMonthInDirection();
                expect(result).to.deep.equal({
                    year: 2024,
                    month: 1,
                    day: 15
                });
            });

            it('should handle year transition when going back from January', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 1, day: 15 },
                    direction: 'previous'
                });
                const result = calculator.getDateByMonthInDirection();
                expect(result).to.deep.equal({
                    year: 2022,
                    month: 12,
                    day: 15
                });
            });

            it('should handle multiple month transitions forward', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 1, day: 15 },
                    direction: 'next'
                });
                let result = calculator.getDateByMonthInDirection(); // Feb
                result = calculator.getDateByMonthInDirection();     // Mar
                result = calculator.getDateByMonthInDirection();     // Apr
                expect(result).to.deep.equal({
                    year: 2023,
                    month: 4,
                    day: 15
                });
            });

            it('should handle multiple month transitions backward', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 12, day: 15 },
                    direction: 'previous'
                });
                let result = calculator.getDateByMonthInDirection(); // Nov
                result = calculator.getDateByMonthInDirection();     // Oct
                result = calculator.getDateByMonthInDirection();     // Sep
                expect(result).to.deep.equal({
                    year: 2023,
                    month: 9,
                    day: 15
                });
            });
        });

        describe('day adjustments', () => {
            it('should adjust day when moving from 31 to 30 day month', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 7, day: 31 }, // July (31 days)
                    direction: 'next'
                });
                const result = calculator.getDateByMonthInDirection(); // August (31 days)
                expect(result.day).to.equal(31);
            });

            it('should adjust day when moving from 31 to 30 day month', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 8, day: 31 }, // August (31 days)
                    direction: 'next'
                });
                const result = calculator.getDateByMonthInDirection(); // September (30 days)
                expect(result.day).to.equal(30);
            });

            it('should handle leap year February forward', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2024, month: 1, day: 31 }, // January
                    direction: 'next'
                });
                const result = calculator.getDateByMonthInDirection(); // February 2024 (leap year)
                expect(result.day).to.equal(29);
            });

            it('should handle non-leap year February forward', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 1, day: 31 }, // January
                    direction: 'next'
                });
                const result = calculator.getDateByMonthInDirection(); // February 2023 (non-leap year)
                expect(result.day).to.equal(28);
            });

            it('should handle moving from February to March in leap year', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2024, month: 2, day: 29 }, // February
                    direction: 'next'
                });
                const result = calculator.getDateByMonthInDirection(); // March
                expect(result.day).to.equal(29);
            });
        });

        describe('error handling', () => {
            it('should throw error when date is not set', () => {
                calculator = new DirectionalCalendarDateCalculator({});
                expect(() => calculator.getDateByMonthInDirection()).to.throw('date is not set');
            });

            it('should throw error when direction is not set', () => {
                calculator = new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 8, day: 15 }
                });
                expect(() => calculator.getDateByMonthInDirection()).to.throw('direction is not set');
            });

            it('should handle invalid dates gracefully', () => {
                expect(() => new DirectionalCalendarDateCalculator({
                    date: { year: 2023, month: 13, day: 32 },
                    direction: 'next'
                })).to.throw("date couldn't be converted to DateTime object");
            });
        });
    });
});
