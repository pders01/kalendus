import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
    copyFileSync,
    mkdtempSync,
    readFileSync,
    mkdirSync,
    readdirSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

import { chromium, firefox, webkit } from 'playwright';
import { build, preview } from 'vite';

const root = resolve('.');
const temporary = mkdtempSync(join(tmpdir(), 'kalendus-consumers-'));
function run(command, args, cwd = root) {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
    if (result.error) throw result.error;
    if (result.status !== 0)
        throw new Error(`${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
}
function docsExample(path, section, language) {
    const markdown = readFileSync(join(root, path), 'utf8');
    const heading = `\n${section}\n`;
    assert.ok(markdown.includes(heading), `Missing ${section} in ${path}`);
    const body = markdown.split(heading)[1];
    const snippet = body.match(/^```(\w+)\n([\s\S]*?)\n```$/m);
    assert.equal(snippet?.[1], language, `Missing ${language} example for ${section}`);
    return snippet[2];
}

async function checkRuntime(consumer, installed) {
    const staticDir = join(consumer, 'public', 'static-recipe');
    mkdirSync(staticDir, { recursive: true });
    copyFileSync(join(installed, 'dist', 'kalendus.iife.js'), join(staticDir, 'kalendus.iife.js'));
    const staticRecipe = docsExample('docs/integration-guide.md', '## Vanilla JS / HTML', 'html');
    writeFileSync(join(staticDir, 'index.html'), staticRecipe);
    writeFileSync(
        join(staticDir, 'year.html'),
        staticRecipe.replace(
            '</body>',
            `${docsExample('README.md', '### Year View Controls', 'html')}</body>`,
        ),
    );
    writeFileSync(
        join(consumer, 'quick-start.html'),
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>README quick start</title><body><script type="module" src="/quick-start.ts"></script></body></html>',
    );
    writeFileSync(
        join(consumer, 'index.html'),
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>Package smoke test</title><body><script type="module" src="/calendar.js"></script></body></html>',
    );
    writeFileSync(
        join(consumer, 'calendar.js'),
        `
import Calendar from '@jpahd/kalendus';
import '@jpahd/kalendus/themes/default.css';
const calendar = document.createElement('lms-calendar');
const states = [];
calendar.addEventListener('calendar-state-change', event => states.push(event.detail));
const date = { year: 2026, month: 11, day: 17 };
calendar.initialDate = date;
calendar.locale = 'ar';
calendar.entries = [{ id: 'workshop', kind: 'timed', heading: 'Packed workshop', content: '',
    date: { start: date, end: date }, time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } } }];
calendar.monthPresentation = 'presence';
calendar.monthAgendaPresentation = 'accordion';
calendar.style.cssText = 'width: 390px; height: 750px';
document.body.append(calendar);
window.smoke = { calendar, states, registered: calendar instanceof Calendar,
    async propose() {
        const { enableEntryInteractions } = await import('@jpahd/kalendus/entry-interactions');
        const edits = enableEntryInteractions(calendar);
        let request;
        calendar.addEventListener('entry-change-request', event => { request = event.detail; }, { once: true });
        const entry = calendar.entries[0];
        const proposed = edits.requestChange(entry, { kind: 'resize', edge: 'end' }, 15);
        edits.dispose();
        return proposed && request?.entry === entry && request?.proposed.time.end.minute === 15 &&
            entry.time.end.minute === 0 && calendar.entries[0] === entry;
    } };
