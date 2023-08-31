import { LitElement } from 'lit';
export default class Month extends LitElement {
    private translations;
    activeDate?: CalendarDate;
    static styles: import("lit").CSSResult;
    render(): import("lit").TemplateResult<1>;
    _handleExpand(e: Event): void;
    _getDaysInMonth(date: CalendarDate): number;
    _getOffsetOfFirstDayInMonth(date: CalendarDate): number;
    _getDatesInMonthAsArray(date: CalendarDate, sliceArgs: number[]): {
        year: number;
        month: number;
        day: number;
    }[];
    _getCalendarArray(): {
        year: number;
        month: number;
        day: number;
    }[] | undefined;
}
//# sourceMappingURL=Month.d.ts.map