import { vitePlugin } from '@remcovaes/web-test-runner-vite-plugin';
import { playwrightLauncher } from '@web/test-runner-playwright';

export default {
    files: 'test/unit/components/**/*.test.ts',
    browsers: [playwrightLauncher({ product: 'chromium' })],
    plugins: [
        vitePlugin({
            viteConfig: {
                optimizeDeps: {
                    exclude: ['@lit-labs/observers', 'remeda'],
                },
            },
        }),
    ],
    coverage: true,
    coverageConfig: {
        exclude: ['**/node_modules/**', '**/test/**'],
    },
    testFramework: {
        config: {
            timeout: 3000,
        },
    },
};
