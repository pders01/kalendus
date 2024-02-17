import { LitElement, PropertyValueMap, nothing } from 'lit';
import './components/Header.js';
import LMSCalendarHeader from './components/Header';
import './components/Month.js';
import LMSCalendarMonth from './components/Month';
import './components/Day.js';
import LMSCalendarDay from './components/Day';
import './components/Context.js';
import LMSCalendarContext from './components/Context';
import './components/Entry.js';
import LMSCalendarEntry from './components/Entry';
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
    static styles: import("lit").CSSResult;
    protected firstUpdated(_changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>): void;
    protected willUpdate(_changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>): void;
    render(): import("lit").TemplateResult<1>;
    _handleSwitchDate(e: CustomEvent): void;
    _handleSwitchView(e: CustomEvent): void;
    _handleExpand(e: CustomEvent): void;
    _composeEntry(index: number, slot: string, styles: CalendarEntryStyles, data: CalendarEntryData): import("lit").TemplateResult<1>;
    /** Create an array of <lms-calendar-entry> elements for each day the entry spans
     *  and add them to the entries array. */
    _expandEntryMaybe({ entry, entryIndex, startDate, rangeDays, styles, }: {
        entry: CalendarEntry;
        entryIndex: number;
        startDate: Date;
        rangeDays: number;
        styles: {
            background: string;
            text: string;
        };
    }): import("lit").TemplateResult<1>[];
    _renderEntries(): import("lit").TemplateResult<1>[] | typeof nothing;
    _renderEntriesByDate(): import("lit").TemplateResult<1>[] | undefined;
    _renderEntriesSumByDay(): import("lit").TemplateResult<1>[];
    _getGridSlotByTime({ start, end }: CalendarTimeInterval): string;
    _getWidthByGroupSize({ grading, index, }: {
        grading: Grading[];
        index: number;
    }): number;
    _getOffsetByDepth({ grading, index, }: {
        grading: Grading[];
        index: number;
    }): number;
    _getPartitionedSlottedItems(items: CalendarEntry[]): Interval[][];
    _getDaysRange(date: CalendarDateInterval): [Date, Date, number];
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
        hours: number;
        minutes: number;
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
    type CalendarEntryStyles = {
        startSlot?: string;
        w?: string;
        br?: string;
        m: string;
        bc: string;
        c: string;
    };
    type CalendarEntryData = {
        time?: CalendarTimeInterval;
        heading: string;
        content?: string;
        isContinuation?: boolean;
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