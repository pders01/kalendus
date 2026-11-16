import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createDb, type Db } from './connection.js';

/** Resolves against this module, so source and packed dist both work from any cwd. */
export function migrateDb(db: Db): void {
    migrate(db, { migrationsFolder: fileURLToPath(new URL('../migrations/', import.meta.url)) });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const db = createDb();
    try {
        migrateDb(db);
        console.log('Migrations applied successfully.');
    } finally {
        db.$client.close();
    }
}
