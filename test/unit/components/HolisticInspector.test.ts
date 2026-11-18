import { expect, fixture, html, nextFrame, waitUntil } from '@open-wc/testing';
import { sendKeys, sendMouse, setViewport } from '@web/test-runner-commands';

import '../../../src/components/Menu.ts';
import type { EventDetails, Menu } from '../../../src/components/Menu.ts';
import { ensureLocale, getMessages } from '../../../src/lib/messages.js';
import type { CalendarEntry } from '../../../src/lms-calendar.js';

const settle = async () => {
    await nextFrame();
    await nextFrame();
};
const tabKey =
    /AppleWebKit/.test(navigator.userAgent) && !/Chrom(e|ium)/.test(navigator.userAgent)
        ? 'Alt+Tab'
        : 'Tab';
const date = { year: 2026, month: 6, day: 15 };
const entry: CalendarEntry = {
    id: 'holistic-original',
    kind: 'all-day',
    date: { start: date, end: { ...date, day: 17 } },
    heading: 'Canonical event',
    content: 'Original notes',
};
const details: EventDetails = {
    heading: entry.heading!,
    content: entry.content!,
    displayTime: '',
    entry,
    eventId: entry.id,
};
const rect = (el: Element) => el.getBoundingClientRect();
function contained(inner: DOMRect, outer: DOMRect) {
    expect(inner.left).to.be.at.least(outer.left - 1);
    expect(inner.right).to.be.at.most(outer.right + 1);
    expect(inner.top).to.be.at.least(outer.top - 1);
    expect(inner.bottom).to.be.at.most(outer.bottom + 1);
}
function sameBounds(actual: DOMRect, expected: DOMRect) {
    for (const key of ['left', 'top', 'width', 'height'] as const)
        expect(actual[key], key).to.be.closeTo(expected[key], 1);
}

async function setup({
    rtl = false,
    fallback = false,
    edge = true,
    width = 1000,
    height = 600,
    eventDetails = details,
} = {}) {
    if (rtl) await ensureLocale('ar');
    const wrapper = await fixture<HTMLDivElement>(html`<div dir=${rtl ? 'rtl' : 'ltr'}>
        <section class="view" style=${`position:fixed;inset-inline-start:60px;inset-block-start:80px;inline-size:${width}px;block-size:${height}px;overflow:auto`}>
            <button class="first" style="position:absolute;inset-inline-start:120px;inset-block-start:180px">First event</button>
            <button class="second" style="position:absolute;inset-inline-end:20px;inset-block-end:20px">Second event</button>
        </section>
        <lms-menu locale=${rtl ? 'ar' : 'en'} .eventDetails=${eventDetails} style="font:16px Arial"></lms-menu>
        <input class="background" aria-label="Background field" style="position:fixed;inset-block-start:8px;inset-inline-start:8px">
    </div>`);
    const el = wrapper.querySelector<Menu>('lms-menu')!;
    const view = wrapper.querySelector<HTMLElement>('.view')!;
    const first = wrapper.querySelector<HTMLButtonElement>('.first')!;
    const second = wrapper.querySelector<HTMLButtonElement>('.second')!;
    const background = wrapper.querySelector<HTMLInputElement>('.background')!;
    if (fallback) Object.defineProperty(el, '_hasPopover', { get: () => false });
    if (edge) el.placement = 'edge';
    el.containment = view;
    const open = async (invoker = first) => {
        invoker.focus();
        el.anchorRect = rect(invoker);
        el.open = true;
        await el.updateComplete;
        await settle();
        const root = fallback
            ? document.querySelector('[data-calendar-inspector]')!.shadowRoot!
            : el.shadowRoot!;
        return root.querySelector<HTMLDialogElement>('.card')!;
    };
    return { el, view, first, second, background, open, wrapper };
}

