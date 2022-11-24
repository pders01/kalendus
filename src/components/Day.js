import { LitElement, css, html } from 'lit';

export default class Day extends LitElement {
  static properties = {
    

    _hours: {},
  };

  static styles = css`
    .container {
      display: flex;
      /* Header: 3.5em */
      height: calc(100% - 3.5em);
      width: 100%;
    }
    
    .main {
      display: grid;
      grid-template-columns: 3em 1fr;
      grid-template-rows: repeat(1440, 1fr);
      width: 70%;
      height: 100%;
      gap: calc(3em / 60);
      overflow-y: scroll;
      padding-left: 1em;
    }

    .sidebar {
      width: 30%;
      height: 100%;
      border-left: 1px solid var(--separator-light);
    }
  `;

  constructor() {
    super();

    this._hours = [...Array(25).keys()];
  }

  render() {
    return html`<div class="container">
      <div class="main">
        ${this._hours.map(
          (hour) =>
            html`
              <div class="hour" style=${this._getHourIndicator(hour)}>
                <span class="indicator">
                  ${hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </span>
              </div>
            `
        )}
        <slot name="entry"></slot>
      </div>
      <div class="sidebar"></div>
    </div>`;
  }

  _getHourIndicator(hour) {
    return hour !== 24 ? `grid-row: ${(hour + 1) * 60 - 59}/${(hour + 1) * 60}` : 'grid-row: 1440';
  }
}
