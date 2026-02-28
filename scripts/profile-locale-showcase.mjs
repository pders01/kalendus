/**
 * CPU + Layout profiling script for the Locale Showcase story (19 concurrent calendars).
 * Uses Playwright + Chrome DevTools Protocol Tracing to capture a detailed performance trace,
 * then aggregates the top self-time functions and layout/paint costs.
 *
 * Usage: node scripts/profile-locale-showcase.mjs
 * Prereq: Storybook running on localhost:6006
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const STORYBOOK_URL = 'http://localhost:6006';
const LOCALE_SHOWCASE_URL = `${STORYBOOK_URL}/iframe.html?id=components-kalendus--locale-showcase&viewMode=story`;

async function main() {
    console.log('Launching browser (headed for accurate perf)...');
    const browser = await chromium.launch({
        headless: false,
        args: ['--disable-extensions', '--disable-background-timer-throttling'],
    });
    const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);

    // ── Profile 1: Initial page load with 19 calendars ──
    console.log('\n=== Profile 1: Initial page load (19 calendars) ===');
    await cdp.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'v8.execute',
            'blink.user_timing',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-v8.cpu_profiler',
        ].join(','),
        options: 'sampling-frequency=10000', // 10kHz sampling
    });

    await page.goto(LOCALE_SHOWCASE_URL, { waitUntil: 'networkidle' });
    await page.waitForSelector('lms-calendar', { timeout: 15000 });
    await page.waitForTimeout(2000);

    const loadTrace = await stopTracing(cdp);
    console.log('Captured initial load trace');
    analyzeTrace('Initial Load (19 calendars)', loadTrace);

    const calendarCount = await page.locator('lms-calendar').count();
    console.log(`\nFound ${calendarCount} calendar instances`);

    // ── Profile 2: Switch all to week view ──
    console.log('\n=== Profile 2: Switch all calendars to week view ===');
    await cdp.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'v8.execute',
            'blink.user_timing',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-v8.cpu_profiler',
        ].join(','),
        options: 'sampling-frequency=10000',
    });

    await page.evaluate(() => {
        const calendars = document.querySelectorAll('lms-calendar');
        for (const cal of calendars) {
            const header = cal.shadowRoot?.querySelector('lms-calendar-header');
            const weekBtn = header?.shadowRoot?.querySelector('[data-context="week"]');
            if (weekBtn) weekBtn.click();
        }
    });
    await page.waitForTimeout(3000);

    const weekTrace = await stopTracing(cdp);
    analyzeTrace('Week Switch (×19)', weekTrace);

    // ── Profile 3: Navigate next in week view ──
    console.log('\n=== Profile 3: Navigate next (week view, ×19) ===');
    await cdp.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'v8.execute',
            'blink.user_timing',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-v8.cpu_profiler',
        ].join(','),
        options: 'sampling-frequency=10000',
    });

    await page.evaluate(() => {
        const calendars = document.querySelectorAll('lms-calendar');
        for (const cal of calendars) {
            const header = cal.shadowRoot?.querySelector('lms-calendar-header');
            const nextBtn = header?.shadowRoot?.querySelector('button[name="next"]');
            if (nextBtn) nextBtn.click();
        }
    });
    await page.waitForTimeout(3000);

    const navTrace = await stopTracing(cdp);
    analyzeTrace('Navigate Next (week, ×19)', navTrace);

    // ── Profile 4: Switch all to day view ──
    console.log('\n=== Profile 4: Switch all calendars to day view ===');
    await cdp.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'v8.execute',
            'blink.user_timing',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-v8.cpu_profiler',
        ].join(','),
        options: 'sampling-frequency=10000',
    });

    await page.evaluate(() => {
        const calendars = document.querySelectorAll('lms-calendar');
        for (const cal of calendars) {
            const header = cal.shadowRoot?.querySelector('lms-calendar-header');
            const dayBtn = header?.shadowRoot?.querySelector('[data-context="day"]');
            if (dayBtn) dayBtn.click();
        }
    });
    await page.waitForTimeout(3000);

    const dayTrace = await stopTracing(cdp);
    analyzeTrace('Day Switch (×19)', dayTrace);

    // ── Profile 5: Switch back to month view ──
    console.log('\n=== Profile 5: Switch all calendars to month view ===');
    await cdp.send('Tracing.start', {
        categories: [
            'devtools.timeline',
            'v8.execute',
            'blink.user_timing',
            'disabled-by-default-devtools.timeline',
            'disabled-by-default-v8.cpu_profiler',
        ].join(','),
        options: 'sampling-frequency=10000',
    });

    await page.evaluate(() => {
        const calendars = document.querySelectorAll('lms-calendar');
        for (const cal of calendars) {
            const header = cal.shadowRoot?.querySelector('lms-calendar-header');
            const monthBtn = header?.shadowRoot?.querySelector('[data-context="month"]');
            if (monthBtn) monthBtn.click();
        }
    });
    await page.waitForTimeout(3000);

    const monthTrace = await stopTracing(cdp);
    analyzeTrace('Month Switch (×19)', monthTrace);

    // Save raw trace for Chrome DevTools import
    console.log('\nSaving raw traces for Chrome DevTools inspection...');
    writeFileSync('trace-week-switch.json', JSON.stringify(weekTrace));
    writeFileSync('trace-day-switch.json', JSON.stringify(dayTrace));
    console.log('Saved: trace-week-switch.json, trace-day-switch.json');
    console.log('Open in chrome://tracing or DevTools Performance tab for flame graph.');

    await browser.close();
    console.log('\nDone.');
}

async function stopTracing(cdp) {
    const chunks = [];
    cdp.on('Tracing.dataCollected', (data) => chunks.push(...data.value));

    await cdp.send('Tracing.end');

    // Wait for tracing to finish
    await new Promise((resolve) => {
        cdp.on('Tracing.tracingComplete', resolve);
    });

    return chunks;
}

function analyzeTrace(label, events) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`  ${label}`);
    console.log(`${'─'.repeat(70)}`);

    // ── 1. Rendering phase breakdown ──
    const categories = {
        'Scripting': 0,
        'Layout': 0,
        'Paint': 0,
        'Rendering': 0,
        'Other': 0,
    };

    const layoutEvents = [];
    const scriptEvents = [];
    const functionCalls = [];
    const updateLayoutTree = [];

    for (const event of events) {
        const dur = (event.dur || 0) / 1000; // μs → ms
        if (dur <= 0) continue;

        switch (event.name) {
            case 'FunctionCall':
            case 'EvaluateScript':
            case 'v8.compile':
            case 'V8.Execute':
                categories['Scripting'] += dur;
                if (event.name === 'FunctionCall' && dur > 0.5) {
                    scriptEvents.push({ name: event.name, dur, data: event.args?.data });
                }
                break;
            case 'Layout':
                categories['Layout'] += dur;
                layoutEvents.push({ dur, data: event.args?.beginData || event.args });
                break;
            case 'UpdateLayoutTree':
            case 'RecalculateStyles':
                categories['Rendering'] += dur;
                if (event.name === 'UpdateLayoutTree' && dur > 0.5) {
                    updateLayoutTree.push({ dur, elementCount: event.args?.elementCount });
                }
                break;
            case 'Paint':
            case 'CompositeLayers':
            case 'RasterTask':
                categories['Paint'] += dur;
                break;
        }

        // Capture detailed function call info
        if (event.name === 'ProfileChunk' && event.args?.data?.cpuProfile) {
            const cpuProfile = event.args.data.cpuProfile;
            if (cpuProfile.nodes) {
                for (const node of cpuProfile.nodes) {
                    if (node.callFrame && node.hitCount > 0) {
                        functionCalls.push({
                            name: node.callFrame.functionName || '(anonymous)',
                            url: node.callFrame.url || '',
                            line: node.callFrame.lineNumber,
                            hitCount: node.hitCount,
                        });
                    }
                }
            }
        }
    }

    // Print category breakdown
    const totalTime = Object.values(categories).reduce((a, b) => a + b, 0);
    console.log(`\n  Phase breakdown (total: ${totalTime.toFixed(1)}ms):`);
    for (const [cat, time] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
        if (time > 0.1) {
            const pct = ((time / totalTime) * 100).toFixed(1);
            const bar = '█'.repeat(Math.round(time / totalTime * 40));
            console.log(`    ${cat.padEnd(12)} ${time.toFixed(1).padStart(8)}ms  ${pct.padStart(5)}%  ${bar}`);
        }
    }

    // ── 2. Top layout events ──
    if (layoutEvents.length > 0) {
        const sortedLayouts = layoutEvents.sort((a, b) => b.dur - a.dur).slice(0, 5);
        console.log(`\n  Top layout events (${layoutEvents.length} total):`);
        for (const evt of sortedLayouts) {
            console.log(`    ${evt.dur.toFixed(2)}ms`);
        }
    }

    // ── 3. Top UpdateLayoutTree events ──
    if (updateLayoutTree.length > 0) {
        const sortedULT = updateLayoutTree.sort((a, b) => b.dur - a.dur).slice(0, 5);
        console.log(`\n  Top UpdateLayoutTree / RecalculateStyles:`);
        for (const evt of sortedULT) {
            console.log(`    ${evt.dur.toFixed(2)}ms  (${evt.elementCount ?? '?'} elements)`);
        }
    }

    // ── 4. Top JS functions by hit count ──
    if (functionCalls.length > 0) {
        // Aggregate by function name + location
        const agg = new Map();
        for (const fc of functionCalls) {
            const key = `${fc.name}|${fc.url}:${fc.line}`;
            agg.set(key, (agg.get(key) || 0) + fc.hitCount);
        }

        const totalHits = [...agg.values()].reduce((a, b) => a + b, 0);
        const sorted = [...agg.entries()]
            .sort((a, b) => b[1] - a[1])
            .filter(([key]) => {
                const name = key.split('|')[0];
                return name !== '(idle)' && name !== '(garbage collector)' && name !== '(root)' && name !== '(program)';
            })
            .slice(0, 20);

        console.log(`\n  Top JS functions by CPU samples (${totalHits} total samples):`);
        console.log(`  ${'Hits'.padStart(6)}  ${'%'.padStart(5)}  ${'Function'.padEnd(40)}  Location`);
        for (const [key, hits] of sorted) {
            const [name, loc] = key.split('|');
            const pct = ((hits / totalHits) * 100).toFixed(1);
            const shortLoc = loc
                .replace(/.*\/node_modules\//, 'nm:')
                .replace(/.*\/src\//, 'src/')
                .replace(/\?.*$/, '');
            console.log(`  ${String(hits).padStart(6)}  ${pct.padStart(5)}%  ${name.slice(0, 40).padEnd(40)}  ${shortLoc}`);
        }
    }
}

main().catch(console.error);
