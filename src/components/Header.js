import { LitElement, css, html } from 'lit';

export default class Header extends LitElement {
  static properties = {
    heading: {},
    activeDate: {},
  };

  // Define scoped styles right with your component, in plain CSS
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
    // Declare reactive properties
    this.heading = 'Info';
    this.activeDate = {};
  }

  // Render the UI as a function of component state
  render() {
    return html`<div class="controls">
      <div class="info">
        <span>
          <strong>${this.heading}</strong>
        </span>
        <br />
        <span class="month">${this.activeDate.month}</span>
        <span class="year">${this.activeDate.year}</span>
      </div>
      <div class="buttons">
        <button @click="${this._previousMonth}">«</button>
        <button @click="${this._nextMonth}">»</button>
      </div>
    </div>`;
  }

  _previousMonth() {
    console.log('showing previous month');
  }

  _nextMonth() {
    console.log('showing next month');
  }
}
