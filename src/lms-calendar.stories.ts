import { expect, userEvent } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/web-components';
import { html } from 'lit';
import './lms-calendar.js';
import type LMSCalendar from './lms-calendar.js';
import type { CalendarEntry } from './lms-calendar.js';

const meta: Meta<LMSCalendar> = {
    title: 'Components/LMSCalendar',
    component: 'lms-calendar',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        heading: {
            control: 'text',
            description: 'Calendar heading text',
        },
        color: {
            control: 'color',
            description: 'Primary calendar color',
        },
        activeDate: {
            control: 'object',
            description: 'Currently active date',
        },
        entries: {
            control: 'object',
            description: 'Array of calendar entries',
        },
    },
    args: {
        heading: 'My Calendar',
        color: '#1976d2',
        activeDate: {
            day: new Date().getDate(),
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
        },
    },
};

export default meta;

type Story = StoryObj<
    LMSCalendar & {
        heading?: string;
        color?: string;
        activeDate?: { day: number; month: number; year: number };
        entries?: CalendarEntry[];
    }
>;

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const sampleEntries: CalendarEntry[] = [
    {
        heading: 'Morning Standup',
        content: 'Daily team sync meeting',
        color: '#1976d2',
        isContinuation: false,
        date: {
            start: { day: 15, month: currentMonth, year: currentYear },
            end: { day: 15, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 9, minute: 0 },
            end: { hour: 9, minute: 30 },
        },
    },
    {
        heading: 'Design Workshop',
        content: 'UX/UI design review session',
        color: '#2e7d32',
        isContinuation: false,
        date: {
            start: { day: 15, month: currentMonth, year: currentYear },
            end: { day: 15, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 10, minute: 0 },
            end: { hour: 12, minute: 0 },
        },
    },
    {
        heading: 'Lunch & Learn',
        content: 'Tech talk on web components',
        color: '#ff9800',
        isContinuation: false,
        date: {
            start: { day: 15, month: currentMonth, year: currentYear },
            end: { day: 15, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 12, minute: 30 },
            end: { hour: 13, minute: 30 },
        },
    },
    {
        heading: 'Team Offsite',
        content: 'All-day team building event',
        color: '#d32f2f',
        isContinuation: false,
        date: {
            start: { day: 16, month: currentMonth, year: currentYear },
            end: { day: 16, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 0, minute: 0 },
            end: { hour: 23, minute: 59 },
        },
    },
    {
        heading: 'Product Sprint',
        content: 'Multi-day product development sprint',
        color: '#6a1b9a',
        isContinuation: false,
        date: {
            start: { day: 20, month: currentMonth, year: currentYear },
            end: { day: 22, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 8, minute: 0 },
            end: { hour: 17, minute: 0 },
        },
    },
    {
        heading: 'Code Review',
        content: 'Weekly code review session',
        color: '#00acc1',
        isContinuation: false,
        date: {
            start: { day: 18, month: currentMonth, year: currentYear },
            end: { day: 18, month: currentMonth, year: currentYear },
        },
        time: {
            start: { hour: 14, minute: 0 },
            end: { hour: 15, minute: 30 },
        },
    },
];

export const Default: Story = {
    args: {
        entries: sampleEntries,
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
};

export const MonthView: Story = {
    args: {
        activeDate: { day: 1, month: currentMonth, year: currentYear },
        entries: sampleEntries,
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
};

export const EmptyCalendar: Story = {
    args: {
        heading: 'Empty Calendar',
        entries: [],
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
};

export const CustomTheming: Story = {
    args: {
        entries: sampleEntries,
        color: '#9c27b0',
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            style="
        height: 720px; 
        display: block;
        --primary-color: #9c27b0;
        --background-color: #f5f5f5;
        --entry-border-radius: 10px;
        --header-height: 4em;
      "
        ></lms-calendar>
    `,
};

export const MobileView: Story = {
    args: {
        entries: sampleEntries,
    },
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
    render: (args) => html`
        <div style="width: 375px; height: 667px;">
            <lms-calendar
                .heading=${args.heading}
                .activeDate=${args.activeDate}
                .entries=${args.entries}
                .color=${args.color}
                style="height: 100%; display: block;"
            ></lms-calendar>
        </div>
    `,
};

export const WithInteractions: Story = {
    args: {
        activeDate: { day: 15, month: currentMonth, year: currentYear },
        entries: sampleEntries,
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        // Wait for the calendar to be rendered
        await new Promise((resolve) => setTimeout(resolve, 100));

        const calendar = canvasElement.querySelector(
            'lms-calendar',
        ) as LMSCalendar;
        await expect(calendar).toBeInTheDocument();

        // Access the shadow root
        const shadowRoot = calendar.shadowRoot;
        await expect(shadowRoot).toBeTruthy();

        // Find and click the day view button
        const header = shadowRoot?.querySelector('lms-calendar-header');
        if (header) {
            const headerShadow = header.shadowRoot;
            const dayButton = headerShadow?.querySelector(
                '[data-context="day"]',
            ) as HTMLElement;
            if (dayButton) {
                await userEvent.click(dayButton);

                // Wait for view change
                await new Promise((resolve) => setTimeout(resolve, 300));

                // Verify day view is shown
                const dayView = shadowRoot?.querySelector('lms-calendar-day');
                await expect(dayView).toBeInTheDocument();
            }
        }
    },
};

export const SeptemberView: Story = {
    args: {
        heading: 'September Calendar',
        activeDate: { day: 1, month: 9, year: 2024 },
        entries: [
            {
                heading: 'Test Event',
                content: 'September test event',
                color: '#1976d2',
                isContinuation: false,
                date: {
                    start: { day: 15, month: 9, year: 2024 },
                    end: { day: 15, month: 9, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
            },
        ],
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
};

export const NavigateMonths: Story = {
    args: {
        activeDate: { day: 1, month: currentMonth, year: currentYear },
        entries: sampleEntries,
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        const calendar = canvasElement.querySelector(
            'lms-calendar',
        ) as LMSCalendar;
        await expect(calendar).toBeInTheDocument();

        const shadowRoot = calendar.shadowRoot;
        const header = shadowRoot?.querySelector('lms-calendar-header');

        if (header) {
            const headerShadow = header.shadowRoot;
            const nextButton = headerShadow?.querySelector(
                'button[name="next"]',
            ) as HTMLButtonElement;

            if (nextButton) {
                // Click next month button
                await userEvent.click(nextButton);
                await new Promise((resolve) => setTimeout(resolve, 300));

                // Click previous month button
                const prevButton = headerShadow?.querySelector(
                    'button[name="previous"]',
                ) as HTMLButtonElement;
                if (prevButton) {
                    await userEvent.click(prevButton);
                    await new Promise((resolve) => setTimeout(resolve, 300));
                }
            }
        }
    },
};
