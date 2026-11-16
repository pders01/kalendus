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
    | 'viewLabel'
    | 'allDayEventsWeek';

export type ResolvedMessages = Readonly<Record<MessageKey, string>>;

// Single source of truth: key ↔ hash ↔ fallback
export const MESSAGE_DEFS: ReadonlyArray<readonly [MessageKey, string, string]> = [
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
    ['allDayEventsWeek', 'sa1b2c3d4e5f60013', 'All-day events for this week'],
] as const;

// ── Lazy loader map ─────────────────────────────────────────────
// Each entry is a thunk returning a dynamic import(). Vite/Rollup
// will code-split each into a separate chunk.
// de-DE reuses the de module (files are byte-identical).
export type TemplateModule = { templates: Record<string, string> };
const localeLoaders: Record<string, () => Promise<TemplateModule>> = {
    ar: () => import('../generated/locales/ar.js'),
    bn: () => import('../generated/locales/bn.js'),
    cs: () => import('../generated/locales/cs.js'),
    da: () => import('../generated/locales/da.js'),
    de: () => import('../generated/locales/de.js'),
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

/** Canonical formatting tag; malformed input deterministically uses English. */
export function normalizeLocale(locale: string): string {
    try {
        return new Intl.Locale(locale).toString();
    } catch {
        return 'en';
    }
}

export interface LocaleLoadResult {
    readonly requestedLocale: string;
    readonly locale: string;
    readonly catalogLocale: string;
    readonly fallback: boolean;
}

/**
 * Independent resolver state, also useful for isolated hosts/tests. Default instances
 * share immutable catalog downloads, never a mutable global active locale.
 */
export function createLocaleResolver(loaders = localeLoaders) {
    const loaded = new Map<string, Readonly<Record<string, string>>>();
    const pending = new Map<string, Promise<void>>();
    const bundles = new Map<string, ResolvedMessages>();
    const resolutions = new Map<string, LocaleLoadResult>();
    let generation = 0;

    function resolveLocale(requestedLocale: string): LocaleLoadResult {
        const cached = resolutions.get(requestedLocale);
        if (cached) return cached;
        const locale = normalizeLocale(requestedLocale);
        const parsed = new Intl.Locale(locale);
        let catalogLocale = 'en';
        if (parsed.language !== 'en') {
            const candidates = [
                parsed.baseName,
                `${parsed.language}-${parsed.script}`,
                parsed.language,
            ];
            // Do not silently translate Traditional Chinese with the Simplified catalog.
            if (parsed.language === 'zh' && parsed.maximize().script === 'Hans')
                candidates.push('zh-Hans');
            catalogLocale =
                candidates.find((key) => Object.prototype.hasOwnProperty.call(loaders, key)) ??
                'en';
        }
        const result = Object.freeze({
            requestedLocale,
            locale,
            catalogLocale,
            fallback: catalogLocale === 'en' && parsed.language !== 'en',
        });
        // Catalog identities are fixed; arbitrary requested aliases must not grow
        // caches without limit or repeatedly parse Intl.Locale in dense views.
        if (resolutions.size >= 64) resolutions.delete(resolutions.keys().next().value!);
        resolutions.set(requestedLocale, result);
        return result;
    }

    function getMessages(locale: string): ResolvedMessages {
        const { catalogLocale } = resolveLocale(locale);
        let bundle = bundles.get(catalogLocale);
        if (!bundle) {
            const templates = loaded.get(catalogLocale);
            const resolved = {} as Record<MessageKey, string>;
            for (const [key, hashId, fallback] of MESSAGE_DEFS)
                resolved[key] = templates?.[hashId] ?? fallback;
            bundle = Object.freeze(resolved);
            bundles.set(catalogLocale, bundle);
        }
        return bundle;
    }

    function isLocaleLoaded(locale: string): boolean {
        const { catalogLocale } = resolveLocale(locale);
        return catalogLocale === 'en' || loaded.has(catalogLocale);
    }

    function ensureLocale(locale: string): Promise<void> {
        const { catalogLocale } = resolveLocale(locale);
        if (catalogLocale === 'en' || loaded.has(catalogLocale)) return Promise.resolve();
        const existing = pending.get(catalogLocale);
        if (existing) return existing;
        const epoch = generation;
        // Promise.resolve also turns a synchronous loader exception into a rejection.
        const promise = Promise.resolve()
            .then(() => loaders[catalogLocale]())
            .then((mod) => {
                if (generation !== epoch) return;
                loaded.set(catalogLocale, Object.freeze({ ...mod.templates }));
                bundles.delete(catalogLocale);
            })
            .finally(() => {
                if (pending.get(catalogLocale) === promise) pending.delete(catalogLocale);
            });
        pending.set(catalogLocale, promise);
        return promise;
    }

    /** Rich completion API; rejects on chunk failure, allowing a subsequent retry. */
    async function loadLocale(locale: string): Promise<LocaleLoadResult> {
        await ensureLocale(locale);
        return resolveLocale(locale);
    }

    function template(locale: string, id: string, fallback: string): string {
        return loaded.get(resolveLocale(locale).catalogLocale)?.[id] ?? fallback;
    }

    return {
        resolveLocale,
        getMessages,
        isLocaleLoaded,
        ensureLocale,
        loadLocale,
        template,
        reset() {
            generation++;
            loaded.clear();
            pending.clear();
            bundles.clear();
            resolutions.clear();
        },
    };
}

const resolver = createLocaleResolver();
export const getMessages = resolver.getMessages;
/** True when the resolved catalog (including an intentional English fallback) is ready. */
export const isLocaleLoaded = resolver.isLocaleLoaded;
/** Compatibility API: rejects on failure; pending failures are evicted for retry. */
export const ensureLocale = resolver.ensureLocale;
export const loadLocale = resolver.loadLocale;
export const resolveLocale = resolver.resolveLocale;
export const _resetForTesting = resolver.reset;

/** Complete phrases. Legacy fragment fields remain available until consumers migrate. */
export function getMessageFormatters(locale: string) {
    const canonical = normalizeLocale(locale);
    const number = new Intl.NumberFormat(canonical);
    const plural = new Intl.PluralRules(canonical);
    const interpolate = (id: string, fallback: string, values: Record<string, string>) =>
        resolver
            .template(locale, id, fallback)
            .replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
    const countPhrase = (count: number) => {
        if (!Number.isSafeInteger(count) || count < 0)
            throw new RangeError('Event count must be a nonnegative safe integer');
        const category = plural.select(count);
        return interpolate(
            `eventCount_${category}`,
            count === 1 ? '{count} event' : '{count} events',
            { count: number.format(count) },
        );
    };
    return Object.freeze({
        eventCount: countPhrase,
        moreEvents: (count: number) => {
            countPhrase(count); // validate before formatting
            return interpolate(
                `moreCount_${plural.select(count)}`,
                count === 1 ? '{count} more event' : '{count} more events',
                { count: number.format(count) },
            );
        },
        switchToDayView: (date: string) =>
            interpolate('openDate', 'Switch to day view for {date}', { date }),
        showWeek: (week: number) =>
            interpolate('showWeek', 'Show week {week}', { week: number.format(week) }),
        viewLabel: (view: string) => interpolate('namedView', '{view} view', { view }),
        eventLabel: (title: string, date: string, time: string) =>
            interpolate('eventLabel', '{title}: {date}, {time}', { title, date, time }),
        dateSummary: (date: string, count: number) =>
            interpolate('dateSummary', '{date}: {events}. Open day view', {
                date,
                events: countPhrase(count),
            }),
        timeRange: (start: string, end: string) =>
            interpolate('timeRange', '{start} – {end}', { start, end }),
    });
}
