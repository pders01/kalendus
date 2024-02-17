import { DateTime } from 'luxon';

/**
 * This class handles calculations and adjustments for CalendarDate objects based on a specified direction.
 *
 * @example
 * ```javascript
 * const dateCalculator = new DirectionalCalendarDateCalculator({
 *   date: { year: 2023, month: 8, day: 15 },
 *   direction: 'next'
 * });
 *
 * const newDate = dateCalculator.getDateByMonthInDirection();
 * // newDate would be { year: 2023, month: 9, day: 15 }
 * ```
 */
export default class DirectionalCalendarDateCalculator {
    private _date?: CalendarDate | DateTime;

    private _direction?: string;

    constructor({
        date,
        direction,
    }: {
        date?: CalendarDate;
        direction?: 'previous' | 'next';
    }) {
        this._date = date ? DateTime.fromObject(date) : undefined; // Convert CalendarDate to DateTime
        this._direction = direction;
    }

    set date(date: CalendarDate) {
        const newDate = DateTime.fromObject(date);
        if (!(newDate instanceof DateTime)) {
            throw new Error("date couldn't be converted to DateTime object");
        }

        this._date = newDate;
    }

    set direction(direction: 'previous' | 'next') {
        this._direction = direction;
    }

    public getDateByDayInDirection() {
        if (!(this._date instanceof DateTime) || !this._direction) {
            throw new Error('date or direction not defined.');
        }

        const adjustedDate = this._date.plus({
            days: this._direction === 'next' ? 1 : -1,
        });

        return {
            day: adjustedDate.day,
            month: adjustedDate.month,
            year: adjustedDate.year,
        };
    }

    public getDateByMonthInDirection() {
        if (!(this._date instanceof DateTime) || !this._direction) {
            throw new Error('date or direction not defined.');
        }

        let newYear = this._date.year;
        let newMonth = this._date.month + (this._direction === 'next' ? 1 : -1);

        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }

        const newDate = DateTime.fromObject({
            year: newYear,
            month: newMonth,
            day: this._date.day, // Preserve the day
        });

        return {
            day: newDate.day,
            month: newDate.month,
            year: newDate.year,
        };
    }
}
