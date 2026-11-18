import { expect } from 'chai';

import {
    computeWeekDisplayContext,
    type WeekDisplayContext,
} from '../../../src/lib/weekDisplayContext.js';

const activeDate: CalendarDate = { year: 2026, month: 2, day: 18 };

/** Keep the pure geometry tests independent of a real DOM or viewport. */
function withHost(tokens: Record<string, string>, check: (host: Element) => void) {
    const host = {} as Element;
    const original = globalThis.getComputedStyle;
    globalThis.getComputedStyle = ((target: Element) =>
        target === host
            ? ({
                  fontSize: tokens['font-size'] ?? '16px',
                  getPropertyValue: (property: string) => tokens[property] ?? '',
              } as CSSStyleDeclaration)
            : original(target)) as typeof getComputedStyle;
    try {
        check(host);
    } finally {
        globalThis.getComputedStyle = original;
    }
}

function context(host: Element, width: number, date = activeDate, firstDay: 0 | 1 | 6 = 1) {
    return computeWeekDisplayContext(date, firstDay, width, host);
}

function assertWindow(result: WeekDisplayContext, count: number, start: number) {
    expect(result.weekDates).to.have.length(7);
    expect(result.visibleLength).to.equal(count);
    expect(result.visibleStartIndex).to.equal(start);
    expect(result.isCondensed).to.equal(count < 7);
    expect(result.visibleDates).to.deep.equal(result.weekDates.slice(start, start + count));
    expect(result.gridColumns).to.equal(`var(--time-column-width) repeat(${count}, 1fr)`);
}

describe('weekDisplayContext', () => {
    it('retains all seven days when the actual embed has room', () => {
        withHost({}, (host) => assertWindow(context(host, 1024), 7, 0));
    });

    it('uses the old breakpoint as a maximum, not permission to crush seven columns', () => {
        withHost({}, (host) => assertWindow(context(host, 768), 5, 0));
    });

    it('centers the readable two-day window on the active date', () => {
        withHost({}, (host) => assertWindow(context(host, 400), 2, 2));
    });

    it('clamps the window at the start of the same week', () => {
        withHost({}, (host) =>
            assertWindow(context(host, 400, { year: 2026, month: 2, day: 16 }), 2, 0),
        );
    });

    it('clamps the window at the end of the same week', () => {
        withHost({}, (host) =>
            assertWindow(context(host, 400, { year: 2026, month: 2, day: 22 }), 2, 5),
        );
    });

    it('retains the full seven-day domain in a one-day narrow window', () => {
        withHost({}, (host) => {
            const result = context(host, 288);
            assertWindow(result, 1, 2);
            expect(result.visibleDates[0]).to.deep.equal(activeDate);
        });
    });

    it('respects the full-width count as a maximum', () => {
        withHost({ '--week-day-count': '5' }, (host) => assertWindow(context(host, 1024), 5, 0));
    });

    it('respects the configured mobile count', () => {
        withHost({ '--week-mobile-day-count': '2' }, (host) =>
            assertWindow(context(host, 400), 2, 2),
        );
    });

    it('does not let a custom breakpoint override the readable column floor', () => {
        withHost({ '--week-mobile-breakpoint': '500px' }, (host) =>
            assertWindow(context(host, 600), 4, 1),
        );
    });

    it('can explicitly request a one-day window below a custom breakpoint', () => {
        withHost(
            { '--week-mobile-breakpoint': '500px', '--week-mobile-day-count': '1' },
            (host) => {
                const result = context(host, 400);
                assertWindow(result, 1, 2);
                expect(result.visibleDates[0]).to.deep.equal(activeDate);
            },
        );
    });

    it('does not silently truncate fractional/garbage counts or reinterpret an em breakpoint as pixels', () => {
        withHost(
            {
                '--week-day-count': '2.5',
                '--week-mobile-day-count': '2oops',
                '--week-mobile-breakpoint': '50em',
            },
            (host) => {
                assertWindow(context(host, 1024), 7, 0);
                assertWindow(context(host, 400), 2, 2);
            },
        );
    });

    it('accepts finite fractional pixel breakpoints independently of the optional width floor', () => {
        withHost(
            {
                '--week-mobile-breakpoint': '500.5px',
                '--week-mobile-day-count': 'Infinity',
                '--week-min-day-width': '0',
            },
            (host) => {
                assertWindow(context(host, 500.25), 3, 1);
                assertWindow(context(host, 500.75), 7, 0);
            },
        );
    });

    it('clamps a zero day count to one', () => {
        withHost({ '--week-mobile-day-count': '0' }, (host) =>
            assertWindow(context(host, 400), 1, 2),
        );
    });

    it('clamps an excessive day count to seven', () => {
        withHost({ '--week-day-count': '10' }, (host) => assertWindow(context(host, 1024), 7, 0));
    });

    it('clamps a negative day count to one', () => {
        withHost({ '--week-mobile-day-count': '-3' }, (host) =>
            assertWindow(context(host, 400), 1, 2),
        );
    });

    it('preserves a Sunday-first domain and centers its readable subset', () => {
        withHost({}, (host) => assertWindow(context(host, 400, activeDate, 0), 2, 3));
    });

    it('preserves a Saturday-first domain and centers its readable subset', () => {
        withHost({}, (host) => assertWindow(context(host, 400, activeDate, 6), 2, 4));
    });

    it('produces the explicit five-day grid when requested and readable', () => {
        withHost({ '--week-day-count': '5' }, (host) => assertWindow(context(host, 1024), 5, 0));
    });

    it('reduces the visible count for enlarged text without changing the week domain', () => {
        withHost({ 'font-size': '32px' }, (host) => assertWindow(context(host, 1024), 3, 1));
    });

    it('accounts for the configured time column as well as the day columns', () => {
        withHost({ '--time-column-width': '160px' }, (host) =>
            assertWindow(context(host, 1024), 6, 0),
        );
    });

    it('supports explicit pixel and font-relative em minimums', () => {
        withHost({ '--week-min-day-width': '200px' }, (host) =>
            assertWindow(context(host, 1024), 4, 1),
        );
        withHost({ '--week-min-day-width': '10em' }, (host) =>
            assertWindow(context(host, 1024), 6, 0),
        );
    });

    it('falls back safely for malformed minimum lengths', () => {
        for (const minimum of ['-20px', '2oops', 'Infinity', '20vw']) {
            withHost({ '--week-min-day-width': minimum }, (host) =>
                assertWindow(context(host, 400), 2, 2),
            );
        }
    });

    it('provides an explicit legacy fixed-count styling escape hatch', () => {
        withHost({ '--week-min-day-width': '0' }, (host) => {
            assertWindow(context(host, 400), 3, 1);
            assertWindow(context(host, 768), 7, 0);
        });
    });
});
