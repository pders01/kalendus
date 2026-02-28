import { configureLocalization } from '@lit/localize';
import { DateTime } from 'luxon';

import { allLocales, sourceLocale, targetLocales } from '../generated/locale-codes.js';

// Explicit locale import map — static imports that Vite can analyze at build time.
// The dynamic import(`../generated/locales/${locale}.js`) pattern breaks in Vite's
// dev server because its dynamic-import-helper can't resolve .js → .ts mappings.
const localeModules: Record<string, () => Promise<unknown>> = {
    ar: () => import('../generated/locales/ar.js'),
    de: () => import('../generated/locales/de.js'),
    'de-DE': () => import('../generated/locales/de-DE.js'),
    es: () => import('../generated/locales/es.js'),
    fr: () => import('../generated/locales/fr.js'),
    ja: () => import('../generated/locales/ja.js'),
    pt: () => import('../generated/locales/pt.js'),
    'zh-Hans': () => import('../generated/locales/zh-Hans.js'),
};

// Configure @lit/localize
export const { getLocale, setLocale } = configureLocalization({
    sourceLocale,
    targetLocales,
    loadLocale: (locale: string) => localeModules[locale](),
});

/**
 * Resolve an arbitrary locale tag to the best matching supported locale.
 *
 * Resolution order:
 * 1. Exact match (e.g., "de-DE")
 * 2. Language-only fallback (e.g., "de" for "de-AT")
 * 3. undefined if no match
 */
function resolveLocale(locale: string): (typeof allLocales)[number] | undefined {
    const all: readonly string[] = allLocales;

    // Exact match
    if (all.includes(locale)) {
        return locale as (typeof allLocales)[number];
    }

    // Language-only fallback
    const lang = locale.split('-')[0];
    if (all.includes(lang)) {
        return lang as (typeof allLocales)[number];
    }

    return undefined;
}

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
 * Internal Luxon-compatible locale. Updated synchronously alongside
 * the async @lit/localize setLocale so Luxon formatting is always current.
 */
let _luxonLocale = 'en';

/**
 * Get the current locale for Luxon/Intl formatting.
 */
export function getCurrentLocale(): string {
    return _luxonLocale;
}

/**
 * Set locale for both @lit/localize and Luxon.
 * Accepts any locale tag and resolves to the best available match.
 */
export async function setAppLocale(locale: string): Promise<void> {
    // Update Luxon locale immediately (synchronous) so formatting is correct
    // even before the async @lit/localize module load completes.
    _luxonLocale = LUXON_LOCALE_MAP[locale] || locale;

    const resolved = resolveLocale(locale);
    if (resolved) {
        // Always call setLocale — including for the source locale — so that
        // @lit/localize clears any previously loaded target-locale templates
        // and fires the lit-localize-status event for @localized() components.
        await setLocale(resolved as (typeof targetLocales)[number]);
    }
}

/**
 * Format a DateTime with the current locale
 */
export function formatDateTime(dateTime: DateTime, format: string): string {
    return dateTime.setLocale(getCurrentLocale()).toFormat(format);
}

/**
 * Get localized month name
 */
export function getLocalizedMonth(month: number): string {
    const date = DateTime.local().set({ month });
    return formatDateTime(date, 'MMM');
}

/**
 * Format day + abbreviated month using the locale's natural ordering.
 * e.g., "1. Feb." (de), "1 feb" (es), "2月1日" (zh/ja)
 */
export function getLocalizedDayMonth(day: number, month: number, year: number): string {
    const date = new Date(year, month - 1, day);
    return new Intl.DateTimeFormat(getCurrentLocale(), { day: 'numeric', month: 'short' }).format(date);
}

/**
 * Get localized weekday name (short)
 */
export function getLocalizedWeekday(weekday: number): string {
    // Luxon uses 1=Monday, 7=Sunday
    const date = DateTime.local().set({
        weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    });
    return formatDateTime(date, 'ccc');
}

/**
 * Get localized weekday name (abbreviated for calendar headers)
 */
export function getLocalizedWeekdayShort(weekday: number): string {
    const date = DateTime.local().set({
        weekday: weekday as 1 | 2 | 3 | 4 | 5 | 6 | 7,
    });
    return formatDateTime(date, 'ccc');
}
