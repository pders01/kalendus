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
    private _date?;
    private _direction?;
    constructor({ date, direction, }: {
        date?: CalendarDate;
        direction?: 'previous' | 'next';
    });
    set date(date: CalendarDate);
    set direction(direction: 'previous' | 'next');
    private _toCalendarDate;
    getDateByDayInDirection(): CalendarDate;
    getDateByMonthInDirection(): CalendarDate;
}
//# sourceMappingURL=DirectionalCalendarDateCalculator.d.ts.map