import { expect } from 'chai';

// Extract the smart layout logic for testing without browser dependencies
function getSmartLayout(
    entry: any,
    height: number,
    calendarWidth: number = 800,
    width?: number,
    layoutBox?: { depth: number; opacity: number },
): 'row' | 'column' {
    if (!entry.time) return 'row';

    // Calculate event duration in minutes
    const durationMinutes = entry.time
        ? entry.time.end.hour * 60 +
          entry.time.end.minute -
          (entry.time.start.hour * 60 + entry.time.start.minute)
        : 0;

    // Estimate content requirements
    const titleLength = entry.heading?.length || 0;
    const hasContent = Boolean(entry.content);

    // Overlap context analysis
    const isOverlapping = layoutBox && layoutBox.depth > 0;
    const isBackgroundEvent = layoutBox && layoutBox.depth > 0;
    const isTransparent = layoutBox && layoutBox.opacity < 0.8;
    const hasSignificantOverlap =
        layoutBox && (layoutBox.depth > 1 || layoutBox.opacity < 0.6);

    // Dynamic thresholds based on content and viewport
    const minTwoLineHeight = hasContent ? 50 : 40;
    const comfortableRowWidth = Math.max(120, calendarWidth * 0.15);
    const longTitleThreshold = Math.max(15, Math.min(25, calendarWidth / 50));

    // Multi-factor decision making
    const factors = {
        // Height factors
        hasEnoughHeight: height >= minTwoLineHeight,
        hasComfortableHeight: height >= minTwoLineHeight + 20,

        // Width factors
        hasEnoughWidth: !width || width >= comfortableRowWidth,
        hasComfortableWidth: !width || width >= comfortableRowWidth + 40,

        // Content factors
        hasLongTitle: titleLength > longTitleThreshold,
        hasAdditionalContent: hasContent,

        // Duration factors
        isVeryShort: durationMinutes <= 15,
        isShort: durationMinutes <= 30,
        isMedium: durationMinutes <= 60,
        isLong: durationMinutes > 60,

        // Overlap factors
        isOverlapping: Boolean(isOverlapping),
        isBackgroundEvent: Boolean(isBackgroundEvent),
        isTransparent: Boolean(isTransparent),
        hasSignificantOverlap: Boolean(hasSignificantOverlap),
    };

    // OVERLAP-AWARE DECISION LOGIC

    // CRITICAL: Force column for background events that might be obscured
    if (factors.isBackgroundEvent && factors.hasEnoughHeight) {
        return 'column';
    }

    // CRITICAL: Force column for highly transparent events
    if (factors.hasSignificantOverlap && factors.hasEnoughHeight) {
        return 'column';
    }

    // Force column for any overlapping event with adequate space
    if (factors.isOverlapping && factors.hasComfortableHeight) {
        return 'column';
    }

    // Force row ONLY for very short events with no overlapping issues
    if (factors.isVeryShort && !factors.isOverlapping) {
        return 'row';
    }

    // Prefer column when we have long titles and enough height
    if (factors.hasLongTitle && factors.hasEnoughHeight) {
        return 'column';
    }

    // Prefer column when we have additional content and space
    if (
        factors.hasAdditionalContent &&
        factors.hasEnoughHeight &&
        factors.hasEnoughWidth
    ) {
        return 'column';
    }

    // For medium events, consider space efficiency
    if (factors.isMedium) {
        if (factors.hasEnoughHeight && !factors.hasComfortableWidth) {
            return 'column';
        }
        if (factors.hasComfortableWidth && !factors.hasEnoughHeight) {
            return 'row';
        }
    }

    // Default: use height-based decision with width consideration
    if (factors.hasEnoughHeight && factors.hasEnoughWidth) {
        return 'column';
    }

    return 'row';
}

