import { LitElement, css, html } from 'lit';

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
    return new Date(date.year, date.month, 0).getDate();
  }

  getOffsetOfFirstDayInMonth(date) {
    const offset = new Date(`${date.year}-${date.month}-01`).getDay() - 1;
    return offset === -1 ? 6 : offset;
  }

  render() {
    const daysInMonth = this.getDaysInMonth(this.activeDate);
    const offset = this.getOffsetOfFirstDayInMonth(this.activeDate);
    const previousMonth = [
      ...Array.from(
        Array(
          this.getDaysInMonth({
            ...this.activeDate,
            month:
              this.activeDate.month - 1 === -1 ? 11 : this.activeDate.month - 1,
          })
        ).keys(),
        (_, x) => (x !== 0 ? x + 1 : `${x + 1}. ${this.activeDate.month - 1}`)
      ).slice(offset * -1),
    ];
    const activeMonth = [
      ...Array.from(Array(daysInMonth).keys(), (_, x) =>
        x !== 0 ? x + 1 : `${x + 1}. ${this.activeDate.month}`
      ),
    ];
    const nextMonth = [
      ...Array.from(
        Array(
          this.getDaysInMonth({
            ...this.activeDate,
            month: this.activeDate.month === 12 ? 0 : this.activeDate.month + 1,
          })
        ).keys(),
        (_, x) => (x !== 0 ? x + 1 : `${x + 1}. ${parseInt(this.activeDate.month, 10) + 1}`)
      ).slice(0, 42 - (previousMonth.length + activeMonth.length))
    ];

    console.log(nextMonth);

    const calendar = previousMonth.concat(activeMonth, nextMonth);

    // console.log(calendar);

    return html`
      <div class="month">
        ${calendar.map(
    (day) =>
      html`<div class="day"><div class="indicator">${day}</div></div>`
  )}
      </div>
    `;
  }
}
