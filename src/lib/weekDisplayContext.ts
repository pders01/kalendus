/**
 * Week display context — computes the visible day subset for condensed week views.
 *
 * Pure function (apart from a single `getComputedStyle` read for CSS tokens).
 * Designed for easy unit testing by passing a mock host element.
 */

import { type FirstDayOfWeek, getWeekDates } from './weekStartHelper.js';

export interface WeekDisplayContext {
    /** Full 7-day week dates. */
    weekDates: CalendarDate[];
    /** Subset actually shown (same as weekDates when not condensed). */
    visibleDates: CalendarDate[];
    /** Offset into weekDates where visibleDates starts. */
    visibleStartIndex: number;
    /** How many columns are visible. */
    visibleLength: number;
    /** True when showing fewer than 7 days. */
    isCondensed: boolean;
    /** Whether day cells have enough inline space for an all-day title. */
    canShowAllDayTitles: boolean;
    /** CSS grid-template-columns value for the week grid. */
    gridColumns: string;
}

/**
 * Read a CSS custom property from an element, returning a trimmed string or the fallback.
 */
function readCSSToken(hostEl: Element, prop: string, fallback: string): string {
    return getComputedStyle(hostEl).getPropertyValue(prop).trim() || fallback;
}

/**
 * Clamp a value to [min, max].
 */
function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Find the index of `activeDate` within `weekDates`, or return 0 if not found.
 */
function findActiveDateIndex(weekDates: CalendarDate[], activeDate: CalendarDate): number {
    const idx = weekDates.findIndex(
        (d) =>
            d.year === activeDate.year && d.month === activeDate.month && d.day === activeDate.day,
    );
    return idx >= 0 ? idx : 0;
}

/**
 * Compute the visible window start index, centered on `activeIndex`,
 * clamped so the window stays within [0, 7).
 */
function computeVisibleStart(activeIndex: number, count: number): number {
    // Center the window around the active date
    const idealStart = activeIndex - Math.floor((count - 1) / 2);
    return clamp(idealStart, 0, 7 - count);
}

/**
 * Compute the week display context based on CSS custom properties and viewport width.
 *
 * Reads day-count/breakpoint tokens plus an optional readable-column floor:
 * - `--week-day-count` (default 7): full-width column count
 * - `--week-mobile-day-count` (default 3): condensed column count below breakpoint
 * - `--week-mobile-breakpoint` (default 768px): width threshold
 * - `--week-min-day-width` (default 8em): px/em column floor; 0 restores fixed counts
 * Day counts are maxima: narrow embeds/enlarged text can show fewer readable days.
 */
export function computeWeekDisplayContext(
    activeDate: CalendarDate,
    firstDayOfWeek: FirstDayOfWeek,
    calendarWidth: number,
    hostEl: Element,
): WeekDisplayContext {
    // 1. Read CSS custom properties
    const rawFull = Number(readCSSToken(hostEl, '--week-day-count', '7'));
    const fullCount = clamp(Number.isInteger(rawFull) ? rawFull : 7, 1, 7);
    const rawMobile = Number(readCSSToken(hostEl, '--week-mobile-day-count', '3'));
    const mobileCount = clamp(Number.isInteger(rawMobile) ? rawMobile : 3, 1, 7);
    const breakpointToken = readCSSToken(hostEl, '--week-mobile-breakpoint', '768');
    const rawBreakpoint = /^(?:\d+(?:\.\d+)?|\.\d+)(?:px)?$/.test(breakpointToken)
        ? parseFloat(breakpointToken)
        : NaN;
    const breakpoint = Number.isFinite(rawBreakpoint) ? rawBreakpoint : 768;

    // 2. Respect the component's available width, not just its breakpoint.
    const requestedCount = calendarWidth < breakpoint ? mobileCount : fullCount;
    const font = parseFloat(getComputedStyle(hostEl).fontSize) || 16;
    const pixels = (value: string, fallback: number) => {
        const match = /^(\d+(?:\.\d+)?|\.\d+)(px|em)?$/.exec(value.trim());
        return match ? Number(match[1]) * (match[2] === 'em' ? font : 1) : fallback;
    };
    const minimum = pixels(readCSSToken(hostEl, '--week-min-day-width', '8em'), font * 8);
    const timeWidth = pixels(readCSSToken(hostEl, '--time-column-width', '3em'), font * 3);
    const available = Number.isFinite(calendarWidth)
        ? Math.max(0, calendarWidth - timeWidth - font)
        : fullCount * minimum;
    const capacity = minimum > 0 ? Math.max(1, Math.floor(available / minimum)) : requestedCount;
    const effectiveCount = Math.min(requestedCount, capacity);

    // 3. Get the full 7-day week
    const weekDates = getWeekDates(activeDate, firstDayOfWeek);

    // One construction path keeps full and condensed range metadata aligned.
    const activeIndex = findActiveDateIndex(weekDates, activeDate);
    const visibleStartIndex = computeVisibleStart(activeIndex, effectiveCount);
    const visibleDates =
        effectiveCount === 7
            ? weekDates
            : weekDates.slice(visibleStartIndex, visibleStartIndex + effectiveCount);

    return {
        weekDates,
        visibleDates,
        visibleStartIndex,
        visibleLength: effectiveCount,
        isCondensed: effectiveCount < 7,
        canShowAllDayTitles: available / effectiveCount >= font * 7,
        gridColumns: `var(--time-column-width) repeat(${effectiveCount}, 1fr)`,
    };
}
