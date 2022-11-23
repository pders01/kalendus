import { LitElement, css, html } from 'lit';
import localize from '../localization/localize';
import getDateByMonthInDirection from './utils/getDateByMonthInDirection';

export default class Body extends LitElement {
  static properties = {
    activeDate: {},
  };

  static styles = css`
    .month {
      /* There has to be a way to make this dynamic with just CSS
         Currently we add the heights of Header and Context and sub
         it from 100% of the parent container. */
      height: calc(100% - 95px);
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
      overflow-y: scroll;
    }

    .indicator {
      position: sticky;
      top: 0.25em;
      text-align: right;
      padding: 0 0.25em;
      text-align: left;
    }
  `;

  constructor() {
    super();

    this.activeDate = {};
  }

  getDaysInMonth(date) {
    /** Important note: Passing 0 as the date shifts the
     *  months indices by positive 1, so 1-12 */
    return new Date(date.year, date.month, 0).getDate();
  }

  getOffsetOfFirstDayInMonth(date) {
    const offset = new Date(`${date.year}-${date.month}-01`).getDay() - 1;
    return offset === -1 ? 6 : offset;
  }

  getDatesInMonthAsArray(date, sliceArgs) {
    return [
      ...Array.from(Array(this.getDaysInMonth(date)).keys(), (_, n) => ({
        year: date.year,
        month: date.month,
        day: n + 1,
      })).slice(...sliceArgs),
    ];
  }

  render() {
    const previousMonth = this.getDatesInMonthAsArray(
      getDateByMonthInDirection(this.activeDate, 'previous'),
      this.getOffsetOfFirstDayInMonth(this.activeDate)
        ? [this.getOffsetOfFirstDayInMonth(this.activeDate) * -1]
        : [-0, -0]
    );
    const activeMonth = this.getDatesInMonthAsArray(
      this.activeDate,
      []
    );
    const nextMonth = this.getDatesInMonthAsArray(
      getDateByMonthInDirection(this.activeDate, 'previous'),
      [0, 42 - (previousMonth.length + activeMonth.length)]
    );

    const calendar = previousMonth.concat(activeMonth, nextMonth);

    return html`
      <div class="month">
        ${calendar.map(
          ({ year, month, day }) =>
            html`<div class="day">
              <div class="indicator">
                ${day === 1
                  ? `${day}. ${localize({
                    locale: window.navigator.language,
                    topic: 'months',
                    string: month,
                  })}`
                  : day}
              </div>
              <slot name="${year}-${month}-${day}"></slot>
            </div>`
        )}
      </div>
    `;
  }
}
