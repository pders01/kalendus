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
        (d) => d.year === activeDate.year && d.month === activeDate.month && d.day === activeDate.day,
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
 * Reads three tokens from `hostEl`:
 * - `--week-day-count` (default 7): full-width column count
 * - `--week-mobile-day-count` (default 3): condensed column count below breakpoint
 * - `--week-mobile-breakpoint` (default 768px): width threshold
 */
export function computeWeekDisplayContext(
    activeDate: CalendarDate,
    firstDayOfWeek: FirstDayOfWeek,
    calendarWidth: number,
    hostEl: Element,
): WeekDisplayContext {
    // 1. Read CSS custom properties
    const rawFull = parseInt(readCSSToken(hostEl, '--week-day-count', '7'), 10);
    const fullCount = clamp(Number.isNaN(rawFull) ? 7 : rawFull, 1, 7);
    const rawMobile = parseInt(readCSSToken(hostEl, '--week-mobile-day-count', '3'), 10);
    const mobileCount = clamp(Number.isNaN(rawMobile) ? 3 : rawMobile, 1, 7);
    const rawBreakpoint = parseInt(readCSSToken(hostEl, '--week-mobile-breakpoint', '768'), 10);
    const breakpoint = Number.isNaN(rawBreakpoint) ? 768 : rawBreakpoint;

    // 2. Determine effective day count based on viewport width
    const effectiveCount = calendarWidth < breakpoint ? mobileCount : fullCount;

    // 3. Get the full 7-day week
    const weekDates = getWeekDates(activeDate, firstDayOfWeek);

    // 4. If showing all 7, return the full week (no condensing)
    if (effectiveCount >= 7) {
        return {
            weekDates,
            visibleDates: weekDates,
            visibleStartIndex: 0,
            visibleLength: 7,
            isCondensed: false,
            gridColumns: 'var(--time-column-width) repeat(7, 1fr)',
        };
    }

    // 5. Center the visible window around the active date
    const activeIndex = findActiveDateIndex(weekDates, activeDate);
    const visibleStartIndex = computeVisibleStart(activeIndex, effectiveCount);
    const visibleDates = weekDates.slice(visibleStartIndex, visibleStartIndex + effectiveCount);

    return {
        weekDates,
        visibleDates,
        visibleStartIndex,
        visibleLength: effectiveCount,
        isCondensed: true,
        gridColumns: `var(--time-column-width) repeat(${effectiveCount}, 1fr)`,
    };
}
