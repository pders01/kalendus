import type { ReactiveController, ReactiveControllerHost } from 'lit';

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
        return this._activeDate;
    }

    get expandedDate(): CalendarDate | undefined {
        return this._viewMode === 'day' ? this._activeDate : undefined;
    }

    setViewMode(mode: ViewMode): void {
        this._viewMode = mode;
        this._host.requestUpdate();
    }

    setActiveDate(date: CalendarDate): void {
        this._activeDate = date;
        this._host.requestUpdate();
    }

    navigateNext(): void {
        const current = this._activeDate;

        if (this._viewMode === 'month') {
            const nextMonth = new Date(current.year, current.month, 1);
            this.setActiveDate({
                day: 1,
                month: nextMonth.getMonth() + 1,
                year: nextMonth.getFullYear(),
            });
        } else if (this._viewMode === 'week') {
            const currentDateObj = new Date(current.year, current.month - 1, current.day);
            currentDateObj.setDate(currentDateObj.getDate() + 7);
            this.setActiveDate({
                day: currentDateObj.getDate(),
                month: currentDateObj.getMonth() + 1,
                year: currentDateObj.getFullYear(),
            });
        } else if (this._viewMode === 'day') {
            const nextDay = new Date(current.year, current.month - 1, current.day + 1);
            this.setActiveDate({
                day: nextDay.getDate(),
                month: nextDay.getMonth() + 1,
                year: nextDay.getFullYear(),
            });
        } else if (this._viewMode === 'year') {
            const nextYear = new Date(current.year + 1, current.month - 1, 1);
            const clamped = new Date(nextYear.getFullYear(), current.month - 1, current.day);
            // Clamp day if it overflows (e.g. Feb 29 → Feb 28 in non-leap year)
            if (clamped.getMonth() !== current.month - 1) {
                clamped.setDate(0); // last day of previous month
            }
            this.setActiveDate({
                day: clamped.getDate(),
                month: clamped.getMonth() + 1,
                year: clamped.getFullYear(),
            });
        }
    }

    navigatePrevious(): void {
        const current = this._activeDate;

        if (this._viewMode === 'month') {
            const prevMonth = new Date(current.year, current.month - 2, 1);
            this.setActiveDate({
                day: 1,
                month: prevMonth.getMonth() + 1,
                year: prevMonth.getFullYear(),
            });
        } else if (this._viewMode === 'week') {
            const currentDateObj = new Date(current.year, current.month - 1, current.day);
            currentDateObj.setDate(currentDateObj.getDate() - 7);
            this.setActiveDate({
                day: currentDateObj.getDate(),
                month: currentDateObj.getMonth() + 1,
                year: currentDateObj.getFullYear(),
            });
        } else if (this._viewMode === 'day') {
            const prevDay = new Date(current.year, current.month - 1, current.day - 1);
            this.setActiveDate({
                day: prevDay.getDate(),
                month: prevDay.getMonth() + 1,
                year: prevDay.getFullYear(),
            });
        } else if (this._viewMode === 'year') {
            const prevYear = new Date(current.year - 1, current.month - 1, 1);
            const clamped = new Date(prevYear.getFullYear(), current.month - 1, current.day);
            // Clamp day if it overflows (e.g. Feb 29 → Feb 28 in non-leap year)
            if (clamped.getMonth() !== current.month - 1) {
                clamped.setDate(0);
            }
            this.setActiveDate({
                day: clamped.getDate(),
                month: clamped.getMonth() + 1,
                year: clamped.getFullYear(),
            });
        }
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
