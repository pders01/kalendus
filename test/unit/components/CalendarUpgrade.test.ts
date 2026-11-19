import { expect, waitUntil } from '@open-wc/testing';

it('replays an owner-assigned date and view when the custom element upgrades', async () => {
    const el = document.createElement('lms-calendar');
    expect(customElements.get('lms-calendar')).to.equal(undefined);
    el.activeDate = { year: 2026, month: 4, day: 20 };
    el.viewMode = 'day';
    const rendered: string[] = [];
    el.addEventListener('calendar-state-change', ({ detail }) => rendered.push(detail.range.start));
    document.body.append(el);
    try {
        await import('../../../src/lms-calendar.js');
        await el.updateComplete;
        const day = el.shadowRoot!.querySelector('lms-calendar-day')!;
        expect(day.activeDate).to.deep.equal(el.activeDate);
        expect(rendered).to.deep.equal(['2026-04-20']);
        el.shadowRoot!.querySelector('lms-calendar-header')!
            .shadowRoot!.querySelector<HTMLButtonElement>('button[name="next"]')!
            .click();
        await waitUntil(() => rendered.at(-1) === '2026-04-21');
        expect(day.activeDate).to.deep.equal({ year: 2026, month: 4, day: 21 });
        expect(el.visibleRange.start).to.equal('2026-04-21');
    } finally {
        el.remove();
    }
});
