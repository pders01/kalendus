export default class CalendarEntryViewAdapter {
    private readonly entry;
    private readonly startDate;
    private readonly index;
    private currentStartDate;
    private currentEndDate;
    constructor(entry: CalendarEntry, startDate: Date, index: number);
    getEntry(): {
        date: {
            start: Record<import("luxon")._ToObjectUnit, number> | Partial<Record<import("luxon")._ToObjectUnit, number>>;
            end: Record<import("luxon")._ToObjectUnit, number> | Partial<Record<import("luxon")._ToObjectUnit, number>>;
        };
        time: CalendarTimeInterval;
        heading: string;
        content: string;
        color: string;
    };
}
//# sourceMappingURL=CalendarEntryViewAdapter.d.ts.map