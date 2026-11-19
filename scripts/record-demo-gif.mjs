/** Record the README showcase from the production browser bundle: bun run demo:gif.
 * Requires ffmpeg and Playwright Chromium. The poster uses frames from the same run.
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
const themes = ['default', 'ink', 'soft', 'brutalist', 'midnight'];
const active = { year: 2026, month: 11, day: 17 };
const heading = { en: 'My Calendar', de: 'Mein Kalender', ja: 'カレンダー', ar: 'التقويم' };
const date = (day, month = active.month) => ({ ...active, day, month });
const time = (hour, minute = 0) => ({ hour, minute });
const timed = (id, day, start, end, color) => ({
    id,
    kind: 'timed',
    date: { start: date(day), end: date(day) },
    time: { start, end },
    color,
});
const allDay = (id, start, end, color) => ({ id, kind: 'all-day', date: { start, end }, color });

// Keep the showcase's original example titles and representative overlapping/spanning events.
const samples = [
    [
        timed('standup', 17, time(9), time(9, 30), '#1976d2'),
        'Morning Standup',
        'Morgen-Standup',
        '朝会',
        'اجتماع الصباح',
    ],
    [
        timed('design', 17, time(9, 15), time(10, 45), '#4682b4'),
        'Design Review',
        'Design-Review',
        'デザインレビュー',
        'مراجعة التصميم',
    ],
    [
        timed('code', 17, time(10), time(11, 30), '#29986d'),
        'Code Review',
        'Code-Review',
        'コードレビュー',
        'مراجعة الكود',
    ],
    [
        timed('lunch', 17, time(12, 30), time(13, 30), '#e07c52'),
        'Lunch & Learn',
        'Lunch & Learn',
        'ランチ勉強会',
        'غداء تعليمي',
    ],
    [
        timed('focus', 17, time(14), time(16), '#397cce'),
        'Afternoon Focus',
        'Fokuszeit',
        '集中タイム',
        'وقت التركيز',
    ],
    [
        allDay('sprint', date(16), date(19), '#6a1b9a'),
        'Product Sprint',
        'Produkt-Sprint',
        'プロダクトスプリント',
        'سباق المنتج',
    ],
    [
        allDay('conference', date(20), date(22), '#e46e52'),
        'Conference',
        'Konferenz',
        'カンファレンス',
        'مؤتمر',
    ],
    [
        timed('retro', 13, time(15), time(16), '#2e7d32'),
        'Team Retro',
        'Team-Retro',
        'チーム振り返り',
        'استعراض الفريق',
    ],
    [
        timed('sync', 16, time(11), time(11, 30), '#e39224'),
        '1:1 Meeting',
        '1:1-Meeting',
        '1on1ミーティング',
        'اجتماع فردي',
    ],
    [
        timed('planning', 18, time(10), time(12), '#397cce'),
        'Planning',
        'Planung',
        'プランニング',
        'تخطيط',
    ],
    [
        timed('demo', 19, time(14), time(15, 30), '#7160a0'),
        'Demo Day',
        'Demo-Tag',
        'デモデー',
        'يوم العرض',
    ],
    [
        timed('workshop', 23, time(9), time(12), '#ce4534'),
        'Workshop',
        'Workshop',
        'ワークショップ',
        'ورشة عمل',
    ],
    [
        allDay('hackathon', date(26), date(27), '#d32f2f'),
        'Hackathon',
        'Hackathon',
        'ハッカソン',
        'هاكاثون',
    ],
    [
        timed('release', 24, time(16), time(17), '#2e7d32'),
        'Release',
        'Release',
        'リリース',
        'إصدار',
    ],
    [
        timed('board', 10, time(13), time(14, 30), '#8e46ad'),
        'Board Sync',
        'Board-Sync',
        '役員会議',
        'اجتماع المجلس',
    ],
];
const entries = (locale) => {
    const index = ['en', 'de', 'ja', 'ar'].indexOf(locale) + 1;
    return [
        ...samples.map(([entry, ...labels]) => ({ ...entry, heading: labels[index - 1] })),
        ...[1, 2, 4, 5, 6, 8, 9, 10, 12].map((month) => ({
            ...allDay(
                `planning-${month}`,
                date(month + 4, month),
                date(month + 5, month),
                '#397cce',
            ),
            heading: samples[9][index],
        })),
    ];
};

const html = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kalendus showcase</title>
<style>
    * { box-sizing: border-box; }
    html { color-scheme: light; }
    html[data-dark] { color-scheme: dark; }
    body { margin: 0; background: Canvas; color: CanvasText; font: 16px/1.4 system-ui, sans-serif; }
    main { display: grid; grid-template-rows: auto minmax(0, 1fr); gap: 12px; padding: 16px; block-size: 100dvb; }
    header { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    h1 { font-size: 20px; margin: 0; }
    #caption { margin: 0; font-weight: 600; }
    lms-calendar { min-block-size: 0; }
    lms-calendar[data-view-mode="month"] { align-self: start; }
</style>
<main>
    <header><h1>Kalendus</h1><p id="caption"></p></header>
    <lms-calendar locale="en"></lms-calendar>
</main>
<script src="./kalendus.iife.js"></script>
</html>`;

const scenes = [
    { caption: 'Views · Month', mode: 'month', dwell: 1.6 },
    { caption: 'Views · Week', mode: 'week', dwell: 1.6 },
    { caption: 'Views · Day', mode: 'day', dwell: 1.6 },
    { caption: 'Views · Year', mode: 'year', dwell: 1.6 },
    ...themes.map((theme) => ({
        caption: `Themes · ${theme[0].toUpperCase()}${theme.slice(1)}`,
        mode: 'month',
        theme,
    })),
    { caption: 'Locales · Deutsch', locale: 'de' },
    { caption: 'Locales · 日本語', locale: 'ja' },
    { caption: 'Locales · العربية (RTL)', locale: 'ar', dwell: 1.4 },
    { caption: 'Configuration · Sunday start', firstDay: 0 },
    { caption: 'Navigation · Next month', nav: 'Next', month: 12, firstDay: 0 },
    { caption: 'Navigation · Previous month', nav: 'Previous', month: 11, firstDay: 0 },
    { caption: 'Day · Week · Month · Year', title: 'Kalendus', dwell: 1.4 },
];

execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
execFileSync('bun', ['run', 'build:iife'], { cwd: root, stdio: 'inherit' });
const work = mkdtempSync(join(tmpdir(), 'kalendus-showcase-'));
let server;
let browser;
try {
    const site = join(work, 'site');
    mkdirSync(site);
    copyFileSync(join(root, 'dist/kalendus.iife.js'), join(site, 'kalendus.iife.js'));
    for (const theme of themes) {
        copyFileSync(join(root, `dist/themes/${theme}.css`), join(site, `${theme}.css`));
    }
    writeFileSync(join(site, 'index.html'), html);
    server = await preview({
        root: realpathSync(work),
        configFile: false,
        build: { outDir: 'site' },
        preview: { host: '127.0.0.1', port: 0 },
    });
    browser = await chromium.launch();
    const page = await browser.newPage({
        viewport: { width: 1120, height: 780 },
        deviceScaleFactor: 2,
        reducedMotion: 'reduce',
        colorScheme: 'light',
        timezoneId: 'UTC',
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.setFixedTime(new Date('2026-11-17T12:00:00Z'));
    await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/`);
    const calendar = page.locator('lms-calendar');
    await expect(calendar.locator('lms-calendar-month')).toBeVisible();
    await calendar.evaluate((node, date) => {
        node.activeDate = date;
    }, active);

    const afterLayout = () =>
        page.evaluate(async () => {
            await document.fonts.ready;
            await new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(resolve)),
            );
        });
    const frames = [];
    for (const scene of scenes) {
        const {
            mode = 'month',
            locale = 'en',
            firstDay = 1,
            theme,
            nav,
            month,
            title,
            caption,
            dwell = 1.2,
        } = scene;
        await calendar.evaluate(
            async (node, { mode, locale, firstDay, theme, caption, title, entries }) => {
                const old = document.querySelector('#theme');
                if (old?.dataset.theme !== theme) old?.remove();
                if (theme && !document.querySelector('#theme')) {
                    const link = document.createElement('link');
                    link.id = 'theme';
                    link.dataset.theme = theme;
                    link.rel = 'stylesheet';
                    link.href = `./${theme}.css`;
                    await new Promise((resolve, reject) => {
                        link.onload = resolve;
                        link.onerror = reject;
                        document.head.append(link);
                    });
                }
                document.documentElement.toggleAttribute('data-dark', theme === 'midnight');
                document.querySelector('#caption').textContent = caption;
                node.viewMode = mode;
                node.locale = locale;
                node.firstDayOfWeek = firstDay;
                node.heading = title;
                node.entries = entries;
                await node.updateComplete;
                await node.localeReady;
            },
            {
                mode,
                locale,
                firstDay,
                theme,
                caption,
                title: title ?? heading[locale],
                entries: entries(locale),
            },
        );
        if (nav) {
            await calendar
                .locator('lms-calendar-header')
                .getByRole('button', { name: nav, exact: true })
                .click();
            await expect.poll(() => calendar.evaluate((node) => node.activeDate.month)).toBe(month);
            await page.mouse.move(0, 0);
        }
        const view = calendar.locator(`lms-calendar-${mode}`);
        await expect(view).toBeVisible();
        await expect(calendar).toHaveAttribute('lang', locale);
        await expect(calendar).toHaveAttribute('dir', locale === 'ar' ? 'rtl' : 'ltr');
        // Let the calendar restore the previous view's time before framing this one.
        await afterLayout();
        if (mode === 'week' || mode === 'day') {
            const anchor = mode === 'week' ? /^Planning/ : /^Lunch & Learn/;
            await view.getByRole('button', { name: anchor }).evaluate((button) =>
                button.scrollIntoView({
                    behavior: 'instant',
                    block: 'center',
                    inline: 'nearest',
                }),
            );
            await afterLayout();
        }
        const file = `frame-${frames.length}.png`;
        await page.screenshot({ path: join(work, file), animations: 'disabled' });
        frames.push({ file, dwell });
        console.log(`${frames.length}/${scenes.length} ${caption}`);
    }
    expect(errors).toEqual([]);

    const ffmpeg = (args) =>
        execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], {
            cwd: work,
            stdio: 'inherit',
        });
    writeFileSync(
        join(work, 'frames.txt'),
        frames.map(({ file, dwell }) => `file '${file}'\nduration ${dwell}\n`).join(''),
    );
    ffmpeg([
        '-f',
        'concat',
        '-i',
        'frames.txt',
        '-filter_complex',
        '[0:v]scale=1600:-1:flags=lanczos,split[image][colors];[colors]palettegen[palette];[image][palette]paletteuse=dither=none',
        '-fps_mode',
        'vfr',
        '-loop',
        '0',
        '-final_delay',
        String(Math.round(frames.at(-1).dwell * 100)),
        'demo.gif',
    ]);
    // Week, Year, Midnight Month and right-to-left Arabic Month give the README a static preview.
    ffmpeg([
        ...[1, 3, 8, 11].flatMap((index) => ['-i', frames[index].file]),
        '-filter_complex',
        '[0]scale=640:-1[a];[1]scale=640:-1[b];[2]scale=640:-1[c];[3]scale=640:-1[d];[a][b][c][d]xstack=inputs=4:layout=0_0|w0+8_0|0_h0+8|w0+8_h0+8:fill=0xbcc5d2',
        '-frames:v',
        '1',
        'demo-preview.png',
    ]);
    for (const file of ['demo.gif', 'demo-preview.png']) {
        copyFileSync(join(work, file), join(root, 'assets', file));
    }
    console.log('Wrote assets/demo.gif and assets/demo-preview.png.');
} finally {
    await browser?.close();
    await server?.close();
    rmSync(work, { recursive: true, force: true });
}
