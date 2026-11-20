import { expect } from 'chai';
import { DateTime } from 'luxon';

import {
    DISPLAY_CALENDAR,
    formatDateTime,
    formatLocalizedDate,
    formatLocalizedDateInterval,
    formatLocalizedMonthYear,
    formatLocalizedYear,
    getLocalizedDayMonth,
    getLocalizedMonth,
} from '../../../src/lib/localization.js';

const date = (year: number, month: number, day: number) => ({ year, month, day });
const plain = (text: string) => text.replace(/[\u2066-\u2069]/g, '').replace(/\s+/g, ' ');

describe('Gregorian localized calendar periods', () => {
    it('retains month units in standalone Japanese and Korean overview headings', () => {
        expect(getLocalizedMonth(1, 'ja')).to.equal('1月');
        expect(getLocalizedMonth(1, 'ko')).to.equal('1월');
        expect(getLocalizedMonth(12, 'ja')).to.equal('12月');
    });
    it('uses the Gregorian calendar even when Thai or an explicit extension requests another era', () => {
        expect(DISPLAY_CALENDAR).to.equal('gregory');
        for (const locale of ['th', 'th-u-ca-buddhist', 'ja-u-ca-japanese', 'ar-SA-u-ca-islamic']) {
            const carrier = new Date('2026-06-15T00:00:00Z');
            const expected = new Intl.DateTimeFormat(locale, {
                calendar: 'gregory',
                timeZone: 'UTC',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }).format(carrier);
            expect(formatLocalizedDate(15, 6, 2026, locale)).to.equal(expected);
            expect(formatDateTime(DateTime.utc(2026, 6, 15), 'yyyy', locale)).not.to.include(
                '2569',
            );
            expect(formatLocalizedMonthYear(6, 2026, locale)).not.to.include('2569');
            expect(formatLocalizedYear(2026, locale)).not.to.include('2569');
        }
        expect(formatLocalizedDateInterval(date(2026, 6, 15), date(2026, 6, 21), 'th')).to.include(
            '2026',
        );
        expect(getLocalizedDayMonth(15, 6, 2026, 'th-u-ca-buddhist')).to.equal(
            getLocalizedDayMonth(15, 6, 2026, 'th'),
        );
        expect(getLocalizedMonth(6, 'th-u-ca-buddhist')).to.equal(getLocalizedMonth(6, 'th'));
    });

    it('keeps complete Japanese year/month/day grammar and natural ordering', () => {
        expect(formatLocalizedDate(15, 6, 2026, 'ja')).to.equal('2026年6月15日');
        expect(formatLocalizedMonthYear(6, 2026, 'ja')).to.equal('2026年6月');
        expect(formatLocalizedYear(2026, 'ja')).to.equal('2026年');
        const interval = plain(
            formatLocalizedDateInterval(date(2026, 6, 15), date(2026, 6, 21), 'ja'),
        );
        const fields = (interval.match(/\d+/g) ?? []).map(Number);
        expect(fields.slice(0, 3)).to.deep.equal([2026, 6, 15]);
        expect(fields[fields.length - 1]).to.equal(21);
    });

    it('uses Bengali numerals throughout date and year labels', () => {
        for (const text of [
            formatLocalizedDate(15, 6, 2026, 'bn'),
            formatLocalizedMonthYear(6, 2026, 'bn'),
            formatLocalizedYear(2026, 'bn'),
            formatLocalizedDateInterval(date(2026, 6, 15), date(2026, 6, 21), 'bn'),
        ]) {
            expect(text).to.include('২০২৬');
            expect(text).not.to.match(/[0-9]/);
        }
    });

    it('elides shared fields within a month and year but keeps both years when crossing New Year', () => {
        const sameMonth = plain(
            formatLocalizedDateInterval(date(2026, 6, 15), date(2026, 6, 21), 'en'),
        );
        expect(sameMonth).to.equal('Jun 15 – 21, 2026');
        const crossMonth = plain(
            formatLocalizedDateInterval(date(2024, 9, 29), date(2024, 10, 5), 'en'),
        );
        expect(crossMonth).to.equal('Sep 29 – Oct 5, 2024');
        expect(crossMonth.match(/2024/g)).to.have.length(1);
        const crossYear = plain(
            formatLocalizedDateInterval(date(2026, 12, 28), date(2027, 1, 3), 'en'),
        );
        expect(crossYear).to.equal('Dec 28, 2026 – Jan 3, 2027');
    });

    it('preserves years 1–99 instead of applying Date.UTC twentieth-century coercion', () => {
        for (const year of [1, 9, 42, 99]) {
            expect(formatLocalizedDate(15, 6, year, 'en')).to.equal(`Jun 15, ${year}`);
            expect(formatLocalizedMonthYear(6, year, 'en')).to.equal(`Jun ${year}`);
            expect(formatLocalizedYear(year, 'en')).to.equal(String(year));
            const interval = plain(
                formatLocalizedDateInterval(date(year, 6, 15), date(year, 6, 21), 'en'),
            );
            expect(interval).to.include(String(year));
            expect(interval).not.to.include(String(1900 + year));
        }
    });

    it('validates both interval endpoints, ordering and single-date intervals', () => {
        expect(() => formatLocalizedDateInterval(date(2026, 2, 31), date(2026, 3, 1))).to.throw(
            RangeError,
        );
        expect(() => formatLocalizedDateInterval(date(2026, 2, 1), date(2026, 2, 31))).to.throw(
            RangeError,
        );
        expect(() => formatLocalizedDateInterval(date(2026, 3, 2), date(2026, 3, 1))).to.throw(
            RangeError,
        );
        expect(() => formatLocalizedMonthYear(13, 2026)).to.throw(RangeError);
        expect(plain(formatLocalizedDateInterval(date(2026, 6, 15), date(2026, 6, 15)))).to.equal(
            'Jun 15, 2026',
        );
    });
});
