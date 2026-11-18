import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys, setViewport } from '@web/test-runner-commands';

import '../../../src/components/Menu.ts';
import type { Menu } from '../../../src/components/Menu.ts';
import { ensureLocale, getMessages } from '../../../src/lib/messages.js';

import brutalist from '../../../src/themes/brutalist.css?raw';
import defaultTheme from '../../../src/themes/default.css?raw';
import ink from '../../../src/themes/ink.css?raw';
import midnight from '../../../src/themes/midnight.css?raw';
import soft from '../../../src/themes/soft.css?raw';

const settle = async () => {
    await nextFrame();
    await nextFrame();
};
// Safari's default macOS navigation uses Option+Tab to include native buttons.
const tabKey =
    /AppleWebKit/.test(navigator.userAgent) && !/Chrom(e|ium)/.test(navigator.userAgent)
        ? 'Alt+Tab'
        : 'Tab';
const bounds = (el: Element) => el.getBoundingClientRect();
function contained(inner: DOMRect, outer: DOMRect) {
    expect(inner.left).to.be.at.least(outer.left - 1);
    expect(inner.right).to.be.at.most(outer.right + 1);
    expect(inner.top).to.be.at.least(outer.top - 1);
    expect(inner.bottom).to.be.at.most(outer.bottom + 1);
}

async function inspector({
    rtl = false,
    fallback = false,
    long = true,
    theme = defaultTheme,
} = {}) {
    if (rtl) await ensureLocale('ar');
    // Match the inherited legacy defaults without importing/upgrading the full calendar.
    const wrapper = await fixture<HTMLDivElement>(html`<div>
        <lms-calendar style="display:block">
            <button class="invoker">Open event</button>
            <lms-menu locale=${rtl ? 'ar' : 'en'}
                style=${`direction:${rtl ? 'rtl' : 'ltr'};font:16px Arial;--menu-min-width:17.5em;--menu-max-width:20em;--menu-header-padding:.75em 1em;--menu-content-padding:1em;--menu-button-size:2em;--menu-button-padding:.5em;--menu-title-font-size:.875em;--menu-content-font-size:.875em`}
                .eventDetails=${{
                    heading: rtl
                        ? 'مراجعة التصميم والتعاون وإمكانية الوصول'
                        : 'Design review and keyboard accessibility',
                    content: long
                        ? (rtl
                              ? 'ملاحظات طويلة وتعليمات مهمة للحدث. '
                              : 'Long notes with important event instructions. '
                          ).repeat(300)
                        : 'Short notes.',
                    displayTime: '10:30 AM – 11:30 AM',
                    date: { year: 2026, month: 6, day: 15 },
                }}></lms-menu>
            <button class="background">Background action</button>
        </lms-calendar>
    </div>`);
    const sheet = document.createElement('style');
    sheet.textContent = theme;
    wrapper.prepend(sheet);
    const el = wrapper.querySelector<Menu>('lms-menu')!;
    if (fallback) Object.defineProperty(el, '_hasPopover', { get: () => false });
    const invoker = wrapper.querySelector<HTMLButtonElement>('.invoker')!;
    invoker.focus();
    el.anchorRect = new DOMRect(window.innerWidth - 32, window.innerHeight - 32, 24, 24);
    el.open = true;
    await el.updateComplete;
    await settle();
    const root = fallback
        ? document.querySelector('[data-calendar-inspector]')!.shadowRoot!
        : el.shadowRoot!;
    const card = root.querySelector<HTMLDialogElement>('.card')!;
    const notes = card.querySelector<HTMLElement>('.notes')!;
    const body = card.querySelector<HTMLElement>('.body')!;
    const close = card.querySelector<HTMLButtonElement>('.close-btn')!;
    const exportButton = card.querySelector<HTMLButtonElement>('.export-btn')!;
    return { wrapper, el, root, card, body, notes, close, exportButton, invoker };
}

