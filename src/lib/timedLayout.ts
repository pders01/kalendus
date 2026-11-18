import type { ExpandedCalendarEntry } from './calendarModel.js';
import { LayoutCalculator, type GridConfig, type LayoutBox } from './LayoutCalculator.js';

type TimedSegment = Pick<ExpandedCalendarEntry, 'segmentId' | 'time' | 'heading' | 'color'>;

/** Lay out one day's timed segments, returning boxes in input order. */
export function layoutTimedEntries(
    entries: readonly TimedSegment[],
    geometry: Pick<GridConfig, 'minuteHeight' | 'eventMinHeight'>,
    useMarkers: boolean,
) {
    const latestLabelStart = Math.max(
        0,
        1440 - Math.ceil(geometry.eventMinHeight / geometry.minuteHeight),
    );
    const events = entries.map((entry) => {
        const { start, end } = entry.time!;
        const startMinute = start.hour * 60 + start.minute;
        // Only the label collision envelope moves. The segment and its canonical
        // endpoints still drive duration marks, accessibility and disclosure.
        const labelStart = useMarkers ? Math.min(startMinute, latestLabelStart) : startMinute;
        return {
            id: entry.segmentId,
            heading: entry.heading || '',
            startTime: { hour: Math.floor(labelStart / 60), minute: labelStart % 60 },
            endTime: end,
            color: entry.color || '#1976d2',
        };
    });
    return new LayoutCalculator({ ...geometry, layoutMode: 'columns' }).calculateLayout(events);
}

/** Groups that need disclosure, with segment indices in render order. */
export function getDenseTimedGroups(
    boxes: readonly LayoutBox[],
    columnWidth: number,
    minimumLaneWidth: number,
) {
    const groups = new Map<number, number[]>();
    boxes.forEach((box, index) => {
        const lanes = box.columnCount ?? 1;
        if (lanes > 1 && columnWidth / lanes < minimumLaneWidth) {
            const indices = groups.get(box.group) ?? [];
            indices.push(index);
            groups.set(box.group, indices);
        }
    });
    return groups;
}
