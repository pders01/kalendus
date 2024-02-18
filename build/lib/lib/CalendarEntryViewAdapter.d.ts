export default class CalendarEntryViewAdapter {
    private readonly entry;
    private readonly startDate;
    private readonly index;
    private currentStartDate;
    private currentEndDate;
    constructor(entry: Partial<CalendarEntry>, startDate: Date, index: number);
    getEntry(): {
        date: {
            start:
                | Record<import('luxon')._ToObjectUnit, number>
                | Partial<Record<import('luxon')._ToObjectUnit, number>>;
            end:
                | Record<import('luxon')._ToObjectUnit, number>
                | Partial<Record<import('luxon')._ToObjectUnit, number>>;
        };
        time?: CalendarTimeInterval | undefined;
        heading?: string | undefined;
        content?: string | undefined;
        color?: string | undefined;
    };
}
//# sourceMappingURL=CalendarEntryViewAdapter.d.ts.map
