import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { expect, waitFor } from 'storybook/test';
import type { ViewportMap } from 'storybook/viewport';

import type Calendar from './lms-calendar.js';
import './lms-calendar.js';

const surfaces = ['Day', 'Week', 'Month', 'Agenda', 'Year'] as const;
const viewports = [
    ['compactAndroid', 'Compact Android', 360, 800, 'mobile'],
    ['compactIPhone', 'Compact iPhone', 375, 667, 'mobile'],
    ['standardIPhone', 'Standard iPhone', 390, 844, 'mobile'],
    ['largeAndroid', 'Large Android', 412, 915, 'mobile'],
    ['largeIPhone', 'Large iPhone', 440, 956, 'mobile'],
    ['phoneLandscape', 'Phone landscape', 844, 390, 'mobile'],
    ['openFoldable', 'Open foldable', 700, 900, 'tablet'],
    ['tabletPortrait', 'Tablet portrait', 820, 1180, 'tablet'],
    ['largeTextRTL', 'Large text + RTL', 320, 740, 'mobile'],
    ['desktop', 'Desktop', 1440, 900, 'desktop'],
    ['shallowDesktop', 'Shallow desktop', 1440, 570, 'desktop'],
] as const;
const options: ViewportMap = Object.fromEntries(
    viewports.map(([key, name, width, height, type]) => [
        key,
        {
            name: `${name} · ${width} × ${height}`,
            styles: { width: `${width}px`, height: `${height}px` },
            type,
        },
    ]),
);

const date = (day: number) => ({ year: 2026, month: 11, day });
const activeDate = date(17);
const span = (id: string, heading: string, start: number, end = start): CalendarEntry => ({
    id,
    heading,
    date: { start: date(start), end: date(end) },
    kind: 'all-day',
    color: '#236b52',
});
const timed = (
    id: string,
    heading: string,
    day: number,
    start: number,
    end: number,
    content?: string,
): CalendarEntry => ({
    id,
    heading,
    date: { start: date(day), end: date(day) },
    kind: 'timed',
    color: '#315ca8',
    content,
    time: {
        start: { hour: Math.floor(start / 60), minute: start % 60 },
        end: { hour: Math.floor(end / 60), minute: end % 60 },
    },
});
const sparse: CalendarEntry[] = [
    span('residency', 'Artist residency', 13, 23),
    span('exhibition', 'Courtyard exhibition', 16, 19),
    timed('rounds', 'Late-night rounds', 17, 5, 25),
    timed('briefing', 'Five-minute briefing', 17, 540, 545),
    timed('setup', 'Equipment and room setup', 17, 545, 565),
    timed(
        'workshop',
        'Long workshop in the community studio',
        17,
        600,
        720,
        'Use the courtyard entrance and check in at the front desk. Materials will be distributed during the opening briefing.\n\nAfter the break, return to the same studio for the practical session and questions.',
    ),
    timed('studio', 'Studio check-in', 18, 540, 585),
    timed('reading', 'Community reading', 21, 660, 720),
    ...[2, 5, 8].map((month): CalendarEntry => {
        const start = { year: 2026, month, day: 10 };
        return {
            id: `outreach-${month}`,
            heading: 'Community programme',
            kind: 'all-day',
            date: { start, end: { ...start, day: 12 } },
        };
    }),
];
const dense = [
    ...sparse,
    ...Array.from({ length: 52 }, (_, i) =>
        span(`project-${i}`, `Community project ${i + 1}`, 16 - (i % 3), 17 + (i % 5)),
    ),
    ...Array.from({ length: 12 }, (_, i) =>
        timed(`session-${i}`, `Parallel session ${i + 1}`, 17, 600 + i * 5, 640 + i * 5),
    ),
];

type Args = {
    locale: string;
    fontSize: number;
    events: 'sparse' | 'dense';
    monthPresentation: Calendar['monthPresentation'];
    yearDensity: Calendar['yearDensityMode'];
};
const meta: Meta<Args> = {
    id: 'calendar-viewport-matrix',
    title: 'Visual review/Viewport matrix',
    parameters: { layout: 'fullscreen', viewport: { options } },
    args: {
        locale: 'en',
        fontSize: 16,
        events: 'sparse',
        monthPresentation: 'auto',
        yearDensity: 'dot',
    },
    argTypes: {
        locale: { control: 'select', options: ['en', 'de', 'ar', 'ja'] },
        fontSize: { control: { type: 'range', min: 16, max: 28, step: 2 } },
        events: { control: 'radio', options: ['sparse', 'dense'] },
        monthPresentation: { control: 'select', options: ['auto', 'presence', 'previews'] },
        yearDensity: { control: 'select', options: ['dot', 'heatmap', 'count'] },
    },
};
export default meta;
type Story = StoryObj<Args>;

