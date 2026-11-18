---
layout: base.njk
title: 'Rendering Pipeline'
order: 9
tags: docs
section: Internals
---

# Rendering Pipeline

Overview of how calendar entries move from raw data to positioned DOM elements. The source modules are authoritative for current formulas and constants; public ingestion/state contracts are documented in [Library Usage](./library-usage.md).

## Overview

The rendering pipeline has five stages:

1. **Normalization and bounded expansion** — Validate civil endpoints/identity, then split only the visible intersection into per-day segments.
2. **Layout Calculation** — Overlapping timed entries are grouped and assigned depth, width, and offset.
3. **All-Day Row Allocation** — Explicit all-day and legacy-promoted records are packed into rows. Explicit timed multi-day records stay timed.
4. **Position CSS Generation** — `SlotManager` converts layout data into absolute-positioning styles.
5. **DOM Rendering** — Day/Week components mount entries into named slots inside `position: relative` containers.

The root normalizes when `entries` changes and computes range-dependent caches in `willUpdate()`. Layout results are cached and consumed by render helpers; the Lit component tree mounts the results. Public committed state is emitted after the root render, including the initial snapshot.

---

## 1. Entry Expansion

### `_computeEntryCaches()`

Called in `willUpdate()` when entries or the committed visible range/view/week-start key changes. It:

- Expands normalized entries via `expandEntries()` in `src/lib/calendarModel.ts`, clipped to `visibleRange`. Invalid records report `entries-invalid`; a visible segment-budget failure clears caches and reports `entries-error` rather than truncating.
- Groups results into `_expandedByISODate` (`Map<string, ExpandedCalendarEntry[]>`) keyed by `YYYY-MM-DD` for O(1) per-day lookups.
- Prepares Month rows by date, preserving gaps in multi-day span lanes. Month measures cell capacity before the owner creates preview elements. `_entrySumByDay` retains full per-date counts, including entries not mounted in the grid.
- Clears `_layoutCache` and `_allDayLayoutCache` so stale layouts are recomputed.

### `normalizeEntries()` / `expandEntries()`

The model validates civil dates, time endpoints, explicit kind and IANA zone, rejecting DST gaps/ambiguous endpoints. Stable caller IDs are authoritative; duplicate IDs/source objects use the first valid record. Caller objects are retained as canonical records, not mutated.

For an entry spanning N days, expansion creates only segments intersecting the half-open visible range, with segment `date.start/end` adjusted to the displayed day. Explicit timed entries represent one continuous interval; interior segments use midnight boundaries, and an exclusive midnight end does not create another day. Canonical original endpoints remain available for activation/ICS export.

Each expanded entry carries a `continuation` object:

```typescript
{
    has: boolean; // true if the entry continues after this segment
    is: boolean; // true for the second day onward (index > 0)
    index: number; // 0-based day offset within the span
    total: number; // total number of days the original entry covers
}
```

The map key for each expanded entry is the ISO date of its start day (`YYYY-MM-DD`), so a 3-day event starting March 1 produces entries under `2026-03-01`, `2026-03-02`, and `2026-03-03`.

---

## 2. All-Day Detection

### `_isEffectivelyAllDay()`

Uses the normalized all-day decision. Explicit `kind: 'all-day'` wins; explicit `kind: 'timed'` never becomes all-day merely because it crosses dates. Without `kind`, missing time, multi-day dates, an end-hour minus start-hour of at least 23, or `isContinuation: true` preserves legacy promotion.

