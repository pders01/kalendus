import { CSSResult, LitElement, PropertyValueMap } from 'lit';
import LMSCalendarContext from './components/Context';
import './components/Context.js';
import LMSCalendarDay from './components/Day';
import './components/Day.js';
import LMSCalendarEntry from './components/Entry';
import './components/Entry.js';
import LMSCalendarHeader from './components/Header';
import './components/Header.js';
import LMSCalendarMonth from './components/Month';
import './components/Month.js';
export default class LMSCalendar extends LitElement {
    private currentDate;
    heading?: string;
    activeDate: CalendarDate;
    entries: CalendarEntry[];
    color: string;
    _expandedDate?: CalendarDate;
    _calendarWidth: number;
    private _handleResize;
    private _resizeController;
    static styles: CSSResult;
    protected firstUpdated(_changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>): void;
    /** We filter invalid entries in the willUpdate hook, so be prepared:
     *  - This will not be shown
     *   ```json
     *   { date: ..., time: { start: { hour: 10, minute: 30 }, end: { hour: 10, minute: 00 } } }
     *  ```
     *  - The same goes for invalid dates meaning the end date being before the start date.
     *
     *  We then sort the entries inplace.
     */
    protected willUpdate(_changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>): void;
    render(): import("lit").TemplateResult<1>;
    private _handleSwitchDate;
    private _handleSwitchView;
    private _handleExpand;
    private _composeEntry;
    /** Create an array of <lms-calendar-entry> elements for each day the entry spans
     *  and add them to the entries array. */
    private _expandEntryMaybe;
    private _renderEntries;
    private _renderEntriesByDate;
    private _renderEntriesSumByDay;
    private _getGridSlotByTime;
    private _getWidthByGroupSize;
    private _getOffsetByDepth;
    private _getDaysRange;
}
declare global {
    interface HTMLElementTagNameMap {
        'lms-calendar': LMSCalendar;
        'lms-calendar-header': LMSCalendarHeader;
        'lms-calendar-month': LMSCalendarMonth;
        'lms-calendar-day': LMSCalendarDay;
        'lms-calendar-context': LMSCalendarContext;
        'lms-calendar-entry': LMSCalendarEntry;
    }
    type CalendarDate = {
        day: number;
        month: number;
        year: number;
    };
    type CalendarDateInterval = {
        start: CalendarDate;
        end: CalendarDate;
    };
    type CalendarTime = {
        hour: number;
        minute: number;
    };
    type CalendarTimeInterval = {
        start: CalendarTime;
        end: CalendarTime;
    };
    type CalendarEntry = {
        date: CalendarDateInterval;
        time: CalendarTimeInterval;
        heading: string;
        content: string;
        color: string;
    };
    type Interval = {
        start: number;
        end: number;
    };
    type Grading = {
        index: number;
        depth: number;
        group: number;
    };
    type Partition = {
        index?: number;
        depth?: number;
        group?: number;
        start: number;
        end: number;
    };
}
//# sourceMappingURL=lms-calendar.d.ts.map