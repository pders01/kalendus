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
const minimumPeers = process.argv.includes('--minimum-peers');
const fixtureDate = { year: 2026, month: 11, day: 17 };
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
    const headingStart = markdown.indexOf(heading);
    assert.notEqual(headingStart, -1, `Missing ${section} in ${path}`);
    const tail = markdown.slice(headingStart + heading.length);
    const nextHeading = tail.search(/^#{1,6} /m);
    const sectionBody = nextHeading === -1 ? tail : tail.slice(0, nextHeading);
    const snippet = [...sectionBody.matchAll(/^```(\w+)\n([\s\S]*?)\n```$/gm)].find(
        ([, lang]) => lang === language,
    );
    assert.ok(snippet, `Missing ${language} example for ${section} in ${path}`);
    return snippet[2];
}

async function expectCatalog(page, locale, catalogLocale) {
    await page.evaluate(() => window.smoke.calendar.localeReady);
    const calendar = page.locator('lms-calendar');
    assert.equal(await calendar.getAttribute('dir'), locale === 'ar' ? 'rtl' : 'ltr');
    assert.equal(await calendar.getAttribute('lang'), catalogLocale);
    assert.deepEqual(await page.evaluate(() => window.smoke.localeResults.at(-1)), {
        locale,
        catalogLocale,
        fallback: locale !== catalogLocale,
    });
    await calendar
        .getByRole('button', { name: catalogLocale === 'ar' ? 'أسبوع' : 'Week', exact: true })
        .waitFor();
}

async function expectEnglishMount(page) {
    await expectCatalog(page, 'en', 'en');
    const calendar = page.locator('lms-calendar');
    await calendar.locator('lms-calendar-month').waitFor();
    assert.deepEqual(await calendar.evaluate((element) => element.activeDate), fixtureDate);
}

async function requestArabic(page) {
    await page.evaluate(() => {
        window.smoke.calendar.locale = 'ar';
    });
}

async function checkLocaleOutage(browser, url, chunkUrl, localeProbe) {
    const page = await browser.newPage();
    localeProbe.path = new URL(chunkUrl).pathname;
    localeProbe.unavailable = true;
    const responses = localeProbe.responses;
    responses.length = 0;
    try {
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(url);
        await expectEnglishMount(page);
        assert.deepEqual(responses, [], 'English mount fetched the outage chunk');
        await requestArabic(page);
        await expectCatalog(page, 'ar', 'en');
        assert.ok(
            responses.includes(503),
            `Expected the locale server to return 503: ${responses}`,
        );
        assert.deepEqual(await page.evaluate(() => window.smoke.localeErrors), ['ar']);
        const calendar = page.locator('lms-calendar');
        const retry = calendar.getByRole('button', { name: 'Retry translations', exact: true });
        await retry.waitFor();
        await calendar.getByRole('button', { name: 'Week', exact: true }).click();
        await calendar.locator('lms-calendar-week').waitFor();

        localeProbe.unavailable = false;
        const responsesBeforeRetry = responses.length;
        const resultsBeforeRetry = await page.evaluate(() => window.smoke.localeResults.length);
        await page.evaluate(() => window.smoke.calendar.retryLocale());
        const { length, fallback } = await page.evaluate(() => ({
            length: window.smoke.localeResults.length,
            fallback: window.smoke.localeResults.at(-1)?.fallback,
        }));
        assert.equal(length, resultsBeforeRetry + 1, 'The retry did not settle with a new result');
        // The browser may retain a failed module in this document's module map.
        // Verify the observed retry result without requiring a new network request.
        await expectCatalog(page, 'ar', fallback ? 'en' : 'ar');
        assert.deepEqual(
            await page.evaluate(() => window.smoke.localeErrors),
            fallback ? ['ar', 'ar'] : ['ar'],
        );
        assert.equal(await calendar.evaluate((element) => element.viewMode), 'week');
        assert.deepEqual(await calendar.evaluate((element) => element.activeDate), fixtureDate);
        console.log(
            `  After HTTP 503: same-document retry ${fallback ? 'kept English fallback' : 'loaded Arabic'}; chunk responses: ${responses.length - responsesBeforeRetry}`,
        );

        await page.reload();
        await expectEnglishMount(page);
        const responsesBeforeReloadLoad = responses.length;
        await requestArabic(page);
        await expectCatalog(page, 'ar', 'ar');
        assert.ok(
            responses.slice(responsesBeforeReloadLoad).includes(200),
            'Reload did not fetch a healthy catalog',
        );
        assert.deepEqual(await page.evaluate(() => window.smoke.localeErrors), []);
        assert.deepEqual(errors, []);
    } finally {
        localeProbe.path = '';
        localeProbe.unavailable = false;
        await page.close();
    }
}

