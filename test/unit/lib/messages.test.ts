import { expect } from 'chai';
import { getMessages, ensureLocale, isLocaleLoaded, _resetForTesting, type MessageKey } from '../../../src/lib/messages.js';

const ALL_KEYS: MessageKey[] = [
    'day', 'week', 'month', 'currentMonth', 'allDay',
    'today', 'noTitle', 'noContent', 'noTime',
    'eventDetails', 'exportAsICS', 'title', 'time',
    'date', 'notes', 'close', 'calendarWeek', 'year',
    'previous', 'next', 'events',
    'calendarEvent', 'pressToOpen', 'to', 'switchToDayView',
    'showEarlierDays', 'showLaterDays', 'more', 'calendarView', 'viewLabel',
    'allDayEventsWeek',
];

describe('getMessages', () => {
    beforeEach(() => {
        _resetForTesting();
    });

    describe('English fallbacks', () => {
        it('should return English fallbacks for all 30 keys', () => {
            const msg = getMessages('en');
            expect(Object.keys(msg)).to.have.lengthOf(ALL_KEYS.length);
            for (const key of ALL_KEYS) {
                expect(msg[key]).to.be.a('string').and.not.be.empty;
            }
        });

        it('should return known English values', () => {
            const msg = getMessages('en');
            expect(msg.day).to.equal('Day');
            expect(msg.week).to.equal('Week');
            expect(msg.month).to.equal('Month');
            expect(msg.currentMonth).to.equal('Current Month');
            expect(msg.allDay).to.equal('All Day');
            expect(msg.today).to.equal('Today');
            expect(msg.calendarWeek).to.equal('CW');
            expect(msg.year).to.equal('Year');
        });

        it('should return known English values for new keys', () => {
            const msg = getMessages('en');
            expect(msg.calendarEvent).to.equal('Calendar event');
            expect(msg.pressToOpen).to.equal('Press Enter or Space to open details');
            expect(msg.to).to.equal('to');
            expect(msg.switchToDayView).to.equal('Switch to day view for');
            expect(msg.showEarlierDays).to.equal('Show earlier days');
            expect(msg.showLaterDays).to.equal('Show later days');
            expect(msg.more).to.equal('more');
            expect(msg.calendarView).to.equal('Calendar view');
            expect(msg.viewLabel).to.equal('view');
        });
    });

    describe('German translations (async)', () => {
        it('should return English fallbacks before ensureLocale resolves', () => {
            const msg = getMessages('de');
            // Before loading, should fall back to English
            expect(msg.day).to.equal('Day');
        });

        it('should return German translations after ensureLocale', async () => {
            await ensureLocale('de');
            const msg = getMessages('de');
            expect(msg.day).to.equal('Tag');
            expect(msg.week).to.equal('Woche');
            expect(msg.month).to.equal('Monat');
            expect(msg.currentMonth).to.equal('Aktueller Monat');
            expect(msg.allDay).to.equal('Ganztägig');
            expect(msg.today).to.equal('Heute');
            expect(msg.calendarWeek).to.equal('KW');
            expect(msg.year).to.equal('Jahr');
        });

        it('should return German translations for new keys', async () => {
            await ensureLocale('de');
            const msg = getMessages('de');
            expect(msg.calendarEvent).to.equal('Kalenderereignis');
            expect(msg.to).to.equal('bis');
            expect(msg.more).to.equal('mehr');
            expect(msg.calendarView).to.equal('Kalenderansicht');
            expect(msg.viewLabel).to.equal('Ansicht');
        });
    });

    describe('Language-only fallback', () => {
        it('should fall back from de-AT to de templates', async () => {
            await ensureLocale('de-AT');
            const msg = getMessages('de-AT');
            // de-AT is not a registered locale, so it should fall back to de
            expect(msg.day).to.equal('Tag');
            expect(msg.today).to.equal('Heute');
        });

        it('should fall back to English for unknown locale', async () => {
            await ensureLocale('xx-YY');
            const msg = getMessages('xx-YY');
            expect(msg.day).to.equal('Day');
            expect(msg.today).to.equal('Today');
        });
    });

    describe('ensureLocale', () => {
        it('should resolve immediately for English', async () => {
            await ensureLocale('en');
            // No error — English needs no loading
        });

        it('should be idempotent (calling twice does not break)', async () => {
            await ensureLocale('fr');
            await ensureLocale('fr');
            const msg = getMessages('fr');
            expect(msg.day).to.not.equal('Day'); // Should be French
        });

        it('should deduplicate concurrent loads for the same locale', async () => {
            const p1 = ensureLocale('ja');
            const p2 = ensureLocale('ja');
            await Promise.all([p1, p2]);
            const msg = getMessages('ja');
            expect(msg).to.be.an('object');
        });
    });

    describe('Caching', () => {
        it('should return the same reference for repeated synchronous calls', async () => {
            await ensureLocale('fr');
            const a = getMessages('fr');
            const b = getMessages('fr');
            expect(a).to.equal(b);
        });

        it('should return different objects for different locales', () => {
            const en = getMessages('en');
            const unknown = getMessages('zz');
            // Both English fallback, but different cache entries
            expect(en).to.not.equal(unknown);
        });
    });

    describe('Immutability', () => {
        it('should return a frozen object', () => {
            const msg = getMessages('en');
            expect(Object.isFrozen(msg)).to.be.true;
        });
    });

    describe('All MessageKey properties', () => {
        it('should have all expected keys and only string values', () => {
            const msg = getMessages('en');
            for (const key of ALL_KEYS) {
                expect(msg).to.have.property(key);
                expect(msg[key]).to.be.a('string');
            }
        });
    });

    describe('isLocaleLoaded', () => {
        it('should return true for English (built-in)', () => {
            expect(isLocaleLoaded('en')).to.be.true;
        });

        it('should return false for an unloaded locale', () => {
            expect(isLocaleLoaded('de')).to.be.false;
        });

        it('should return true after ensureLocale resolves', async () => {
            expect(isLocaleLoaded('fr')).to.be.false;
            await ensureLocale('fr');
            expect(isLocaleLoaded('fr')).to.be.true;
        });

        it('should return true for language-only fallback (de-AT → de)', async () => {
            await ensureLocale('de');
            expect(isLocaleLoaded('de-AT')).to.be.true;
        });

        it('should return false for unknown locale', () => {
            expect(isLocaleLoaded('xx-YY')).to.be.false;
        });
    });
});
