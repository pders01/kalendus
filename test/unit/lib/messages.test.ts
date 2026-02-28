import { expect } from 'chai';
import { getMessages, type MessageKey } from '../../../src/lib/messages.js';

const ALL_KEYS: MessageKey[] = [
    'day', 'week', 'month', 'currentMonth', 'allDay',
    'today', 'noTitle', 'noContent', 'noTime',
    'eventDetails', 'exportAsICS', 'title', 'time',
    'date', 'notes', 'close', 'calendarWeek',
];

describe('getMessages', () => {
    describe('English fallbacks', () => {
        it('should return English fallbacks for all 17 keys', () => {
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
        });
    });

    describe('German translations', () => {
        it('should return German translations for de locale', () => {
            const msg = getMessages('de');
            expect(msg.day).to.equal('Tag');
            expect(msg.week).to.equal('Woche');
            expect(msg.month).to.equal('Monat');
            expect(msg.currentMonth).to.equal('Aktueller Monat');
            expect(msg.allDay).to.equal('Ganztägig');
            expect(msg.today).to.equal('Heute');
            expect(msg.calendarWeek).to.equal('KW');
        });
    });

    describe('Language-only fallback', () => {
        it('should fall back from de-AT to de templates', () => {
            const msg = getMessages('de-AT');
            // de-AT is not a registered locale, so it should fall back to de
            expect(msg.day).to.equal('Tag');
            expect(msg.today).to.equal('Heute');
        });

        it('should fall back to English for unknown locale', () => {
            const msg = getMessages('xx-YY');
            expect(msg.day).to.equal('Day');
            expect(msg.today).to.equal('Today');
        });
    });

    describe('Caching', () => {
        it('should return the same reference for repeated calls', () => {
            const a = getMessages('fr');
            const b = getMessages('fr');
            expect(a).to.equal(b);
        });

        it('should return different objects for different locales', () => {
            const en = getMessages('en');
            const de = getMessages('de');
            expect(en).to.not.equal(de);
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
});
