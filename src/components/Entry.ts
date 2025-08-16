import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { P, match } from 'ts-pattern';
import type { CalendarDateInterval } from '../lms-calendar';
import Translations from '../locales/Translations.js';
import Menu from './Menu.js';

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

    @property({ type: Object }) date?: CalendarDateInterval;

    @state()
    _highlighted?: boolean;

    @state()
    _extended?: boolean;

    private _sumReducer: (accumulator: number, currentValue: number) => number =
        (accumulator, currentValue) => accumulator + currentValue;

    static override styles = css`
        :host {
            font-size: var(--entry-font-size, small);
            grid-column: 2;
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius, var(--border-radius-sm));
            grid-row: var(--start-slot);
            width: var(--entry-width);
            margin: var(--entry-margin);
            background-color: var(
                --entry-background-color,
                var(--background-color)
            );
            color: var(--entry-color, var(--primary-color));
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
            background: var(--entry-highlight-color, var(--separator-light));
        }

        :host([data-extended]) {
            background: var(
                --entry-extended-background-color,
                var(--background-color)
            );
        }

        :host(:focus-within) {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: -2px;
        }

        .main {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: var(--entry-padding, 0.25em);
            border-radius: var(--entry-border-radius, var(--border-radius-sm));
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
            min-width: 0; /* Required for text-overflow to work in a flex container */
            position: relative;
        }

        .main > span:first-child::after {
            content: attr(data-full-content);
            white-space: normal;
            position: absolute;
            left: 0;
            top: 100%;
            width: 100%;
            background-color: inherit;
            display: none;
        }

        :host([data-extended]) .main > span:first-child::after {
            display: block;
        }

        .interval {
            font-family: var(--entry-font-family, monospace);
            white-space: nowrap;
            margin-left: var(--entry-interval-margin, 0.5em);
            flex-shrink: 0; /* Prevent time from being compressed */
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
                data-full-content=${this.content || ''}
                ?data-extended=${this._extended}
            >
                <span>
                    <span>${this.heading}</span>
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
        this.addEventListener('click', this._handleInteraction);
        this.addEventListener('keydown', this._handleInteraction);
    }

    private _handleInteraction(e: Event) {
        if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        if (!this._highlighted) {
            this._highlighted = true;
            if (!this.date) {
                return;
            }

            const oldMenu = document.querySelector('lms-menu') as Menu | null;
            if (oldMenu) {
                oldMenu.remove();
            }
            const menu = document.createElement('lms-menu') as Menu;
            document.body.appendChild(menu);
            menu.eventDetails = {
                heading: this.heading || 'No Title',
                content: this.content || 'No Content',
                time: this.time
                    ? `${this.time.start.hour}:${this.time.start.minute} - ${this.time.end.hour}:${this.time.end.minute}`
                    : 'No Time',
                date: this.date?.start,
            };
            menu.open = true;
            menu.minimized = false;
            menu.addEventListener(
                'menu-close',
                () => {
                    this._highlighted = false;
                    menu.remove();
                },
                { once: true },
            );
        }
    }
}
