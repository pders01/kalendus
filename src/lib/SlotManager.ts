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

import { CSSResult, unsafeCSS } from 'lit';

// Import types - these should be available globally but let's be explicit
declare global {
    type CalendarDate = {
        day: number;
        month: number;
        year: number;
    };

    type CalendarTimeInterval = {
        start: { hour: number; minute: number };
        end: { hour: number; minute: number };
    };
}

export type ViewMode = 'day' | 'week' | 'month';

export interface PositionConfig {
    viewMode: ViewMode;
    date: CalendarDate;
    time?: CalendarTimeInterval;
    isAllDay?: boolean;
    activeDate?: CalendarDate; // For week view calculations
}

export interface LayoutDimensions {
    width: number; // Percentage (0-100)
    x: number; // Percentage offset (0-100)
    zIndex: number; // Stacking order
    opacity: number; // Transparency
    height?: number; // For absolute positioning
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
    isAllDay?: boolean; // Whether this is an all-day event
    dayIndex?: number; // Which day column (0-6 for week view)
    isMultiDay?: boolean; // Whether this spans multiple days
}

export class SlotManager {
    /**
     * Calculate the slot name and positioning for an entry
     */
    public calculatePosition(config: PositionConfig): SlotPosition {
        const { viewMode, date, time, isAllDay } = config;

        switch (viewMode) {
            case 'day':
                return this._calculateDayPosition(date, time, isAllDay);
            case 'week':
                return this._calculateWeekPosition(date, config.activeDate!, time, isAllDay);
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
    ): CSSResult {
        if (position.useDirectGrid) {
            // Direct grid positioning (bypasses slots)
            const gridColumn = String(position.gridColumn || 2);
            const gridRow = position.gridRow || '1';
            const width = String(layout.width);
            const marginLeft = String(layout.x);
            const zIndex = String(layout.zIndex);
            const opacity = String(layout.opacity);

            const cssString = `
                grid-column: ${gridColumn};
                grid-row: ${gridRow};
                --entry-width: ${width}%;
                --entry-margin-left: ${marginLeft}%;
                --entry-z-index: ${zIndex};
                --entry-opacity: ${opacity};
            `;
            return unsafeCSS(cssString) as CSSResult;
        } else {
            // Slot-based positioning with CSS variables
            const startSlot = time ? this._getGridSlotByTime(time) : '1';
            const width = String(layout.width);
            const marginLeft = String(layout.x);
            const zIndex = String(layout.zIndex);
            const opacity = String(layout.opacity);

            const cssString = `
                --start-slot: ${startSlot};
                --entry-width: ${width}%;
                --entry-margin-left: ${marginLeft}%;
                --entry-z-index: ${zIndex};
                --entry-opacity: ${opacity};
            `;
            return unsafeCSS(cssString) as CSSResult;
        }
    }

    /**
     * Day view positioning: uses time-based slots
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
            slotName: time.start.hour.toString(),
            useDirectGrid: false,
        };
    }

    /**
     * Week view positioning: calculates day column and uses direct grid positioning
     * This bypasses the Week component's slot system to achieve identical rendering to day view
     */
    private _calculateWeekPosition(
        date: CalendarDate,
        activeDate: CalendarDate,
        time?: CalendarTimeInterval,
        isAllDay?: boolean,
    ): SlotPosition {
        // Calculate which day column this entry belongs to
        const dayColumnIndex = this.getWeekDayIndex(date, activeDate);
        const gridColumn = dayColumnIndex + 2; // +2 because column 1 is for time indicators

        if (isAllDay) {
            return {
                slotName: `all-day-${date.year}-${date.month}-${date.day}`,
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
            slotName: '', // No slot - direct grid positioning
            gridColumn,
            gridRow: this._getGridSlotByTime(time),
            useDirectGrid: true,
        };
    }

    /**
     * Month view positioning: uses date-based slots
     */
    private _calculateMonthPosition(date: CalendarDate): SlotPosition {
        return {
            slotName: `${date.year}-${date.month}-${date.day}`,
            useDirectGrid: false,
        };
    }

    /**
     * Calculate which day of the week an entry belongs to (0-6, where 0 is Monday)
     */
    public getWeekDayIndex(entryDate: CalendarDate, activeDate: CalendarDate): number {
        // Get the start of the week (Monday)
        const currentDate = new Date(activeDate.year, activeDate.month - 1, activeDate.day);
        const dayOfWeek = currentDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() + mondayOffset);

        // Generate week dates
        const weekDates = Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            return {
                day: date.getDate(),
                month: date.getMonth() + 1,
                year: date.getFullYear(),
            };
        });

        // Find which day this entry belongs to
        const dayIndex = weekDates.findIndex(
            (date) =>
                date.day === entryDate.day &&
                date.month === entryDate.month &&
                date.year === entryDate.year,
        );

        // Return 0 (Monday) if not found, to prevent -1 from breaking sorting
        return dayIndex >= 0 ? dayIndex : 0;
    }

    /**
     * Convert time interval to CSS grid row specification
     */
    private _getGridSlotByTime({ start, end }: CalendarTimeInterval): string {
        const startRow = start.hour * 60 + (start.minute + 1);
        const endRow = startRow + (end.hour * 60 + end.minute - startRow);

        if (startRow === endRow) {
            return `${startRow}/${endRow + 1}`;
        }

        return `${startRow}/${endRow}`;
    }

    /**
     * Calculate accessibility information including logical tab order
     */
    public calculateAccessibility(config: PositionConfig): AccessibilityInfo {
        const { viewMode, date, time, isAllDay } = config;

        let tabIndex = 0;

        if (viewMode === 'week' && time && !isAllDay) {
            // Week view: tab order by day first, then by time (vertical progression)
            // Use very large gaps to ensure proper ordering regardless of DOM order
            // Formula: 10000 + (dayOfWeek * 10000) + (hour * 100) + minute
            // This ensures Mon 9:00 (10000+0+900+0=10900), Mon 10:00 (11000), Tue 9:00 (20900), etc.
            const dayOfWeek = this.getWeekDayIndex(date, config.activeDate!);
            tabIndex = 10000 + dayOfWeek * 10000 + time.start.hour * 100 + time.start.minute;
        } else if (viewMode === 'day' && time && !isAllDay) {
            // Day view: tab order by time only
            tabIndex = time.start.hour * 60 + time.start.minute;
        } else if (isAllDay) {
            // All-day events get lower tab indices (appear first in tab order)
            if (viewMode === 'week') {
                const dayOfWeek = this.getWeekDayIndex(date, config.activeDate!);
                tabIndex = 1000 + dayOfWeek; // 1000-1006 for all-day events (before timed events)
            } else {
                tabIndex = 0; // Single all-day event in day view
            }
        }

        return {
            tabIndex,
            role: 'button',
            ariaLabel: this._generateAriaLabel(config),
        };
    }

    /**
     * Generate comprehensive ARIA label for screen readers
     */
    private _generateAriaLabel(config: PositionConfig): string {
        const { date, time, isAllDay } = config;

        // Format date
        const dateStr = `${date.month}/${date.day}/${date.year}`;

        // Format time
        const timeStr =
            isAllDay || !time
                ? 'All day'
                : `${String(time.start.hour).padStart(2, '0')}:${String(time.start.minute).padStart(
                      2,
                      '0',
                  )} to ${String(time.end.hour).padStart(
                      2,
                      '0',
                  )}:${String(time.end.minute).padStart(2, '0')}`;

        return `Calendar event on ${dateStr}, ${timeStr}. Press Enter or Space to open details.`;
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

    /**
     * Validate that a position configuration is valid
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
