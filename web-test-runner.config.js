import { vitePlugin } from '@remcovaes/web-test-runner-vite-plugin';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
    files: 'test/unit/components/**/*.test.ts',
    browsers: (process.env.TEST_BROWSERS || 'chromium').split(',').map((product) => {
        if (!['chromium', 'firefox', 'webkit'].includes(product)) {
            throw new Error(`Unsupported TEST_BROWSERS product: ${product}`);
        }
        return playwrightLauncher({ product });
    }),
    testsFinishTimeout: 60000,
    plugins: [
        vitePlugin({
            // The plugin accepts Vite options directly, not under `viteConfig`.
            // Isolate its optimizer from concurrent Storybook/Vitest processes.
            configFile: false,
            cacheDir: 'node_modules/.vite-components',
            optimizeDeps: {
                include: [
                    '@open-wc/testing', 'lit', 'lit/decorators.js',
                    'lit/directives/repeat.js', 'lit/directives/style-map.js',
                    'lit/directives/class-map.js', 'lit/directives/if-defined.js', 'luxon', 'remeda', 'ts-ics',
                ],
            },
        }),
    ],
    coverageConfig: {
        exclude: ['**/node_modules/**', '**/test/**'],
    },
    testFramework: {
        config: {
            timeout: 3000,
        },
    },
};
