/**
 * Deterministic layout calculation engine for overlapping calendar events
 * Separates layout logic from rendering concerns
 */

interface CalendarEvent {
    id: string;
    heading: string;
    startTime: { hour: number; minute: number };
    endTime: { hour: number; minute: number };
    color: string;
}

interface GridConfig {
    minuteHeight: number;
    eventMinHeight: number;
}

export interface LayoutBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    depth: number;
    group: number;
    opacity: number;
    zIndex: number;
}

export interface LayoutResult {
    boxes: LayoutBox[];
}

export class LayoutCalculator {
    private config: GridConfig;

    constructor(config: Partial<GridConfig & Record<string, number>> = {}) {
        this.config = {
            minuteHeight: config.minuteHeight ?? 1,
            eventMinHeight: config.eventMinHeight ?? 20,
        };
    }

    calculateLayout(events: CalendarEvent[]): LayoutResult {
        const intervals = this.eventsToIntervals(events);
        const grading = this.calculateGrading(intervals);
        const boxes = this.calculateBoxes(events, grading);

        return { boxes };
    }

    private eventsToIntervals(events: CalendarEvent[]): Array<{ start: number; end: number }> {
        return events.map((event) => ({
            start: event.startTime.hour * 60 + event.startTime.minute,
            end: event.endTime.hour * 60 + event.endTime.minute,
        }));
    }

    private calculateGrading(
        intervals: Array<{ start: number; end: number }>,
    ): Array<{ index: number; depth: number; group: number }> {
        const grading: Array<{ index: number; depth: number; group: number }> = [];

        const groups = this.findOverlapGroups(intervals);

        groups.forEach((groupIndices, groupId) => {
            if (groupIndices.length === 1) {
                grading.push({
                    index: groupIndices[0],
                    depth: 0,
                    group: groupId,
                });
            } else {
                const groupIntervals = groupIndices.map((i) => ({
                    ...intervals[i],
                    originalIndex: i,
                }));

                const longestEvent = groupIntervals.reduce((longest, current) => {
                    const currentDuration = current.end - current.start;
                    const longestDuration = longest.end - longest.start;
                    return currentDuration > longestDuration ? current : longest;
                });

                let nextDepth = 1;
                groupIntervals.forEach((interval) => {
                    const isLongestEvent = interval.originalIndex === longestEvent.originalIndex;
                    const depth = isLongestEvent ? 0 : nextDepth++;
                    grading.push({
                        index: interval.originalIndex,
                        depth,
                        group: groupId,
                    });
                });
            }
        });

        grading.sort((a, b) => a.index - b.index);
        return grading;
    }

    private findOverlapGroups(intervals: Array<{ start: number; end: number }>): Array<number[]> {
        const groups: Array<number[]> = [];
        const assigned = new Set<number>();

        intervals.forEach((_interval, index) => {
            if (assigned.has(index)) return;

            const group = [index];
            assigned.add(index);

            let changed = true;
            while (changed) {
                changed = false;
                intervals.forEach((otherInterval, otherIndex) => {
                    if (assigned.has(otherIndex)) return;

                    const overlapsWithGroup = group.some((groupIndex) =>
                        this.intervalsOverlap(intervals[groupIndex], otherInterval),
                    );

                    if (overlapsWithGroup) {
                        group.push(otherIndex);
                        assigned.add(otherIndex);
                        changed = true;
                    }
                });
            }

            groups.push(group);
        });

        return groups;
    }

    private intervalsOverlap(
        a: { start: number; end: number },
        b: { start: number; end: number },
    ): boolean {
        return a.start < b.end && b.start < a.end;
    }

    private calculateBoxes(
        events: CalendarEvent[],
        grading: Array<{ index: number; depth: number; group: number }>,
    ): LayoutBox[] {
        const eventsByGroup = new Map<
            number,
            Array<{
                event: CalendarEvent;
                index: number;
                grade: { index: number; depth: number; group: number };
            }>
        >();

        events.forEach((event, index) => {
            const grade = grading[index] || { depth: 0, group: index };
            if (!eventsByGroup.has(grade.group)) {
                eventsByGroup.set(grade.group, []);
            }
            eventsByGroup.get(grade.group)!.push({ event, index, grade });
        });

        return events.map((event, index) => {
            const grade = grading[index] || { depth: 0, group: index };
            const startMinute = event.startTime.hour * 60 + event.startTime.minute;
            const endMinute = event.endTime.hour * 60 + event.endTime.minute;
            const duration = endMinute - startMinute;

            const groupEvents = eventsByGroup.get(grade.group) || [];
            const maxDepthInGroup = Math.max(...groupEvents.map((g) => g.grade.depth));

            let width: number;
            let x: number;

            if (groupEvents.length === 1) {
                width = 100;
                x = 0;
            } else {
                const minReadableWidth = 65;
                const maxRange = 100 - minReadableWidth;

                if (grade.depth === 0) {
                    x = 0;
                    width = 100;
                } else {
                    x = maxDepthInGroup > 0 ? (grade.depth / maxDepthInGroup) * maxRange : 0;
                    width = 100 - x;
                }
            }

            const baseZIndex = 100;
            const zIndex = baseZIndex + grade.depth;

            return {
                id: event.id,
                x,
                y: startMinute * this.config.minuteHeight,
                width,
                height: Math.max(duration * this.config.minuteHeight, this.config.eventMinHeight),
                depth: grade.depth,
                group: grade.group,
                opacity: grade.depth === 0 ? 0.95 : Math.max(0.85, 0.95 - grade.depth * 0.05),
                zIndex,
            };
        });
    }
}
