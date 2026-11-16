import type { ViewMode } from './lib/ViewStateController.js';
import type { CalendarDate, CalendarEntry } from './lms-calendar.js';

/** Half-open civil dates within years 1–9999; only end may be 10000-01-01. */
export interface CalendarVisibleRange {
    start: string;
    end: string;
}

/** Committed calendar state, emitted after rendering and on initial connection. */
export interface CalendarState {
    activeDate: CalendarDate;
    viewMode: ViewMode;
    firstDayOfWeek: number;
    range: CalendarVisibleRange;
}

/** Detail shared by cancelable entry-activation and export-entry requests. */
export interface CalendarEntryRequest {
    entry: CalendarEntry;
    eventId?: string;
}
