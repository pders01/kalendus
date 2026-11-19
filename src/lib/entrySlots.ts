import type { CivilDate } from './calendarModel.js';

/** Unpadded for compatibility with named slots and date-grid data attributes. */
export const dateSlotKey = ({ year, month, day }: CivilDate) => `${year}-${month}-${day}`;

export const allDaySlotName = (date: CivilDate) => `all-day-${dateSlotKey(date)}`;
export const timedSlotPrefix = 'timed-';
export const timedSlotName = (date: CivilDate) => `${timedSlotPrefix}${dateSlotKey(date)}`;
