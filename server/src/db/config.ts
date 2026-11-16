import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Runtime, seed, migrate and drizzle-kit use the same DATABASE_URL convention. */
export function databasePath(value = process.env.DATABASE_URL ?? './data/kalendus.db'): string {
    if (value === ':memory:') return value;
    return value.startsWith('file:') ? fileURLToPath(value) : resolve(value);
}
