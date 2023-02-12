var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import DateTransformer from '../lib/DateTransformer';
import Translations from '../locales/Translations';
let Month = class Month extends LitElement {
    constructor() {
        super(...arguments);
        this.translations = new Translations();
    }
    render() {
        var _a;
        return Object.keys(this.activeDate || { day: 1, month: 1, year: 2022 })
            .length !== 0
            ? html `
          <div class="month">
            ${(_a = this._getCalendarArray()) === null || _a === void 0 ? void 0 : _a.map(({ year, month, day }) => html `<div
                  class="day"
                  data-date="${year}-${month}-${day}"
                  @click=${this._handleExpand}
                >
                  <div class="indicator">
                    ${day === 1
                ? `${day}. ${this.translations.getTranslation(month)}`
                : day}
                  </div>
                  <slot name="${year}-${month}-${day}"></slot>
                </div>`)}
          </div>
        `
            : html ``;
    }
    _handleExpand(e) {
        if (e.target === null) {
            return;
        }
        const target = e.target;
        const { date } = target.dataset;
        if (!date) {
            return;
        }
        const [year, month, day] = date
            .split('-')
            .map((field) => parseInt(field, 10));
        const event = new CustomEvent('expand', {
            detail: { date: { day, month, year } },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }
    _getDaysInMonth(date) {
        /** Important note: Passing 0 as the date shifts the
         *  months indices by positive 1, so 1-12 */
        return new Date(date.year, date.month, 0).getDate();
    }
    _getOffsetOfFirstDayInMonth(date) {
        const offset = new Date(`${date.year}-${date.month}-01`).getDay() - 1;
        return offset === -1 ? 6 : offset;
    }
    _getDatesInMonthAsArray(date, sliceArgs) {
        return [
            ...Array.from(Array(this._getDaysInMonth(date)).keys(), (_, n) => ({
                year: date.year,
                month: date.month,
                day: n + 1,
            })).slice(...sliceArgs),
        ];
    }
    _getCalendarArray() {
        if (!this.activeDate) {
            return;
        }
        const dateTransformer = new DateTransformer({
            date: this.activeDate || { day: 1, month: 1, year: 2022 },
        });
        dateTransformer._direction = 'previous';
        const previousMonth = this._getDatesInMonthAsArray(dateTransformer.getDateByMonthInDirection(), this._getOffsetOfFirstDayInMonth(this.activeDate)
            ? [this._getOffsetOfFirstDayInMonth(this.activeDate) * -1]
            : [-0, -0]);
        const activeMonth = this._getDatesInMonthAsArray(this.activeDate, []);
        dateTransformer._direction = 'next';
        const nextMonth = this._getDatesInMonthAsArray(dateTransformer.getDateByMonthInDirection(), [0, 42 - (previousMonth.length + activeMonth.length)]);
        return previousMonth.concat(activeMonth, nextMonth);
    }
};
Month.styles = css `
    .month {
      /* Header: 3.5em, Context: 2em, Border: 2px */
      height: calc(100% - 5.5em + 2px);
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      border-top: 1px solid var(--separator-light);
    }

    .month > div {
      border-bottom: 1px solid var(--separator-light);
      border-right: 1px solid var(--separator-light);
    }

    .month > div:nth-child(7n + 7) {
      border-right: none;
    }

    .month > div:nth-last-child(-n + 7) {
      border-bottom: none;
    }

    .day {
      width: 100%;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      gap: 1px;
    }

    .indicator {
      position: sticky;
      top: 0.25em;
      text-align: right;
      padding: 0 0.25em;
      margin-bottom: 0.25em;
      text-align: left;
    }
  `;
__decorate([
    property({ attribute: false })
], Month.prototype, "activeDate", void 0);
Month = __decorate([
    customElement('lms-calendar-month')
], Month);
export default Month;
//# sourceMappingURL=Month.js.map