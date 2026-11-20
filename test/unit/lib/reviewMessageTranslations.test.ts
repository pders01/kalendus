import { readFile } from 'node:fs/promises';

import { expect } from 'chai';

import { ensureLocale, getMessageFormatters, getMessages } from '../../../src/lib/messages.js';

describe('Review-correction complete locale messages', () => {
    const locales = [
        'ar',
        'bn',
        'cs',
        'da',
        'de',
        'de-DE',
        'el',
        'es',
        'fi',
        'fr',
        'he',
        'hi',
        'id',
        'it',
        'ja',
        'ko',
        'nb',
        'nl',
        'pl',
        'pt',
        'ru',
        'sv',
        'th',
        'tr',
        'uk',
        'vi',
        'zh-Hans',
    ];
    for (const locale of locales) {
        it(`renders catalog counts and all four contextual Agenda actions in ${locale}`, async () => {
            const catalog = JSON.parse(
                await readFile(
                    new URL(`../../../src/locales/catalogs/${locale}.json`, import.meta.url),
                    'utf8',
                ),
            ) as Record<string, string>;
            await ensureLocale(locale);
            const f = getMessageFormatters(locale);
            const number = new Intl.NumberFormat(locale);
            const plural = new Intl.PluralRules(locale);
            for (const count of [0, 1, 2, 5, 12, 100, 1234]) {
                const category = plural.select(count);
                const rendered = number.format(count);
                const eventCount = f.eventCount(count);
                const moreEvents = f.moreEvents(count);
                expect(eventCount, `event count ${count}`).to.include(rendered);
                expect(moreEvents, `overflow count ${count}`).to.include(rendered);
                expect(eventCount).to.equal(
                    catalog[`eventCount_${category}`].replace('{count}', rendered),
                );
                expect(moreEvents).to.equal(
                    catalog[`moreCount_${category}`].replace('{count}', rendered),
                );
            }
            const actions = {
                A: f.agendaAction(false, true),
                F: f.agendaAction(true, true),
                S: f.agendaAction(false, false),
                H: f.agendaAction(true, false),
            };
            for (const [id, actual] of Object.entries(actions)) {
                expect(actual.trim(), `empty Agenda action ${id}`).not.to.equal('');
                expect(actual, `Agenda action ${id}`).to.equal(catalog[id]);
            }
            expect(f.switchToDayView('DATE')).to.include('DATE').and.not.to.include('Switch to');
            expect(f.dateSummary('DATE', 2)).to.include('DATE').and.not.to.include('Open day view');
            expect(getMessages(locale).allDayEventsWeek).not.to.equal(
                'All-day events for this week',
            );
        });
    }
    it('retains distinct integer plural forms for Czech and Ukrainian', async () => {
        for (const locale of ['cs', 'uk']) {
            await ensureLocale(locale);
            const f = getMessageFormatters(locale);
            const words = [1, 2, 5].map((n) => f.eventCount(n).replace(/\p{Number}/gu, ''));
            expect(new Set(words).size).to.equal(3);
        }
    });
});
