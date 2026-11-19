import { test, expect } from 'playwright/test';

/**
 * Tall Container regression test.
 *
 * Reproduces the freeze / severe-perf-degradation when switching to
 * Day or Week view inside a ≥ 1400 px-tall calendar instance.
 *
 * Playwright builds and serves production Storybook on port 6006; keep it free.
 */

const STORY_URL = '/iframe.html?id=components-kalendus--tall-container&viewMode=story';

/* ── helpers ─────────────────────────────────────────────────── */

/** Return the *second* (tall) `lms-calendar` element on the page. */
function tallCalendar(page: import('playwright/test').Page) {
    return page.locator('lms-calendar').nth(1);
}

/** Click a view-switch button inside a calendar's shadow-DOM header. */
async function switchView(
    calendar: import('playwright/test').Locator,
    view: 'day' | 'week' | 'month' | 'year',
) {
    // Pierce two shadow roots: lms-calendar → lms-calendar-header → button
    const btn = calendar.locator(`lms-calendar-header >> button[data-context="${view}"]`);
    await btn.click();
}

/**
 * Wait for the view component to appear inside the calendar's `<main>`.
 * Returns the locator so callers can assert against it.
 */
function viewComponent(calendar: import('playwright/test').Locator, view: 'day' | 'week') {
    const tag = view === 'day' ? 'lms-calendar-day' : 'lms-calendar-week';
    return calendar.locator(tag);
}

/* ── tests ───────────────────────────────────────────────────── */

test.describe('Tall Container view switching', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(STORY_URL);
        // Wait for both calendars to be in the DOM and hydrated
        await expect(page.locator('lms-calendar')).toHaveCount(2);
        // Ensure the tall calendar has finished its first render
        await tallCalendar(page).evaluate((el) => (el as any).updateComplete);
    });

    test('switches to Day view without freezing', async ({ page }) => {
        const cal = tallCalendar(page);

        await switchView(cal, 'day');

        // The day component must appear within 2 s — a freeze would
        // blow past this timeout.
        const day = viewComponent(cal, 'day');
        await expect(day).toBeVisible({ timeout: 2_000 });

        // Verify hour labels rendered (pierce into lms-calendar-day shadow)
        const hourLabels = day.locator('.hour-label');
        await expect(hourLabels.first()).toBeVisible({ timeout: 1_000 });
        const count = await hourLabels.count();
        expect(count).toBe(25); // hours 0–24
    });

    test('switches to Week view without freezing', async ({ page }) => {
        const cal = tallCalendar(page);

        await switchView(cal, 'week');

        const week = viewComponent(cal, 'week');
        await expect(week).toBeVisible({ timeout: 2_000 });

        // Verify day columns rendered
        const dayColumns = week.locator('.day-column');
        await expect(dayColumns.first()).toBeVisible({ timeout: 1_000 });
        // Full week = 7 columns (or 3 in condensed mode)
        const count = await dayColumns.count();
        expect(count).toBeGreaterThanOrEqual(3);
    });

    for (const view of ['day', 'week'] as const) {
        test(`${view} fits a complete 24-hour axis inside the tall embed`, async ({ page }) => {
            const cal = tallCalendar(page);
            await switchView(cal, view);
            const grid = viewComponent(cal, view);
            await expect(grid).toBeVisible();
            const scroll = grid.locator('.timeline');
            await expect
                .poll(() =>
                    scroll.evaluate((element) => {
                        const { height } = element
                            .querySelector('.timed-content, .day-column')!
                            .getBoundingClientRect();
                        const { paddingTop, paddingBottom } = getComputedStyle(element);
                        const available =
                            element.clientHeight -
                            parseFloat(paddingTop) -
                            parseFloat(paddingBottom);
                        return Math.abs(height - available);
                    }),
                )
                .toBeLessThan(1);

            const { clientHeight, scrollHeight } = await scroll.evaluate((element) => ({
                clientHeight: element.clientHeight,
                scrollHeight: element.scrollHeight,
            }));
            expect(clientHeight).toBeGreaterThan(1000);
            expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
            const midnight = grid.locator('.hour-label').last();
            expect((await midnight.boundingBox())!.y).toBeLessThan(
                (await scroll.boundingBox())!.y + clientHeight,
            );
        });
    }

    test('round-trip: Day → Week → Month does not freeze', async ({ page }) => {
        const cal = tallCalendar(page);

        // Day
        await switchView(cal, 'day');
        await expect(viewComponent(cal, 'day')).toBeVisible({ timeout: 2_000 });

        // Week
        await switchView(cal, 'week');
        await expect(viewComponent(cal, 'week')).toBeVisible({
            timeout: 2_000,
        });

        // Month (default view — month component lives inside shadow DOM)
        await switchView(cal, 'month');
        const month = cal.locator('lms-calendar-month');
        await expect(month).toBeVisible({ timeout: 2_000 });
    });
});
