import { DateTime } from 'luxon';

import { normalizeLocale } from './messages.js';

// Intl and Luxon accept script tags. Preserve region/script/numbering preferences;
// catalog fallback does not change the user's date/number formatting locale.
const resolveLuxonLocale = normalizeLocale;

/** Civil dates use UTC only as a formatting carrier, never as an event instant. */
function civilDate(day: number, month: number, year: number): Date {
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    date.setUTCHours(0, 0, 0, 0);
    if (
        !Number.isInteger(day) ||
        !Number.isInteger(month) ||
        !Number.isInteger(year) ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new RangeError('Invalid civil date');
    }
    return date;
}

/** Week labels currently use ISO-8601, independent of configured firstDayOfWeek.
 * Monday is the component default; locale week starts are recommendations only.
 */
export const WEEK_NUMBERING_POLICY = 'iso8601' as const;

export function getISOWeek(
    day: number,
    month: number,
    year: number,
): Readonly<{ weekNumber: number; weekYear: number }> {
    civilDate(day, month, year);
    const date = DateTime.utc(year, month, day);
    return Object.freeze({ weekNumber: date.weekNumber, weekYear: date.weekYear });
}

// ── Cached month names (12-element array per locale) ─────────────────
const _monthCache = new Map<string, readonly string[]>();

function getMonthNames(locale: string): readonly string[] {
    const key = resolveLuxonLocale(locale);
    let arr = _monthCache.get(key);
    if (!arr) {
        arr = Object.freeze(
            Array.from({ length: 12 }, (_, i) =>
                DateTime.utc(2024, i + 1, 1)
                    .setLocale(key)
                    .toFormat('MMM'),
            ),
        );
        _monthCache.set(key, arr);
    }
    return arr;
}

// ── Cached weekday names (7-element array per locale) ────────────────
const _weekdayCache = new Map<string, readonly string[]>();

function getWeekdayNames(locale: string): readonly string[] {
    const key = resolveLuxonLocale(locale);
    let arr = _weekdayCache.get(key);
    if (!arr) {
        arr = Object.freeze(
            Array.from({ length: 7 }, (_, i) =>
                DateTime.utc(2024, 1, i + 1)
                    .setLocale(key)
                    .toFormat('ccc'),
            ),
        );
        _weekdayCache.set(key, arr);
    }
    return arr;
}

// ── Cached Intl.DateTimeFormat for day+month ─────────────────────────
const _dayMonthFmtCache = new Map<string, Intl.DateTimeFormat>();

function getDayMonthFormatter(locale: string): Intl.DateTimeFormat {
    const key = resolveLuxonLocale(locale);
    let fmt = _dayMonthFmtCache.get(key);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat(key, { day: 'numeric', month: 'short', timeZone: 'UTC' });
        _dayMonthFmtCache.set(key, fmt);
    }
    return fmt;
}

/**
 * Format a DateTime with the given locale
 */
export function formatDateTime(dateTime: DateTime, format: string, locale = 'en'): string {
    return dateTime.setLocale(resolveLuxonLocale(locale)).toFormat(format);
}

/**
 * Get localized month name (abbreviated)
 */
export function getLocalizedMonth(month: number, locale = 'en'): string {
    return getMonthNames(locale)[month - 1];
}

/**
 * Format day + abbreviated month using the locale's natural ordering.
 * e.g., "1. Feb." (de), "1 feb" (es), "2月1日" (zh/ja)
 */
export function getLocalizedDayMonth(
    day: number,
    month: number,
    year: number,
    locale = 'en',
): string {
    const date = civilDate(day, month, year);
    return getDayMonthFormatter(locale).format(date);
}

/**
 * Get localized weekday name (abbreviated for calendar headers)
 */
export function getLocalizedWeekdayShort(weekday: number, locale = 'en'): string {
    return getWeekdayNames(locale)[weekday - 1];
}

// ── Cached Intl.DateTimeFormat for time (hour+minute) ───────────────
const _timeFmtCache = new Map<string, Intl.DateTimeFormat>();

function getTimeFormatter(locale: string): Intl.DateTimeFormat {
    const key = resolveLuxonLocale(locale);
    let fmt = _timeFmtCache.get(key);
    if (!fmt) {
        fmt = new Intl.DateTimeFormat(key, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
        _timeFmtCache.set(key, fmt);
    }
    return fmt;
}

/**
 * Format a time (hour + minute) using the locale's preferred notation.
 * e.g., "3:30 PM" (en), "15:30" (de), "下午3:30" (zh-CN)
 */
export function formatLocalizedTime(hour: number, minute: number, locale = 'en'): string {
    if (
        !Number.isInteger(hour) ||
        hour < 0 ||
        hour > 24 ||
        !Number.isInteger(minute) ||
        minute < 0 ||
        minute > 59 ||
        (hour === 24 && minute !== 0)
    ) {
        throw new RangeError('Invalid wall time');
    }
    const d = new Date(Date.UTC(2000, 0, 1, hour, minute));
    return getTimeFormatter(locale).format(d);
}

/**
 * Format a time range with an en-dash separator.
 * e.g., "9:00 AM – 5:00 PM" (en), "09:00 – 17:00" (de)
 */
export function formatLocalizedTimeRange(
    startHour: number,
    startMinute: number,
    endHour: number,
    endMinute: number,
    locale = 'en',
): string {
    const start = formatLocalizedTime(startHour, startMinute, locale);
    const end = formatLocalizedTime(endHour, endMinute, locale);
    // LRI (U+2066) ... PDI (U+2069) isolate the range so the BiDi algorithm
    // doesn't reverse "9:00 – 9:30" into "9:30 – 9:00" in RTL contexts.
    return `\u2066${start} \u2013 ${end}\u2069`;
}

/**
 * Format a full date (day + month + year) using the locale's natural ordering.
 * e.g., "Feb 1, 2026" (en), "1. Feb. 2026" (de), "2026年2月1日" (ja)
 */
export function formatLocalizedDate(
    day: number,
    month: number,
    year: number,
    locale = 'en',
): string {
    const key = resolveLuxonLocale(locale);
    const d = civilDate(day, month, year);
    return new Intl.DateTimeFormat(key, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(d);
}
