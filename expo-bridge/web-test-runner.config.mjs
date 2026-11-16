import { vitePlugin } from '@remcovaes/web-test-runner-vite-plugin';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
    files: 'expo-bridge/test/**/*.browser.test.ts',
    browsers: (process.env.TEST_BROWSERS || 'chromium').split(',').map(product => {
        if (!['chromium', 'firefox', 'webkit'].includes(product)) throw new Error(`Unsupported browser: ${product}`);
        return playwrightLauncher({ product });
    }),
    testsFinishTimeout: 60000,
    testRunnerHtml: testFramework => `<!doctype html><html><head>
        <script>window.__BRIDGE_INLINE__ = ${JSON.stringify(process.env.BRIDGE_TEST_INLINE === '1')};</script>
        </head><body><script type="module" src="${testFramework}"></script></body></html>`,
    plugins: [vitePlugin({ configFile: false, cacheDir: 'node_modules/.vite-expo-bridge',
        optimizeDeps: { include: ['@open-wc/testing', 'lit', 'lit/decorators.js',
            'lit/directives/repeat.js', 'lit/directives/style-map.js', 'lit/directives/class-map.js',
            'lit/directives/if-defined.js',
            'luxon', 'remeda', 'ts-ics'] } })],
    testFramework: { config: { timeout: 20000 } },
};
