import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Db } from '../db/connection.js';
import { events } from '../db/schema.js';
import type {
    ApiCalendarEntry,
    CreateEventDto,
    EventSummary,
    UpdateEventDto,
} from './types.js';

export class EventServiceImpl {
    constructor(private db: Db) {}

    async getByRange(
        calendarId: string,
        start: string,
        end: string,
    ): Promise<ApiCalendarEntry[]> {
        const [startY, startM, startD] = this._parseDate(start);
        const [endY, endM, endD] = this._parseDate(end);

        const startVal = startY * 10000 + startM * 100 + startD;
        const endVal = endY * 10000 + endM * 100 + endD;

        const rows = this.db
            .select()
            .from(events)
            .where(
                and(
                    eq(events.calendarId, calendarId),
                    sql`(${events.startYear} * 10000 + ${events.startMonth} * 100 + ${events.startDay}) <= ${endVal}`,
                    sql`(${events.endYear} * 10000 + ${events.endMonth} * 100 + ${events.endDay}) >= ${startVal}`,
                ),
            )
            .all();

        return rows.map((r) => this._toDto(r));
    }

    async getSummary(
        calendarId: string,
        start: string,
        end: string,
    ): Promise<EventSummary> {
        const entries = await this.getByRange(calendarId, start, end);
        const summary: EventSummary = {};

        for (const entry of entries) {
            const startDate = new Date(
                entry.date.start.year,
                entry.date.start.month - 1,
                entry.date.start.day,
            );
            const endDate = new Date(
                entry.date.end.year,
                entry.date.end.month - 1,
                entry.date.end.day,
            );

            const cursor = new Date(startDate);
            while (cursor <= endDate) {
                const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
                summary[key] = (summary[key] ?? 0) + 1;
                cursor.setDate(cursor.getDate() + 1);
            }
        }

        return summary;
    }

    async create(
        calendarId: string,
        dto: CreateEventDto,
    ): Promise<ApiCalendarEntry> {
        const now = new Date().toISOString();
        const id = nanoid();

        const row = {
            id,
            calendarId,
            heading: dto.heading,
            content: dto.content ?? null,
            color: dto.color ?? '#1976d2',
            startYear: dto.date.start.year,
            startMonth: dto.date.start.month,
            startDay: dto.date.start.day,
            endYear: dto.date.end.year,
            endMonth: dto.date.end.month,
            endDay: dto.date.end.day,
            startHour: dto.time?.start.hour ?? null,
            startMinute: dto.time?.start.minute ?? null,
            endHour: dto.time?.end.hour ?? null,
            endMinute: dto.time?.end.minute ?? null,
            createdAt: now,
            updatedAt: now,
        };

        this.db.insert(events).values(row).run();
        return this._toDto(row);
    }

    async update(
        calendarId: string,
        eventId: string,
        dto: UpdateEventDto,
    ): Promise<ApiCalendarEntry | null> {
        const existing = this.db
            .select()
            .from(events)
            .where(
                and(
                    eq(events.id, eventId),
                    eq(events.calendarId, calendarId),
                ),
            )
            .get();

        if (!existing) return null;

        const now = new Date().toISOString();
        const updates: Record<string, unknown> = { updatedAt: now };

        if (dto.heading !== undefined) updates.heading = dto.heading;
        if (dto.content !== undefined) updates.content = dto.content;
        if (dto.color !== undefined) updates.color = dto.color;

        if (dto.date !== undefined) {
            updates.startYear = dto.date.start.year;
            updates.startMonth = dto.date.start.month;
            updates.startDay = dto.date.start.day;
            updates.endYear = dto.date.end.year;
            updates.endMonth = dto.date.end.month;
            updates.endDay = dto.date.end.day;
        }

        if (dto.time !== undefined) {
            if (dto.time === null) {
                updates.startHour = null;
                updates.startMinute = null;
                updates.endHour = null;
                updates.endMinute = null;
            } else {
                updates.startHour = dto.time.start.hour;
                updates.startMinute = dto.time.start.minute;
                updates.endHour = dto.time.end.hour;
                updates.endMinute = dto.time.end.minute;
            }
        }

        this.db
            .update(events)
            .set(updates)
            .where(eq(events.id, eventId))
            .run();

        const updated = this.db
            .select()
            .from(events)
            .where(eq(events.id, eventId))
            .get();

        return updated ? this._toDto(updated) : null;
    }

    async delete(calendarId: string, eventId: string): Promise<boolean> {
        const result = this.db
            .delete(events)
            .where(
                and(
                    eq(events.id, eventId),
                    eq(events.calendarId, calendarId),
                ),
            )
            .run();
        return result.changes > 0;
    }

    private _parseDate(dateStr: string): [number, number, number] {
        const [y, m, d] = dateStr.split('-').map(Number);
        return [y, m, d];
    }

    private _toDto(
        row: typeof events.$inferSelect,
    ): ApiCalendarEntry {
        return {
            id: row.id,
            calendarId: row.calendarId,
            heading: row.heading,
            content: row.content,
            color: row.color,
            date: {
                start: {
                    year: row.startYear,
                    month: row.startMonth,
                    day: row.startDay,
                },
                end: {
                    year: row.endYear,
                    month: row.endMonth,
                    day: row.endDay,
                },
            },
            time:
                row.startHour != null && row.startMinute != null
                    ? {
                          start: {
                              hour: row.startHour,
                              minute: row.startMinute,
                          },
                          end: {
                              hour: row.endHour ?? 23,
                              minute: row.endMinute ?? 59,
                          },
                      }
                    : null,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
        };
    }
}
