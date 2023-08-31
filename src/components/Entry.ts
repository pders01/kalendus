import {LitElement, css, html, nothing} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';
import isEmptyObjectOrUndefined from '../utils/isEmptyObjectOrUndefined.js';

@customElement('lms-calendar-entry')
export default class Entry extends LitElement {
  @property({attribute: false})
  time?: CalendarTimeInterval;

  @property()
  heading = '';

  @property()
  content?: string;

  @property()
  isContinuation: Boolean = false;

  @state()
  _highlighted?: Boolean;

  @state()
  _extended?: Boolean;

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
  `;

  override render() {
    return html`
      <div
        class="main"
        ?data-highlighted=${this._highlighted}
        ?data-extended=${this._extended}
      >
        <span @click=${this._handleClick}>
          <span> ${this.heading} </span>
          <span ?hidden=${isEmptyObjectOrUndefined(this.content)}
            >· ${this.content}</span
          >
        </span>
        ${this.isContinuation
          ? '...'
          : html`<span>${this._displayStartTime(this.time)}</span> `}
      </div>
    `;
  }

  _displayStartTime(time?: CalendarTimeInterval) {
    if (!time) {
      return nothing;
    }

    const hours = time.start.hours;
    let minutes: number | string = time.start.minutes;

    if (minutes < 10) {
      minutes = `0${minutes}`;
    }

    return `${hours}:${minutes}`;
  }

  _handleClick() {
    this._highlighted = !this._highlighted;
    this._extended = !this._extended;
  }
}
