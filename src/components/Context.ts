import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import Translations from '../locales/Translations';

@customElement('lms-calendar-context')
export default class Context extends LitElement {
    private translations = new Translations();

    static override styles = css`
        div {
            height: 1.75em;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
        }
        span {
            padding: 0.25em;
            text-align: left;
        }
    `;

    override render() {
        return html` <div>
            <span>${this.translations.getTranslation('Mon')}</span>
            <span>${this.translations.getTranslation('Tues')}</span>
            <span>${this.translations.getTranslation('Wed')}</span>
            <span>${this.translations.getTranslation('Thurs')}</span>
            <span>${this.translations.getTranslation('Fri')}</span>
            <span>${this.translations.getTranslation('Sat')}</span>
            <span>${this.translations.getTranslation('Sun')}</span>
        </div>`;
    }
}
