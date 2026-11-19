import { expect, fixture, html } from '@open-wc/testing';
import { sendKeys, setViewport } from '@web/test-runner-commands';

import '../../../src/components/Header.ts';
import '../../../src/components/Year.ts';
import type Header from '../../../src/components/Header.ts';
import type Year from '../../../src/components/Year.ts';
import { ensureLocale, getMessages } from '../../../src/lib/messages.ts';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const tabKey =
    /AppleWebKit/.test(navigator.userAgent) && !/Chrom(e|ium)/.test(navigator.userAgent)
        ? 'Alt+Tab'
        : 'Tab';
const rect = (element: Element) => element.getBoundingClientRect();

function contained(element: Element, container: Element) {
    const a = rect(element);
    const b = rect(container);
    expect(a.left).to.be.at.least(b.left - 1);
    expect(a.right).to.be.at.most(b.right + 1);
    expect(a.top).to.be.at.least(b.top - 1);
    expect(a.bottom).to.be.at.most(b.bottom + 1);
}

function readableControls(root: ShadowRoot, container: Element) {
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('button')];
    for (const button of buttons) {
        expect(rect(button).width).to.be.at.least(24);
        expect(rect(button).height).to.be.at.least(24);
        contained(button, container);
        expect(button.scrollWidth).to.be.at.most(button.clientWidth + 1);
        expect(button.scrollHeight).to.be.at.most(button.clientHeight + 1);
    }
    for (let i = 0; i < buttons.length; i++) {
        for (let j = i + 1; j < buttons.length; j++) {
            const a = rect(buttons[i]);
            const b = rect(buttons[j]);
            expect(
                Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                    Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1,
            ).to.equal(false);
        }
    }
}

