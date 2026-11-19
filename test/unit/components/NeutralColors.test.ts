import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';

import { contrastRatio } from '../../../src/lib/getColorTextWithContrast.js';
import { ensureLocale, getMessageFormatters } from '../../../src/lib/messages.js';
import type Calendar from '../../../src/lms-calendar.ts';
import '../../../src/lms-calendar.ts';
import midnight from '../../../src/themes/midnight.css?raw';

const date = { year: 2026, month: 6, day: 15 };
const dateKey = '2026-6-15';
const timedEntry: CalendarEntry = {
    id: 'neutral-timed-entry',
    date: { start: date, end: date },
    kind: 'timed',
    heading: 'Timed event',
    time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
};
const forcedColors = matchMedia('(forced-colors: active)').matches;
const tabKey =
    /AppleWebKit/.test(navigator.userAgent) && !/Chrom(e|ium)/.test(navigator.userAgent)
        ? 'Alt+Tab'
        : 'Tab';

function contrast(foreground: string, background: string): number {
    // Composite the computed colors (including translucent color-mix() values)
    // in sRGB rather than assuming getComputedStyle() serializes them as rgba().
    const context = document.createElement('canvas').getContext('2d')!;
    const pixel = (): [number, number, number] => {
        const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
    };
    context.fillStyle = background;
    context.fillRect(0, 0, 1, 1);
    const surface = pixel();
    context.fillStyle = foreground;
    context.fillRect(0, 0, 1, 1);
    return contrastRatio(surface, pixel());
}

