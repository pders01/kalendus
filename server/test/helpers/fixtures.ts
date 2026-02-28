import { nanoid } from 'nanoid';
import type { TestDb } from './test-db.js';
import { calendars, events } from '../../src/db/schema.js';

const now = new Date().toISOString();

export function createCalendar(
    db: TestDb,
    overrides: Partial<typeof calendars.$inferInsert> = {},
) {
    const id = overrides.id ?? nanoid();
    const row = {
        id,
        name: 'Test Calendar',
        locale: 'en',
        firstDayOfWeek: 1,
        color: '#000000',
        themeTokens: null,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
    db.insert(calendars).values(row).run();
    return row;
}

export function createEvent(
    db: TestDb,
    calendarId: string,
    overrides: Partial<typeof events.$inferInsert> = {},
) {
    const id = overrides.id ?? nanoid();
    const row = {
        id,
        calendarId,
        heading: 'Test Event',
        content: 'Test content',
        color: '#1976d2',
        startYear: 2026,
        startMonth: 3,
        startDay: 15,
        endYear: 2026,
        endMonth: 3,
        endDay: 15,
        startHour: 10,
        startMinute: 0,
        endHour: 11,
        endMinute: 0,
        createdAt: now,
        updatedAt: now,
        ...overrides,
    };
    db.insert(events).values(row).run();
    return row;
}
