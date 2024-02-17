import { DateTime } from 'luxon';

export default class CalendarEntryViewAdapter {
    private readonly entry: CalendarEntry;

    private readonly startDate: DateTime;

    private readonly index: number;

    private currentStartDate: DateTime;

    private currentEndDate: DateTime;

    constructor(entry: CalendarEntry, startDate: Date, index: number) {
        this.entry = entry;
        this.startDate = DateTime.fromJSDate(startDate);
        this.index = index;

        this.currentStartDate = this.startDate.plus({ days: this.index });
        this.currentEndDate = this.currentStartDate
            .plus({ days: 1 })
            .minus({ seconds: 1 });
    }

    public getEntry() {
        return {
            ...this.entry,
            date: {
                start: this.currentStartDate.toObject(),
                end: this.currentEndDate.toObject(),
            },
        };
    }
}
