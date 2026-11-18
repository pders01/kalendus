// Optional workspace browser integration: uses existing browser tooling, never loaded by `test`.
import { fileURLToPath } from 'node:url';

import { vitePlugin } from '@remcovaes/web-test-runner-vite-plugin';
import { playwrightLauncher } from '@web/test-runner-playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
export default {
    rootDir: root,
    files: [fileURLToPath(new URL('./test/browser/**/*.browser.ts', import.meta.url))],
    browsers: (process.env.TEST_BROWSERS ?? 'chromium').split(',').map((product) => {
        if (!['chromium', 'firefox', 'webkit'].includes(product))
            throw new Error(`Unsupported browser: ${product}`);
        return playwrightLauncher({ product });
    }),
    testsFinishTimeout: 60_000,
    plugins: [
        vitePlugin({
            root,
            configFile: fileURLToPath(new URL('../vite.config.ts', import.meta.url)),
            cacheDir: `${root}node_modules/.vite-server-browser`,
            optimizeDeps: {
                exclude: ['@lit-labs/observers', 'remeda'],
                include: ['lit/directives/if-defined.js', 'ts-ics'],
            },
        }),
    ],
    testFramework: { config: { timeout: 10_000 } },
};
