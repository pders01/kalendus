---
layout: base.njk
title: 'Rendering Calculations (Historical)'
order: 13
tags: docs
section: Reference
---

# LMS Calendar Rendering Calculations

> **Historical document.** This was the original rendering calculations reference written for the CSS grid system (`repeat(1440, 1fr)`). The calendar now uses absolute positioning with `--minute-height`. See the [Rendering Pipeline](./rendering-pipeline.md) for the current system.

This document describes all the rendering calculations used throughout the LMS Calendar component system to ensure pixel-perfect alignment and consistent behavior across all views.

## Table of Contents

1. [Core Grid System](#core-grid-system)
2. [Time-Based Calculations](#time-based-calculations)
3. [Day View Rendering](#day-view-rendering)
4. [Week View Rendering](#week-view-rendering)
5. [Month View Rendering](#month-view-rendering)
6. [Entry Positioning](#entry-positioning)
7. [Date Calculations](#date-calculations)
8. [Year View Rendering](#year-view-rendering)
9. [CSS Custom Properties](#css-custom-properties)
10. [Testing & Validation](#testing--validation)

## Core Grid System

All time-based views (Day and Week) use the same fundamental grid system for pixel-perfect alignment.

### Base Grid Configuration

```css
grid-template-rows: repeat(1440, 1fr);
grid-template-columns: 4em repeat(N, 1fr); /* N = 1 for Day, 7 for Week */
```

**Key Constants:**

- **1440 rows**: 24 hours × 60 minutes = 1440 total minutes
- **4em time column**: Fixed width for hour indicators
- **1fr per day**: Equal width distribution for day columns

### Grid Row Calculations

```typescript
// Hour indicator positioning (displays "00:00", "01:00", etc.)
function getHourIndicatorRow(hour: number): number {
    return hour * 60 + 1; // Row 1, 61, 121, ..., 1381
}

// Hour separator positioning (horizontal lines between hours)
function getHourSeparatorRow(hour: number): number {
    return hour * 60; // Row 60, 120, 180, ..., 1440
}

// Hour slot span (60-minute blocks for events)
function getHourSlotSpan(hour: number): string {
    const start = hour * 60 + 1;
    const end = (hour + 1) * 60 + 1;
    return `${start} / ${end}`; // "1 / 61", "61 / 121", etc.
}
```

**Examples:**

- Hour 0 (midnight): Indicator at row 1, spans rows 1-60
- Hour 12 (noon): Indicator at row 721, spans rows 721-780
- Hour 23 (11pm): Indicator at row 1381, spans rows 1381-1440
- Hour 24 (midnight next day): Indicator at row 1441, boundary marker

## Time-Based Calculations

### Grid Slot by Time

Used for precise event positioning within hours:

```typescript
function getGridSlotByTime(time: { start: CalendarTime; end: CalendarTime }): string {
    const startRow = time.start.hour * 60 + (time.start.minute + 1);
    const endRow = startRow + (time.end.hour * 60 + time.end.minute - startRow);

    if (startRow === endRow) {
        return `${startRow}/${endRow + 1}`;
    }
    return `${startRow}/${endRow}`;
}
```

**Example:**

- Event from 9:30 AM to 10:15 AM:
    - Start: 9 × 60 + 30 + 1 = 571
    - End: 10 × 60 + 15 = 615
    - Grid slot: "571/615"

### All-Day Event Detection

```typescript
function isAllDayEvent(entry: CalendarEntry): boolean {
    return (
        Number(entry.time.end.hour) - Number(entry.time.start.hour) >= 23 ||
        entry.continuation.is ||
        entry.continuation.has
    );
}
```

## Day View Rendering

### Container Structure

```
Day Component
├── all-day (slot: "all-day")
│   └── All-day events
└── container
    └── main (grid: 4em 1fr, 1440 rows)
        ├── hour indicators (column 1)
        ├── hour separators (column 2)
        └── hour slots (column 2, slots: "0", "1", ..., "23")
```

### CSS Structure

```css
.container {
    height: calc(100% - var(--day-header-height, 3.5em));
}

.main {
    grid-template-columns: var(--day-grid-columns, 4em 1fr);
    grid-template-rows: repeat(1440, 1fr);
    height: calc(100% - var(--day-main-offset, 1em));
    gap: var(--day-gap, 1px);
    padding: var(--day-padding, 0.5em);
}
```

### Hour Rendering

```typescript
// 25 hours (0-24) for proper grid coverage
_hours = [...Array(25).keys()];

// Each hour creates:
// 1. Hour indicator at row (hour * 60 + 1)
// 2. Hour separator at row (hour * 60) if index > 0
// 3. Slot for hour events
```

## Week View Rendering

### Container Structure

```
Week Component
├── week-header (grid: 4em repeat(7, 1fr))
│   ├── time-header (column 1)
│   └── day-labels (columns 2-8)
└── week-content (grid: 4em repeat(7, 1fr), 1440 rows)
    ├── hour-indicators (column 1)
    ├── hour-separators (columns 2-8)
    ├── all-day-areas (columns 2-8, rows 1-60)
    └── hour-slot-containers (columns 2-8, hour-specific rows)
```

### Grid Column Calculations

```typescript
// Time column is always column 1
const TIME_COLUMN = 1;

// Day columns are 2-8 (Monday=2, Tuesday=3, ..., Sunday=8)
function getDayColumn(dayIndex: number): number {
    return dayIndex + 2; // dayIndex 0-6 → columns 2-8
}

// Hour separators span all day columns
const SEPARATOR_SPAN = '2 / -1'; // Columns 2 through last
```

### Week Date Calculations

```typescript
function getWeekDates(activeDate: CalendarDate): CalendarDate[] {
    // Find Monday of the week containing activeDate
    const currentDate = new Date(activeDate.year, activeDate.month - 1, activeDate.day);
    const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() + mondayOffset);

    // Generate 7 consecutive dates starting from Monday
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + i);
        return {
            day: date.getDate(),
            month: date.getMonth() + 1,
            year: date.getFullYear(),
        };
    });
}
```

### Slot Naming Convention

```typescript
// All-day slots
const allDaySlotName = `all-day-${year}-${month}-${day}`;

// Hour slots
const hourSlotName = `${year}-${month}-${day}-${hour}`;
```

## Month View Rendering

### Entry Expansion

Multi-day entries are expanded into individual day entries:

```typescript
function expandEntryMaybe(entry: CalendarEntry): CalendarEntry[] {
    const [startDate, endDate, dayCount] = getDaysRange(entry.date);

    return Array.from({ length: dayCount }, (_, index) => {
        const currentStartDate = DateTime.fromJSDate(startDate).plus({ days: index });
        const currentEndDate = currentStartDate.plus({ days: 1 }).minus({ seconds: 1 });

        return {
            ...entry,
            date: {
                start: currentStartDate.toObject(),
                end: currentEndDate.toObject(),
            },
            continuation: {
                has: dayCount > 1,
                is: index > 1,
                index,
            },
        };
    });
}
```

### Slot Assignment

```typescript
function getSlotName(date: CalendarDate): string {
    return `${date.year}-${date.month}-${date.day}`;
}
```

## Entry Positioning

### Overlapping Entry Calculations

For entries that overlap in time, the calendar calculates positioning to avoid visual conflicts:

```typescript
// 1. Partition overlapping intervals
const partitions = partitionOverlappingIntervals(timeIntervals);

// 2. Get overlapping entity indices
const overlappingIndices = getOverlappingEntitiesIndices(partitions);

// 3. Sort gradings by index
const gradings = getSortedGradingsByIndex(overlappingIndices);
```

### Width and Offset Calculations

```typescript
function getWidthByGroupSize(grading: Grading[], index: number): number {
    const groupSize = grading.filter((item) => item.group === grading[index].group).length;
    return 100 / groupSize; // Percentage width
}

function getOffsetByDepth(grading: Grading[], index: number): number {
    if (!grading[index] || grading[index].depth === 0) {
        return 0;
    }

    const groupSize = grading.filter((item) => item.group === grading[index].group).length;
    return grading[index].depth * (100 / groupSize); // Percentage offset
}
```

## Date Calculations

### Days Range Calculation

```typescript
function getDaysRange(dateInterval: CalendarDateInterval): [Date, Date, number] {
    const { start, end } = dateInterval;
    const startDate = new Date(start.year, start.month - 1, start.day);
    const endDate = new Date(end.year, end.month - 1, end.day);

    const dayCount = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1;

    return [startDate, endDate, dayCount];
}
```

### Directional Date Navigation

```typescript
class DirectionalCalendarDateCalculator {
    getDateByMonthInDirection(): CalendarDate {
        // Navigate by months for month view
    }

    getDateByDayInDirection(): CalendarDate {
        // Navigate by days for day view
    }

    getDateByWeekInDirection(): CalendarDate {
        // Navigate by weeks for week view (7 days)
    }
}
```

## Condensed Week Rendering

`computeWeekDisplayContext` builds a deterministic description of the week grid before `lms-calendar.ts` renders `<lms-calendar-week>`.

- Reads three CSS tokens from the host element:
    - `--week-day-count` (default 7) – number of day columns at or above the breakpoint.
    - `--week-mobile-day-count` (default 3) – number of columns when the calendar width is below `--week-mobile-breakpoint`.
    - `--week-mobile-breakpoint` (default 768px) – pixel width threshold.
- Uses `getWeekDates(activeDate, firstDayOfWeek)` to fetch the full 7-day sequence.
- If the effective count is less than 7, centers a sliding window of `visibleLength` days around the active date (`visibleStartIndex = clamp(activeIndex - floor((count-1)/2))`) and exposes that subset via `visibleDates`.
- Returns `gridColumns = "var(--time-column-width) repeat(visibleLength, 1fr)"`, so the week component can adjust its CSS grid without recomputing the layout each render.
- The context is passed to the week view and the entry renderer, so timed/all-day entries only iterate the visible subset and peek navigation knows whether to slide left/right.

## Year View Rendering

### Mini-month grid layout

- `<lms-calendar-year>` renders 12 sub-grids inside `.year-grid`. Container queries reduce the column count from 3 → 2 → 1 using the `--year-grid-columns*` custom properties so the overview adapts to any width.
- Each month calculates a `firstDayOffset` via `getFirstDayOffset({ year, month, day: 1 }, firstDayOfWeek)` to prepend empty cells until the desired weekday.
- Weekday headers rely on `getWeekdayOrder(firstDayOfWeek)` and show locale-specific leading characters from `getLocalizedWeekdayShort`.

### Density visualization modes

Counts come from `_entrySumByDay`, a map produced while expanding entries using canonical ISO keys (`${year}-${month}-${day}` with padded segments). The Year component translates counts into three visual styles:

```typescript
if (densityMode === 'dot' && eventCount > 0) {
    classes.push('has-events');
} else if (densityMode === 'heatmap' && eventCount > 0) {
    const bucket = eventCount <= 2 ? 1 : eventCount <= 5 ? 2 : eventCount <= 9 ? 3 : 4;
    densityAttr = `${bucket}`;
} else if (densityMode === 'count' && eventCount > 0) {
    return html`<span class="event-count">${eventCount}</span>`;
}
```

- **Dot**: Adds a pseudo-element using `--year-dot-color`.
- **Heatmap**: Applies `data-density="1-4"` so CSS can map buckets to `--year-heatmap-{1-4}` tokens.
- **Count**: Renders a numeric badge for explicit totals.

### Drill behavior

- Clicking any day emits `expand` with `{ date, drillTarget }`. `drillTarget` mirrors the `year-drill-target` property (`'day'` or `'month'`) so hosts can decide which downstream view to show.
- Month labels always dispatch `{ drillTarget: 'month' }` to guarantee month navigation shortcuts even if `year-drill-target="day"`.
- Host applications can listen for `expand` to update routers, lazy-load data, or log analytics distinct from the standard month/week/day interactions.

## CSS Custom Properties

### Shared Properties

All views use consistent CSS custom properties for alignment:

```css
:root {
    /* Grid spacing */
    --day-gap: 1px;
    --day-padding: 0.5em;
    --day-main-offset: 1em;

    /* Heights */
    --day-header-height: 3.5em;

    /* Borders */
    --separator-border: 1px solid var(--separator-light);
    --sidebar-border: 1px solid var(--separator-light);

    /* Typography */
    --hour-text-align: center;
    --day-text-align: center;
}
```

### View-Specific Overrides

Week view can override Day component properties:

```css
.week-days lms-calendar-day {
    --day-show-time-column: none; /* Hide time column in week view */
    --day-grid-columns: 1fr; /* Single column layout */
    --day-padding: 0; /* No padding in week context */
    --day-all-day-margin: 0; /* Reset all-day margins */
    --day-all-day-font-size: 0.75em; /* Smaller font in week view */
}
```

## Testing & Validation

### Unit Tests

Key calculations are validated with unit tests in `test/unit/week-rendering.test.ts`:

```typescript
describe('Grid row calculations', () => {
    it('should calculate correct grid row for hour indicators', () => {
        expect(getHourIndicatorRow(0)).to.equal(1);
        expect(getHourIndicatorRow(12)).to.equal(721);
        expect(getHourIndicatorRow(23)).to.equal(1381);
    });

    it('should have exactly 1440 total grid rows for 24 hours', () => {
        expect(24 * 60).to.equal(1440);
    });
});
```

### Visual Alignment Verification

To verify pixel-perfect alignment:

1. **Grid boundaries**: Add temporary borders to see grid structure
2. **Debug containers**: Use colored backgrounds to verify positioning
3. **Console logging**: Output slot names and positioning data
4. **Cross-view comparison**: Ensure Day and Week views align identically

### Common Issues and Solutions

| Issue                   | Cause                                            | Solution                                                |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------- |
| Misaligned columns      | Different gap/padding between header and content | Use identical CSS properties                            |
| Events in wrong columns | Incorrect slot naming or positioning             | Verify slot name generation                             |
| Height overflow         | Missing height constraints                       | Apply proper calc() and flex properties                 |
| Separator gaps          | Off-by-one in row calculations                   | Use hour _ 60 for separators, hour _ 60 + 1 for content |

## Best Practices

1. **Consistency**: Always use the same 1440-row grid system for time-based views
2. **Testing**: Write unit tests for all calculation functions
3. **Documentation**: Update this document when calculations change
4. **Debugging**: Use debug CSS and console logs to verify calculations
5. **Performance**: Cache expensive calculations when possible
6. **Validation**: Validate all date/time inputs before calculations

## Related Files

- `src/components/Day.ts` - Day view implementation
- `src/components/Week.ts` - Week view implementation
- `src/components/Month.ts` - Month view implementation
- `src/lms-calendar.ts` - Main calendar and entry rendering
- `src/lib/DirectionalCalendarDateCalculator.ts` - Date navigation
- `src/lib/getOverlappingEntitiesIndices.ts` - Overlap calculations
- `src/lib/partitionOverlappingIntervals.ts` - Interval partitioning
- `src/lib/getSortedGradingsByIndex.ts` - Entry positioning
- `test/unit/week-rendering.test.ts` - Calculation tests
