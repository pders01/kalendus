/**
 * Record a demo GIF of the calendar cycling through view modes.
 *
 * Spins up a Vite dev server, creates a temp HTML page with sample
 * entries, uses Playwright's recordVideo to capture ~8s of view
 * transitions, then converts WebM → GIF with ffmpeg (two-pass palette).
 *
 * Prerequisites: ffmpeg must be installed (brew install ffmpeg).
 *
 * Run: pnpm demo:gif
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, mkdirSync, unlinkSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'assets');

// ── Preflight: check for ffmpeg ──────────────────────────────────────
try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
} catch {
    console.error(
        '\n  ffmpeg is required but was not found.\n' +
            '  Install it with:  brew install ffmpeg  (macOS)\n' +
            '                    sudo apt install ffmpeg (Linux)\n',
    );
    process.exit(1);
}

mkdirSync(outDir, { recursive: true });

// ── Sample entries (spread across current month) ─────────────────────

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const currentDay = new Date().getDate();

const sampleEntries = JSON.stringify([
    {
        heading: 'Morning Standup',
        content: 'Daily team sync meeting',
        color: '#1976d2',
        isContinuation: false,
        date: {
            start: { day: currentDay, month: currentMonth, year: currentYear },
            end: { day: currentDay, month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 30 } },
    },
    {
        heading: 'Design Workshop',
        content: 'UX/UI design review session',
        color: '#2e7d32',
        isContinuation: false,
        date: {
            start: { day: currentDay, month: currentMonth, year: currentYear },
            end: { day: currentDay, month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 10, minute: 0 }, end: { hour: 12, minute: 0 } },
    },
    {
        heading: 'Lunch & Learn',
        content: 'Tech talk on web components',
        color: '#ff9800',
        isContinuation: false,
        date: {
            start: { day: currentDay, month: currentMonth, year: currentYear },
            end: { day: currentDay, month: currentMonth, year: currentYear },
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
            start: {
                day: Math.min(currentDay + 1, 28),
                month: currentMonth,
                year: currentYear,
            },
            end: {
                day: Math.min(currentDay + 1, 28),
                month: currentMonth,
                year: currentYear,
            },
        },
        time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
    },
    {
        heading: 'Code Review',
        content: 'Weekly code review session',
        color: '#00acc1',
        isContinuation: false,
        date: {
            start: {
                day: Math.min(currentDay + 3, 28),
                month: currentMonth,
                year: currentYear,
            },
            end: {
                day: Math.min(currentDay + 3, 28),
                month: currentMonth,
                year: currentYear,
            },
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
            start: {
                day: Math.min(currentDay + 5, 26),
                month: currentMonth,
                year: currentYear,
            },
            end: {
                day: Math.min(currentDay + 7, 28),
                month: currentMonth,
                year: currentYear,
            },
        },
        time: { start: { hour: 8, minute: 0 }, end: { hour: 17, minute: 0 } },
    },
]);

// ── HTML template ────────────────────────────────────────────────────

const testHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=960">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #f5f5f5; padding: 16px; }
        lms-calendar {
            display: block;
            height: 608px;
            --primary-color: #1976d2;
        }
    </style>
</head>
<body>
    <lms-calendar></lms-calendar>
    <script type="module">
        import './src/lms-calendar.ts';

        async function init() {
            await customElements.whenDefined('lms-calendar');
            const cal = document.querySelector('lms-calendar');
            cal.heading = 'My Calendar';
            cal.activeDate = { day: ${currentDay}, month: ${currentMonth}, year: ${currentYear} };
            cal.entries = ${sampleEntries};
            await cal.updateComplete;

            window.__switchView = async (view) => {
                const header = cal.shadowRoot.querySelector('lms-calendar-header');
                const btn = header.shadowRoot.querySelector('[data-context="' + view + '"]');
                if (btn) btn.click();
                await new Promise(r => setTimeout(r, 600));
            };

            window.__navigateNext = async () => {
                const header = cal.shadowRoot.querySelector('lms-calendar-header');
                const nextBtn = header.shadowRoot.querySelector('[data-dir="next"]');
                if (nextBtn) nextBtn.click();
                await new Promise(r => setTimeout(r, 600));
            };

            window.__calReady = true;
        }
        init();
    </script>
</body>
</html>`;

// ── Main ─────────────────────────────────────────────────────────────

async function run() {
    const server = await createServer({
        root,
        server: { port: 0 },
        logLevel: 'silent',
    });
    await server.listen();

    const address = server.httpServer.address();
    const baseURL = `http://localhost:${address.port}`;
    console.log(`Vite dev server running at ${baseURL}`);

    // Write temp HTML
    const htmlFileName = '__demo-recording.html';
    const htmlPath = resolve(root, htmlFileName);
    writeFileSync(htmlPath, testHTML);

    const videoDir = resolve(root, '.demo-tmp');
    mkdirSync(videoDir, { recursive: true });

    const browser = await chromium.launch();
    const context = await browser.newContext({
        viewport: { width: 960, height: 640 },
        recordVideo: {
            dir: videoDir,
            size: { width: 960, height: 640 },
        },
    });

    const page = await context.newPage();

    try {
        await page.goto(`${baseURL}/${htmlFileName}`, {
            waitUntil: 'networkidle',
        });
        await page.waitForFunction(() => window.__calReady === true, {
            timeout: 15000,
        });

        console.log('Recording demo...');

        // 1. Month view (already loaded)
        await page.waitForTimeout(1500);

        // 2. Switch to week view
        console.log('  → week view');
        await page.evaluate(() => window.__switchView('week'));
        await page.waitForTimeout(1500);

        // 3. Switch to day view
        console.log('  → day view');
        await page.evaluate(() => window.__switchView('day'));
        await page.waitForTimeout(1500);

        // 4. Switch to year view
        console.log('  → year view');
        await page.evaluate(() => window.__switchView('year'));
        await page.waitForTimeout(1500);

        // 5. Back to month, navigate to next month
        console.log('  → month view + next month');
        await page.evaluate(() => window.__switchView('month'));
        await page.waitForTimeout(500);
        await page.evaluate(() => window.__navigateNext());
        await page.waitForTimeout(1000);

        console.log('Recording complete.');
    } finally {
        await page.close();
    }

    // Playwright saves video on context close
    const videoPath = await page.video().path();
    await context.close();
    await browser.close();

    // ── Convert WebM → GIF (two-pass palette) ────────────────────────
    const gifPath = resolve(outDir, 'demo.gif');
    const palettePath = resolve(videoDir, 'palette.png');

    console.log('Converting to GIF...');

    // Pass 1: generate optimal palette
    execSync(
        `ffmpeg -y -i "${videoPath}" -vf "fps=10,scale=800:-1:flags=lanczos,palettegen" "${palettePath}"`,
        { stdio: 'inherit' },
    );

    // Pass 2: apply palette
    execSync(
        `ffmpeg -y -i "${videoPath}" -i "${palettePath}" -lavfi "fps=10,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse" "${gifPath}"`,
        { stdio: 'inherit' },
    );

    console.log(`GIF saved to ${gifPath}`);

    // ── Cleanup ──────────────────────────────────────────────────────
    try {
        unlinkSync(htmlPath);
    } catch {}
    try {
        unlinkSync(videoPath);
    } catch {}
    try {
        unlinkSync(palettePath);
    } catch {}
    try {
        const { rmdirSync } = await import('fs');
        rmdirSync(videoDir);
    } catch {}

    await server.close();
    console.log('Done!');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
