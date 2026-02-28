import { expect } from 'chai';
import { computeWeekDisplayContext } from '../../../src/lib/weekDisplayContext.js';
import type { FirstDayOfWeek } from '../../../src/lib/weekStartHelper.js';

/**
 * Create a mock host element whose getComputedStyle returns the given CSS tokens.
 */
function mockHost(tokens: Record<string, string> = {}): Element {
    const el = {} as Element;
    // Patch globalThis.getComputedStyle to intercept calls for our mock element
    const originalGetComputedStyle = globalThis.getComputedStyle;
    globalThis.getComputedStyle = ((target: Element) => {
        if (target === el) {
            return {
                getPropertyValue(prop: string) {
                    return tokens[prop] ?? '';
                },
            } as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(target);
    }) as typeof globalThis.getComputedStyle;

    // Store cleanup function on the element for afterEach
    (el as Element & { _cleanup: () => void })._cleanup = () => {
        globalThis.getComputedStyle = originalGetComputedStyle;
    };

    return el;
}

function cleanup(el: Element) {
    (el as Element & { _cleanup: () => void })._cleanup?.();
}

describe('weekDisplayContext', () => {
    // Wednesday 2026-02-18, Monday-first week
    const activeDate: CalendarDate = { year: 2026, month: 2, day: 18 };
    const firstDayOfWeek: FirstDayOfWeek = 1;

    describe('default (full width)', () => {
        it('should return all 7 days when width >= breakpoint', () => {
            const host = mockHost();
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 1024, host);
                expect(ctx.isCondensed).to.be.false;
                expect(ctx.visibleLength).to.equal(7);
                expect(ctx.visibleDates).to.have.length(7);
                expect(ctx.visibleStartIndex).to.equal(0);
                expect(ctx.weekDates).to.deep.equal(ctx.visibleDates);
                expect(ctx.gridColumns).to.equal('var(--time-column-width) repeat(7, 1fr)');
            } finally {
                cleanup(host);
            }
        });

        it('should return all 7 days at exactly the breakpoint', () => {
            const host = mockHost();
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 768, host);
                expect(ctx.isCondensed).to.be.false;
                expect(ctx.visibleLength).to.equal(7);
            } finally {
                cleanup(host);
            }
        });
    });

    describe('condensed (narrow width)', () => {
        it('should return 3 days centered on active date by default', () => {
            const host = mockHost();
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 400, host);
                expect(ctx.isCondensed).to.be.true;
                expect(ctx.visibleLength).to.equal(3);
                expect(ctx.visibleDates).to.have.length(3);
                // Wed is index 2 in Mon-first week, centering 3 days: [Tue, Wed, Thu] → start=1
                expect(ctx.visibleStartIndex).to.equal(1);
                expect(ctx.gridColumns).to.equal('var(--time-column-width) repeat(3, 1fr)');
            } finally {
                cleanup(host);
            }
        });

        it('should clamp to start when active date is Monday (first day)', () => {
            const monday: CalendarDate = { year: 2026, month: 2, day: 16 };
            const host = mockHost();
            try {
                const ctx = computeWeekDisplayContext(monday, firstDayOfWeek, 400, host);
                expect(ctx.isCondensed).to.be.true;
                // Monday is index 0, centering 3 days: ideal start = -1 → clamped to 0
                expect(ctx.visibleStartIndex).to.equal(0);
                expect(ctx.visibleDates).to.have.length(3);
                expect(ctx.visibleDates[0].day).to.equal(16); // Monday
            } finally {
                cleanup(host);
            }
        });

        it('should clamp to end when active date is Sunday (last day)', () => {
            const sunday: CalendarDate = { year: 2026, month: 2, day: 22 };
            const host = mockHost();
            try {
                const ctx = computeWeekDisplayContext(sunday, firstDayOfWeek, 400, host);
                expect(ctx.isCondensed).to.be.true;
                // Sunday is index 6, centering 3 days: ideal start = 5 → clamped to 4 (7-3=4)
                expect(ctx.visibleStartIndex).to.equal(4);
                expect(ctx.visibleDates).to.have.length(3);
                expect(ctx.visibleDates[2].day).to.equal(22); // Sunday
            } finally {
                cleanup(host);
            }
        });
    });

    describe('custom CSS tokens', () => {
        it('should respect --week-day-count for full-width view', () => {
            const host = mockHost({ '--week-day-count': '5' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 1024, host);
                expect(ctx.isCondensed).to.be.true;
                expect(ctx.visibleLength).to.equal(5);
                expect(ctx.visibleDates).to.have.length(5);
            } finally {
                cleanup(host);
            }
        });

        it('should respect --week-mobile-day-count', () => {
            const host = mockHost({ '--week-mobile-day-count': '2' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 400, host);
                expect(ctx.isCondensed).to.be.true;
                expect(ctx.visibleLength).to.equal(2);
                expect(ctx.visibleDates).to.have.length(2);
            } finally {
                cleanup(host);
            }
        });

        it('should respect --week-mobile-breakpoint', () => {
            const host = mockHost({ '--week-mobile-breakpoint': '500px' });
            try {
                // Width 600 is above custom breakpoint 500
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 600, host);
                expect(ctx.isCondensed).to.be.false;
                expect(ctx.visibleLength).to.equal(7);
            } finally {
                cleanup(host);
            }
        });

        it('should use mobile count when width is below custom breakpoint', () => {
            const host = mockHost({
                '--week-mobile-breakpoint': '500px',
                '--week-mobile-day-count': '1',
            });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 400, host);
                expect(ctx.isCondensed).to.be.true;
                expect(ctx.visibleLength).to.equal(1);
                expect(ctx.visibleDates).to.have.length(1);
                // Single day should be the active date itself
                expect(ctx.visibleDates[0]).to.deep.equal(activeDate);
            } finally {
                cleanup(host);
            }
        });
    });

    describe('clamping', () => {
        it('should clamp day count of 0 to 1', () => {
            const host = mockHost({ '--week-mobile-day-count': '0' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 400, host);
                expect(ctx.visibleLength).to.equal(1);
            } finally {
                cleanup(host);
            }
        });

        it('should clamp day count of 10 to 7', () => {
            const host = mockHost({ '--week-day-count': '10' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 1024, host);
                expect(ctx.isCondensed).to.be.false;
                expect(ctx.visibleLength).to.equal(7);
            } finally {
                cleanup(host);
            }
        });

        it('should clamp negative day count to 1', () => {
            const host = mockHost({ '--week-mobile-day-count': '-3' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 400, host);
                expect(ctx.visibleLength).to.equal(1);
            } finally {
                cleanup(host);
            }
        });
    });

    describe('Sunday-first week', () => {
        it('should work correctly with firstDayOfWeek=0', () => {
            const sundayFirst: FirstDayOfWeek = 0;
            const host = mockHost({ '--week-mobile-day-count': '3' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, sundayFirst, 400, host);
                expect(ctx.isCondensed).to.be.true;
                expect(ctx.visibleLength).to.equal(3);
                expect(ctx.weekDates).to.have.length(7);
                // Should still center properly
                expect(ctx.visibleDates).to.have.length(3);
            } finally {
                cleanup(host);
            }
        });
    });

    describe('gridColumns', () => {
        it('should produce correct grid-template-columns for condensed view', () => {
            const host = mockHost({ '--week-mobile-day-count': '2' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 400, host);
                expect(ctx.gridColumns).to.equal('var(--time-column-width) repeat(2, 1fr)');
            } finally {
                cleanup(host);
            }
        });

        it('should produce correct grid-template-columns for 5-day view', () => {
            const host = mockHost({ '--week-day-count': '5' });
            try {
                const ctx = computeWeekDisplayContext(activeDate, firstDayOfWeek, 1024, host);
                expect(ctx.gridColumns).to.equal('var(--time-column-width) repeat(5, 1fr)');
            } finally {
                cleanup(host);
            }
        });
    });
});
