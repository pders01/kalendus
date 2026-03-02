/**
 * Locale-aware message resolver with lazy-loaded dictionaries.
 *
 * English strings are built-in (zero-cost). All other locales are
 * loaded on demand via dynamic import(), keeping them out of the
 * main bundle. The public API (`getMessages`) remains synchronous —
 * it returns English fallbacks until the locale chunk has loaded.
 *
 * Consumers call `ensureLocale(locale)` to trigger the async load
 * and then re-render once the templates are available.
 */

// Typed message keys — compile-time safety for hash IDs
export type MessageKey =
    | 'day'
    | 'week'
    | 'month'
    | 'currentMonth'
    | 'allDay'
    | 'today'
    | 'noTitle'
    | 'noContent'
    | 'noTime'
    | 'eventDetails'
    | 'exportAsICS'
    | 'title'
    | 'time'
    | 'date'
    | 'notes'
    | 'close'
    | 'calendarWeek'
    | 'year'
    | 'previous'
    | 'next'
    | 'events'
    | 'calendarEvent'
    | 'pressToOpen'
    | 'to'
    | 'switchToDayView'
    | 'showEarlierDays'
    | 'showLaterDays'
    | 'more'
    | 'calendarView'
    | 'viewLabel';

export type ResolvedMessages = Readonly<Record<MessageKey, string>>;

// Single source of truth: key ↔ hash ↔ fallback
const MESSAGE_DEFS: ReadonlyArray<readonly [MessageKey, string, string]> = [
    ['day', 'se0955919920ee87d', 'Day'],
    ['week', 's680f01021b5e339d', 'Week'],
    ['month', 'sb47daaf9e1c4a905', 'Month'],
    ['currentMonth', 's15ba5784a11e0b88', 'Current Month'],
    ['allDay', 's58ab939b42a026a6', 'All Day'],
    ['today', 's63d040e37887f17e', 'Today'],
    ['noTitle', 's98b32ef4a0856c08', 'No Title'],
    ['noContent', 's22380c7fc798a44f', 'No Content'],
    ['noTime', 'sfce4bfbe0f911aa7', 'No Time'],
    ['eventDetails', 'sa0fd990c985f24bd', 'Event Details'],
    ['exportAsICS', 's2bc4d1196bce49dc', 'Export as ICS'],
    ['title', 's99f110d27e30b289', 'Title'],
    ['time', 's48e186fb300e5464', 'Time'],
    ['date', 'sac8252732f2edb19', 'Date'],
    ['notes', 's005053d82b712e0a', 'Notes'],
    ['close', 's5e8250fb85d64c23', 'Close'],
    ['calendarWeek', 's090f2107b5a69a7f', 'CW'],
    ['year', 's3c44e22d1af5693e', 'Year'],
    ['previous', 'sa1b2c3d4e5f60001', 'Previous'],
    ['next', 'sa1b2c3d4e5f60002', 'Next'],
    ['events', 'sa1b2c3d4e5f60003', 'events'],
    ['calendarEvent', 'sa1b2c3d4e5f60004', 'Calendar event'],
    ['pressToOpen', 'sa1b2c3d4e5f60005', 'Press Enter or Space to open details'],
    ['to', 'sa1b2c3d4e5f60006', 'to'],
    ['switchToDayView', 'sa1b2c3d4e5f60007', 'Switch to day view for'],
    ['showEarlierDays', 'sa1b2c3d4e5f60008', 'Show earlier days'],
    ['showLaterDays', 'sa1b2c3d4e5f60009', 'Show later days'],
    ['more', 'sa1b2c3d4e5f60010', 'more'],
    ['calendarView', 'sa1b2c3d4e5f60011', 'Calendar view'],
    ['viewLabel', 'sa1b2c3d4e5f60012', 'view'],
] as const;

