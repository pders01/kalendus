import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { DateTime } from 'luxon';

import { isValidCalendarDate } from './calendarModel.js';
import { addDisplayDays, getWeekDates, type FirstDayOfWeek } from './weekStartHelper.js';

export type ViewMode = 'month' | 'week' | 'day' | 'year';

export class ViewStateController implements ReactiveController {
    private _host: ReactiveControllerHost;
    private _viewMode: ViewMode = 'month';
    private _activeDate: CalendarDate;

    constructor(host: ReactiveControllerHost) {
        this._host = host;
        host.addController(this);
        const today = new Date();
        this._activeDate = {
            day: today.getDate(),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
        };
    }

    hostConnected(): void {}

    get viewMode(): ViewMode {
        return this._viewMode;
    }

    get activeDate(): CalendarDate {
        return { ...this._activeDate };
    }

    get expandedDate(): CalendarDate | undefined {
        return this._viewMode === 'day' ? this.activeDate : undefined;
    }

    setViewMode(mode: ViewMode): void {
        if (!['month', 'week', 'day', 'year'].includes(mode) || mode === this._viewMode) return;
        this._viewMode = mode;
        this._host.requestUpdate();
    }

    /** Invalid inputs leave the last committed state untouched. Equal values are no-ops. */
    setActiveDate(date: CalendarDate): void {
        if (!isValidCalendarDate(date)) return;
        const current = this._activeDate;
        if (current.year === date.year && current.month === date.month && current.day === date.day)
            return;
        this._activeDate = { year: date.year, month: date.month, day: date.day };
        this._host.requestUpdate();
    }

    private navigate(direction: 1 | -1, firstDayOfWeek: FirstDayOfWeek): void {
        const current = this._activeDate;
        const isWeek = this._viewMode === 'week';
        if (isWeek || this._viewMode === 'day') {
            let target = addDisplayDays(current, direction * (isWeek ? 7 : 1));
            if (isWeek && (target.year < 1 || target.year > 9999)) {
                const weekEdge = getWeekDates(current, firstDayOfWeek)[direction < 0 ? 0 : 6];
                // Clamp only if the adjacent week contains a supported day.
                if (!isValidCalendarDate(addDisplayDays(weekEdge, direction))) return;
                target =
                    direction < 0
                        ? { year: 1, month: 1, day: 1 }
                        : { year: 9999, month: 12, day: 31 };
            }
            this.setActiveDate(target);
            return;
        }
        // UTC is only a civil arithmetic carrier: skipped local dates must not vanish.
        let date = DateTime.utc(current.year, current.month, current.day);
        date =
            this._viewMode === 'month'
                ? date.startOf('month').plus({ months: direction })
                : date.plus({ years: direction });
        this.setActiveDate({ year: date.year, month: date.month, day: date.day });
    }

    navigateNext(firstDayOfWeek: FirstDayOfWeek = 1): void {
        this.navigate(1, firstDayOfWeek);
    }

    navigatePrevious(firstDayOfWeek: FirstDayOfWeek = 1): void {
        this.navigate(-1, firstDayOfWeek);
    }

    jumpToToday(): void {
        const today = new Date();
        this.setActiveDate({
            day: today.getDate(),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
        });
    }

    switchToMonthView(): void {
        this.setViewMode('month');
    }

    switchToWeekView(): void {
        this.setViewMode('week');
    }

    switchToDayView(): void {
        this.setViewMode('day');
    }

    switchToYearView(): void {
        this.setViewMode('year');
    }
}
