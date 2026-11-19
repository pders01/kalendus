import { expect, fixture, html, nextFrame } from '@open-wc/testing';

import brutalist from '../../../src/themes/brutalist.css?raw';
import defaultTheme from '../../../src/themes/default.css?raw';
import ink from '../../../src/themes/ink.css?raw';
import midnight from '../../../src/themes/midnight.css?raw';
import soft from '../../../src/themes/soft.css?raw';

import '../../../src/components/Year.ts';
import '../../../src/components/Entry.ts';
import '../../../src/components/Day.ts';
import '../../../src/components/Month.ts';
import '../../../src/components/Week.ts';

function rgb(value: string): number[] {
    const channels = value.match(/[\d.]+/g)!.map(Number);
    return [channels[0], channels[1], channels[2], channels[3] ?? 1];
}
function composite(foreground: number[], background: number[]): number[] {
    return foreground
        .slice(0, 3)
        .map((value, index) => value * foreground[3] + background[index] * (1 - foreground[3]));
}
function luminance(color: number[]): number {
    return color
        .slice(0, 3)
        .map((value) => value / 255)
        .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
        .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}
function contrast(foreground: string, background: string, surface: string): number {
    const bg = composite(rgb(background), rgb(surface));
    const fg = composite(rgb(foreground), [...bg, 1]);
    const levels = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
    return (levels[0] + 0.05) / (levels[1] + 0.05);
}

it('keeps the selected number readable in the compact Brutalist Month', async () => {
    const date = { year: 2020, month: 11, day: 17 };
    const wrapper = await fixture<HTMLDivElement>(html`<div><lms-calendar>
        <lms-calendar-month compact .activeDate=${date} .selectedDate=${date}></lms-calendar-month>
    </lms-calendar></div>`);
    const sheet = document.createElement('style');
    sheet.textContent = brutalist;
    wrapper.prepend(sheet);
    await nextFrame();
    const month = wrapper.querySelector('lms-calendar-month')!.shadowRoot!;
    const selected = month.querySelector('[aria-selected="true"] .indicator')!;
    const label = selected.querySelector('.date-value')!;
    expect(
        contrast(
            getComputedStyle(label).color,
            getComputedStyle(selected).backgroundColor,
            'rgb(255, 255, 255)',
        ),
    ).to.be.at.least(4.5);
});

for (const [name, source] of Object.entries({
    default: defaultTheme,
    soft,
    midnight,
    ink,
    brutalist,
})) {
    describe(`${name} shipped source theme`, () => {
        for (const hostText of ['#111', '#fff']) {
            it(`defines readable foreground/surface pairs even on a ${hostText} embedding page`, async () => {
                const wrapper =
                    await fixture<HTMLDivElement>(html`<div style=${`color:${hostText};background:#808080`}>
                    <lms-calendar style="display:block">
                        <span class="surface" style="display:block;background:var(--background-color)">General text</span>
                        <span class="header" style="display:block;color:var(--header-text-color);background:var(--background-color)">Header text</span>
                        <span class="current" style="display:block;color:var(--current-day-color);background:var(--current-day-bg)">Current date</span>
                        <span class="density" style="display:block;color:var(--year-heatmap-4-text);background:var(--year-heatmap-4)">High density</span>
                        <span class="hour" style="display:block;color:var(--hour-indicator-color,var(--header-text-color));background:var(--background-color)">Hour label</span>
                    </lms-calendar>
                </div>`);
                const sheet = document.createElement('style');
                sheet.textContent = source;
                wrapper.prepend(sheet);
                const host = wrapper.querySelector('lms-calendar')!;
                const surface = getComputedStyle(host).getPropertyValue('--background-color');
                for (const pair of wrapper.querySelectorAll<HTMLElement>('span')) {
                    const style = getComputedStyle(pair);
                    // Resolve hex token values through a browser style declaration.
                    const swatch = document.createElement('span');
                    swatch.style.color = surface;
                    wrapper.append(swatch);
                    const resolvedSurface = getComputedStyle(swatch).color;
                    swatch.remove();
                    expect(
                        contrast(style.color, style.backgroundColor, resolvedSurface),
                        `${name} ${pair.className}`,
                    ).to.be.at.least(4.5);
                }
            });
        }
        it('keeps day/week date and hour labels readable without opacity reducing their contrast', async () => {
            const now = new Date();
            const date = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
            const wrapper =
                await fixture<HTMLDivElement>(html`<div><lms-calendar style="display:block;background:var(--background-color)">
                <lms-calendar-day .activeDate=${date} style="display:block;height:300px;width:900px"></lms-calendar-day>
                <lms-calendar-week .activeDate=${date} style="display:block;height:300px;width:900px"></lms-calendar-week>
            </lms-calendar></div>`);
            const sheet = document.createElement('style');
            sheet.textContent = source;
            wrapper.prepend(sheet);
            await nextFrame();
            const swatch = document.createElement('span');
            swatch.style.color = 'var(--background-color)';
            wrapper.querySelector('lms-calendar')!.append(swatch);
            const surface = getComputedStyle(swatch).color;
            for (const tag of ['lms-calendar-day', 'lms-calendar-week']) {
                const view = wrapper.querySelector(tag)!;
                for (const label of view.shadowRoot!.querySelectorAll('.day-name, .hour-label')) {
                    const style = getComputedStyle(label);
                    expect(style.opacity).to.equal('1');
                    expect(
                        contrast(style.color, surface, surface),
                        `${name} ${tag} label`,
                    ).to.be.at.least(4.5);
                }
            }
        });
        it('keeps actual year density text and event time targets readable and at least 24px', async () => {
            const today = new Date();
            const date = {
                year: today.getFullYear(),
                month: today.getMonth() + 1,
                day: today.getDate(),
            };
            const wrapper =
                await fixture<HTMLDivElement>(html`<div><lms-calendar style="display:block;background:var(--background-color)">
                <lms-calendar-year .activeDate=${date} .densityMode=${'heatmap'} .entrySumByDay=${{ [`${date.year}-${date.month}-10`]: 20 }} style="display:block;height:600px;width:900px"></lms-calendar-year>
                <lms-calendar-entry heading="Event title" .time=${{ start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } }} style="display:block;width:180px"></lms-calendar-entry>
            </lms-calendar></div>`);
            const sheet = document.createElement('style');
            sheet.textContent = source;
            wrapper.prepend(sheet);
            await nextFrame();
            const year = wrapper.querySelector('lms-calendar-year')!;
            const day = year.shadowRoot!.querySelector<HTMLElement>(
                `[data-date="${date.year}-${date.month}-10"]`,
            )!;
            day.scrollIntoView({ block: 'nearest' });
            await nextFrame();
            expect(day.getBoundingClientRect().width).to.be.at.least(24);
            expect(day.getBoundingClientRect().height).to.be.at.least(24);
            const entry = wrapper.querySelector<HTMLElement>('lms-calendar-entry')!;
            expect(entry.getBoundingClientRect().height).to.be.at.least(24);
            await expect(wrapper).to.be.accessible();
        });
    });
}
