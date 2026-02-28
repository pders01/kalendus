import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/lms-calendar.ts'),
            name: 'Kalendus',
            fileName: () => 'kalendus.iife.js',
            formats: ['iife'],
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
            ecma: 2020,
            module: false,
        },
        rollupOptions: {
            // No externals — inline everything for the WebView bundle
            external: [],
            output: {
                preserveModules: false,
                // The IIFE is loaded for side effects (customElements.define),
                // not to access exports — suppress the named/default warning.
                exports: 'named',
            },
        },
    },
});
