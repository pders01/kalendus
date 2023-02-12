var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './components/Header.js';
import './components/Month.js';
import './components/Day.js';
import './components/Context.js';
import './components/Entry.js';
import isEmptyObjectOrUndefined from './utils/isEmptyObjectOrUndefined.js';
import getColorTextWithContrast from './utils/getColorTextWithContrast.js';
import partitionOverlappingIntervals from './utils/partitionOverlappingIntervals.js';
import getOverlappingEntitiesIndices from './utils/getOverlappingEntitiesIndices.js';
import haveSameValues from './utils/haveSameValues.js';
import getSortedGradingsByIndex from './utils/getSortedGradingsByIndex.js';
import EntryTransformer from './lib/EntryTransformer.js';
import DateTransformer from './lib/DateTransformer.js';
let LMSCalendar = class LMSCalendar extends LitElement {
    constructor() {
        super(...arguments);
        this.heading = '';
        this.activeDate = {
            day: 1,
            month: 1,
            year: 2022,
        };
        this.entries = [];
        this.color = '#000000';
        this._viewportWidth = window.innerWidth;
    }
    render() {
        return html `
      <div>
        <lms-calendar-header
          @switchdate=${this._handleSwitchDate}
          @switchview=${this._handleSwitchView}
          .heading=${this.heading}
          .activeDate=${this.activeDate}
          .expandedDate=${this._expandedDate}
        >
        </lms-calendar-header>

        <lms-calendar-context
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
    _handleSwitchDate(e) {
        const dateTransformer = new DateTransformer({});
        dateTransformer._direction = e.detail.direction;
        if (this._expandedDate) {
            dateTransformer._date = this._expandedDate;
            const dateInDirection = dateTransformer.getDateByDayInDirection();
            this._expandedDate = dateInDirection;
            this.activeDate = dateInDirection;
            return;
        }
        dateTransformer._date = this.activeDate;
        this.activeDate = dateTransformer.getDateByMonthInDirection();
    }
    _handleSwitchView(e) {
        var _a;
        if (e.detail.view === 'day') {
            this._expandedDate = !isEmptyObjectOrUndefined(this._expandedDate)
                ? this._expandedDate
                : this.activeDate;
        }
        if (e.detail.view === 'month') {
            this.activeDate = (_a = this._expandedDate) !== null && _a !== void 0 ? _a : this.activeDate;
            this._expandedDate = undefined;
        }
    }
    _handleExpand(e) {
        this._expandedDate = e.detail.date;
    }
    _getEntries() {
        if (this.entries.length) {
            const chronologicalEntries = this.entries.sort((a, b) => a.time.start.hours - b.time.start.hours ||
                a.time.start.minutes - b.time.start.minutes);
            const entriesTemplateResults = chronologicalEntries.map(({ date, time, heading, color }, index) => {
                const [background, text] = getColorTextWithContrast(color);
                const [startDate, , rangeDays] = this._getDaysRange(date);
                /** Create an array of <lms-calendar-entry> elements for each day the entry spans
                 *  and add them to the entries array. */
                const entries = [];
                for (let i = 0; i < rangeDays; i++) {
                    const currentEntry = new EntryTransformer({ date, time, heading, color, content: '' }, startDate, i).getEntry();
                    const isContinuation = i > 0 && rangeDays > 1;
                    const lmsCalendarEntry = html `
              <style>
                lms-calendar-entry.${`_${index}`} {
                  --entry-br: ${rangeDays > 1 ? 0 : `var(--border-radius-sm)`};
                  --entry-m: 0 ${i !== 0 ? 0 : `0.25em`} 0
                    ${i !== 0 ? 0 : `1.5em`};
                  --entry-bc: ${background};
                  --entry-c: ${text};
                }
              </style>
              <lms-calendar-entry
                class=${`_${index}`}
                slot="${currentEntry.date.start.year}-${currentEntry.date.start
                        .month}-${currentEntry.date.start.day}"
                .time=${currentEntry.time}
                .heading=${isContinuation ? '' : currentEntry.heading}
                .isContinuation=${isContinuation}
              >
              </lms-calendar-entry>
            `;
                    entries.push(lmsCalendarEntry);
                }
                return entries;
            });
            return entriesTemplateResults.flat();
        }
        return nothing;
    }
    _getEntriesByDate() {
        if (isEmptyObjectOrUndefined(this._expandedDate)) {
            return;
        }
        const entriesByDate = this.entries.filter((entry) => {
            return haveSameValues(entry.date.start, this._expandedDate || {});
        });
        const grading = getSortedGradingsByIndex(!isEmptyObjectOrUndefined(entriesByDate)
            ? getOverlappingEntitiesIndices(this._getPartitionedSlottedItems(entriesByDate))
            : []);
        return entriesByDate.map(({ time, heading, content, color }, index) => {
            const [background, text] = getColorTextWithContrast(color);
            return html `
        <style>
          lms-calendar-entry.${`_${index}`} {
            --start-slot: ${this._getGridSlotByTime(time)};
            --entry-w: ${this._getWidthByGroupSize({ grading, index })}%;
            --entry-m: 0 1.5em 0 ${this._getOffsetByDepth({ grading, index })}%;
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
    _getGridSlotByTime({ start, end }) {
        const startRow = start.hours * 60 + (start.minutes + 1);
        return `${startRow}/${startRow + (end.hours * 60 + end.minutes - startRow)}`;
    }
    _getWidthByGroupSize({ grading, index }) {
        return (100 / grading.filter((item) => item.group === grading[index].group).length);
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
        return partitionOverlappingIntervals(items
            .map((entry) => this._getGridSlotByTime(entry.time)
            .replace(/[^0-9/]+/g, '')
            .split('/'))
            .map(([start, end]) => [parseInt(start, 10), parseInt(end, 10)])
            .map(([start, end]) => ({ start, end })));
    }
    _getDaysRange(date) {
        const { start, end } = date;
        const startDate = new Date(start.year, start.month - 1, start.day);
        const endDate = new Date(end.year, end.month - 1, end.day);
        return [
            startDate,
            endDate,
            (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1,
        ];
    }
};
LMSCalendar.styles = css `
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
      background-color: #fff;
      border-radius: var(--border-radius-lg);
      border: 1px solid var(--separator-light);
      font-family: var(--system-ui);
      color: var(--separator-dark);
      box-shadow: var(--shadow-md);
    }
  `;
__decorate([
    property({ type: String })
], LMSCalendar.prototype, "heading", void 0);
__decorate([
    property({ type: Object })
], LMSCalendar.prototype, "activeDate", void 0);
__decorate([
    property({ type: Array })
], LMSCalendar.prototype, "entries", void 0);
__decorate([
    property({ type: String })
], LMSCalendar.prototype, "color", void 0);
__decorate([
    state()
], LMSCalendar.prototype, "_expandedDate", void 0);
__decorate([
    state()
], LMSCalendar.prototype, "_viewportWidth", void 0);
LMSCalendar = __decorate([
    customElement('lms-calendar')
], LMSCalendar);
export default LMSCalendar;
//# sourceMappingURL=lms-calendar.js.map