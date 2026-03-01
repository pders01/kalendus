#!/usr/bin/env node

/**
 * Auto-generates documentation sections from source-of-truth data.
 *
 * Usage:
 *   node scripts/sync-docs.mjs            # update files in place
 *   node scripts/sync-docs.mjs --check    # exit 1 if anything is stale (CI)
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

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const CHECK = process.argv.includes('--check');

// ── Source data ─────────────────────────────────────────────

const litLocalize = JSON.parse(
    readFileSync(join(ROOT, 'lit-localize.json'), 'utf8'),
);
const targetLocales = litLocalize.targetLocales;
const ALL_LOCALES = ['en', ...targetLocales];

// Parse LOCALE_WEEK_START from weekStartHelper.ts
const weekStartSrc = readFileSync(
    join(ROOT, 'src/lib/weekStartHelper.ts'),
    'utf8',
);
const WEEK_START = {};
for (const [, code, val] of weekStartSrc.matchAll(
    /^\s*'?([a-zA-Z][\w-]*)'?\s*:\s*(\d)/gm,
)) {
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
    const headers = ['Code', 'Language', 'Default Week Start'];
    const data = ALL_LOCALES.map((c) => [
        `\`${c}\``,
        localeName(c),
        weekStartName(c),
    ]);

    // Compute column widths from actual content
    const widths = headers.map((h, i) =>
        Math.max(h.length, ...data.map((r) => r[i].length)),
    );

    const row = (cells) =>
        '| ' + cells.map((c, i) => c.padEnd(widths[i])).join(' | ') + ' |';
    const sep =
        '| ' + widths.map((w) => '-'.repeat(w)).join(' | ') + ' |';

    return [row(headers), sep, ...data.map(row)].join('\n');
}

/** Comma-separated backtick-wrapped code list for inline references */
function localeListInline() {
    return `Only these ${ALL_LOCALES.length} codes are supported: ${ALL_LOCALES.map((c) => `\`${c}\``).join(', ')}.`;
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
    if (si === -1 || ei === -1) {
        console.warn(`  ⚠ Marker GENERATED:${key} not found`);
        return content;
    }

    // Detect whether the marker is inline (non-whitespace before START on its line)
    const startLineBegin = content.lastIndexOf('\n', si) + 1;
    const isInline = content.slice(startLineBegin, si).trim().length > 0;

    if (isInline) {
        return (
            content.slice(0, si + start.length) +
            generated +
            content.slice(ei)
        );
    }

    // Block mode: use blank-line padding around the generated content.
    // This matches the convention that formatters expect around tables
    // and block-level content inside markdown.
    return (
        content.slice(0, si + start.length) +
        '\n\n' +
        generated +
        '\n\n' +
        content.slice(ei)
    );
}

function updateFile(relPath, fn) {
    const absPath = join(ROOT, relPath);
    const original = readFileSync(absPath, 'utf8');
    const content = fn(original);
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

let dirty = false;

// README.md — locale table
dirty =
    updateFile('README.md', (c) =>
        replaceMarkers(c, 'LOCALE_TABLE', localeTable()),
    ) || dirty;

// docs/troubleshooting.md — inline locale list
dirty =
    updateFile('docs/troubleshooting.md', (c) =>
        replaceMarkers(c, 'LOCALE_LIST_INLINE', localeListInline()),
    ) || dirty;

// docs/architecture.md — locale files inside code block (regex replacement)
dirty =
    updateFile('docs/architecture.md', (c) => {
        // Replace the locale file lines after "└── locales/" in the code block.
        // Match consecutive lines that list .ts files with tree-drawing chars.
        const anchor = '└── locales/';
        const anchorIdx = c.indexOf(anchor);
        if (anchorIdx === -1) {
            console.warn(
                '  ⚠ locales/ anchor not found in architecture.md',
            );
            return c;
        }
        // Find the end of the anchor line
        const afterAnchor = c.indexOf('\n', anchorIdx) + 1;
        // Match all subsequent lines that are locale file listings (8+ spaces + tree char)
        const rest = c.slice(afterAnchor);
        const match = rest.match(
            /^([ ]{8}[├└]── [\w.,\- ]+\.ts[\w.,\- ]*\n)+/,
        );
        if (!match) {
            console.warn(
                '  ⚠ locale file lines not found in architecture.md',
            );
            return c;
        }
        return (
            c.slice(0, afterAnchor) +
            localeFilesTree() +
            '\n' +
            rest.slice(match[0].length)
        );
    }) || dirty;

if (CHECK && dirty) {
    console.error(
        '\nDocs are out of date. Run: node scripts/sync-docs.mjs\n',
    );
    process.exit(1);
}

if (!dirty) {
    console.log('\nAll docs up to date.');
} else if (!CHECK) {
    console.log('\nDone.');
}
