import { msg } from '@lit/localize';

// UI strings that aren't date/time related
export const messages = {
    day: () => msg('Day'),
    week: () => msg('Week'),
    month: () => msg('Month'),
    currentMonth: () => msg('Current Month'),
    allDay: () => msg('All Day'),
    today: () => msg('Today'),
    noTitle: () => msg('No Title'),
    noContent: () => msg('No Content'),
    noTime: () => msg('No Time'),
    eventDetails: () => msg('Event Details'),
    exportAsICS: () => msg('Export as ICS'),
    title: () => msg('Title'),
    time: () => msg('Time'),
    date: () => msg('Date'),
    notes: () => msg('Notes'),
    close: () => msg('Close'),
    calendarWeek: () => msg('CW'),
} as const;
