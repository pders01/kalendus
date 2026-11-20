import type { CalendarServiceImpl } from '../core/calendar.service.js';
import { NotFoundError } from '../core/errors.js';

/** Stream and telemetry services are in-process only and do not check storage. */
export async function requireCalendar(
    calendarService: Pick<CalendarServiceImpl, 'exists'>,
    calendarId: string,
): Promise<void> {
    if (!(await calendarService.exists(calendarId)))
        throw new NotFoundError('Calendar', calendarId);
}
