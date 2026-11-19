import { eq, and, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import type { Db } from '../db/connection.js';
import { calendars, events } from '../db/schema.js';
import { NotFoundError, ValidationError } from './errors.js';
import type { ApiCalendarEntry, CreateEventDto, EventSummary, UpdateEventDto } from './types.js';
import {
    civilDateKey,
    createEventSchema,
    updateEventSchema,
    eventStateSchema,
    dateRangeQuerySchema,
    idSchema,
    validate,
    MAX_QUERY_RESULTS,
} from './validation.js';

export class EventServiceImpl {
    constructor(private db: Db) {}

    async getByRange(calendarId: string, start: string, end: string): Promise<ApiCalendarEntry[]> {
        this._requireCalendar(calendarId);
        validate(dateRangeQuerySchema, { start, end });
        const [startY, startM, startD] = this._parseDate(start);
        const [endY, endM, endD] = this._parseDate(end);

        // Inclusive overlap. Comparing date tuples lets SQLite seek on the
        // existing (calendar_id, start_year, start_month, start_day) index.
        const rows = this.db
            .select()
            .from(events)
            .where(
                and(
                    eq(events.calendarId, calendarId),
                    sql`(${events.startYear}, ${events.startMonth}, ${events.startDay}) <= (${endY}, ${endM}, ${endD})`,
                    sql`(${events.endYear}, ${events.endMonth}, ${events.endDay}) >= (${startY}, ${startM}, ${startD})`,
                ),
            )
            .limit(MAX_QUERY_RESULTS + 1)
            .all();
        if (rows.length > MAX_QUERY_RESULTS)
            throw new ValidationError(
                `Query exceeds ${MAX_QUERY_RESULTS} entries; narrow the date range`,
            );

        return rows.map((r) => this._toDto(r));
    }

    async getSummary(calendarId: string, start: string, end: string): Promise<EventSummary> {
        const entries = await this.getByRange(calendarId, start, end);
        const summary: EventSummary = {};

        // Difference sweep: O(entries + query days), not O(sum of event lifetimes).
        const changes = new Map<number, number>();
        for (const entry of entries) {
            const clippedStart = [start, civilDateKey(entry.date.start)].sort()[1];
            const clippedEnd = [end, civilDateKey(entry.date.end)].sort()[0];
            const first = Date.parse(`${clippedStart}T00:00:00Z`);
            const after = Date.parse(`${clippedEnd}T00:00:00Z`) + 86_400_000;
            changes.set(first, (changes.get(first) ?? 0) + 1);
            changes.set(after, (changes.get(after) ?? 0) - 1);
        }
        let count = 0;
        // UTC is only a Gregorian civil-date counter, never a floating-date display zone.
        const stop = Date.parse(`${end}T00:00:00Z`);
        for (let day = Date.parse(`${start}T00:00:00Z`); day <= stop; day += 86_400_000) {
            count += changes.get(day) ?? 0;
            if (count > 0) summary[new Date(day).toISOString().slice(0, 10)] = count;
        }

        return summary;
    }

    async create(calendarId: string, dto: CreateEventDto): Promise<ApiCalendarEntry> {
        this._requireCalendar(calendarId);
        dto = validate(createEventSchema, dto);
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
        this._requireCalendar(calendarId);
        validate(idSchema, eventId);
        dto = validate(updateEventSchema, dto);
        const where = and(eq(events.id, eventId), eq(events.calendarId, calendarId));
        // Reserve the writer slot before reading the row: another connection's
        // PATCH cannot change the fields our merged validation depends on.
        return this.db.transaction(
            (tx) => {
                const existing = tx.select().from(events).where(where).get();

                if (!existing) return null;
                const { heading, content, color, date, time } = this._toDto(existing);
                const patch = Object.fromEntries(
                    Object.entries(dto).filter(([, value]) => value !== undefined),
                );
                validate(eventStateSchema, { heading, content, color, date, time, ...patch });

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

                const updated = tx.update(events).set(updates).where(where).returning().get();

                return updated ? this._toDto(updated) : null;
            },
            { behavior: 'immediate' },
        );
    }

    async delete(calendarId: string, eventId: string): Promise<boolean> {
        this._requireCalendar(calendarId);
        validate(idSchema, eventId);
        const result = this.db
            .delete(events)
            .where(and(eq(events.id, eventId), eq(events.calendarId, calendarId)))
            .run();
        return result.changes > 0;
    }

    private _requireCalendar(calendarId: string): void {
        validate(idSchema, calendarId);
        if (
            !this.db
                .select({ id: calendars.id })
                .from(calendars)
                .where(eq(calendars.id, calendarId))
                .get()
        ) {
            throw new NotFoundError('Calendar', calendarId);
        }
    }

    private _parseDate(dateStr: string): [number, number, number] {
        const [y, m, d] = dateStr.split('-').map(Number);
        return [y, m, d];
    }

    private _toDto(row: typeof events.$inferSelect): ApiCalendarEntry {
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
