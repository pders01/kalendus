import { z } from 'zod';

const apiDateSchema = z.object({
    year: z.number().int().min(1970).max(2100),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
});

const apiTimeSchema = z.object({
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
});

export const createCalendarSchema = z.object({
    name: z.string().min(1).max(255),
    locale: z.string().min(2).max(10).optional(),
    firstDayOfWeek: z.number().int().min(0).max(6).optional(),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    themeTokens: z.record(z.string()).optional(),
});

export const updateCalendarSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    locale: z.string().min(2).max(10).optional(),
    firstDayOfWeek: z.number().int().min(0).max(6).optional(),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    themeTokens: z.record(z.string()).nullable().optional(),
});

export const createEventSchema = z.object({
    heading: z.string().min(1).max(500),
    content: z.string().max(5000).optional(),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    date: z.object({
        start: apiDateSchema,
        end: apiDateSchema,
    }),
    time: z
        .object({
            start: apiTimeSchema,
            end: apiTimeSchema,
        })
        .optional(),
});

export const updateEventSchema = z.object({
    heading: z.string().min(1).max(500).optional(),
    content: z.string().max(5000).nullable().optional(),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
    date: z
        .object({
            start: apiDateSchema,
            end: apiDateSchema,
        })
        .optional(),
    time: z
        .object({
            start: apiTimeSchema,
            end: apiTimeSchema,
        })
        .nullable()
        .optional(),
});

export const dateRangeQuerySchema = z.object({
    start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const telemetrySchema = z.object({
    action: z.string().min(1).max(100),
    calendarId: z.string().min(1),
    metadata: z.record(z.unknown()).optional(),
    timestamp: z.string().datetime().optional(),
});