All-day date ends remain inclusive; explicit timed endpoints have an exclusive end. See [data contracts](./library-usage.md#data-contracts) rather than relying on sentinel time windows.

---

## 3. Overlap Layout (LayoutCalculator)

`LayoutCalculator.calculateLayout()` converts validated timed entries into positioned boxes. It accepts the effective `minuteHeight` and `eventMinHeight`, so collision intervals include the rendered minimum height rather than only semantic duration. Point/short events therefore participate in collision handling without changing their canonical endpoints.

Entries are sorted deterministically by start, descending duration, identity and input index. A sweep groups connected overlap components; heaps reuse lanes as intervals end. Equal endpoints do not collide unless minimum display geometry extends them.

The root opts into `layoutMode: 'columns'`: equal reusable lanes expose `columnIndex` and the connected group's peak `columnCount`. Groups whose measured lanes cannot remain readable become disclosures opening precisely those real segments. Metadata stays next to titles; start/end ranges make minimum-height short events distinguishable from long events.

For compatibility, standalone `LayoutCalculator` still defaults to cascade. Only that mode uses these rules:

| Property  | Depth 0 (primary) | Depth > 0 (overlapping)                         |
| --------- | ----------------- | ----------------------------------------------- |
| `x`       | `0`               | `(depth / maxDepth) * (100 - minReadableWidth)` |
| `width`   | `100`             | `100 - x`                                       |
| `opacity` | `0.95`            | `max(0.85, 0.95 - depth * 0.05)`                |
| `zIndex`  | `100`             | `101 + chronological paint index`               |

**`minReadableWidth = 65`** — overlapping events are always at least 65% wide. The remaining 35% (`maxRange`) is distributed across depth levels via cascading offset so deeper events peek out from behind the primary.

A single-event group always gets `x = 0, width = 100`. The opacity values above remain calculator metadata; root rendering uses opaque surfaces. Reusing a lane never reuses an earlier paint index. Standalone cascade can still occlude content; the root's columns/disclosure policy avoids treating that compatibility mode as a complete density solution.

### Caching

Results are cached in `_layoutCache` keyed by ISO date (`YYYY-MM-DD`). The cache is cleared when entries, the visible range/view key or effective grid scale/minimum geometry changes.

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

| Class        | Condition                                     | Effect                                   |
| ------------ | --------------------------------------------- | ---------------------------------------- |
| `first-day`  | First visible day of the span                 | Start border-radius, no end radius       |
| `middle-day` | Between first and last                        | No border-radius, start separator border |
| `last-day`   | Last visible day of the span                  | End border-radius, start separator       |
| `single-day` | Span is 1 day, or first and last are the same | Full border-radius on both sides         |

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
width: ${layoutBox.width}%;
inset-inline-start: ${layoutBox.x}%;
z-index: ${layoutBox.zIndex};
opacity: ${layoutBox.opacity};
```

The `top` and `height` formulas use the `--minute-height` token set by the shared sizing controller. `durationMinutes` comes from layout's effective minimum display geometry, not a separate CSS-only duration clamp. Offscreen week dates are rejected rather than silently placed in the first column.

### All-day entries (slot-based positioning)

All-day chips don't use absolute positioning. They flow inside slot containers. SlotManager still sets `--entry-width`, `--entry-margin-inline-start`, `--entry-z-index`, and `--entry-opacity` as CSS custom properties. For dense or narrow Week, date count controls use the same slots and the chips are not mounted; the timed entries are unchanged.

### Slot naming conventions

| View  | Entry type | Slot name          |
| ----- | ---------- | ------------------ |
| Day   | timed      | `timed`            |
| Day   | all-day    | `all-day`          |
| Week  | timed      | `timed-YYYY-M-D`   |
| Week  | all-day    | `all-day-YYYY-M-D` |
| Month | —          | `YYYY-M-D`         |

### Accessibility

`calculateAccessibility()` produces `tabIndex: 0`, `role: 'button'` and a localized label. Chronological DOM order owns sequential focus; positive tabindex formulas are not used. Date-grid roving focus is handled separately by the view components. These semantics still require real browser/assistive-technology verification.

---

## 6. Time Grid Sizing

Day.ts and Week.ts use `TimeGridSizingController` to observe the timed scroller, coalesce frame writes, reconnect observation and cancel queued work on disconnect. The calendar supplies a bounded fallback viewport when no embed height resolves. The 24-hour content cannot feed back into that viewport's size.

### The `--minute-height` calculation

On connection and observed resize:

```
viewportHeight = timedScroller.clientHeight
minuteHeight = max(viewportHeight / 720, hostFontSize * 2.75 / 60)
```

**Why 720?** 720 minutes = 12 hours. At ordinary sizes this targets a half-day viewport. A font-relative hour floor preserves readable event text in short embeds and at enlarged text sizes, trading visible hours for scrolling. Root layout measures a full text line plus padding/borders, the second time line and gaps, and available inline title space; narrow columns reserve enough display height to stack both without changing canonical endpoints.

### Derived tokens

All four tokens are set explicitly on the host element:

| Token                | Value           | Purpose                                          |
| -------------------- | --------------- | ------------------------------------------------ |
| `--minute-height`    | `${m}px`        | Base unit for all positioning                    |
| `--hour-height`      | `${m * 60}px`   | Hour label spacing, grid lines                   |
| `--day-total-height` | `${m * 1440}px` | 24-hour coordinate height; excludes preview tail |
| `--half-day-height`  | `${m * 720}px`  | Twelve hours at effective scale                  |

These are resolved inline lengths from the shared geometry calculation. CSS custom
properties can contain `calc()` and inherit normally; the controller writes these
values explicitly to keep all positioning consumers on the same measured scale.

The time columns retain exactly `1440 × minuteHeight` coordinate height. They no
longer clip minimum-height event previews at midnight; the owning scroller reserves
blank trailing space for them. That extra space has no hour labels/grid extension
and must not be interpreted as additional time or a change to canonical endpoints.

### Scrolling and Axis Origin

Day and Week scroll freely with no snap targets. Leading/trailing padding protects the first/last axis labels without moving event coordinates. Time restoration stores a semantic minute relative to that padding and restores it at the new view's scale. Do not rely on an automatic initial scroll-to-noon API.

Month is normal flow, not a vertical scroll viewport. Its compact contextual list uses explicit continuation instead of nested vertical scrolling.

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

Each `.day-column` is a `position: relative` container. Entries slotted into `timed-YYYY-M-D` are absolutely positioned within their column. The shared sizing controller computes the scale from wrapper/header geometry, while the root reads effective scale/minimum entry geometry to invalidate timed layout.

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

The day-window pager moves within the current week. In a condensed Week, the
header’s **Next** button opens the first window of the following week, starting
on the configured first weekday. It keeps the timed scroll position. Full
seven-column Week navigation keeps the active weekday.

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

Each timed entry renders an inline-start color indicator via a `::before` pseudo-element:

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
- **Invalidation:** Cleared on entry/range/view changes and effective grid scale/minimum geometry changes.

### `_allDayLayoutCache` (composite key)

- **Key:** Composite string including visible day offsets (so full-week and condensed layouts are cached separately).
- **Value:** `{ rowAssignments, mergedEvents, totalRows }`
- **Invalidation:** Cleared with range-dependent entry caches on entry/range/view changes.

Both caches are `Map` instances on the component, so they are garbage-collected with the element.

---

## Related Files

| File                                         | Role                                                           |
| -------------------------------------------- | -------------------------------------------------------------- |
| `src/lms-calendar.ts`                        | Entry expansion, cache management, render dispatch             |
| `src/lib/SlotManager.ts`                     | Position CSS generation, slot naming, accessibility            |
| `src/lib/LayoutCalculator.ts`                | Overlap detection, box layout (width/offset/z)                 |
| `src/lib/allDayLayout.ts`                    | Row allocation for all-day events                              |
| `src/lib/weekDisplayContext.ts`              | Condensed week algorithm                                       |
| `src/lib/ViewStateController.ts`             | Per-instance view mode and active date                         |
| `src/lib/calendarModel.ts`                   | Civil endpoints, identity, normalization and bounded expansion |
| `src/components/TimeGridSizingController.ts` | Reconnect-safe grid sizing                                     |
| `src/components/Day.ts`                      | Day view DOM and time grid                                     |
| `src/components/Week.ts`                     | Week view DOM, condensed layout, all-day styling               |
| `src/components/Entry.ts`                    | Entry rendering, density modes, color handle                   |
