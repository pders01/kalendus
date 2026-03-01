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
        options: {
            storySort: {
                method: 'alphabetical',
                order: [
                    'Components',
                    {
                        Kalendus: [
                            'Overview',
                            [
                                'Default',
                                'Month View',
                                'Fixed Month Snapshot',
                                'Empty State',
                                'Custom Theming',
                                'Default Theme',
                                'Ink Theme',
                                'Soft Theme',
                                'Brutalist Theme',
                                'Midnight Theme',
                                'Mobile View',
                                'Interaction Test',
                                'Navigate Months',
                            ],
                            'Layout',
                            [
                                'Sunday-First Week',
                                'Saturday-First Week',
                                'Week Start Comparison',
                                'Condensed Week (3-Day)',
                                'Condensed Week Modes',
                            ],
                            'Stress Tests',
                            [
                                'Heavy Event Load',
                                'Stress Test (All Views)',
                                'Overlapping Events',
                                'Extreme Edge Cases',
                            ],
                            'Localization',
                            [
                                '\u0627\u0644\u0639\u0631\u0628\u064a\u0629 (Arabic)',
                                '\u09ac\u09be\u0982\u09b2\u09be (Bengali)',
                                '\u7b80\u4f53\u4e2d\u6587 (Chinese Simplified)',
                                'Nederlands (Dutch)',
                                'English (US)',
                                'Fran\u00e7ais (French)',
                                'Deutsch (German)',
                                '\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi)',
                                'Indonesia (Indonesian)',
                                'Italiano (Italian)',
                                '\u65e5\u672c\u8a9e (Japanese)',
                                '\ud55c\uad6d\uc5b4 (Korean)',
                                'Polski (Polish)',
                                'Portugu\u00eas (Portuguese)',
                                '\u0420\u0443\u0441\u0441\u043a\u0438\u0439 (Russian)',
                                'Espa\u00f1ol (Spanish)',
                                '\u0e44\u0e17\u0e22 (Thai)',
                                'T\u00fcrk\u00e7e (Turkish)',
                                '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430 (Ukrainian)',
                                'Ti\u1ebfng Vi\u1ec7t (Vietnamese)',
                                'Locale Showcase',
                            ],
                            'Year View',
                            ['Year Overview', 'Year Density Modes', 'Year Drill-Down'],
                        ],
                    },
                ],
            },
        },
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
