import { localized } from '@lit/localize';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { getLocalizedWeekdayShort } from '../lib/localization.js';

@customElement('lms-calendar-context')
@(localized() as ClassDecorator)
export default class Context extends LitElement {
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
        return html` <div>
            <span>${getLocalizedWeekdayShort(1)}</span>
            <span>${getLocalizedWeekdayShort(2)}</span>
            <span>${getLocalizedWeekdayShort(3)}</span>
            <span>${getLocalizedWeekdayShort(4)}</span>
            <span>${getLocalizedWeekdayShort(5)}</span>
            <span>${getLocalizedWeekdayShort(6)}</span>
            <span>${getLocalizedWeekdayShort(7)}</span>
        </div>`;
    }
}
