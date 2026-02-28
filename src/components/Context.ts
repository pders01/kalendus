import { localized } from '@lit/localize';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { getLocalizedWeekdayShort } from '../lib/localization.js';
import { type FirstDayOfWeek, getWeekdayOrder } from '../lib/weekStartHelper.js';

@customElement('lms-calendar-context')
@(localized() as ClassDecorator)
export default class Context extends LitElement {
    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    static override styles = css`
        div {
            height: var(--context-height, 1.75em);
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        span {
            padding: var(--context-padding, 0.25em);
            text-align: var(--context-text-align, left);
        }
    `;

    override render() {
        const order = getWeekdayOrder(this.firstDayOfWeek);
        return html` <div>
            ${order.map((luxonDay) => html`<span>${getLocalizedWeekdayShort(luxonDay)}</span>`)}
        </div>`;
    }
}
