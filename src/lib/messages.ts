import { targetLocales } from '../generated/locale-codes.js';
import { templates as arTemplates } from '../generated/locales/ar.js';
import { templates as bnTemplates } from '../generated/locales/bn.js';
import { templates as csTemplates } from '../generated/locales/cs.js';
import { templates as daTemplates } from '../generated/locales/da.js';
import { templates as deDETemplates } from '../generated/locales/de-DE.js';
import { templates as deTemplates } from '../generated/locales/de.js';
import { templates as elTemplates } from '../generated/locales/el.js';
import { templates as esTemplates } from '../generated/locales/es.js';
import { templates as fiTemplates } from '../generated/locales/fi.js';
import { templates as frTemplates } from '../generated/locales/fr.js';
import { templates as heTemplates } from '../generated/locales/he.js';
import { templates as hiTemplates } from '../generated/locales/hi.js';
import { templates as idTemplates } from '../generated/locales/id.js';
import { templates as itTemplates } from '../generated/locales/it.js';
import { templates as jaTemplates } from '../generated/locales/ja.js';
import { templates as koTemplates } from '../generated/locales/ko.js';
import { templates as nbTemplates } from '../generated/locales/nb.js';
import { templates as nlTemplates } from '../generated/locales/nl.js';
import { templates as plTemplates } from '../generated/locales/pl.js';
import { templates as ptTemplates } from '../generated/locales/pt.js';
import { templates as ruTemplates } from '../generated/locales/ru.js';
import { templates as svTemplates } from '../generated/locales/sv.js';
import { templates as thTemplates } from '../generated/locales/th.js';
import { templates as trTemplates } from '../generated/locales/tr.js';
import { templates as ukTemplates } from '../generated/locales/uk.js';
import { templates as viTemplates } from '../generated/locales/vi.js';
import { templates as zhHansTemplates } from '../generated/locales/zh-Hans.js';

const allTemplates: Record<string, Record<string, string>> = {
    ar: arTemplates,
    bn: bnTemplates,
    cs: csTemplates,
    da: daTemplates,
    de: deTemplates,
    'de-DE': deDETemplates,
    el: elTemplates,
    es: esTemplates,
    fi: fiTemplates,
    fr: frTemplates,
    he: heTemplates,
    hi: hiTemplates,
    id: idTemplates,
    it: itTemplates,
    ja: jaTemplates,
    ko: koTemplates,
    nb: nbTemplates,
    nl: nlTemplates,
    pl: plTemplates,
    pt: ptTemplates,
    ru: ruTemplates,
    sv: svTemplates,
    th: thTemplates,
    tr: trTemplates,
    uk: ukTemplates,
    vi: viTemplates,
    'zh-Hans': zhHansTemplates,
};

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

const _bundleCache = new Map<string, ResolvedMessages>();

function resolveTemplates(locale: string): Record<string, string> | undefined {
    if (locale === 'en') return undefined;
    return allTemplates[locale] ?? allTemplates[locale.split('-')[0]];
}

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

// Dev-mode validation — tree-shaken in production builds
if ((import.meta as ImportMeta & { env?: { DEV?: boolean } }).env?.DEV) {
    for (const code of targetLocales) {
        if (!(code in allTemplates)) {
            console.warn(`[lms-calendar] Missing locale template registration for "${code}"`);
        }
    }
}
