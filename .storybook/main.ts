import type { StorybookConfig } from '@storybook/web-components-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|ts)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],

    framework: {
        name: '@storybook/web-components-vite',
        options: {},
    },

    async viteFinal(config) {
        return mergeConfig(config, {
            cacheDir: 'node_modules/.vite-storybook',
            build: {
                sourcemap: true,
            },
            server: {
                sourcemap: true,
            },
        });
    },
};

export default config;
