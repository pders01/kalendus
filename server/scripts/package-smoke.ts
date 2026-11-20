import {
    copyFileSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    realpathSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import ts from 'typescript';

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

// Observed with Drizzle 0.45.4 / TS 5.9 in the isolated production install. Match both
// the declaring file and the specific issue, not an error code across the dependency.
const knownDrizzleIssues: ReadonlyArray<[number, RegExp, RegExp]> = [
    [
        2307,
        /^gel-core\/columns\/(?:date-duration|duration|localdate|localtime|relative-duration|timestamp)\.d\.ts$/,
        /^Cannot find module 'gel' or its corresponding type declarations\.$/,
    ],
    [
        2307,
        /^(?:(?:mysql|singlestore)-core\/db|singlestore\/(?:driver|session))\.d\.ts$/,
        /^Cannot find module 'mysql2\/promise' or its corresponding type declarations\.$/,
    ],
    [
        2307,
        /^singlestore\/driver\.d\.ts$/,
        /^Cannot find module 'mysql2' or its corresponding type declarations\.$/,
    ],
    [
        2420,
        /^(?:(?:gel|pg|sqlite)-core\/query-builders\/query|(?:mysql|singlestore)-core\/query-builders\/delete)\.d\.ts$/,
        /^Class '((?:Gel|Pg|SQLite)RelationalQuery|(?:MySql|SingleStore)DeleteBase)<[^\n]+>' incorrectly implements interface 'SQLWrapper'\.\n  Property 'getSQL' is missing in type '\1<[^\n]+>' but required in type 'SQLWrapper'\.$/,
    ],
    [
        2559,
        /^(?:gel|pg)-core\/roles\.d\.ts$/,
        /^Type '((?:Gel|Pg)Role)' has no properties in common with type '\1Config'\.$/,
    ],
    [
        2344,
        /^(?:mysql|singlestore|sqlite)-core\/query-builders\/select\.d\.ts$/,
        /^Type 'string' does not satisfy the constraint 'keyof this & string'\.[\s\S]+Type '"(?:session|config)"' is not assignable to type /,
    ],
    [
        2344,
        /^(?:mysql|singlestore|sqlite)-core\/query-builders\/select\.types\.d\.ts$/,
        /^Type '(?:MySql|SingleStore|SQLite)SetOperatorExcludedMethods' does not satisfy the constraint [^\n]+\n  Type '"(?:session|config)"' is not assignable to type /,
    ],
    [
        2515,
        /^(?:mysql|singlestore|sqlite)-core\/query-builders\/select\.d\.ts$/,
        /^Non-abstract class '((?:MySql|SingleStore|SQLite)Select)Base<[^\n]+>' does not implement inherited abstract member getSQL from class '\1QueryBuilderBase<[^\n]+>'\.$/,
    ],
    [
        2515,
        /^singlestore-core\/columns\/(?:bigint|binary|boolean|char|custom|date|datetime|decimal|double|float|int|json|mediumint|real|serial|smallint|text|time|timestamp|tinyint|varbinary|varchar|vector|year)\.d\.ts$/,
        /^Non-abstract class 'SingleStore\w+Builder<T>' does not implement inherited abstract member generatedAlwaysAs from class 'SingleStore\w+Builder(?:WithAutoIncrement)?<[^\n]+>'\.$/,
    ],
    [
        2416,
        /^singlestore-core\/columns\/enum\.d\.ts$/,
        /^Property 'generatedAlwaysAs' in type 'SingleStoreEnumColumnBuilder<T>' is not assignable to the same property in base type 'SingleStoreColumnBuilder<[^\n]+\.[\s\S]+Property 'type' is missing in type '\{\}' but required in type '\{ type: "always"; \}'\.$/,
    ],
];

function isKnownDrizzleIssue({ file, code, messageText }: ts.Diagnostic, drizzle: string) {
    if (!file?.isDeclarationFile || !file.fileName.startsWith(drizzle)) return false;
    const relativeFile = file.fileName.slice(drizzle.length);
    const message = ts.flattenDiagnosticMessageText(messageText, '\n');
    return knownDrizzleIssues.some(
        ([issueCode, path, issue]) =>
            issueCode === code && path.test(relativeFile) && issue.test(message),
    );
}

function checkPackedTypes(tarball: string) {
    const consumer = mkdtempSync(join(realpathSync(tmpdir()), 'kalendus-packed-types-'));
    try {
        if (consumer.startsWith(realpathSync(join(server, '..')) + sep)) {
            throw new Error('The packed type consumer must be outside the workspace');
        }
        copyFileSync(tarball, join(consumer, 'server.tgz'));
        writeFileSync(
            join(consumer, 'package.json'),
            JSON.stringify({
                type: 'module',
                dependencies: { '@jpahd/kalendus-server': 'file:./server.tgz' },
            }),
        );
        // Install the tarball's production dependency graph, not the workspace's dev types.
        // The type check doesn't need a native SQLite build or auto-installed optional peers.
        run(
            [
                'bun',
                'install',
                '--production',
                '--ignore-scripts',
                '--omit=peer',
                '--prefer-offline',
                '--linker=hoisted',
                '--backend=copyfile',
            ],
            consumer,
        );
        const entry = join(consumer, 'consumer.ts');
        writeFileSync(
            entry,
            `
        import { createDb, createApp, migrateDb, type EventPage } from '@jpahd/kalendus-server';
        import { KalendusApiClient } from '@jpahd/kalendus-server/client';
        const db = createDb();
        migrateDb(db);
        const { app, eventService } = createApp({ db, authorize: ({ request }) => request.method === 'GET' });
        const response: Response = await app.request('/health');
        const client = new KalendusApiClient({ baseUrl: '', calendarId: 'packed' });
        const page: EventPage = await eventService.getByRangePage('packed', '2026-03-15', '2026-03-15');
        const next: EventPage = await client.fetchRawEventPage('2026-03-15', '2026-03-15', {
            after: page.nextCursor ?? undefined,
        });
        db.$client.close();
        // @ts-expect-error A native SQLite statement must be a string (the client must not be any).
        db.$client.prepare(123);
    `,
        );
        const options: ts.CompilerOptions = {
            module: ts.ModuleKind.NodeNext,
            target: ts.ScriptTarget.ES2022,
            lib: ['lib.es2022.d.ts'],
            types: [],
            strict: true,
            skipLibCheck: false,
            noEmit: true,
        };
        const host = ts.createCompilerHost(options);
        host.getCurrentDirectory = () => consumer;
        const program = ts.createProgram([entry], options, host);
        const consumerRoot = consumer.replaceAll(sep, '/') + '/';
        const outsideFixture = program
            .getSourceFiles()
            .find(
                (file) =>
                    !program.isSourceFileDefaultLibrary(file) &&
                    !file.fileName.startsWith(consumerRoot),
            );
        if (outsideFixture) {
            throw new Error(
                `Packed consumer resolved outside its fixture: ${outsideFixture.fileName}`,
            );
        }
        const diagnostics = ts.getPreEmitDiagnostics(program);
        const drizzle = consumerRoot + 'node_modules/drizzle-orm/';
        const failures = diagnostics.filter(
            (diagnostic) => !isKnownDrizzleIssue(diagnostic, drizzle),
        );
        if (failures.length) {
            throw new Error(
                `Packed consumer declaration check failed\n${ts.formatDiagnostics(failures, host)}`,
            );
        }
        if (diagnostics.length) {
            console.warn(
                `LIMIT: ${diagnostics.length} known Drizzle declaration diagnostics (optional gel/mysql2 peers and internal type errors) excluded; the strict dependency graph does not pass unfiltered.`,
            );
        }
        console.log(
            'PASS isolated packed createDb/createApp consumer and native client typing (strict, with only the listed Drizzle exceptions).',
        );
    } finally {
        rmSync(consumer, { recursive: true, force: true });
    }
}

try {
    const tarball = join(fixture, 'server.tgz');
    run(['bun', 'pm', 'pack', '--ignore-scripts', '--filename', tarball], server);
    checkPackedTypes(tarball);
    const unpacked = join(fixture, 'installed');
    mkdirSync(unpacked);
    run(['tar', '-xzf', tarball, '-C', unpacked]);
    const scope = join(fixture, 'node_modules', '@jpahd');
    mkdirSync(scope, { recursive: true });
    const installed = join(scope, 'kalendus-server');
    symlinkSync(join(unpacked, 'package'), installed, 'dir');
    const caller = join(fixture, 'unrelated-cwd');
    mkdirSync(caller);
    const database = join(fixture, 'custom', 'nested', 'calendar.db');
    writeFileSync(
        join(caller, 'smoke.mjs'),
        `
        import assert from 'node:assert/strict';
        import { createDb, createApp, migrateDb, CalendarServiceImpl } from '@jpahd/kalendus-server';
        import { KalendusApiClient } from '@jpahd/kalendus-server/client';
        const db = createDb();
        try {
            migrateDb(db); migrateDb(db);
            const calendars = new CalendarServiceImpl(db);
            const calendar = await calendars.create({ name: 'Packed custom path' });
            if (!await calendars.getById(calendar.id)) throw new Error('Missing persisted calendar');
            const { app } = createApp({ db });
            if ((await app.request('/api/calendars/' + calendar.id)).status !== 403) throw new Error('Private package default was open');

            const reader = createApp({ db, authorize: ({ action, resource, calendarId }) =>
                action === 'read' && resource === 'event' && calendarId === calendar.id,
            });
            const client = new KalendusApiClient({
                baseUrl: 'https://fixture.example',
                calendarId: calendar.id,
                fetch: (url, init) => reader.app.request(url, init),
            });
            const day = { year: 2026, month: 3, day: 15 };
            const range = ['2026-03-15', '2026-03-15'];
            const entries = [await reader.eventService.create(calendar.id, { heading: 'Packed page', date: { start: day, end: day } }),
                await reader.eventService.create(calendar.id, { heading: 'Packed page 2', date: { start: day, end: day } })
            ].sort((a, b) => a.id < b.id ? -1 : 1);
            const first = await client.fetchRawEventPage(...range, { limit: 1 });
            assert.deepEqual(first, { entries: [entries[0]], nextCursor: entries[0].id });
            assert.deepEqual(await client.fetchRawEventPage(...range, { limit: 1, after: first.nextCursor }), {
                entries: [entries[1]], nextCursor: null,
            });
            for (const { id } of entries) assert.equal(await reader.eventService.delete(calendar.id, id), true);
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
    const migrationCli = join(installed, 'dist', 'db', 'migrate.js');
    const importDirectory = join(fixture, 'import-only');
    run(
        [
            'node',
            '--input-type=module',
            '--eval',
            `await import('@jpahd/kalendus-server/migrate'); await import('@jpahd/kalendus-server');`,
            // Even if argv[1] names the CLI, eval mode is not direct execution.
            migrationCli,
        ],
        caller,
        { DATABASE_URL: join(importDirectory, 'custom.db') },
    );
    if (existsSync(importDirectory))
        throw new Error('Importing migrations touched the database path');

    const cliDatabase = join(fixture, 'cli', 'custom#calendar.db');
    const cliUrl = pathToFileURL(cliDatabase).href;
    run(['node', migrationCli], caller, { DATABASE_URL: cliUrl });
    if (!existsSync(cliDatabase))
        throw new Error('Linked migration CLI did not create its database');
    writeFileSync(
        join(caller, 'verify-migration.mjs'),
        `
        import assert from 'node:assert/strict';
        import { createDb, databasePath, calendars, events } from '@jpahd/kalendus-server';
        const filename = process.argv[2];
        const url = process.env.DATABASE_URL;
        assert.equal(databasePath(filename), filename);
        assert.equal(databasePath(url), filename);
        assert.equal(databasePath(':memory:'), ':memory:');
        for (const suffix of ['?mode=ro', '#fragment', '?', '#']) {
            assert.throws(() => databasePath(url + suffix), /must not contain a query or fragment/);
        }
        const db = createDb();
        try {
            assert.deepEqual(db.select().from(calendars).all(), []);
            assert.deepEqual(db.select().from(events).all(), []);
            assert.ok(db.$client.prepare('SELECT 1 FROM __drizzle_migrations LIMIT 1').get());
        } finally { db.$client.close(); }
    `,
    );
    run(['node', join(caller, 'verify-migration.mjs'), cliDatabase], caller, {
        DATABASE_URL: cliUrl,
    });
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
        'PASS packed exports, side-effect-free migration imports, linked CLI schema, idempotent custom-path migration, seed, runtime, event pagination, and closed default (unrelated cwd).',
    );
} finally {
    rmSync(fixture, { recursive: true, force: true });
}
