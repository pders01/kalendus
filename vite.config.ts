/// <reference types="vitest/config" />
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

import { staticLitCss } from './scripts/static-lit-css.mjs';

const dirname =
    typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        staticLitCss(),
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
            compress: { passes: 3 },
            // Lit is external in this build and has its own short property names.
            // Calendar internals use _name, not Lit's _$name markers. The
            // separate output namespace avoids collisions on Lit subclasses.
            mangle: {
                properties: {
                    regex: /^_[a-zA-Z]/,
                    // Lit legacy decorators receive literal property names; those
                    // keys must agree with the emitted member accesses.
                    reserved: [
                        '_accent',
                        '_agendaError',
                        '_agendaExpanded',
                        '_agendaLimit',
                        '_agendaSelected',
                        '_agendaTrace',
                        '_bodyScrollable',
                        '_calendarWidth',
                        '_compactMonth',
                        '_counts',
                        '_densityList',
                        '_displayDate',
                        '_displayYear',
                        '_entriesError',
                        '_exportError',
                        '_exporting',
                        '_focusedDate',
                        '_hasActiveSidebar',
                        '_hiddenCounts',
                        '_highlighted',
                        '_localeError',
                        '_localeReady',
                        '_localeVersion',
                        '_menuEventDetails',
                        '_menuOpen',
                        '_monthCapacity',
                        '_preferTimeGridScroll',
                        '_summaries',
                        '_timeGridColumnWidth',
                        '_timeGridForceStack',
                        '_timeGridMinimum',
                        '_timeGridScale',
                        '_timeGridStackMinimum',
                        '_weekFocus',
                    ],
                    keep_quoted: true,
                    nth_identifier: { get: (index) => `_k${index.toString(36)}` },
                },
            },
            module: true,
        },
        rollupOptions: {
            external: [/^lit/, /^luxon/],
            output: {
                preserveModules: false,
                // Keep locale loading lazy, sharing repeated dictionary keys across
                // small groups to avoid paying their gzip cost in every chunk.
                manualChunks(id) {
                    const catalog = /\/generated\/locales\/([a-z]{2})(?:-Hans)?\.ts$/.exec(id);
                    if (catalog)
                        return `locales-${Math.floor((catalog[1].charCodeAt(0) - 97) / 5)}`;
                    return undefined;
                },
            },
        },
    },
    test: {
        projects: [
            {
                extends: true,
                cacheDir: 'node_modules/.vite-vitest-storybook',
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
