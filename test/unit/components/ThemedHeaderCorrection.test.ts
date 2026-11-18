import { expect, fixture, html, nextFrame } from '@open-wc/testing';

import type Calendar from '../../../src/lms-calendar.js';
import '../../../src/lms-calendar.js';
import brutalist from '../../../src/themes/brutalist.css?raw';
import defaultTheme from '../../../src/themes/default.css?raw';
import ink from '../../../src/themes/ink.css?raw';
import midnight from '../../../src/themes/midnight.css?raw';
import soft from '../../../src/themes/soft.css?raw';

async function settle(c: Calendar) {
    for (let n = 0; n < 5; n++) {
        await c.updateComplete;
        await nextFrame();
    }
}
describe('Themed compact header controls', () => {
    for (const [name, theme] of Object.entries({ defaultTheme, ink, soft, brutalist, midnight })) {
        for (const locale of ['en', 'de', 'ar']) {
            it(`keeps Today whole and shared controls stable in ${name}/${locale}`, async () => {
                const wrap =
                    await fixture<HTMLDivElement>(html`<div><style>${theme}</style><lms-calendar locale=${locale}
                    style="width:358px;height:720px" .activeDate=${{ year: 2026, month: 11, day: 17 }}></lms-calendar></div>`);
                const c = wrap.querySelector<Calendar>('lms-calendar')!;
                await c.localeReady;
                await settle(c);
                const header = c.shadowRoot!.querySelector('lms-calendar-header')!;
                const root = header.shadowRoot!;
                const initial = root.querySelector('.buttons')!.getBoundingClientRect();
                for (const mode of ['day', 'week', 'month', 'year'] as const) {
                    root.querySelector<HTMLButtonElement>(`[data-context="${mode}"]`)!.click();
                    await settle(c);
                    const today = root.querySelector<HTMLButtonElement>('[name="today"]')!;
                    const range = document.createRange();
                    range.selectNodeContents(today);
                    expect(range.getBoundingClientRect().height).to.be.at.most(
                        parseFloat(getComputedStyle(today).fontSize) * 1.6,
                    );
                    expect(today.scrollWidth).to.be.at.most(today.clientWidth + 1);
                    const nav = root.querySelector('.buttons')!.getBoundingClientRect();
                    expect(nav.top).to.be.closeTo(initial.top, 1);
                    expect(nav.left).to.be.closeTo(initial.left, 1);
                    expect(nav.width).to.be.closeTo(initial.width, 1);
                    const controls = root.querySelector<HTMLElement>('.controls')!;
                    expect(controls.scrollWidth).to.be.at.most(controls.clientWidth + 1);
                }
            });
        }
    }
});
