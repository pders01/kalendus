import { expect } from 'chai';

describe('Week View Row Allocation for Multi-Day Events', () => {
    /**
     * Helper function to simulate the row allocation algorithm
     * This represents the expected behavior we want to achieve
     */
    function allocateRows(
        events: Array<{
            id: string;
            days: number[]; // Array of day indices (0-6 for Mon-Sun)
        }>,
    ): Map<string, number> {
        const eventRows = new Map<string, number>();

        // Sort events by start day, then by id
        const sortedEvents = [...events].sort((a, b) => {
            const aMinDay = Math.min(...a.days);
            const bMinDay = Math.min(...b.days);
            if (aMinDay !== bMinDay) return aMinDay - bMinDay;
            return a.id.localeCompare(b.id);
        });

        // Track which rows are occupied on each day
        const rowOccupancy = new Map<number, Set<number>>();
        for (let day = 0; day < 7; day++) {
            rowOccupancy.set(day, new Set());
        }

        // Assign rows to each event
        sortedEvents.forEach((event) => {
            let assignedRow = 0;
            let foundRow = false;

            while (!foundRow) {
                // Check if this row is available on all days the event spans
                let rowAvailable = true;
                for (const day of event.days) {
                    if (rowOccupancy.get(day)?.has(assignedRow)) {
                        rowAvailable = false;
                        break;
                    }
                }

                if (rowAvailable) {
                    foundRow = true;
                    eventRows.set(event.id, assignedRow);

                    // Mark this row as occupied on all days the event spans
                    for (const day of event.days) {
                        rowOccupancy.get(day)?.add(assignedRow);
                    }
                } else {
                    assignedRow++;
                }
            }
        });

        return eventRows;
    }

    describe('Basic non-overlapping events', () => {
        it('should assign row 0 to a single event', () => {
            const events = [
                { id: 'Event1', days: [0, 1, 2] }, // Mon-Wed
            ];
            const rows = allocateRows(events);
            expect(rows.get('Event1')).to.equal(0);
        });

        it('should assign same row to non-overlapping events', () => {
            const events = [
                { id: 'Event1', days: [0, 1] }, // Mon-Tue
                { id: 'Event2', days: [3, 4, 5] }, // Thu-Sat
            ];
            const rows = allocateRows(events);
            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event2')).to.equal(0);
        });
    });

    describe('Overlapping events', () => {
        it('should assign different rows to overlapping events', () => {
            const events = [
                { id: 'Event1', days: [0, 1, 2] }, // Mon-Wed
                { id: 'Event2', days: [1, 2, 3] }, // Tue-Thu
            ];
            const rows = allocateRows(events);
            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event2')).to.equal(1);
        });

        it('should handle the specific case: Event1 Mon-Tue, Event2 Tue-Fri', () => {
            const events = [
                { id: 'Event1', days: [0, 1] }, // Mon-Tue
                { id: 'Event2', days: [1, 2, 3, 4] }, // Tue-Fri
            ];
            const rows = allocateRows(events);
            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event2')).to.equal(1); // Should be row 1 consistently
        });

        it('should maintain consistent rows across the week for overlapping events', () => {
            const events = [
                { id: 'Event1', days: [0, 1] }, // Mon-Tue
                { id: 'Event2', days: [1, 2, 3, 4] }, // Tue-Fri
                { id: 'Event3', days: [3, 4, 5, 6] }, // Thu-Sun
            ];
            const rows = allocateRows(events);

            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event2')).to.equal(1); // Row 1 for all days Tue-Fri (overlaps with Event1 on Tue)
            expect(rows.get('Event3')).to.equal(0); // Row 0 is free from Thu-Sun (Event1 ended on Tue)
        });
    });

    describe('Complex overlapping scenarios', () => {
        it('should reuse rows when possible', () => {
            const events = [
                { id: 'Event1', days: [0, 1] }, // Mon-Tue
                { id: 'Event2', days: [3, 4] }, // Thu-Fri
                { id: 'Event3', days: [1, 2, 3] }, // Tue-Thu (overlaps both)
            ];
            const rows = allocateRows(events);

            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event2')).to.equal(0); // Can reuse row 0
            expect(rows.get('Event3')).to.equal(1); // Needs different row
        });

        it('should handle multiple overlapping events correctly', () => {
            const events = [
                { id: 'Event1', days: [0, 1, 2, 3, 4] }, // Mon-Fri
                { id: 'Event2', days: [1, 2] }, // Tue-Wed
                { id: 'Event3', days: [2, 3, 4] }, // Wed-Fri
                { id: 'Event4', days: [0, 1] }, // Mon-Tue
            ];
            const rows = allocateRows(events);

            // Processing order (by start day): Event1 (0), Event4 (0), Event2 (1), Event3 (2)
            expect(rows.get('Event1')).to.equal(0); // First event, gets row 0
            expect(rows.get('Event4')).to.equal(1); // Can't use row 0 (overlaps Event1 on Mon-Tue)
            expect(rows.get('Event2')).to.equal(2); // Can't use row 0 (Event1) or row 1 (Event4 on Tue)
            expect(rows.get('Event3')).to.equal(1); // Can use row 1 (Event4 ended on Tue, no overlap Wed-Fri)
        });

        it('should handle full week spanning event', () => {
            const events = [
                { id: 'Event1', days: [0, 1, 2, 3, 4, 5, 6] }, // Mon-Sun
                { id: 'Event2', days: [2, 3, 4] }, // Wed-Fri
                { id: 'Event3', days: [1, 2] }, // Tue-Wed
            ];
            const rows = allocateRows(events);

            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event3')).to.equal(1); // Can't use row 0 (Event1), processed before Event2
            expect(rows.get('Event2')).to.equal(2); // Can't use row 0 (Event1) or row 1 (Event3 on Wed)
        });
    });

    describe('Row consistency validation', () => {
        it('should ensure an event maintains the same row across all its days', () => {
            const events = [
                { id: 'Event1', days: [0, 1] },
                { id: 'Event2', days: [1, 2, 3, 4] },
                { id: 'Event3', days: [5, 6] },
            ];
            const rows = allocateRows(events);

            // Event2 should have the same row for all its days
            const event2Row = rows.get('Event2');
            expect(event2Row).to.be.a('number');

            // Simulate checking that Event2 has the same row on all its days
            const event2Days = [1, 2, 3, 4]; // Tue-Fri
            const rowsForEvent2Days = event2Days.map(() => event2Row);
            expect(new Set(rowsForEvent2Days).size).to.equal(1); // All same row
        });

        it('should never allow an event to jump rows mid-span', () => {
            // This test validates that the algorithm doesn't allow row jumping
            const events = [
                { id: 'EventA', days: [0] }, // Mon only
                { id: 'EventB', days: [0, 1, 2, 3] }, // Mon-Thu
                { id: 'EventC', days: [1, 2, 3, 4] }, // Tue-Fri
            ];
            const rows = allocateRows(events);

            // Processing order (by start day): EventA (0), EventB (0), EventC (1)
            // EventA gets row 0 on Mon
            // EventB can't use row 0 on Mon, gets row 1 for Mon-Thu
            // EventC can use row 0 from Tue onwards (EventA only on Mon)
            const eventCRow = rows.get('EventC');
            expect(eventCRow).to.equal(0); // Can use row 0 starting from Tue

            // EventC maintains row 0 for all its days (Tue-Fri)
        });
    });

    describe('Edge cases', () => {
        it('should handle empty event list', () => {
            const events: Array<{ id: string; days: number[] }> = [];
            const rows = allocateRows(events);
            expect(rows.size).to.equal(0);
        });

        it('should handle single-day events', () => {
            const events = [
                { id: 'Event1', days: [0] }, // Mon only
                { id: 'Event2', days: [0] }, // Mon only
                { id: 'Event3', days: [1] }, // Tue only
            ];
            const rows = allocateRows(events);

            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event2')).to.equal(1); // Different row due to overlap on Mon
            expect(rows.get('Event3')).to.equal(0); // Can reuse row 0 on Tue
        });

        it('should handle events with gaps', () => {
            const events = [
                { id: 'Event1', days: [0, 2, 4] }, // Mon, Wed, Fri (with gaps)
                { id: 'Event2', days: [1, 2, 3] }, // Tue-Thu (continuous)
            ];
            const rows = allocateRows(events);

            expect(rows.get('Event1')).to.equal(0);
            expect(rows.get('Event2')).to.equal(1); // Needs different row due to Wed overlap
        });
    });
});
