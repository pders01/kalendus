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
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius);
            grid-row: var(--start-slot);
            width: var(--entry-width);
            margin: var(--entry-margin);
            background-color: var(--entry-background-color);
            color: var(--entry-color);
            /* z-index of separators in day view is 0 */
            z-index: 1;
            box-sizing: border-box;
            padding-bottom: 1px;
            min-height: 1.5em; /* Ensure minimum height for short events */
        }

        :host(:last-child) {
            padding-bottom: 0;
        }

        :host([data-highlighted]) {
            background: var(--separator-light);
        }

        :host(:focus-within) {
            outline: 2px solid var(--primary-color);
            outline-offset: -2px;
        }

        .main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 0.25em;
            border-radius: var(--border-radius-sm);
            background-color: inherit;
            text-align: left;
            height: 100%;
            box-sizing: border-box;
        }

        .main > span:first-child {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex-grow: 1;
            min-width: 0;  /* Required for text-overflow to work in a flex container */
        }

        .interval {
            font-family: monospace;
            white-space: nowrap;
            margin-left: 0.5em;
            flex-shrink: 0;  /* Prevent time from being compressed */
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
                tabindex="1"
                title=${this._renderTitle()}
            >
                <span>
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

    constructor() {
        super();
        this.addEventListener('click', this._handleClick);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('click', this._handleClick);
    }

    private _handleClick(e: Event) {
        // Prevent event from bubbling up to parent elements
        e.stopPropagation();
        
        this._highlighted = !this._highlighted;
        this._extended = !this._extended;
        
        // Set the highlighted state on the host element
        if (this._highlighted) {
            this.setAttribute('data-highlighted', '');
        } else {
            this.removeAttribute('data-highlighted');
        }
        
        // Dispatch a custom event that parent elements can listen to if needed
        this.dispatchEvent(new CustomEvent('entry-click', {
            bubbles: true,
            composed: true,
            detail: {
                highlighted: this._highlighted,
                extended: this._extended,
                heading: this.heading,
                content: this.content,
                time: this.time
            }
        }));
    }
}
