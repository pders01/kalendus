---
layout: base.njk
title: 'Rendering Pipeline'
order: 9
tags: docs
section: Internals
---

# Rendering Pipeline

How calendar entries move from raw data to positioned DOM elements in the [0.12.0 source revision](https://github.com/pders01/kalendus/tree/v0.12.0). The source modules are authoritative for formulas and constants; the helpers below are not package exports. See [Library Usage](./library-usage.md) for public contracts.

## Overview

The rendering pipeline has five stages:

1. **Normalization and bounded expansion** — Validate civil endpoints/identity, then split only the visible intersection into per-day segments.
2. **Layout Calculation** — Overlapping timed entries are grouped and assigned depth, width, and offset.
3. **All-Day Row Allocation** — Explicit all-day and legacy-promoted records are packed into rows. Explicit timed multi-day records stay timed.
4. **Position CSS Generation** — `SlotManager` converts layout data into absolute-positioning styles.
5. **DOM Rendering** — Day/Week components mount entries into named slots inside `position: relative` containers.

When `entries` changes, the root normalizes and sorts a separate array in `willUpdate()`. The same update prepares range-dependent caches; render helpers consume them and mount the component tree. `calendar-state-change` reports the initial and changed snapshots after the root render. It does not wait for descendants or geometry observers to finish.

---

## 1. Entry Expansion

### `_computeEntryCaches()`

Called in `willUpdate()` when entries or the derived range key changes. The key includes range, view, week start, and Month presentation. The method:

- Expands normalized entries via `expandEntries()` in `src/lib/calendarModel.ts`, clipped to the range being rendered. A visible segment-budget failure clears caches and reports `entries-error` rather than truncating. Invalid-record diagnostics (`entries-invalid`) come from normalization, not expansion.
- Groups results into `_expandedByISODate`, keyed by each supported date's `YYYY-MM-DD` for direct per-day lookups. Month and Year derive counts from these buckets. An exclusive range end can be `10000-01-01`; a simple string comparison across that boundary does not order the dates.
- Calls `buildMonthPreviews()` in `src/lib/monthPreviews.ts` for Month when previews are applicable, preserving gaps in multi-day span lanes. Month measures cell capacity and reports it to the root, which uses the measured capacity when rendering previews. Positioning and rendering share unpadded date and slot names in `src/lib/entrySlots.ts`; those names are not sortable ISO dates.
- Clears `_layoutCache` and `_allDayLayoutCache` so stale layouts are recomputed.

`prepareAgendaEntries()` in `src/lib/agendaEntries.ts` selects the page for a date or density disclosure. The helper retains the original segments, orders all-day before timed, and applies the appropriate shared or per-section limit. The root still owns the selected date, disclosure state, focus, and public events.

### `normalizeEntries()` / `expandEntries()`

The model visits the entire assigned array, validating civil dates, kind, ID, zone, and any applicable time endpoints (including zoned DST gaps and ambiguities). Duplicate caller IDs or source objects use the first valid record. A nonarray is treated as empty without per-entry diagnostics. Caller objects are retained as canonical records, not mutated; the runtime tolerates a missing `heading` by rendering an empty string, but typed callers should still supply `CalendarEntry.heading`.

For an entry spanning N days, expansion creates only segments intersecting the half-open visible range, with segment `date.start/end` adjusted to the displayed day. All-day inputs have inclusive date ends. Explicit timed entries represent one continuous interval with an exclusive end; interior segments use midnight boundaries, and an exclusive midnight end does not create another day. Canonical original endpoints remain available for activation/ICS export.

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

The root now consumes `isAllDay` from the normalized model rather than recomputing it with a view helper. Explicit `kind: 'all-day'` ignores `time`. Explicit `kind: 'timed'` requires time endpoints and is never promoted, even across dates. A kind-less daily time window must pass validation before legacy promotion: reversed clock times can be rejected even across dates. Valid kind-less records are promoted for missing time, multi-day dates, an end-hour minus start-hour of at least 23, or `isContinuation: true`. Use explicit kinds rather than sentinel time windows; see [data contracts](./library-usage.md#data-contracts).

---

## 3. Overlap Layout (LayoutCalculator)

`LayoutCalculator.calculateLayout()` converts validated timed entries into positioned boxes. It accepts the effective `minuteHeight` and `eventMinHeight`, so collision intervals include the rendered minimum height rather than only semantic duration. Point/short events therefore participate in collision handling without changing their canonical endpoints.

Entries are sorted deterministically by start, descending duration, identity and input index. A sweep groups connected overlap components; heaps reuse lanes as intervals end. Equal endpoints do not collide unless minimum display geometry extends them.

`layoutTimedEntries()` prepares one day of segments for `layoutMode: 'columns'`. Equal reusable lanes expose `columnIndex` and the connected group's peak `columnCount`. In marker mode, the helper can move the label collision envelope earlier near midnight without changing the segment times or canonical endpoints. `getDenseTimedGroups()` selects connected groups with multiple lanes whose measured per-lane width is strictly below the readability threshold.

A timed group opens a bounded panel for exactly those occurrences, leaving the timeline mounted. Dismissal returns focus to the count if still sufficiently visible, otherwise to the timeline. Week all-day totals instead replace the grid with the date's all-day list and restore the timed position when the grid returns. Neither action writes to the view-state controller. Those lists and the Month agenda share an event-row template; plain rows invoke the inspector, while accordion rows disclose details inline.

For compatibility, the internal `LayoutCalculator` still defaults to cascade when called without a layout mode. Only that mode uses these rules:

| Property  | Depth 0 (primary) | Depth > 0 (overlapping)                         |
| --------- | ----------------- | ----------------------------------------------- |
| `x`       | `0`               | `(depth / maxDepth) * (100 - minReadableWidth)` |
| `width`   | `100`             | `100 - x`                                       |
| `opacity` | `0.95`            | `max(0.85, 0.95 - depth * 0.05)`                |
| `zIndex`  | `100`             | `101 + chronological paint index`               |

**`minReadableWidth = 65`** — overlapping events are always at least 65% wide. The remaining 35% (`maxRange`) is distributed across depth levels via cascading offset so deeper events peek out from behind the primary.

A single-event group always gets `x = 0, width = 100`. The opacity values above remain calculator metadata; root rendering uses opaque surfaces. Reusing a lane never reuses an earlier paint index. Standalone cascade can still occlude content; the root's columns/disclosure policy avoids treating that compatibility mode as a complete density solution.

### Caching

Results are cached in `_layoutCache` by ISO date and timed presentation (`card` or `marker`). The cache is cleared when entries, the visible range/view key or effective grid scale/minimum geometry changes. Width-dependent density is calculated separately, so the same boxes can serve both wide and narrow layouts.

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

`totalRows` is one more than the highest occupied row index (or zero when empty). It includes any gaps in the row sequence and drives the height of the all-day container.

### `layoutAllDaySegments()` and `joinVisibleSpans()`

Month, Day, and Week allocate lanes by occurrence and keep one placement per occupied date for counts and capacity. They supply display columns, independently of the canonical dates. Day and Week cache these placements by the visible window.

Month filters the sparse lanes by each date's measured capacity. Week first decides whether to show per-date totals. Where previews are shown, `joinVisibleSpans()` joins adjacent all-day placements in the same week row. A hidden date or week break splits a bar, and open edges indicate that the event continues. Timed segments never join. A bar opens the canonical event and announces the full date range, even when only part of it is visible.

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

All-day bars use a grid lane in their first visible date's slot. Their inline size covers the occupied columns and intervening gutters, without changing the date tracks or adding duplicate actions. Dense or narrow Week uses count controls in the date slots instead.

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

`Day.ts` and `Week.ts` use `TimeGridSizingController` to observe the timed scroller, coalesce frame writes, reconnect observation, and cancel queued work on disconnect. In 0.12.0, a definite embed height bounds all four views; without one, Month grows in page flow and Day, Week, and Year get bounded fallbacks. Version 0.11.0 used the scrollable detail scale for Day/Week and left Month unsized; see [Height and Scrolling](./layout-and-positioning.md#height-and-scrolling). The 24-hour content cannot feed back into the timed viewport's size.

### The `--minute-height` calculation

On connection and observed resize:

```
viewportHeight = timedScroller.clientHeight
available = viewportHeight - usedPaddingTop - usedPaddingBottom
fit = available >= 24 * max(fontSize, 1.25 * leadingAxisInset) ? available / 1440 : 0
detail = max(viewportHeight / 720, fontSize * 2.75 / 60)
minuteHeight = (scrollTimeGrid || preferDetail || !fit) ? detail : fit
```

The scroller measures the space below the toolbar, date headers, and all-day band. Padding includes the axis insets and any late-preview tail. A fitted grid labels alternate hours if an hour is shorter than 1.5 axis label line boxes, but still draws every hour line. The detail scale aims for a 12-hour window and has a font-relative floor; it does not guarantee exactly 12 visible hours.

The root can veto fitting even when the child measures enough height. For automatic timed **cards**, `_prefersDetail()` compares grouping at the fitted and detail scales for the visible dates, with the same column width and measured minimum card geometry. If the larger scale would split groups or keep more cards readable, the root passes the scrollable-detail preference to the child. The public `scrollTimeGrid` option (default `false`) also forces that scale.

### Derived tokens

The sizing controller writes these inline on the Day or Week **child host**, not the public `<lms-calendar>` element:

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

The Month grid and its compact contextual list stay in one flow. In a sized embed, the view area scrolls as needed, not the grid and list separately. Unsized Month grows in page flow. The contextual list still uses explicit continuation.

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
        └─ .main.timeline (scrollable grid: time-column + content)
            ├─ .time-labels (grid-column: 1)
            │   └─ .hour-label × 25 (absolute; alternate labels can be hidden)
            └─ .timed-content (grid-column: 2, position: relative)
                └─ <slot name="timed">
```

In Day, `.container` holds the `.main.timeline` scroller, which is the grid shown above. Its `.timed-content` positions absolute entries and has a block size of `var(--day-total-height)` (1440 minutes). The shared grid styles tile a one-pixel `--separator-light` gradient at `background-size: 100% var(--hour-height)` in Day and Week. Hour labels use absolute offsets of the hour index times `--hour-height`.

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
    └─ .week-scroll.timeline (scrollable grid)
        ├─ .time-labels (grid-column: 1)
        └─ .day-column × N (grid-column: 2+, position: relative)
            └─ <slot name="timed-YYYY-M-D">
```

Each `.day-column` is a `position: relative` container. Entries slotted into `timed-YYYY-M-D` are absolutely positioned within their column. The shared sizing controller measures the timeline scroller; the root reads effective scale and minimum entry geometry to invalidate timed layout.

---

## 8. Condensed Week View

`computeWeekDisplayContext()` builds a deterministic description of the visible week grid before rendering.

### CSS tokens

See [Week View — Condensed Mode](./css-tokens.md#week-view--condensed-mode) for the four Week overrides, including `--week-min-day-width`. The helper also reads `--time-column-width`.

### Algorithm

1. Request the mobile count below the measured breakpoint and the full count at or above it.
2. Reserve the time gutter and one host-font-size of horizontal space. If the readable column floor is positive, divide the remaining width by that floor and round down, keeping at least one column. Cap the requested count by that capacity **on both sides of the breakpoint**. A zero floor skips the cap.
3. Find the active date's index in the full seven-day week. Center the window at `activeIndex - floor((effectiveCount - 1) / 2)`, clamped to `[0, 7 - effectiveCount]`.
4. Slice `visibleDates` and build `gridColumns = "var(--time-column-width) repeat(${effectiveCount}, 1fr)"`. Fewer than seven columns means the week is condensed, even above the breakpoint.

### Output

```typescript
{
    weekDates: CalendarDate[];       // Full 7-day week
    visibleDates: CalendarDate[];    // Subset to render
    visibleStartIndex: number;       // Offset into weekDates
    visibleLength: number;           // Column count (1–7)
    isCondensed: boolean;            // true when < 7 columns
    canShowAllDayTitles: boolean;    // At least 7 host font sizes per day
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

`_determineDensity()` is a fallback when the render path has not supplied a density: no time or under 30 minutes yields `compact`; over 120 minutes with content yields `full`; otherwise it yields `standard`. This does **not** describe the rendered timed-card policy. Day/Week timed entries explicitly pass `standard` rather than switching between density modes by duration. Month previews and all-day spans use their own display modes.

### `_getSmartLayout()`

The root chooses the direction for each timed lane using its rendered width and height, not its overlap index. A lane is narrow when its measured width is below `12` host-font-size units or the whole column requires stacking to leave room for the title. A narrow lane gets `column` only when its box also clears the measured stacking minimum (at least `40px`); otherwise it gets `row`. The root writes the result per card as `--entry-layout`.

The card puts the title first and time metadata second in either direction. Row layout allows wrapping and reserves title space. The time range shares a one-line label: if the dash and end time cannot fit, they wrap together out of the visible line. The canonical interval and full accessible label do not change. Unreadable multi-lane groups use an explicit count instead of overlapping cards.

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

### `_layoutCache` (per ISO date and presentation)

- **Key:** `YYYY-MM-DD:card` or `YYYY-MM-DD:marker`
- **Value:** `LayoutResult` (the `boxes` array from `LayoutCalculator`)
- **Lookup:** Before calling `layoutTimedEntries()`, check if the day's result is already cached.
- **Invalidation:** Cleared on entry/range/view changes and effective grid scale/minimum geometry changes.

### `_allDayLayoutCache` (composite key)

- **Key:** Composite string including visible day offsets (so full-week and condensed layouts are cached separately).
- **Value:** `{ placements, totalRows }`, with one placement per visible segment.
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
