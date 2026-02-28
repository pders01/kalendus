import { templates as arTemplates } from '../generated/locales/ar.js';
import { templates as bnTemplates } from '../generated/locales/bn.js';
import { templates as deTemplates } from '../generated/locales/de.js';
import { templates as deDETemplates } from '../generated/locales/de-DE.js';
import { templates as esTemplates } from '../generated/locales/es.js';
import { templates as frTemplates } from '../generated/locales/fr.js';
import { templates as hiTemplates } from '../generated/locales/hi.js';
import { templates as idTemplates } from '../generated/locales/id.js';
import { templates as itTemplates } from '../generated/locales/it.js';
import { templates as jaTemplates } from '../generated/locales/ja.js';
import { templates as koTemplates } from '../generated/locales/ko.js';
import { templates as nlTemplates } from '../generated/locales/nl.js';
import { templates as plTemplates } from '../generated/locales/pl.js';
import { templates as ptTemplates } from '../generated/locales/pt.js';
import { templates as ruTemplates } from '../generated/locales/ru.js';
import { templates as thTemplates } from '../generated/locales/th.js';
import { templates as trTemplates } from '../generated/locales/tr.js';
import { templates as ukTemplates } from '../generated/locales/uk.js';
import { templates as viTemplates } from '../generated/locales/vi.js';
import { templates as zhHansTemplates } from '../generated/locales/zh-Hans.js';

const allTemplates: Record<string, Record<string, string>> = {
    ar: arTemplates,
    bn: bnTemplates,
    de: deTemplates,
    'de-DE': deDETemplates,
    es: esTemplates,
    fr: frTemplates,
    hi: hiTemplates,
    id: idTemplates,
    it: itTemplates,
    ja: jaTemplates,
    ko: koTemplates,
    nl: nlTemplates,
    pl: plTemplates,
    pt: ptTemplates,
    ru: ruTemplates,
    th: thTemplates,
    tr: trTemplates,
    uk: ukTemplates,
    vi: viTemplates,
    'zh-Hans': zhHansTemplates,
};

function resolveMsg(locale: string, hashId: string, fallback: string): string {
    if (locale === 'en') return fallback;
    // Try exact match, then language-only fallback
    const templates = allTemplates[locale] ?? allTemplates[locale.split('-')[0]];
    return templates?.[hashId] ?? fallback;
}

// UI strings that aren't date/time related
export const messages = {
    day: (locale = 'en') => resolveMsg(locale, 'se0955919920ee87d', 'Day'),
    week: (locale = 'en') => resolveMsg(locale, 's680f01021b5e339d', 'Week'),
    month: (locale = 'en') => resolveMsg(locale, 'sb47daaf9e1c4a905', 'Month'),
    currentMonth: (locale = 'en') => resolveMsg(locale, 's15ba5784a11e0b88', 'Current Month'),
    allDay: (locale = 'en') => resolveMsg(locale, 's58ab939b42a026a6', 'All Day'),
    today: (locale = 'en') => resolveMsg(locale, 's63d040e37887f17e', 'Today'),
    noTitle: (locale = 'en') => resolveMsg(locale, 's98b32ef4a0856c08', 'No Title'),
    noContent: (locale = 'en') => resolveMsg(locale, 's22380c7fc798a44f', 'No Content'),
    noTime: (locale = 'en') => resolveMsg(locale, 'sfce4bfbe0f911aa7', 'No Time'),
    eventDetails: (locale = 'en') => resolveMsg(locale, 'sa0fd990c985f24bd', 'Event Details'),
    exportAsICS: (locale = 'en') => resolveMsg(locale, 's2bc4d1196bce49dc', 'Export as ICS'),
    title: (locale = 'en') => resolveMsg(locale, 's99f110d27e30b289', 'Title'),
    time: (locale = 'en') => resolveMsg(locale, 's48e186fb300e5464', 'Time'),
    date: (locale = 'en') => resolveMsg(locale, 'sac8252732f2edb19', 'Date'),
    notes: (locale = 'en') => resolveMsg(locale, 's005053d82b712e0a', 'Notes'),
    close: (locale = 'en') => resolveMsg(locale, 's5e8250fb85d64c23', 'Close'),
    calendarWeek: (locale = 'en') => resolveMsg(locale, 's090f2107b5a69a7f', 'CW'),
} as const;
