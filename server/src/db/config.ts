import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Runtime, seed, migrate and drizzle-kit use the same DATABASE_URL convention. */
export function databasePath(value = process.env.DATABASE_URL ?? './data/kalendus.db'): string {
    if (value === ':memory:') return value;
    if (!value.startsWith('file:')) return resolve(value);
    const url = new URL(value);
    // fileURLToPath silently drops these suffixes. Encoded delimiters remain filenames.
    if (url.href.includes('?') || url.href.includes('#')) {
        throw new TypeError('DATABASE_URL file URLs must not contain a query or fragment');
    }
    return fileURLToPath(url);
}
