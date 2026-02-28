import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export type Db = ReturnType<typeof createDb>;

export function createDb(url: string = './data/kalendus.db') {
    const sqlite = new Database(url);
    sqlite.pragma('journal_mode = WAL');
    sqlite.pragma('foreign_keys = ON');
    return drizzle(sqlite, { schema });
}

export function createInMemoryDb() {
    return createDb(':memory:');
}
