import type { StorybookConfig } from '@storybook/web-components-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|ts)'],
    addons: ['@storybook/addon-docs'],

    framework: {
        name: '@storybook/web-components-vite',
        options: {},
    },

    async viteFinal(config) {
        return mergeConfig(config, {
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
