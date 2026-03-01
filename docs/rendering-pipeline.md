---
layout: base.njk
title: 'Rendering Pipeline'
order: 9
tags: docs
section: Internals
---

# Rendering Pipeline

End-to-end documentation of how calendar entries move from raw data to positioned DOM elements. Every formula and constant in this document is drawn from the source.

## Overview

The rendering pipeline has five stages:

1. **Entry Expansion** — Multi-day entries are split into one `ExpandedCalendarEntry` per day they span.
2. **Layout Calculation** — Overlapping timed entries are grouped and assigned depth, width, and offset.
3. **All-Day Row Allocation** — All-day and multi-day events are packed into rows with a greedy first-fit algorithm.
4. **Position CSS Generation** — `SlotManager` converts layout data into absolute-positioning styles.
5. **DOM Rendering** — Day/Week components mount entries into named slots inside `position: relative` containers.

Stages 1–4 are pure functions called from `lms-calendar.ts` during `render()`. Stage 5 is handled by the Lit component tree.

---

## 1. Entry Expansion

### `_computeEntryCaches()`

Called in `willUpdate()` whenever the `entries` property changes. It:

- Expands entries via `_expandEntryMaybe()`.
- Groups results into `_expandedByISODate` (`Map<string, ExpandedCalendarEntry[]>`) keyed by `YYYY-MM-DD` for O(1) per-day lookups.
- Pre-computes `_monthViewSorted` (sorted + color-annotated) and `_entrySumByDay` (per-day event counts for mobile badges).
- Clears `_layoutCache` and `_allDayLayoutCache` so stale layouts are recomputed.

### `_expandEntryMaybe()`

Given a `CalendarEntry` that spans N days, produces N `ExpandedCalendarEntry` objects — one per calendar day — each with its `date.start/end` adjusted to that day.

Each expanded entry carries a `continuation` object:

```typescript
{
    has: boolean; // true if the original entry spans multiple days
    is: boolean; // true for the second day onward (index > 0)
    index: number; // 0-based day offset within the span
    total: number; // total number of days the original entry covers
}
```

The map key for each expanded entry is the ISO date of its start day (`YYYY-MM-DD`), so a 3-day event starting March 1 produces entries under `2026-03-01`, `2026-03-02`, and `2026-03-03`.

---

## 2. All-Day Detection

### `_isEffectivelyAllDay()`

Returns `true` when any of these hold:

- The entry has no `time` property.
- The entry's duration is ≥ 23 hours.
- The entry is part of a multi-day continuation (`continuation.has || continuation.is`).

This determines whether an entry goes into the all-day section or the timed grid.

---

## 3. Overlap Layout (LayoutCalculator)

`LayoutCalculator` is a stateless class that converts a list of timed entries into positioned boxes. Three stages:

### `eventsToIntervals()`

Converts each entry's start/end time to a minute-of-day offset:

```
startMinute = hour * 60 + minute
endMinute   = hour * 60 + minute
```

### `calculateGrading()`

Groups overlapping intervals using transitive-closure overlap detection (`findOverlapGroups()`). Within each group:

- The longest event gets **depth 0**.
- Remaining events are assigned incrementing depths (1, 2, 3, …).
- Single-event groups get depth 0 trivially.

### `calculateBoxes()`

Converts gradings into `LayoutBox` records with concrete positioning:

| Property  | Depth 0 (primary) | Depth > 0 (overlapping)                         |
| --------- | ----------------- | ----------------------------------------------- |
| `x`       | `0`               | `(depth / maxDepth) * (100 - minReadableWidth)` |
| `width`   | `100`             | `100 - x`                                       |
| `opacity` | `0.95`            | `max(0.85, 0.95 - depth * 0.05)`                |
| `zIndex`  | `100`             | `100 + depth`                                   |

**`minReadableWidth = 65`** — overlapping events are always at least 65% wide. The remaining 35% (`maxRange`) is distributed across depth levels via cascading offset so deeper events peek out from behind the primary.

A single-event group always gets `x = 0, width = 100`.

### Caching

Results are cached in `_layoutCache` keyed by ISO date (`YYYY-MM-DD`). The cache is cleared when `entries` changes.

---

## 4. All-Day Row Allocation

### `allocateAllDayRows()`

A greedy first-fit algorithm that packs all-day events into rows without visual overlap.

**Algorithm:**

1. Separate multi-day events (sorted by start day) from single-day events.
2. Assign multi-day events first — they need a row that is free across **all** their days.
3. Assign single-day events to the first available row on their day.
4. Track occupancy with `rowOccupancy[day] = Set<row>`.

**Output:** `{ rowAssignments: Map<eventId, row>, totalRows: number }`.

`totalRows` is the maximum number of rows used on any single day — this drives the height of the all-day container.

### `computeSpanClass()`

Assigns a CSS class to each day-segment of a multi-day event:

| Class        | Condition                                     | Effect                                  |
| ------------ | --------------------------------------------- | --------------------------------------- |
| `first-day`  | First visible day of the span                 | Left border-radius, no right radius     |
| `middle-day` | Between first and last                        | No border-radius, left separator border |
| `last-day`   | Last visible day of the span                  | Right border-radius, left separator     |
| `single-day` | Span is 1 day, or first and last are the same | Full border-radius on both sides        |

