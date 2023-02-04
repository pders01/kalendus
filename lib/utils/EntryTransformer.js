export default class EntryTransformer {
    constructor(entry, startDate, index) {
        this.entry = entry;
        this.startDate = startDate;
        this.index = index;
        this.entry = entry;
        this.startDate = startDate;
        this.currentStartDate = new Date(this.startDate.getTime() + this.index * (1000 * 3600 * 24));
        this.currentEndDate = new Date(this.currentStartDate.getTime() + 1000 * 3600 * 24 - 1);
    }
    getEntry() {
        return {
            ...this.entry,
            date: {
                start: {
                    day: this.currentStartDate.getDate(),
                    month: this.currentStartDate.getMonth() + 1,
                    year: this.currentStartDate.getFullYear(),
                },
                end: {
                    day: this.currentEndDate.getDate(),
                    month: this.currentEndDate.getMonth() + 1,
                    year: this.currentEndDate.getFullYear(),
                },
            },
        };
    }
}
//# sourceMappingURL=EntryTransformer.js.map