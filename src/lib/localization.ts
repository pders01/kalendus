import { configureLocalization } from '@lit/localize';
import { DateTime } from 'luxon';
import { sourceLocale, targetLocales } from '../generated/locale-codes.js';

// Configure @lit/localize
export const { getLocale, setLocale } = configureLocalization({
    sourceLocale,
    targetLocales,
    loadLocale: (locale: string) => import(`../generated/locales/${locale}.js`),
});

/**
 * Get the current locale, falling back to browser language or 'en'
 */
export function getCurrentLocale(): string {
    return getLocale() || document.documentElement.lang?.slice(0, 2) || 'en';
}

/**
 * Set locale for both @lit/localize and Luxon
 */
export async function setAppLocale(locale: string): Promise<void> {
    await setLocale(locale);
    // Luxon will automatically use the locale when we call .setLocale() on DateTime instances
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
