import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { expect, waitFor } from 'storybook/test';

import type Calendar from './lms-calendar.js';
import type { CalendarEntry } from './lms-calendar.js';
import './lms-calendar.js';

const activeDate = { year: 2026, month: 11, day: 17 };
const date = (day: number) => ({ ...activeDate, day });
const timed = (
    id: string,
    day: number,
    start: number,
    end: number,
    color = '#315ca8',
): CalendarEntry => ({
    id,
    heading: id,
    kind: 'timed',
    color,
    date: { start: date(day), end: date(day) },
    time: {
        start: { hour: Math.floor(start / 60), minute: start % 60 },
        end: { hour: Math.floor(end / 60), minute: end % 60 },
    },
});

const monthEntries: CalendarEntry[] = [
    {
        id: 'exhibition',
        heading: 'Exhibition · all day',
        kind: 'all-day',
        color: '#7b458e',
        date: { start: date(16), end: date(19) },
    },
    timed('Five-minute briefing', 17, 540, 545),
    timed('After a ten-minute gap', 17, 555, 560, '#236b52'),
    timed('Second short briefing', 17, 630, 635, '#236b52'),
    timed('Overlaps the second short briefing', 17, 633, 650, '#a54132'),
    timed('Point event · no duration', 17, 720, 720, '#715397'),
    timed('Long workshop', 17, 780, 900),
    timed('Contained in the workshop', 17, 840, 855, '#a54132'),
    timed('Afternoon reading', 17, 930, 975, '#236b52'),
    ...Array.from({ length: 6 }, (_, i) =>
        timed(`Dense session ${i + 1}`, 17, 1020, 1080, '#715397'),
    ),
    timed('Last five minutes of the day', 17, 1435, 1440),
    timed('Monday open studio', 16, 600, 630, '#236b52'),
    timed('Friday ceramics · discover across dates', 20, 840, 900, '#a54132'),
    timed('Saturday community reading', 21, 660, 720, '#236b52'),
    timed('Early opening', 17, 480, 485),
    {
        id: 'residency',
        heading: 'Artist residency',
        kind: 'all-day',
        color: '#236b52',
        date: { start: date(13), end: date(23) },
    },
    {
        id: 'night-survey',
        heading: 'Night survey · continuous timed',
        kind: 'timed',
        color: '#a54132',
        date: { start: date(21), end: date(24) },
        time: { start: { hour: 18, minute: 0 }, end: { hour: 9, minute: 0 } },
    },
];

const denseMonthEntries: CalendarEntry[] = [
    ...monthEntries,
    ...Array.from(
        { length: 40 },
        (_, index): CalendarEntry => ({
            id: `concurrent-${index}`,
            heading: `Same-color project ${index + 1}`,
            kind: 'all-day',
            color: '#236b52',
            date: {
                start:
                    index % 5 === 0 ? { year: 2026, month: 10, day: 28 } : date(13 + (index % 3)),
                end: index % 7 === 0 ? { year: 2026, month: 12, day: 3 } : date(20 + (index % 5)),
            },
        }),
    ),
];

const descriptions = new Map([
    ['exhibition', 'Drop in during gallery hours. Use the entrance on the courtyard side.'],
    ['Five-minute briefing', 'Meet at the front desk. Bring the revised agenda.'],
    [
        'Long workshop',
        `Meet at the west entrance ten minutes early. A host will guide the group to the upstairs studio. An elevator is available next to the information desk.
Bring a notebook and any sketches you want to discuss. Materials and handouts will be provided. The first hour covers demonstrations; the second is reserved for hands-on work and questions.
If you arrive after the workshop starts, check in at the front desk. You can leave at any time and pick up a handout on the way out.`,
    ],
]);
const quietDate = { year: 2026, month: 12, day: 4 };
const journeyEntries: CalendarEntry[] = [
    ...denseMonthEntries.map((entry) => ({ ...entry, content: descriptions.get(entry.id ?? '') })),
    { ...timed('One event on this date', 4, 540, 600), date: { start: quietDate, end: quietDate } },
    timed('Studio check-in', 18, 540, 585, '#236b52'),
    timed('Planning and setup', 18, 635, 675, '#715397'),
];
const yearOverviewEntries: CalendarEntry[] = [
    ...journeyEntries,
    ...Array.from({ length: 10 }, (_, i): CalendarEntry => {
        const start = { year: activeDate.year, month: i + 1, day: 6 + i };
        return {
            id: `year-outreach-${i}`,
            kind: 'all-day',
            heading: 'Community programme',
            date: { start, end: { ...start, day: start.day + (i % 3) } },
        };
    }),
];

