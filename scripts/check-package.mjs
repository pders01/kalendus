import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const root = resolve('.');
const temporary = mkdtempSync(join(tmpdir(), 'kalendus-consumers-'));
function run(command, args, cwd = root) {
    const result = spawnSync(command, args, { cwd, encoding: 'utf8' });
    if (result.error) throw result.error;
    if (result.status !== 0)
        throw new Error(`${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`);
    return result.stdout;
}
try {
    run('bun', ['pm', 'pack', '--destination', temporary]);
    const archive = readdirSync(temporary).find((name) => name.endsWith('.tgz'));
    if (!archive) throw new Error('Package archive was not produced');
    const consumer = join(temporary, 'consumer');
    const dependencies = join(consumer, 'node_modules');
    const installed = join(dependencies, '@jpahd', 'kalendus');
    mkdirSync(installed, { recursive: true });
    run('tar', ['-xzf', join(temporary, archive), '--strip-components=1', '-C', installed]);
    for (const dependency of ['lit', 'lit-html', 'luxon', '@types']) {
        const target = join(dependencies, dependency);
        mkdirSync(dirname(target), { recursive: true });
        symlinkSync(join(root, 'node_modules', dependency), target, 'dir');
    }
    writeFileSync(join(consumer, 'package.json'), JSON.stringify({ type: 'module' }));
    writeFileSync(
        join(consumer, 'index.ts'),
        `
import Calendar, { type CalendarEntry, type CalendarState, type ViewMode } from '@jpahd/kalendus';
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
            JSON.stringify({ compilerOptions, files: ['index.ts'] }),
        );
        run('bun', [
            join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
            '-p',
            join(consumer, 'tsconfig.json'),
        ]);
        console.log(`PASS packed ${moduleResolution} consumer (skipLibCheck=false)`);
    }
} finally {
    rmSync(temporary, { recursive: true, force: true });
}
