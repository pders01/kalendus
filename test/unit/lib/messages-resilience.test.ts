import { expect } from 'chai';

import {
    createLocaleResolver,
    ensureLocale,
    getMessages,
    getMessageFormatters,
    isLocaleLoaded,
    loadLocale,
    normalizeLocale,
    resolveLocale,
    _resetForTesting,
    type TemplateModule,
} from '../../../src/lib/messages.js';

const german = { templates: { se0955919920ee87d: 'Tag' } };
describe('locale identity, completion and isolation', () => {
    beforeEach(_resetForTesting);
    it('invalidates a primed alias when its base is loaded', async () => {
        expect(getMessages('de-AT').day).to.equal('Day');
        await ensureLocale('de');
        await ensureLocale('de-AT');
        expect(getMessages('de-AT').day).to.equal('Tag');
        expect(getMessages('DE-at')).to.equal(getMessages('de'));
    });
    for (const locale of [
        'en',
        'en-US',
        'EN-gb',
        'en-Latn-US',
        'xx-YY',
        '__proto__',
        'constructor',
        'not_a_tag',
        '',
    ]) {
        it(`settles early/late readiness for ${JSON.stringify(locale)}`, async () => {
            const result = await loadLocale(locale);
            expect(isLocaleLoaded(locale)).to.equal(true);
            expect(result.catalogLocale).to.equal('en');
            await ensureLocale(locale);
            expect(getMessages(locale).day).to.equal('Day');
        });
    }
    it('handles script/region/case aliases without changing formatting identities', async () => {
        expect(normalizeLocale('DE-at')).to.equal('de-AT');
        expect(resolveLocale('de-Latn-AT').catalogLocale).to.equal('de');
        expect(resolveLocale('zh-CN').catalogLocale).to.equal('zh-Hans');
        expect(resolveLocale('zh-SG').catalogLocale).to.equal('zh-Hans');
        expect(resolveLocale('zh-TW').catalogLocale).to.equal('en');
        const result = await loadLocale('de-AT');
        expect(result).to.deep.equal({
            requestedLocale: 'de-AT',
            locale: 'de-AT',
            catalogLocale: 'de',
            fallback: false,
        });
    });
    it('deduplicates aliases/base and shares a settling promise', async () => {
        let calls = 0;
        let finish!: (value: TemplateModule) => void;
        const resolver = createLocaleResolver({
            de: () => {
                calls++;
                return new Promise((resolve) => {
                    finish = resolve;
                });
            },
        });
        const a = resolver.ensureLocale('de-AT');
        const b = resolver.ensureLocale('de-DE');
        expect(a).to.equal(b);
        await Promise.resolve();
        expect(calls).to.equal(1);
        finish(german);
        await Promise.all([a, b]);
        expect(resolver.getMessages('de-AT').day).to.equal('Tag');
    });
    it('evicts rejected and synchronously throwing imports so the same locale can retry', async () => {
        for (const sync of [false, true]) {
            let attempts = 0;
            const resolver = createLocaleResolver({
                de: () => {
                    if (++attempts === 1) {
                        if (sync) throw new Error('chunk failure');
                        return Promise.reject(new Error('chunk failure'));
                    }
                    return Promise.resolve(german);
                },
            });
            try {
                await resolver.ensureLocale('de-AT');
                throw new Error('should reject');
            } catch (error) {
                expect((error as Error).message).to.equal('chunk failure');
            }
            expect(resolver.isLocaleLoaded('de')).to.equal(false);
            expect(resolver.getMessages('de').day).to.equal('Day');
            await resolver.ensureLocale('de');
            expect(resolver.getMessages('de-AT').day).to.equal('Tag');
            expect(attempts).to.equal(2);
        }
    });
    it('concurrent independent consumers do not mutate a global active locale', async () => {
        await Promise.all([
            ensureLocale('de-AT'),
            ensureLocale('fr'),
            ensureLocale('ar'),
            ensureLocale('en-US'),
        ]);
        expect(getMessages('de-AT').day).to.equal('Tag');
        expect(getMessages('fr').day).to.equal('Jour');
        expect(getMessages('ar').day).not.to.equal('Day');
        expect(getMessages('en-US').day).to.equal('Day');
    });
    it('does not let a reset publish an obsolete load', async () => {
        let finish!: (value: TemplateModule) => void;
        const resolver = createLocaleResolver({
            de: () =>
                new Promise((resolve) => {
                    finish = resolve;
                }),
        });
        const pending = resolver.ensureLocale('de');
        await Promise.resolve();
        resolver.reset();
        finish(german);
        await pending;
        expect(resolver.isLocaleLoaded('de')).to.equal(false);
    });
});

describe('complete parameterized messages', () => {
    beforeEach(_resetForTesting);
    const forms: Record<string, string[]> = {
        en: ['events', 'event', 'events', 'events', 'events', 'events'],
        ru: ['событий', 'событие', 'события', 'событий', 'событий', 'событие'],
        pl: ['wydarzeń', 'wydarzenie', 'wydarzenia', 'wydarzeń', 'wydarzeń', 'wydarzeń'],
        ar: ['أحداث', 'حدث', 'حدثان', 'أحداث', 'حدثًا', 'حدثًا'],
    };
    for (const locale of Object.keys(forms)) {
        it(`formats plural categories 0/1/2/5/11/21 in ${locale}`, async () => {
            await ensureLocale(locale);
            const formatter = getMessageFormatters(locale);
            [0, 1, 2, 5, 11, 21].forEach((count, i) => {
                expect(formatter.eventCount(count)).to.equal(
                    `${new Intl.NumberFormat(locale).format(count)} ${forms[locale][i]}`,
                );
            });
        });
    }
    it('distinguishes list expansion actions and retains count validation', () => {
        const formatter = getMessageFormatters('en');
        expect(formatter.agendaAction(false, true)).to.equal('Show all');
        expect(formatter.agendaAction(true, true)).to.equal('Show fewer');
        expect(formatter.agendaAction(false, false)).to.equal('Show events');
        expect(formatter.agendaAction(true, false)).to.equal('Hide events');
        expect(() => formatter.eventCount(-1)).to.throw(RangeError);
        expect(() => formatter.eventCount(1.5)).to.throw(RangeError);
    });
    it('provides additive full action/date/week/view/entry labels', async () => {
        await ensureLocale('de-AT');
        const messages = getMessageFormatters('de-AT');
        expect(messages.eventCount(1)).to.equal('1 Termin');
        expect(messages.moreEvents(1)).to.equal('1 weiterer Termin');
        expect(messages.switchToDayView('1. Mai')).to.equal('Zur Tagesansicht für 1. Mai wechseln');
        expect(messages.showWeek(1)).to.equal('Woche 1 anzeigen');
        expect(messages.viewLabel('Monat')).to.equal('Ansicht: Monat');
        expect(messages.eventLabel('Planning', '1. Mai', '09:00')).to.equal(
            'Planning: 1. Mai, 09:00',
        );
        expect(messages.dateSummary('1. Mai', 2)).to.equal(
            '1. Mai: 2 Termine. Tagesansicht öffnen',
        );
        expect(messages.timeRange('09:00', '10:00')).to.equal('09:00 – 10:00');
        expect(getMessages('de').events).to.equal('Termine'); // legacy field retained
        expect(() => messages.eventCount(-1)).to.throw(RangeError);
        expect(() => messages.eventCount(1.5)).to.throw(RangeError);
    });
});
