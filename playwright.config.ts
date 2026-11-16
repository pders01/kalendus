import { defineConfig } from 'playwright/test';

const port = Number(process.env.E2E_PORT ?? 6006);
if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('E2E_PORT must be an integer between 1 and 65535');
const origin = `http://127.0.0.1:${port}`;

export default defineConfig({
    testDir: 'test/e2e',
    timeout: 30_000,
    retries: 0,
    webServer: {
        command: `bun run build-storybook -- --quiet && bunx vite preview --outDir storybook-static --port ${port} --host 127.0.0.1 --strictPort`,
        url: `${origin}/iframe.html`,
        // A local dev server must not silently stand in for the production artifact.
        reuseExistingServer: false,
        timeout: 180_000,
    },
    use: {
        baseURL: origin,
        headless: true,
        viewport: { width: 1400, height: 900 },
    },
});
