import { DateTime } from 'luxon';

export default class DirectionalCalendarDateCalculator {
    date?: CalendarDate | DateTime;
    direction?: string;
    constructor({
        date,
        direction,
    }: {
        date?: CalendarDate;
        direction?: 'previous' | 'next';
    });
    set _date(date: CalendarDate);
    set _direction(direction: string);
    getDateByDayInDirection(): {
        day: number;
        month: number;
        year: number;
    };
    getDateByMonthInDirection(): {
        day: number;
        month: number;
        year: number;
    };
}
//# sourceMappingURL=DateTransformer.d.ts.map
