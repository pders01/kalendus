import { LitElement, css, html } from 'lit';
import Header from './Header';
import Month from './Month';
import Day from './Day';
import Context from './Context';
import Entry from './Entry';
import getDateByMonthInDirection from '../utils/getDateByMonthInDirection';
import objectsAreEqual from '../utils/objectsAreEqual';
import isEmptyObject from '../utils/isEmptyObject';
import getColorWithTextContrast from '../utils/getColorWithTextContrast';
import partitionOverlappingIntervals from '../utils/partitionOverlappingIntervals';
import getOverlappingEntitiesIndices from '../utils/getOverlappingEntitiesIndices';

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
    color: {},
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

      --border-radius-sm: 5px;
      --border-radius-md: 7px;
      --border-radius-lg: 12px;
    }
    div {
      height: 100%;
      width: 100%;
      border-radius: var(--border-radius-lg);
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
    this.color = {};
    this._expandedDate = {};
  }

  render() {
    return html`
      <div>
        <lms-calendar-header
          @switchmonth=${this._handleSwitchMonth}
          @switchview=${this._handleSwitchView}
          .heading=${this.heading}
          .activeDate=${this.activeDate}
          .expandedDate=${this._expandedDate}
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

  _handleSwitchView(e) {
    if (e.detail.view === 'day') {
      this._expandedDate = !isEmptyObject(this._expandedDate)
        ? this._expandedDate
        : this.activeDate;
    }

    if (e.detail.view === 'month') {
      this._expandedDate = {};
    }
  }

  _handleExpand(e) {
    this._expandedDate = e.detail.date;
  }

  _getEntries() {
    return this.entries.length !== 0
      ? html`${this.entries
        .sort(
          (a, b) =>
            a.time.start.hours - b.time.start.hours ||
              a.time.start.minutes - b.time.start.minutes
        )
        .map(({ date, time, title, color }, index) => {
          const [background, text] = getColorWithTextContrast(color);
          const id = `_${index}`;
          return html`
              <style>
                lms-calendar-entry.${id} {
                  --entry-m: 0 0.25em 0 1.5em;
                  --entry-bc: ${background};
                  --entry-c: ${text};
                }
              </style>
              <lms-calendar-entry
                class=${id}
                slot="${date.start.year}-${date.start.month}-${date.start.day}"
                .time=${time}
                .title=${title}
              >
              </lms-calendar-entry>
            `;
        })}`
      : html``;
  }

  _getEntriesByDate() {
    const entriesByDate = this.entries.filter((entry) =>
      objectsAreEqual(entry.date.start, this._expandedDate)
    );

    const grading = !isEmptyObject(entriesByDate)
      ? getOverlappingEntitiesIndices(
        this._getPartitionedSlottedItems(entriesByDate)
      )
      : [];

    return entriesByDate.map(({ time, title, content, color }, index) => {
      const [background, text] = getColorWithTextContrast(color);
      const id = `_${index}`;
      return html`
        <style>
          lms-calendar-entry.${id} {
            --start-slot: ${this._getGridSlotByTime(time)};
            --entry-w: ${this._getWidthByGroupSize({ grading, index })}%;
            --entry-m: 0 1.5em 0 ${this._getOffsetByDepth({ grading, index })}%;
            --entry-bc: ${background};
            --entry-c: ${text};
          }
        </style>
        <lms-calendar-entry
          class=${id}
          slot=${time.start.hours}
          .time=${time}
          .title=${title}
          .content=${content}
        >
        </lms-calendar-entry>
      `;
    });
  }

  _getGridSlotByTime({ start, end }) {
    const startRow = start.hours * 60 + (start.minutes + 1);
    return `${startRow}/${
      startRow + (end.hours * 60 + end.minutes - startRow)
    }`;
  }

  _getWidthByGroupSize({ grading, index }) {
    return (
      100 / grading.filter((item) => item.group === grading[index].group).length
    );
  }

  _getOffsetByDepth({ grading, index }) {
    return grading[index].depth === 0
      ? 0
      : grading[index].depth *
          (100 /
            grading.filter((item) => item.group === grading[index].group)
              .length);
  }

  _getPartitionedSlottedItems(items) {
    return partitionOverlappingIntervals(
      items
        .map((entry) =>
          this._getGridSlotByTime(entry.time)
            .replace(/[^0-9/]+/g, '')
            .split('/')
        )
        .map(([start, end]) => [parseInt(start, 10), parseInt(end, 10)])
        .map(([start, end]) => ({ start, end }))
    );
  }
}
