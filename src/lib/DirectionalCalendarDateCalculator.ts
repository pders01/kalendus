import { DateTime } from 'luxon';
import { CalendarDate } from '../lms-calendar';

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
    private _date?: DateTime;
    private _direction?: string;

    constructor({
        date,
        direction,
    }: {
        date?: CalendarDate;
        direction?: 'previous' | 'next';
    }) {
        if (date) {
            this.date = date;
        }
        this._direction = direction;
    }

    set date(date: CalendarDate) {
        const newDate = DateTime.fromObject(date);
        if (!newDate.isValid) {
            throw new Error("date couldn't be converted to DateTime object");
        }
        this._date = newDate;
    }

    set direction(direction: 'previous' | 'next') {
        this._direction = direction;
    }

    private _toCalendarDate(date: DateTime): CalendarDate {
        return {
            day: date.day,
            month: date.month,
            year: date.year,
        };
    }

    public getDateByDayInDirection() {
        if (!this._date || !this._date.isValid) {
            throw new Error('date is not set or invalid');
        }

        if (!this._direction) {
            throw new Error('direction is not set');
        }

        const adjustedDate = this._date.plus({
            days: this._direction === 'next' ? 1 : -1,
        });

        if (!adjustedDate.isValid) {
            throw new Error('generated date is invalid');
        }

        this._date = adjustedDate; // Update internal state
        return this._toCalendarDate(adjustedDate);
    }

    public getDateByMonthInDirection() {
        if (!this._date || !this._date.isValid) {
            throw new Error('date is not set');
        }

        if (!this._direction) {
            throw new Error('direction is not set');
        }

        const adjustedDate = this._date.plus({
            months: this._direction === 'next' ? 1 : -1,
        });

        if (!adjustedDate.isValid) {
            throw new Error('generated date is invalid');
        }

        this._date = adjustedDate; // Update internal state
        return this._toCalendarDate(adjustedDate);
    }
}