describe('Holistic Header / Year spatial grammar', () => {
    beforeEach(async () => {
        await setViewport({ width: 1280, height: 900 });
    });
    afterEach(async () => {
        await setViewport({ width: 1024, height: 768 });
    });

    it('makes the active period the heading and keeps identity, navigation and view controls separate', async () => {
        const el = await fixture<Header>(html`
            <lms-calendar-header
                style="inline-size: 1180px; font: 16px Arial"
                heading="Community programme"
                .activeDate=${{ year: 2026, month: 6, day: 15 }}
            ></lms-calendar-header>
        `);
        const root = el.shadowRoot!;
        const heading = root.querySelector('h2')!;
        const identity = root.querySelector('.calendar-title')!;
        expect(identity.textContent).to.equal('Community programme');
        expect(heading.contains(identity)).to.equal(false);
        expect(parseFloat(getComputedStyle(heading).fontSize)).to.be.greaterThan(
            parseFloat(getComputedStyle(identity).fontSize),
        );
        for (const [view, period] of [
            ['day', '15'],
            ['week', 'Jun 15'],
            ['month', 'Jun'],
            ['year', '2026'],
        ] as const) {
            el.viewMode = view;
            await el.updateComplete;
            const visible = [...heading.querySelectorAll('.view-detail')].filter(
                (detail) => getComputedStyle(detail).visibility === 'visible',
            );
            expect(visible).to.have.length(1);
            expect(visible[0].textContent).to.include(period);
            expect(root.querySelectorAll('[aria-pressed="true"]')).to.have.length(1);
            expect(
                root.querySelector('[aria-pressed="true"]')!.getAttribute('data-context'),
            ).to.equal(view);
        }
        expect(
            [...root.querySelectorAll('.controls > [role="group"]')].map((group) =>
                group.getAttribute('aria-label'),
            ),
        ).to.deep.equal(['Date', 'Calendar view']);
        expect(
            [...root.querySelectorAll('button')].map(
                (button) => button.name || button.dataset.context,
            ),
        ).to.deep.equal(['previous', 'today', 'next', 'day', 'week', 'month', 'year']);
        await frame();
        readableControls(root, root.querySelector('.controls')!);
        const navigation = rect(root.querySelector('.buttons')!);
        const views = rect(root.querySelector('.context')!);
        expect(Math.abs(navigation.top - views.top)).to.be.lessThan(12);
    });

    for (const [width, font, locale, title] of [
        [390, 16, 'en', ''],
        [320, 24, 'ar', ''],
        [320, 24, 'de', 'Gemeinsamer Veranstaltungskalender für internationale Zusammenarbeit'],
        [900, 16, 'en', ''],
    ] as const) {
        it(`keeps date and view controls in place between Day, Week, Month, Agenda and Year (${width}px / ${locale})`, async () => {
            await ensureLocale(locale);
            const el = await fixture<Header>(html`<lms-calendar-header
                style="inline-size:${width}px; font:${font}px Arial"
                dir=${locale === 'ar' ? 'rtl' : 'ltr'} .locale=${locale} .heading=${title}
                .activeDate=${{ year: 2026, month: 12, day: 31 }}></lms-calendar-header>`);
            const root = el.shadowRoot!;
            const controls = root.querySelector('.controls')!;
            const identity = root.querySelector('.calendar-title')!;
            expect(getComputedStyle(identity).display === 'none').to.equal(width < 640 && !title);
            const positions = () =>
                [controls, ...root.querySelectorAll('button')].flatMap((node) => {
                    const { top, left, width, height } = rect(node);
                    return [top, left, width, height];
                });
            const baseline = positions();
            for (const [view, agenda] of [
                ['day', false],
                ['week', false],
                ['month', true],
                ['year', false],
            ] as const) {
                const switcher = root.querySelector<HTMLButtonElement>(`[data-context="${view}"]`)!;
                switcher.focus({ preventScroll: true });
                el.viewMode = view;
                el.agenda = agenda;
                await el.updateComplete;
                expect(root.activeElement).to.equal(switcher);
                positions().forEach((value, i) => expect(value).to.be.closeTo(baseline[i], 1));
                expect(controls.scrollWidth).to.be.at.most(controls.clientWidth + 1);
            }
        });
    }

    for (const width of [280, 358]) {
        it(`reflows whole groups in a ${width}px embed on a wide viewport`, async () => {
            const el = await fixture<Header>(html`
                <lms-calendar-header
                    style="inline-size: ${width}px; font: 16px Arial"
                    heading="International collaboration and release planning calendar"
                    .activeDate=${{ year: 2026, month: 12, day: 31 }}
                    viewMode="week"
                ></lms-calendar-header>
            `);
            await frame();
            expect(window.innerWidth).to.equal(1280);
            const root = el.shadowRoot!;
            const controls = root.querySelector<HTMLElement>('.controls')!;
            expect(controls.scrollWidth).to.be.at.most(controls.clientWidth + 1);
            const info = root.querySelector('.info')!;
            const navigation = root.querySelector('.buttons')!;
            const views = root.querySelector('.context')!;
            if (width < 320) {
                expect(rect(navigation).top).to.be.at.least(rect(info).bottom);
            } else {
                // Ordinary phone embeds use one shared period/navigation row.
                expect(rect(navigation).left).to.be.at.least(rect(info).right);
                expect(rect(navigation).top).to.be.at.least(rect(info).top);
                expect(rect(navigation).bottom).to.be.at.most(rect(info).bottom);
            }
            expect(rect(views).top).to.be.at.least(
                Math.max(rect(info).bottom, rect(navigation).bottom),
            );
            const navButtons = [...navigation.querySelectorAll('button')];
            expect(new Set(navButtons.map((button) => Math.round(rect(button).top))).size).to.equal(
                1,
            );
            const viewRows = new Set(
                [...views.querySelectorAll('button')].map((button) => Math.round(rect(button).top)),
            );
            expect(viewRows.size).to.equal(width < 352 ? 2 : 1);
            readableControls(root, controls);
        });
    }

    for (const width of [358, 752, 1180]) {
        for (const locale of ['en', 'th', 'ja', 'bn']) {
            it(`keeps shared navigation stable through all views at ${width}px in ${locale}`, async () => {
                await ensureLocale(locale);
                const el = await fixture<Header>(html`
                    <lms-calendar-header locale=${locale}
                        style="inline-size: ${width}px; font: 16px Arial"
                        .activeDate=${{ year: 2026, month: 12, day: 31 }}
                    ></lms-calendar-header>
                `);
                await frame();
                const root = el.shadowRoot!;
                const controls = root.querySelector<HTMLElement>('.controls')!;
                const navigation = root.querySelector('.buttons')!;
                const views = root.querySelector('.context')!;
                const baseline = [
                    rect(controls).height,
                    rect(navigation).top,
                    rect(navigation).left,
                    rect(navigation).width,
                    rect(navigation).height,
                    rect(views).top,
                ];
                for (const view of ['day', 'week', 'month', 'year'] as const) {
                    el.viewMode = view;
                    await el.updateComplete;
                    await frame();
                    const geometry = [
                        rect(controls).height,
                        rect(navigation).top,
                        rect(navigation).left,
                        rect(navigation).width,
                        rect(navigation).height,
                        rect(views).top,
                    ];
                    geometry.forEach((value, index) =>
                        expect(
                            Math.abs(value - baseline[index]),
                            `${view}, geometry index ${index}`,
                        ).to.be.at.most(1),
                    );
                    readableControls(root, controls);
                    expect(controls.scrollWidth).to.be.at.most(controls.clientWidth + 1);
                }
                expect(root.querySelector('.week')).to.equal(null);
                if (width === 358) {
                    expect(rect(views).top).to.be.at.least(
                        rect(root.querySelector('.info')!).bottom,
                    );
                    expect(rect(navigation).left).to.be.at.least(
                        rect(root.querySelector('.info')!).right,
                    );
                    expect(rect(controls).height).to.be.lessThan(150);
                }
            });
        }
    }

    it('grows named rows for enlarged, unusually long labels without clipping or arbitrary button wrapping', async () => {
        const el = await fixture<Header>(html`
            <lms-calendar-header
                style="inline-size: 358px; font: 32px Arial"
                heading="International collaboration and release planning calendar"
                .activeDate=${{ year: 2026, month: 12, day: 31 }}
                viewMode="week"
            ></lms-calendar-header>
        `);
        // Stress labels independently of whichever catalog happens to be longest.
        const root = el.shadowRoot!;
        for (const button of root.querySelectorAll<HTMLButtonElement>(
            '[data-context], [name="today"]',
        )) {
            button.textContent = `${button.textContent!.trim()} — ausführliche Kalenderansicht`;
        }
        await frame();
        const controls = root.querySelector<HTMLElement>('.controls')!;
        expect(controls.scrollWidth).to.be.at.most(controls.clientWidth + 1);
        expect(rect(controls).height).to.be.greaterThan(200);
        expect(parseFloat(getComputedStyle(controls).fontSize)).to.equal(32);
        for (const group of root.querySelectorAll('.info, .buttons, .context'))
            contained(group, controls);
        readableControls(root, controls);
        expect(rect(root.querySelector('[name="today"]')!).height).to.be.greaterThan(44);
    });

    it('mirrors logical placement, not chronological glyphs, and preserves native activation and event payloads', async () => {
        await ensureLocale('ar');
        const el = await fixture<Header>(html`
            <lms-calendar-header
                dir="rtl" locale="ar"
                style="inline-size: 358px; font: 16px Arial"
                .activeDate=${{ year: 2026, month: 6, day: 15 }}
            ></lms-calendar-header>
        `);
        await frame();
        const root = el.shadowRoot!;
        const previous = root.querySelector<HTMLButtonElement>('[name="previous"]')!;
        const next = root.querySelector<HTMLButtonElement>('[name="next"]')!;
        const today = root.querySelector<HTMLButtonElement>('[name="today"]')!;
        expect(previous.textContent).to.equal('«');
        expect(next.textContent).to.equal('»');
        expect(previous.getAttribute('aria-label')).to.equal(getMessages('ar').previous);
        expect(rect(previous).left).to.be.greaterThan(rect(today).left);
        expect(rect(today).left).to.be.greaterThan(rect(next).left);
        expect(rect(root.querySelector('[data-context="day"]')!).left).to.be.greaterThan(
            rect(root.querySelector('[data-context="year"]')!).left,
        );
        const events: CustomEvent[] = [];
        for (const name of ['switchdate', 'jumptoday', 'switchview'])
            el.addEventListener(name, (event) => events.push(event as CustomEvent));
        previous.focus();
        await sendKeys({ press: 'Enter' });
        await sendKeys({ press: tabKey });
        expect(root.activeElement).to.equal(today);
        await sendKeys({ press: ' ' });
        await sendKeys({ press: tabKey });
        expect(root.activeElement).to.equal(next);
        await sendKeys({ press: 'Enter' });
        await sendKeys({ press: tabKey });
        const day = root.querySelector<HTMLButtonElement>('[data-context="day"]')!;
        expect(root.activeElement).to.equal(day);
        await sendKeys({ press: 'Enter' });
        expect(events.map((event) => event.type)).to.deep.equal([
            'switchdate',
            'jumptoday',
            'switchdate',
            'switchview',
        ]);
        expect(events[0].detail).to.deep.equal({ direction: 'previous' });
        const now = new Date();
        expect(events[1].detail).to.deep.equal({
            date: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                day: now.getDate(),
            },
        });
        expect(events[2].detail).to.deep.equal({ direction: 'next' });
        expect(events[3].detail).to.deep.equal({ view: 'day' });
        expect(events.every((event) => event.bubbles && event.composed)).to.equal(true);
        // The owner, not the button, commits the selected view.
        expect(day.getAttribute('aria-pressed')).to.equal('false');
        el.viewMode = 'day';
        await el.updateComplete;
        expect(day.getAttribute('aria-pressed')).to.equal('true');
        expect(root.activeElement).to.equal(day);
        expect(day.matches(':focus-visible')).to.equal(true);
        expect(getComputedStyle(day).outlineStyle).to.equal('solid');
        readableControls(root, root.querySelector('.controls')!);
    });

    for (const densityMode of ['dot', 'count', 'heatmap'] as const) {
        it(`gives ${densityMode} indicators one in-flow activity slot without creating another target`, async () => {
            const el = await fixture<Year>(html`
                <lms-calendar-year
                    style="inline-size: 358px; block-size: 600px; font: 16px Arial"
                    .activeDate=${{ year: 2026, month: 1, day: 15 }}
                    .densityMode=${densityMode}
                    .entrySumByDay=${{ '2026-1-15': 12, '2026-1-16': 100 }}
                ></lms-calendar-year>
            `);
            await frame();
            const root = el.shadowRoot!;
            const buttons = root.querySelectorAll('.day-cell');
            expect(buttons).to.have.length(365);
            expect(root.querySelectorAll('.activity-slot')).to.have.length(365);
            for (const key of ['2026-1-15', '2026-1-16', '2026-1-17']) {
                const button = root.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)!;
                const number = button.querySelector('.date-number')!;
                const slot = button.querySelector('.activity-slot')!;
                contained(number, button);
                contained(slot, button);
                expect(rect(slot).top).to.be.at.least(rect(number).bottom - 1);
                expect(slot.getAttribute('aria-hidden')).to.equal('true');
                expect(slot.querySelectorAll('button, [tabindex]')).to.have.length(0);
                expect(getComputedStyle(slot).position).to.equal('static');
            }
            const active = root.querySelector<HTMLButtonElement>('[data-date="2026-1-15"]')!;
            const empty = root.querySelector<HTMLButtonElement>('[data-date="2026-1-17"]')!;
            expect(active.getAttribute('aria-label')).to.include('12 events');
            expect(empty.querySelector('.activity-slot')!.children).to.have.length(0);
            expect(rect(active).height).to.equal(rect(empty).height);
            expect(active.parentElement!.getAttribute('aria-selected')).to.equal('true');
            if (densityMode === 'count') {
                expect(active.querySelector('.event-count')!.textContent).to.equal('12');
                expect(active.querySelector('.activity-mark')).to.equal(null);
            } else {
                expect(active.querySelector('.activity-mark')).not.to.equal(null);
                expect(active.querySelector('.event-count')).to.equal(null);
                if (densityMode === 'heatmap')
                    expect(active.getAttribute('data-density')).to.equal('4');
                else expect(active.classList.contains('has-events')).to.equal(true);
            }
        });
    }

    it('keeps today circular, selection independent and keyboard focus around the whole date/activity unit in RTL', async () => {
        const now = new Date();
        const date = { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
        const key = `${date.year}-${date.month}-${date.day}`;
        const el = await fixture<Year>(html`
            <lms-calendar-year
                dir="rtl" locale="ar"
                style="inline-size: 752px; block-size: 600px; font: 32px Arial; --current-day-bg: rgb(12, 34, 56); --current-day-color: white; --year-day-cell-border-radius: 0"
                .activeDate=${date}
                .entrySumByDay=${{ [key]: 12 }}
                densityMode="heatmap"
            ></lms-calendar-year>
        `);
        await el.focusDate(date);
        await sendKeys({ press: 'F2' });
        await sendKeys({ press: 'Escape' });
        await frame();
        const root = el.shadowRoot!;
        const today = root.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)!;
        const number = today.querySelector('.date-number')!;
        expect(today.getAttribute('aria-current')).to.equal('date');
        expect(today.parentElement!.getAttribute('aria-selected')).to.equal('true');
        expect(getComputedStyle(number).borderRadius).to.equal('50%');
        expect(getComputedStyle(number).backgroundColor).to.equal('rgb(12, 34, 56)');
        expect(today.matches(':focus-visible')).to.equal(true);
        expect(getComputedStyle(today).outlineStyle).to.equal('solid');
        expect(parseFloat(getComputedStyle(today).outlineOffset)).to.be.greaterThan(0);
        expect(getComputedStyle(number).borderStyle).to.equal('solid');
        const activity = today.querySelector('.activity-slot')!;
        expect(getComputedStyle(activity).backgroundColor).to.equal('rgba(0, 0, 0, 0)');
        contained(activity, today);
        const selected = today.parentElement;
        await sendKeys({ press: 'ArrowLeft' });
        const tomorrow = new Date(date.year, date.month - 1, date.day + 1);
        expect((root.activeElement as HTMLElement).dataset.date).to.equal(
            `${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()}`,
        );
        expect(selected!.getAttribute('aria-selected')).to.equal('true');
        expect(
            (root.activeElement as HTMLElement).parentElement!.getAttribute('aria-selected'),
        ).to.equal('false');
    });

    it('localizes counts in the same activity slot and retains intrinsic months under enlarged text', async () => {
        const el = await fixture<Year>(html`
            <lms-calendar-year
                locale="ar"
                style="inline-size: 752px; block-size: 600px; font: 32px Arial"
                .activeDate=${{ year: 2026, month: 1, day: 15 }}
                .entrySumByDay=${{ '2026-1-15': 1000 }}
                densityMode="count"
            ></lms-calendar-year>
        `);
        await frame();
        const root = el.shadowRoot!;
        const active = root.querySelector('[data-date="2026-1-15"]')!;
        const localized = new Intl.NumberFormat('ar').format(1000);
        expect(active.querySelector('.event-count')!.textContent).to.equal(localized);
        expect(active.getAttribute('aria-label')).to.include(localized);
        contained(active.querySelector('.event-count')!, active);
        const months = [...root.querySelectorAll<HTMLElement>('.mini-month')];
        expect(
            months.filter((month) => Math.abs(rect(month).top - rect(months[0]).top) < 1),
        ).to.have.length(1);
        for (const month of months) {
            expect(month.scrollWidth).to.be.at.most(month.clientWidth + 1);
            for (const row of month.querySelectorAll('.day-row')) {
                for (const button of row.querySelectorAll('button')) {
                    expect(rect(button).width).to.be.at.least(24);
                    expect(rect(button).height).to.be.at.least(24);
                    contained(button, row);
                }
            }
        }
        expect(rect(months[0]).height).to.be.lessThan(600);
    });
});
