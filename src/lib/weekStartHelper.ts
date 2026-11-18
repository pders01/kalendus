/**
 * Week-start helpers — centralizes the "first day of week" offset math
 * that was previously duplicated across lms-calendar.ts, Week.ts, Month.ts,
 * and SlotManager.ts.
 *
 * Civil calculations use UTC as an arithmetic carrier, never the ambient time zone.
 */
import { DateTime } from 'luxon';

import { isValidCalendarDate } from './calendarModel.js';

/** Display padding may cross the input domain by a few days; it is never event data. */
export function addDisplayDays(date: CalendarDate, days: number): CalendarDate {
    const next = DateTime.utc(date.year, date.month, date.day).plus({ days });
    return { year: next.year, month: next.month, day: next.day };
}

/**
 * Supported first-day-of-week values (JS Date convention).
 * 0 = Sunday, 1 = Monday (ISO 8601 default), 6 = Saturday
 */
export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * How many days to subtract from `jsDayOfWeek` to reach `firstDay`.
 *
 * JS Date.getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
 *
 * @example getWeekStartOffset(0, 1) // Sunday when Monday-first → 6
 * @example getWeekStartOffset(1, 1) // Monday when Monday-first → 0
 * @example getWeekStartOffset(0, 0) // Sunday when Sunday-first → 0
 */
export function getWeekStartOffset(jsDayOfWeek: number, firstDay: FirstDayOfWeek): number {
    if (
        !Number.isInteger(jsDayOfWeek) ||
        jsDayOfWeek < 0 ||
        jsDayOfWeek > 6 ||
        !Number.isInteger(firstDay) ||
        firstDay < 0 ||
        firstDay > 6
    )
        throw new RangeError('Invalid weekday');
    return (((jsDayOfWeek - firstDay) % 7) + 7) % 7;
}

/**
 * Return the 7 CalendarDate values of the week containing `activeDate`,
 * starting from `firstDay`.
 */
export function getWeekDates(activeDate: CalendarDate, firstDay: FirstDayOfWeek): CalendarDate[] {
    if (!isValidCalendarDate(activeDate)) throw new RangeError('Invalid active date');
    const weekday = DateTime.utc(activeDate.year, activeDate.month, activeDate.day).weekday % 7;
    const offset = getWeekStartOffset(weekday, firstDay);
    return Array.from({ length: 7 }, (_, i) => addDisplayDays(activeDate, i - offset));
}

/**
 * Column offset for the 1st of a month in a week-start-aware grid.
 *
 * @example getFirstDayOffset({ year: 2026, month: 1, day: 1 }, 1) // Thu → 3
 * @example getFirstDayOffset({ year: 2026, month: 1, day: 1 }, 0) // Thu → 4
 */
export function getFirstDayOffset(date: CalendarDate, firstDay: FirstDayOfWeek): number {
    if (!isValidCalendarDate(date)) throw new RangeError('Invalid active date');
    const jsDay = DateTime.utc(date.year, date.month, 1).weekday % 7;
    return getWeekStartOffset(jsDay, firstDay);
}

/**
 * Map Luxon weekday numbers to display order for a given firstDay.
 * Returns an array of 7 Luxon weekday numbers (1 = Mon ... 7 = Sun).
 *
 * @example getWeekdayOrder(1) // Monday-first → [1, 2, 3, 4, 5, 6, 7]
 * @example getWeekdayOrder(0) // Sunday-first → [7, 1, 2, 3, 4, 5, 6]
 */
export function getWeekdayOrder(firstDay: FirstDayOfWeek): number[] {
    getWeekStartOffset(0, firstDay); // Validate the runtime input.
    // Luxon: 1 = Mon, 2 = Tue, ..., 7 = Sun
    // JS:    0 = Sun, 1 = Mon, ..., 6 = Sat
    const luxonFirst = firstDay === 0 ? 7 : firstDay;
    return Array.from({ length: 7 }, (_, i) => ((luxonFirst - 1 + i) % 7) + 1);
}

/**
 * Generate the 42-day calendar array for a month view.
 * Returns an array of 42 CalendarDate objects representing the 6-week grid
 * including leading days from the previous month and trailing days from the next.
 *
 * @param activeDate - Any date within the target month
 * @param firstDayOfWeek - Which day the week starts on (0=Sun, 1=Mon, 6=Sat)
 */
