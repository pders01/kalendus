import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lms-calendar.ts'),
      name: 'LMSCalendar',
      fileName: () => 'lms-calendar.bundled.js',
      formats: ['es'],
    },
    outDir: 'build',
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      ecma: 2020,
      module: true,
    },
    rollupOptions: {
      external: /^lit/,
      output: {
        preserveModules: false,
      },
    },
  },
  plugins: [
    // Copy images plugin equivalent
    {
      name: 'copy-images',
      generateBundle() {
        // Copy images directory to build output
        const copyDir = (src: string, dest: string) => {
          if (existsSync(src)) {
            if (!existsSync(dest)) {
              mkdirSync(dest, { recursive: true });
            }
            const entries = readdirSync(src, {
              withFileTypes: true,
            });

            for (const entry of entries) {
              const srcPath = join(src, entry.name);
              const destPath = join(dest, entry.name);

              if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
              } else {
                copyFileSync(srcPath, destPath);
              }
            }
          }
        };

        copyDir('images', 'build/images');
      },
    },
  ],
});