describe('Holistic inspection placement and bounded content', () => {
    beforeEach(async () => {
        await setViewport({ width: 1184, height: 824 });
    });
    afterEach(async () => {
        await setViewport({ width: 1024, height: 768 });
    });

    for (const fallback of [false, true]) {
        for (const rtl of [false, true]) {
            const mode = `${fallback ? 'fallback' : 'native'}, ${rtl ? 'RTL' : 'LTR'}`;
            it(`keeps a stable trailing surface across invokers and content changes (${mode})`, async () => {
                const { el, view, first, second, open } = await setup({ fallback, rtl });
                const before = rect(view);
                const scroll = { top: view.scrollTop, left: view.scrollLeft };
                let card = await open(first);
                const initial = rect(card);
                contained(initial, before);
                expect(initial.top).to.be.closeTo(before.top + 8, 1);
                expect(initial.height).to.be.closeTo(before.height - 16, 1);
                if (rtl) expect(initial.left).to.be.closeTo(before.left + 8, 1);
                else expect(initial.right).to.be.closeTo(before.right - 8, 1);
                expect(initial.width).to.be.lessThan(before.width / 2);
                expect(card.style.insetInlineStart).not.to.equal('');
                expect(card.style.left).to.equal('');
                await sendKeys({ press: 'Escape' });
                await settle();
                expect(
                    document.activeElement === first,
                    'Escape returns focus to the first invoker',
                ).to.be.true;
                card = await open(second);
                sameBounds(rect(card), initial);
                el.eventDetails = {
                    ...details,
                    heading: 'A much longer event heading '.repeat(80),
                    content: 'Complete notes '.repeat(1000),
                };
                await el.updateComplete;
                await settle();
                sameBounds(rect(card), initial);
                sameBounds(rect(view), before);
                expect(view.scrollTop).to.equal(scroll.top);
                expect(view.scrollLeft).to.equal(scroll.left);
                expect(card.hasAttribute('aria-modal')).to.be.false;
                expect(view.inert || document.body.inert).to.be.false;
                await sendKeys({ press: 'Escape' });
                await settle();
                expect(
                    document.activeElement === second,
                    'Escape returns focus to the second invoker',
                ).to.be.true;
            });

            it(`retains standalone anchored placement by default (${mode})`, async () => {
                const { el, first, open } = await setup({ fallback, rtl, edge: false });
                const card = await open();
                expect(el.placement).to.equal('anchor');
                const anchor = rect(first);
                if (rtl) expect(rect(card).right).to.be.closeTo(anchor.left - 8, 1);
                else expect(rect(card).left).to.be.closeTo(anchor.right + 8, 1);
                contained(rect(card), new DOMRect(0, 0, window.innerWidth, window.innerHeight));
                expect(rect(card).height).to.be.lessThan(400);
            });
        }

        it(`flips an anchored popup to the free horizontal side (${fallback ? 'fallback' : 'native'})`, async () => {
            const { first, open } = await setup({ fallback, edge: false });
            first.style.cssText = 'position:fixed;left:1000px;top:300px;width:100px;height:32px';
            const card = await open();
            expect(rect(card).right).to.be.closeTo(rect(first).left - 8, 1);
            expect(rect(card).height).to.be.lessThan(400);
            contained(rect(card), new DOMRect(0, 0, window.innerWidth, window.innerHeight));
        });

        for (const above of [false, true]) {
            it(`uses a short content-sized nonmodal panel ${above ? 'above' : 'below'} a wide desktop invoker (${fallback ? 'fallback' : 'native'})`, async () => {
                await setViewport({ width: 1184, height: 844 });
                const { el, first, view, open } = await setup({ fallback, edge: false });
                first.style.cssText = `position:fixed;left:20px;top:${above ? 720 : 160}px;width:1144px;height:32px`;
                const card = await open();
                if (above) expect(rect(card).bottom).to.be.closeTo(rect(first).top - 8, 1);
                else expect(rect(card).top).to.be.closeTo(rect(first).bottom + 8, 1);
                expect(rect(card).height).to.be.lessThan(300);
                contained(rect(card), new DOMRect(0, 0, 1184, 844));
                expect(card.tagName).to.equal('DIALOG');
                expect(card.getAttribute('aria-labelledby')).to.equal('event-title');
                expect(card.hasAttribute('aria-modal')).to.be.false;
                expect(view.inert || document.body.inert).to.be.false;
                expect(card.querySelector('.close-btn')).to.exist;
                await sendKeys({ press: 'Escape' });
                await settle();
                expect(el.open).to.be.false;
                expect(document.activeElement === first, 'focus returns to invoker').to.be.true;
            });
        }

        it(`bounds long desktop anchored content on the freer vertical side without hiding its event or actions (${fallback ? 'fallback' : 'native'})`, async () => {
            await setViewport({ width: 1184, height: 844 });
            const { el, first, open } = await setup({
                fallback,
                edge: false,
                eventDetails: { ...details, content: 'Long event notes. '.repeat(1500) },
            });
            first.style.cssText = 'position:fixed;left:20px;top:240px;width:1144px;height:32px';
            const card = await open();
            const body = card.querySelector<HTMLElement>('.body')!;
            const close = card.querySelector<HTMLElement>('.close-btn')!;
            const exportButton = card.querySelector<HTMLElement>('.export-btn')!;
            expect(rect(card).top).to.be.closeTo(rect(first).bottom + 8, 1);
            expect(rect(card).bottom).to.be.at.most(836);
            await waitUntil(() => body.tabIndex === 0);
            expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
            contained(rect(close), rect(card));
            contained(rect(exportButton), rect(card));
            const closeBefore = rect(close);
            const exportBefore = rect(exportButton);
            body.scrollTop = body.scrollHeight;
            await settle();
            sameBounds(rect(close), closeBefore);
            sameBounds(rect(exportButton), exportBefore);
            el.eventDetails = details;
            await el.updateComplete;
            await settle();
            expect(rect(card).height).to.be.lessThan(300);
            expect(body.scrollTop).to.equal(0);
            expect(body.hasAttribute('tabindex')).to.be.false;
        });

        it(`returns anchored focus to the explicit fallback if the invoker disappears (${fallback ? 'fallback' : 'native'})`, async () => {
            const { el, first, background, open } = await setup({ fallback, edge: false });
            await open();
            el.returnFocusTarget = background;
            first.remove();
            await sendKeys({ press: 'Escape' });
            await settle();
            expect(el.open).to.be.false;
            expect(document.activeElement === background).to.be.true;
        });

        it(`tracks containment resizing, replacement and viewport intersection (${fallback ? 'fallback' : 'native'})`, async () => {
            const { el, view, open, wrapper } = await setup({ fallback });
            const card = await open();
            view.style.inlineSize = '900px';
            view.style.blockSize = '500px';
            await waitUntil(() => Math.abs(rect(card).right - (rect(view).right - 8)) < 1);
            expect(rect(card).height).to.be.closeTo(484, 1);
            const replacement = document.createElement('section');
            replacement.style.cssText =
                'position:fixed;left:-30px;top:40px;width:800px;height:1000px';
            wrapper.append(replacement);
            el.containment = replacement;
            await el.updateComplete;
            await settle();
            expect(rect(card).right).to.be.closeTo(rect(replacement).right - 8, 1);
            expect(rect(card).top).to.be.closeTo(48, 1);
            expect(rect(card).bottom).to.be.closeTo(window.innerHeight - 8, 1);
            contained(rect(card), rect(replacement));
            contained(rect(card), new DOMRect(0, 0, window.innerWidth, window.innerHeight));
            // Public placement changes restore the compact standalone behavior.
            el.placement = 'anchor';
            await el.updateComplete;
            await settle();
            expect(rect(card).height).to.be.lessThan(400);
            el.placement = 'edge';
            el.containment = undefined;
            await el.updateComplete;
            await settle();
            expect(rect(card).right).to.be.closeTo(window.innerWidth - 8, 1);
            expect(rect(card).top).to.be.closeTo(8, 1);
        });

        for (const narrow of [false, true]) {
            it(`uses the full inset surface in ${narrow ? 'narrow' : 'short'} bounds (${fallback ? 'fallback' : 'native'})`, async () => {
                const { view, open } = await setup({
                    fallback,
                    width: narrow ? 360 : 1000,
                    height: narrow ? 600 : 280,
                });
                const card = await open();
                expect(rect(card).left).to.be.closeTo(rect(view).left + 8, 1);
                expect(rect(card).top).to.be.closeTo(rect(view).top + 8, 1);
                expect(rect(card).width).to.be.closeTo(rect(view).width - 16, 1);
                expect(rect(card).height).to.be.closeTo(rect(view).height - 16, 1);
            });
        }

        for (const notes of [false, true]) {
            it(`keeps actions reachable with huge headings/metadata${notes ? '/notes' : ' alone'} and real keyboard scrolling (${fallback ? 'fallback' : 'native'})`, async () => {
                await setViewport({ width: 320, height: 240 });
                const eventDetails = {
                    heading: 'AnUnusuallyLongUnbrokenHeading'.repeat(100),
                    content: notes ? 'Important notes and final instructions. '.repeat(1000) : '',
                    displayTime: 'Long temporal metadata '.repeat(100),
                    displayDate: 'Long date metadata '.repeat(100),
                    date,
                };
                const { el, open } = await setup({
                    fallback,
                    rtl: true,
                    width: 320,
                    height: 240,
                    eventDetails,
                });
                const card = await open();
                const body = card.querySelector<HTMLElement>('.body')!;
                const close = card.querySelector<HTMLButtonElement>('.close-btn')!;
                const exportButton = card.querySelector<HTMLButtonElement>('.export-btn')!;
                const closeBefore = rect(close);
                const exportBefore = rect(exportButton);
                contained(rect(card), new DOMRect(0, 0, 320, 240));
                contained(closeBefore, rect(card));
                contained(exportBefore, rect(card));
                expect(body.contains(card.querySelector('.title'))).to.be.true;
                expect(body.contains(card.querySelector('.meta'))).to.be.true;
                expect(body.getAttribute('aria-label')).to.equal(getMessages('ar').eventDetails);
                await waitUntil(() => body.tabIndex === 0);
                expect(body.clientHeight).to.be.greaterThan(24);
                expect(body.scrollHeight).to.be.greaterThan(body.clientHeight);
                expect(body.scrollWidth).to.be.at.most(body.clientWidth + 1);
                await sendKeys({ press: tabKey });
                expect(
                    (body.getRootNode() as ShadowRoot).activeElement === body,
                    `Tab reaches the scrollable body (open=${el.open})`,
                ).to.be.true;
                await sendKeys({ press: 'PageDown' });
                await waitUntil(() => body.scrollTop > 0);
                await sendKeys({ press: 'End' });
                await waitUntil(() => body.scrollTop + body.clientHeight >= body.scrollHeight - 1);
                sameBounds(rect(close), closeBefore);
                sameBounds(rect(exportButton), exportBefore);
                expect(card.scrollTop).to.equal(0);
                expect(card.scrollHeight).to.be.at.most(card.clientHeight + 1);
                await sendKeys({ press: tabKey });
                expect(
                    (exportButton.getRootNode() as ShadowRoot).activeElement === exportButton,
                    'Tab reaches export',
                ).to.be.true;
                let exports = 0;
                el.addEventListener('export-entry', (event) => {
                    exports++;
                    event.preventDefault();
                });
                await sendKeys({ press: 'Enter' });
                await settle();
                expect(exports).to.equal(1);
                expect(el.open).to.be.true;
                el.eventDetails = details;
                await el.updateComplete;
                await settle();
                expect(body.scrollTop).to.equal(0);
                await setViewport({ width: 1184, height: 824 });
                await waitUntil(() => !body.hasAttribute('tabindex'));
                expect(body.scrollHeight).to.be.at.most(body.clientHeight);
            });
        }

        it(`dismisses when focus leaves, without trapping or restoring it; Escape/outside still work (${fallback ? 'fallback' : 'native'})`, async () => {
            const { el, open, first, background } = await setup({ fallback });
            let card = await open();
            let closes = 0;
            el.addEventListener('menu-close', () => closes++);
            card.querySelector<HTMLButtonElement>('.export-btn')!.focus();
            let restored = 0;
            const focus = first.focus;
            first.focus = function (options?: FocusOptions) {
                restored++;
                focus.call(this, options);
            };
            try {
                await sendKeys({ press: tabKey });
                await waitUntil(() => !el.open);
                expect(closes).to.equal(1);
                // In a body-end fallback portal, natural Tab order may wrap to the invoker.
                // It must never be an inspector-initiated focus restoration.
                expect(restored, 'no focus restoration on keyboard departure').to.equal(0);
            } finally {
                first.focus = focus;
            }
            expect(document.activeElement === el, 'focus leaves the surface').to.be.false;
            expect(document.querySelector('[data-calendar-inspector]')).not.to.exist;
            card = await open();
            background.focus();
            await settle();
            expect(el.open).to.be.false;
            expect(document.activeElement === background, 'background retains focus').to.be.true;
            expect(closes).to.equal(2);
            card = await open();
            await sendKeys({ press: 'Escape' });
            await settle();
            expect(el.open).to.be.false;
            expect(document.activeElement === first, 'Escape restores focus').to.be.true;
            expect(closes).to.equal(3);
            card = await open();
            const target = rect(background);
            await sendMouse({ type: 'click', position: [target.x + 4, target.y + 4] });
            await settle();
            expect(el.open).to.be.false;
            expect(
                document.activeElement === background,
                'outside pointer retains background focus',
            ).to.be.true;
            expect(closes).to.equal(4);
            expect(card.matches(':popover-open')).to.be.false;
        });
    }
});
