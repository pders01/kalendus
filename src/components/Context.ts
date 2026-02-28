import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { getLocalizedWeekdayShort } from '../lib/localization.js';
import { type FirstDayOfWeek, getWeekdayOrder } from '../lib/weekStartHelper.js';

@customElement('lms-calendar-context')
export default class Context extends LitElement {
    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    @property({ type: String })
    locale = 'en';

    static override styles = css`
        :host {
            display: block;
            flex-shrink: 0;
        }

        div {
            height: var(--context-height, 1.75em);
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        span {
            /* Match the month indicator's margin (0.25em) + padding (0.25em) */
            padding: var(--context-padding, 0.25em) var(--context-padding-inline, 0.5em);
            text-align: var(--context-text-align, left);
        }
    `;

    override render() {
        const order = getWeekdayOrder(this.firstDayOfWeek);
        return html` <div>
            ${order.map((luxonDay) => html`<span>${getLocalizedWeekdayShort(luxonDay, this.locale)}</span>`)}
        </div>`;
    }
}
