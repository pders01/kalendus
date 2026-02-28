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

/**
 * Format a DateTime with the given locale
 */
export function formatDateTime(dateTime: DateTime, format: string, locale = 'en'): string {
    return dateTime.setLocale(resolveLuxonLocale(locale)).toFormat(format);
}

/**
 * Get localized month name
 */
export function getLocalizedMonth(month: number, locale = 'en'): string {
    const date = DateTime.local().set({ month });
    return formatDateTime(date, 'MMM', locale);
}

/**
 * Format day + abbreviated month using the locale's natural ordering.
 * e.g., "1. Feb." (de), "1 feb" (es), "2月1日" (zh/ja)
 */
export function getLocalizedDayMonth(day: number, month: number, year: number, locale = 'en'): string {
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(resolveLuxonLocale(locale), { day: 'numeric', month: 'short' }).format(date);
}

/**
 * Get localized weekday name (short)
 */
export function getLocalizedWeekday(weekday: number, locale = 'en'): string {
    // Luxon uses 1=Monday, 7=Sunday
    const date = DateTime.local().set({
        weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    });
    return formatDateTime(date, 'ccc', locale);
}

/**
 * Get localized weekday name (abbreviated for calendar headers)
 */
export function getLocalizedWeekdayShort(weekday: number, locale = 'en'): string {
    const date = DateTime.local().set({
        weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    });
    return formatDateTime(date, 'ccc', locale);
}
