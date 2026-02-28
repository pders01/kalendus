import { DateTime } from 'luxon';

/**
 * Map lit-localize locale codes to Intl/Luxon-compatible BCP47 tags.
 * Some of our locale codes (e.g., `zh-Hans`) use Unicode script subtags
 * that Luxon/Intl may not handle correctly — they need proper region tags.
 */
const LUXON_LOCALE_MAP: Record<string, string> = {
    'zh-Hans': 'zh-CN',
    'zh-Hant': 'zh-TW',
};

/**
 * Resolve a locale tag to a Luxon/Intl-compatible BCP47 tag.
 */
function resolveLuxonLocale(locale: string): string {
    return LUXON_LOCALE_MAP[locale] || locale;
}

// ── Cached month names (12-element array per locale) ─────────────────
const _monthCache = new Map<string, readonly string[]>();

function getMonthNames(locale: string): readonly string[] {
    const key = resolveLuxonLocale(locale);
    let arr = _monthCache.get(key);
    if (!arr) {
        arr = Object.freeze(
            Array.from({ length: 12 }, (_, i) =>
                DateTime.local()
                    .set({ month: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 })
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
                DateTime.local()
                    .set({ weekday: (i + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 })
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
        fmt = new Intl.DateTimeFormat(key, { day: 'numeric', month: 'short' });
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
export function getLocalizedDayMonth(day: number, month: number, year: number, locale = 'en'): string {
    const date = new Date(year, month - 1, day);
    return getDayMonthFormatter(locale).format(date);
}

/**
 * Get localized weekday name (abbreviated for calendar headers)
 */
export function getLocalizedWeekdayShort(weekday: number, locale = 'en'): string {
    return getWeekdayNames(locale)[weekday - 1];
}
