import {LitElement, css, html, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import isEmptyObjectOrUndefined from '../utils/isEmptyObjectOrUndefined.js';
import Translations from '../locales/Translations.js';

@customElement('lms-calendar-entry')
export default class Entry extends LitElement {
  private translations = new Translations();

  @property({attribute: false})
  time?: CalendarTimeInterval;

  @property()
  heading = '';

  @property()
  content?: string;

  @property({type: Boolean})
  isContinuation: boolean = false;

  @state()
  _highlighted?: boolean;

  @state()
  _extended?: boolean;

  private _sumReducer: (accumulator: number, currentValue: number) => number = (
    accumulator,
    currentValue
  ) => accumulator + currentValue;

  static override styles = css`
    :host {
      font-size: small;
      grid-column: 2;

      border-radius: var(--entry-br);
      grid-row: var(--start-slot);
      width: var(--entry-w);
      margin: var(--entry-m);
      background-color: var(--entry-bc);
      color: var(--entry-c);
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

    .nowrap {
      white-space: nowrap;
    }
  `;

  override render() {
    const contentIsEmptyOrUndefined = isEmptyObjectOrUndefined(this.content);
    return html`
      <div
        class="main"
        ?data-highlighted=${this._highlighted}
        ?data-extended=${this._extended}
      >
        <span
          @click=${this._handleClick}
          title="${this.heading}${!contentIsEmptyOrUndefined
            ? `· ${this.content}`
            : ''}"
        >
          <span> ${this.heading} </span>
          <span ?hidden=${contentIsEmptyOrUndefined}
            >&middot; ${this.content}</span
          >
        </span>
        ${this.isContinuation
          ? this.translations.getTranslation('all day')
          : html`<span class="nowrap"
              >${this._displayInterval(this.time)}</span
            > `}
      </div>
    `;
  }

  _displayInterval(time?: CalendarTimeInterval) {
    if (!time) {
      return nothing;
    }

    const END_HOURS = 2;
    const components = [
      time.start.hours,
      time.start.minutes,
      time.end.hours,
      time.end.minutes,
    ];

    const lastsAllDay =
      components[END_HOURS] === 24 &&
      components.reduce(this._sumReducer, 0) % 24 === 0;
    if (lastsAllDay) {
      return this.translations.getTranslation('all day');
    }

    const [startHours, startMinutes, endHours, endMinutes] = components.map(
      (component) => (component < 10 ? `0${component}` : component)
    );

    return `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`;
  }

  _handleClick() {
    this._highlighted = !this._highlighted;
    this._extended = !this._extended;
  }
}
