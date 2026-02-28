import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Db } from '../db/connection.js';
import { calendars } from '../db/schema.js';
import type {
    ApiCalendar,
    CalendarManifest,
    CreateCalendarDto,
    UpdateCalendarDto,
} from './types.js';

export class CalendarServiceImpl {
    constructor(private db: Db) {}

    async getById(id: string): Promise<ApiCalendar | null> {
        const row = this.db
            .select()
            .from(calendars)
            .where(eq(calendars.id, id))
            .get();

        return row ? this._toDto(row) : null;
    }

    async create(dto: CreateCalendarDto): Promise<ApiCalendar> {
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

    async update(
        id: string,
        dto: UpdateCalendarDto,
    ): Promise<ApiCalendar | null> {
        const existing = this.db
            .select()
            .from(calendars)
            .where(eq(calendars.id, id))
            .get();

        if (!existing) return null;

        const now = new Date().toISOString();
        const updates: Record<string, unknown> = { updatedAt: now };

        if (dto.name !== undefined) updates.name = dto.name;
        if (dto.locale !== undefined) updates.locale = dto.locale;
        if (dto.firstDayOfWeek !== undefined)
            updates.firstDayOfWeek = dto.firstDayOfWeek;
        if (dto.color !== undefined) updates.color = dto.color;
        if (dto.themeTokens !== undefined)
            updates.themeTokens = dto.themeTokens;

        this.db
            .update(calendars)
            .set(updates)
            .where(eq(calendars.id, id))
            .run();

        const updated = this.db
            .select()
            .from(calendars)
            .where(eq(calendars.id, id))
            .get();

        return updated ? this._toDto(updated) : null;
    }

    async delete(id: string): Promise<boolean> {
        const result = this.db
            .delete(calendars)
            .where(eq(calendars.id, id))
            .run();
        return result.changes > 0;
    }

    async getManifest(id: string): Promise<CalendarManifest | null> {
        const row = this.db
            .select()
            .from(calendars)
            .where(eq(calendars.id, id))
            .get();

        if (!row) return null;

        return {
            id: row.id,
            name: row.name,
            locale: row.locale,
            firstDayOfWeek: row.firstDayOfWeek,
            color: row.color,
            themeTokens: row.themeTokens as Record<string, string> | null,
        };
    }

    private _toDto(row: typeof calendars.$inferSelect): ApiCalendar {
        return {
            id: row.id,
            name: row.name,
            locale: row.locale,
            firstDayOfWeek: row.firstDayOfWeek,
            color: row.color,
            themeTokens: row.themeTokens as Record<string, string> | null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
