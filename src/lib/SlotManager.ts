/**
 * SlotManager - Centralized abstraction for calendar entry positioning
 *
 * This class handles all the complexity of positioning calendar entries across different views:
 * - Day view: uses slots for time-based positioning
 * - Week view: uses slots for day+time positioning
 * - Month view: uses slots for date-based positioning
 *
 * It provides a clean, deterministic API that abstracts away the underlying slot mechanism
 * and grid positioning complexities.
 */

import { isValidCalendarDate, isValidCalendarTime } from './calendarModel.js';
import { allDaySlotName, dateSlotKey, timedSlotName } from './entrySlots.js';
import { getDisplayDurationMinutes } from './LayoutCalculator.js';
import { formatLocalizedDate, formatLocalizedTime } from './localization.js';
import { getMessages } from './messages.js';
import type { ViewMode } from './ViewStateController.js';
import { type FirstDayOfWeek, getWeekDates } from './weekStartHelper.js';

export type { ViewMode };
export type { FirstDayOfWeek };

export interface PositionConfig {
    viewMode: ViewMode;
    date: CalendarDate;
    time?: CalendarTimeInterval;
    isAllDay?: boolean;
    activeDate?: CalendarDate; // For week view calculations
    firstDayOfWeek?: FirstDayOfWeek; // 0=Sun, 1=Mon (default), 6=Sat
    weekDates?: CalendarDate[]; // Optional visible subset for condensed week view
    locale?: string; // For localized ARIA labels
}

export interface LayoutDimensions {
    width: number; // Percentage (0-100)
    x: number; // Percentage offset (0-100)
    zIndex: number; // Stacking order
    opacity: number; // Transparency
    height?: number; // Layout height in the calculator's pixel scale
    durationMinutes?: number; // Authoritative display duration from LayoutBox
}

export interface AccessibilityInfo {
    tabIndex: number; // Tab order for keyboard navigation
    role: 'button'; // ARIA role
    ariaLabel: string; // Screen reader description
}

export interface SlotPosition {
    slotName: string;
    gridColumn?: number; // For direct grid positioning
    gridRow?: string; // For direct grid positioning
    useDirectGrid: boolean; // Whether to bypass slots entirely
    useAbsolutePosition?: boolean; // Whether to use absolute positioning (replaces 1440-row grid)
    isAllDay?: boolean; // Whether this is an all-day event
    dayIndex?: number; // Which day column (0-6 for week view)
    isMultiDay?: boolean; // Whether this spans multiple days
}

export class SlotManager {
    /** Cached week-date→index map, keyed by (activeDate + firstDayOfWeek). */
    private _weekIndexCache: {
        key: string;
        map: Map<string, number>;
    } | null = null;

    /**
     * Calculate the slot name and positioning for an entry
     */
    public calculatePosition(config: PositionConfig): SlotPosition {
        this._validateConfig(config);
        const { viewMode, date, time, isAllDay } = config;

        switch (viewMode) {
            case 'day':
                return this._calculateDayPosition(date, time, isAllDay);
            case 'week':
                return this._calculateWeekPosition(
                    date,
                    config.activeDate!,
                    time,
                    isAllDay,
                    config.firstDayOfWeek,
                    config.weekDates,
                );
            case 'month':
                return this._calculateMonthPosition(date);
            default:
                throw new Error(`Unsupported view mode: ${viewMode}`);
        }
    }

    /**
     * Generate CSS styles for positioning an entry based on layout dimensions
     */
    public generatePositionCSS(
        position: SlotPosition,
        layout: LayoutDimensions,
        time?: CalendarTimeInterval,
    ): string {
        if (position.useAbsolutePosition && time) {
            // Absolute positioning — replaces 1440-row grid
            const startMinute = time.start.hour * 60 + time.start.minute;
            const endMinute = time.end.hour * 60 + time.end.minute;
            const duration =
                layout.durationMinutes ?? getDisplayDurationMinutes(startMinute, endMinute);
            if (!Number.isFinite(duration) || duration < endMinute - startMinute || duration < 0) {
                throw new RangeError('Invalid display duration');
            }
            return [
                'position: absolute',
                `top: calc(${startMinute} * var(--minute-height))`,
                `height: calc(${duration} * var(--minute-height))`,
                `width: ${layout.width}%`,
                `inset-inline-start: ${layout.x}%`,
                `z-index: ${layout.zIndex}`,
                `opacity: ${layout.opacity}`,
                'margin-inline-start: 0',
                'grid-column: unset',
                'grid-row: unset',
            ].join('; ');
        }

        if (position.useDirectGrid) {
            // Direct grid positioning (bypasses slots)
            return `grid-column: ${position.gridColumn || 2}; grid-row: ${position.gridRow || '1'}; --entry-width: ${layout.width}%; --entry-margin-inline-start: ${layout.x}%; --entry-z-index: ${layout.zIndex}; --entry-opacity: ${layout.opacity};`;
        } else {
            // Slot-based positioning with CSS variables
            const startSlot = time ? this._getGridSlotByTime(time) : '1';
            return `--start-slot: ${startSlot}; --entry-width: ${layout.width}%; --entry-margin-inline-start: ${layout.x}%; --entry-z-index: ${layout.zIndex}; --entry-opacity: ${layout.opacity};`;
        }
    }

