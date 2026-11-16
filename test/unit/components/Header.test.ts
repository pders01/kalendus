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
        expect(el.shadowRoot!.querySelector('h2')!.textContent).to.equal('Calendar view');
        for (const button of el.shadowRoot!.querySelectorAll('button'))
            expect(button.getBoundingClientRect().height).to.be.at.least(24);
    });
    it('describes the actual visible week across months and configurable week starts', async () => {
        const el = await fixture<Header>(
            html`<lms-calendar-header .activeDate=${{ year: 2024, month: 10, day: 1 }} .firstDayOfWeek=${0} .viewMode=${'week'}></lms-calendar-header>`,
        );
        await el.updateComplete;
        const range = el.shadowRoot!.querySelector('.week-range')!.textContent!;
        expect(range).to.include('Sep 29, 2024');
        expect(range).to.include('Oct 5, 2024');
        el.visibleDates = [
            { year: 2024, month: 9, day: 30 },
            { year: 2024, month: 10, day: 1 },
        ];
        await el.updateComplete;
        const condensed = el.shadowRoot!.querySelector('.week-range')!.textContent!;
        expect(condensed).to.include('Sep 30, 2024');
        expect(condensed).to.include('Oct 1, 2024');
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
