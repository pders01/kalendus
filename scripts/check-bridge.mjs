#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const browser = process.argv.slice(2).includes('--browser');
const commands = [
    ['expo-bridge/build-shell.mjs', '--check'],
    [
        'run',
        'tsc',
        '--noEmit',
        '--strict',
        '--noUnusedLocals',
        '--noUnusedParameters',
        '--target',
        'ES2020',
        '--module',
        'ES2020',
        '--moduleResolution',
        'bundler',
        '--lib',
        'ES2020,DOM',
        '--types',
        'node',
        'expo-bridge/types.ts',
        'expo-bridge/protocol.ts',
        'expo-bridge/shell.ts',
    ],
    [
        'run',
        'mocha',
        '--no-config',
        '--require=ts-node/register',
        '--loader=ts-node/esm',
        'test/unit/lib/expoBridge.test.ts',
    ],
];
if (browser)
    commands.push(['run', 'web-test-runner', '--config', 'expo-bridge/web-test-runner.config.mjs']);
for (const args of commands) {
    console.log(`\n> bun ${args.join(' ')}`);
    const result = spawnSync('bun', args, {
        cwd: root,
        stdio: 'inherit',
        env: {
            ...process.env,
            NODE_OPTIONS: [process.env.NODE_OPTIONS, '--experimental-vm-modules']
                .filter(Boolean)
                .join(' '),
        },
    });
    if (result.error) throw result.error;
    if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(
    '\nBridge checks passed. React Native/Expo TSX and release devices are separate gates; see expo-bridge/README.md.',
);
