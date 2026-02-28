import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/lms-calendar.ts'),
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
});