Week.ts applies corresponding CSS rules so multi-day events render as a connected strip across day columns.

### Caching

Results are cached in `_allDayLayoutCache` with a composite key that includes the condensed week offset, so full-week and condensed-week layouts coexist.

---

## 5. Absolute Positioning (SlotManager)

`SlotManager` is the bridge between layout data and CSS. Its `generatePositionCSS()` method produces the inline `style` string for each entry.

### Timed entries (absolute positioning)

```css
position: absolute;
top: calc(${startMinute} * var(--minute-height));
height: calc(${durationMinutes} * var(--minute-height));
min-height: calc(20 * var(--minute-height));          /* 20-minute minimum */
width: ${layoutBox.width}%;
left: ${layoutBox.x}%;
z-index: ${layoutBox.zIndex};
opacity: ${layoutBox.opacity};
```

The `top` and `height` formulas use the `--minute-height` CSS custom property set by the ResizeObserver in Day/Week components.

### All-day entries (slot-based positioning)

All-day entries don't use absolute positioning. They flow inside slot containers. SlotManager still sets `--entry-width`, `--entry-margin-left`, `--entry-z-index`, and `--entry-opacity` as CSS custom properties.

### Slot naming conventions

| View  | Entry type | Slot name          |
| ----- | ---------- | ------------------ |
| Day   | timed      | `timed`            |
| Day   | all-day    | `all-day`          |
| Week  | timed      | `timed-YYYY-M-D`   |
| Week  | all-day    | `all-day-YYYY-M-D` |
| Month | —          | `YYYY-M-D`         |

### Accessibility

`calculateAccessibility()` produces `tabIndex`, `role`, and `aria-label` for each entry:

- **Week timed:** `10000 + dayOfWeek * 10000 + hour * 100 + minute` (navigation order: left-to-right, then top-to-bottom).
- **Day timed:** `hour * 60 + minute`.
- **All-day week:** `1000 + dayOfWeek`.
- **All-day day:** `0`.

---

## 6. Time Grid Sizing

Day.ts and Week.ts share the same ResizeObserver pattern to make the time grid fill the viewport.

### The `--minute-height` calculation

In `firstUpdated()` and on resize:

```
viewportHeight = scrollContainer.clientHeight
minuteHeight = viewportHeight / 720
```

**Why 720?** 720 minutes = 12 hours. This ensures exactly 12 hours fill the visible viewport, which is a comfortable default — the user sees half a day without scrolling.

### Derived tokens

All four tokens are set explicitly on the host element:

| Token                | Value                 | Purpose                        |
| -------------------- | --------------------- | ------------------------------ |
| `--minute-height`    | `${m}px`              | Base unit for all positioning  |
| `--hour-height`      | `${m * 60}px`         | Hour label spacing, grid lines |
| `--day-total-height` | `${m * 1440}px`       | Total scrollable height (24h)  |
| `--half-day-height`  | `${viewportHeight}px` | Matches the actual viewport    |

These are set as inline styles rather than calculated with `calc()` in CSS because CSS custom property resolution scope means a child component cannot reliably read a `calc()`-based token set on a parent — each value must be a resolved length.

### Scroll snap

Hour labels at hours 0, 12, and 24 carry `scroll-snap-align: start`. On initial render the container scrolls to the noon snap target so the working day is immediately visible.

---

## 7. DOM Structure

### Day.ts

```
:host
└─ .wrapper (flex column, height: 100%)
    ├─ .day-header (grid)
    │   ├─ .time-header
    │   └─ .day-label
    ├─ .all-day-wrapper (when allDayRowCount > 0)
    │   └─ .all-day
    │       └─ <slot name="all-day">
    └─ .container (flex: 1, overflow)
        └─ .main (CSS grid: time-column + content, position: relative)
            ├─ .time-labels (grid-column: 1)
            │   └─ .hour-label × 25 (absolute positioned)
            └─ .timed-content (grid-column: 2, position: relative)
                └─ <slot name="timed">
```

`.timed-content` is the positioning context for absolute-positioned entries. Its height is `var(--day-total-height)` (1440 minutes worth). Hourly gridlines are drawn with a `repeating-linear-gradient`:

```css
background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(var(--hour-height) - 1px),
    var(--separator-light) calc(var(--hour-height) - 1px),
    var(--separator-light) var(--hour-height)
);
```

Hour labels use absolute positioning: `top: calc(${hour} * var(--hour-height))`.

### Week.ts

```
:host
└─ .week-container (flex column, height: 100%)
    ├─ .week-header (grid, --calendar-grid-columns-week)
    │   ├─ .time-header
    │   └─ .day-label × N
    ├─ .peek-indicators (when condensed)
    │   ├─ .peek-indicator (left)
    │   └─ .peek-indicator (right)
    ├─ .all-day-wrapper (when allDayRowCount > 0)
    │   └─ .all-day-container (grid, --calendar-grid-columns-week)
    │       ├─ .all-day-time-header
    │       └─ .all-day-day-column × N
    │           └─ <slot name="all-day-YYYY-M-D">
    └─ .week-scroll (grid, flex: 1, overflow-y: auto)
        ├─ .time-labels (grid-column: 1)
        └─ .day-column × N (grid-column: 2+, position: relative)
            └─ <slot name="timed-YYYY-M-D">
```

