import { expect } from 'chai';
import {
    getLocalizedMonth,
    getLocalizedWeekdayShort,
    getLocalizedDayMonth,
} from '../../../src/lib/localization.js';

describe('localization', () => {
    describe('getLocalizedMonth', () => {
        it('should return abbreviated month names for English', () => {
            expect(getLocalizedMonth(1, 'en')).to.be.a('string').and.not.be.empty;
            expect(getLocalizedMonth(2, 'en')).to.include('Feb');
            expect(getLocalizedMonth(12, 'en')).to.include('Dec');
        });

        it('should return German month names', () => {
            const jan = getLocalizedMonth(1, 'de');
            expect(jan).to.be.a('string').and.not.be.empty;
            // German January is "Jan" or "Jan." depending on locale data
            expect(jan.toLowerCase()).to.include('jan');
        });

        it('should return Japanese month names', () => {
            const jan = getLocalizedMonth(1, 'ja');
            expect(jan).to.be.a('string').and.not.be.empty;
        });

        it('should return consistent results on repeated calls (caching)', () => {
            const first = getLocalizedMonth(3, 'en');
            const second = getLocalizedMonth(3, 'en');
            expect(first).to.equal(second);
        });

        it('should handle zh-Hans locale', () => {
            const month = getLocalizedMonth(1, 'zh-Hans');
            expect(month).to.be.a('string').and.not.be.empty;
        });
    });

    describe('getLocalizedWeekdayShort', () => {
        it('should return abbreviated weekday names for English', () => {
            // Luxon: 1=Monday
            const mon = getLocalizedWeekdayShort(1, 'en');
            expect(mon).to.be.a('string').and.not.be.empty;
            expect(mon.toLowerCase()).to.include('mon');
        });

        it('should return all 7 weekdays', () => {
            for (let i = 1; i <= 7; i++) {
                const name = getLocalizedWeekdayShort(i, 'en');
                expect(name).to.be.a('string').and.not.be.empty;
            }
        });

        it('should return German weekday names', () => {
            const mon = getLocalizedWeekdayShort(1, 'de');
            expect(mon).to.be.a('string').and.not.be.empty;
        });

        it('should return consistent results on repeated calls (caching)', () => {
            const first = getLocalizedWeekdayShort(5, 'fr');
            const second = getLocalizedWeekdayShort(5, 'fr');
            expect(first).to.equal(second);
        });
    });

    describe('getLocalizedDayMonth', () => {
        it('should format day and month for English', () => {
            const result = getLocalizedDayMonth(1, 2, 2026, 'en');
            expect(result).to.be.a('string');
            expect(result).to.include('1');
            expect(result).to.include('Feb');
        });

        it('should format day and month for German', () => {
            const result = getLocalizedDayMonth(1, 2, 2026, 'de');
            expect(result).to.be.a('string');
            expect(result).to.include('1');
        });

        it('should format day and month for Japanese', () => {
            const result = getLocalizedDayMonth(1, 2, 2026, 'ja');
            expect(result).to.be.a('string').and.not.be.empty;
        });

        it('should handle zh-Hans locale', () => {
            const result = getLocalizedDayMonth(15, 6, 2026, 'zh-Hans');
            expect(result).to.be.a('string').and.not.be.empty;
        });
    });
});