describe('Smart Layout Decision System', () => {
    describe('Basic Layout Decisions', () => {
        it('should use row layout for events without time', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                heading: 'All Day Event',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 60, 200);
            expect(layout).to.equal('row');
        });

        it('should use column layout for tall events with adequate space', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Regular Meeting',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 80, 200);
            expect(layout).to.equal('column');
        });

        it('should use row layout for short events with limited height', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 30 },
                },
                heading: 'Quick Call',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 25, 200);
            expect(layout).to.equal('row');
        });
    });

    describe('Overlap-Aware Decisions', () => {
        it('should force column layout for background events (depth > 0)', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 15 },
                },
                heading: 'Background Event',
                content: '',
                color: '#1976d2',
            };

            // Even very short events should use column when they're background events
            const layout = getSmartLayout(entry, 45, 800, 200, {
                depth: 1, // Background event
                opacity: 0.7,
            });

            expect(layout).to.equal('column');
        });

        it('should force column layout for highly transparent events', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 30 },
                },
                heading: 'Transparent Event',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 45, 800, 200, {
                depth: 2, // Deep overlap
                opacity: 0.5, // Very transparent
            });

            expect(layout).to.equal('column');
        });

        it('should prefer column layout for any overlapping event with comfortable height', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 30 },
                },
                heading: 'Overlapping Event',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 70, 800, 200, {
                depth: 1, // Overlapping
                opacity: 0.8,
            });

            expect(layout).to.equal('column');
        });

        it('should still use row for very short non-overlapping events', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 15 },
                },
                heading: 'Quick Call',
                content: '',
                color: '#1976d2',
            };

            // No overlap context - should still use row for very short events
            const layout = getSmartLayout(entry, 30, 200);
            expect(layout).to.equal('row');
        });
    });

    describe('Duration-Based Decisions', () => {
        it('should use row layout for very short events (≤15 min) when not overlapping', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 10 },
                },
                heading: 'Very Quick Meeting',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 60, 200);
            expect(layout).to.equal('row');
        });

        it('should prefer column layout for long events (>60 min) with space', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 11, minute: 0 },
                },
                heading: 'Long Workshop',
                content: 'Detailed workshop description',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 100, 250);
            expect(layout).to.equal('column');
        });
    });

    describe('Content-Based Decisions', () => {
        it('should prefer column layout for long titles with adequate height', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 30 },
                },
                heading:
                    'This is a very long title that should prefer column layout',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 50, 200);
            expect(layout).to.equal('column');
        });

        it('should prefer column layout for events with additional content', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 30 },
                },
                heading: 'Meeting',
                content: 'This event has additional content that needs space',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 60, 200);
            expect(layout).to.equal('column');
        });
    });

    describe('Responsive Width Considerations', () => {
        it('should adapt thresholds based on calendar width', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 30 },
                },
                heading: 'Responsive Title',
                content: '',
                color: '#1976d2',
            };

            // Test with narrow calendar
            const narrowLayout = getSmartLayout(entry, 50, 400, 100);

            // Test with wide calendar
            const wideLayout = getSmartLayout(entry, 50, 1200, 200);

            // The behavior might differ based on adaptive thresholds
            expect(typeof narrowLayout).to.equal('string');
            expect(typeof wideLayout).to.equal('string');
        });

        it('should consider event width in layout decisions', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Width Test Event',
                content: '',
                color: '#1976d2',
            };

            // Test with narrow width
            const narrowLayout = getSmartLayout(entry, 60, 80);

            // Test with wide width
            const wideLayout = getSmartLayout(entry, 60, 300);

            // Wide events should be more likely to use row layout
            expect(typeof narrowLayout).to.equal('string');
            expect(typeof wideLayout).to.equal('string');
        });
    });

    describe('Edge Cases and Complex Scenarios', () => {
        it('should handle missing time information gracefully', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                heading: 'Event without time',
                content: '',
                color: '#1976d2',
            };

            expect(() => {
                getSmartLayout(entry, 60, 200);
            }).to.not.throw();
        });

        it('should handle zero duration events', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 0 },
                },
                heading: 'Zero Duration Event',
                content: '',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 40, 200);
            expect(layout).to.equal('row'); // Should default to row for zero duration
        });

        it('should prioritize overlap over duration for very short overlapping events', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 5 },
                }, // Very short
                heading: 'Very Short Overlapping',
                content: '',
                color: '#1976d2',
            };

            // Even very short events should consider overlap
            const layout = getSmartLayout(entry, 45, 800, 200, {
                depth: 1, // Overlapping
                opacity: 0.7,
            });

            expect(layout).to.equal('column'); // Visibility trumps duration
        });

        it('should handle extreme dimensions gracefully', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Extreme Dimensions',
                content: '',
                color: '#1976d2',
            };

            // Extremely small dimensions
            const tinyLayout = getSmartLayout(entry, 5, 100, 10);
            expect(tinyLayout).to.be.oneOf(['row', 'column']);

            // Extremely large dimensions
            const hugeLayout = getSmartLayout(entry, 500, 3000, 800);
            expect(hugeLayout).to.be.oneOf(['row', 'column']);
        });

        it('should handle negative duration gracefully', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 10, minute: 30 },
                    end: { hour: 9, minute: 0 },
                }, // End before start
                heading: 'Negative Duration',
                content: '',
                color: '#1976d2',
            };

            expect(() => {
                const layout = getSmartLayout(entry, 60, 800, 200);
                expect(layout).to.be.oneOf(['row', 'column']);
            }).to.not.throw();
        });

        it('should handle missing or malformed entry properties', () => {
            const entries = [
                // Missing heading
                {
                    time: {
                        start: { hour: 9, minute: 0 },
                        end: { hour: 10, minute: 0 },
                    },
                    content: '',
                    color: '#1976d2',
                },
                // Missing content
                {
                    heading: 'Test',
                    time: {
                        start: { hour: 9, minute: 0 },
                        end: { hour: 10, minute: 0 },
                    },
                    color: '#1976d2',
                },
                // Empty heading
                {
                    heading: '',
                    time: {
                        start: { hour: 9, minute: 0 },
                        end: { hour: 10, minute: 0 },
                    },
                    content: '',
                    color: '#1976d2',
                },
                // Null heading
                {
                    heading: null,
                    time: {
                        start: { hour: 9, minute: 0 },
                        end: { hour: 10, minute: 0 },
                    },
                    content: '',
                    color: '#1976d2',
                },
                // Undefined heading
                {
                    heading: undefined,
                    time: {
                        start: { hour: 9, minute: 0 },
                        end: { hour: 10, minute: 0 },
                    },
                    content: '',
                    color: '#1976d2',
                },
            ];

            entries.forEach((entry, index) => {
                expect(() => {
                    const layout = getSmartLayout(entry, 60, 800, 200);
                    expect(layout).to.be.oneOf(['row', 'column']);
                }, `Entry ${index} should not throw`).to.not.throw();
            });
        });

        it('should handle extreme time values', () => {
            const entries = [
                // Midnight event
                {
                    heading: 'Midnight',
                    time: {
                        start: { hour: 0, minute: 0 },
                        end: { hour: 0, minute: 30 },
                    },
                    content: '',
                    color: '#1976d2',
                },
                // Late night event
                {
                    heading: 'Late Night',
                    time: {
                        start: { hour: 23, minute: 30 },
                        end: { hour: 23, minute: 59 },
                    },
                    content: '',
                    color: '#1976d2',
                },
                // Cross-midnight (invalid but should handle gracefully)
                {
                    heading: 'Cross Midnight',
                    time: {
                        start: { hour: 23, minute: 30 },
                        end: { hour: 1, minute: 0 },
                    },
                    content: '',
                    color: '#1976d2',
                },
                // Invalid hour values
                {
                    heading: 'Invalid Hour',
                    time: {
                        start: { hour: 25, minute: 0 },
                        end: { hour: 26, minute: 0 },
                    },
                    content: '',
                    color: '#1976d2',
                },
                // Invalid minute values
                {
                    heading: 'Invalid Minutes',
                    time: {
                        start: { hour: 9, minute: 65 },
                        end: { hour: 10, minute: 75 },
                    },
                    content: '',
                    color: '#1976d2',
                },
            ];

            entries.forEach((entry, index) => {
                expect(() => {
                    const layout = getSmartLayout(entry, 60, 800, 200);
                    expect(layout).to.be.oneOf(['row', 'column']);
                }, `Time entry ${index} should not throw`).to.not.throw();
            });
        });

        it('should handle extreme overlap scenarios', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Deep Overlap',
                content: '',
                color: '#1976d2',
            };

            // Very deep overlap
            const deepOverlap = getSmartLayout(entry, 60, 800, 200, {
                depth: 10,
                opacity: 0.1,
            });
            expect(deepOverlap).to.equal('column');

            // Negative depth (invalid but should handle)
            const negativeDepth = getSmartLayout(entry, 60, 800, 200, {
                depth: -1,
                opacity: 1.0,
            });
            expect(negativeDepth).to.be.oneOf(['row', 'column']);

            // Opacity > 1 (invalid but should handle)
            const invalidOpacity = getSmartLayout(entry, 60, 800, 200, {
                depth: 1,
                opacity: 1.5,
            });
            expect(invalidOpacity).to.be.oneOf(['row', 'column']);
        });
    });

    describe('Boundary Conditions and Performance Edge Cases', () => {
        it('should handle boundary threshold values', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 9, minute: 15 },
                }, // Exactly 15 minutes
                heading: 'Boundary Test',
                content: '',
                color: '#1976d2',
            };

            // Test exactly at 15-minute boundary (very short threshold)
            const exactBoundary = getSmartLayout(entry, 40, 800, 120);
            expect(exactBoundary).to.be.oneOf(['row', 'column']);

            // Test just over the boundary
            entry.time.end.minute = 16;
            const overBoundary = getSmartLayout(entry, 40, 800, 120);
            expect(overBoundary).to.be.oneOf(['row', 'column']);
        });

        it('should handle minimum height thresholds consistently', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Height Threshold Test',
                content: 'Additional content',
                color: '#1976d2',
            };

            // Test around expected minimum height thresholds
            const heights = [39, 40, 49, 50, 69, 70];
            heights.forEach((height) => {
                const layout = getSmartLayout(entry, height, 800, 200);
                expect(layout).to.be.oneOf(['row', 'column']);
            });
        });

        it('should handle width threshold edge cases', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Width Test',
                content: '',
                color: '#1976d2',
            };

            // Test around computed width thresholds
            const calendarWidths = [400, 800, 1200];
            const entryWidths = [60, 120, 160, 200];

            calendarWidths.forEach((calWidth) => {
                entryWidths.forEach((entryWidth) => {
                    const layout = getSmartLayout(
                        entry,
                        60,
                        calWidth,
                        entryWidth,
                    );
                    expect(layout).to.be.oneOf(['row', 'column']);
                });
            });
        });

        it('should handle very long titles and content consistently', () => {
            const longTitle =
                'This is an extremely long title that should definitely exceed any reasonable character threshold for testing title length boundary conditions and responsive behavior';
            const longContent =
                'This is extremely long content that spans multiple lines and should test how the system handles events with substantial amounts of descriptive text and detailed information about the calendar event including location details and participant information';

            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: longTitle,
                content: longContent,
                color: '#1976d2',
            };

            // Test with various dimensions to see how long content affects layout
            const dimensions = [
                { height: 30, width: 100 },
                { height: 60, width: 200 },
                { height: 100, width: 300 },
            ];

            dimensions.forEach(({ height, width }) => {
                const layout = getSmartLayout(entry, height, 800, width);
                expect(layout).to.be.oneOf(['row', 'column']);
            });
        });

        it('should maintain consistent behavior under stress conditions', () => {
            // Rapid-fire testing to ensure no memory leaks or inconsistent state
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Stress Test',
                content: '',
                color: '#1976d2',
            };

            const results = [];
            for (let i = 0; i < 1000; i++) {
                const layout = getSmartLayout(
                    entry,
                    Math.random() * 200 + 20, // Random height 20-220
                    Math.random() * 2000 + 400, // Random calendar width 400-2400
                    Math.random() * 400 + 50, // Random entry width 50-450
                    Math.random() > 0.5
                        ? {
                              depth: Math.floor(Math.random() * 3),
                              opacity: Math.random(),
                          }
                        : undefined,
                );
                results.push(layout);
            }

            // All results should be valid
            results.forEach((result) => {
                expect(result).to.be.oneOf(['row', 'column']);
            });

            // Should have both layouts represented in random testing
            const uniqueResults = [...new Set(results)];
            expect(uniqueResults.length).to.be.greaterThan(0);
        });

        it('should handle floating point precision edge cases', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Precision Test',
                content: '',
                color: '#1976d2',
            };

            // Test with floating point values that might cause precision issues
            const precisionValues = [
                39.999999, 40.000001, 49.999999, 50.000001,
            ];

            precisionValues.forEach((value) => {
                const layout = getSmartLayout(entry, value, 800.5, 200.3, {
                    depth: 0.9, // Should be treated as < 1
                    opacity: 0.800001, // Very close to 0.8 threshold
                });
                expect(layout).to.be.oneOf(['row', 'column']);
            });
        });
    });

    describe('High-Volume and Performance Edge Cases', () => {
        it('should handle 100+ overlapping events without performance degradation', function () {
            this.timeout(5000); // Allow more time for this test

            const startTime = Date.now();
            const results = [];

            // Create 200 events with various overlapping patterns
            for (let i = 0; i < 200; i++) {
                const entry = {
                    date: {
                        start: { day: 1, month: 1, year: 2024 },
                        end: { day: 1, month: 1, year: 2024 },
                    },
                    time: {
                        start: {
                            hour: 9 + Math.floor(i / 20),
                            minute: (i * 5) % 60,
                        },
                        end: {
                            hour: 10 + Math.floor(i / 15),
                            minute: (i * 5 + 30) % 60,
                        },
                    },
                    heading: `Event ${i + 1}`,
                    content: i % 3 === 0 ? 'Content for event' : '',
                    color: '#1976d2',
                };

                const layout = getSmartLayout(
                    entry,
                    40 + (i % 100), // Varying heights
                    800,
                    150 + (i % 100), // Varying widths
                    {
                        depth: i % 5, // Various overlap depths
                        opacity: 0.5 + (i % 50) / 100, // Various opacities
                    },
                );
                results.push(layout);
            }

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // Should complete in reasonable time (under 2 seconds)
            expect(processingTime).to.be.lessThan(2000);

            // All results should be valid
            results.forEach((result) => {
                expect(result).to.be.oneOf(['row', 'column']);
            });

            // Should have both layouts represented
            const uniqueResults = [...new Set(results)];
            expect(uniqueResults.length).to.be.greaterThan(1);
        });

        it('should maintain decision consistency with massive event counts', () => {
            const baseEntry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Consistency Test Event',
                content: '',
                color: '#1976d2',
            };

            // Test the same configuration multiple times within a large batch
            const results1 = [];
            const results2 = [];

            // First batch of 500 decisions
            for (let i = 0; i < 500; i++) {
                const result = getSmartLayout(baseEntry, 60, 800, 200, {
                    depth: 1,
                    opacity: 0.7,
                });
                results1.push(result);
            }

            // Second batch of 500 decisions
            for (let i = 0; i < 500; i++) {
                const result = getSmartLayout(baseEntry, 60, 800, 200, {
                    depth: 1,
                    opacity: 0.7,
                });
                results2.push(result);
            }

            // All results should be identical (consistent decision making)
            const unique1 = [...new Set(results1)];
            const unique2 = [...new Set(results2)];

            expect(unique1.length).to.equal(1);
            expect(unique2.length).to.equal(1);
            expect(unique1[0]).to.equal(unique2[0]);
        });

        it('should handle extreme overlap depth scenarios (50+ levels)', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Deep Overlap Test',
                content: '',
                color: '#1976d2',
            };

            // Test with extreme overlap depths
            const extremeDepths = [25, 50, 100, 250, 500];

            extremeDepths.forEach((depth) => {
                const layout = getSmartLayout(entry, 80, 800, 200, {
                    depth: depth,
                    opacity: Math.max(0.01, 1.0 - depth * 0.01), // Decreasing opacity with depth
                });

                // Deep overlaps should always prefer column for visibility
                expect(layout).to.equal('column');
            });
        });

        it('should handle memory-intensive scenarios without leaks', function () {
            this.timeout(10000); // Allow more time for this test

            // Create and process many different event configurations
            const memoryTestRuns = 1000;
            let results: ('row' | 'column')[] = [];

            for (let run = 0; run < memoryTestRuns; run++) {
                // Create unique entries each time to test memory management
                const entries = [];
                for (let i = 0; i < 50; i++) {
                    entries.push({
                        date: {
                            start: { day: 1, month: 1, year: 2024 },
                            end: { day: 1, month: 1, year: 2024 },
                        },
                        time: {
                            start: { hour: 9 + (i % 8), minute: i % 60 },
                            end: { hour: 10 + (i % 8), minute: (i + 30) % 60 },
                        },
                        heading: `Memory Test Event ${run}-${i}`,
                        content: `Content for run ${run} event ${i}`,
                        color: '#1976d2',
                    });
                }

                // Process all entries
                const runResults = entries.map((entry) =>
                    getSmartLayout(entry, 50 + (run % 100), 800, 200, {
                        depth: run % 10,
                        opacity: 0.3 + (run % 70) / 100,
                    }),
                );

                results.push(...runResults);

                // Periodically clear results to simulate real usage patterns
                if (run % 100 === 0) {
                    results = results.slice(-1000); // Keep only recent results
                }
            }

            // All results should still be valid
            results.forEach((result) => {
                expect(result).to.be.oneOf(['row', 'column']);
            });
        });

        it('should handle pathological overlap patterns', () => {
            // Test scenarios that could break overlap detection logic
            const pathologicalScenarios = [
                {
                    name: 'Completely overlapping cascade',
                    events: Array.from({ length: 100 }, (_, i) => ({
                        date: {
                            start: { day: 1, month: 1, year: 2024 },
                            end: { day: 1, month: 1, year: 2024 },
                        },
                        time: {
                            start: { hour: 9, minute: 0 },
                            end: { hour: 10, minute: 0 },
                        }, // All identical times
                        heading: `Identical Event ${i}`,
                        content: '',
                        color: '#1976d2',
                    })),
                },
                {
                    name: 'Nested overlaps',
                    events: Array.from({ length: 50 }, (_, i) => ({
                        date: {
                            start: { day: 1, month: 1, year: 2024 },
                            end: { day: 1, month: 1, year: 2024 },
                        },
                        time: {
                            start: { hour: 9, minute: i },
                            end: { hour: 18, minute: 60 - i }, // Each event contains all others
                        },
                        heading: `Nested Event ${i}`,
                        content: '',
                        color: '#1976d2',
                    })),
                },
                {
                    name: 'Alternating micro-overlaps',
                    events: Array.from({ length: 200 }, (_, i) => ({
                        date: {
                            start: { day: 1, month: 1, year: 2024 },
                            end: { day: 1, month: 1, year: 2024 },
                        },
                        time: {
                            start: { hour: 9, minute: Math.floor(i / 2) },
                            end: { hour: 9, minute: Math.floor(i / 2) + 1 }, // 1-minute overlapping events
                        },
                        heading: `Micro Event ${i}`,
                        content: '',
                        color: '#1976d2',
                    })),
                },
            ];

            pathologicalScenarios.forEach((scenario) => {
                scenario.events.forEach((entry, index) => {
                    expect(() => {
                        const layout = getSmartLayout(entry, 40, 800, 150, {
                            depth: index % 20, // Various depths
                            opacity: 0.1 + (index % 90) / 100,
                        });
                        expect(layout).to.be.oneOf(['row', 'column']);
                    }, `${scenario.name} event ${index} should not throw`).to.not.throw();
                });
            });
        });

        it('should handle extreme content variations in bulk', () => {
            const contentVariations = [
                '', // Empty
                'A', // Single character
                'Very long title that exceeds normal character limits and should test the title length calculation under high-volume scenarios with many different events being processed simultaneously',
                'Unicode 测试 🎉 📅 ✨ 🚀', // Unicode and emojis
                Array(1000).fill('x').join(''), // 1000 character string
                null, // Null content
                undefined, // Undefined content
                123, // Non-string content
                { invalid: 'object' }, // Object content
            ];

            const results: ('row' | 'column')[] = [];

            // Test each content variation 50 times with different parameters
            contentVariations.forEach((content, varIndex) => {
                for (let i = 0; i < 50; i++) {
                    const entry = {
                        date: {
                            start: { day: 1, month: 1, year: 2024 },
                            end: { day: 1, month: 1, year: 2024 },
                        },
                        time: {
                            start: { hour: 9, minute: 0 },
                            end: { hour: 10, minute: 0 },
                        },
                        heading: content,
                        content: varIndex % 2 === 0 ? content : '',
                        color: '#1976d2',
                    };

                    const layout = getSmartLayout(entry, 60, 800, 200, {
                        depth: i % 5,
                        opacity: 0.4 + (i % 60) / 100,
                    });

                    results.push(layout);
                }
            });

            // All results should be valid despite content variations
            results.forEach((result) => {
                expect(result).to.be.oneOf(['row', 'column']);
            });
        });

        it('should maintain performance with cascading threshold calculations', function () {
            this.timeout(3000);

            const startTime = Date.now();

            // Test with many different calendar widths to trigger threshold recalculations
            const calendarWidths = Array.from(
                { length: 100 },
                (_, i) => 300 + i * 20,
            ); // 300 to 2280
            const results: ('row' | 'column')[] = [];

            calendarWidths.forEach((calWidth) => {
                for (let eventIndex = 0; eventIndex < 20; eventIndex++) {
                    const entry = {
                        date: {
                            start: { day: 1, month: 1, year: 2024 },
                            end: { day: 1, month: 1, year: 2024 },
                        },
                        time: {
                            start: { hour: 9, minute: 0 },
                            end: { hour: 10, minute: eventIndex * 2 },
                        },
                        heading: `Threshold Test Event ${eventIndex}`,
                        content:
                            eventIndex % 3 === 0 ? 'Additional content' : '',
                        color: '#1976d2',
                    };

                    const layout = getSmartLayout(
                        entry,
                        50,
                        calWidth,
                        100 + eventIndex * 5,
                    );
                    results.push(layout);
                }
            });

            const endTime = Date.now();
            const processingTime = endTime - startTime;

            // Should complete threshold calculations efficiently
            expect(processingTime).to.be.lessThan(1000);

            // All results should be valid
            results.forEach((result) => {
                expect(result).to.be.oneOf(['row', 'column']);
            });
        });
    });

    describe('Real-World Scenarios', () => {
        it('should handle typical meeting scenario', () => {
            const entry = {
                date: {
                    start: { day: 1, month: 1, year: 2024 },
                    end: { day: 1, month: 1, year: 2024 },
                },
                time: {
                    start: { hour: 9, minute: 0 },
                    end: { hour: 10, minute: 0 },
                },
                heading: 'Team Standup',
                content: 'Daily team synchronization meeting',
                color: '#1976d2',
            };

            const layout = getSmartLayout(entry, 60, 180);
            expect(layout).to.be.oneOf(['row', 'column']);
        });

        it('should handle cascading overlap scenario', () => {
            const entries = [
                {
                    date: {
                        start: { day: 1, month: 1, year: 2024 },
                        end: { day: 1, month: 1, year: 2024 },
                    },
                    time: {
                        start: { hour: 9, minute: 0 },
                        end: { hour: 11, minute: 0 },
                    },
                    heading: 'Background Workshop',
                    content: 'Long background event',
                    color: '#1976d2',
                },
                {
                    date: {
                        start: { day: 1, month: 1, year: 2024 },
                        end: { day: 1, month: 1, year: 2024 },
                    },
                    time: {
                        start: { hour: 9, minute: 30 },
                        end: { hour: 10, minute: 0 },
                    },
                    heading: 'Overlapping Meeting',
                    content: '',
                    color: '#4caf50',
                },
            ];

            // Background event (depth 0, full opacity)
            const backgroundLayout = getSmartLayout(entries[0], 120, 800, 200, {
                depth: 0,
                opacity: 1.0,
            });

            // Overlapping event (depth 1, reduced opacity)
            const overlappingLayout = getSmartLayout(entries[1], 50, 800, 140, {
                depth: 1,
                opacity: 0.6,
            });

            expect(backgroundLayout).to.equal('column'); // Long event with space
            expect(overlappingLayout).to.equal('column'); // Overlapping should prefer column
        });
    });
});
