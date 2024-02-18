import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as R from 'remeda';
import Translations from '../locales/Translations';

@customElement('lms-calendar-header')
export default class Header extends LitElement {
    private translations = new Translations();

    @property({ type: String })
    heading?: string;

    @property({ type: Object })
    activeDate?: CalendarDate;

    @property({ type: Object })
    expandedDate?: CalendarDate;

    static override styles = css`
        .controls {
            height: 3.5em;
            width: 100%;
            /* padding: 0.75em 0; */
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-content: center;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--separator-light);
        }

        @media (max-width: 375px) {
            .controls {
                font-size: small;
                height: 4.5em;
            }
        }
        .info {
            padding-left: 1em;
            text-align: right;
        }
        .day,
        .month,
        .year {
            color: rgba(0, 0, 0, 0.6);
        }
        .buttons {
            padding-right: 1em;
        }
        button {
            padding: 0.75em;
            margin: 0;
            border-radius: 50%;
            line-height: 0.5em;
            border: 1px solid transparent;
        }
        .context {
            display: flex;
        }
        .context > * {
            padding: 0.75em 0.5em;
            border: 1px solid var(--separator-light);
            background-color: var(--background-color);
        }
        .context > *:first-child {
            border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);
            border-right: none;
        }
        .context > *:last-child {
            border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
            border-left: none;
        }
        button[data-active] {
            background-color: var(--separator-light);
        }
    `;

    override render() {
        const hasEmptyDate = R.isEmpty(this.expandedDate ?? {});
        return html`<div class="controls">
            <div class="info">
                <span>
                    <strong
                        >${this.heading ||
                        this.translations.getTranslation(
                            'Current Month',
                        )}</strong
                    >
                </span>
                <div ?hidden=${hasEmptyDate}>
                    <span class="day">${this.expandedDate?.day}</span>
                    <span class="month"
                        >${this.translations.getTranslation(
                            this.expandedDate?.month,
                        )}</span
                    >
                    <span class="year">${this.expandedDate?.year}</span>
                </div>
                <div ?hidden=${!hasEmptyDate}>
                    <span class="month"
                        >${this.translations.getTranslation(
                            this.activeDate?.month,
                        )}</span
                    >
                    <span class="year">${this.activeDate?.year}</span>
                </div>
            </div>
            <div class="context" @click=${this._dispatchSwitchView}>
                <button
                    ?data-active=${!hasEmptyDate}
                    data-context="day"
                    class="btn-change-view"
                >
                    ${this.translations.getTranslation('Day')}
                </button>
                <button
                    ?data-active=${hasEmptyDate}
                    data-context="month"
                    class="btn-change-view"
                >
                    ${this.translations.getTranslation('Month')}
                </button>
            </div>
            <div class="buttons" @click=${this._dispatchSwitchDate}>
                <button name="previous">«</button>
                <button name="next">»</button>
            </div>
        </div>`;
    }

    private _dispatchSwitchDate(e: Event) {
        const target = e.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const direction =
            e.target === e.currentTarget ? 'container' : target.name;
        const event = new CustomEvent('switchdate', {
            detail: { direction },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    private _dispatchSwitchView(e: Event) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const view =
            e.target === e.currentTarget ? 'container' : target.dataset.context;
        const event = new CustomEvent('switchview', {
            detail: { view },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }
}
