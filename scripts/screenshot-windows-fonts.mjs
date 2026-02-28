/**
 * Playwright script to simulate Windows system fonts.
 *
 * Since macOS doesn't have Segoe UI, we override the --system-ui
 * CSS custom property with Arial (the Windows fallback) and set
 * the Playwright user-agent / platform to Windows 10.
 *
 * Uses Vite's dev server to resolve bare Lit imports properly.
 *
 * Run: node scripts/screenshot-windows-fonts.mjs
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'screenshots');

mkdirSync(outDir, { recursive: true });

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const sampleEntries = JSON.stringify([
    {
        heading: 'Morning Standup',
        content: 'Daily team sync meeting',
        color: '#1976d2',
        isContinuation: false,
        date: {
            start: { day: 15, month: currentMonth, year: currentYear },
            end: { day: 15, month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 30 } },
    },
    {
        heading: 'Design Workshop',
        content: 'UX/UI design review session',
        color: '#2e7d32',
        isContinuation: false,
        date: {
            start: { day: 15, month: currentMonth, year: currentYear },
            end: { day: 15, month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 10, minute: 0 }, end: { hour: 12, minute: 0 } },
    },
    {
        heading: 'Lunch & Learn',
        content: 'Tech talk on web components',
        color: '#ff9800',
        isContinuation: false,
        date: {
            start: { day: 15, month: currentMonth, year: currentYear },
            end: { day: 15, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 12, minute: 30 },
            end: { hour: 13, minute: 30 },
        },
    },
    {
        heading: 'Team Offsite',
        content: 'All-day team building event',
        color: '#d32f2f',
        isContinuation: false,
        date: {
            start: { day: 16, month: currentMonth, year: currentYear },
            end: { day: 16, month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
    },
    {
        heading: 'Code Review',
        content: 'Weekly code review session',
        color: '#00acc1',
        isContinuation: false,
        date: {
            start: { day: 18, month: currentMonth, year: currentYear },
            end: { day: 18, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 14, minute: 0 },
            end: { hour: 15, minute: 30 },
        },
    },
    {
        heading: 'Product Sprint',
        content: 'Multi-day development sprint',
        color: '#6a1b9a',
        isContinuation: false,
        date: {
            start: { day: 20, month: currentMonth, year: currentYear },
            end: { day: 22, month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 8, minute: 0 }, end: { hour: 17, minute: 0 } },
    },
]);

function buildTestHTML(fontOverride) {
    const fontCSS = fontOverride
        ? `lms-calendar { --system-ui: ${fontOverride}; --monospace-ui: Consolas, 'Courier New', monospace; }`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f0f0f0; padding: 24px; }
        ${fontCSS}
    </style>
</head>
<body>
    <lms-calendar style="height: 720px; display: block;"></lms-calendar>
    <script type="module">
        import './src/lms-calendar.ts';

        async function init() {
            await customElements.whenDefined('lms-calendar');
            const cal = document.querySelector('lms-calendar');
            cal.heading = 'My Calendar';
            cal.activeDate = { day: 15, month: ${currentMonth}, year: ${currentYear} };
            cal.entries = ${sampleEntries};
            await cal.updateComplete;

            window.__switchView = async (view) => {
                const header = cal.shadowRoot.querySelector('lms-calendar-header');
                const btn = header.shadowRoot.querySelector('[data-context="' + view + '"]');
                btn.click();
                // Wait for Lit update cycle
                await new Promise(r => setTimeout(r, 600));
            };
            window.__calReady = true;
        }
        init();
    </script>
</body>
</html>`;
}

async function run() {
    // Start Vite dev server (handles bare import resolution + TS compilation)
    const server = await createServer({
        root,
        server: { port: 0 }, // random available port
        logLevel: 'silent',
    });
    await server.listen();

    const address = server.httpServer.address();
    const baseURL = `http://localhost:${address.port}`;
    console.log(`Vite dev server running at ${baseURL}`);

    const browser = await chromium.launch();

    const configs = [
        {
            name: 'macos',
            label: 'macOS (system-ui → SF Pro)',
            fontOverride: null,
            userAgent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        {
            name: 'windows',
            label: 'Windows (Arial / Segoe UI fallback)',
            fontOverride:
                "Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            userAgent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
    ];

    const views = ['month', 'week', 'day'];

    for (const config of configs) {
        // Write a temporary HTML file for this config
        const htmlFileName = `__screenshot-test-${config.name}.html`;
        const htmlPath = resolve(root, htmlFileName);
        writeFileSync(htmlPath, buildTestHTML(config.fontOverride));

        const context = await browser.newContext({
            viewport: { width: 1200, height: 800 },
            userAgent: config.userAgent,
        });
        const page = await context.newPage();

        // Navigate to the temp HTML via Vite dev server
        await page.goto(`${baseURL}/${htmlFileName}`, {
            waitUntil: 'networkidle',
        });
        await page.waitForFunction(() => window.__calReady === true, {
            timeout: 10000,
        });
        await page.waitForTimeout(500);

        for (const view of views) {
            if (view !== 'month') {
                await page.evaluate((v) => window.__switchView(v), view);
                await page.waitForTimeout(400);
            }

            const path = `${outDir}/${config.name}-${view}.png`;
            await page.screenshot({ path, fullPage: false });
            console.log(`  ✓ ${config.label} — ${view} → ${path}`);
        }

        await context.close();

        // Clean up temp HTML
        const { unlinkSync } = await import('fs');
        try { unlinkSync(htmlPath); } catch {}
    }

    await browser.close();
    await server.close();
    console.log(`\nDone. Screenshots in ${outDir}/`);
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