async function checkThemingExample(page, calendar) {
    const example = docsExample('docs/theming.md', '### Quick Examples', 'css');
    await page.addStyleTag({ content: `:root { color-scheme: light dark; }\n${example}` });
    for (const colorScheme of ['dark', 'light']) {
        await page.emulateMedia({ colorScheme });
        const contrast = await calendar.evaluate((host) => {
            const header = host.shadowRoot.querySelector('lms-calendar-header');
            const period = header.shadowRoot.querySelector('.view-detail.active');
            const surface = host.shadowRoot.querySelector('.calendar-container');
            const pixel = document
                .createElement('canvas')
                .getContext('2d', { willReadFrequently: true });
            const luminance = ([r, g, b]) =>
                [r, g, b].reduce((total, value, index) => {
                    const channel = value / 255;
                    const linear =
                        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
                    return total + linear * [0.2126, 0.7152, 0.0722][index];
                }, 0);
            pixel.fillStyle = getComputedStyle(surface).backgroundColor;
            pixel.fillRect(0, 0, 1, 1);
            const background = luminance(pixel.getImageData(0, 0, 1, 1).data);
            pixel.fillStyle = getComputedStyle(period).color;
            pixel.fillRect(0, 0, 1, 1);
            const foreground = luminance(pixel.getImageData(0, 0, 1, 1).data);
            return (
                (Math.max(background, foreground) + 0.05) /
                (Math.min(background, foreground) + 0.05)
            );
        });
        assert.ok(
            contrast >= 4.5,
            `Theming example period contrast in ${colorScheme}: ${contrast}`,
        );
    }
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
        '<!doctype html><html lang="en"><meta charset="utf-8"><title>Library Usage quick start</title><body><script type="module" src="/quick-start.ts"></script></body></html>',
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
const localeResults = [];
const localeErrors = [];
calendar.addEventListener('calendar-state-change', event => states.push(event.detail));
calendar.addEventListener('locale-ready', event => localeResults.push(event.detail));
calendar.addEventListener('locale-error', event => localeErrors.push(event.detail.locale));
const date = ${JSON.stringify(fixtureDate)};
calendar.activeDate = date;
calendar.locale = 'en';
calendar.entries = [{ id: 'workshop', kind: 'timed', heading: 'Packed workshop', content: '',
    date: { start: date, end: date }, time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } } }];
