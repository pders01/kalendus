// Import rollup plugins
import typescript from '@rollup/plugin-typescript';
import {copy} from '@web/rollup-plugin-copy';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import minifyHTML from "rollup-plugin-html-literals";
// import summary from 'rollup-plugin-summary';

export default {
  input: 'src/lms-calendar.ts',
  plugins: [
    resolve(),
    // Minify HTML template literals
    typescript(),
    // Resolve bare module specifiers to relative paths
    minifyHTML(),
    // Minify JS
    terser({
      ecma: 2020,
      module: true,
      warnings: true,
    }),
    // Print bundle summary
    // summary(),
    // Optional: copy any static assets to build directory
    copy({
      patterns: ['images/**/*'],
    }),
  ],
  output: {
    format: 'esm',
    sourcemap: true,
    file: 'build/lms-calendar.bundled.js'
  },
  preserveEntrySignatures: 'strict',
};
