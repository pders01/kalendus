import type { Preview } from '@storybook/web-components-vite';
import { html } from 'lit';

const preview: Preview = {
    parameters: {
        actions: { argTypesRegex: '^on[A-Z].*' },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
            expanded: true,
        },
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => html`
            <div
                style="width: 100%; height: 720px; padding: 16px; box-sizing: border-box; background: #f6f7f9;"
            >
                ${Story()}
            </div>
        `,
    ],
};

export default preview;