type Args = {
    embedWidth: number;
    embedHeight: number;
    fontSize: number;
    locale: string;
    yearDensity: Calendar['yearDensityMode'];
};
const meta: Meta<Args> = {
    // Keep deep links to the live scenarios when organizing the sidebar.
    id: 'design-comparisons-presentation-variants',
    title: 'Visual review/Library scenarios',
    parameters: { layout: 'fullscreen', controls: { disable: true } },
    args: { embedWidth: 0, embedHeight: 0, fontSize: 16, locale: 'en', yearDensity: 'dot' },
};
export default meta;
type Story = StoryObj<Args>;

export const LibraryBrowseJourney: Story = {
    name: 'Library: Month → Agenda → Week',
    parameters: {
        docs: {
            description: {
                story: 'Pick Nov 17 to open Agenda. Use the Month button beside the date to return to the grid, or use the shared Week button to compare times. This example enables the opt-in Agenda accordion.',
            },
        },
    },
    render: () => html`<section style="max-inline-size: 26rem; margin-inline: auto">
        <lms-calendar locale="en" month-agenda-presentation="accordion" month-presentation="presence"
            .activeDate=${activeDate} .entries=${journeyEntries}></lms-calendar>
    </section>`,
    play: async ({ canvasElement }) => {
        const calendar = canvasElement.querySelector<Calendar>('lms-calendar')!;
        await waitFor(() => {
            expect(calendar.monthAgendaPresentation).toBe('accordion');
            expect(calendar.shadowRoot?.querySelector('lms-calendar-month')).not.toBeNull();
        });
    },
};

export const LibraryYearOverview: Story = {
    name: 'Library: Year overview',
    argTypes: {
        embedWidth: {
            control: { type: 'number', min: 0 },
            description: 'Width in pixels; 0 fills the canvas.',
        },
        embedHeight: {
            control: { type: 'number', min: 0 },
            description: 'Height in pixels; 0 fills the canvas.',
        },
        fontSize: { control: { type: 'range', min: 16, max: 28, step: 2 } },
        locale: { control: 'select', options: ['en', 'de', 'ar', 'ja'] },
        yearDensity: { control: 'select', options: ['dot', 'heatmap', 'count'] },
    },
    parameters: {
        controls: { disable: false },
        docs: {
            description: {
                story: 'The live Year overview with sparse months and a dense November. Pick November 17 to open its Month grid, then select the date again to browse Agenda. The week numbers open Week directly.',
            },
        },
    },
    render: ({ embedWidth, embedHeight, locale, fontSize, yearDensity }) => html`
        <lms-calendar view-mode="year" month-agenda-presentation="accordion" month-presentation="presence"
            .locale=${locale} .activeDate=${activeDate} .entries=${yearOverviewEntries} .yearDensityMode=${yearDensity}
            style=${styleMap({
                inlineSize: embedWidth ? `min(100%, ${embedWidth}px)` : '100%',
                // The shared Storybook decorator adds 16px of padding on each edge.
                blockSize: embedHeight ? `${embedHeight}px` : 'calc(100dvb - 32px)',
                marginInline: 'auto',
                fontSize: `${fontSize}px`,
            })}>
        </lms-calendar>`,
};

export const DenseWeekAllDaySummary: Story = {
    name: 'Dense Week: All-day totals',
    render: () => html`<section style="max-inline-size: 26rem; margin-inline: auto">
        <h2>Dense Week: All-day totals</h2>
        <p>Open a count to read that date’s all-day events. Close the list to return to your place in Week.</p>
        <lms-calendar locale="en" view-mode="week" .activeDate=${activeDate} .entries=${denseMonthEntries}></lms-calendar>
    </section>`,
};

export const SparseWeekAllDayChips: Story = {
    name: 'Sparse Week: All-day chips',
    render: () => html`<section style="max-inline-size: 26rem; margin-inline: auto">
        <h2>Sparse Week: All-day chips</h2>
        <p>When only a few all-day events share a date and its column is wide enough, Week still shows their titles.</p>
        <lms-calendar locale="en" view-mode="week" .activeDate=${activeDate} .entries=${monthEntries}></lms-calendar>
    </section>`,
};
