import type { CalendarServiceImpl } from '../core/calendar.service.js';
import { NotFoundError } from '../core/errors.js';

/** Stream and telemetry services are in-process only and do not check storage. */
export async function requireCalendar(
    calendarService: Pick<CalendarServiceImpl, 'getById'>,
    calendarId: string,
): Promise<void> {
    if (!(await calendarService.getById(calendarId)))
        throw new NotFoundError('Calendar', calendarId);
}
