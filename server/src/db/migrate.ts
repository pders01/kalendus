import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { createDb } from './connection.js';
import { mkdirSync } from 'node:fs';

const DB_DIR = './data';
mkdirSync(DB_DIR, { recursive: true });

const db = createDb();
migrate(db, { migrationsFolder: './src/migrations' });
console.log('Migrations applied successfully.');