const reviewLink = (surface: string, viewport: string) => {
    const params = new URLSearchParams({
        path: `/story/${meta.id}--${surface.toLowerCase()}`,
        globals: `viewport.value:${viewport}`,
    });
    if (viewport === 'largeTextRTL') params.set('args', 'locale:ar;fontSize:24');
    return `./?${params}`;
};
export const Matrix: Story = {
    parameters: { controls: { disable: true } },
    render: () => html`
        <style>
            .viewport-matrix { color: CanvasText; background: Canvas; font: 1rem/1.45 system-ui; padding: 1rem; }
            .viewport-matrix h1 { margin-block: 0 .5rem; }
            .viewport-matrix-table { overflow: auto; }
            .viewport-matrix table { inline-size: 100%; border-collapse: collapse; }
            .viewport-matrix caption { text-align: start; padding-block: .5rem; }
            .viewport-matrix :is(th, td) { border-block-end: 1px solid color-mix(in srgb, CanvasText 20%, Canvas); }
            .viewport-matrix th[scope='row'] { text-align: start; padding-inline-end: 1rem; }
            .viewport-matrix a { display: grid; place-items: center; min-inline-size: 44px; min-block-size: 44px; padding-inline: .5rem; color: LinkText; }
            .viewport-matrix .dimensions { display: block; font-weight: normal; white-space: nowrap; }
        </style>
        <section class="viewport-matrix" aria-labelledby="matrix-title">
            <h1 id="matrix-title">Calendar viewport matrix</h1>
            <p>Open a cell to review a live calendar with the same November 17 fixture. In the live story, use the viewport toolbar to change presets and Controls to try sparse or dense events, text sizes, and locales.</p>
            <p>The preset dimensions describe the frame in CSS pixels. The calendar has 16px of padding around it and can be larger than the available canvas when the Storybook panels are open. These presets do not emulate device input or browser behavior.</p>
            <div class="viewport-matrix-table" role="region" aria-label="Viewport and calendar view choices" tabindex="0">
                <table>
                    <caption>Starting view by viewport</caption>
                    <thead><tr><th scope="col">Viewport</th>${surfaces.map((surface) => html`<th scope="col">${surface}</th>`)}</tr></thead>
                    <tbody>${viewports.map(
                        ([key, name, width, height, type]) => html`
                        <tr data-width=${width} data-height=${height} data-input=${type === 'desktop' ? 'mouse' : 'touch'}><th scope="row">${name} <span class="dimensions">${width} × ${height}</span></th>
                            ${surfaces.map((surface) => html`<td><a href=${reviewLink(surface, key)} target="_top" aria-label=${`${surface} at ${width} by ${height} (${name})`}>${surface}</a></td>`)}
                        </tr>`,
                    )}
                    </tbody>
                </table>
            </div>
        </section>`,
    play: async ({ canvasElement }) => {
        await expect(canvasElement.querySelectorAll('tbody tr')).toHaveLength(viewports.length);
        await expect(canvasElement.querySelectorAll('tbody a')).toHaveLength(
            viewports.length * surfaces.length,
        );
    },
};

const review = (view: Calendar['viewMode']): Story => ({
    render: ({ locale, fontSize, events, monthPresentation, yearDensity }, { globals }) => {
        const viewport = globals.viewport;
        const preset = options[viewport?.value]?.styles;
        const [width, height] = viewport?.isRotated
            ? [preset?.height, preset?.width]
            : [preset?.width, preset?.height];
        return html`
        <lms-calendar month-agenda-presentation="accordion" .monthPresentation=${monthPresentation}
            .viewMode=${view} .locale=${locale} .activeDate=${activeDate}
            .entries=${events === 'dense' ? dense : sparse} .yearDensityMode=${yearDensity}
            style=${styleMap({
                // Keep the chosen embed even when Storybook's panels cap the preview frame.
                // Its shared decorator provides 16px of padding on each edge.
                inlineSize: width ? `calc(${width} - 32px)` : '100%',
                blockSize: `calc(${height ?? '100dvb'} - 32px)`,
                fontSize: `${fontSize}px`,
            })}>
        </lms-calendar>`;
    },
    play: async ({ canvasElement }) => {
        const calendar = canvasElement.querySelector<Calendar>('lms-calendar')!;
        await calendar.localeReady;
        await waitFor(() =>
            expect(calendar.shadowRoot?.querySelector(`lms-calendar-${view}`)).not.toBeNull(),
        );
    },
});
export const Day: Story = review('day');
export const Week: Story = review('week');
export const Month: Story = review('month');
export const Agenda: Story = {
    ...review('month'),
    play: async ({ canvasElement }) => {
        const calendar = canvasElement.querySelector<Calendar>('lms-calendar')!;
        await calendar.localeReady;
        if (!calendar.shadowRoot?.querySelector('.accordion-agenda')) {
            // Agenda is a Month drill-down, not a fifth view mode. Open it via the normal date control.
            const dateButton = await waitFor(() => {
                const button = calendar.shadowRoot
                    ?.querySelector('lms-calendar-month')
                    ?.shadowRoot?.querySelector<HTMLButtonElement>(
                        '.indicator[data-date="2026-11-17"]',
                    );
                if (!button) throw new Error('The Nov 17 Month date control has not rendered');
                return button;
            });
            dateButton.click();
        }
        await waitFor(() =>
            expect(
                calendar.shadowRoot?.querySelector('.accordion-agenda .agenda-event'),
            ).toBeTruthy(),
        );
    },
};
export const Year: Story = review('year');
