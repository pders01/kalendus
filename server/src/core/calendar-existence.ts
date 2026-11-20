import { eq } from 'drizzle-orm';

import type { Db } from '../db/connection.js';
import { calendars } from '../db/schema.js';
import { idSchema, validate } from './validation.js';

/** Parent checks must not decode calendar metadata. */
export function calendarExists(db: Db, id: string): boolean {
    validate(idSchema, id);
    return (
        db.select({ id: calendars.id }).from(calendars).where(eq(calendars.id, id)).get() !==
        undefined
    );
}
