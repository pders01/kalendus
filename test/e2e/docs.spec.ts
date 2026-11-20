import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import type { AddressInfo } from 'node:net';

import { expect, test } from 'playwright/test';
import { preview } from 'vite';

let server: Awaited<ReturnType<typeof preview>>;
let base: string;

test.beforeAll(async () => {
    execFileSync('bun', ['run', 'docs:sync:check'], { stdio: 'inherit' });
    execFileSync('bun', ['run', 'docs:build'], { stdio: 'inherit' });
    server = await preview({
        root: realpathSync('.'),
        base: '/kalendus/',
        configFile: false,
        build: { outDir: '_site' },
        preview: { host: '127.0.0.1', port: 0 },
    });
    base = `http://127.0.0.1:${(server.httpServer.address() as AddressInfo).port}/kalendus/`;
});

test.afterAll(async () => {
    await server?.close();
});

test('serves the README preview and its click-to-play showcase under the site prefix', async ({
    page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(base);
    const showcase = page.getByRole('link', { name: /^Play the .* Kalendus showcase/ });
    const poster = showcase.getByRole('img');
    await expect(poster).toBeVisible();
    await expect
        .poll(() => poster.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBeGreaterThan(0);
    const href = await showcase.getAttribute('href');
    const animation = await page.request.head(new URL(href!, base).href);
    expect(animation.ok()).toBe(true);
    expect(animation.headers()['content-type']).toContain('image/gif');
});

test('keeps docs tables and code within the reading column and keyboard-scrollable', async ({
    page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 });
    for (const path of ['', 'docs/library-usage/', 'docs/css-tokens/', 'docs/theming/']) {
        await page.goto(base + path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect
            .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
            .toBe(375);
    }
    await page.goto(`${base}docs/library-usage/`);
    for (const label of [/^Table:/, /^Code example$/]) {
        const scrollable = page.getByRole('region', { name: label }).first();
        await expect(scrollable).toHaveAttribute('tabindex', '0');
        await scrollable.focus();
        await page.keyboard.press('ArrowRight');
        await expect
            .poll(() => scrollable.evaluate((element) => element.scrollLeft))
            .toBeGreaterThan(0);
    }
});

test('groups navigation sections once and keeps links usable without JavaScript', async ({
    browser,
}) => {
    const context = await browser.newContext({
        javaScriptEnabled: false,
        viewport: { width: 375, height: 667 },
    });
    try {
        const page = await context.newPage();
        await page.goto(base);
        const navigation = page.getByRole('navigation', { name: 'Documentation' });
        const sections = await navigation.locator('.nav-section').allTextContents();
        expect(sections).toEqual([
            'Getting Started',
            'Usage',
            'Layout',
            'Reference',
            'Internals',
            'Archive',
        ]);
        await expect(page.locator('.docs-version')).toContainText('unreleased features');
        await navigation.getByRole('link', { name: 'Library Usage' }).click();
        await expect(page).toHaveURL(/\/docs\/library-usage\/$/);
        await expect(navigation.getByRole('link', { name: 'Library Usage' })).toHaveAttribute(
            'aria-current',
            'page',
        );
    } finally {
        await context.close();
    }
});

test('removes a code tab stop after it stops overflowing and loses focus', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 667 });
    await page.goto(`${base}docs/library-usage/`);
    const code = page.locator('main pre').first();
    await expect(code).toHaveAttribute('tabindex', '0');
    await code.focus();
    await page.setViewportSize({ width: 1400, height: 900 });
    await expect.poll(() => code.evaluate((node) => node.scrollWidth - node.clientWidth)).toBe(0);
    await expect(code).toBeFocused();
    await page.locator('.site-header a').first().focus();
    await expect(code).not.toHaveAttribute('tabindex', '0');
    await expect(code).not.toHaveAttribute('role', 'region');
});

test('keeps deep-link headings below the header and returns focus on navigation dismissal', async ({
    page,
}) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${base}docs/library-usage/#data-contracts`);
    await expect
        .poll(() =>
            page.evaluate(() => {
                const header = document.querySelector('.site-header')!.getBoundingClientRect();
                const heading = document.getElementById('data-contracts')!.getBoundingClientRect();
                return heading.top - header.bottom;
            }),
        )
        .toBeGreaterThanOrEqual(0);

    await page.goto(base);
    await page.getByRole('link', { name: 'local Storybook' }).click();
    await expect(page).toHaveURL(/#storybook$/);
    await expect
        .poll(() =>
            page.evaluate(
                () =>
                    document.querySelector(':target')!.getBoundingClientRect().top -
                    document.querySelector('.site-header')!.getBoundingClientRect().bottom,
            ),
        )
        .toBeGreaterThanOrEqual(0);

    const toggle = page.getByRole('button', { name: 'Navigation' });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('navigation', { name: 'Documentation' }).getByRole('link').first().focus();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
});
