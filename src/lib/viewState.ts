import { signal } from '@lit-labs/signals';

// View mode signals
export type ViewMode = 'month' | 'week' | 'day';

export const currentViewMode = signal<ViewMode>('month');
export const activeDate = signal<CalendarDate>({
    day: new Date().getDate(),
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
});

// View mode utilities
export function switchToMonthView() {
    currentViewMode.set('month');
}

export function switchToWeekView() {
    currentViewMode.set('week');
}

export function switchToDayView() {
    currentViewMode.set('day');
}

export function jumpToToday() {
    const today = new Date();
    activeDate.set({
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
    });
}

export function setActiveDate(date: CalendarDate) {
    activeDate.set(date);
}

// Navigation utilities
export function navigateNext() {
    const current = activeDate.get();
    const viewMode = currentViewMode.get();

    if (viewMode === 'month') {
        // Navigate to next month
        const nextMonth = new Date(current.year, current.month, 1);
        setActiveDate({
            day: 1,
            month: nextMonth.getMonth() + 1,
            year: nextMonth.getFullYear(),
        });
    } else if (viewMode === 'week') {
        // Navigate to next week
        const currentDateObj = new Date(
            current.year,
            current.month - 1,
            current.day,
        );
        currentDateObj.setDate(currentDateObj.getDate() + 7);
        setActiveDate({
            day: currentDateObj.getDate(),
            month: currentDateObj.getMonth() + 1,
            year: currentDateObj.getFullYear(),
        });
    } else if (viewMode === 'day') {
        // Navigate to next day
        const nextDay = new Date(
            current.year,
            current.month - 1,
            current.day + 1,
        );
        setActiveDate({
            day: nextDay.getDate(),
            month: nextDay.getMonth() + 1,
            year: nextDay.getFullYear(),
        });
    }
}

export function navigatePrevious() {
    const current = activeDate.get();
    const viewMode = currentViewMode.get();

    if (viewMode === 'month') {
        // Navigate to previous month
        const prevMonth = new Date(current.year, current.month - 2, 1);
        setActiveDate({
            day: 1,
            month: prevMonth.getMonth() + 1,
            year: prevMonth.getFullYear(),
        });
    } else if (viewMode === 'week') {
        // Navigate to previous week
        const currentDateObj = new Date(
            current.year,
            current.month - 1,
            current.day,
        );
        currentDateObj.setDate(currentDateObj.getDate() - 7);
        setActiveDate({
            day: currentDateObj.getDate(),
            month: currentDateObj.getMonth() + 1,
            year: currentDateObj.getFullYear(),
        });
    } else if (viewMode === 'day') {
        // Navigate to previous day
        const prevDay = new Date(
            current.year,
            current.month - 1,
            current.day - 1,
        );
        setActiveDate({
            day: prevDay.getDate(),
            month: prevDay.getMonth() + 1,
            year: prevDay.getFullYear(),
        });
    }
}