describe('Neutral color scheme', () => {
    for (const scheme of ['light', 'dark']) {
        it(`keeps the Year today badge readable in a ${scheme} host`, async () => {
            const calendar = await fixture<HTMLElement>(html`
                <lms-calendar view-mode="year" style=${`color-scheme:${scheme};width:900px;height:720px`}></lms-calendar>
            `);
            await nextFrame();
            const year = calendar.shadowRoot!.querySelector('lms-calendar-year')!;
            const badge = year.shadowRoot!.querySelector('[aria-current="date"] .date-number')!;
            const { color, backgroundColor } = getComputedStyle(badge);
            expect(contrast(color, backgroundColor)).to.be.at.least(4.5);
        });

        it(`keeps the unthemed Week toolbar, time axis and focus readable in a ${scheme} host`, async () => {
            const wrapper = await fixture<HTMLDivElement>(html`
                <div style=${`color-scheme:${scheme}; color:#555; background:Canvas`}>
                    <lms-calendar heading="My Calendar" view-mode="week" style="width: 900px; height: 580px"></lms-calendar>
                </div>
            `);
            const calendar = wrapper.querySelector('lms-calendar')!;
            await calendar.updateComplete;
            await nextFrame();
            const root = calendar.shadowRoot!;
            const header = root.querySelector('lms-calendar-header')!.shadowRoot!;
            const week = root.querySelector('lms-calendar-week')!.shadowRoot!;
            const surface = getComputedStyle(
                root.querySelector('.calendar-container')!,
            ).backgroundColor;
            expect(surface).to.equal(getComputedStyle(wrapper).backgroundColor);
            for (const element of [
                header.querySelector('.period-title')!,
                header.querySelector('.calendar-title')!,
                ...header.querySelectorAll('button'),
                week.querySelector('.day-name')!,
                week.querySelector('.hour-label')!,
            ]) {
                expect(
                    contrast(getComputedStyle(element).color, surface),
                    element.tagName + '.' + element.className,
                ).to.be.at.least(4.5);
            }

            const next = header.querySelector<HTMLButtonElement>('button[name="next"]')!;
            next.focus();
            const style = getComputedStyle(next);
            expect(style.outlineStyle).to.equal('solid');
            expect(contrast(style.outlineColor, surface)).to.be.at.least(3);
        });
    }

    for (const [name, scheme, tokens, ring, exportText] of [
        ['unthemed light', 'light'],
        ['unthemed dark', 'dark'],
        ['Midnight theme', 'dark', '', 'rgb(129, 140, 248)', 'rgb(129, 140, 248)'],
        [
            'explicit tokens',
            'dark',
            '--primary-color:#e9fc99; --entry-focus-color:#91fbea',
            'rgb(145, 251, 234)',
            'rgb(233, 252, 153)',
        ],
        [
            'explicit accent',
            'dark',
            '--calendar-accent:#fbab91',
            'rgb(251, 171, 145)',
            'rgb(251, 171, 145)',
        ],
    ]) {
        it(`renders keyboard focus and an operable inspector export in ${name}`, async () => {
            const wrapper = await fixture<HTMLDivElement>(html`
                <div style=${`color-scheme:${scheme}; background:Canvas`}>
                    <lms-calendar view-mode="day" .activeDate=${date} .entries=${[timedEntry]}
                        style=${`width:900px; height:580px; ${tokens ?? ''}`}></lms-calendar>
                </div>
            `);
            if (name === 'Midnight theme') {
                const sheet = document.createElement('style');
                sheet.textContent = midnight;
                wrapper.prepend(sheet);
            }
            const root = wrapper.querySelector('lms-calendar')!.shadowRoot!;
            const selector = 'lms-calendar-entry[slot="timed"]';
            await waitUntil(() => !!root.querySelector(selector));
            const entry = root.querySelector(selector)!;
            const timeline = root
                .querySelector('lms-calendar-day')!
                .shadowRoot!.querySelector<HTMLElement>('.timeline')!;
            timeline.focus();
            await sendKeys({ press: tabKey });
            expect(root.activeElement === entry, 'keyboard reaches the timed card').to.equal(true);
            expect(entry.matches(':focus-visible')).to.equal(true);
            const focused = getComputedStyle(entry);
            const outline = focused.outlineColor;
            const timedContrast = contrast(outline, focused.backgroundColor);
            expect(focused.outlineStyle).to.equal('solid');

            await sendKeys({ press: 'Enter' });
            const menu = root.querySelector('lms-menu')!;
            const card = menu.shadowRoot!.querySelector('.card')!;
            const button = card.querySelector<HTMLButtonElement>('.export-btn')!;
            await waitUntil(
                () => menu.shadowRoot!.activeElement === card.querySelector('.close-btn'),
            );
            await sendKeys({ press: tabKey });
            expect(menu.shadowRoot!.activeElement === button, 'keyboard reaches export').to.equal(
                true,
            );
            const action = getComputedStyle(button);
            const { color: text, outlineColor: exportOutline } = action;
            const surface = getComputedStyle(card).backgroundColor;
            expect(action.outlineStyle).to.equal('solid');
            let exportId: string | undefined;
            menu.addEventListener('export-entry', (event) => {
                exportId = event.detail.eventId;
                event.preventDefault();
            });
            await sendKeys({ press: 'Enter' });
            expect(exportId).to.equal(timedEntry.id);
            const contrasts = [
                timedContrast,
                contrast(text, surface),
                contrast(exportOutline, surface),
            ];
            expect(
                contrasts.map((value, index) => value >= (index === 1 ? 4.5 : 3)),
                `contrast (timed outline, export text, export outline): ${contrasts.join(', ')}`,
            ).to.deep.equal([true, true, true]);
            if (ring && !forcedColors) {
                expect(outline).to.equal(ring);
                expect(text).to.equal(exportText);
            }
        });
    }

    it('keeps the embedding dark scheme when the inspector uses its fallback portal', async () => {
        const wrapper = await fixture<HTMLDivElement>(html`
            <div style="color-scheme: dark; background: Canvas"><lms-menu></lms-menu></div>
        `);
        const menu = wrapper.querySelector('lms-menu')!;
        Object.defineProperty(menu, '_hasPopover', { get: () => false });
        menu.open = true;
        await menu.updateComplete;
        const portal = document.querySelector('[data-calendar-inspector]')!;
        const card = portal.shadowRoot!.querySelector('.card')!;
        const { colorScheme, backgroundColor } = getComputedStyle(card);
        expect(colorScheme).to.equal(getComputedStyle(menu).colorScheme);
        expect(backgroundColor).to.equal(getComputedStyle(wrapper).backgroundColor);
        expect(
            contrast(getComputedStyle(card.querySelector('.export-btn')!).color, backgroundColor),
        ).to.be.at.least(4.5);
    });

    it('distinguishes occupied and empty compact Month dates, including in forced colors', async () => {
        const calendar = await fixture<Calendar>(html`
            <lms-calendar .activeDate=${date} month-presentation="presence" .entries=${[timedEntry]}
                style="width:390px; height:580px"></lms-calendar>
        `);
        const month = calendar.shadowRoot!.querySelector('lms-calendar-month')!;
        await month.updateComplete;
        const occupied = month.shadowRoot!.querySelector(`.indicator[data-date="${dateKey}"]`)!;
        const empty = month.shadowRoot!.querySelector('.indicator[data-date="2026-6-16"]')!;
        const dot = getComputedStyle(occupied.querySelector('.activity')!);
        expect(dot.visibility).to.equal('visible');
        expect(getComputedStyle(empty.querySelector('.activity')!).visibility).to.equal('hidden');
        const surface = getComputedStyle(
            calendar.shadowRoot!.querySelector('.calendar-container')!,
        ).backgroundColor;
        if (forcedColors) expect(parseFloat(dot.borderTopWidth)).to.be.greaterThan(0);
        expect(
            contrast(forcedColors ? dot.borderTopColor : dot.backgroundColor, surface),
        ).to.be.at.least(3);
    });

    for (const [destination, locale] of [
        ['inline', 'en'],
        ['accordion', 'de'],
    ]) {
        it(`describes overflow without claiming to open Day when it opens ${destination} events`, async () => {
            await ensureLocale(locale);
            const entries = Array.from({ length: 12 }, (_, i) => ({
                ...timedEntry,
                id: `overflow-${i}`,
            }));
            const calendar = await fixture<Calendar>(html`
                <lms-calendar .activeDate=${{ ...date, day: 14 }} .entries=${entries} .locale=${locale}
                    month-presentation="previews" .monthAgendaPresentation=${destination === 'accordion' ? 'accordion' : 'full'}
                    style="width:900px; height:580px"></lms-calendar>
            `);
            const root = calendar.shadowRoot!;
            const month = root.querySelector('lms-calendar-month')!.shadowRoot!;
            const summary = month.querySelector<HTMLButtonElement>(
                `.summary[data-date="${dateKey}"]`,
            )!;
            await waitUntil(() => !summary.hidden);
            const label = summary
                .getAttribute('aria-labelledby')!
                .split(' ')
                .map((id) => month.getElementById(id)!.textContent);
            expect(
                month.getElementById(summary.getAttribute('aria-describedby')!)!.textContent,
            ).to.equal(getMessageFormatters(locale).eventCount(entries.length));
            expect(label[0]).to.match(/^\+\d+$/);
            expect(label[1]).to.include('2026');
            summary.focus();
            await sendKeys({ press: 'Enter' });
            await calendar.updateComplete;
            expect(calendar.viewMode).to.equal('month');
            expect(calendar.activeDate).to.deep.equal(date);
            expect(root.querySelectorAll('.agenda-event')).to.have.length(entries.length);
            expect(!!root.querySelector('lms-calendar-month')).to.equal(destination === 'inline');
        });
    }

    it('honors caller color overrides unless the user has forced colors active', async () => {
        const calendar = await fixture<HTMLElement>(html`
            <lms-calendar
                view-mode="week"
                style="
                    color: #214;
                    --background-color: #ffe;
                    --header-text-color: #235;
                    --separator-light: #657;
                "
            ></lms-calendar>
        `);
        await nextFrame();
        const container = getComputedStyle(
            calendar.shadowRoot!.querySelector('.calendar-container')!,
        );
        const header = calendar.shadowRoot!.querySelector('lms-calendar-header')!.shadowRoot!;
        const headerText = getComputedStyle(header.querySelector('button')!).color;
        if (forcedColors) {
            expect(container.backgroundColor).not.to.equal('rgb(255, 255, 238)');
            expect(contrast(container.color, container.backgroundColor)).to.be.at.least(4.5);
            expect(contrast(headerText, container.backgroundColor)).to.be.at.least(4.5);
        } else {
            expect(container.color).to.equal('rgb(34, 17, 68)');
            expect(container.backgroundColor).to.equal('rgb(255, 255, 238)');
            expect(container.borderTopColor).to.equal('rgb(102, 85, 119)');
            expect(headerText).to.equal('rgb(34, 51, 85)');
        }
    });
});
