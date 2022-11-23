import { LitElement, css, html } from 'lit';
import localize from '../localization/localize';
export default class Header extends LitElement {
  static properties = {
    heading: {},
    activeDate: {},
  };

  static styles = css`
    .controls {
      height: 37px;
      width: 100%;
      padding: 0.75em 0;
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-content: center;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--separator-light);
    }
    .info {
      padding-left: 1em;
      text-align: right;
    }
    .month,
    .year {
      color: rgba(0, 0, 0, 0.4);
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
  `;

  constructor() {
    super();
    this.heading = 'Info';
    this.activeDate = {};
  }

  render() {
    return html`<div class="controls">
      <div class="info">
        <span>
          <strong>${this.heading}</strong>
        </span>
        <br />
        <span class="month">
          ${localize({
      locale: window.navigator.language,
      topic: 'months',
      string: this.activeDate.month,
    })}
        </span>
        <span class="year">${this.activeDate.year}</span>
      </div>
      <div class="buttons" @click="${this._dispatchSwitchMonth}">
        <button name="previous">«</button>
        <button name="next">»</button>
      </div>
    </div>`;
  }

  _dispatchSwitchMonth(e) {
    const direction =
      e.target === e.currentTarget ? 'container' : e.target.name;
    const event = new CustomEvent('switchmonth', {
      detail: { direction },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}
