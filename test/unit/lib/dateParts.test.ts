import { expect } from 'chai';

import { getLocalizedDayMonth, getLocalizedDayMonthParts } from '../../../src/lib/localization.js';

describe('Structured calendar boundary dates', () => {
    for (const locale of [
        'en',
        'de',
        'ar',
        'ja',
        'zh-Hans',
        'he',
        'th',
        'th-u-ca-buddhist',
        'bn',
    ]) {
        it(`preserves the complete locale-specific day/month ordering for ${locale}`, () => {
            const parts = getLocalizedDayMonthParts(1, 6, 2026, locale);
            expect(parts.map((part) => part.value).join('')).to.equal(
                getLocalizedDayMonth(1, 6, 2026, locale),
            );
            expect(parts.filter((part) => part.type === 'day')).to.have.length(1);
            expect(parts.filter((part) => part.type === 'month')).to.have.length(1);
        });
    }
    it('keeps day/month parts Gregorian even when a locale requests an Islamic calendar', () => {
        const date = new Date('2026-06-01T00:00:00Z');
        const expected = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
            calendar: 'gregory',
            timeZone: 'UTC',
            day: 'numeric',
            month: 'short',
        }).formatToParts(date);
        expect(getLocalizedDayMonthParts(1, 6, 2026, 'ar-SA-u-ca-islamic')).to.deep.equal(expected);
    });
    it('retains civil-date validation', () => {
        expect(() => getLocalizedDayMonthParts(31, 2, 2026)).to.throw(
            RangeError,
            'Invalid civil date',
        );
    });
});
