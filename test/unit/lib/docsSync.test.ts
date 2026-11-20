import { spawnSync, type SpawnSyncReturns } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect } from 'chai';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const start = '<!-- GENERATED:LOCALE_TABLE:START -->';
const end = '<!-- GENERATED:LOCALE_TABLE:END -->';

function fixture<T>(
    verify: (workspace: string, run: (...args: string[]) => SpawnSyncReturns<string>) => T,
) {
    const workspace = mkdtempSync(join(tmpdir(), 'kalendus docs sync '));
    try {
        for (const path of [
            'scripts/sync-docs.mjs',
            'lit-localize.json',
            'src/lib/weekStartHelper.ts',
            'src/generated/locales',
            'README.md',
            'docs/troubleshooting.md',
            'docs/architecture.md',
        ]) {
            cpSync(join(root, path), join(workspace, path), { recursive: true });
        }
        return verify(workspace, (...args) =>
            spawnSync(process.execPath, [join(workspace, 'scripts/sync-docs.mjs'), ...args], {
                encoding: 'utf8',
            }),
        );
    } finally {
        rmSync(workspace, { recursive: true, force: true });
    }
}

function revise(workspace: string, path: string, transform: (text: string) => string) {
    const file = join(workspace, path);
    const original = readFileSync(file, 'utf8');
    const revision = transform(original);
    expect(revision).not.to.equal(original);
    writeFileSync(file, revision);
    return file;
}

describe('generated documentation checks', () => {
    it('checks clean docs in a path with spaces and detects stale text without rewriting it', () => {
        fixture((workspace, run) => {
            const fresh = run('--check');
            expect(fresh.status, fresh.stderr).to.equal(0);
            const file = revise(workspace, 'README.md', (text) =>
                text.replace(start, `${start}\nstale text`),
            );
            const stale = run('--check');
            expect(stale.status).not.to.equal(0);
            expect(stale.stderr).to.include('README.md is stale');
            expect(readFileSync(file, 'utf8')).to.include('stale text');
        });
    });

    for (const [name, transform] of [
        ['missing', (text: string) => text.replace(start, '')],
        ['duplicate', (text: string) => text.replace(start, `${start}\n${start}`)],
        ['reversed', (text: string) => text.replace(end, start).replace(start, end)],
    ] as const) {
        it(`fails for ${name} locale-table markers`, () => {
            fixture((workspace, run) => {
                revise(workspace, 'README.md', transform);
                const checked = run('--check');
                expect(checked.status).not.to.equal(0);
                expect(checked.stderr).to.include('README.md: Expected one ordered START/END pair');
            });
        });
    }

    it('does not rewrite any source when another generated section is missing', () => {
        fixture((workspace, run) => {
            const file = revise(workspace, 'README.md', (text) =>
                text.replace(start, `${start}\nstale text`),
            );
            revise(workspace, 'docs/architecture.md', (text) =>
                text.replace('└── locales/', 'locales/'),
            );
            const checked = run();
            expect(checked.status).not.to.equal(0);
            expect(checked.stderr).to.include(
                'docs/architecture.md: Expected one locales/ tree anchor',
            );
            expect(readFileSync(file, 'utf8')).to.include('stale text');
        });
    });
});
