import { DateTime } from 'luxon';

import type { CalendarDate } from '../lms-calendar.js';

/** Civil-date keyboard navigation shared by the two date grids (not spatial dashboards). */
export const dateKey = (date: CalendarDate) => `${date.year}-${date.month}-${date.day}`;

export function keyboardDate(
    event: KeyboardEvent,
    date: CalendarDate,
    firstDayOfWeek: number,
    rtl: boolean,
): CalendarDate | undefined {
    if (event.altKey || event.metaKey || event.defaultPrevented) return undefined;
    if (event.ctrlKey && !['Home', 'End'].includes(event.key)) return undefined;
    if (event.shiftKey && !['PageUp', 'PageDown'].includes(event.key)) return undefined;
    const current = DateTime.fromObject(date, { zone: 'UTC' });
    let next: DateTime;
    switch (event.key) {
        case 'ArrowLeft':
            next = current.plus({ days: rtl ? 1 : -1 });
            break;
        case 'ArrowRight':
            next = current.plus({ days: rtl ? -1 : 1 });
            break;
        case 'ArrowUp':
            next = current.minus({ days: 7 });
            break;
        case 'ArrowDown':
            next = current.plus({ days: 7 });
            break;
        case 'Home':
            next = event.ctrlKey
                ? current.startOf('month')
                : current.minus({ days: (current.weekday - firstDayOfWeek + 7) % 7 });
            break;
        case 'End':
            next = event.ctrlKey
                ? current.endOf('month')
                : current.plus({ days: 6 - ((current.weekday - firstDayOfWeek + 7) % 7) });
            break;
        case 'PageUp':
            next = current.minus(event.shiftKey ? { years: 1 } : { months: 1 });
            break;
        case 'PageDown':
            next = current.plus(event.shiftKey ? { years: 1 } : { months: 1 });
            break;
        default:
            return undefined;
    }
    return next.isValid ? { year: next.year, month: next.month, day: next.day } : undefined;
}
