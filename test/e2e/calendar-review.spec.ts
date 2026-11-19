import type { Page, TestInfo } from 'playwright/test';
import { expect, test } from 'playwright/test';

import type Calendar from '../../src/lms-calendar.js';

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test.use({ hasTouch: true, timezoneId: 'UTC' });
test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));
});

// Opt-in review captures, not pixel baselines. Playwright keeps them with test results.
async function capture(page: Page, info: TestInfo, name: string) {
    if (process.env.REVIEW_CAPTURE !== '1') return;
    await page.screenshot({ path: info.outputPath(`${name}.png`), animations: 'disabled' });
}

test('opens Mobile View inside the configured phone canvas', async ({ page }) => {
    // Leave enough room for the Storybook toolbar and addon panel.
    await page.setViewportSize({ width: 1400, height: 1200 });
    await page.goto('/?path=/story/components-kalendus--mobile-view');
    const frame = page.locator('#storybook-preview-iframe');
    await expect(
        frame.contentFrame().locator('lms-calendar').locator('lms-calendar-month'),
    ).toBeVisible();
    await expect.poll(async () => (await frame.boundingBox())?.width).toBe(375);
    await expect.poll(async () => (await frame.boundingBox())?.height).toBe(667);
});

test('starts Condensed Week with three readable days and fits fewer in a narrower canvas', async ({
    page,
}) => {
    await page.goto(story('components-kalendus--condensed-week-view'));
    const week = page.locator('lms-calendar-week');
    await expect(week.locator('.peek-indicators')).toBeVisible();
    await expect(week).toHaveJSProperty('visibleLength', 3);

    await page.setViewportSize({ width: 430, height: 900 });
    await expect(week).toHaveJSProperty('visibleLength', 2);
});

test('compares the requested Week maxima and adapts when the canvas narrows', async ({ page }) => {
    await page.goto(story('components-kalendus--condensed-week-modes'));
    const weeks = page.locator('lms-calendar-week');
    await expect(weeks).toHaveCount(4);
    const columns = () =>
        weeks.evaluateAll((nodes) =>
            nodes.map((node) => (node as HTMLElement & { visibleLength: number }).visibleLength),
        );
    await expect.poll(columns).toEqual([1, 2, 3, 5]);
    await page.setViewportSize({ width: 375, height: 667 });
    await expect
        .poll(async () =>
            (await columns()).every((value, i) => value > 0 && value <= [1, 2, 3, 5][i]),
        )
        .toBe(true);
    await expect.poll(async () => (await columns()).at(-1)).toBeLessThan(5);
});

test.describe('Desktop Month', () => {
    test.use({ hasTouch: false, viewport: { width: 1440, height: 960 } });
    test('keeps the overflow button clear of previews at fractional row heights', async ({
        page,
    }) => {
        await page.goto(story('components-kalendus--default'));
        const month = page.locator('lms-calendar-month');
        const overflow = month.locator('.summary[data-date="2026-11-15"]');
        await expect(overflow).toBeVisible();
        await expect
            .poll(() =>
                overflow.evaluate((button) => {
                    const target = button.getBoundingClientRect();
                    const week = button.closest('.week')!;
                    return [...week.querySelectorAll('.entries slot')]
                        .flatMap((slot) => (slot as HTMLSlotElement).assignedElements())
                        .every((entry) => {
                            const box = entry.getBoundingClientRect();
                            return (
                                box.right <= target.left ||
                                box.left >= target.right ||
                                box.bottom <= target.top ||
                                box.top >= target.bottom
                            );
                        });
                }),
            )
            .toBe(true);
        const bounds = (await overflow.boundingBox())!;
        expect(bounds.width).toBeGreaterThanOrEqual(24);
        expect(bounds.height).toBeGreaterThanOrEqual(24);
    });
});

test('loads the Kalendus Docs entry with one live calendar at phone width', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/iframe.html?id=components-kalendus--docs&viewMode=docs');
    await expect(page.getByRole('heading', { level: 1, name: /Kalendus$/ })).toBeVisible();
    await expect(page.locator('lms-calendar')).toHaveCount(1);
    await expect(page.getByRole('link', { name: 'Browse Month → Agenda → Week' })).toBeVisible();
    await expect
        .poll(() =>
            page.evaluate(
                () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ),
        )
        .toBeLessThanOrEqual(1);
});

