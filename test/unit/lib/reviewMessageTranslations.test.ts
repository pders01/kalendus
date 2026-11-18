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
        it(`does not leave post-preservation English seeds in ${locale} contextual UI`, async () => {
            await ensureLocale(locale);
            const f = getMessageFormatters(locale);
            for (const count of [0, 1, 2, 5, 12, 100]) {
                expect(f.eventCount(count)).not.to.match(/\bevents?\b/);
                expect(f.moreEvents(count)).not.to.match(/\bmore\b|\bevents?\b/);
                expect(f.eventCount(count)).not.to.include('{count}');
                for (const preview of [false, true])
                    for (const expanded of [false, true])
                        expect(f.agendaAction(expanded, preview)).not.to.match(
                            /Show all|Show fewer|Show events|Hide events|\{\w+\}/,
                        );
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
