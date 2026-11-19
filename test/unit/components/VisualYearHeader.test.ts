import { expect, fixture, html } from '@open-wc/testing';

import '../../../src/components/Year.ts';
import '../../../src/components/Header.ts';
import type Header from '../../../src/components/Header.ts';
import type Year from '../../../src/components/Year.ts';

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
const bounds = (element: Element) => element.getBoundingClientRect();

function contained(inner: DOMRect, outer: DOMRect) {
    expect(inner.left).to.be.at.least(outer.left - 1);
    expect(inner.right).to.be.at.most(outer.right + 1);
    expect(inner.top).to.be.at.least(outer.top - 1);
    expect(inner.bottom).to.be.at.most(outer.bottom + 1);
}

async function yearFixture(width: number, fontSize = 16, direction = 'ltr') {
    const element = await fixture<Year>(html`
        <lms-calendar-year
            style="inline-size: ${width}px; block-size: 800px; font: ${fontSize}px Arial; direction: ${direction}; --year-cell-size: 2.25em; --half-day-height: 360px"
            .activeDate=${{ year: 2026, month: 1, day: 31 }}
            .entrySumByDay=${{ '2026-1-12': 12, '2026-1-19': 100 }}
            densityMode="count"
        ></lms-calendar-year>
    `);
    await element.updateComplete;
    await frame();
    return element;
}

