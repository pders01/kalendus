import { defineConfig } from 'vite';

// Keep gestures out of the default ESM and IIFE bundles.
export default defineConfig({
    build: {
        lib: {
            entry: 'src/entry-interactions.ts',
            fileName: () => 'entry-interactions.js',
            formats: ['es'],
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        rollupOptions: { external: ['luxon'] },
    },
});
