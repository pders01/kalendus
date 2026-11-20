import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import { createDb, type Db } from './connection.js';

/** Resolves against this module, so source and packed dist both work from any cwd. */
export function migrateDb(db: Db): void {
    migrate(db, { migrationsFolder: fileURLToPath(new URL('../migrations/', import.meta.url)) });
}

/** Fallback for Node versions before import.meta.main (22.18). */
function isEntryScript(): boolean {
    const entry = process.argv[1];
    if (!entry) return false;
    // In eval/print mode argv[1] is a user argument, not an entry script.
    if (process.execArgv.some((arg) => /^(?:-[ep]|--eval|--print)(?:=|$)/.test(arg))) return false;
    try {
        return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
    } catch {
        // Hosts may supply an argv value that is not a file.
        return false;
    }
}

if (import.meta.main ?? isEntryScript()) {
    const db = createDb();
    try {
        migrateDb(db);
        console.log('Migrations applied successfully.');
    } finally {
        db.$client.close();
    }
}
