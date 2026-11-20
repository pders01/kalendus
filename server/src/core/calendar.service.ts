import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import type { Db } from '../db/connection.js';
import { calendars } from '../db/schema.js';
import { calendarExists } from './calendar-existence.js';
import type {
    ApiCalendar,
    CalendarManifest,
    CreateCalendarDto,
    UpdateCalendarDto,
} from './types.js';
import { createCalendarSchema, updateCalendarSchema, idSchema, validate } from './validation.js';

export class CalendarServiceImpl {
    /** Best-effort post-commit delivery. Hook-enabled removals cannot join a caller transaction. */
    constructor(
        private db: Db,
        private onRemove?: (calendarId: string) => void,
    ) {}

    /** @internal Parent validation for routes that do not use calendar metadata. */
    async exists(id: string): Promise<boolean> {
        return calendarExists(this.db, id);
    }

    async getById(id: string): Promise<ApiCalendar | null> {
        validate(idSchema, id);
        const row = this.db.select().from(calendars).where(eq(calendars.id, id)).get();

        return row ? this._toDto(row) : null;
    }

    async create(dto: CreateCalendarDto): Promise<ApiCalendar> {
        dto = validate(createCalendarSchema, dto);
        const now = new Date().toISOString();
        const id = nanoid();

        const row = {
            id,
            name: dto.name,
            locale: dto.locale ?? 'en',
            firstDayOfWeek: dto.firstDayOfWeek ?? 1,
            color: dto.color ?? '#000000',
            themeTokens: dto.themeTokens ?? null,
            createdAt: now,
            updatedAt: now,
        };

        this.db.insert(calendars).values(row).run();
        return this._toDto(row);
    }

    async update(id: string, dto: UpdateCalendarDto): Promise<ApiCalendar | null> {
        validate(idSchema, id);
        dto = validate(updateCalendarSchema, dto);
        const updates: Partial<typeof calendars.$inferInsert> = {
            updatedAt: new Date().toISOString(),
        };

        if (dto.name !== undefined) updates.name = dto.name;
        if (dto.locale !== undefined) updates.locale = dto.locale;
        if (dto.firstDayOfWeek !== undefined) updates.firstDayOfWeek = dto.firstDayOfWeek;
        if (dto.color !== undefined) updates.color = dto.color;
        if (dto.themeTokens !== undefined) updates.themeTokens = dto.themeTokens;

        const updated = this.db
            .update(calendars)
            .set(updates)
            .where(eq(calendars.id, id))
            .returning()
            .get();

        return updated ? this._toDto(updated) : null;
    }

    async delete(id: string): Promise<boolean> {
        validate(idSchema, id);
        // No SQLite commit hook is available for notifications in a caller-owned transaction.
        if (this.onRemove && this.db.$client.inTransaction)
            throw new Error('Calendar removal hooks require a service-owned transaction');
        const result = this.db.delete(calendars).where(eq(calendars.id, id)).run();
        if (result.changes === 0) return false;
        if (this.onRemove) {
            try {
                Promise.resolve(this.onRemove(id)).catch(() => {});
            } catch {
                /* Committed removals do not depend on best-effort delivery. */
            }
        }
        return true;
    }

    async getManifest(id: string): Promise<CalendarManifest | null> {
        validate(idSchema, id);
        const row = this.db.select().from(calendars).where(eq(calendars.id, id)).get();

        return row ? this._metadata(row) : null;
    }

    private _metadata(row: typeof calendars.$inferSelect): CalendarManifest {
        return {
            id: row.id,
            name: row.name,
            locale: row.locale,
            firstDayOfWeek: row.firstDayOfWeek,
            color: row.color,
            themeTokens: row.themeTokens,
        };
    }

    private _toDto(row: typeof calendars.$inferSelect): ApiCalendar {
        return {
            ...this._metadata(row),
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
