export default class DateTransformer {
    constructor({ date, direction = undefined, }) {
        this.date = date;
        this.direction = direction;
    }
    set _date(date) {
        this.date = date;
    }
    set _direction(direction) {
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
            const newDate = new Date(this.date.year, this.date.month - 1, this.date.day - 1);
            return {
                day: newDate.getDate(),
                month: newDate.getMonth() + 1,
                year: newDate.getFullYear(),
            };
        }
        if (this.direction === 'next') {
            const newDate = new Date(this.date.year, this.date.month - 1, this.date.day + 1);
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
                ? { ...this.date, year: this.date.year - 1, month: 12 }
                : { ...this.date, month: this.date.month - 1 };
        }
        if (this.direction === 'next') {
            return this.date.month + 1 === 13
                ? { ...this.date, year: this.date.year + 1, month: 1 }
                : { ...this.date, month: this.date.month + 1 };
        }
        return this.date;
    }
}
//# sourceMappingURL=DateTransformer.js.map