    /**
     * Day view positioning: uses absolute positioning for timed entries
     */
    private _calculateDayPosition(
        _date: CalendarDate,
        time?: CalendarTimeInterval,
        isAllDay?: boolean,
    ): SlotPosition {
        if (isAllDay) {
            return {
                slotName: 'all-day',
                useDirectGrid: false,
            };
        }

        if (!time) {
            throw new Error('Day view entries must have time information');
        }

        return {
            slotName: 'timed',
            useDirectGrid: false,
            useAbsolutePosition: true,
        };
    }

    /**
     * Week view positioning: uses absolute positioning within per-day slot containers
     */
    private _calculateWeekPosition(
        date: CalendarDate,
        activeDate: CalendarDate,
        time?: CalendarTimeInterval,
        isAllDay?: boolean,
        firstDayOfWeek?: FirstDayOfWeek,
        weekDates?: CalendarDate[],
    ): SlotPosition {
        // Calculate which day column this entry belongs to
        // When weekDates is provided (condensed view), use it for 0-based column indexing
        const dayColumnIndex = weekDates
            ? this.getIndexInDates(date, weekDates)
            : this.getWeekDayIndex(date, activeDate, firstDayOfWeek ?? 1);
        if (dayColumnIndex < 0) throw new RangeError('Entry date is outside the visible week');
        const gridColumn = dayColumnIndex + 2; // +2 because column 1 is for time indicators

        if (isAllDay) {
            return {
                slotName: allDaySlotName(date),
                gridColumn,
                gridRow: '1 / 60', // All-day area spans first hour
                useDirectGrid: false, // Use slot-based positioning for all-day events
                isAllDay: true,
                dayIndex: dayColumnIndex,
            };
        }

        if (!time) {
            throw new Error('Week view timed entries must have time information');
        }

        return {
            slotName: timedSlotName(date),
            useDirectGrid: false,
            useAbsolutePosition: true,
            dayIndex: dayColumnIndex,
        };
    }

    /**
     * Month view positioning: uses date-based slots
     */
    private _calculateMonthPosition(date: CalendarDate): SlotPosition {
        return {
            slotName: dateSlotKey(date),
            useDirectGrid: false,
        };
    }

    /**
     * Month view all-day positioning: uses all-day- prefixed date-based slots
     */
    public calculateMonthAllDayPosition(date: CalendarDate): SlotPosition {
        if (!isValidCalendarDate(date)) throw new RangeError('Invalid entry date');
        return {
            slotName: allDaySlotName(date),
            useDirectGrid: false,
            isAllDay: true,
        };
    }

    /**
     * Convert a pixel offset within a time column to a time object.
     * Reads --minute-height from the host element. For future drag/resize interactions.
     */
    public pxToTime(px: number, hostEl: Element): { hour: number; minute: number } {
        if (!Number.isFinite(px)) throw new RangeError('Pixel offset must be finite');
        const rawHeight = parseFloat(getComputedStyle(hostEl).getPropertyValue('--minute-height'));
        const minuteHeight = Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 0.8;
        const totalMinutes = Math.round(px / minuteHeight);
        const clamped = Math.max(0, Math.min(totalMinutes, 1439));
        return { hour: Math.floor(clamped / 60), minute: clamped % 60 };
    }

    /**
     * Calculate which day of the week an entry belongs to (0-6, where 0 is the first day).
     * Internally caches the week-date→index map so repeated calls for the same
     * (activeDate, firstDayOfWeek) avoid re-allocating 7 Date objects and scanning.
     */
    public getWeekDayIndex(
        entryDate: CalendarDate,
        activeDate: CalendarDate,
        firstDayOfWeek: FirstDayOfWeek = 1,
    ): number {
        const cacheKey = `${activeDate.year}-${activeDate.month}-${activeDate.day}-${firstDayOfWeek}`;
        if (!this._weekIndexCache || this._weekIndexCache.key !== cacheKey) {
            const weekDates = getWeekDates(activeDate, firstDayOfWeek);
            const map = new Map<string, number>();
            weekDates.forEach((d, i) => map.set(dateSlotKey(d), i));
            this._weekIndexCache = { key: cacheKey, map };
        }
        const idx = this._weekIndexCache.map.get(dateSlotKey(entryDate));
        // Never silently place an offscreen entry in the first column.
        return idx ?? -1;
    }

