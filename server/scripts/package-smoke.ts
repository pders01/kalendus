import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const server = fileURLToPath(new URL('../', import.meta.url));
const fixture = mkdtempSync(join(server, '.package-smoke-'));
function run(command: string[], cwd = fixture, env: Record<string, string | undefined> = {}) {
    const result = Bun.spawnSync(command, {
        cwd,
        env: { ...process.env, ...env },
        stdout: 'pipe',
        stderr: 'pipe',
    });
    if (result.exitCode !== 0)
        throw new Error(`${command.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
    return result.stdout.toString();
}
try {
    run(
        ['bun', 'pm', 'pack', '--ignore-scripts', '--filename', join(fixture, 'server.tgz')],
        server,
    );
    const unpacked = join(fixture, 'installed');
    mkdirSync(unpacked);
    run(['tar', '-xzf', join(fixture, 'server.tgz'), '-C', unpacked]);
    const scope = join(fixture, 'node_modules', '@jpahd');
    mkdirSync(scope, { recursive: true });
    symlinkSync(join(unpacked, 'package'), join(scope, 'kalendus-server'), 'dir');
    const caller = join(fixture, 'unrelated-cwd');
    mkdirSync(caller);
    const database = join(fixture, 'custom', 'nested', 'calendar.db');
    writeFileSync(
        join(caller, 'smoke.mjs'),
        `
        import { createDb, createApp, migrateDb, CalendarServiceImpl } from '@jpahd/kalendus-server';
        const db = createDb();
        try {
            migrateDb(db); migrateDb(db);
            const calendars = new CalendarServiceImpl(db);
            const calendar = await calendars.create({ name: 'Packed custom path' });
            if (!await calendars.getById(calendar.id)) throw new Error('Missing persisted calendar');
            const { app } = createApp({ db });
            if ((await app.request('/api/calendars/' + calendar.id)).status !== 403) throw new Error('Private package default was open');
        } finally { db.$client.close(); }
    `,
    );
    // Native better-sqlite3 tests use Node, just like the Mocha script; Bun orchestrates packaging.
    run(['node', join(caller, 'smoke.mjs')], caller, { DATABASE_URL: database });
    run(['node', join(unpacked, 'package', 'dist', 'db', 'seed.js')], caller, {
        DATABASE_URL: database,
    });
    writeFileSync(
        join(caller, 'verify-seed.mjs'),
        `
        import { createDb, calendars, events } from '@jpahd/kalendus-server';
        const db = createDb();
        try {
            if (db.select().from(calendars).all().length !== 2) throw new Error('Seed used another database');
            if (db.select().from(events).all().length !== 5) throw new Error('Missing seed events');
        } finally { db.$client.close(); }
    `,
    );
    run(['node', join(caller, 'verify-seed.mjs')], caller, { DATABASE_URL: database });
    if (!existsSync(database)) throw new Error('Custom DATABASE_URL was not created');
    run(['node', join(unpacked, 'package', 'dist', 'db', 'migrate.js')], caller, {
        DATABASE_URL: join(fixture, 'cli', 'custom.db'),
    });
    if (!existsSync(join(fixture, 'cli', 'custom.db')))
        throw new Error('Packaged migration CLI ignored DATABASE_URL');
    const runtime = Bun.spawn(['node', join(unpacked, 'package', 'dist', 'index.js')], {
        cwd: caller,
        env: {
            ...process.env,
            DATABASE_URL: database,
            PORT: '0',
            HOST: '127.0.0.1',
            KALENDUS_PUBLIC_DEMO: 'false',
        },
        stdout: 'pipe',
        stderr: 'pipe',
    });
    const reader = runtime.stdout.getReader();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        const chunk = await Promise.race([
            reader.read(),
            new Promise<never>((_, reject) => {
                timer = setTimeout(
                    () => reject(new Error('Packaged runtime startup timeout')),
                    5000,
                );
            }),
        ]);
        const port = new TextDecoder().decode(chunk.value).match(/localhost:(\d+)/)?.[1];
        if (!port) throw new Error('Packaged runtime did not announce its listening port');
        const base = `http://127.0.0.1:${port}`;
        if ((await fetch(`${base}/health`)).status !== 200)
            throw new Error('Packaged health check failed');
        if ((await fetch(`${base}/api/calendars/missing`)).status !== 403)
            throw new Error('Packaged runtime was not private');
    } finally {
        if (timer) clearTimeout(timer);
        runtime.kill('SIGTERM');
        await runtime.exited;
        await reader.cancel();
    }
    console.log(
        'PASS packed exports, migration SQL/journal assets, idempotent custom-path migration, seed, standalone CLI/runtime, CRUD, and closed default (unrelated cwd).',
    );
} finally {
    rmSync(fixture, { recursive: true, force: true });
}
