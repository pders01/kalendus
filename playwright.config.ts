import { defineConfig } from 'playwright/test';

export default defineConfig({
    testDir: 'test/e2e',
    timeout: 30_000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:6006',
        headless: true,
        viewport: { width: 1400, height: 900 },
    },
});