    /**
     * Look up a date's index within a provided date array (for condensed views).
     */
    public getIndexInDates(date: CalendarDate, dates: CalendarDate[]): number {
        const idx = dates.findIndex(
            (d) => d.year === date.year && d.month === date.month && d.day === date.day,
        );
        return idx;
    }

    /**
     * Convert time interval to CSS grid row specification
     */
    private _getGridSlotByTime({ start, end }: CalendarTimeInterval): string {
        const startRow = start.hour * 60 + start.minute + 1;
        const endRow = Math.max(startRow + 1, end.hour * 60 + end.minute + 1);
        return `${startRow}/${endRow}`;
    }

    /**
     * Calculate accessibility information including logical tab order
     */
    public calculateAccessibility(config: PositionConfig): AccessibilityInfo {
        // Chronological DOM order owns focus order. Positive values jump ahead of
        // unrelated page controls and are never appropriate for event positioning.
        return {
            tabIndex: 0,
            role: 'button',
            ariaLabel: this._generateAriaLabel(config),
        };
    }

    /**
     * Generate comprehensive ARIA label for screen readers
     */
    private _generateAriaLabel(config: PositionConfig): string {
        const { date, time, isAllDay, locale = 'en' } = config;
        const msg = getMessages(locale);

        const dateStr = formatLocalizedDate(date.day, date.month, date.year, locale);

        const timeStr =
            isAllDay || !time
                ? msg.allDay
                : `${formatLocalizedTime(time.start.hour, time.start.minute, locale)} ${msg.to} ${formatLocalizedTime(time.end.hour, time.end.minute, locale)}`;

        return `${msg.calendarEvent}: ${dateStr}, ${timeStr}. ${msg.pressToOpen}`;
    }

    /**
     * Get human-readable description of position (for debugging)
     */
    public getPositionDescription(config: PositionConfig): string {
        const position = this.calculatePosition(config);

        if (position.useDirectGrid) {
            return `Direct grid: column ${position.gridColumn}, row ${position.gridRow}`;
        } else {
            return `Slot: "${position.slotName}"`;
        }
    }

    private _validateConfig(config: PositionConfig): void {
        if (!config || !isValidCalendarDate(config.date))
            throw new RangeError('Invalid entry date');
        if (config.activeDate !== undefined && !isValidCalendarDate(config.activeDate))
            throw new RangeError('Invalid active date');
        if (
            config.firstDayOfWeek !== undefined &&
            (!Number.isInteger(config.firstDayOfWeek) ||
                config.firstDayOfWeek < 0 ||
                config.firstDayOfWeek > 6)
        ) {
            throw new RangeError('Invalid first day of week');
        }
        if (config.time && !config.isAllDay) {
            const { start, end } = config.time;
            if (
                !isValidCalendarTime(start) ||
                !isValidCalendarTime(end, true) ||
                end.hour * 60 + end.minute < start.hour * 60 + start.minute
            ) {
                throw new RangeError('Invalid time interval');
            }
        }
        if (
            config.viewMode === 'day' &&
            config.activeDate &&
            (config.date.year !== config.activeDate.year ||
                config.date.month !== config.activeDate.month ||
                config.date.day !== config.activeDate.day)
        ) {
            throw new RangeError('Entry date is outside the active day');
        }
        if (config.viewMode === 'week') {
            if (!isValidCalendarDate(config.activeDate))
                throw new RangeError('Week view requires an active date');
            if (
                config.weekDates &&
                (config.weekDates.length < 1 ||
                    config.weekDates.length > 7 ||
                    config.weekDates.some((date) => !isValidCalendarDate(date)))
            )
                throw new RangeError('Invalid visible week dates');
        }
    }

    /**
     * Validate that a position configuration is valid, including its visible window.
     */
    public validatePosition(config: PositionConfig): {
        valid: boolean;
        error?: string;
    } {
        try {
            this.calculatePosition(config);
            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: error instanceof Error ? error.message : 'Unknown validation error',
            };
        }
    }
}

// Export singleton instance
export const slotManager = new SlotManager();