`,
    );
    const config = { root: realpathSync(consumer), configFile: false, logLevel: 'error' };
    await build({
        ...config,
        build: {
            rollupOptions: {
                input: [join(config.root, 'index.html'), join(config.root, 'quick-start.html')],
            },
        },
    });
    const server = await preview({ ...config, preview: { host: '127.0.0.1', port: 0 } });
    try {
        const url = `http://127.0.0.1:${server.httpServer.address().port}/`;
        const engines = { chromium, firefox, webkit };
        for (const name of (process.env.TEST_BROWSERS || 'chromium').split(',')) {
            assert.ok(Object.hasOwn(engines, name), `Unknown browser: ${name}`);
            const browser = await engines[name].launch();
            try {
                const page = await browser.newPage({ viewport: { width: 440, height: 830 } });
                const errors = [];
                page.on('pageerror', (error) => errors.push(error.message));
                await page.goto(url);
                await page.evaluate(async () => {
                    await window.smoke.calendar.localeReady;
                    await window.smoke.calendar.updateComplete;
                });
                assert.equal(await page.evaluate(() => window.smoke.registered), true);
                assert.equal(await page.evaluate(() => window.smoke.propose()), true);
                const calendar = page.locator('lms-calendar');
                assert.equal(await calendar.getAttribute('dir'), 'rtl');
                await calendar.locator('.indicator[data-date="2026-11-17"]').click();
                await calendar.locator('.agenda-event').getByText('Packed workshop').waitFor();
                await page.waitForFunction(
                    () => window.smoke.states.at(-1)?.range.end === '2026-11-18',
                );
                await calendar.locator('lms-calendar-header [data-context="week"]').click();
                await calendar.locator('lms-calendar-week').waitFor();
                await page.goto(`${url}quick-start.html`);
                const quickStart = page.locator('lms-calendar');
                await quickStart.locator('lms-calendar-month').waitFor();
                assert.equal(await quickStart.evaluate((node) => node.activeDate.day), 17);
                assert.equal(
                    await quickStart.evaluate((node) => node.entries[0]?.heading),
                    'Studio check-in',
                );

                await page.goto(`${url}static-recipe/index.html`);
                const recipe = page.locator('#demo');
                await recipe.locator('lms-calendar-month').waitFor();
                assert.equal(
                    await recipe.evaluate((node) => node.entries[0]?.heading),
                    'Open studio',
                );
                await page.goto(`${url}static-recipe/year.html`);
                const year = page.locator('lms-calendar[view-mode="year"]');
                await year.locator('lms-calendar-year').waitFor();
                assert.equal(await year.evaluate((node) => node.yearDensityMode), 'heatmap');
                assert.equal(await year.evaluate((node) => node.yearDrillTarget), 'day');
                assert.deepEqual(errors, []);
                console.log(
                    `PASS packed ${name} runtime: lazy locale, Month → Agenda → Week and README/static recipes`,
                );
            } finally {
                await browser.close();
            }
        }
    } finally {
        await server.close();
    }
}

try {
    run('bun', ['pm', 'pack', '--destination', temporary]);
    const archive = readdirSync(temporary).find((name) => name.endsWith('.tgz'));
    if (!archive) throw new Error('Package archive was not produced');
    const consumer = join(temporary, 'consumer');
    const dependencies = join(consumer, 'node_modules');
    const installed = join(dependencies, '@jpahd', 'kalendus');
    mkdirSync(installed, { recursive: true });
    run('tar', ['-xzf', join(temporary, archive), '--strip-components=1', '-C', installed]);
    // Do not expose transitive dependencies to the packed component.
    for (const dependency of ['lit', 'luxon', '@types']) {
        const target = join(dependencies, dependency);
        mkdirSync(dirname(target), { recursive: true });
        symlinkSync(join(root, 'node_modules', dependency), target, 'dir');
    }
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
    writeFileSync(
        join(consumer, 'quick-start.ts'),
        docsExample('README.md', '## Quick Usage', 'ts'),
    );
    writeFileSync(
        join(consumer, 'index.ts'),
        `
import Calendar, { type CalendarEntry, type CalendarState, type ViewMode } from '@jpahd/kalendus';
import { enableEntryInteractions, type EntryChangeRequest } from '@jpahd/kalendus/entry-interactions';
const entries: CalendarEntry[] = [{
    id: 'all-day', kind: 'all-day', heading: 'No casts needed', content: '', color: '#24558a',
    date: { start: { year: 2026, month: 3, day: 7 }, end: { year: 2026, month: 3, day: 9 } }
}];
const calendar: Calendar = document.createElement('lms-calendar');
const view: ViewMode = 'week';
calendar.entries = entries;
calendar.viewMode = view;
calendar.activeDate = { year: 2026, month: 3, day: 8 };
calendar.addEventListener('calendar-state-change', event => {
    const state: CalendarState = event.detail;
    console.log(state.range.start, state.range.end, calendar.visibleRange);
});
calendar.addEventListener('entry-activate', event => {
    console.log(event.detail.entry.id);
    event.preventDefault();
});
const edits = enableEntryInteractions(calendar, { canChange: (entry, operation) => !!entry.id && operation.kind === 'move' });
calendar.addEventListener('entry-change-request', event => {
    const detail: EntryChangeRequest = event.detail;
    if (detail.operation.kind === 'resize') console.log(detail.operation.edge);
    calendar.entries = calendar.entries.map(entry => entry === detail.entry ? detail.proposed : entry);
});
edits.requestChange(entries[0], { kind: 'move' }, 15);
edits.dispose();
`,
    );
    for (const moduleResolution of ['Bundler', 'NodeNext']) {
        const compilerOptions = {
            target: 'ES2022',
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            module: moduleResolution === 'Bundler' ? 'ESNext' : 'NodeNext',
            moduleResolution,
            strict: true,
            skipLibCheck: false,
            noEmit: true,
            types: [],
        };
        writeFileSync(
            join(consumer, 'tsconfig.json'),
            JSON.stringify({ compilerOptions, files: ['index.ts', 'quick-start.ts'] }),
        );
        run('bun', [
            join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
            '-p',
            join(consumer, 'tsconfig.json'),
        ]);
        console.log(`PASS packed ${moduleResolution} consumer (skipLibCheck=false)`);
    }
    await checkRuntime(consumer, installed);
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
