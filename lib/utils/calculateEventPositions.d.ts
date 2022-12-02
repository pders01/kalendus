export default function calculateEventPositions(events: Array<{
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
    time: {
        start: {
            hours: number;
            minutes: number;
        };
        end: {
            hours: number;
            minutes: number;
        };
    };
    heading: string;
    content: string;
    color: string;
}>): {
    height: number;
    top: number;
    zIndex: number;
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
    time: {
        start: {
            hours: number;
            minutes: number;
        };
        end: {
            hours: number;
            minutes: number;
        };
    };
    heading: string;
    content: string;
    color: string;
}[];
//# sourceMappingURL=calculateEventPositions.d.ts.map