calendar.monthPresentation = 'presence';
calendar.monthAgendaPresentation = 'accordion';
calendar.style.cssText = 'width: 390px; height: 750px';
document.body.append(calendar);
window.smoke = { calendar, states, localeResults, localeErrors, registered: calendar instanceof Calendar,
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
    const localeProbe = { path: '', unavailable: false, responses: [] };
    const server = await preview({
        ...config,
        preview: { host: '127.0.0.1', port: 0 },
        plugins: [
            {
                name: 'packed-locale-outage',
                configurePreviewServer({ middlewares }) {
                    middlewares.use((req, res, next) => {
                        const path = req.url?.split('?')[0];
                        if (!/\/locales-[^/]+\.js$/.test(path ?? '')) return next();
                        // Use a real HTTP response, without Playwright network interception.
                        // Avoid HTTP caching while leaving the browser's module map alone.
                        res.setHeader('Cache-Control', 'no-store');
                        if (path !== localeProbe.path) return next();
                        res.once('finish', () => localeProbe.responses.push(res.statusCode));
                        if (!localeProbe.unavailable) return next();
                        res.writeHead(503, { 'Content-Type': 'text/plain' });
                        res.end('Locale catalog unavailable');
                    });
                },
            },
        ],
    });
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
                const localeChunks = new Set();
                page.on('request', (request) => {
                    const resource = request.url();
                    if (/\/locales-[^/]+\.js$/.test(resource)) localeChunks.add(resource);
                });
                await page.goto(url);
                await expectEnglishMount(page);
                assert.equal(localeChunks.size, 0, 'English mount requested a locale chunk');
                await requestArabic(page);
                await expectCatalog(page, 'ar', 'ar');
                assert.deepEqual(await page.evaluate(() => window.smoke.localeErrors), []);
                assert.equal(localeChunks.size, 1, 'Expected one lazy locale chunk for Arabic');
                const [arabicChunkUrl] = localeChunks;
                assert.equal(await page.evaluate(() => window.smoke.registered), true);
                assert.equal(await page.evaluate(() => window.smoke.propose()), true);
                const calendar = page.locator('lms-calendar');
                await calendar.locator('.indicator[data-date="2026-11-17"]').click();
                await calendar.locator('.agenda-event').getByText('Packed workshop').waitFor();
                await page.waitForFunction(
                    () => window.smoke.states.at(-1)?.range.end === '2026-11-18',
                );
                await calendar.getByRole('button', { name: 'أسبوع', exact: true }).click();
                await calendar.locator('lms-calendar-week').waitFor();

                // Exercise the decorated state and event routing of the new panel
                // against external Lit, not just Storybook's source modules.
                await calendar.evaluate((element) => {
                    element.viewMode = 'day';
                    const date = element.activeDate;
                    element.entries = Array.from({ length: 6 }, (_, index) => ({
                        id: `dense-${index}`,
                        heading: `Packed event ${index + 1}`,
                        kind: 'timed',
                        date: { start: date, end: date },
                        time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
                    }));
                });
                const group = calendar.locator('.time-group');
                await group.click();
                const panel = calendar.locator('#timed-panel');
                await panel.getByText('Packed event 1', { exact: true }).waitFor();
                assert.equal(await panel.getByRole('listitem').count(), 6);
                assert.equal(await calendar.locator('lms-calendar-day').count(), 1);
                await page.keyboard.press('Escape');
                await panel.waitFor({ state: 'detached' });
                assert.equal(await group.getAttribute('aria-expanded'), 'false');

                const collection = { entries: [{ id: 'bad-collection' }] };
                const issues = await calendar.evaluate(async (element, input) => {
                    let issues;
                    element.addEventListener(
                        'entries-invalid',
                        (event) => {
                            issues = event.detail.issues;
                        },
                        { once: true },
                    );
                    Reflect.set(element, 'entries', input);
                    await element.updateComplete;
                    return issues;
                }, collection);
                assert.deepEqual(issues, [
                    { index: -1, entry: collection, reason: 'Entries must be an array' },
                ]);
                await group.waitFor({ state: 'detached' });

                await page.goto(`${url}quick-start.html`);
                const quickStart = page.locator('lms-calendar');
                await quickStart.locator('lms-calendar-month').waitFor();
                assert.equal(await quickStart.evaluate((node) => node.activeDate.day), 17);
                assert.equal(
                    await quickStart.evaluate((node) => node.entries[0]?.heading),
                    'Studio check-in',
                );
                await quickStart.getByText('Studio check-in', { exact: true }).waitFor();
                await checkThemingExample(page, quickStart);

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
                await checkLocaleOutage(browser, url, arabicChunkUrl, localeProbe);
                console.log(
                    `PASS packed ${name} runtime: lazy Arabic catalog, HTTP 503 fallback and recovery after reload, Month → Agenda → Week, timed inspector, bad collection diagnostic, displayed quick start/static HTML, and Theming recipe contrast`,
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
    const tarball = join(temporary, archive);
    const packageJson = (directory) =>
        JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'));
    mkdirSync(consumer);
    writeFileSync(
        join(consumer, 'package.json'),
        JSON.stringify({ private: true, type: 'module' }),
    );
    const declaredPeers = packageJson(root).peerDependencies;
    const peers = Object.keys(declaredPeers);
    if (minimumPeers) {
        const floors = peers.map((name) => {
            const match = /^\^(\d+\.\d+\.\d+)$/.exec(declaredPeers[name]);
            assert.ok(match, `Set an explicit test floor for ${name}: ${declaredPeers[name]}`);
            return [name, match[1]];
        });
        run(
            'bun',
            ['add', '--exact', tarball, ...floors.map(([name, floor]) => `${name}@${floor}`)],
            consumer,
        );
        for (const [name, floor] of floors) {
            assert.equal(packageJson(join(dependencies, name)).version, floor);
        }
    } else {
        mkdirSync(installed, { recursive: true });
        run('tar', ['-xzf', tarball, '--strip-components=1', '-C', installed]);
        // Expose only declared peers, not unrelated workspace dependencies.
        for (const name of peers) {
            const target = join(dependencies, name);
            mkdirSync(dirname(target), { recursive: true });
            symlinkSync(join(root, 'node_modules', name), target, 'dir');
        }
    }
    const types = join(dependencies, '@types', 'luxon');
    mkdirSync(dirname(types), { recursive: true });
    symlinkSync(join(root, 'node_modules', '@types', 'luxon'), types, 'dir');
    const versions = peers.map(
        (name) => `${name}@${packageJson(join(dependencies, name)).version}`,
    );
    console.log(
        `Checking packed consumer with ${minimumPeers ? 'minimum' : 'locked'} peers: ${versions.join(', ')}`,
    );
    const quickStart = docsExample('docs/library-usage.md', '# Using Kalendus as a Library', 'ts');
    assert.equal(
        docsExample('README.md', '## Quick Usage', 'ts'),
        quickStart,
        'README and Library Usage must show the same runnable quick start',
    );
    writeFileSync(join(consumer, 'quick-start.ts'), quickStart);
    writeFileSync(
        join(consumer, 'documented-edits.ts'),
        docsExample('docs/events.md', '## Entry change requests (opt-in)', 'ts'),
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
calendar.addEventListener('entries-invalid', event => {
    for (const { index, reason } of event.detail.issues) console.log(index, reason);
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
            JSON.stringify({
                compilerOptions,
                files: ['index.ts', 'quick-start.ts', 'documented-edits.ts'],
            }),
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
