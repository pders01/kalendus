import { expect, fixture, html } from '@open-wc/testing';

import '../../../src/components/Header.ts';
import type Header from '../../../src/components/Header.ts';

describe('Header orientation and native controls', () => {
    it('has a real generic heading and renders without owner-provided date input', async () => {
        const el = await fixture<Header>(
            html`
                <lms-calendar-header></lms-calendar-header>
            `,
        );
        const period = el.shadowRoot!.querySelector('h2 .view-detail.active')!;
        expect(period.textContent).to.include(String(new Date().getFullYear()));
        expect(el.shadowRoot!.querySelector('.calendar-title')!.textContent).to.equal(
            'Calendar view',
        );
        expect(getComputedStyle(el.shadowRoot!.querySelector('h2')!).fontSize).not.to.equal(
            getComputedStyle(el.shadowRoot!.querySelector('.calendar-title')!).fontSize,
        );
        for (const button of el.shadowRoot!.querySelectorAll('button'))
            expect(button.getBoundingClientRect().height).to.be.at.least(24);
    });
    it('describes the actual visible week across months and configurable week starts', async () => {
        const el = await fixture<Header>(
            html`<lms-calendar-header .activeDate=${{ year: 2024, month: 10, day: 1 }} .firstDayOfWeek=${0} .viewMode=${'week'}></lms-calendar-header>`,
        );
        await el.updateComplete;
        const range = el
            .shadowRoot!.querySelector('.week-range')!
            .textContent!.replace(/[\u2066-\u2069]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        expect(range).to.equal('Sep 29 – Oct 5, 2024');
        expect(el.shadowRoot!.querySelector('.week')).to.equal(null);
        el.visibleDates = [
            { year: 2024, month: 9, day: 30 },
            { year: 2024, month: 10, day: 1 },
        ];
        await el.updateComplete;
        const condensed = el
            .shadowRoot!.querySelector('.week-range')!
            .textContent!.replace(/[\u2066-\u2069]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        expect(condensed).to.equal('Sep 30 – Oct 1, 2024');
    });
    for (const locale of ['th', 'ja', 'bn', 'bn-u-nu-beng', 'bn-u-nu-latn']) {
        it(`formats complete Gregorian periods and localized numerals for ${locale}`, async () => {
            const el = await fixture<Header>(html`
                <lms-calendar-header locale=${locale}
                    .activeDate=${{ year: 2026, month: 6, day: 15 }}
                ></lms-calendar-header>
            `);
            const carrier = new Date('2026-06-15T00:00:00Z');
            for (const [view, options] of [
                ['day', { day: 'numeric', month: 'short', year: 'numeric' }],
                ['month', { month: 'short', year: 'numeric' }],
                ['year', { year: 'numeric' }],
            ] as const) {
                el.viewMode = view;
                await el.updateComplete;
                const period = el
                    .shadowRoot!.querySelector('.view-detail.active')!
                    .textContent!.trim();
                const expected = new Intl.DateTimeFormat(locale, {
                    ...options,
                    calendar: 'gregory',
                    timeZone: 'UTC',
                }).format(carrier);
                expect(period).to.equal(expected);
                if (locale === 'bn-u-nu-beng') expect(period).not.to.match(/[0-9]/);
                expect(period).to.include(
                    new Intl.NumberFormat(locale, { useGrouping: false }).format(2026),
                );
                if (locale === 'th') expect(period).not.to.include('2569');
            }
            el.viewMode = 'week';
            await el.updateComplete;
            const week = el.shadowRoot!.querySelector('.view-detail.active')!.textContent!;
            expect(week).to.include(
                new Intl.NumberFormat(locale, { useGrouping: false }).format(2026),
            );
            expect(week).not.to.include('2569');
        });
    }
    it('fits compact navigation with inherited legacy padding and touch-sized targets', async () => {
        const el = await fixture<Header>(html`
            <lms-calendar-header
                style="inline-size: 358px; font: 16px Arial; --header-info-padding-left: 1em; --header-buttons-padding-right: 1em"
                .activeDate=${{ year: 2026, month: 12, day: 31 }} viewMode="week"
            ></lms-calendar-header>
        `);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const root = el.shadowRoot!;
        const controls = root.querySelector<HTMLElement>('.controls')!;
        const navigation = root.querySelector('.buttons')!.getBoundingClientRect();
        const minimum = matchMedia('(pointer: coarse)').matches ? 44 : 24;
        for (const button of root.querySelectorAll('button')) {
            const box = button.getBoundingClientRect();
            expect(box.width).to.be.at.least(minimum);
            expect(box.height).to.be.at.least(minimum);
            expect(button.scrollWidth).to.be.at.most(button.clientWidth + 1);
            expect(button.scrollHeight).to.be.at.most(button.clientHeight + 1);
        }
        for (const button of root.querySelectorAll('.buttons button')) {
            expect(button.getBoundingClientRect().left).to.be.at.least(navigation.left);
            expect(button.getBoundingClientRect().right).to.be.at.most(navigation.right);
        }
        expect(controls.scrollWidth).to.be.at.most(controls.clientWidth + 1);
        expect(getComputedStyle(root.querySelector('.info')!).paddingInlineStart).to.equal('16px');
        expect(getComputedStyle(root.querySelector('.buttons')!).paddingInlineEnd).to.equal('16px');
    });
    it('does not reinterpret owner-supplied years below 100', async () => {
        const el = await fixture<Header>(html`
            <lms-calendar-header .activeDate=${{ year: 1, month: 6, day: 15 }} viewMode="day"></lms-calendar-header>
        `);
        expect(el.shadowRoot!.querySelector('.view-detail.active')!.textContent!.trim()).to.equal(
            'Jun 15, 1',
        );
        el.viewMode = 'year';
        await el.updateComplete;
        expect(el.shadowRoot!.querySelector('.view-detail.active')!.textContent!.trim()).to.equal(
            '1',
        );
    });
    it('delegates actual button activations, including nested labels, but not toolbar padding', async () => {
        const el = await fixture<Header>(
            html`
                <lms-calendar-header></lms-calendar-header>
            `,
        );
        const dates: string[] = [];
        const views: string[] = [];
        el.addEventListener('switchdate', (event) =>
            dates.push((event as CustomEvent).detail.direction),
        );
        el.addEventListener('switchview', (event) =>
            views.push((event as CustomEvent).detail.view),
        );
        const next = el.shadowRoot!.querySelector<HTMLButtonElement>('[name="next"]')!;
        const label = document.createElement('span');
        label.textContent = 'Next';
        next.append(label);
        label.click();
        el.shadowRoot!.querySelector<HTMLElement>('.buttons')!.click();
        el.shadowRoot!.querySelector<HTMLElement>('.context')!.click();
        el.shadowRoot!.querySelector<HTMLButtonElement>('[data-context="year"]')!.click();
        expect(dates).to.deep.equal(['next']);
        expect(views).to.deep.equal(['year']);
    });
});
