import { ResizeObserver } from '@juggle/resize-observer';
import { LitElement, nothing } from 'lit';

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
    heading: string;
    activeDate: CalendarDate;
    entries: CalendarEntry[];
    color: string;
    _expandedDate?: CalendarDate;
    _viewportWidth: number;
    resizeObserver: ResizeObserver;
    static styles: import('lit').CSSResult;
    render(): import('lit').TemplateResult<1>;
    connectedCallback(): void;
    resizedCallback(rect: DOMRect): void;
    disconnectedCallback(): void;
    _handleSwitchDate(e: CustomEvent): void;
    _handleSwitchView(e: CustomEvent): void;
    _handleExpand(e: CustomEvent): void;
    _getEntries(): import('lit').TemplateResult<1>[] | typeof nothing;
    _getEntriesByDate(): import('lit').TemplateResult<1>[] | undefined;
    _getEntriesSumByDay(): import('lit').TemplateResult<1>[];
    _getGridSlotByTime({ start, end }: CalendarTimeInterval): string;
    _getWidthByGroupSize({
        grading,
        index,
    }: {
        grading: Grading[];
        index: number;
    }): number;
    _getOffsetByDepth({
        grading,
        index,
    }: {
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
    interface CalendarDate {
        day: number;
        month: number;
        year: number;
    }
    interface CalendarDateInterval {
        start: CalendarDate;
        end: CalendarDate;
    }
    interface CalendarTime {
        hours: number;
        minutes: number;
    }
    interface CalendarTimeInterval {
        start: CalendarTime;
        end: CalendarTime;
    }
    interface CalendarEntry {
        date: CalendarDateInterval;
        time: CalendarTimeInterval;
        heading: string;
        content: string;
        color: string;
    }
    interface Interval {
        start: number;
        end: number;
    }
    interface Grading {
        index: number;
        depth: number;
        group: number;
    }
    interface Partition {
        index: number | undefined;
        depth: number | undefined;
        group: number | undefined;
        start: number;
        end: number;
    }
}
//# sourceMappingURL=lms-calendar.d.ts.map
