import { expect } from 'chai';

import {
    getLocalizedMonth,
    getLocalizedWeekdayShort,
    getLocalizedDayMonth,
    formatLocalizedTime,
    formatLocalizedTimeRange,
    formatLocalizedDate,
    formatLocalizedDateInterval,
    getISOWeek,
    WEEK_NUMBERING_POLICY,
} from '../../../src/lib/localization.js';

describe('localization', () => {
    it('canonicalizes aliases and safely falls back for malformed locale tags', () => {
        expect(formatLocalizedDate(1, 5, 2026, 'DE-at')).to.equal(
            formatLocalizedDate(1, 5, 2026, 'de-AT'),
        );
        for (const locale of ['__proto__', 'constructor', 'not_a_tag', '']) {
            expect(formatLocalizedDate(1, 5, 2026, locale)).to.equal(
                formatLocalizedDate(1, 5, 2026, 'en'),
            );
        }
    });
    it('shares a full-date formatter with intervals without mixing number systems', () => {
        const DateTimeFormat = Intl.DateTimeFormat;
        let allocations = 0;
        Intl.DateTimeFormat = new Proxy(DateTimeFormat, {
            construct(target, args) {
                allocations++;
                return Reflect.construct(target, args);
            },
        });
        try {
            const date = { day: 17, month: 11, year: 2026 };
            const arabic = formatLocalizedDate(17, 11, 2026, 'EN-gb-u-nu-arab');
            expect(arabic).to.include('١٧');
            expect(formatLocalizedDateInterval(date, date, 'en-GB-u-nu-arab')).to.equal(
                `\u2068${arabic}\u2069`,
            );
            const latin = formatLocalizedDate(17, 11, 2026, 'en-GB-u-nu-latn');
            expect(latin).to.include('17');
            expect(allocations).to.equal(2);
        } finally {
            Intl.DateTimeFormat = DateTimeFormat;
        }
    });
    it('uses civil-date carriers independent of ambient timezone and preserves years below 100', () => {
        const oldTZ = process.env.TZ;
        try {
            process.env.TZ = 'Pacific/Apia';
            expect(formatLocalizedDate(30, 12, 2011, 'en-US')).to.equal('Dec 30, 2011');
            expect(formatLocalizedDate(1, 1, 42, 'en-US')).to.equal('Jan 1, 42');
            expect(getLocalizedDayMonth(30, 12, 2011, 'en-US')).to.equal('Dec 30');
        } finally {
            if (oldTZ === undefined) delete process.env.TZ;
            else process.env.TZ = oldTZ;
        }
    });
    it('rejects impossible civil dates and wall times', () => {
        expect(() => formatLocalizedDate(30, 2, 2026)).to.throw(RangeError);
        expect(() => formatLocalizedTime(25, 0)).to.throw(RangeError);
        expect(() => formatLocalizedTime(24, 1)).to.throw(RangeError);
    });
    it('declares ISO week numbering separately from Sunday/Saturday/Monday display starts', () => {
        expect(WEEK_NUMBERING_POLICY).to.equal('iso8601');
        expect(getISOWeek(1, 1, 2021)).to.deep.equal({ weekNumber: 53, weekYear: 2020 });
        expect(getISOWeek(4, 1, 2021)).to.deep.equal({ weekNumber: 1, weekYear: 2021 });
        expect(getISOWeek(31, 12, 2025)).to.deep.equal({ weekNumber: 1, weekYear: 2026 });
    });
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

    describe('formatLocalizedTime', () => {
        it('should format time for English locale (12h)', () => {
            const result = formatLocalizedTime(15, 30, 'en');
            expect(result).to.be.a('string').and.not.be.empty;
            // English uses AM/PM notation
            expect(result).to.match(/3:30\s*PM/i);
        });

        it('should format time for German locale (24h)', () => {
            const result = formatLocalizedTime(15, 30, 'de');
            expect(result).to.be.a('string').and.not.be.empty;
            // German uses 24-hour notation
            expect(result).to.include('15:30');
        });

        it('should format midnight (0:00)', () => {
            const result = formatLocalizedTime(0, 0, 'en');
            expect(result).to.be.a('string').and.not.be.empty;
        });

        it('should handle zh-Hans locale', () => {
            const result = formatLocalizedTime(9, 0, 'zh-Hans');
            expect(result).to.be.a('string').and.not.be.empty;
        });
    });

    describe('formatLocalizedTimeRange', () => {
        it('should produce a range with en-dash separator', () => {
            const result = formatLocalizedTimeRange(9, 0, 17, 0, 'en');
            expect(result).to.be.a('string');
            expect(result).to.include('\u2013'); // en-dash
        });

        it('should include both start and end times', () => {
            const result = formatLocalizedTimeRange(9, 30, 11, 45, 'de');
            expect(result).to.include('9:30');
            expect(result).to.include('11:45');
        });
    });

    describe('formatLocalizedDate', () => {
        it('should format date for English locale', () => {
            const result = formatLocalizedDate(15, 6, 2026, 'en');
            expect(result).to.be.a('string');
            expect(result).to.include('15');
            expect(result).to.include('2026');
        });

        it('should format date for German locale', () => {
            const result = formatLocalizedDate(1, 2, 2026, 'de');
            expect(result).to.be.a('string');
            expect(result).to.include('1');
            expect(result).to.include('2026');
        });

        it('should handle zh-Hans locale', () => {
            const result = formatLocalizedDate(15, 6, 2026, 'zh-Hans');
            expect(result).to.be.a('string').and.not.be.empty;
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
