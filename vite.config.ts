/// <reference types="vitest/config" />
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const dirname =
    typeof __dirname !== 'undefined'
        ? __dirname
        : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        viteStaticCopy({
            targets: [{ src: 'src/themes/*', dest: 'themes' }],
        }),
    ],
    build: {
        lib: {
            entry: resolve(dirname, 'src/lms-calendar.ts'),
            name: 'LMSCalendar',
            fileName: () => 'kalendus.js',
            formats: ['es'],
        },
        outDir: 'dist',
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
            ecma: 2020,
            module: true,
        },
        rollupOptions: {
            external: [/^lit/, /^luxon/],
            output: {
                preserveModules: false,
            },
        },
    },
    test: {
        projects: [
            {
                extends: true,
                plugins: [
                    storybookTest({
                        configDir: path.join(dirname, '.storybook'),
                    }),
                ],
                test: {
                    name: 'storybook',
                    browser: {
                        enabled: true,
                        headless: true,
                        provider: playwright({}),
                        instances: [{ browser: 'chromium' }],
                    },
                    setupFiles: ['.storybook/vitest.setup.ts'],
                },
            },
        ],
    },
});
