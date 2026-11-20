import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
// Authoritative JSON catalogs -> extractable messages + XLIFF + runtime modules.
// bun scripts/check-locales.mjs --write   (after editing catalogs)
// bun scripts/check-locales.mjs           (freshness, preservation, isolated Lit roundtrip)
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { format } from 'oxfmt';

import { getMessages, getMessageFormatters, MESSAGE_DEFS } from '../src/lib/messages.ts';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const source = JSON.parse(await read('src/locales/source.json'));
const config = JSON.parse(await read('lit-localize.json'));

// Match rendered output instead of scraping fallback literals. This also finds
// drift in argument order, interpolation, nested phrases and plural selection.
// Keep this check out of the runtime bundle so English stays ready on first render.
const checkedEnglish = new Set();
function english(id, values = {}) {
    assert.equal(typeof source[id], 'string', `Missing English source: ${id}`);
    checkedEnglish.add(id);
    return source[id].replace(/\{(\w+)\}/g, (placeholder, name) => {
        assert.ok(Object.hasOwn(values, name), `Unmapped English placeholder ${id}/${placeholder}`);
        return values[name];
    });
}
function checkEnglish(id, actual, values) {
    assert.equal(actual, english(id, values), `English runtime/source mismatch: ${id}`);
}

const fixed = getMessages('en');
for (const [key, id] of MESSAGE_DEFS) checkEnglish(id, fixed[key]);
const phrases = getMessageFormatters('en');
const date = 'November 17, 2026';
checkEnglish('openDate', phrases.switchToDayView(date), { date });
checkEnglish('showWeek', phrases.showWeek(47), { week: '47' });
checkEnglish('namedView', phrases.viewLabel('Week'), { view: 'Week' });
checkEnglish('eventLabel', phrases.eventLabel('Studio check-in', date, '09:45'), {
    title: 'Studio check-in',
    date,
    time: '09:45',
});
checkEnglish('timeRange', phrases.timeRange('09:00', '09:45'), { start: '09:00', end: '09:45' });
for (const [id, expanded, preview] of [
    ['A', false, true],
    ['F', true, true],
    ['S', false, false],
    ['H', true, false],
])
    checkEnglish(id, phrases.agendaAction(expanded, preview));
