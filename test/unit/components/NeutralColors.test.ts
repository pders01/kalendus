import { expect, fixture, html, nextFrame } from '@open-wc/testing';

import { contrastRatio } from '../../../src/lib/getColorTextWithContrast.js';
import '../../../src/lms-calendar.ts';

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

    it('lets the caller override the neutral surface, text, header and dividers', async () => {
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
        expect(container.color).to.equal('rgb(34, 17, 68)');
        expect(container.backgroundColor).to.equal('rgb(255, 255, 238)');
        expect(container.borderTopColor).to.equal('rgb(102, 85, 119)');
        expect(getComputedStyle(header.querySelector('button')!).color).to.equal('rgb(34, 51, 85)');
    });
});
