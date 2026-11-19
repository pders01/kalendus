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
import { fileURLToPath } from 'node:url';

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
        import { createDb, createApp, migrateDb } from '@jpahd/kalendus-server';
        const db = createDb();
        migrateDb(db);
        const { app } = createApp({ db, authorize: ({ request }) => request.method === 'GET' });
        const response: Response = await app.request('/health');
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
