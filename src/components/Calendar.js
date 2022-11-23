import { LitElement, css, html } from 'lit';
import Header from './Header';
import Body from './Body';
import Context from './Context';
import getDateByMonthInDirection from './utils/getDateByMonthInDirection';

customElements.define('lms-calendar-header', Header);
customElements.define('lms-calendar-body', Body);
customElements.define('lms-calendar-context', Context);

export default class LMSCalendar extends LitElement {
  static properties = {
    heading: {},
    activeDate: {},
    weekdays: {},
  };

  static styles = css`
    :host {
      --shadow-sm: rgba(0, 0, 0, 0.18) 0px 2px 4px;
      --shadow-md: rgba(0, 0, 0, 0.15) 0px 3px 3px 0px;
      --shadow-lg: rgba(0, 0, 0, 0.15) 0px 2px 8px;
      --shadow-hv: rgba(0, 0, 0, 0.08) 0px 4px 12px;

      --breakpoint-xs: 425px;
      --breakpoint-sm: 768px;
      --breakpoint-md: 1024px;

      --separator-light: rgba(0, 0, 0, 0.1);

      --system-ui: system, -apple-system, ".SFNSText-Regular", "San Francisco",
        "Roboto", "Segoe UI", "Helvetica Neue", "Lucida Grande", sans-serif;
    }
    div {
      height: 100%;
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--separator-light);
      font-family: var(--system-ui);
      color: rgba(0, 0, 0, 0.8);
      box-shadow: var(--shadow-md);
    }
  `;

  constructor() {
    super();
    this.heading = 'Current Bookings';
    this.activeDate = { day: 1, month: 1, year: 2023 };
    this.weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  }

  render() {
    return html`<div>
      <lms-calendar-header
        @switchmonth=${this._handleSwitchMonth}
        .heading=${this.heading}
        .activeDate=${this.activeDate}
      ></lms-calendar-header>
      <lms-calendar-context .weekdays=${this.weekdays}></lms-calendar-context>
      <lms-calendar-body .activeDate=${this.activeDate}></lms-calendar-body>
      <lms-calendar-footer></lms-calendar-footer>
    </div>`;
  }

  _handleSwitchMonth(e) {
    this.activeDate = getDateByMonthInDirection(
      this.activeDate,
      e.detail.direction
    );
  }
}
