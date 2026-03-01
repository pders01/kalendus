/**
 * Record a comprehensive demo GIF of the calendar.
 *
 * Showcases all views, all themes, multiple locales, and configuration
 * options across 15 scenes (~18s). Doubles as a manual e2e smoke test.
 *
 * Spins up a Vite dev server, creates a temp HTML page with diverse
 * sample entries, uses Playwright's recordVideo to capture the sequence,
 * then converts WebM → GIF with ffmpeg (two-pass palette).
 *
 * Prerequisites: ffmpeg must be installed (brew install ffmpeg).
 *
 * Run: pnpm demo:gif
 */

import { chromium } from 'playwright';
import { createServer } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync, readFileSync, mkdirSync, rmSync } from 'fs';
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

// ── Read theme CSS from source (no stale copies) ────────────────────
const readTheme = (name) =>
    readFileSync(resolve(root, `src/themes/${name}.css`), 'utf-8').replace(
        /^lms-calendar\s*\{/m,
        `.theme-${name} lms-calendar {`,
    );

const themes = ['default', 'ink', 'soft', 'brutalist', 'midnight'];
// Note: the demo starts *unstyled* (no theme class on the wrapper).
// The 'default' theme is included so Act 2 can showcase it alongside the others.
const allThemeCSS = themes.map(readTheme).join('\n\n');

// ── Sample entries (spread across current month) ─────────────────────

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;
const currentDay = new Date().getDate();

/** Clamp day to stay within the month (safe for any month) */
const d = (offset) => Math.max(1, Math.min(currentDay + offset, 28));

const sampleEntries = JSON.stringify([
    // ── Today: overlapping entries (overlap handling demo) ──────────
    {
        heading: 'Morning Standup',
        content: 'Daily team sync',
        color: '#1976d2',
        isContinuation: false,
        date: {
            start: { day: currentDay, month: currentMonth, year: currentYear },
            end: { day: currentDay, month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 30 } },
    },
    {
        heading: 'Design Review',
        content: 'UX/UI session',
        color: 'steelblue',
        isContinuation: false,
        date: {
            start: { day: currentDay, month: currentMonth, year: currentYear },
            end: { day: currentDay, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 9, minute: 15 },
            end: { hour: 10, minute: 45 },
        },
    },
    {
        heading: 'Code Review',
        content: 'PR walkthrough',
        color: 'hsl(160, 60%, 40%)',
        isContinuation: false,
        date: {
            start: { day: currentDay, month: currentMonth, year: currentYear },
            end: { day: currentDay, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 10, minute: 0 },
            end: { hour: 11, minute: 30 },
        },
    },
    {
        heading: 'Lunch & Learn',
        content: 'Web Components talk',
        color: 'coral',
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
        heading: 'Afternoon Focus',
        content: 'Deep work block',
        color: 'oklch(0.65 0.15 250)',
        isContinuation: false,
        date: {
            start: { day: currentDay, month: currentMonth, year: currentYear },
            end: { day: currentDay, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 14, minute: 0 },
            end: { hour: 16, minute: 0 },
        },
    },

    // ── Multi-day spanning events (allDay bar demo) ────────────────
    {
        heading: 'Product Sprint',
        content: 'Multi-day sprint',
        color: '#6a1b9a',
        isContinuation: false,
        date: {
            start: { day: d(-1), month: currentMonth, year: currentYear },
            end: { day: d(2), month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
    },
    {
        heading: 'Conference',
        content: 'Tech conference',
        color: 'tomato',
        isContinuation: false,
        date: {
            start: { day: d(3), month: currentMonth, year: currentYear },
            end: { day: d(5), month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
    },

    // ── Entries spread across the month (density for month/year) ───
    {
        heading: 'Team Retro',
        content: 'Sprint retrospective',
        color: 'rgb(46, 125, 50)',
        isContinuation: false,
        date: {
            start: { day: d(-3), month: currentMonth, year: currentYear },
            end: { day: d(-3), month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 15, minute: 0 },
            end: { hour: 16, minute: 0 },
        },
    },
    {
        heading: '1:1 Meeting',
        content: 'Manager sync',
        color: '#ff9800',
        isContinuation: false,
        date: {
            start: { day: d(-5), month: currentMonth, year: currentYear },
            end: { day: d(-5), month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 11, minute: 0 },
            end: { hour: 11, minute: 30 },
        },
    },
    {
        heading: 'Planning',
        content: 'Sprint planning',
        color: 'hsl(210, 70%, 50%)',
        isContinuation: false,
        date: {
            start: { day: d(4), month: currentMonth, year: currentYear },
            end: { day: d(4), month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 10, minute: 0 },
            end: { hour: 12, minute: 0 },
        },
    },
    {
        heading: 'Demo Day',
        content: 'Feature demos',
        color: '#00acc1',
        isContinuation: false,
        date: {
            start: { day: d(6), month: currentMonth, year: currentYear },
            end: { day: d(6), month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 14, minute: 0 },
            end: { hour: 15, minute: 30 },
        },
    },
    {
        heading: 'Workshop',
        content: 'Lit workshop',
        color: 'oklch(0.6 0.2 30)',
        isContinuation: false,
        date: {
            start: { day: d(8), month: currentMonth, year: currentYear },
            end: { day: d(8), month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 9, minute: 0 },
            end: { hour: 12, minute: 0 },
        },
    },
    {
        heading: 'Hackathon',
        content: 'Internal hackathon',
        color: 'rgb(211, 47, 47)',
        isContinuation: false,
        date: {
            start: { day: d(10), month: currentMonth, year: currentYear },
            end: { day: d(11), month: currentMonth, year: currentYear },
        },
        time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
    },
    {
        heading: 'Release',
        content: 'v2.0 release',
        color: '#2e7d32',
        isContinuation: false,
        date: {
            start: { day: d(7), month: currentMonth, year: currentYear },
            end: { day: d(7), month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 16, minute: 0 },
            end: { hour: 17, minute: 0 },
        },
    },
    {
        heading: 'Board Sync',
        content: 'Quarterly review',
        color: 'hsl(280, 50%, 45%)',
        isContinuation: false,
        date: {
            start: { day: d(-7), month: currentMonth, year: currentYear },
            end: { day: d(-7), month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 13, minute: 0 },
            end: { hour: 14, minute: 30 },
        },
    },
]);

// ── Translated entry labels per locale ───────────────────────────────
// Order matches the 15 entries above. Each item is [heading, content].

const entryLabels = {
    en: [
        ['Morning Standup', 'Daily team sync'],
        ['Design Review', 'UX/UI session'],
        ['Code Review', 'PR walkthrough'],
        ['Lunch & Learn', 'Web Components talk'],
        ['Afternoon Focus', 'Deep work block'],
        ['Product Sprint', 'Multi-day sprint'],
        ['Conference', 'Tech conference'],
        ['Team Retro', 'Sprint retrospective'],
        ['1:1 Meeting', 'Manager sync'],
        ['Planning', 'Sprint planning'],
        ['Demo Day', 'Feature demos'],
        ['Workshop', 'Lit workshop'],
        ['Hackathon', 'Internal hackathon'],
        ['Release', 'v2.0 release'],
        ['Board Sync', 'Quarterly review'],
    ],
    de: [
        ['Morgen-Standup', 'Tägliches Team-Sync'],
        ['Design-Review', 'UX/UI-Sitzung'],
        ['Code-Review', 'PR-Durchsprache'],
        ['Lunch & Learn', 'Vortrag Web Components'],
        ['Fokuszeit', 'Deep-Work-Block'],
        ['Produkt-Sprint', 'Mehrtägiger Sprint'],
        ['Konferenz', 'Tech-Konferenz'],
        ['Team-Retro', 'Sprint-Retrospektive'],
        ['1:1-Meeting', 'Manager-Sync'],
        ['Planung', 'Sprint-Planung'],
        ['Demo-Tag', 'Feature-Demos'],
        ['Workshop', 'Lit-Workshop'],
        ['Hackathon', 'Interner Hackathon'],
        ['Release', 'v2.0-Release'],
        ['Board-Sync', 'Quartalsbericht'],
    ],
    ja: [
        ['朝会', 'チーム同期'],
        ['デザインレビュー', 'UX/UIセッション'],
        ['コードレビュー', 'PRウォークスルー'],
        ['ランチ勉強会', 'Web Componentsの話'],
        ['集中タイム', 'ディープワーク'],
        ['プロダクトスプリント', '複数日スプリント'],
        ['カンファレンス', 'テックカンファレンス'],
        ['チーム振り返り', 'スプリント振り返り'],
        ['1on1ミーティング', 'マネージャー同期'],
        ['プランニング', 'スプリント計画'],
        ['デモデー', '機能デモ'],
        ['ワークショップ', 'Litワークショップ'],
        ['ハッカソン', '社内ハッカソン'],
        ['リリース', 'v2.0リリース'],
        ['役員会議', '四半期レビュー'],
    ],
    ar: [
        ['اجتماع الصباح', 'مزامنة الفريق'],
        ['مراجعة التصميم', 'جلسة UX/UI'],
        ['مراجعة الكود', 'مراجعة PR'],
        ['غداء تعليمي', 'محادثة Web Components'],
        ['وقت التركيز', 'عمل معمّق'],
        ['سباق المنتج', 'سباق متعدد الأيام'],
        ['مؤتمر', 'مؤتمر تقني'],
        ['استعراض الفريق', 'استعراض السبرنت'],
        ['اجتماع فردي', 'مزامنة المدير'],
        ['تخطيط', 'تخطيط السبرنت'],
        ['يوم العرض', 'عروض الميزات'],
        ['ورشة عمل', 'ورشة Lit'],
        ['هاكاثون', 'هاكاثون داخلي'],
        ['إصدار', 'إصدار v2.0'],
        ['اجتماع المجلس', 'مراجعة ربع سنوية'],
    ],
};

const serializedLabels = JSON.stringify(entryLabels);

// ── HTML template ────────────────────────────────────────────────────

const testHTML = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=960">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #f5f5f5;
            padding: 16px;
            transition: background-color 0.3s;
        }
        #wrapper { position: relative; }
        lms-calendar {
            display: block;
            height: 608px;
        }
        #label {
            position: absolute;
            bottom: 8px;
            right: 8px;
            font: 11px/1 monospace;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            z-index: 9999;
            pointer-events: none;
        }
        ${allThemeCSS}
    </style>
</head>
<body>
    <div id="wrapper">
        <div id="label">Month</div>
        <lms-calendar></lms-calendar>
    </div>
    <script type="module">
        import './src/lms-calendar.ts';

        async function init() {
            await customElements.whenDefined('lms-calendar');
            const cal = document.querySelector('lms-calendar');
            const wrapper = document.getElementById('wrapper');
            const label = document.getElementById('label');

            cal.heading = 'My Calendar';
            cal.activeDate = { day: ${currentDay}, month: ${currentMonth}, year: ${currentYear} };
            cal.entries = ${sampleEntries};
            await cal.updateComplete;

            // ── In-page helpers ──────────────────────────────────
            window.__switchView = async (view) => {
                const header = cal.shadowRoot.querySelector('lms-calendar-header');
                const btn = header.shadowRoot.querySelector('[data-context="' + view + '"]');
                if (btn) btn.click();
                await new Promise(r => setTimeout(r, 600));
            };

            window.__navigateNext = async () => {
                const header = cal.shadowRoot.querySelector('lms-calendar-header');
                const btn = header.shadowRoot.querySelector('[name="next"]');
                if (btn) btn.click();
                await new Promise(r => setTimeout(r, 600));
            };

            window.__navigatePrevious = async () => {
                const header = cal.shadowRoot.querySelector('lms-calendar-header');
                const btn = header.shadowRoot.querySelector('[name="previous"]');
                if (btn) btn.click();
                await new Promise(r => setTimeout(r, 600));
            };

            window.__switchTheme = (name) => {
                wrapper.className = name ? 'theme-' + name : '';
                document.body.style.backgroundColor =
                    name === 'midnight' ? '#121220' : '#f5f5f5';
            };

            window.__setLocale = (locale) => {
                cal.locale = locale;
                document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
            };

            window.__setFirstDayOfWeek = (n) => {
                cal.firstDayOfWeek = n;
            };

            window.__setHeading = (text) => {
                cal.heading = text;
            };

            window.__setLabel = (text) => {
                label.textContent = text;
            };

            const __entryLabels = ${serializedLabels};
            window.__localizeEntries = (locale) => {
                const labels = __entryLabels[locale] || __entryLabels.en;
                cal.entries = cal.entries.map((entry, i) => ({
                    ...entry,
                    heading: labels[i][0],
                    content: labels[i][1],
                }));
            };

            window.__calReady = true;
        }
        init();
    </script>
</body>
</html>`;

// ── Scene definitions ────────────────────────────────────────────────

const scenes = [
    // Act 1 — Views (unstyled base, English)
    { label: 'Month', action: null, dwell: 1500 },
    {
        label: 'Week',
        action: () => window.__switchView('week'),
        dwell: 1500,
    },
    {
        label: 'Day',
        action: () => window.__switchView('day'),
        dwell: 1500,
    },
    {
        label: 'Year',
        action: () => window.__switchView('year'),
        dwell: 1500,
    },

    // Act 2 — Themes (switch back to month first)
    {
        label: 'Default',
        action: async () => {
            await window.__switchView('month');
            window.__switchTheme('default');
        },
        dwell: 1200,
    },
    {
        label: 'Ink',
        action: () => window.__switchTheme('ink'),
        dwell: 1200,
    },
    {
        label: 'Soft',
        action: () => window.__switchTheme('soft'),
        dwell: 1200,
    },
    {
        label: 'Brutalist',
        action: () => window.__switchTheme('brutalist'),
        dwell: 1200,
    },
    {
        label: 'Midnight',
        action: () => window.__switchTheme('midnight'),
        dwell: 1500,
    },

    // Act 3 — Locales (reset to unstyled base, month view)
    {
        label: 'Deutsch',
        action: () => {
            window.__switchTheme(null);
            window.__setLocale('de');
            window.__setHeading('Mein Kalender');
            window.__localizeEntries('de');
        },
        dwell: 1200,
    },
    {
        label: '日本語',
        action: () => {
            window.__setLocale('ja');
            window.__setHeading('カレンダー');
            window.__localizeEntries('ja');
        },
        dwell: 1200,
    },
    {
        label: 'العربية',
        action: () => {
            window.__setLocale('ar');
            window.__setHeading('التقويم');
            window.__localizeEntries('ar');
        },
        dwell: 1200,
    },

    // Act 4 — Configuration & Outro
    {
        label: 'Sunday Start',
        action: () => {
            window.__setLocale('en');
            window.__setHeading('My Calendar');
            window.__localizeEntries('en');
            window.__setFirstDayOfWeek(0);
        },
        dwell: 1200,
    },
    {
        label: 'Navigate →',
        action: () => window.__navigateNext(),
        dwell: 1000,
    },
    {
        label: 'Navigate ←',
        action: () => window.__navigatePrevious(),
        dwell: 800,
    },
    {
        label: 'Kalendus',
        action: () => {
            window.__setFirstDayOfWeek(1);
            window.__setHeading('Kalendus');
        },
        dwell: 1000,
    },
];

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

        console.log(`Recording demo (${scenes.length} scenes)...`);

        for (let i = 0; i < scenes.length; i++) {
            const scene = scenes[i];
            console.log(`  ${i + 1}/${scenes.length} ${scene.label}`);

            // Set the label first so it's visible during the scene
            await page.evaluate((lbl) => window.__setLabel(lbl), scene.label);

            if (scene.action) {
                // Serialize the action as a string and evaluate it in the page
                await page.evaluate(scene.action);
                // Small settle time for Lit re-render
                await page.waitForTimeout(300);
            }

            await page.waitForTimeout(scene.dwell);
        }

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

    // Pass 1: generate optimal palette (128 colors for file size)
    execSync(
        `ffmpeg -y -i "${videoPath}" -vf "fps=12,scale=800:-1:flags=lanczos,palettegen=max_colors=128" "${palettePath}"`,
        { stdio: 'inherit' },
    );

    // Pass 2: apply palette with bayer dithering (better gradients for midnight theme)
    execSync(
        `ffmpeg -y -i "${videoPath}" -i "${palettePath}" -lavfi "fps=12,scale=800:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3" "${gifPath}"`,
        { stdio: 'inherit' },
    );

    console.log(`GIF saved to ${gifPath}`);

    // ── Cleanup ──────────────────────────────────────────────────────
    rmSync(htmlPath, { force: true });
    rmSync(videoDir, { recursive: true, force: true });

    await server.close();
    console.log('Done!');
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
