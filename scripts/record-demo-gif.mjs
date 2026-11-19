/**
 * Record the public Month → Agenda → Week story as native-resolution PNGs,
 * then encode a looping GIF. Capturing stills avoids video blur and makes
 * each step readable without requiring hundreds of duplicate frames.
 *
 * Prerequisites: ffmpeg and Playwright Chromium (`bunx playwright install chromium`).
 * Run: bun run demo:gif
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { expect } from 'playwright/test';
import { preview } from 'vite';

const root = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
const out = join(root, 'assets');
execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
execFileSync('bun', ['run', 'build-storybook', '--', '--quiet'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, STORYBOOK_DISABLE_TELEMETRY: '1' },
});

const work = mkdtempSync(join(tmpdir(), 'kalendus-demo-'));
let server;
let browser;
try {
    server = await preview({
        root,
        configFile: false,
        build: { outDir: 'storybook-static' },
        preview: { host: '127.0.0.1', port: 0 },
    });
    browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 390, height: 780 },
        deviceScaleFactor: 2,
        hasTouch: true,
        colorScheme: 'light',
        reducedMotion: 'reduce',
        timezoneId: 'UTC',
        acceptDownloads: true,
    });
    await page.clock.setFixedTime(new Date('2026-11-18T12:00:00Z'));
    const port = server.httpServer.address().port;
    await page.goto(
        `http://127.0.0.1:${port}/iframe.html?id=design-comparisons-presentation-variants--library-browse-journey&viewMode=story`,
    );
    const calendar = page.locator('lms-calendar');
    await expect(calendar.locator('lms-calendar-month')).toBeVisible();

    // Presentation caption outside the calendar. The demo drives only public UI.
    await page.evaluate(() => {
        const footer = document.createElement('footer');
        footer.id = 'demo-caption';
        document.body.append(footer);
    });
    await page.addStyleTag({
        content: `
        html { scroll-padding-block-end: 64px; }
        body { background: #fff; padding-block-end: 64px; font-family: system-ui, sans-serif; }
        #demo-caption {
            position: fixed; inset: auto 0 0; min-height: 52px; display: grid; place-items: center;
            background: #172138; color: #fff; text-align: center; z-index: 2; pointer-events: none;
            font: 600 15px/1.4 system-ui, sans-serif;
        }
    `,
    });
    const frames = [];
    const captionBar = page.locator('#demo-caption');
    async function frame(caption, duration, target) {
        await captionBar.evaluate((footer, text) => (footer.textContent = text), caption);
        if (target) {
            await target.scrollIntoViewIfNeeded();
            const box = await target.boundingBox();
            const footer = await captionBar.boundingBox();
            const overlap = box.y + box.height - footer.y;
            if (overlap > 0)
                await page.evaluate((delta) => window.scrollBy(0, delta), overlap + 16);
        } else {
            await page.evaluate(() => window.scrollTo(0, 0));
        }
        const file = `frame-${frames.length}.png`;
        await page.screenshot({ path: join(work, file), animations: 'disabled' });
        frames.push({ file, duration });
    }

    const tuesday = calendar.locator('.indicator[data-date="2026-11-17"]');
    await frame('1 · Month: pick November 17', 2.6);
    await tuesday.tap();
    const agenda = calendar.locator('.accordion-agenda');
    await expect(agenda).toBeVisible();
    await frame('2 · Agenda: browse the selected day', 2.2);

    await agenda.getByRole('button', { name: /^Exhibition/ }).tap();
    await expect(agenda).toContainText('Drop in during gallery hours.');
    const downloadButton = agenda.getByRole('button', { name: 'Download .ics' });
    await frame('3 · Read the details or download the event', 3.4, downloadButton);
    const [download] = await Promise.all([page.waitForEvent('download'), downloadButton.tap()]);
    if (await download.failure()) throw new Error('The demo event did not download');
    await frame(`Downloaded ${download.suggestedFilename()}`, 1.8, downloadButton);

    await agenda.getByRole('button', { name: 'Timed', exact: true }).tap();
    const briefing = agenda.getByRole('button', { name: /^Five-minute briefing/ });
    await expect(briefing).toBeVisible();
    await page.evaluate(() => window.scrollBy(0, -16));
    await frame('4 · Timed: check the morning schedule', 2.4, briefing);

    await calendar
        .locator('lms-calendar-header')
        .getByRole('button', { name: 'Week', exact: true })
        .tap();
    const week = calendar.locator('lms-calendar-week');
    await expect(week).toBeVisible();
    const studio = week.getByRole('button', { name: /^Studio check-in/ });
    if (!(await studio.count())) await week.locator('.peek-indicator').last().tap();
    await studio.scrollIntoViewIfNeeded();
    await frame('5 · Week: compare times across days', 2.4);
    await studio.tap();
    const inspector = calendar.getByRole('dialog');
    await expect(inspector).toContainText(/9:00\s*AM\s*–\s*9:45\s*AM/);
    await frame('Open an event to read its exact time', 3, inspector);

    const concat = frames
        .map(({ file, duration }) => `file '${file}'\nduration ${duration}\n`)
        .join('');
    writeFileSync(join(work, 'frames.txt'), concat);
    execFileSync(
        'ffmpeg',
        [
            '-hide_banner',
            '-loglevel',
            'error',
            '-f',
            'concat',
            '-i',
            'frames.txt',
            '-filter_complex',
            '[0:v]split[image][colors];[colors]palettegen[palette];[image][palette]paletteuse=dither=none',
            '-fps_mode',
            'vfr',
            '-loop',
            '0',
            '-final_delay',
            String(frames.at(-1).duration * 100),
            'demo.gif',
        ],
        { cwd: work, stdio: 'inherit' },
    );
    mkdirSync(out, { recursive: true });
    copyFileSync(join(work, 'demo.gif'), join(out, 'demo.gif'));
    console.log('Wrote assets/demo.gif (780 × 1560, seven steps).');
} finally {
    await browser?.close();
    await server?.close();
    rmSync(work, { recursive: true, force: true });
}
