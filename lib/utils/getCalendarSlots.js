export default function getCalendarSlots(events) {
    // First, sort the events by start time
    events.sort((a, b) => {
        const aStart = a.time.start.hours * 60 + a.time.start.minutes;
        const bStart = b.time.start.hours * 60 + b.time.start.minutes;
        return aStart - bStart;
    });
    // Initialize the slots array with empty slots for each minute of the day
    const slots = [];
    for (let i = 0; i < 24 * 60; i++) {
        slots[i] = [];
    }
    // Go through the events and slot them into the slots array
    for (const event of events) {
        const start = event.time.start.hours * 60 + event.time.start.minutes;
        const end = event.time.end.hours * 60 + event.time.end.minutes;
        for (let i = start; i < end; i++) {
            slots[i].push(event);
        }
    }
    // Go through the slots and calculate the overlaps and margins for each event
    for (const slot of slots) {
        // First, sort the events in the slot by their starting time
        slot.sort((a, b) => {
            const aStart = a.time.start.hours * 60 + a.time.start.minutes;
            const bStart = b.time.start.hours * 60 + b.time.start.minutes;
            return aStart - bStart;
        });
        // Then, go through the events in the slot and calculate the overlap and margin for each one
        for (let i = 0; i < slot.length; i++) {
            const event = slot[i];
            let overlap = 0;
            let margin = 0;
            for (let j = 0; j < i; j++) {
                if (slot[j].time.end.hours === event.time.end.hours &&
                    slot[j].time.end.minutes === event.time.end.minutes) {
                    overlap++;
                    margin += (100 / (overlap + 1));
                }
            }
            event.overlap = overlap;
            event.margin = margin;
        }
    }
    return events;
}
//# sourceMappingURL=getCalendarSlots.js.map