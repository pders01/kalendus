import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
// Authoritative JSON catalogs -> extractable messages + XLIFF + runtime modules.
// bun scripts/check-locales.mjs --write   (after editing catalogs)
// bun scripts/check-locales.mjs           (freshness, preservation, isolated Lit roundtrip)
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';

import { format } from 'oxfmt';

import { MESSAGE_DEFS } from '../src/lib/messages.ts';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const source = JSON.parse(await read('src/locales/source.json'));
const config = JSON.parse(await read('lit-localize.json'));
for (const [, id, text] of MESSAGE_DEFS) {
    assert.equal(source[id], text, `Runtime/source mismatch: ${id}`);
}
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

// Snapshot files are immutable evidence: all original keys and values must survive.
const manifest = JSON.parse(await read('src/locales/preserved/sha256.json'));
for (const [path, digest] of Object.entries(manifest)) {
    const original = await read(`src/locales/preserved/${path}.txt`);
    assert.equal(
        createHash('sha256').update(original).digest('hex'),
        digest,
        `Changed preservation snapshot: ${path}`,
    );
}
await artifact('src/locales/source.ts', sourceText);
const catalogs = new Map();
for (const locale of config.targetLocales) {
    const templates = JSON.parse(await read(`src/locales/catalogs/${locale}.json`));
    assert.deepEqual(
        Object.keys(templates).sort(),
        Object.keys(source).sort(),
        `Incomplete keys: ${locale}`,
    );
    const original = await read(`src/locales/preserved/src/generated/locales/${locale}.ts.txt`);
    const originalRuntime = new Map(
        [...original.matchAll(/(\w+): `([^`]*)`/g)].map(([, id, value]) => [id, value]),
    );
    for (const [id, value] of originalRuntime)
        assert.equal(templates[id], value, `Lost original translation: ${locale}/${id}`);
    const originalXlf = await read(`src/locales/preserved/xliff/${locale}.xlf.txt`);
    for (const [, id, value] of originalXlf.matchAll(
        /<trans-unit[^>]*id="([^"]+)"[^>]*>[\s\S]*?<target[^>]*>([\s\S]*?)<\/target>/g,
    )) {
        assert.equal(
            templates[id],
            unescapeXML(value),
            `Lost original XLIFF translation: ${locale}/${id}`,
        );
    }
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
    // These obsolete inspector actions were XLIFF-only, never original runtime
    // keys. Keep their values in the authoritative catalogs and regenerated XLIFF,
    // but do not ship unused text. No original runtime key may be removed.
    const runtime = { ...templates };
    for (const id of ['s1c109a21525649fd', 's7264933e3c515250'])
        if (!originalRuntime.has(id)) delete runtime[id];
    for (const [id, value] of originalRuntime)
        assert.equal(runtime[id], value, `Lost original runtime value: ${locale}/${id}`);
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
        `PASS: 54 preserved artifacts; 810 original runtime values + 16 XLIFF-only values; ${catalogs.size} complete catalogs; two isolated Lit extract/build roundtrips.`,
    );
}
