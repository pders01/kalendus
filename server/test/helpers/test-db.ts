import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../src/db/schema.js';

export type TestDb = ReturnType<typeof createTestDb>;

export function createTestDb() {
    const sqlite = new Database(':memory:');
    sqlite.pragma('foreign_keys = ON');

    // Create tables directly from schema (faster than running migrations)
    sqlite.exec(`
        CREATE TABLE calendars (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            locale TEXT NOT NULL DEFAULT 'en',
            first_day_of_week INTEGER NOT NULL DEFAULT 1,
            color TEXT NOT NULL DEFAULT '#000000',
            theme_tokens TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE events (
            id TEXT PRIMARY KEY,
            calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
            heading TEXT NOT NULL,
            content TEXT,
            color TEXT NOT NULL DEFAULT '#1976d2',
            start_year INTEGER NOT NULL,
            start_month INTEGER NOT NULL,
            start_day INTEGER NOT NULL,
            end_year INTEGER NOT NULL,
            end_month INTEGER NOT NULL,
            end_day INTEGER NOT NULL,
            start_hour INTEGER,
            start_minute INTEGER,
            end_hour INTEGER,
            end_minute INTEGER,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX idx_events_calendar_date
        ON events(calendar_id, start_year, start_month, start_day);
    `);

    return drizzle(sqlite, { schema });
}
