import { DateTime } from 'luxon';

import { normalizeLocale } from './messages.js';

// Intl and Luxon accept script tags. Preserve region/script/numbering preferences;
// catalog fallback does not change the user's date/number formatting locale.
const resolveLuxonLocale = normalizeLocale;

/** CalendarDate is always Gregorian, even for locales defaulting to another era. */
export const DISPLAY_CALENDAR = 'gregory' as const;

const _dateFormatters = new Map<string, Intl.DateTimeFormat>();
const _digits = new Map<string, readonly string[]>();
function localizeDigits(value: string, locale: string): string {
    const canonical = normalizeLocale(locale);
    let digits = _digits.get(canonical);
    if (!digits) {
        const formatter = new Intl.NumberFormat(canonical, { useGrouping: false });
        digits = Array.from({ length: 10 }, (_, digit) => formatter.format(digit));
        _digits.set(canonical, digits);
    }
    // Some WebKit Intl builds ignore numberingSystem for Gregorian dates.
    // Replace only ASCII digits, preserving Intl's ordering, literals and bidi.
    return value.replace(/[0-9]/g, (digit) => digits![Number(digit)]);
}
function dateFormatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const canonical = normalizeLocale(locale);
    const key = JSON.stringify([canonical, options]);
    let formatter = _dateFormatters.get(key);
    if (!formatter) {
        formatter = new Intl.DateTimeFormat(canonical, {
            ...options,
            calendar: DISPLAY_CALENDAR,
            // WebKit may choose Latin digits for an explicit Gregorian date
            // despite the locale's NumberFormat using native numerals.
            numberingSystem:
                options.numberingSystem ??
                new Intl.NumberFormat(canonical).resolvedOptions().numberingSystem,
            timeZone: 'UTC',
        });
        _dateFormatters.set(key, formatter);
    }
    return formatter;
}

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
                    .reconfigure({ outputCalendar: DISPLAY_CALENDAR })
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
        fmt = dateFormatter(key, { day: 'numeric', month: 'short' });
        _dayMonthFmtCache.set(key, fmt);
    }
    return fmt;
}

/**
 * Format a DateTime with the given locale
 */
export function formatDateTime(dateTime: DateTime, format: string, locale = 'en'): string {
    return dateTime
        .setLocale(resolveLuxonLocale(locale))
        .reconfigure({ outputCalendar: DISPLAY_CALENDAR })
        .toFormat(format);
}

/** Get a standalone month name, abbreviated unless requested otherwise. */
export function getLocalizedMonth(
    month: number,
    locale = 'en',
    width: 'short' | 'long' = 'short',
): string {
    return localizeDigits(
        dateFormatter(locale, { month: width }).format(civilDate(1, month, 2024)),
        locale,
    );
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
    return localizeDigits(getDayMonthFormatter(locale).format(date), locale);
}

/** Structured day/month display without imposing an English word order. */
export function getLocalizedDayMonthParts(
    day: number,
    month: number,
    year: number,
    locale = 'en',
): Intl.DateTimeFormatPart[] {
    return getDayMonthFormatter(locale)
        .formatToParts(civilDate(day, month, year))
        .map((part) => ({ ...part, value: localizeDigits(part.value, locale) }));
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
        fmt = dateFormatter(key, { hour: 'numeric', minute: '2-digit' });
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
    return localizeDigits(getTimeFormatter(locale).format(d), locale);
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
    return localizeDigits(
        dateFormatter(locale, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }).format(civilDate(day, month, year)),
        locale,
    );
}

/** Complete month/year phrase, including locale order, suffixes and numerals. */
export function formatLocalizedMonthYear(month: number, year: number, locale = 'en'): string {
    return localizeDigits(
        dateFormatter(locale, { month: 'short', year: 'numeric' }).format(
            civilDate(1, month, year),
        ),
        locale,
    );
}

/** Year label with locale numerals and date grammar (e.g. Japanese 年). */
export function formatLocalizedYear(year: number, locale = 'en'): string {
    return localizeDigits(
        dateFormatter(locale, { year: 'numeric' }).format(civilDate(1, 1, year)),
        locale,
    );
}

/** Inclusive civil-date interval. Intl elides shared fields without inventing word order.
 * UTC is a carrier only; no host timezone or locale-default calendar may change dates.
 */
export function formatLocalizedDateInterval(
    start: Readonly<{ day: number; month: number; year: number }>,
    end: Readonly<{ day: number; month: number; year: number }>,
    locale = 'en',
): string {
    const first = civilDate(start.day, start.month, start.year);
    const last = civilDate(end.day, end.month, end.year);
    if (first > last) throw new RangeError('Date interval ends before it starts');
    const formatter = dateFormatter(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    // formatRange is widely available, but the library's ES2020 declaration target
    // does not include it. Preserve a complete-date fallback for older Intl engines.
    const rangeFormatter = formatter as Intl.DateTimeFormat & {
        formatRange?: (start: Date, end: Date) => string;
    };
    const range =
        first.getTime() === last.getTime()
            ? formatter.format(first)
            : (rangeFormatter.formatRange?.(first, last) ??
              `${formatter.format(first)} – ${formatter.format(last)}`);
    return `\u2068${localizeDigits(range, locale)}\u2069`;
}
