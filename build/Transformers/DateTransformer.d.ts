export default class DateTransformer {
    date: CalendarDate | undefined;
    direction: string | undefined;
    constructor({
        date,
        direction,
    }: {
        date?: CalendarDate;
        direction?: string;
    });
    set _date(date: CalendarDate);
    set _direction(direction: string);
    getDateByDayInDirection(): CalendarDate;
    getDateByMonthInDirection(): CalendarDate;
}
//# sourceMappingURL=DateTransformer.d.ts.map
