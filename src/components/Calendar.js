import { LitElement, css, html } from 'lit';
import Header from './Header';
import Month from './Month';
import Day from './Day';
import Context from './Context';
import Entry from './Entry';
import getDateByMonthInDirection from '../utils/getDateByMonthInDirection';
import objectsAreEqual from '../utils/objectsAreEqual';
import isEmptyObject from '../utils/isEmptyObject';

customElements.define('lms-calendar-header', Header);
customElements.define('lms-calendar-month', Month);
customElements.define('lms-calendar-day', Day);
customElements.define('lms-calendar-context', Context);
customElements.define('lms-calendar-entry', Entry);

export default class LMSCalendar extends LitElement {
  static properties = {
    heading: {},
    activeDate: {},
    weekdays: {},
    entries: {},
    _expandedDate: {},
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
      --separator-mid: rgba(0, 0, 0, 0.4);
      --separator-dark: rgba(0, 0, 0, 0.7);

      --system-ui: system, -apple-system, ".SFNSText-Regular", "San Francisco",
        "Roboto", "Segoe UI", "Helvetica Neue", "Lucida Grande", sans-serif;
    }
    div {
      height: 100%;
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--separator-light);
      font-family: var(--system-ui);
      color: var(--separator-dark);
      box-shadow: var(--shadow-md);
    }
  `;

  constructor() {
    super();
    this.heading = 'Current Bookings';
    this.activeDate = {};
    this.weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    this.entries = [];
    this._expandedDate = {};
  }

  render() {
    return html`
      <div>
        <lms-calendar-header
          @switchmonth=${this._handleSwitchMonth}
          .heading=${this.heading}
          .activeDate=${this.activeDate}
        ></lms-calendar-header>

        <lms-calendar-context
          .weekdays=${this.weekdays}
          ?hidden=${!isEmptyObject(this._expandedDate)}
        ></lms-calendar-context>

        <lms-calendar-month
          @expand=${this._handleExpand}
          .activeDate=${this.activeDate}
          ?hidden=${!isEmptyObject(this._expandedDate)}
        >
          ${this._getEntries()}
        </lms-calendar-month>

        <lms-calendar-day ?hidden=${isEmptyObject(this._expandedDate)}>
          ${this._getEntriesByDate()}
        </lms-calendar-day>

        <lms-calendar-footer></lms-calendar-footer>
      </div>
    `;
  }

  _handleSwitchMonth(e) {
    this.activeDate = getDateByMonthInDirection(
      this.activeDate,
      e.detail.direction
    );
  }

  _handleExpand(e) {
    this._expandedDate = e.detail.date;
  }

  _getEntries() {
    return this.entries.length !== 0
      ? html`${this.entries
        .sort((a, b) => a.time.hours - b.time.hours || a.time.minutes - b.time.minutes)
        .map(
            ({ date, time, title }) =>
              html`<lms-calendar-entry
                slot="${date.year}-${date.month}-${date.day}"
                .time=${time}
                .title=${title}
              ></lms-calendar-entry>`
          )}`
      : html``;
  }

  _getEntriesByDate() {
    return this.entries
      .filter((entry) => objectsAreEqual(entry.date, this._expandedDate))
      .map(
        ({ time, title, content }) =>
          html`<lms-calendar-entry
            slot=${time.hours}
            .time=${time}
            .title=${title}
            .content=${content}
            style=${this._getGridSlotByTime(time)}
          ></lms-calendar-entry>`
      );
  }

  _getGridSlotByTime({ hours, minutes }) {
    return `grid-row: ${hours * 60 + (minutes + 1)}/${hours * 60 + minutes + 30}`;
  }
}