Each `.day-column` is a `position: relative` container. Entries slotted into `timed-YYYY-M-D` are absolutely positioned within their column. The same ResizeObserver pattern as Day.ts computes `--minute-height` from `.week-scroll.clientHeight`.

---

## 8. Condensed Week View

`computeWeekDisplayContext()` builds a deterministic description of the visible week grid before rendering.

### CSS tokens

| Token                      | Default | Purpose                            |
| -------------------------- | ------- | ---------------------------------- |
| `--week-day-count`         | `7`     | Columns at or above the breakpoint |
| `--week-mobile-day-count`  | `3`     | Columns below the breakpoint       |
| `--week-mobile-breakpoint` | `768px` | Width threshold for condensing     |

### Algorithm

1. Read the three tokens from the host element (falling back to defaults).
2. Determine effective column count: `effectiveCount = calendarWidth < breakpoint ? mobileCount : fullCount`.
3. If `effectiveCount >= 7`, return the full week — no condensing needed.
4. Find the active date's index in the full 7-day week.
5. Center a sliding window: `idealStart = activeIndex - floor((effectiveCount - 1) / 2)`, clamped to `[0, 7 - effectiveCount]`.
6. Slice `visibleDates` from the full week and build `gridColumns = "var(--time-column-width) repeat(${effectiveCount}, 1fr)"`.

### Output

```typescript
{
    weekDates: CalendarDate[];       // Full 7-day week
    visibleDates: CalendarDate[];    // Subset to render
    visibleStartIndex: number;       // Offset into weekDates
    visibleLength: number;           // Column count (1–7)
    isCondensed: boolean;            // true when < 7 columns
    gridColumns: string;             // CSS grid-template-columns
}
```

Peek navigation indicators ("‹ more" / "more ›") appear when there are hidden days to the left or right.

---

## 9. Entry Density & Smart Layout

### `_determineDensity()`

Returns one of three density levels based on the entry's effective duration:

| Duration            | Density    | Effect                           |
| ------------------- | ---------- | -------------------------------- |
| No time / all-day   | `compact`  | Single-line, minimal padding     |
| < 30 minutes        | `compact`  | Single-line, minimal padding     |
| 30–120 minutes      | `standard` | Title + time side-by-side        |
| > 120 min + content | `full`     | Multi-line: title, time, content |

### `_getSmartLayout()`

Determines flex direction for the entry interior:

- **`row`**: Non-overlapping entries (full width available) — title and time sit side-by-side.
- **`column`**: Overlapping entries with sufficient height (≥ 40px) — title stacks above time.

The result is applied via the `--entry-layout` CSS custom property.

### Entry.ts color handle

Each timed entry renders a left-edge color indicator via a `::before` pseudo-element:

```css
:host::before {
    width: var(--entry-handle-width, 0px); /* 4px in day/week views */
    background-color: var(--entry-handle-color, transparent);
}
```

The handle color is set from the entry's `color` property by `lms-calendar.ts` during rendering.

---

## 10. Caching Strategy

Two layout caches avoid redundant computation:

### `_layoutCache` (per ISO date)

- **Key:** `YYYY-MM-DD`
- **Value:** `LayoutResult` (the `boxes` array from `LayoutCalculator`)
- **Lookup:** Before calling `LayoutCalculator.calculateLayout()`, check if the day's result is already cached.
- **Invalidation:** Cleared in `_computeEntryCaches()` when `entries` changes.

### `_allDayLayoutCache` (composite key)

- **Key:** Composite string including visible day offsets (so full-week and condensed layouts are cached separately).
- **Value:** `{ rowAssignments, mergedEvents, totalRows }`
- **Invalidation:** Cleared alongside `_layoutCache` on entry changes.

Both caches are `Map` instances on the component, so they are garbage-collected with the element.

---

## Related Files

| File                                   | Role                                                |
| -------------------------------------- | --------------------------------------------------- |
| `src/lms-calendar.ts`                  | Entry expansion, cache management, render dispatch  |
| `src/lib/SlotManager.ts`               | Position CSS generation, slot naming, accessibility |
| `src/lib/LayoutCalculator.ts`          | Overlap detection, box layout (width/offset/z)      |
| `src/lib/allDayLayout.ts`              | Row allocation for all-day events                   |
| `src/lib/computeWeekDisplayContext.ts` | Condensed week algorithm                            |
| `src/lib/ViewStateController.ts`       | Per-instance view mode and active date              |
| `src/components/Day.ts`                | Day view DOM, ResizeObserver, time grid             |
| `src/components/Week.ts`               | Week view DOM, condensed layout, all-day styling    |
| `src/components/Entry.ts`              | Entry rendering, density modes, color handle        |
