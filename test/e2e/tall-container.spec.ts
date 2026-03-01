import { test, expect } from 'playwright/test';

/**
 * Tall Container regression test.
 *
 * Reproduces the freeze / severe-perf-degradation when switching to
 * Day or Week view inside a ≥ 1400 px-tall calendar instance.
 *
 * Storybook must be running on localhost:6006 (`pnpm storybook`).
 */

const STORY_URL =
    '/iframe.html?id=components-kalendus--tall-container&viewMode=story';

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
    const btn = calendar.locator(
        `lms-calendar-header >> button[data-context="${view}"]`,
    );
    await btn.click();
}

/**
 * Wait for the view component to appear inside the calendar's `<main>`.
 * Returns the locator so callers can assert against it.
 */
function viewComponent(
    calendar: import('playwright/test').Locator,
    view: 'day' | 'week',
) {
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
        await tallCalendar(page).evaluate((el) =>
            (el as any).updateComplete,
        );
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

    test('Day view: --minute-height scales to tall container', async ({
        page,
    }) => {
        const cal = tallCalendar(page);
        await switchView(cal, 'day');

        const day = viewComponent(cal, 'day');
        await expect(day).toBeVisible({ timeout: 2_000 });

        // Read the computed --minute-height from the day component
        const minuteHeight = await day.evaluate((el) => {
            const val = getComputedStyle(el).getPropertyValue('--minute-height');
            return parseFloat(val);
        });

        // For a ~1400 px container the scroll viewport is roughly
        // 1400 − header ≈ 1300 px → minute-height ≈ 1300 / 720 ≈ 1.8
        // The default (720 px container) gives ≈ 0.8–0.9.
        // Assert it's larger than the default, proving the
        // ResizeObserver applied correctly.
        expect(minuteHeight).toBeGreaterThan(1.2);
    });

    test('Week view: --minute-height scales to tall container', async ({
        page,
    }) => {
        const cal = tallCalendar(page);
        await switchView(cal, 'week');

        const week = viewComponent(cal, 'week');
        await expect(week).toBeVisible({ timeout: 2_000 });

        const minuteHeight = await week.evaluate((el) => {
            const val = getComputedStyle(el).getPropertyValue('--minute-height');
            return parseFloat(val);
        });

        expect(minuteHeight).toBeGreaterThan(1.2);
    });

    test('round-trip: Day → Week → Month does not freeze', async ({
        page,
    }) => {
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

    test('Day view: scroll container has correct dimensions', async ({
        page,
    }) => {
        const cal = tallCalendar(page);
        await switchView(cal, 'day');

        const day = viewComponent(cal, 'day');
        await expect(day).toBeVisible({ timeout: 2_000 });

        // Trace the full height chain to find where it breaks.
        const chain = await cal.evaluate((calEl) => {
            const cs = (el: Element) => {
                const s = getComputedStyle(el);
                return {
                    height: s.height,
                    display: s.display,
                    overflow: s.overflowY,
                    flex: s.flex,
                    clientH: (el as HTMLElement).clientHeight,
                    scrollH: (el as HTMLElement).scrollHeight,
                };
            };

            const shadow = calEl.shadowRoot!;
            const container = shadow.querySelector('.calendar-container')!;
            const main = shadow.querySelector('main')!;
            const dayEl = shadow.querySelector('lms-calendar-day')!;
            const dayShadow = dayEl.shadowRoot!;
            const wrapper = dayShadow.querySelector('.wrapper')!;
            const dayContainer = dayShadow.querySelector('.container')!;
            const dayMain = dayShadow.querySelector('.main')!;

            return {
                host: { clientH: calEl.clientHeight, scrollH: calEl.scrollHeight, ...cs(calEl) },
                calContainer: cs(container),
                main: cs(main),
                dayHost: cs(dayEl),
                wrapper: cs(wrapper),
                dayContainer: cs(dayContainer),
                dayMain: cs(dayMain),
            };
        });

        const dayMain = chain.dayMain;
        expect(dayMain.clientH).toBeGreaterThan(400);
        // scrollHeight must be > clientHeight for scrolling to work
        // (24 hrs of content in a 12 hr viewport ≈ 2× ratio)
        expect(dayMain.scrollH).toBeGreaterThan(dayMain.clientH * 1.5);
    });
});