test('reads and exports from Agenda, compares Week, and returns to the open event', async ({
    page,
    browserName,
}, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(story('design-comparisons-presentation-variants--library-browse-journey'));
    const calendar = page.locator('lms-calendar');
    const header = calendar.locator('lms-calendar-header');
    const view = (name: string) => header.getByRole('button', { name, exact: true });
    const month = calendar.locator('lms-calendar-month');
    const tuesday = month.locator('.indicator[data-date="2026-11-17"]');
    const agenda = calendar.locator('.accordion-agenda');
    const row = (name: RegExp) => agenda.getByRole('button', { name });

    await tuesday.tap();
    await row(/^Exhibition/).tap();
    await agenda.locator('header').getByRole('button', { name: 'Month', exact: true }).tap();
    await expect(tuesday).toBeFocused();
    await expect(month.locator('[data-traced-date]')).toHaveCount(4);
    await capture(page, info, 'month-span-trace');

    await tuesday.tap();
    await agenda.getByRole('button', { name: 'Timed', exact: true }).tap();
    await expect(agenda.getByRole('heading', { name: 'Timed', exact: true })).toBeFocused();
    await expect(row(/^Five-minute briefing/)).toContainText(/9:00\s*AM\s*–\s*9:05\s*AM/);
    const workshop = row(/^Long workshop/);
    await workshop.tap();
    await expect(agenda.locator('.agenda-details')).toContainText('You can leave at any time');
    await capture(page, info, 'agenda-workshop-open');

    // Chromium can verify the download path; both engines check the cancelable request.
    const allowDownload = browserName === 'chromium';
    await calendar.evaluate((element, allow) => {
        const node = element as Calendar;
        node.addEventListener(
            'export-entry',
            (event) => {
                if (!allow) event.preventDefault();
                node.dataset.canonicalExport = String(
                    event.cancelable &&
                        event.detail.entry ===
                            node.entries.find((entry) => entry.id === 'Long workshop'),
                );
            },
            { once: true },
        );
    }, allowDownload);
    const download = agenda.getByRole('button', { name: 'Download .ics' });
    if (allowDownload) {
        const [file] = await Promise.all([page.waitForEvent('download'), download.tap()]);
        expect(file.suggestedFilename()).toBe('Long workshop.ics');
        expect(await file.failure()).toBeNull();
    } else {
        await download.tap();
    }
    await expect(calendar).toHaveAttribute('data-canonical-export', 'true');

    await view('Week').tap();
    const week = calendar.locator('lms-calendar-week');
    await expect(week).toBeVisible();
    const studio = week.getByRole('button', { name: /^Studio check-in/ });
    const pager = week.locator('.peek-indicator');
    const needsNextWindow = (await studio.count()) === 0;
    if (needsNextWindow) await pager.last().tap();
    await studio.tap();
    const inspector = calendar.getByRole('dialog');
    await expect(inspector).toContainText(/9:00\s*AM\s*–\s*9:45\s*AM/);
    await capture(page, info, 'week-studio-inspector');
    await inspector.getByRole('button', { name: 'Close', exact: true }).tap();
    if (needsNextWindow) await pager.first().tap();
    await view('Month').tap();
    await expect(workshop).toHaveAttribute('aria-expanded', 'true');
});

test('opens the same continuous all-day event from Month and Week', async ({ page }, info) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(story('calendar-viewport-matrix--month'));
    const calendar = page.locator('lms-calendar');
    await calendar.evaluate((element) => {
        const host = element as Calendar;
        const canonical = host.entries.find((entry) => entry.id === 'exhibition');
        host.addEventListener('export-entry', (event) => {
            event.preventDefault();
            host.dataset.canonicalSpanExport = String(
                event.cancelable && event.detail.entry === canonical,
            );
        });
    });
    for (const mode of ['month', 'week']) {
        const grid = calendar.locator(`lms-calendar-${mode}`);
        const bar = grid.getByRole('button', { name: /^Courtyard exhibition/ });
        await expect(bar).toHaveCount(1);
        await capture(page, info, `${mode}-all-day-bar`);
        const bounds = (await bar.boundingBox())!;
        expect(bounds.width).toBeGreaterThan(400);
        await bar.focus();
        // Hit the opposite end, in a different date column from the anchor.
        await bar.click({ position: { x: bounds.width - 8, y: bounds.height / 2 } });
        const dialog = calendar.getByRole('dialog');
        await expect(dialog).toContainText(/Nov 16, 2026.*Nov 19, 2026/);
        await dialog.getByRole('button', { name: 'Export as ICS' }).click();
        await expect(calendar).toHaveAttribute('data-canonical-span-export', 'true');
        await calendar.evaluate(
            (element) => delete (element as Calendar).dataset.canonicalSpanExport,
        );
        await page.keyboard.press('Escape');
        await expect(bar).toBeFocused();
        if (mode === 'month')
            await calendar
                .locator('lms-calendar-header')
                .getByRole('button', { name: 'Week', exact: true })
                .click();
    }
});

test('returns from a dense all-day list to the same part of a shallow Week', async ({
    page,
}, info) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(`${story('calendar-viewport-matrix--week')}&args=events:dense;fontSize:24`);
    const calendar = page.locator('lms-calendar');
    const week = calendar.locator('lms-calendar-week');
    const count = calendar.locator('.all-day-count').first();
    await expect(count).toBeVisible();
    const pager = week.locator('.peek-indicators');
    await expect(pager).toBeVisible();
    expect((await pager.boundingBox())!.height).toBeLessThan(48);
    const scroller = week.locator('.week-scroll');
    await scroller.focus();
    await expect(scroller).toBeFocused();
    await expect(scroller).toBeInViewport({ ratio: 0.9 });
    expect((await scroller.boundingBox())!.height).toBeGreaterThanOrEqual(120);
    await scroller.evaluate((element) => {
        const style = getComputedStyle(element);
        const scale = parseFloat(style.getPropertyValue('--minute-height'));
        element.scrollTop = parseFloat(style.paddingTop) + 540 * scale;
    });
    const visibleMinute = () =>
        scroller.evaluate((element) => {
            const style = getComputedStyle(element);
            return (
                (element.scrollTop - parseFloat(style.paddingTop)) /
                parseFloat(style.getPropertyValue('--minute-height'))
            );
        });
    await expect.poll(async () => Math.abs((await visibleMinute()) - 540)).toBeLessThan(2);
    const before = await visibleMinute();
    await capture(page, info, 'shallow-week');

    await count.tap();
    const list = calendar.locator('[data-density-list]');
    await expect(list.getByRole('heading').first()).toBeFocused();
    await expect(list.getByRole('button', { name: /^Community project/ }).first()).toBeVisible();
    await capture(page, info, 'shallow-week-all-day-list');
    await list.getByRole('button', { name: 'Close', exact: true }).tap();
    await expect(count).toBeFocused();
    await expect(count).toBeInViewport();
    await expect.poll(async () => Math.abs((await visibleMinute()) - before)).toBeLessThan(2);
});
