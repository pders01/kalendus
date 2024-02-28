import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { P, match } from 'ts-pattern';
import Translations from '../locales/Translations.js';

@customElement('lms-calendar-entry')
export default class Entry extends LitElement {
    private translations = new Translations();

    @property({ attribute: false })
    time?: CalendarTimeInterval;

    @property()
    heading = '';

    @property()
    content?: string;

    @property({ type: Boolean })
    isContinuation = false;

    @state()
    _highlighted?: boolean;

    @state()
    _extended?: boolean;

    private _sumReducer: (accumulator: number, currentValue: number) => number =
        (accumulator, currentValue) => accumulator + currentValue;

    static override styles = css`
        :host {
            font-size: small;
            grid-column: 2;

            border-radius: var(--entry-border-radius);
            grid-row: var(--start-slot);
            width: var(--entry-width);
            margin: var(--entry-margin);
            background-color: var(--entry-background-color);
            color: var(--entry-color);
            /* z-index of separators in day view is 0 */
            z-index: 1;
        }

        .main {
            display: flex;
            justify-content: space-between;
            padding: 0.25em;
            border-radius: var(--border-radius-sm);
            background-color: inherit;
        }

        .main > span:first-child {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        div[data-highlighted] {
            background: var(--separator-light);
        }

        .interval {
            font-family: monospace;
            white-space: nowrap;
        }
    `;

    private _renderTitle() {
        return match(this.content)
            .with(P.nullish, () => this.heading)
            .otherwise(() => `${this.heading}: ${this.content}`);
    }

    private _renderInterval() {
        return this.isContinuation
            ? html`<span>${this.translations.getTranslation('all day')}</span>`
            : html`<span class="interval"
                  >${this._displayInterval(this.time)}</span
              >`;
    }

    override render() {
        return html`
            <div
                class="main"
                ?data-highlighted=${this._highlighted}
                ?data-extended=${this._extended}
                tabindex="1"
            >
                <span @click=${this._handleClick} title=${this._renderTitle()}>
                    <span>${this.heading}</span>
                    <span ?hidden=${!this.content}>: ${this.content}</span>
                </span>
                ${this._renderInterval()}
            </div>
        `;
    }

    private _displayInterval(time?: CalendarTimeInterval) {
        if (!time) {
            return nothing;
        }

        const END_HOURS = 2;
        const components = [
            time.start.hour,
            time.start.minute,
            time.end.hour,
            time.end.minute,
        ];

        const lastsAllDay =
            components[END_HOURS] === 24 &&
            components.reduce(this._sumReducer, 0) % 24 === 0;
        if (lastsAllDay) {
            return this.translations.getTranslation('all day');
        }

        const [startHours, startMinutes, endHours, endMinutes] = components.map(
            (component) => (component < 10 ? `0${component}` : component),
        );

        return `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`;
    }

    private _handleClick() {
        this._highlighted = !this._highlighted;
        this._extended = !this._extended;
    }
}
