import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { html } from 'lit';
import { expect, userEvent } from 'storybook/test';

import './lms-calendar.js';
import type LMSCalendar from './lms-calendar.js';
import type { CalendarEntry } from './lms-calendar.js';
import type { FirstDayOfWeek } from './lib/weekStartHelper.js';
import { getFirstDayForLocale } from './lib/weekStartHelper.js';

const meta: Meta<LMSCalendar> = {
    title: 'Components/Kalendus',
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
        firstDayOfWeek: {
            control: 'select',
            options: [0, 1, 2, 3, 4, 5, 6],
            description: 'First day of the week (0=Sun, 1=Mon, 6=Sat)',
        },
        locale: {
            control: 'select',
            options: ['en', 'ar', 'bn', 'de', 'de-DE', 'es', 'fr', 'hi', 'id', 'it', 'ja', 'ko', 'nl', 'pl', 'pt', 'ru', 'th', 'tr', 'uk', 'vi', 'zh-Hans'],
            description: 'Locale for UI strings and date formatting',
        },
        yearDrillTarget: {
            control: 'select',
            options: ['day', 'month'],
            description: 'Where day-click in year view navigates to',
        },
        yearDensityMode: {
            control: 'select',
            options: ['dot', 'heatmap', 'count'],
            description: 'Event density visualization in year view',
        },
    },
    args: {
        heading: 'My Calendar',
        color: '#1976d2',
        firstDayOfWeek: 1,
        locale: 'en',
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
        firstDayOfWeek?: number;
        locale?: string;
        yearDrillTarget?: 'day' | 'month';
        yearDensityMode?: 'dot' | 'heatmap' | 'count';
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
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
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
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
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
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
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
            .locale=${args.locale}
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
                .firstDayOfWeek=${args.firstDayOfWeek}
                .locale=${args.locale}
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
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        // Wait for the calendar to be rendered
        await new Promise((resolve) => setTimeout(resolve, 100));

        const calendar = canvasElement.querySelector('lms-calendar') as LMSCalendar;
        await expect(calendar).toBeInTheDocument();

        // Access the shadow root
        const shadowRoot = calendar.shadowRoot;
        await expect(shadowRoot).toBeTruthy();

        // Find and click the day view button
        const header = shadowRoot?.querySelector('lms-calendar-header');
        if (header) {
            const headerShadow = header.shadowRoot;
            const dayButton = headerShadow?.querySelector('[data-context="day"]') as HTMLElement;
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
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
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
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        const calendar = canvasElement.querySelector('lms-calendar') as LMSCalendar;
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

// Generate heavy event load for stress testing - simulates real-world usage
const generateHeavyEventLoad = (): CalendarEntry[] => {
    const events: CalendarEntry[] = [];
    const colors = [
        '#1976d2',
        '#2e7d32',
        '#ff9800',
        '#d32f2f',
        '#6a1b9a',
        '#00acc1',
        '#8bc34a',
        '#ff5722',
        '#9c27b0',
        '#607d8b',
        '#e91e63',
        '#00bcd4',
        '#ffeb3b',
        '#795548',
        '#3f51b5',
        '#673ab7',
        '#009688',
        '#4caf50',
        '#ffc107',
        '#f44336',
    ];

    const eventTypes = [
        {
            heading: 'Team Standup',
            content: 'Daily team sync meeting',
            typical: true,
        },
        { heading: 'Code Review', content: 'PR review session', typical: true },
        {
            heading: 'Client Call',
            content: 'Project status update',
            typical: true,
        },
        {
            heading: 'Lunch Meeting',
            content: 'Working lunch discussion',
            typical: true,
        },
        {
            heading: 'Sprint Planning',
            content: 'Plan next sprint backlog',
            typical: false,
        },
        {
            heading: 'Design Workshop',
            content: 'UX/UI design session',
            typical: false,
        },
        {
            heading: 'Training Session',
            content: 'Skill development workshop',
            typical: false,
        },
        {
            heading: 'Architecture Review',
            content: 'System design review',
            typical: false,
        },
        {
            heading: 'Demo Prep',
            content: 'Prepare for client demo',
            typical: true,
        },
        {
            heading: 'Bug Triage',
            content: 'Review and prioritize bugs',
            typical: true,
        },
        {
            heading: 'Performance Review',
            content: '1-on-1 performance meeting',
            typical: false,
        },
        {
            heading: 'Documentation',
            content: 'Update project documentation',
            typical: true,
        },
        {
            heading: 'Testing Session',
            content: 'QA testing time block',
            typical: true,
        },
        {
            heading: 'Deployment',
            content: 'Production deployment window',
            typical: false,
        },
        {
            heading: 'Board Meeting',
            content: 'Executive board meeting',
            typical: false,
        },
        {
            heading: 'Customer Support',
            content: 'Customer support rotation',
            typical: true,
        },
        {
            heading: 'Interview',
            content: 'Technical interview session',
            typical: true,
        },
        {
            heading: 'All Hands',
            content: 'Company all-hands meeting',
            typical: false,
        },
        {
            heading: 'Vendor Call',
            content: 'Third-party vendor discussion',
            typical: true,
        },
        {
            heading: 'Retrospective',
            content: 'Sprint retrospective meeting',
            typical: false,
        },
    ];

    // Function to get realistic days in current month
    const getDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month, 0).getDate();
    };

    const daysInCurrentMonth = getDaysInMonth(currentMonth, currentYear);

    // Generate events for the full month
    for (let day = 1; day <= daysInCurrentMonth; day++) {
        const dayOfWeek = new Date(currentYear, currentMonth - 1, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isMonday = dayOfWeek === 1;
        const isFriday = dayOfWeek === 5;

        // Realistic event density based on day type
        let baseEventsPerDay: number;
        if (isWeekend) {
            baseEventsPerDay = Math.random() < 0.3 ? 1 : 0; // Minimal weekend events
        } else if (isMonday || isFriday) {
            baseEventsPerDay = Math.floor(Math.random() * 4) + 8; // Heavy start/end of week
        } else {
            baseEventsPerDay = Math.floor(Math.random() * 6) + 6; // Normal weekday load
        }

        // Some days are extra busy (realistic variability)
        if (Math.random() < 0.15) {
            baseEventsPerDay += Math.floor(Math.random() * 8) + 5; // Very busy days
        }

        const eventsThisDay: CalendarEntry[] = [];

        for (let eventIndex = 0; eventIndex < baseEventsPerDay; eventIndex++) {
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];

            // More realistic time distribution
            let startHour: number;
            let startMinute: number;

            if (eventType.typical) {
                // Common meeting times
                startHour = [8, 9, 10, 11, 13, 14, 15, 16, 17][Math.floor(Math.random() * 9)];
                startMinute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
            } else {
                // Any business hours
                startHour = Math.floor(Math.random() * 11) + 8; // 8-18
                startMinute = Math.random() < 0.7 ? 0 : 30; // Prefer hour boundaries
            }

            // Realistic meeting durations
            const durations = [15, 30, 45, 60, 90, 120, 180, 240];
            const weights = [5, 40, 15, 25, 10, 3, 1, 1]; // 30min and 60min most common

            let durationMinutes: number;
            const randomWeight = Math.random() * weights.reduce((a, b) => a + b, 0);
            let cumWeight = 0;
            for (let i = 0; i < durations.length; i++) {
                cumWeight += weights[i];
                if (randomWeight <= cumWeight) {
                    durationMinutes = durations[i];
                    break;
                }
            }
            durationMinutes = durationMinutes! || 60;

            const endTime = new Date();
            endTime.setHours(startHour, startMinute + durationMinutes);

            const endHour = endTime.getHours();
            const endMinute = endTime.getMinutes();

            // Skip events that go past reasonable business hours (22:00)
            if (endHour >= 22) continue;

            // Create overlapping events intentionally (realistic scenario)
            const shouldOverlap = Math.random() < 0.3 && eventsThisDay.length > 0;
            if (shouldOverlap) {
                const existingEvent =
                    eventsThisDay[Math.floor(Math.random() * eventsThisDay.length)];
                startHour = existingEvent.time.start.hour;
                startMinute = existingEvent.time.start.minute + 15; // 15min offset
                if (startMinute >= 60) {
                    startHour += 1;
                    startMinute -= 60;
                }
            }

            const newEvent: CalendarEntry = {
                heading: `${eventType.heading}${eventIndex > 0 ? ` ${eventIndex + 1}` : ''}`,
                content: eventType.content,
                color: color,
                isContinuation: false,
                date: {
                    start: { day, month: currentMonth, year: currentYear },
                    end: { day, month: currentMonth, year: currentYear },
                },
                time: {
                    start: { hour: startHour, minute: startMinute },
                    end: { hour: endHour, minute: endMinute },
                },
            };

            eventsThisDay.push(newEvent);
        }

        events.push(...eventsThisDay);

        // Add recurring all-day events
        if (day === 1) {
            // Monthly all-day event
            events.push({
                heading: 'Monthly Planning Day',
                content: 'Strategic planning and goal setting',
                color: colors[0],
                isContinuation: false,
                date: {
                    start: { day, month: currentMonth, year: currentYear },
                    end: { day, month: currentMonth, year: currentYear },
                },
                time: {
                    start: { hour: 0, minute: 0 },
                    end: { hour: 23, minute: 59 },
                },
            });
        }

        // Occasional all-day events (holidays, training, etc.)
        if (Math.random() < 0.08) {
            // ~2-3 per month
            const allDayEvents = [
                'Company Retreat',
                'Training Day',
                'Conference',
                'Team Building',
                'Holiday',
                'Professional Development',
                'Hackathon',
                'Workshop Day',
            ];
            events.push({
                heading: allDayEvents[Math.floor(Math.random() * allDayEvents.length)],
                content: 'All-day event',
                color: colors[Math.floor(Math.random() * colors.length)],
                isContinuation: false,
                date: {
                    start: { day, month: currentMonth, year: currentYear },
                    end: { day, month: currentMonth, year: currentYear },
                },
                time: {
                    start: { hour: 0, minute: 0 },
                    end: { hour: 23, minute: 59 },
                },
            });
        }
    }

    // Add realistic multi-day events
    const multiDayEvents = [
        {
            heading: 'Annual Conference',
            content: 'Industry conference attendance',
            days: 3,
            month: currentMonth,
            probability: 0.3,
        },
        {
            heading: 'Sprint Week',
            content: 'Intensive development sprint',
            days: 5,
            month: currentMonth,
            probability: 0.8,
        },
        {
            heading: 'Training Program',
            content: 'Multi-day training certification',
            days: 4,
            month: currentMonth,
            probability: 0.4,
        },
        {
            heading: 'Client Visit Week',
            content: 'Extended client engagement',
            days: 3,
            month: currentMonth,
            probability: 0.5,
        },
        {
            heading: 'Release Week',
            content: 'Major product release cycle',
            days: 7,
            month: currentMonth,
            probability: 0.6,
        },
        {
            heading: 'Vendor Integration',
            content: 'Third-party system integration',
            days: 2,
            month: currentMonth,
            probability: 0.7,
        },
    ];

    multiDayEvents.forEach((event) => {
        if (Math.random() < event.probability) {
            const startDay = Math.floor(Math.random() * (daysInCurrentMonth - event.days)) + 1;
            const endDay = Math.min(startDay + event.days - 1, daysInCurrentMonth);

            // Create a single multi-day event with proper date range
            // The calendar system will handle expansion internally
            events.push({
                heading: event.heading,
                content: event.content,
                color: colors[Math.floor(Math.random() * colors.length)],
                isContinuation: false, // This is the original event, not a continuation
                date: {
                    start: {
                        day: startDay,
                        month: currentMonth,
                        year: currentYear,
                    },
                    end: {
                        day: endDay,
                        month: currentMonth,
                        year: currentYear,
                    },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 17, minute: 0 },
                },
            });
        }
    });

    // Sort events by date and time
    return events.sort((a, b) => {
        if (a.date.start.day !== b.date.start.day) {
            return a.date.start.day - b.date.start.day;
        }
        if (a.time.start.hour !== b.time.start.hour) {
            return a.time.start.hour - b.time.start.hour;
        }
        return a.time.start.minute - b.time.start.minute;
    });
};

