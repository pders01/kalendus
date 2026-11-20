#!/usr/bin/env node

/**
 * Auto-generates documentation sections from source-of-truth data.
 *
 * Usage:
 *   bun scripts/sync-docs.mjs            # update files in place
 *   bun scripts/sync-docs.mjs --check    # exit 1 if anything is stale (CI)
 *
 * Each target doc file uses paired markers to delimit auto-generated content:
 *
 *   <!-- GENERATED:KEY:START -->
 *   ...replaced on every run...
 *   <!-- GENERATED:KEY:END -->
 *
 * For sections inside fenced code blocks (where HTML comments would render
 * literally), the script uses regex-based replacement instead.
 *
 * Sources of truth:
 *   - lit-localize.json          → target locale codes
 *   - src/lib/weekStartHelper.ts → LOCALE_WEEK_START map
 *   - src/generated/locales/     → actual generated locale files
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const CHECK = process.argv.includes('--check');

// ── Source data ─────────────────────────────────────────────

const litLocalize = JSON.parse(readFileSync(join(ROOT, 'lit-localize.json'), 'utf8'));
const targetLocales = litLocalize.targetLocales;
const ALL_LOCALES = ['en', ...targetLocales];

// Parse LOCALE_WEEK_START from weekStartHelper.ts
const weekStartSrc = readFileSync(join(ROOT, 'src/lib/weekStartHelper.ts'), 'utf8');
const WEEK_START = {};
for (const [, code, val] of weekStartSrc.matchAll(/^\s*'?([a-zA-Z][\w-]*)'?\s*:\s*(\d)/gm)) {
    WEEK_START[code] = Number(val);
}

// Locale display names via Intl
const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });

function localeName(code) {
    if (code === 'de-DE') return 'German (Germany)';
    try {
        return displayNames.of(code);
    } catch {
        return code;
    }
}

function weekStartName(code) {
    const v = WEEK_START[code] ?? WEEK_START[code.split('-')[0]] ?? 1;
    return { 0: 'Sunday', 1: 'Monday', 6: 'Saturday' }[v] ?? 'Monday';
}

// ── Generators ──────────────────────────────────────────────

/** Markdown locale table for README.md (dynamic column widths) */
function localeTable() {
    const headers = ['Code', 'Language', 'Recommended Week Start'];
    const data = ALL_LOCALES.map((c) => [`\`${c}\``, localeName(c), weekStartName(c)]);

    // Compute column widths from actual content
    const widths = headers.map((h, i) => Math.max(h.length, ...data.map((r) => r[i].length)));

    const row = (cells) => '| ' + cells.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |';
    const sep = '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';

    return [row(headers), sep, ...data.map(row)].join('\n');
}

/** Comma-separated backtick-wrapped code list for inline references */
function localeListInline() {
    return `The ${ALL_LOCALES.length} built-in catalog codes are: ${ALL_LOCALES.map((c) => `\`${c}\``).join(', ')}. Regional aliases may resolve to these catalogs; unsupported tags use English fallback.`;
}

/** Locale file listing for the architecture.md code-block tree */
function localeFilesTree() {
    const files = readdirSync(join(ROOT, 'src/generated/locales'))
        .filter((f) => f.endsWith('.ts'))
        .sort();
    // Group into rows of ~7 for readability
    const groups = [];
    for (let i = 0; i < files.length; i += 7) {
        groups.push(files.slice(i, i + 7).join(', '));
    }
    return groups
        .map((g, i) => {
            const isLast = i === groups.length - 1;
            return `        ${isLast ? '└──' : '├──'} ${g}`;
        })
        .join('\n');
}

// ── File updater ────────────────────────────────────────────

/**
 * Replace content between GENERATED markers.
 *
 * For inline markers (non-whitespace before START on the same line),
 * replaces without adding separators. For block markers, preserves
 * the whitespace/indentation found before the END marker.
 */
function replaceMarkers(content, key, generated) {
    const start = `<!-- GENERATED:${key}:START -->`;
    const end = `<!-- GENERATED:${key}:END -->`;
    const si = content.indexOf(start);
    const ei = content.indexOf(end);
    if (
        si === -1 ||
        ei === -1 ||
        si >= ei ||
        si !== content.lastIndexOf(start) ||
        ei !== content.lastIndexOf(end)
    ) {
        throw new Error(`Expected one ordered START/END pair for GENERATED:${key}`);
    }

    // Detect whether the marker is inline (non-whitespace before START on its line)
    const startLineBegin = content.lastIndexOf('\n', si) + 1;
    const isInline = content.slice(startLineBegin, si).trim().length > 0;

    if (isInline) {
        return content.slice(0, si + start.length) + generated + content.slice(ei);
    }

    // Block mode: use blank-line padding around the generated content.
    // This matches the convention that formatters expect around tables
    // and block-level content inside markdown.
    return content.slice(0, si + start.length) + '\n\n' + generated + '\n\n' + content.slice(ei);
}

// Validate every source before writing any of the generated sections.
const docs = [];
function stageUpdate(relPath, transform) {
    const absPath = join(ROOT, relPath);
    const original = readFileSync(absPath, 'utf8');
    try {
        docs.push({ absPath, relPath, original, content: transform(original) });
    } catch (error) {
        throw new Error(`${relPath}: ${error.message}`, { cause: error });
    }
}

function applyUpdate({ absPath, relPath, original, content }) {
    if (content !== original) {
        if (CHECK) {
            console.error(`  ✗ ${relPath} is stale`);
            return true;
        }
        writeFileSync(absPath, content);
        console.log(`  ✓ ${relPath} updated`);
        return true;
    }
    console.log(`  · ${relPath} up to date`);
    return false;
}

// ── Main ────────────────────────────────────────────────────

console.log('sync-docs: syncing from source…\n');

stageUpdate('README.md', (content) => replaceMarkers(content, 'LOCALE_TABLE', localeTable()));
stageUpdate('docs/troubleshooting.md', (content) =>
    replaceMarkers(content, 'LOCALE_LIST_INLINE', localeListInline()),
);
stageUpdate('docs/architecture.md', (content) => {
    // The listing is inside a code block, where HTML markers would be visible.
    const anchors = [...content.matchAll(/^    └── locales\/[ \t]*(?:#[^\n]*)?\n/gm)];
    if (anchors.length !== 1) throw new Error('Expected one locales/ tree anchor');
    const [anchor] = anchors;
    const afterAnchor = anchor.index + anchor[0].length;
    const rest = content.slice(afterAnchor);
    const match = rest.match(/^([ ]{8}[├└]── [\w.,\- ]+\.ts[\w.,\- ]*\n)+/);
    if (!match) throw new Error('Expected locale file lines after the locales/ tree anchor');
    return content.slice(0, afterAnchor) + localeFilesTree() + '\n' + rest.slice(match[0].length);
});

let dirty = false;
for (const doc of docs) dirty = applyUpdate(doc) || dirty;

if (CHECK && dirty) {
    console.error('\nDocs are out of date. Run: bun run docs:sync\n');
    process.exit(1);
}

if (!dirty) {
    console.log('\nAll docs up to date.');
} else if (!CHECK) {
    console.log('\nDone.');
}