for (const [count, label, category] of [
    [0, '0', 'other'],
    [1, '1', 'one'],
    [2, '2', 'other'],
    [1234, '1,234', 'other'],
]) {
    const values = { count: label };
    const eventId = `eventCount_${category}`;
    checkEnglish(eventId, phrases.eventCount(count), values);
    checkEnglish(`moreCount_${category}`, phrases.moreEvents(count), values);
    checkEnglish('dateSummary', phrases.dateSummary(date, count), {
        date,
        events: english(eventId, values),
    });
}
// The extra categories are translated for other locales, but not selected in
// English. Their canonical English source must match the plural fallback.
for (const prefix of ['eventCount', 'moreCount']) {
    for (const category of ['zero', 'two', 'few', 'many']) {
        const id = `${prefix}_${category}`;
        assert.equal(
            source[id],
            source[`${prefix}_other`],
            `English plural source mismatch: ${id}`,
        );
        checkedEnglish.add(id);
    }
}
assert.deepEqual(
    Object.keys(source)
        .filter((id) => !checkedEnglish.has(id))
        .sort(),
    ['s1c109a21525649fd', 's7264933e3c515250'], // retired, preservation-only inspector actions
    'English messages without a runtime/source check',
);
const formatOptions = JSON.parse(await read('.oxfmtrc.json'));
delete formatOptions.$schema;
delete formatOptions.ignorePatterns;
const unescapeXML = (s) =>
    s.replace(
        /&(amp|lt|gt|quot|apos);/g,
        (_, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" })[entity],
    );
const escapeXML = (s) =>
    s.replace(
        /[<>&"']/g,
        (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
    );
const moduleText = (templates) =>
    '// Generated from src/locales/catalogs/*.json. Do not edit.\nexport const templates = ' +
    JSON.stringify(templates, null, 4) +
    ';\n';
const sourceText =
    "// Extraction-only adapter. Runtime messages are per instance, not Lit's global locale.\nimport { msg } from '@lit/localize';\nexport const messages = [\n" +
    Object.entries(source)
        .map(([id, text]) => `    msg(${JSON.stringify(text)}, { id: ${JSON.stringify(id)} }),`)
        .join('\n') +
    '\n];\n';
const xlfText = (locale, templates) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2"><file source-language="en" target-language="${locale}" datatype="plaintext" original="messages"><body>\n` +
    Object.entries(source)
        .map(
            ([id, text]) =>
                `  <trans-unit id="${id}"><source>${escapeXML(text)}</source><target>${escapeXML(templates[id])}</target></trans-unit>`,
        )
        .join('\n') +
    '\n</body></file></xliff>\n';
const write = process.argv.includes('--write');
async function artifact(path, content) {
    if (path.endsWith('.ts')) {
        const formatted = await format(path, content, formatOptions);
        assert.equal(formatted.errors.length, 0, `Invalid generated TypeScript: ${path}`);
        content = formatted.code;
    }
    if (write) await writeFile(resolve(root, path), content);
    else
        assert.equal(
            await read(path),
            content,
            `Stale ${path}; run bun scripts/check-locales.mjs --write`,
        );
}

const catalogs = new Map();
for (const locale of config.targetLocales) {
    const templates = JSON.parse(await read(`src/locales/catalogs/${locale}.json`));
    assert.deepEqual(
        Object.keys(templates).sort(),
        Object.keys(source).sort(),
        `Incomplete keys: ${locale}`,
    );
    for (const [id, value] of Object.entries(templates)) {
        assert.equal(typeof value, 'string');
        assert.ok(value.length, `Empty ${locale}/${id}`);
        const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
        assert.deepEqual(
            placeholders(value),
            placeholders(source[id]),
            `Placeholder mismatch ${locale}/${id}`,
        );
    }
    catalogs.set(locale, templates);
}

// Pin the original inventory and its digests independently of today's target
// locales. New locales need no snapshots; removing or rehashing an old one fails.
const manifestBytes = await readFile(resolve(root, 'src/locales/preserved/sha256.json'));
assert.equal(
    createHash('sha256').update(manifestBytes).digest('hex'),
    '470149d3beb6cf199ad5bdf9bdae3f405a192725c20f900e7cb985af1fc6320a',
    'Changed frozen preservation manifest (historical runtime and XLIFF snapshots)',
);
const manifest = JSON.parse(manifestBytes.toString('utf8'));
const historicalRuntime = new Map();
for (const [path, digest] of Object.entries(manifest)) {
    const snapshot = await readFile(resolve(root, `src/locales/preserved/${path}.txt`));
    assert.equal(
        createHash('sha256').update(snapshot).digest('hex'),
        digest,
        `Changed preservation snapshot: ${path}`,
    );
    const original = snapshot.toString('utf8');
    const runtimeMatch = /^src\/generated\/locales\/([^/]+)\.ts$/.exec(path);
    const locale = runtimeMatch?.[1] ?? /^xliff\/([^/]+)\.xlf$/.exec(path)?.[1];
    const templates = catalogs.get(locale);
    assert.ok(templates, `Missing catalog for preservation snapshot: ${path}`);
    if (runtimeMatch) {
        const values = new Map(
            [...original.matchAll(/(\w+): `([^`]*)`/g)].map(([, id, value]) => [id, value]),
        );
        for (const [id, value] of values)
            assert.equal(
                templates[id],
                value,
                `Lost original runtime translation: ${locale}/${id}`,
            );
        historicalRuntime.set(locale, values);
    } else {
        for (const [, id, value] of original.matchAll(
            /<trans-unit[^>]*id="([^"]+)"[^>]*>[\s\S]*?<target[^>]*>([\s\S]*?)<\/target>/g,
        ))
            assert.equal(
                templates[id],
                unescapeXML(value),
                `Lost original XLIFF translation: ${locale}/${id}`,
            );
    }
}

await artifact('src/locales/source.ts', sourceText);
for (const [locale, templates] of catalogs) {
    // Keep obsolete inspector actions in JSON and XLIFF, but only ship them if
    // they were already part of that locale's original runtime.
    const runtime = { ...templates };
    for (const id of ['s1c109a21525649fd', 's7264933e3c515250'])
        if (!historicalRuntime.get(locale)?.has(id)) delete runtime[id];
    await artifact(`src/generated/locales/${locale}.ts`, moduleText(runtime));
    await artifact(`xliff/${locale}.xlf`, xlfText(locale, templates));
}
if (write) {
    console.log(
        `Generated ${catalogs.size} catalogs (${Object.keys(source).length} messages each); 810 original runtime translations and 16 additional XLIFF-only values retained.`,
    );
} else {
    // The fixture lives under the repo for normal package resolution, is always removed,
    // and never runs extraction/build on the working translation artifacts.
    const fixture = await mkdtemp(join(root, '.locale-roundtrip-'));
    try {
        await mkdir(join(fixture, 'xliff'));
        await writeFile(join(fixture, 'source.ts'), sourceText);
        await writeFile(
            join(fixture, 'lit-localize.json'),
            JSON.stringify({
                ...config,
                tsConfig: undefined,
                inputFiles: ['./source.ts'],
                output: { mode: 'runtime', language: 'ts', outputDir: './locales' },
                interchange: { format: 'xliff', xliffDir: './xliff' },
            }),
        );
        for (const [locale, templates] of catalogs)
            await writeFile(join(fixture, `xliff/${locale}.xlf`), xlfText(locale, templates));
        const run = (operation) => {
            const result = spawnSync(
                'bunx',
                [
                    '--no-install',
                    'lit-localize',
                    operation,
                    '--config',
                    join(fixture, 'lit-localize.json'),
                ],
                { cwd: fixture, encoding: 'utf8' },
            );
            assert.equal(result.status, 0, `${operation}: ${result.stdout}\n${result.stderr}`);
        };
        const firstCycle = new Map();
        for (let cycle = 0; cycle < 2; cycle++) {
            run('extract');
            run('build');
            for (const [locale, templates] of catalogs) {
                const output = await readFile(join(fixture, `locales/${locale}.ts`), 'utf8');
                // Lit emits JS-compatible TypeScript for string-only messages.
                const generated = new Function(
                    output.replace(/export (?:const|let|var) templates\s*=/, 'const templates =') +
                        '\nreturn templates;',
                )();
                assert.deepEqual(
                    generated,
                    templates,
                    `Roundtrip changed ${locale} cycle ${cycle + 1}`,
                );
                const artifacts =
                    output + (await readFile(join(fixture, `xliff/${locale}.xlf`), 'utf8'));
                if (cycle === 0) firstCycle.set(locale, artifacts);
                else
                    assert.equal(
                        artifacts,
                        firstCycle.get(locale),
                        `Non-reproducible generated bytes: ${locale}`,
                    );
            }
        }
    } finally {
        await rm(fixture, { recursive: true, force: true });
    }
    console.log(
        `PASS: English runtime/source parity; 54 preserved artifacts; 810 original runtime values + 16 XLIFF-only values; ${catalogs.size} complete catalogs; two isolated Lit extract/build roundtrips.`,
    );
}
