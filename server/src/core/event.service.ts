import { eq, and, gt, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import type { Db } from '../db/connection.js';
import { calendars, events } from '../db/schema.js';
import { NotFoundError, ValidationError } from './errors.js';
import type {
    ApiCalendarEntry,
    CreateEventDto,
    EventPage,
    EventPageOptions,
    EventSummary,
    SseEvent,
    UpdateEventDto,
} from './types.js';
import {
    civilDateKey,
    createEventSchema,
    updateEventSchema,
    eventStateSchema,
    dateRangeQuerySchema,
    eventPageOptionsSchema,
    idSchema,
    validate,
    MAX_QUERY_RESULTS,
    MAX_SUMMARY_RESULTS,
} from './validation.js';

const dateColumns = {
    startYear: events.startYear,
    startMonth: events.startMonth,
    startDay: events.startDay,
    endYear: events.endYear,
    endMonth: events.endMonth,
    endDay: events.endDay,
};
type EventRow = typeof events.$inferSelect;

export class EventServiceImpl {
    /** Best-effort post-commit delivery. Hook-enabled writes cannot join a caller transaction. */
    constructor(
        private db: Db,
        private onMutation?: (event: SseEvent) => void,
    ) {}

    async getByRange(calendarId: string, start: string, end: string): Promise<ApiCalendarEntry[]> {
        const rows = this.db
            .select()
            .from(events)
            .where(this._overlap(calendarId, start, end))
            .limit(MAX_QUERY_RESULTS + 1)
            .all();
        if (rows.length > MAX_QUERY_RESULTS)
            throw new ValidationError(
                `Query exceeds ${MAX_QUERY_RESULTS} entries; use the paged range query or narrow the date range`,
            );

        return rows.map((r) => this._toDto(r));
    }

    async getByRangePage(
        calendarId: string,
        start: string,
        end: string,
        options: EventPageOptions = {},
    ): Promise<EventPage> {
        const overlap = this._overlap(calendarId, start, end);
        const { limit, after } = validate(eventPageOptionsSchema, options);
        const rows = this.db
            .select()
            .from(events)
            .where(and(overlap, after === undefined ? undefined : gt(events.id, after)))
            .orderBy(events.id)
            .limit(limit + 1)
            .all();
        const hasMore = rows.length > limit;
        if (hasMore) rows.pop();
        return {
            entries: rows.map((r) => this._toDto(r)),
            nextCursor: hasMore ? rows[rows.length - 1].id : null,
        };
    }

    async getSummary(calendarId: string, start: string, end: string): Promise<EventSummary> {
        const rows = this.db
            .select(dateColumns)
            .from(events)
            .where(this._overlap(calendarId, start, end))
            .limit(MAX_SUMMARY_RESULTS + 1)
            .all();
        if (rows.length > MAX_SUMMARY_RESULTS)
            throw new ValidationError(
                `Summary exceeds ${MAX_SUMMARY_RESULTS} overlapping rows; narrow the date range`,
            );

        const summary: EventSummary = {};
        // Keep the legacy clipping and UTC parsing, including for imported rows.
        // Difference sweep: O(rows + query days), not O(sum of event lifetimes).
        const changes = new Map<number, number>();
        for (const row of rows) {
            const date = this._dateFromRow(row);
            const clippedStart = [start, civilDateKey(date.start)].sort()[1];
            const clippedEnd = [end, civilDateKey(date.end)].sort()[0];
            // Older databases can contain reversed date intervals. Never emit their deltas.
            if (clippedStart > clippedEnd) continue;
            const first = Date.parse(`${clippedStart}T00:00:00Z`);
            const last = Date.parse(`${clippedEnd}T00:00:00Z`);
            if (!Number.isFinite(first) || !Number.isFinite(last) || first > last) continue;
            const after = last + 86_400_000;
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
        this._requireOwnTransaction();
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

        if (this.db.insert(events).values(row).run().changes === 0)
            throw new Error('Event insert did not create a row');
        const entry = this._toDto(row);
        this._notify({ type: 'created', calendarId, event: entry });
        return entry;
    }

    async update(
        calendarId: string,
        eventId: string,
        dto: UpdateEventDto,
    ): Promise<ApiCalendarEntry | null> {
        this._requireCalendar(calendarId);
        validate(idSchema, eventId);
        dto = validate(updateEventSchema, dto);
        this._requireOwnTransaction();
        const where = and(eq(events.id, eventId), eq(events.calendarId, calendarId));
        // Reserve the writer slot before reading the row: another connection's
        // PATCH cannot change the fields our merged validation depends on.
        const entry = this.db.transaction(
            (tx) => {
                const existing = tx.select().from(events).where(where).get();

                if (!existing) return null;
                const updates: Partial<typeof events.$inferInsert> = {
                    updatedAt: new Date().toISOString(),
                };

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
                    updates.startHour = dto.time?.start.hour ?? null;
                    updates.startMinute = dto.time?.start.minute ?? null;
                    updates.endHour = dto.time?.end.hour ?? null;
                    updates.endMinute = dto.time?.end.minute ?? null;
                }

                this._validateStoredState({ ...existing, ...updates });
                const updated = tx.update(events).set(updates).where(where).returning().get();

                return updated ? this._toDto(updated) : null;
            },
            { behavior: 'immediate' },
        );
        if (entry) this._notify({ type: 'updated', calendarId, event: entry });
        return entry;
    }

    async delete(calendarId: string, eventId: string): Promise<boolean> {
        this._requireCalendar(calendarId);
        validate(idSchema, eventId);
        this._requireOwnTransaction();
        const result = this.db
            .delete(events)
            .where(and(eq(events.id, eventId), eq(events.calendarId, calendarId)))
            .run();
        if (result.changes === 0) return false;
        this._notify({ type: 'deleted', calendarId, event: { id: eventId } });
        return true;
    }

    private _requireOwnTransaction(): void {
        // No SQLite commit hook is available for notifications in a caller-owned transaction.
        if (this.onMutation && this.db.$client.inTransaction)
            throw new Error('Event mutation hooks require a service-owned transaction');
    }

    private _notify(event: SseEvent): void {
        if (!this.onMutation) return;
        try {
            Promise.resolve(this.onMutation(structuredClone(event))).catch(() => {});
        } catch {
            /* Committed mutations do not depend on best-effort delivery. */
        }
    }

    private _overlap(calendarId: string, start: string, end: string) {
        this._requireCalendar(calendarId);
        validate(dateRangeQuerySchema, { start, end });
        const [startY, startM, startD] = this._parseDate(start);
        const [endY, endM, endD] = this._parseDate(end);
        // Inclusive overlap. Tuple comparison lets SQLite seek on the installed date index.
        return and(
            eq(events.calendarId, calendarId),
            sql`(${events.startYear}, ${events.startMonth}, ${events.startDay}) <= (${endY}, ${endM}, ${endD})`,
            sql`(${events.endYear}, ${events.endMonth}, ${events.endDay}) >= (${startY}, ${startM}, ${startD})`,
        );
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

    private _dateFromRow(row: Pick<EventRow, keyof typeof dateColumns>): ApiCalendarEntry['date'] {
        return {
            start: { year: row.startYear, month: row.startMonth, day: row.startDay },
            end: { year: row.endYear, month: row.endMonth, day: row.endDay },
        };
    }

    private _validateStoredState(row: EventRow): void {
        const { heading, content, color, startHour, startMinute, endHour, endMinute } = row;
        let time: ApiCalendarEntry['time'] = null;
        if (startHour !== null || startMinute !== null || endHour !== null || endMinute !== null) {
            if (
                startHour === null ||
                startMinute === null ||
                endHour === null ||
                endMinute === null
            )
                throw new ValidationError('Invalid input', {
                    time: ['Stored time is incomplete; set time to null or supply a full interval'],
                });
            time = {
                start: { hour: startHour, minute: startMinute },
                end: { hour: endHour, minute: endMinute },
            };
        }
        validate(eventStateSchema, { heading, content, color, date: this._dateFromRow(row), time });
    }

    private _toDto(row: EventRow): ApiCalendarEntry {
        return {
            id: row.id,
            calendarId: row.calendarId,
            heading: row.heading,
            content: row.content,
            color: row.color,
            date: this._dateFromRow(row),
            // Raw reads retain the legacy fallback; it is not a valid PATCH base.
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