describe('Year / Header visual geometry regressions', () => {
    for (const { width, fontSize, columns, direction } of [
        { width: 1136, fontSize: 16, columns: 4, direction: 'ltr' },
        { width: 680, fontSize: 16, columns: 3, direction: 'ltr' },
        { width: 358, fontSize: 16, columns: 1, direction: 'ltr' },
        { width: 358, fontSize: 16, columns: 1, direction: 'rtl' },
        { width: 752, fontSize: 32, columns: 1, direction: 'ltr' },
    ]) {
        it(`keeps Year dates aligned with non-overlapping targets at ${width}px / ${fontSize}px / ${direction}`, async () => {
            const el = await yearFixture(width, fontSize, direction);
            const months = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.mini-month')];
            expect(months).to.have.length(12);
            const firstRow = months.filter(
                (month) => Math.abs(bounds(month).top - bounds(months[0]).top) < 1,
            );
            expect(firstRow).to.have.length(columns);
            for (const month of months) {
                expect(month.scrollWidth).to.be.at.most(month.clientWidth + 1);
                const rows = [...month.querySelectorAll<HTMLElement>('.day-row')];
                // Only the unused slots in the six-week grid may follow the final date.
                const weekHeight = Math.max(...rows.map((row) => bounds(row).height));
                expect(bounds(month).bottom - bounds(rows.at(-1)!).bottom).to.be.at.most(
                    (6 - rows.length) * weekHeight + 2,
                );
                const headers = [...month.querySelectorAll('.weekday-header > span')];
                for (const row of rows) {
                    const cells = [...row.children];
                    cells.forEach((cell, index) => {
                        const header = bounds(headers[index]);
                        const date = bounds(cell.querySelector('.date-number') ?? cell);
                        expect(
                            Math.abs(
                                (date.left + date.right) / 2 - (header.left + header.right) / 2,
                            ),
                        ).to.be.lessThan(1);
                    });
                    const targets = [...row.querySelectorAll<HTMLButtonElement>('button')];
                    const weekTarget = bounds(targets[0]);
                    const dateTarget = bounds(targets[1]);
                    expect(
                        Math.abs(
                            (weekTarget.top + weekTarget.bottom) / 2 -
                                (dateTarget.top + dateTarget.bottom) / 2,
                        ),
                    ).to.be.lessThan(1);
                    for (const target of targets) {
                        expect(bounds(target).width).to.be.at.least(24);
                        expect(bounds(target).height).to.be.at.least(24);
                        contained(bounds(target), bounds(row));
                    }
                    targets.sort((a, b) => bounds(a).left - bounds(b).left);
                    for (let i = 1; i < targets.length; i++) {
                        expect(bounds(targets[i - 1]).right).to.be.at.most(
                            bounds(targets[i]).left + 1,
                        );
                    }
                }
                for (const count of month.querySelectorAll('.event-count')) {
                    const row = count.closest('.day-row')!;
                    expect(bounds(count).bottom).to.be.at.most(bounds(row).bottom + 1);
                }
            }
        });
    }

    it('keeps offscreen dates reachable and preserves date/week focus and drill events', async () => {
        const el = await yearFixture(358);
        const key = async (target: HTMLElement, name: string) => {
            target.dispatchEvent(
                new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }),
            );
            await el.updateComplete;
            await frame();
        };
        await el.focusDate({ year: 2026, month: 1, day: 31 });
        await key(el.shadowRoot!.activeElement as HTMLElement, 'ArrowRight');
        expect((el.shadowRoot!.activeElement as HTMLElement).dataset.date).to.equal('2026-2-1');
        await key(el.shadowRoot!.activeElement as HTMLElement, 'F2');
        const week = el.shadowRoot!.activeElement as HTMLButtonElement;
        expect(week.classList.contains('cw-label')).to.equal(true);
        let detail: unknown;
        el.addEventListener('expand', (event) => {
            detail = (event as CustomEvent).detail;
        });
        week.click();
        expect(detail).to.deep.equal({
            date: { year: 2026, month: 2, day: 1 },
            drillTarget: 'week',
        });
        await key(week, 'Escape');
        expect((el.shadowRoot!.activeElement as HTMLElement).dataset.date).to.equal('2026-2-1');
        await el.focusDate({ year: 2026, month: 12, day: 31 });
        const scroller = el.shadowRoot!.querySelector<HTMLElement>('.scroll-container')!;
        expect(scroller.scrollTop).to.be.greaterThan(0);
        contained(bounds(el.shadowRoot!.activeElement!), bounds(scroller));
        const december = el.shadowRoot!.querySelector<HTMLButtonElement>('#month-12')!;
        december.click();
        expect(detail).to.deep.equal({
            date: { year: 2026, month: 12, day: 1 },
            drillTarget: 'month',
        });
    });

    for (const { width, fontSize, direction } of [
        { width: 900, fontSize: 16, direction: 'ltr' },
        { width: 752, fontSize: 16, direction: 'ltr' },
        { width: 358, fontSize: 16, direction: 'ltr' },
        { width: 358, fontSize: 16, direction: 'rtl' },
        { width: 752, fontSize: 32, direction: 'ltr' },
    ]) {
        it(`reflows long Header content without clipping controls at ${width}px / ${fontSize}px / ${direction}`, async () => {
            const el = await fixture<Header>(html`
                <lms-calendar-header
                    style="inline-size: ${width}px; font: ${fontSize}px Arial; direction: ${direction}"
                    heading="International collaboration and release planning calendar"
                    .activeDate=${{ year: 2026, month: 12, day: 31 }}
                    viewMode="week"
                ></lms-calendar-header>
            `);
            await el.updateComplete;
            await frame();
            const controls = el.shadowRoot!.querySelector<HTMLElement>('.controls')!;
            expect(controls.scrollWidth).to.be.at.most(controls.clientWidth + 1);
            for (const selector of ['.info', '.context', '.buttons']) {
                const group = el.shadowRoot!.querySelector<HTMLElement>(selector)!;
                contained(bounds(group), bounds(controls));
                expect(group.scrollWidth).to.be.at.most(group.clientWidth + 1);
            }
            const visibleDetails = [...el.shadowRoot!.querySelectorAll('.view-detail')].filter(
                (detail) => getComputedStyle(detail).visibility === 'visible',
            );
            expect(visibleDetails).to.have.length(1);
            expect(visibleDetails[0].textContent).to.include('Dec 28, 2026');
            expect(visibleDetails[0].textContent).to.include('Jan 3, 2027');
            contained(bounds(visibleDetails[0]), bounds(controls));
            // Enlarge text on the embedding element: no absolute `small` reset.
            expect(parseFloat(getComputedStyle(controls).fontSize)).to.be.at.least(fontSize * 0.85);
            const buttons = [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button')];
            for (const button of buttons) {
                expect(bounds(button).width).to.be.at.least(24);
                expect(bounds(button).height).to.be.at.least(24);
                contained(bounds(button), bounds(controls));
            }
            for (let i = 0; i < buttons.length; i++)
                for (let j = i + 1; j < buttons.length; j++) {
                    const a = bounds(buttons[i]);
                    const b = bounds(buttons[j]);
                    const intersection = Math.min(a.right, b.right) - Math.max(a.left, b.left);
                    const verticalIntersection =
                        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
                    expect(intersection > 1 && verticalIntersection > 1).to.equal(false);
                }
            const switches: string[] = [];
            el.addEventListener('switchview', (event) =>
                switches.push((event as CustomEvent).detail.view),
            );
            el.shadowRoot!.querySelector<HTMLButtonElement>('[data-context="year"]')!.click();
            expect(switches).to.deep.equal(['year']);
        });
    }
});
