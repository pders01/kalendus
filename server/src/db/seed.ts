import { createDb } from './connection.js';
import { calendars, events } from './schema.js';
import { nanoid } from 'nanoid';

const db = createDb();
const now = new Date().toISOString();

const calendarId = nanoid();
db.insert(calendars)
    .values({
        id: calendarId,
        name: 'My Calendar',
        locale: 'en',
        firstDayOfWeek: 1,
        color: '#1976d2',
        themeTokens: {
            '--lms-calendar-primary': '#1976d2',
            '--lms-calendar-radius': '8px',
        },
        createdAt: now,
        updatedAt: now,
    })
    .run();

const sampleEvents = [
    {
        heading: 'Team Standup',
        content: 'Daily sync with the engineering team',
        color: '#1976d2',
        startHour: 9,
        startMinute: 0,
        endHour: 9,
        endMinute: 30,
        dayOffset: 0,
    },
    {
        heading: 'Lunch Break',
        content: '',
        color: '#4caf50',
        startHour: 12,
        startMinute: 0,
        endHour: 13,
        endMinute: 0,
        dayOffset: 0,
    },
    {
        heading: 'Sprint Planning',
        content: 'Plan next sprint goals and tasks',
        color: '#ff9800',
        startHour: 14,
        startMinute: 0,
        endHour: 15,
        endMinute: 30,
        dayOffset: 1,
    },
    {
        heading: 'Company All-Hands',
        content: 'Quarterly update from leadership',
        color: '#9c27b0',
        startHour: null as number | null,
        startMinute: null as number | null,
        endHour: null as number | null,
        endMinute: null as number | null,
        dayOffset: 2,
    },
    {
        heading: 'Conference',
        content: 'Multi-day developer conference',
        color: '#e91e63',
        startHour: null as number | null,
        startMinute: null as number | null,
        endHour: null as number | null,
        endMinute: null as number | null,
        dayOffset: 3,
        durationDays: 3,
    },
];

const today = new Date();

for (const evt of sampleEvents) {
    const start = new Date(today);
    start.setDate(start.getDate() + evt.dayOffset);

    const end = new Date(start);
    if (evt.durationDays) {
        end.setDate(end.getDate() + evt.durationDays - 1);
    }

    db.insert(events)
        .values({
            id: nanoid(),
            calendarId,
            heading: evt.heading,
            content: evt.content || null,
            color: evt.color,
            startYear: start.getFullYear(),
            startMonth: start.getMonth() + 1,
            startDay: start.getDate(),
            endYear: end.getFullYear(),
            endMonth: end.getMonth() + 1,
            endDay: end.getDate(),
            startHour: evt.startHour,
            startMinute: evt.startMinute,
            endHour: evt.endHour,
            endMinute: evt.endMinute,
            createdAt: now,
            updatedAt: now,
        })
        .run();
}

console.log(`Seeded calendar ${calendarId} with ${sampleEvents.length} events.`);
