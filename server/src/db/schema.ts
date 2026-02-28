import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

export const calendars = sqliteTable('calendars', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    locale: text('locale').default('en').notNull(),
    firstDayOfWeek: integer('first_day_of_week').default(1).notNull(),
    color: text('color').default('#000000').notNull(),
    themeTokens: text('theme_tokens', { mode: 'json' }).$type<
        Record<string, string>
    >(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
});

export const events = sqliteTable(
    'events',
    {
        id: text('id').primaryKey(),
        calendarId: text('calendar_id')
            .notNull()
            .references(() => calendars.id, { onDelete: 'cascade' }),
        heading: text('heading').notNull(),
        content: text('content'),
        color: text('color').default('#1976d2').notNull(),
        startYear: integer('start_year').notNull(),
        startMonth: integer('start_month').notNull(),
        startDay: integer('start_day').notNull(),
        endYear: integer('end_year').notNull(),
        endMonth: integer('end_month').notNull(),
        endDay: integer('end_day').notNull(),
        startHour: integer('start_hour'),
        startMinute: integer('start_minute'),
        endHour: integer('end_hour'),
        endMinute: integer('end_minute'),
        createdAt: text('created_at').notNull(),
        updatedAt: text('updated_at').notNull(),
    },
    (table) => [
        index('idx_events_calendar_date').on(
            table.calendarId,
            table.startYear,
            table.startMonth,
            table.startDay,
        ),
    ],
);
