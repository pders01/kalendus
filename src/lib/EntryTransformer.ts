export default class EntryTransformer {
    currentStartDate: Date;
    currentEndDate: Date;
    constructor(
        private readonly entry: CalendarEntry,
        private readonly startDate: Date,
        private readonly index: number,
    ) {
        this.entry = entry;
        this.startDate = startDate;
        this.currentStartDate = new Date(
            this.startDate.getTime() + this.index * (1000 * 3600 * 24),
        );
        this.currentEndDate = new Date(
            this.currentStartDate.getTime() + 1000 * 3600 * 24 - 1,
        );
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
