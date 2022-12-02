export default function calculateEventPositions(events) {
    // Sort events by start time
    events.sort((a, b) => {
        const startA = a.time.start.hours * 60 + a.time.start.minutes;
        const startB = b.time.start.hours * 60 + b.time.start.minutes;
        return startA - startB;
    });
    // Calculate height, top, and zIndex for each event
    return events.map((event, index) => {
        // Start with a height of 100%, a top of 0, and a z-index of 0
        let height = 1;
        let top = 0;
        let zIndex = 0;
        // Loop through all previous events and check for overlap
        for (let i = 0; i < index; i++) {
            const otherEvent = events[i];
            const start = event.time.start.hours * 60 + event.time.start.minutes;
            const end = event.time.end.hours * 60 + event.time.end.minutes;
            const otherStart = otherEvent.time.start.hours * 60 + otherEvent.time.start.minutes;
            const otherEnd = otherEvent.time.end.hours * 60 + otherEvent.time.end.minutes;
            // If the two events overlap, reduce the height and increase the top and z-index
            if (start < otherEnd && end > otherStart) {
                height -= 0.2;
                top += 0.1;
                zIndex += 1;
            }
        }
        return {
            ...event,
            height,
            top,
            zIndex,
        };
    });
}
//# sourceMappingURL=calculateEventPositions.js.map