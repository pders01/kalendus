import { LitElement, css, html } from 'lit';
import isEmptyObject from '../utils/isEmptyObject';

export default class Entry extends LitElement {
  static properties = {
    time: {},
    title: {},
    content: {},
    _highlighted: { state: true },
    _extended: { state: true },
  };

  static styles = css`
    :host {
      /*TODO: Margins are subject to change */
      margin-right: 0.25em;
      margin-left: 1.5em;
      font-size: small;
      border-radius: 5px;
    }

    .main {
      display: flex;
      justify-content: space-between;
      padding: 0.25em;
      border-radius: 5px;
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
    this._highlighted = false;
    this._extended = false;
  }

  _handleClick() {
    this._highlighted = true;
    this._extended = true;
  }

  render() {
    return html`
      <div
        class="main"
        ?highlighted=${this._highlighted}
        ?extended=${this._extended}
      >
        <span @click=${this._handleClick}>
          <span>
            ${this.title}
          </span>
          <span ?hidden=${isEmptyObject(this.content)}>· ${this.content}</span>
        </span>
        <span
          >${this.time.hours}:${this.time.minutes < 10
            ? `0${this.time.minutes}`
            : this.time.minutes}</span
        >
      </div>
    `;
  }
}
