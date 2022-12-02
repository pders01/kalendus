import { LitElement } from 'lit';
import './components/Header.js';
import './components/Month.js';
import './components/Day.js';
import './components/Context.js';
import './components/Entry.js';
export default class LMSCalendar extends LitElement {
    heading: string;
    activeDate: CalendarDate;
    weekdays: string[];
    entries: CalendarEntry[];
    color: string;
    _expandedDate?: CalendarDate;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    _handleSwitchMonth(e: CustomEvent): void;
    _handleSwitchView(e: CustomEvent): void;
    _handleExpand(e: CustomEvent): void;
    _getEntries(): import("lit-html").TemplateResult<1>;
    _getEntriesByDate(): import("lit-html").TemplateResult<1>[] | undefined;
    _getGridSlotByTime({ start, end }: CalendarTimeInterval): string;
    _getWidthByGroupSize({ grading, index }: {
        grading: Grading[];
        index: number;
    }): number;
    _getOffsetByDepth({ grading, index }: {
        grading: Grading[];
        index: number;
    }): number;
    _getPartitionedSlottedItems(items: CalendarEntry[]): Interval[][];
}
declare global {
    interface HTMLElementTagNameMap {
        'lms-calendar': LMSCalendar;
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