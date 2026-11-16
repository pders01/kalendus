import { expect } from 'chai';
import { LayoutCalculator } from '../../src/lib/LayoutCalculator.js';

describe('LayoutCalculator', () => {
    let calculator: LayoutCalculator;

    beforeEach(() => {
        calculator = new LayoutCalculator();
    });

    describe('geometry and sweep invariants', () => {
        const event = (id: string, start: number, end: number) => ({
            id, heading: id, color: '#123456',
            startTime: { hour: Math.floor(start / 60), minute: start % 60 },
            endTime: { hour: Math.floor(end / 60), minute: end % 60 },
        });

        it('groups visually colliding short/point events using their minimum display height', () => {
            const boxes = calculator.calculateLayout([
                event('a', 540, 545), event('b', 550, 555), event('point', 560, 560),
            ]).boxes;
            expect(new Set(boxes.map((box) => box.group)).size).to.equal(1);
            expect(boxes.map((box) => box.height)).to.deep.equal([20, 20, 20]);
            expect(boxes.map((box) => box.durationMinutes)).to.deep.equal([20, 20, 20]);
            expect(boxes[1].depth).to.be.greaterThan(0);
        });

        it('uses the configured pixel scale and minimum in collision detection', () => {
            const scaled = new LayoutCalculator({ minuteHeight: 2, eventMinHeight: 60 });
            const boxes = scaled.calculateLayout([event('a', 540, 545), event('b', 560, 565)]).boxes;
            expect(boxes[0].group).to.equal(boxes[1].group);
            expect(boxes[0].y).to.equal(1080);
            expect(boxes[0].height).to.equal(60);
            expect(boxes[0].durationMinutes).to.equal(30);
        });

        it('reuses foreground depth for non-simultaneous events instead of unbounded cascading', () => {
            const boxes = calculator.calculateLayout([
                event('background', 540, 720), event('early', 550, 580), event('late', 600, 630),
            ]).boxes;
            expect(boxes.map((box) => box.depth)).to.deep.equal([0, 1, 1]);
            expect(boxes[1].x).to.equal(boxes[2].x);
        });

        it('keeps ties and group numbering deterministic through reordering', () => {
            const events = [event('c', 540, 600), event('b', 540, 600), event('a', 540, 600), event('z', 720, 750)];
            const canonical = (items: typeof events) => calculator.calculateLayout(items).boxes.sort((a, b) => a.id.localeCompare(b.id));
            expect(canonical(events)).to.deep.equal(canonical([...events].reverse()));
            expect(canonical(events)[0].depth).to.equal(0);
        });

        it('keeps touching display endpoints in separate groups', () => {
            const boxes = calculator.calculateLayout([event('a', 540, 545), event('b', 560, 565)]).boxes;
            expect(boxes[0].group).not.to.equal(boxes[1].group);
        });

        it('matches a simple reference connectivity calculation on deterministic random intervals', () => {
            let seed = 42;
            const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
            for (let trial = 0; trial < 20; trial++) {
                const events = Array.from({ length: 30 }, (_, i) => {
                    const start = Math.floor(random() * 1400);
                    return event(String(i), start, Math.min(1440, start + Math.floor(random() * 60)));
                });
                const intervals = events.map((item) => {
                    const start = item.startTime.hour * 60 + item.startTime.minute;
                    const end = item.endTime.hour * 60 + item.endTime.minute;
                    return { start, end: Math.max(start + 20, end) };
                });
                const boxes = calculator.calculateLayout(events).boxes;
                for (let i = 0; i < events.length; i++) {
                    const connected = new Set([i]);
                    let changed = true;
                    while (changed) {
                        changed = false;
                        intervals.forEach((candidate, j) => {
                            if (!connected.has(j) && [...connected].some((k) => intervals[k].start < candidate.end && candidate.start < intervals[k].end)) {
                                connected.add(j); changed = true;
                            }
                        });
                    }
                    for (let j = 0; j < events.length; j++) {
                        expect(boxes[i].group === boxes[j].group).to.equal(connected.has(j));
                    }
                }
            }
        });

        for (const size of [100, 1000, 10000]) {
            it(`handles ${size} identical overlaps without repeated group scans`, function () {
                this.timeout(10000);
                const boxes = calculator.calculateLayout(Array.from({ length: size }, (_, i) => event(String(i).padStart(5, '0'), 540, 600))).boxes;
                expect(boxes).to.have.length(size);
                expect(new Set(boxes.map((box) => box.group)).size).to.equal(1);
                expect(new Set(boxes.map((box) => box.depth)).size).to.equal(size);
                expect(boxes.every((box) => Number.isFinite(box.x) && box.width >= 65)).to.equal(true);
            });
        }

        it('handles 1,000 chained overlaps with bounded simultaneous foreground depth', () => {
            const boxes = calculator.calculateLayout(Array.from({ length: 1000 }, (_, i) => event(String(i), i, i + 2))).boxes;
            expect(new Set(boxes.map((box) => box.group)).size).to.equal(1);
            expect(Math.max(...boxes.map((box) => box.depth))).to.be.at.most(20);
        });

        it('rejects impossible times, reversed intervals and invalid geometry scales', () => {
            expect(() => calculator.calculateLayout([event('bad', 600, 540)])).to.throw(RangeError);
            expect(() => calculator.calculateLayout([event('bad', 1440, 1440)])).to.throw(RangeError);
            expect(() => new LayoutCalculator({ minuteHeight: 0 })).to.throw(RangeError);
            expect(() => new LayoutCalculator({ eventMinHeight: NaN })).to.throw(RangeError);
        });
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
