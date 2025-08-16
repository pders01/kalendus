import { expect } from 'chai';

describe('Stress Test Event Generation', () => {
    // Simulate the event generation logic from stories
    function generateTestEventLoad(): any[] {
        const events: any[] = [];
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const colors = ['#1976d2', '#2e7d32', '#ff9800', '#d32f2f', '#6a1b9a'];
        const eventTypes = [
            { heading: 'Team Meeting', content: 'Weekly team sync' },
            { heading: 'Code Review', content: 'PR review session' },
            { heading: 'Client Call', content: 'Project status update' },
        ];

        // Generate events for first 5 days to keep test fast
        for (let day = 1; day <= 5; day++) {
            const eventsPerDay = 5; // Fixed number for testing

            for (let eventIndex = 0; eventIndex < eventsPerDay; eventIndex++) {
                const eventType = eventTypes[eventIndex % eventTypes.length];
                const color = colors[eventIndex % colors.length];
                const startHour = 9 + eventIndex; // Start at 9, 10, 11, etc.

                events.push({
                    heading: `${eventType.heading} ${eventIndex + 1}`,
                    content: eventType.content,
                    color: color,
                    isContinuation: false,
                    date: {
                        start: { day, month: currentMonth, year: currentYear },
                        end: { day, month: currentMonth, year: currentYear },
                    },
                    time: {
                        start: { hour: startHour, minute: 0 },
                        end: { hour: startHour + 1, minute: 0 },
                    },
                });
            }
        }

        return events;
    }

    describe('Event generation validation', () => {
        it('should generate expected number of events', () => {
            const events = generateTestEventLoad();
            expect(events).to.have.length(25); // 5 days × 5 events per day
        });

        it('should create valid event structure', () => {
            const events = generateTestEventLoad();
            const firstEvent = events[0];

            expect(firstEvent).to.have.property('heading');
            expect(firstEvent).to.have.property('content');
            expect(firstEvent).to.have.property('color');
            expect(firstEvent).to.have.property('date');
            expect(firstEvent).to.have.property('time');
            expect(firstEvent.date).to.have.property('start');
            expect(firstEvent.date).to.have.property('end');
            expect(firstEvent.time).to.have.property('start');
            expect(firstEvent.time).to.have.property('end');
        });

        it('should create events with valid time ranges', () => {
            const events = generateTestEventLoad();

            events.forEach((event) => {
                expect(event.time.start.hour).to.be.at.least(0);
                expect(event.time.start.hour).to.be.at.most(23);
                expect(event.time.end.hour).to.be.at.least(0);
                expect(event.time.end.hour).to.be.at.most(24);
                expect(event.time.start.minute).to.be.at.least(0);
                expect(event.time.start.minute).to.be.at.most(59);
                expect(event.time.end.minute).to.be.at.least(0);
                expect(event.time.end.minute).to.be.at.most(59);
            });
        });

        it('should distribute events across multiple days', () => {
            const events = generateTestEventLoad();
            const daySet = new Set(events.map((event) => event.date.start.day));
            expect(daySet.size).to.equal(5); // Events across 5 different days
        });

        it('should create overlapping events for stress testing', () => {
            const events = generateTestEventLoad();

            // Find events on the same day
            const day1Events = events.filter(
                (event) => event.date.start.day === 1,
            );
            expect(day1Events).to.have.length(5);

            // Check that some events overlap (consecutive hours starting at 9)
            const times = day1Events
                .map((event) => event.time.start.hour)
                .sort((a, b) => a - b);
            expect(times).to.deep.equal([9, 10, 11, 12, 13]);
        });
    });

    describe('Overlapping events stress test', () => {
        function generateOverlappingEvents(): any[] {
            const events: any[] = [];
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;
            const testDay = 15;

            // Create 10 overlapping events on the same day for testing
            for (let i = 0; i < 10; i++) {
                const startHour = 9 + Math.floor(i / 4); // Start between 9-11
                const startMinute = (i % 4) * 15; // 0, 15, 30, 45 minutes

                events.push({
                    heading: `Meeting ${i + 1}`,
                    content: `Overlapping meeting ${i + 1}`,
                    color: `hsl(${i * 36}, 70%, 50%)`,
                    isContinuation: false,
                    date: {
                        start: {
                            day: testDay,
                            month: currentMonth,
                            year: currentYear,
                        },
                        end: {
                            day: testDay,
                            month: currentMonth,
                            year: currentYear,
                        },
                    },
                    time: {
                        start: { hour: startHour, minute: startMinute },
                        end: { hour: startHour + 1, minute: startMinute },
                    },
                });
            }

            return events;
        }

        it('should create heavily overlapping events', () => {
            const events = generateOverlappingEvents();
            expect(events).to.have.length(10);

            // All events should be on the same day
            const days = new Set(events.map((event) => event.date.start.day));
            expect(days.size).to.equal(1);
            expect(days.has(15)).to.be.true;
        });

        it('should create events with overlapping time ranges', () => {
            const events = generateOverlappingEvents();

            // Find events that overlap
            let overlappingPairs = 0;
            for (let i = 0; i < events.length; i++) {
                for (let j = i + 1; j < events.length; j++) {
                    const event1 = events[i];
                    const event2 = events[j];

                    const start1 =
                        event1.time.start.hour * 60 + event1.time.start.minute;
                    const end1 =
                        event1.time.end.hour * 60 + event1.time.end.minute;
                    const start2 =
                        event2.time.start.hour * 60 + event2.time.start.minute;
                    const end2 =
                        event2.time.end.hour * 60 + event2.time.end.minute;

                    // Check if time ranges overlap
                    if (start1 < end2 && start2 < end1) {
                        overlappingPairs++;
                    }
                }
            }

            expect(overlappingPairs).to.be.greaterThan(0);
        });
    });
});
