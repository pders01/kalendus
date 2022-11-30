import { LitElement, css, html } from 'lit';
import isEmptyObject from '../utils/isEmptyObject';

export default class Entry extends LitElement {
  static properties = {
    time: {},
    title: {},
    content: {},
    styles: {},
    _highlighted: { state: true },
    _extended: { state: true },
  };

  static styles = css`
    :host {
      font-size: small;
      grid-column: 2;

      border-radius: var(--border-radius-sm);
      grid-row: var(--start-slot);
      width: var(--entry-w);
      margin: var(--entry-m);
      background-color: var(--entry-bc);
      color: var(--entry-c);
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

    div[highlighted] {
      background: var(--separator-light);
    }
  `;

  constructor() {
    super();
    this.time = {};
    this.title = {};
    this.content = {};
    this.styles = { backgroundColor: 'transparent', color: 'black' };
    this._highlighted = false;
    this._extended = false;
  }

  render() {
    return html`
      <div
        class="main"
        ?highlighted=${this._highlighted}
        ?extended=${this._extended}
      >
        <span @click=${this._handleClick}>
          <span> ${this.title} </span>
          <span ?hidden=${isEmptyObject(this.content)}>· ${this.content}</span>
        </span>
        <span
          >${this.time.start.hours}:${this.time.start.minutes < 10
            ? `0${this.time.start.minutes}`
            : this.time.start.minutes}</span
        >
      </div>
    `;
  }

  _handleClick() {
    this._highlighted = true;
    this._extended = true;
  }
}