describe('Inspector visual geometry and keyboard regressions', () => {
    afterEach(async () => {
        await setViewport({ width: 1024, height: 768 });
    });

    for (const rtl of [false, true]) {
        it(`centers the card when neither side of a phone-sized anchor fits (${rtl ? 'RTL' : 'LTR'})`, async () => {
            await setViewport({ width: 390, height: 720 });
            const { el, card } = await inspector({ rtl, long: false });
            el.anchorRect = new DOMRect(100, 200, 180, 80);
            await el.updateComplete;
            await settle();
            const rect = bounds(card);
            expect(rect.left).to.be.closeTo((window.innerWidth - rect.width) / 2, 1);
        });
    }

    for (const dimensions of [
        { width: 1184, height: 824, rtl: false, fallback: false },
        { width: 390, height: 720, rtl: false, fallback: false },
        { width: 320, height: 240, rtl: false, fallback: false },
        { width: 280, height: 320, rtl: false, fallback: false },
        { width: 320, height: 360, rtl: false, fallback: false },
        { width: 320, height: 360, rtl: true, fallback: false },
        { width: 320, height: 360, rtl: true, fallback: true },
    ]) {
        it(`keeps close/export outside the scrolling details body at ${JSON.stringify(dimensions)}`, async () => {
            await setViewport({ width: dimensions.width, height: dimensions.height });
            const { el, card, body, notes, close, exportButton, root, invoker, wrapper } =
                await inspector(dimensions);
            contained(bounds(card), new DOMRect(0, 0, dimensions.width, dimensions.height));
            contained(bounds(close), bounds(card));
            contained(bounds(exportButton), bounds(card));
            expect(card.scrollWidth).to.be.at.most(card.clientWidth + 1);
            expect(notes.scrollWidth).to.be.at.most(notes.clientWidth + 1);
            expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
            expect(body.clientHeight).to.be.greaterThan(40);
            expect(body.getAttribute('aria-label')).to.equal(
                getMessages(dimensions.rtl ? 'ar' : 'en').eventDetails,
            );
            expect(body.tabIndex).to.equal(0);
            expect(card.hasAttribute('aria-modal')).to.equal(false);
            expect(document.body.inert).to.equal(false);
            expect(root.activeElement === close, 'close receives initial focus').to.equal(true);
            if (dimensions.rtl)
                expect(bounds(close).right).to.be.lessThan(
                    bounds(card).left + bounds(card).width / 2,
                );

            const closeBefore = bounds(close);
            const exportBefore = bounds(exportButton);
            await sendKeys({ press: tabKey });
            expect(
                root.activeElement === body,
                `Tab reaches scrollable details (open=${el.open}, active=${root.activeElement?.tagName}.${root.activeElement?.className}, document=${document.activeElement?.tagName})`,
            ).to.equal(true);
            expect(getComputedStyle(body).outlineStyle).not.to.equal('none');
            await sendKeys({ press: 'End' });
            await waitUntil(() => body.scrollTop > 0);
            expect(bounds(close).top).to.be.closeTo(closeBefore.top, 1);
            expect(bounds(exportButton).top).to.be.closeTo(exportBefore.top, 1);
            expect(card.scrollTop).to.equal(0);
            await sendKeys({ press: tabKey });
            expect(root.activeElement === exportButton, 'Tab reaches export').to.equal(true);
            let exports = 0;
            el.addEventListener('export-entry', (event) => {
                exports++;
                event.preventDefault();
            });
            await sendKeys({ press: 'Enter' });
            await settle();
            expect(exports).to.equal(1);
            expect(el.open).to.equal(true);
            await sendKeys({ press: tabKey });
            expect(root.activeElement === close, 'Tab is not trapped').to.equal(false);
            const background = wrapper.querySelector<HTMLButtonElement>('.background')!;
            background.focus();
            expect(document.activeElement === background, 'background remains focusable').to.equal(
                true,
            );
            await settle();
            expect(el.open, 'background keyboard focus dismisses the surface').to.equal(false);
            expect(document.activeElement).to.equal(background);
            invoker.focus();
            el.open = true;
            await el.updateComplete;
            await settle();
            let closes = 0;
            el.addEventListener('menu-close', () => closes++);
            await sendKeys({ press: 'Escape' });
            await settle();
            expect(el.open).to.equal(false);
            expect(closes).to.equal(1);
            expect(document.activeElement === invoker, 'Escape returns focus to invoker').to.equal(
                true,
            );
        });
    }

    for (const [name, theme] of Object.entries({
        default: defaultTheme,
        soft,
        midnight,
        ink,
        brutalist,
    })) {
        it(`uses one header inset and theme controls in ${name}`, async () => {
            await setViewport({ width: 1184, height: 824 });
            const { el, card, body, notes, close, exportButton } = await inspector({
                theme,
                long: false,
            });
            const title = card.querySelector('.title')!;
            const meta = card.querySelector('.meta')!;
            expect(bounds(title).left).to.be.closeTo(bounds(meta).left, 1);
            expect(bounds(title).left - bounds(card).left).to.be.closeTo(17, 1);
            expect(bounds(notes).left).to.be.closeTo(bounds(meta).left, 1);
            expect(body.hasAttribute('tabindex')).to.equal(false);
            expect(bounds(card).height).to.be.lessThan(270);
            for (const button of [close, exportButton]) {
                contained(bounds(button), bounds(card));
                expect(bounds(button).width).to.be.at.least(24);
                expect(bounds(button).height).to.be.at.least(24);
            }
            const swatch = document.createElement('span');
            swatch.style.color = 'var(--primary-color)';
            el.parentElement!.append(swatch);
            expect(getComputedStyle(exportButton).color).to.equal(getComputedStyle(swatch).color);
            expect(getComputedStyle(exportButton).borderStyle).to.equal('none');
            await expect(el).to.be.accessible();
        });
    }

    it('preserves explicit legacy header/body insets and the shared menu-padding override', async () => {
        const { el, card } = await inspector({ long: false });
        el.style.setProperty('--menu-header-padding', '8px 24px');
        el.style.setProperty('--menu-content-padding', '12px 18px');
        await settle();
        expect(bounds(card.querySelector('.title')!).left - bounds(card).left).to.be.closeTo(25, 1);
        expect(bounds(card.querySelector('.meta')!).left - bounds(card).left).to.be.closeTo(19, 1);
        el.style.setProperty('--menu-padding', '12px 20px');
        await settle();
        expect(bounds(card.querySelector('.title')!).left - bounds(card).left).to.be.closeTo(21, 1);
        expect(bounds(card.querySelector('.meta')!).left - bounds(card).left).to.be.closeTo(21, 1);
    });
});