export const HeavyEventLoad: Story = {
    args: {
        heading: 'Heavy Event Load Test',
        activeDate: { day: 15, month: currentMonth, year: currentYear },
        entries: generateHeavyEventLoad(),
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    parameters: {
        docs: {
            description: {
                story: 'Comprehensive stress test with 200+ realistic events across the full month. Simulates real-world heavy usage with 6-15 events per weekday, weekend events, intentional overlaps, various meeting durations (15min-4hrs), all-day events, and multi-day events. Tests performance, rendering quality, and overlap handling algorithms.',
            },
        },
    },
};

export const StressTestAllViews: Story = {
    args: {
        heading: 'Stress Test - All Views',
        activeDate: { day: 15, month: currentMonth, year: currentYear },
        entries: generateHeavyEventLoad(),
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        const calendar = canvasElement.querySelector('lms-calendar') as LMSCalendar;
        await expect(calendar).toBeInTheDocument();

        const shadowRoot = calendar.shadowRoot;
        const header = shadowRoot?.querySelector('lms-calendar-header');

        if (header) {
            const headerShadow = header.shadowRoot;

            // Test Month View (default)
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Switch to Week View
            const weekButton = headerShadow?.querySelector('[data-context="week"]') as HTMLElement;
            if (weekButton) {
                await userEvent.click(weekButton);
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Verify week view with heavy load
                const weekView = shadowRoot?.querySelector('lms-calendar-week');
                await expect(weekView).toBeInTheDocument();
            }

            // Switch to Day View
            const dayButton = headerShadow?.querySelector('[data-context="day"]') as HTMLElement;
            if (dayButton) {
                await userEvent.click(dayButton);
                await new Promise((resolve) => setTimeout(resolve, 1000));

                // Verify day view with heavy load
                const dayView = shadowRoot?.querySelector('lms-calendar-day');
                await expect(dayView).toBeInTheDocument();
            }

            // Navigate to next day to test different day's heavy load
            const nextButton = headerShadow?.querySelector(
                'button[name="next"]',
            ) as HTMLButtonElement;
            if (nextButton) {
                await userEvent.click(nextButton);
                await new Promise((resolve) => setTimeout(resolve, 500));
                await userEvent.click(nextButton);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }

            // Switch back to Month View
            const monthButton = headerShadow?.querySelector(
                '[data-context="month"]',
            ) as HTMLElement;
            if (monthButton) {
                await userEvent.click(monthButton);
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
    },
    parameters: {
        docs: {
            description: {
                story: 'Comprehensive stress test that automatically cycles through all three views (Month, Week, Day) with heavy event load. Tests view switching performance, rendering quality, and layout stability under realistic high-usage scenarios.',
            },
        },
    },
};

export const OverlappingEventsStressTest: Story = {
    args: {
        heading: 'Overlapping Events Stress Test',
        activeDate: { day: 15, month: currentMonth, year: currentYear },
        entries: (() => {
            const events: CalendarEntry[] = [];
            const testDay = 15;

            // Create 25 heavily overlapping events on the same day for maximum stress
            for (let i = 0; i < 25; i++) {
                const startHour = 9 + Math.floor(i / 5); // Start between 9-13
                const startMinute = (i % 5) * 12; // 0, 12, 24, 36, 48 minutes

                events.push({
                    heading: `Meeting ${i + 1}`,
                    content: `Overlapping meeting ${i + 1}`,
                    color: `hsl(${i * 14}, 70%, 50%)`, // Different colors
                    isContinuation: false,
                    date: {
                        start: {
                            day: testDay,
                            month: currentMonth,
                            year: currentYear,
                        },
                        end: {
                            day: testDay,
                            month: currentMonth,
                            year: currentYear,
                        },
                    },
                    time: {
                        start: { hour: startHour, minute: startMinute },
                        end: { hour: startHour + 1, minute: startMinute },
                    },
                });
            }

            return events;
        })(),
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    parameters: {
        docs: {
            description: {
                story: 'Extreme stress test with 25 heavily overlapping events on a single day. Tests the overlap detection algorithms, positioning calculations, and visual rendering quality under maximum load.',
            },
        },
    },
};

export const ExtremeEdgeCases: Story = {
    args: {
        heading: 'Extreme Edge Cases Test',
        activeDate: { day: 15, month: currentMonth, year: currentYear },
        entries: (() => {
            const events: CalendarEntry[] = [];

            // Test various extreme scenarios across multiple days
            for (let day = 10; day <= 20; day++) {
                // Day with 30+ events (unrealistic but tests limits)
                if (day === 15) {
                    for (let i = 0; i < 35; i++) {
                        const hour = 8 + (i % 12);
                        const minute = (i % 4) * 15;
                        events.push({
                            heading: `Extreme Event ${i + 1}`,
                            content: `Testing calendar limits`,
                            color: `hsl(${i * 10}, 60%, 45%)`,
                            isContinuation: false,
                            date: {
                                start: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                                end: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                            },
                            time: {
                                start: { hour, minute },
                                end: { hour: hour + 1, minute },
                            },
                        });
                    }
                }

                // Very short events (5 minutes)
                if (day === 12) {
                    for (let i = 0; i < 12; i++) {
                        events.push({
                            heading: `Quick ${i + 1}`,
                            content: `5-minute event`,
                            color: '#ff4444',
                            isContinuation: false,
                            date: {
                                start: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                                end: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                            },
                            time: {
                                start: { hour: 9 + i, minute: 0 },
                                end: { hour: 9 + i, minute: 5 },
                            },
                        });
                    }
                }

                // Very long events (8+ hours)
                if (day === 14) {
                    events.push({
                        heading: 'All-Day Workshop',
                        content: '8-hour intensive workshop',
                        color: '#9c27b0',
                        isContinuation: false,
                        date: {
                            start: {
                                day,
                                month: currentMonth,
                                year: currentYear,
                            },
                            end: {
                                day,
                                month: currentMonth,
                                year: currentYear,
                            },
                        },
                        time: {
                            start: { hour: 8, minute: 0 },
                            end: { hour: 18, minute: 0 },
                        },
                    });

                    // Overlapping shorter events within the long one
                    for (let i = 0; i < 6; i++) {
                        events.push({
                            heading: `Break ${i + 1}`,
                            content: `Break within workshop`,
                            color: '#00bcd4',
                            isContinuation: false,
                            date: {
                                start: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                                end: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                            },
                            time: {
                                start: { hour: 9 + i, minute: 30 },
                                end: { hour: 9 + i, minute: 45 },
                            },
                        });
                    }
                }

                // Events at unusual times (early morning, late evening)
                if (day === 16) {
                    events.push(
                        {
                            heading: 'Early Bird Meeting',
                            content: 'Very early meeting',
                            color: '#ff9800',
                            isContinuation: false,
                            date: {
                                start: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                                end: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                            },
                            time: {
                                start: { hour: 6, minute: 0 },
                                end: { hour: 7, minute: 0 },
                            },
                        },
                        {
                            heading: 'Late Night Session',
                            content: 'Very late meeting',
                            color: '#673ab7',
                            isContinuation: false,
                            date: {
                                start: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                                end: {
                                    day,
                                    month: currentMonth,
                                    year: currentYear,
                                },
                            },
                            time: {
                                start: { hour: 22, minute: 0 },
                                end: { hour: 23, minute: 30 },
                            },
                        },
                    );
                }
            }

            // Cross-month multi-day event (if near month boundary)
            if (currentMonth < 12) {
                const lastDay = new Date(currentYear, currentMonth, 0).getDate();
                if (lastDay >= 29) {
                    events.push({
                        heading: 'Cross-Month Event',
                        content: 'Event spanning month boundary',
                        color: '#e91e63',
                        isContinuation: false,
                        date: {
                            start: {
                                day: lastDay - 1,
                                month: currentMonth,
                                year: currentYear,
                            },
                            end: {
                                day: 3,
                                month: currentMonth + 1,
                                year: currentYear,
                            },
                        },
                        time: {
                            start: { hour: 9, minute: 0 },
                            end: { hour: 17, minute: 0 },
                        },
                    });
                }
            }

            return events;
        })(),
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    parameters: {
        docs: {
            description: {
                story: 'Tests extreme edge cases: 35+ events in a single day, very short (5min) events, very long (8hr) events, unusual times (6AM, 11PM), nested overlapping events, and cross-month multi-day events. Pushes the calendar to its absolute limits.',
            },
        },
    },
};

export const SundayFirstWeek: Story = {
    args: {
        heading: 'Sunday-First Calendar (US)',
        firstDayOfWeek: 0,
        entries: sampleEntries,
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    parameters: {
        docs: {
            description: {
                story: 'Calendar with Sunday as the first day of the week, common in the US, Canada, and Japan. The month grid, week view columns, and context headers all shift to start on Sunday.',
            },
        },
    },
};

export const SaturdayFirstWeek: Story = {
    args: {
        heading: 'Saturday-First Calendar',
        firstDayOfWeek: 6,
        entries: sampleEntries,
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    parameters: {
        docs: {
            description: {
                story: 'Calendar with Saturday as the first day of the week, used in some Middle Eastern countries. Demonstrates that the week-start configuration works for all supported values.',
            },
        },
    },
};

export const WeekStartComparison: Story = {
    args: {
        entries: sampleEntries,
    },
    render: (args) => html`
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1em; height: 720px;">
            <lms-calendar
                .heading=${'Monday First (ISO)'}
                .activeDate=${args.activeDate}
                .entries=${args.entries}
                .color=${args.color}
                .locale=${args.locale}
                .firstDayOfWeek=${1}
                style="height: 100%; display: block;"
            ></lms-calendar>
            <lms-calendar
                .heading=${'Sunday First (US)'}
                .activeDate=${args.activeDate}
                .entries=${args.entries}
                .color=${args.color}
                .locale=${args.locale}
                .firstDayOfWeek=${0}
                style="height: 100%; display: block;"
            ></lms-calendar>
        </div>
    `,
    parameters: {
        docs: {
            description: {
                story: 'Side-by-side comparison of Monday-first (ISO 8601) and Sunday-first (US) week configurations. Both calendars show the same entries but with different week start days, making it easy to verify the layout shifts correctly.',
            },
        },
    },
};

// --- Locale stories ---
// Helper to create a locale story with proper firstDayOfWeek and per-instance locale.
const createLocaleStory = (
    locale: string,
    label: string,
    description: string,
): Story => ({
    args: {
        heading: label,
        locale,
        firstDayOfWeek: getFirstDayForLocale(locale) as number,
        entries: sampleEntries,
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .locale=${args.locale}
            .firstDayOfWeek=${args.firstDayOfWeek as FirstDayOfWeek}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    parameters: {
        docs: { description: { story: description } },
    },
});

export const LocaleGerman: Story = createLocaleStory(
    'de',
    'Deutsch (German)',
    'German locale with Monday-first week (ISO 8601). UI strings are fully translated. Weekday and month names come from Luxon\'s Intl formatting.',
);

export const LocaleFrench: Story = createLocaleStory(
    'fr',
    'Fran\u00e7ais (French)',
    'French locale with Monday-first week. Demonstrates accented characters in translations (e.g., "Aujourd\'hui" for Today).',
);

export const LocaleSpanish: Story = createLocaleStory(
    'es',
    'Espa\u00f1ol (Spanish)',
    'Spanish locale with Monday-first week. All UI strings translated.',
);

export const LocaleJapanese: Story = createLocaleStory(
    'ja',
    '\u65E5\u672C\u8A9E (Japanese)',
    'Japanese locale with Sunday-first week (the convention in Japan). Demonstrates CJK characters in UI labels and Luxon-formatted weekday names.',
);

export const LocaleChineseSimplified: Story = createLocaleStory(
    'zh-Hans',
    '\u7B80\u4F53\u4E2D\u6587 (Chinese Simplified)',
    'Simplified Chinese locale with Sunday-first week. Demonstrates CJK translations and locale-aware date formatting.',
);

export const LocalePortuguese: Story = createLocaleStory(
    'pt',
    'Portugu\u00EAs (Portuguese)',
    'Portuguese locale with Sunday-first week (Brazilian convention). Portuguese uses Sunday-first calendars in Brazil.',
);

export const LocaleArabic: Story = createLocaleStory(
    'ar',
    '\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Arabic)',
    'Arabic locale with Saturday-first week. Note: full RTL text support requires additional dir="rtl" styling which is outside the scope of this locale configuration. Calendar grid columns remain left-to-right as this is the universal convention even in RTL locales.',
);

export const LocaleEnglishUS: Story = createLocaleStory(
    'en',
    'English (US)',
    'English locale with Sunday-first week (US convention). Uses firstDayOfWeek=0 to match American expectations while keeping English source strings.',
);

export const LocaleHindi: Story = createLocaleStory(
    'hi',
    '\u0939\u093f\u0928\u094d\u0926\u0940 (Hindi)',
    'Hindi locale with Sunday-first week (Indian convention). Demonstrates Devanagari script in UI labels.',
);

export const LocaleBengali: Story = createLocaleStory(
    'bn',
    '\u09ac\u09be\u0982\u09b2\u09be (Bengali)',
    'Bengali locale with Sunday-first week. Demonstrates Bengali script in UI labels and date formatting.',
);

export const LocaleRussian: Story = createLocaleStory(
    'ru',
    '\u0420\u0443\u0441\u0441\u043a\u0438\u0439 (Russian)',
    'Russian locale with Monday-first week (ISO 8601). Demonstrates Cyrillic script in UI labels.',
);

export const LocaleIndonesian: Story = createLocaleStory(
    'id',
    'Indonesia (Indonesian)',
    'Indonesian locale with Sunday-first week. Uses Latin script with Indonesian translations.',
);

export const LocaleKorean: Story = createLocaleStory(
    'ko',
    '\ud55c\uad6d\uc5b4 (Korean)',
    'Korean locale with Sunday-first week. Demonstrates Hangul script in UI labels and date formatting.',
);

export const LocaleTurkish: Story = createLocaleStory(
    'tr',
    'T\u00fcrk\u00e7e (Turkish)',
    'Turkish locale with Monday-first week. Demonstrates Turkish-specific characters (\u00e7, \u015f, \u0131, \u00f6, \u00fc) in UI labels.',
);

export const LocaleVietnamese: Story = createLocaleStory(
    'vi',
    'Ti\u1ebfng Vi\u1ec7t (Vietnamese)',
    'Vietnamese locale with Monday-first week. Demonstrates Vietnamese diacritics in UI labels.',
);

export const LocaleItalian: Story = createLocaleStory(
    'it',
    'Italiano (Italian)',
    'Italian locale with Monday-first week (European convention). All UI strings fully translated.',
);

export const LocaleThai: Story = createLocaleStory(
    'th',
    '\u0e44\u0e17\u0e22 (Thai)',
    'Thai locale with Sunday-first week. Demonstrates Thai script in UI labels and date formatting.',
);

export const LocalePolish: Story = createLocaleStory(
    'pl',
    'Polski (Polish)',
    'Polish locale with Monday-first week (European convention). Demonstrates Polish diacritics (\u0105, \u0107, \u0119, \u0142, \u00f3, \u015b, \u017a, \u017c).',
);

export const LocaleUkrainian: Story = createLocaleStory(
    'uk',
    '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430 (Ukrainian)',
    'Ukrainian locale with Monday-first week. Demonstrates Ukrainian Cyrillic script with unique characters (\u0456, \u0457, \u0454, \u0491).',
);

export const LocaleDutch: Story = createLocaleStory(
    'nl',
    'Nederlands (Dutch)',
    'Dutch locale with Monday-first week (European convention). All UI strings fully translated.',
);

export const LocaleShowcase: Story = {
    args: {
        entries: sampleEntries,
    },
    render: (args) => html`
        <p style="margin: 0.5em 1em; color: #666; font-size: 0.85em;">
            Each calendar independently renders its own locale — UI strings, weekday names,
            and date formatting are all per-instance. No global locale switching needed.
        </p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: minmax(0, 1fr); gap: 0.5em; height: 1800px;">
            ${(['de', 'fr', 'es', 'it', 'nl', 'pl', 'ru', 'uk', 'tr', 'ar', 'hi', 'bn', 'th', 'ja', 'ko', 'zh-Hans', 'id', 'vi', 'pt'] as const).map((locale) => {
                const labels: Record<string, string> = {
                    de: 'Deutsch', fr: 'Fran\u00e7ais', es: 'Espa\u00f1ol', it: 'Italiano',
                    nl: 'Nederlands', pl: 'Polski', ru: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439', uk: '\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430',
                    tr: 'T\u00fcrk\u00e7e', ar: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629',
                    hi: '\u0939\u093f\u0928\u094d\u0926\u0940', bn: '\u09ac\u09be\u0982\u09b2\u09be',
                    th: '\u0e44\u0e17\u0e22', ja: '\u65E5\u672C\u8A9E', ko: '\ud55c\uad6d\uc5b4',
                    'zh-Hans': '\u7B80\u4F53\u4E2D\u6587', id: 'Indonesia', vi: 'Ti\u1ebfng Vi\u1ec7t',
                    pt: 'Portugu\u00eas',
                };
                return html`
                    <lms-calendar
                        .heading=${labels[locale]}
                        .activeDate=${args.activeDate}
                        .entries=${args.entries}
                        .color=${args.color}
                        .locale=${locale}
                        .firstDayOfWeek=${getFirstDayForLocale(locale) as FirstDayOfWeek}
                        style="height: 100%; display: block;"
                    ></lms-calendar>
                `;
            })}
        </div>
    `,
    parameters: {
        docs: {
            description: {
                story: 'Showcase of all 19 non-English locales in a 4-column grid. Each calendar uses its own locale for UI strings and date formatting, plus locale-appropriate firstDayOfWeek. All calendars render independently on the same page — no global locale switching.',
            },
        },
    },
};

// --- Year view stories ---

// Generate year-spanning entries for year view demos
const generateYearEntries = (): CalendarEntry[] => {
    const events: CalendarEntry[] = [];
    const colors = ['#1976d2', '#2e7d32', '#ff9800', '#d32f2f', '#6a1b9a', '#00acc1'];

    for (let month = 1; month <= 12; month++) {
        const daysInMonth = new Date(currentYear, month, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const dayOfWeek = new Date(currentYear, month - 1, day).getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

            const eventsPerDay = Math.floor(Math.random() * 6);
            for (let e = 0; e < eventsPerDay; e++) {
                const startHour = 8 + Math.floor(Math.random() * 10);
                events.push({
                    heading: `Event ${e + 1}`,
                    content: 'Year view event',
                    color: colors[Math.floor(Math.random() * colors.length)],
                    isContinuation: false,
                    date: {
                        start: { day, month, year: currentYear },
                        end: { day, month, year: currentYear },
                    },
                    time: {
                        start: { hour: startHour, minute: 0 },
                        end: { hour: startHour + 1, minute: 0 },
                    },
                });
            }
        }
    }
    return events;
};

const yearEntries = generateYearEntries();

export const YearView: Story = {
    args: {
        heading: 'Year Overview',
        entries: yearEntries,
        yearDensityMode: 'dot',
        yearDrillTarget: 'day',
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            .yearDrillTarget=${args.yearDrillTarget}
            .yearDensityMode=${args.yearDensityMode}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        const calendar = canvasElement.querySelector('lms-calendar') as LMSCalendar;
        await expect(calendar).toBeInTheDocument();

        const shadowRoot = calendar.shadowRoot;
        const header = shadowRoot?.querySelector('lms-calendar-header');
        if (header) {
            const headerShadow = header.shadowRoot;
            const yearButton = headerShadow?.querySelector('[data-context="year"]') as HTMLElement;
            if (yearButton) {
                await userEvent.click(yearButton);
                await new Promise((resolve) => setTimeout(resolve, 300));

                const yearView = shadowRoot?.querySelector('lms-calendar-year');
                await expect(yearView).toBeInTheDocument();
            }
        }
    },
    parameters: {
        docs: {
            description: {
                story: 'Year view showing 12 mini-month calendars in a responsive grid. Each day shows a dot indicator for days with events. Click a day to drill down to month view, or click a month label to jump directly to that month.',
            },
        },
    },
};

export const YearViewDensityModes: Story = {
    args: {
        entries: yearEntries,
    },
    render: (args) => html`
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1em; height: 720px;">
            <lms-calendar
                .heading=${'Dot Mode'}
                .activeDate=${args.activeDate}
                .entries=${args.entries}
                .color=${args.color}
                .firstDayOfWeek=${args.firstDayOfWeek}
                .locale=${args.locale}
                .yearDensityMode=${'dot'}
                style="height: 100%; display: block;"
            ></lms-calendar>
            <lms-calendar
                .heading=${'Heatmap Mode'}
                .activeDate=${args.activeDate}
                .entries=${args.entries}
                .color=${args.color}
                .firstDayOfWeek=${args.firstDayOfWeek}
                .locale=${args.locale}
                .yearDensityMode=${'heatmap'}
                style="height: 100%; display: block;"
            ></lms-calendar>
            <lms-calendar
                .heading=${'Count Mode'}
                .activeDate=${args.activeDate}
                .entries=${args.entries}
                .color=${args.color}
                .firstDayOfWeek=${args.firstDayOfWeek}
                .locale=${args.locale}
                .yearDensityMode=${'count'}
                style="height: 100%; display: block;"
            ></lms-calendar>
        </div>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        const calendars = canvasElement.querySelectorAll('lms-calendar') as NodeListOf<LMSCalendar>;
        for (const calendar of calendars) {
            await expect(calendar).toBeInTheDocument();
            const shadowRoot = calendar.shadowRoot;
            const header = shadowRoot?.querySelector('lms-calendar-header');
            if (header) {
                const headerShadow = header.shadowRoot;
                const yearButton = headerShadow?.querySelector('[data-context="year"]') as HTMLElement;
                if (yearButton) {
                    await userEvent.click(yearButton);
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
            }
        }
    },
    parameters: {
        docs: {
            description: {
                story: 'Side-by-side comparison of all three density visualization modes in year view: dot (small colored dot), heatmap (opacity-based background), and count (numeric event count). All three calendars show the same event data.',
            },
        },
    },
};

export const YearViewDrillDown: Story = {
    args: {
        heading: 'Year → Day Drill-Down',
        entries: yearEntries,
        yearDrillTarget: 'day',
        yearDensityMode: 'heatmap',
    },
    render: (args) => html`
        <lms-calendar
            .heading=${args.heading}
            .activeDate=${args.activeDate}
            .entries=${args.entries}
            .color=${args.color}
            .firstDayOfWeek=${args.firstDayOfWeek}
            .locale=${args.locale}
            .yearDrillTarget=${args.yearDrillTarget}
            .yearDensityMode=${args.yearDensityMode}
            style="height: 720px; display: block;"
        ></lms-calendar>
    `,
    play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
        const calendar = canvasElement.querySelector('lms-calendar') as LMSCalendar;
        await expect(calendar).toBeInTheDocument();

        const shadowRoot = calendar.shadowRoot;
        const header = shadowRoot?.querySelector('lms-calendar-header');
        if (header) {
            const headerShadow = header.shadowRoot;
            const yearButton = headerShadow?.querySelector('[data-context="year"]') as HTMLElement;
            if (yearButton) {
                await userEvent.click(yearButton);
                await new Promise((resolve) => setTimeout(resolve, 500));
            }
        }
    },
    parameters: {
        docs: {
            description: {
                story: 'Year view configured with yearDrillTarget="day" and heatmap density mode. Clicking any day will navigate directly to the day view instead of month view. The heatmap coloring makes it easy to spot the busiest days at a glance.',
            },
        },
    },
};
