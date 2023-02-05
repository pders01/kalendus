export default class DateTransformer {
  date: CalendarDate | undefined;
  direction: string | undefined;
  constructor({
    date,
    direction = undefined,
  }: {
    date?: CalendarDate;
    direction?: string;
  }) {
    this.date = date;
    this.direction = direction;
  }

  set _date(date: CalendarDate) {
    this.date = date;
  }

  set _direction(direction: string | undefined) {
    this.direction = direction;
  }

  getDateByDayInDirection() {
    if (!this.date) {
      throw Error('Date is not defined.');
    }
    if (!this.direction) {
      throw Error('Direction is not defined.');
    }

    if (this.direction === 'previous') {
      const newDate = new Date(
        this.date.year,
        this.date.month - 1,
        this.date.day - 1
      );
      return {
        day: newDate.getDate(),
        month: newDate.getMonth() + 1,
        year: newDate.getFullYear(),
      };
    }

    if (this.direction === 'next') {
      const newDate = new Date(
        this.date.year,
        this.date.month - 1,
        this.date.day + 1
      );
      return {
        day: newDate.getDate(),
        month: newDate.getMonth() + 1,
        year: newDate.getFullYear(),
      };
    }

    return this.date;
  }

  getDateByMonthInDirection() {
    if (!this.date) {
      throw Error('Date is not defined.');
    }
    if (!this.direction) {
      throw Error('Direction is not defined.');
    }

    if (this.direction === 'previous') {
      return this.date.month - 1 === 0
        ? {...this.date, year: this.date.year - 1, month: 12}
        : {...this.date, month: this.date.month - 1};
    }

    if (this.direction === 'next') {
      return this.date.month + 1 === 13
        ? {...this.date, year: this.date.year + 1, month: 1}
        : {...this.date, month: this.date.month + 1};
    }

    return this.date;
  }
}
