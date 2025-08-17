import { expect } from 'chai';
import { LayoutCalculator } from '../../src/lib/LayoutCalculator.js';

describe('LayoutCalculator', () => {
    let calculator: LayoutCalculator;

    beforeEach(() => {
        calculator = new LayoutCalculator();
    });

    describe('Single Events', () => {
        it('should give single event full width and position at origin', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Single Event',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#1976d2',
                },
            ];

            const layout = calculator.calculateLayout(events);
            const box = layout.boxes[0];

            expect(box.width).to.equal(
                100,
                'Single event should have 100% width',
            );
            expect(box.x).to.equal(
                0,
                'Single event should be positioned at x=0',
            );
            expect(box.depth).to.equal(0, 'Single event should have depth 0');
            expect(box.group).to.equal(0, 'Single event should be in group 0');
        });

        it('should handle multiple non-overlapping events', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Event 1',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Event 2',
                    startTime: { hour: 11, minute: 0 },
                    endTime: { hour: 12, minute: 0 },
                    color: '#388e3c',
                },
            ];

            const layout = calculator.calculateLayout(events);

            layout.boxes.forEach((box, index) => {
                expect(box.width).to.equal(
                    100,
                    `Non-overlapping event ${index} should have 100% width`,
                );
                expect(box.x).to.equal(
                    0,
                    `Non-overlapping event ${index} should be at x=0`,
                );
                expect(box.depth).to.equal(
                    0,
                    `Non-overlapping event ${index} should have depth 0`,
                );
                expect(box.group).to.equal(
                    index,
                    `Non-overlapping event ${index} should be in separate group`,
                );
            });
        });
    });

    describe('Overlapping Events', () => {
        it('should identify longest event as background in simple overlap', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Short Event',
                    startTime: { hour: 9, minute: 30 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Long Background Event',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 11, minute: 0 },
                    color: '#388e3c',
                },
            ];

            const layout = calculator.calculateLayout(events);

            // Find the background event (depth 0)
            const backgroundEvent = layout.boxes.find((box) => box.depth === 0);
            const overlappingEvent = layout.boxes.find((box) => box.depth > 0);

            expect(backgroundEvent).to.exist;
            expect(overlappingEvent).to.exist;
            expect(backgroundEvent!.id).to.equal(
                '2',
                'Longest event should be background',
            );
            expect(backgroundEvent!.width).to.equal(
                100,
                'Background event should have 100% width',
            );
            expect(backgroundEvent!.x).to.equal(
                0,
                'Background event should be at x=0',
            );
            expect(overlappingEvent!.width).to.be.lessThan(
                100,
                'Overlapping event should have reduced width',
            );
            expect(overlappingEvent!.x).to.be.greaterThan(
                0,
                'Overlapping event should be offset',
            );
        });

        it('should handle three overlapping events with correct background assignment', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Short Event A',
                    startTime: { hour: 9, minute: 30 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Medium Event B',
                    startTime: { hour: 9, minute: 15 },
                    endTime: { hour: 10, minute: 30 },
                    color: '#f57c00',
                },
                {
                    id: '3',
                    heading: 'Long Background Event C',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 11, minute: 0 },
                    color: '#388e3c',
                },
            ];

            const layout = calculator.calculateLayout(events);

            // All should be in same group
            const groups = new Set(layout.boxes.map((box) => box.group));
            expect(groups.size).to.equal(
                1,
                'All overlapping events should be in same group',
            );

            // Find background event (depth 0)
            const backgroundEvent = layout.boxes.find((box) => box.depth === 0);
            expect(backgroundEvent).to.exist;
            expect(backgroundEvent!.id).to.equal(
                '3',
                'Longest event should be background',
            );
            expect(backgroundEvent!.width).to.equal(
                100,
                'Background event should have 100% width',
            );
            expect(backgroundEvent!.x).to.equal(
                0,
                'Background event should be at x=0',
            );

            // Check that other events have cascading depths
            const depths = layout.boxes.map((box) => box.depth).sort();
            expect(depths).to.deep.equal(
                [0, 1, 2],
                'Should have depths 0, 1, 2',
            );
        });

        it('should handle partial overlaps correctly', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Event A',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 30 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Event B',
                    startTime: { hour: 10, minute: 0 },
                    endTime: { hour: 11, minute: 0 },
                    color: '#388e3c',
                },
                {
                    id: '3',
                    heading: 'Event C',
                    startTime: { hour: 10, minute: 45 },
                    endTime: { hour: 11, minute: 30 },
                    color: '#f57c00',
                },
            ];

            const layout = calculator.calculateLayout(events);

            // Events A and B overlap, B and C overlap, so all should be in same group
            const groups = new Set(layout.boxes.map((box) => box.group));
            expect(groups.size).to.equal(
                1,
                'All transitively overlapping events should be in same group',
            );

            // Find the longest event (A is 90 minutes, B is 60 minutes, C is 45 minutes)
            const backgroundEvent = layout.boxes.find((box) => box.depth === 0);
            expect(backgroundEvent).to.exist;
            expect(backgroundEvent!.id).to.equal(
                '1',
                'Event A (longest) should be background',
            );
            expect(backgroundEvent!.width).to.equal(
                100,
                'Background event should have 100% width',
            );
        });
    });

    describe('Complex Scenarios', () => {
        it('should handle dense overlapping scenario', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Sprint Planning',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Architecture Review',
                    startTime: { hour: 9, minute: 15 },
                    endTime: { hour: 10, minute: 15 },
                    color: '#388e3c',
                },
                {
                    id: '3',
                    heading: 'Bug Triage',
                    startTime: { hour: 9, minute: 30 },
                    endTime: { hour: 10, minute: 30 },
                    color: '#f57c00',
                },
                {
                    id: '4',
                    heading: 'Security Audit',
                    startTime: { hour: 9, minute: 45 },
                    endTime: { hour: 10, minute: 45 },
                    color: '#9c27b0',
                },
                {
                    id: '5',
                    heading: 'Performance Review',
                    startTime: { hour: 9, minute: 50 },
                    endTime: { hour: 10, minute: 50 },
                    color: '#ff5722',
                },
            ];

            const layout = calculator.calculateLayout(events);

            // All events have same duration (60 minutes), so first one should be background
            const backgroundEvent = layout.boxes.find((box) => box.depth === 0);
            expect(backgroundEvent).to.exist;
            expect(backgroundEvent!.width).to.equal(
                100,
                'Background event should have 100% width',
            );
            expect(backgroundEvent!.x).to.equal(
                0,
                'Background event should be at x=0',
            );

            // All should be in same group
            const groups = new Set(layout.boxes.map((box) => box.group));
            expect(groups.size).to.equal(
                1,
                'All overlapping events should be in same group',
            );

            // Should have unique depths 0-4
            const depths = layout.boxes.map((box) => box.depth).sort();
            expect(depths).to.deep.equal(
                [0, 1, 2, 3, 4],
                'Should have depths 0-4',
            );
        });

        it('should handle cascading overlaps with correct width allocation', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Workshop',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 12, minute: 0 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Standup',
                    startTime: { hour: 9, minute: 30 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#388e3c',
                },
                {
                    id: '3',
                    heading: 'Interview',
                    startTime: { hour: 10, minute: 15 },
                    endTime: { hour: 11, minute: 15 },
                    color: '#f57c00',
                },
                {
                    id: '4',
                    heading: 'Coffee',
                    startTime: { hour: 10, minute: 45 },
                    endTime: { hour: 11, minute: 0 },
                    color: '#9c27b0',
                },
            ];

            const layout = calculator.calculateLayout(events);

            // Workshop (3 hours) should be the background
            const backgroundEvent = layout.boxes.find((box) => box.depth === 0);
            expect(backgroundEvent).to.exist;
            expect(backgroundEvent!.id).to.equal(
                '1',
                'Workshop (longest) should be background',
            );
            expect(backgroundEvent!.width).to.equal(
                100,
                'Background event should have 100% width',
            );
            expect(backgroundEvent!.x).to.equal(
                0,
                'Background event should be at x=0',
            );

            // Check width allocation for overlapping events
            const overlappingEvents = layout.boxes.filter(
                (box) => box.depth > 0,
            );
            overlappingEvents.forEach((event) => {
                expect(event.width).to.be.at.least(
                    65,
                    'Overlapping events should have minimum 65% width',
                );
                expect(event.width).to.be.lessThan(
                    100,
                    'Overlapping events should have less than 100% width',
                );
                expect(event.x).to.be.greaterThan(
                    0,
                    'Overlapping events should be offset from left edge',
                );
            });
        });
    });

    describe('Z-Index Assignment', () => {
        it('should assign z-index based on depth (background behind, overlapping in front)', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Background',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 11, minute: 0 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Foreground',
                    startTime: { hour: 9, minute: 30 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#388e3c',
                },
            ];

            const layout = calculator.calculateLayout(events);

            const backgroundEvent = layout.boxes.find((box) => box.depth === 0);
            const foregroundEvent = layout.boxes.find((box) => box.depth > 0);

            expect(backgroundEvent).to.exist;
            expect(foregroundEvent).to.exist;
            expect(backgroundEvent!.zIndex).to.be.lessThan(
                foregroundEvent!.zIndex,
                'Background event should have lower z-index than foreground event',
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle events with same start and end times', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Event A',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#1976d2',
                },
                {
                    id: '2',
                    heading: 'Event B',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#388e3c',
                },
            ];

            const layout = calculator.calculateLayout(events);

            // Both events have same duration, so first one should be background
            const backgroundEvent = layout.boxes.find((box) => box.depth === 0);
            expect(backgroundEvent).to.exist;
            expect(backgroundEvent!.width).to.equal(
                100,
                'Background event should have 100% width',
            );

            // Both should be in same group
            const groups = new Set(layout.boxes.map((box) => box.group));
            expect(groups.size).to.equal(
                1,
                'Identical events should be in same group',
            );
        });

        it('should handle zero-duration events', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Zero Duration',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 9, minute: 0 },
                    color: '#1976d2',
                },
            ];

            const layout = calculator.calculateLayout(events);
            const box = layout.boxes[0];

            expect(box.width).to.equal(
                100,
                'Zero duration event should have 100% width',
            );
            expect(box.x).to.equal(0, 'Zero duration event should be at x=0');
            expect(box.depth).to.equal(
                0,
                'Zero duration event should have depth 0',
            );
        });
    });

    describe('Layout Validation', () => {
        it('should ensure all background events (depth 0) have 100% width', () => {
            // Test with multiple complex scenarios
            const scenarios = [
                // Simple overlap
                [
                    {
                        id: '1',
                        heading: 'A',
                        startTime: { hour: 9, minute: 0 },
                        endTime: { hour: 11, minute: 0 },
                        color: '#1',
                    },
                    {
                        id: '2',
                        heading: 'B',
                        startTime: { hour: 9, minute: 30 },
                        endTime: { hour: 10, minute: 0 },
                        color: '#2',
                    },
                ],
                // Triple overlap
                [
                    {
                        id: '1',
                        heading: 'A',
                        startTime: { hour: 9, minute: 0 },
                        endTime: { hour: 10, minute: 0 },
                        color: '#1',
                    },
                    {
                        id: '2',
                        heading: 'B',
                        startTime: { hour: 9, minute: 15 },
                        endTime: { hour: 11, minute: 0 },
                        color: '#2',
                    },
                    {
                        id: '3',
                        heading: 'C',
                        startTime: { hour: 9, minute: 30 },
                        endTime: { hour: 10, minute: 30 },
                        color: '#3',
                    },
                ],
                // Complex cascading
                [
                    {
                        id: '1',
                        heading: 'A',
                        startTime: { hour: 9, minute: 0 },
                        endTime: { hour: 12, minute: 0 },
                        color: '#1',
                    },
                    {
                        id: '2',
                        heading: 'B',
                        startTime: { hour: 9, minute: 30 },
                        endTime: { hour: 10, minute: 0 },
                        color: '#2',
                    },
                    {
                        id: '3',
                        heading: 'C',
                        startTime: { hour: 10, minute: 15 },
                        endTime: { hour: 11, minute: 15 },
                        color: '#3',
                    },
                    {
                        id: '4',
                        heading: 'D',
                        startTime: { hour: 10, minute: 45 },
                        endTime: { hour: 11, minute: 0 },
                        color: '#4',
                    },
                ],
            ];

            scenarios.forEach((events, scenarioIndex) => {
                const layout = calculator.calculateLayout(events);
                const backgroundEvents = layout.boxes.filter(
                    (box) => box.depth === 0,
                );

                backgroundEvents.forEach((event, eventIndex) => {
                    expect(event.width).to.equal(
                        100,
                        `Scenario ${scenarioIndex}, background event ${eventIndex} (${event.id}) should have 100% width, got ${event.width}%`,
                    );
                    expect(event.x).to.equal(
                        0,
                        `Scenario ${scenarioIndex}, background event ${eventIndex} (${event.id}) should be at x=0, got x=${event.x}`,
                    );
                });
            });
        });

        it('should ensure overlapping events have cascading positions', () => {
            const events = [
                {
                    id: '1',
                    heading: 'Background',
                    startTime: { hour: 9, minute: 0 },
                    endTime: { hour: 11, minute: 0 },
                    color: '#1',
                },
                {
                    id: '2',
                    heading: 'Overlap 1',
                    startTime: { hour: 9, minute: 30 },
                    endTime: { hour: 10, minute: 0 },
                    color: '#2',
                },
                {
                    id: '3',
                    heading: 'Overlap 2',
                    startTime: { hour: 9, minute: 45 },
                    endTime: { hour: 10, minute: 15 },
                    color: '#3',
                },
            ];

            const layout = calculator.calculateLayout(events);
            const sortedByDepth = layout.boxes.sort(
                (a, b) => a.depth - b.depth,
            );

            // Background event (depth 0)
            expect(sortedByDepth[0].width).to.equal(100);
            expect(sortedByDepth[0].x).to.equal(0);

            // Overlapping events should have increasing x positions
            for (let i = 1; i < sortedByDepth.length; i++) {
                expect(sortedByDepth[i].x).to.be.greaterThan(
                    sortedByDepth[i - 1].x,
                    `Event at depth ${
                        sortedByDepth[i].depth
                    } should have x > event at depth ${
                        sortedByDepth[i - 1].depth
                    }`,
                );
                expect(sortedByDepth[i].width).to.be.lessThan(
                    100,
                    `Event at depth ${sortedByDepth[i].depth} should have width < 100%`,
                );
            }
        });
    });
});