export function getMonthCalendarArray(
    activeDate: CalendarDate,
    firstDayOfWeek: FirstDayOfWeek,
): CalendarDate[] {
    const offset = getFirstDayOffset(activeDate, firstDayOfWeek);
    const first = { year: activeDate.year, month: activeDate.month, day: 1 };
    return Array.from({ length: 42 }, (_, index) => addDisplayDays(first, index - offset));
}

/**
 * CLDR-derived mapping of locale tags to conventional first day of week.
 *
 * Sources:
 * - Unicode CLDR supplemental/weekData
 * - Intl.Locale.prototype.getWeekInfo() (where available)
 *
 * Covers language-only codes and region-specific overrides.
 */
const LOCALE_WEEK_START: Record<string, FirstDayOfWeek> = {
    // Sunday-first (0)
    en: 0,
    'en-US': 0,
    'en-CA': 0,
    'en-AU': 0,
    'en-NZ': 0,
    ja: 0,
    'ja-JP': 0,
    ko: 0,
    'ko-KR': 0,
    zh: 0,
    'zh-CN': 0,
    'zh-TW': 0,
    'zh-Hans': 0,
    'zh-Hant': 0,
    pt: 0,
    'pt-BR': 0,
    he: 0,
    'he-IL': 0,
    hi: 0,
    'hi-IN': 0,
    bn: 0,
    'bn-BD': 0,
    'bn-IN': 0,
    id: 0,
    'id-ID': 0,
    th: 0,
    'th-TH': 0,

    // Monday-first (1) — ISO 8601 default for most of Europe, Africa, etc.
    de: 1,
    'de-DE': 1,
    'de-AT': 1,
    'de-CH': 1,
    fr: 1,
    'fr-FR': 1,
    'fr-CA': 1,
    es: 1,
    'es-ES': 1,
    'es-MX': 1,
    'es-AR': 1,
    it: 1,
    'it-IT': 1,
    nl: 1,
    'nl-NL': 1,
    pl: 1,
    'pl-PL': 1,
    ru: 1,
    'ru-RU': 1,
    uk: 1,
    'uk-UA': 1,
    sv: 1,
    'sv-SE': 1,
    da: 1,
    'da-DK': 1,
    nb: 1,
    'nb-NO': 1,
    fi: 1,
    'fi-FI': 1,
    cs: 1,
    'cs-CZ': 1,
    el: 1,
    'el-GR': 1,
    tr: 1,
    'tr-TR': 1,
    vi: 1,
    'vi-VN': 1,
    'pt-PT': 1, // Portugal uses Monday (unlike Brazil)
    'en-GB': 1, // UK uses Monday

    // Saturday-first (6)
    ar: 6,
    'ar-SA': 6,
    'ar-AE': 6,
    'ar-EG': 6,
    fa: 6,
    'fa-IR': 6,
};

/**
 * Look up the conventional first day of week for a given locale tag.
 *
 * Resolution order:
 * 1. Exact match (e.g., "en-US")
 * 2. Language-only fallback (e.g., "en")
 * 3. Default to Monday (ISO 8601)
 *
 * @example getFirstDayForLocale('en-US') // 0 (Sunday)
 * @example getFirstDayForLocale('de')    // 1 (Monday)
 * @example getFirstDayForLocale('ar')    // 6 (Saturday)
 * @example getFirstDayForLocale('xx')    // 1 (Monday, default)
 */
export function getFirstDayForLocale(locale: string): FirstDayOfWeek {
    let canonical: string;
    try {
        canonical = Intl.getCanonicalLocales(locale)[0];
        if (!canonical) return 1;
    } catch {
        return 1;
    }
    if (Object.prototype.hasOwnProperty.call(LOCALE_WEEK_START, canonical))
        return LOCALE_WEEK_START[canonical];
    const lang = canonical.split('-')[0];
    if (Object.prototype.hasOwnProperty.call(LOCALE_WEEK_START, lang))
        return LOCALE_WEEK_START[lang];

    // ISO 8601 default
    return 1;
}
