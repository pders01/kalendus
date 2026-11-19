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

test('returns from a dense all-day list to the same part of a shallow Week', async ({
    page,
}, info) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(`${story('calendar-viewport-matrix--week')}&args=events:dense`);
    const calendar = page.locator('lms-calendar');
    const week = calendar.locator('lms-calendar-week');
    const count = calendar.locator('.all-day-count').first();
    await expect(count).toBeVisible();
    const pager = week.locator('.peek-indicators');
    await expect(pager).toBeVisible();
    expect((await pager.boundingBox())!.height).toBeLessThan(48);
    const scroller = week.locator('.week-scroll');
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
    await expect.poll(async () => Math.abs((await visibleMinute()) - before)).toBeLessThan(2);
});
