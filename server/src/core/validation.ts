import { z } from 'zod';

import { ValidationError } from './errors.js';

export const idSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

export function civilDateKey(date: { year: number; month: number; day: number }): string {
    return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
}

export const apiDateSchema = z
    .object({
        year: z.number().int().min(1970).max(2100),
        month: z.number().int().min(1).max(12),
        day: z.number().int().min(1).max(31),
    })
    .strict()
    .refine(({ year, month, day }) => {
        const actual = new Date(Date.UTC(year, month - 1, day));
        return (
            actual.getUTCFullYear() === year &&
            actual.getUTCMonth() === month - 1 &&
            actual.getUTCDate() === day
        );
    }, 'Invalid civil date');

export const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
        const [year, month, day] = value.split('-').map(Number);
        return apiDateSchema.safeParse({ year, month, day }).success;
    }, 'Invalid civil date');

const apiTimeSchema = z
    .object({
        hour: z.number().int().min(0).max(23),
        minute: z.number().int().min(0).max(59),
    })
    .strict();
const dateIntervalSchema = z.object({ start: apiDateSchema, end: apiDateSchema }).strict();
const timeIntervalSchema = z.object({ start: apiTimeSchema, end: apiTimeSchema }).strict();
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const themeTokensSchema = z
    .record(z.string().max(128), z.string().max(512))
    .refine((value) => Object.keys(value).length <= 64, 'Too many theme tokens');

export const createCalendarSchema = z
    .object({
        name: z.string().min(1).max(255),
        locale: z.string().min(2).max(35).optional(),
        firstDayOfWeek: z.number().int().min(0).max(6).optional(),
        color: colorSchema.optional(),
        themeTokens: themeTokensSchema.optional(),
    })
    .strict();
export const updateCalendarSchema = createCalendarSchema
    .partial()
    .extend({
        themeTokens: themeTokensSchema.nullable().optional(),
    })
    .strict();

const eventShape = z
    .object({
        heading: z.string().min(1).max(500),
        content: z.string().max(5000).nullable().optional(),
        color: colorSchema.optional(),
        date: dateIntervalSchema,
        time: timeIntervalSchema.nullable().optional(),
    })
    .strict();

function orderedInterval(value: z.infer<typeof eventShape>, ctx: z.RefinementCtx): void {
    const start = civilDateKey(value.date.start);
    const end = civilDateKey(value.date.end);
    if (start > end)
        ctx.addIssue({ code: 'custom', path: ['date'], message: 'End date precedes start date' });
    if (
        start === end &&
        value.time &&
        value.time.start.hour * 60 + value.time.start.minute >=
            value.time.end.hour * 60 + value.time.end.minute
    ) {
        ctx.addIssue({
            code: 'custom',
            path: ['time'],
            message:
                'Timed intervals must end after they start; use the next date for overnight events',
        });
    }
}

/** Complete state validation is also applied after merging PATCH with stored state. */
export const eventStateSchema = eventShape.superRefine(orderedInterval);
export const createEventSchema = eventShape
    .extend({
        content: z.string().max(5000).optional(),
        time: timeIntervalSchema.optional(),
    })
    .superRefine(orderedInterval);
export const updateEventSchema = eventShape.partial();
export const MAX_QUERY_DAYS = 366;
export const MAX_QUERY_RESULTS = 5000;
export const dateRangeQuerySchema = z
    .object({ start: isoDateSchema, end: isoDateSchema })
    .refine(({ start, end }) => start <= end, 'End date precedes start date')
    .refine(
        ({ start, end }) =>
            (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000 <
            MAX_QUERY_DAYS,
        `Query cannot exceed ${MAX_QUERY_DAYS} inclusive civil dates`,
    );

function boundedMetadata(value: Record<string, unknown> | undefined): boolean {
    if (!value) return true;
    if (Object.keys(value).length > 32) return false;
    let nodes = 0;
    const seen = new Set<object>();
    const visit = (node: unknown, depth: number): boolean => {
        if (++nodes > 256 || depth > 8) return false;
        if (node === null || typeof node === 'string' || typeof node === 'boolean') return true;
        if (typeof node === 'number') return Number.isFinite(node);
        if (typeof node !== 'object' || seen.has(node)) return false;
        seen.add(node);
        return Object.values(node).every((child) => visit(child, depth + 1));
    };
    try {
        return (
            visit(value, 0) && new TextEncoder().encode(JSON.stringify(value)).byteLength <= 4096
        );
    } catch {
        return false;
    }
}

export const telemetrySchema = z
    .object({
        action: z.string().min(1).max(100),
        calendarId: idSchema,
        metadata: z
            .record(z.unknown())
            .optional()
            .refine(
                boundedMetadata,
                'Metadata must be bounded JSON (32 keys, 4096 bytes, 256 nodes, depth 8)',
            ),
        timestamp: z.string().datetime().optional(),
    })
    .strict();

export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
    const result = schema.safeParse(value);
    if (!result.success) {
        const details: Record<string, string[]> = {};
        for (const issue of result.error.issues)
            (details[issue.path.join('.') || 'input'] ??= []).push(issue.message);
        throw new ValidationError('Invalid input', details);
    }
    return result.data;
}