// ── Lazy loader map ─────────────────────────────────────────────
// Each entry is a thunk returning a dynamic import(). Vite/Rollup
// will code-split each into a separate chunk.
// de-DE reuses the de module (files are byte-identical).
type TemplateModule = { templates: Record<string, string> };
const localeLoaders: Record<string, () => Promise<TemplateModule>> = {
    ar: () => import('../generated/locales/ar.js'),
    bn: () => import('../generated/locales/bn.js'),
    cs: () => import('../generated/locales/cs.js'),
    da: () => import('../generated/locales/da.js'),
    de: () => import('../generated/locales/de.js'),
    'de-DE': () => import('../generated/locales/de.js'),
    el: () => import('../generated/locales/el.js'),
    es: () => import('../generated/locales/es.js'),
    fi: () => import('../generated/locales/fi.js'),
    fr: () => import('../generated/locales/fr.js'),
    he: () => import('../generated/locales/he.js'),
    hi: () => import('../generated/locales/hi.js'),
    id: () => import('../generated/locales/id.js'),
    it: () => import('../generated/locales/it.js'),
    ja: () => import('../generated/locales/ja.js'),
    ko: () => import('../generated/locales/ko.js'),
    nb: () => import('../generated/locales/nb.js'),
    nl: () => import('../generated/locales/nl.js'),
    pl: () => import('../generated/locales/pl.js'),
    pt: () => import('../generated/locales/pt.js'),
    ru: () => import('../generated/locales/ru.js'),
    sv: () => import('../generated/locales/sv.js'),
    th: () => import('../generated/locales/th.js'),
    tr: () => import('../generated/locales/tr.js'),
    uk: () => import('../generated/locales/uk.js'),
    vi: () => import('../generated/locales/vi.js'),
    'zh-Hans': () => import('../generated/locales/zh-Hans.js'),
};

// ── Runtime state ───────────────────────────────────────────────
/** Templates that have been loaded so far. */
const loadedTemplates: Record<string, Record<string, string>> = {};

/** In-flight load promises (prevents duplicate fetches). */
const pendingLoads = new Map<string, Promise<void>>();

const _bundleCache = new Map<string, ResolvedMessages>();

function resolveTemplates(locale: string): Record<string, string> | undefined {
    if (locale === 'en') return undefined;
    return loadedTemplates[locale] ?? loadedTemplates[locale.split('-')[0]];
}

/**
 * Synchronous message resolver. Returns the best available messages
 * for the given locale — English fallbacks until the locale chunk
 * has been loaded via `ensureLocale()`.
 */
export function getMessages(locale: string): ResolvedMessages {
    let bundle = _bundleCache.get(locale);
    if (bundle) return bundle;

    const templates = resolveTemplates(locale);
    const resolved = {} as Record<MessageKey, string>;
    for (const [key, hashId, fallback] of MESSAGE_DEFS) {
        resolved[key] = templates?.[hashId] ?? fallback;
    }
    bundle = Object.freeze(resolved);
    _bundleCache.set(locale, bundle);
    return bundle;
}

/**
 * Ensure a locale's templates are loaded. Returns immediately if
 * the locale is already available. For English, this is a no-op.
 *
 * After the promise resolves, subsequent `getMessages(locale)` calls
 * will return the correct translations.
 */
export function ensureLocale(locale: string): Promise<void> {
    // English is built-in — nothing to load
    if (locale === 'en') return Promise.resolve();

    // Already loaded
    if (loadedTemplates[locale]) return Promise.resolve();

    // Check language-only fallback (e.g. de-AT → de)
    const langOnly = locale.split('-')[0];
    if (langOnly !== locale && loadedTemplates[langOnly]) return Promise.resolve();

    // Already in-flight
    const pending = pendingLoads.get(locale);
    if (pending) return pending;

    // Resolve the loader: exact match → language-only fallback
    const loader = localeLoaders[locale] ?? localeLoaders[langOnly];
    if (!loader) return Promise.resolve(); // unknown locale — English fallback

    const promise = loader().then((mod) => {
        loadedTemplates[locale] = mod.templates;
        // Also register under language-only key for sub-tag fallback
        if (langOnly !== locale && !loadedTemplates[langOnly]) {
            loadedTemplates[langOnly] = mod.templates;
        }
        // Invalidate cached bundles so getMessages() rebuilds with new templates
        _bundleCache.delete(locale);
        _bundleCache.delete(langOnly);
        pendingLoads.delete(locale);
    });

    pendingLoads.set(locale, promise);
    return promise;
}

/**
 * @internal — exposed for testing only.
 * Clears all loaded templates and cached bundles.
 */
export function _resetForTesting(): void {
    for (const key of Object.keys(loadedTemplates)) {
        delete loadedTemplates[key];
    }
    pendingLoads.clear();
    _bundleCache.clear();
}
