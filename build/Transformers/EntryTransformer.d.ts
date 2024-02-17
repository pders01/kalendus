export default class EntryTransformer {
    private readonly entry;
    private readonly startDate;
    private readonly index;
    currentStartDate: Date;
    currentEndDate: Date;
    constructor(entry: CalendarEntry, startDate: Date, index: number);
    getEntry(): {
        date: {
            start: {
                day: number;
                month: number;
                year: number;
            };
            end: {
                day: number;
                month: number;
                year: number;
            };
        };
        time: CalendarTimeInterval;
        heading: string;
        content: string;
        color: string;
    };
}
//# sourceMappingURL=EntryTransformer.d.ts.map
