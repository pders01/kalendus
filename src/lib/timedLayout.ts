import type { ExpandedCalendarEntry } from './calendarModel.js';
import {
    getMinimumDisplayMinutes,
    LayoutCalculator,
    type GridConfig,
    type LayoutBox,
} from './LayoutCalculator.js';

type TimedSegment = Pick<ExpandedCalendarEntry, 'segmentId' | 'time' | 'heading' | 'color'>;

/** Lay out one day's timed segments, returning boxes in input order. */
export function layoutTimedEntries(
    entries: readonly TimedSegment[],
    geometry: Pick<GridConfig, 'minuteHeight' | 'eventMinHeight'>,
    useMarkers: boolean,
) {
    const latestLabelStart = Math.max(0, 1440 - Math.ceil(getMinimumDisplayMinutes(geometry)));
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

/** Compare the amount of detail hidden behind group buttons at the same width. */
export function gainsTimedDetail(
    entries: readonly TimedSegment[],
    fit: number,
    detail: number,
    eventMinHeight: number,
    columnWidth: number,
    minimumLaneWidth: number,
): boolean {
    const cost = (minuteHeight: number) => {
        const { boxes } = layoutTimedEntries(entries, { minuteHeight, eventMinHeight }, false);
        let hiddenPairs = 0;
        for (const { length } of getDenseTimedGroups(boxes, columnWidth, minimumLaneWidth).values())
            hiddenPairs += length * (length - 1);
        return hiddenPairs;
    };
    const fitted = cost(fit);
    return fitted > 0 && cost(detail) < fitted;
}
