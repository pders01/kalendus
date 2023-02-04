import {LitElement, css, html} from 'lit';
import {customElement, property, state} from 'lit/decorators.js';

import './components/Header.js';
import './components/Month.js';
import './components/Day.js';
import './components/Context.js';
import './components/Entry.js';
import getDateByMonthInDirection from './utils/getDateByMonthInDirection.js';
import isEmptyObjectOrUndefined from './utils/isEmptyObjectOrUndefined.js';
import getColorTextWithContrast from './utils/getColorTextWithContrast.js';
import partitionOverlappingIntervals from './utils/partitionOverlappingIntervals.js';
import getOverlappingEntitiesIndices from './utils/getOverlappingEntitiesIndices.js';
import haveSameValues from './utils/haveSameValues.js';
import getSortedGradingsByIndex from './utils/getSortedGradingsByIndex.js';

@customElement('lms-calendar')
export default class LMSCalendar extends LitElement {
  @property({type: String})
  heading = 'Current Bookings';

  @property({type: Object})
  activeDate: CalendarDate = {
    day: 1,
    month: 1,
    year: 2022,
  };

  @property({type: Array})
  weekdays: string[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  @property({type: Array})
  entries: CalendarEntry[] = [];

  @property({type: String})
  color = '#000000';

  @state()
  _expandedDate?: CalendarDate;

  static override styles = css`
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

      --system-ui: system, -apple-system, '.SFNSText-Regular', 'San Francisco',
        'Roboto', 'Segoe UI', 'Helvetica Neue', 'Lucida Grande', sans-serif;

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

  override render() {
    return html`
      <div>
        <lms-calendar-header
          @switchmonth=${this._handleSwitchMonth}
          @switchview=${this._handleSwitchView}
          .heading=${this.heading}
          .activeDate=${this.activeDate}
          .expandedDate=${this._expandedDate}
        >
        </lms-calendar-header>

        <lms-calendar-context
          .weekdays=${this.weekdays}
          ?hidden=${!isEmptyObjectOrUndefined(this._expandedDate)}
        >
        </lms-calendar-context>

        <lms-calendar-month
          @expand=${this._handleExpand}
          .activeDate=${this.activeDate}
          ?hidden=${!isEmptyObjectOrUndefined(this._expandedDate)}
        >
          ${this._getEntries()}
        </lms-calendar-month>

        <lms-calendar-day
          ?hidden=${isEmptyObjectOrUndefined(this._expandedDate)}
        >
          ${this._getEntriesByDate()}
        </lms-calendar-day>
      </div>
    `;
  }

  _handleSwitchMonth(e: CustomEvent) {
    this.activeDate = getDateByMonthInDirection(
      this.activeDate,
      e.detail.direction
    );
  }

  _handleSwitchView(e: CustomEvent) {
    if (e.detail.view === 'day') {
      this._expandedDate = !isEmptyObjectOrUndefined(this._expandedDate)
        ? this._expandedDate
        : this.activeDate;
    }

    if (e.detail.view === 'month') {
      this._expandedDate = undefined;
    }
  }

  _handleExpand(e: CustomEvent) {
    this._expandedDate = e.detail.date;
  }

  // _getEntries() {
  //   return this.entries.length !== 0
  //     ? html`${this.entries
  //         .sort(
  //           (a, b) =>
  //             a.time.start.hours - b.time.start.hours ||
  //             a.time.start.minutes - b.time.start.minutes
  //         )
  //         .map(({date, time, heading, color}, index) => {
  //           const [background, text] = getColorTextWithContrast(color);
  //           return html`
  //             <style>
  //               lms-calendar-entry.${`_${index}`} {
  //                 --entry-m: 0 0.25em 0 1.5em;
  //                 --entry-bc: ${background};
  //                 --entry-c: ${text};
  //               }
  //             </style>
  //             <lms-calendar-entry
  //               class=${`_${index}`}
  //               slot="${date.start.year}-${date.start.month}-${date.start.day}"
  //               .time=${time}
  //               .heading=${heading}
  //             >
  //             </lms-calendar-entry>
  //           `;
  //         })}`
  //     : html``;
  // }

  _getEntries() {
    return this.entries.length !== 0
      ? html`${this.entries
          .sort(
            (a, b) =>
              a.time.start.hours - b.time.start.hours ||
              a.time.start.minutes - b.time.start.minutes
          )
          .map(({date, time, heading, color}, index) => {
            const [background, text] = getColorTextWithContrast(color);
            // Calculate the number of days the entry spans
            const startDate = new Date(date.start.year, date.start.month - 1, date.start.day);
            const endDate = new Date(date.end.year, date.end.month - 1, date.end.day);
            const rangeDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1;
  
            // Create an array of <lms-calendar-entry> elements for each day the entry spans
            const entries = [];
            for (let i = 0; i < rangeDays; i++) {
              // Calculate the start and end date for the current entry
              const currentStartDate = new Date(startDate.getTime() + i * (1000 * 3600 * 24));
              const currentEndDate = new Date(currentStartDate.getTime() + (1000 * 3600 * 24) - 1);
  
              // Create the entry object for the current day
              const currentEntry = {
                date: {
                  start: {
                    day: currentStartDate.getDate(),
                    month: currentStartDate.getMonth() + 1,
                    year: currentStartDate.getFullYear(),
                  },
                  end: {
                    day: currentEndDate.getDate(),
                    month: currentEndDate.getMonth() + 1,
                    year: currentEndDate.getFullYear(),
                  },
                },
                time,
                heading,
                color,
              };
  
              // Add the <lms-calendar-entry> element to the array
              entries.push(html`
                <style>
                  lms-calendar-entry.${`_${index}`} {
                    --entry-br: ${rangeDays > 1 ? 0 : `var(--border-radius-sm)`};
                    --entry-m: 0 ${i !== 0 ? 0 : `0.25em`} 0 ${i !== 0 ? 0 : `1.5em`};
                    --entry-bc: ${background};
                    --entry-c: ${text};
                  }
                </style>
                <lms-calendar-entry
                  class=${`_${index}`}
                  slot="${currentEntry.date.start.year}-${currentEntry.date.start.month}-${currentEntry.date.start.day}"
                  .time=${currentEntry.time}
                  .heading=${rangeDays > 1 && i > 0 ? '' : currentEntry.heading}
                  .isContinuation=${rangeDays > 1 && i > 0 ? '' : true}
                >
                </lms-calendar-entry>
              `);
            }
  
            // Return the array of <lms-calendar-entry> elements
            return entries;
          })}`
      : html``;
  }

  _getEntriesByDate() {
    if (isEmptyObjectOrUndefined(this._expandedDate)) {
      return;
    }
    const entriesByDate = this.entries.filter((entry) => {
      return haveSameValues(entry.date.start, this._expandedDate || {});
    });

    const grading = getSortedGradingsByIndex(
      !isEmptyObjectOrUndefined(entriesByDate)
        ? getOverlappingEntitiesIndices(
            this._getPartitionedSlottedItems(entriesByDate)
          )
        : []
    );

    return entriesByDate.map(({time, heading, content, color}, index) => {
      const [background, text] = getColorTextWithContrast(color);
      return html`
        <style>
          lms-calendar-entry.${`_${index}`} {
            --start-slot: ${this._getGridSlotByTime(time)};
            --entry-w: ${this._getWidthByGroupSize({grading, index})}%;
            --entry-m: 0 1.5em 0 ${this._getOffsetByDepth({grading, index})}%;
            --entry-bc: ${background};
            --entry-c: ${text};
          }
        </style>
        <lms-calendar-entry
          class=${`_${index}`}
          slot=${time.start.hours}
          .time=${time}
          .heading=${heading}
          .content=${content}
        >
        </lms-calendar-entry>
      `;
    });
  }

  _getGridSlotByTime({start, end}: CalendarTimeInterval) {
    const startRow = start.hours * 60 + (start.minutes + 1);
    return `${startRow}/${
      startRow + (end.hours * 60 + end.minutes - startRow)
    }`;
  }

  _getWidthByGroupSize({grading, index}: {grading: Grading[]; index: number}) {
    return (
      100 / grading.filter((item) => item.group === grading[index].group).length
    );
  }

  _getOffsetByDepth({grading, index}: {grading: Grading[]; index: number}) {
    return grading[index].depth === 0
      ? 0
      : grading[index].depth *
          (100 /
            grading.filter((item) => item.group === grading[index].group)
              .length);
  }

  _getPartitionedSlottedItems(items: CalendarEntry[]) {
    return partitionOverlappingIntervals(
      items
        .map((entry: CalendarEntry) =>
          this._getGridSlotByTime(entry.time)
            .replace(/[^0-9/]+/g, '')
            .split('/')
        )
        .map(([start, end]) => [parseInt(start, 10), parseInt(end, 10)])
        .map(([start, end]) => ({start, end}))
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lms-calendar': LMSCalendar;
  }

  interface CalendarDate {
    day: number;
    month: number;
    year: number;
  }

  interface CalendarDateInterval {
    start: CalendarDate;
    end: CalendarDate;
  }

  interface CalendarTime {
    hours: number;
    minutes: number;
  }

  interface CalendarTimeInterval {
    start: CalendarTime;
    end: CalendarTime;
  }

  interface CalendarEntry {
    date: CalendarDateInterval;
    time: CalendarTimeInterval;
    heading: string;
    content: string;
    color: string;
  }

  interface Interval {
    start: number;
    end: number;
  }

  interface Grading {
    index: number;
    depth: number;
    group: number;
  }

  interface Partition {
    index: number | undefined;
    depth: number | undefined;
    group: number | undefined;
    start: number;
    end: number;
  }
}
