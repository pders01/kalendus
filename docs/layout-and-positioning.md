---
layout: base.njk
title: 'Layout & Positioning'
order: 6
tags: docs
section: Layout
---

# Layout & Positioning Guide

Essential information for getting `<lms-calendar>` to display correctly in your application. This covers height requirements, responsive behavior, all-day events, and common layout patterns.

---

## Height and Scrolling

A supplied height sizes the **whole calendar**, including its toolbar, in all four views. Give the parent a definite height, stretch the calendar in a sized Grid or flex layout, or set its height directly. The toolbar stays in the same place when the view changes; remaining space belongs to the view.

Each view uses the same rule: use spare height when available, reduce optional spacing or detail before shrinking content past its readable minimum, then scroll when it still cannot fit.

| View | With enough height | When space is limited |
| --- | --- | --- |
| Day / Week | Fit all 24 hours, with hourly labels or alternating labels. | Scroll the timeline at a readable scale. The all-day band can scroll independently. |
| Month | Let six preview rows share spare height. | Show fewer previews with exact overflow counts. Scroll the view if the date grid or selected-date list still needs more room. |
| Year | Use the preferred arrangement of twelve mini-months once its rows fit. | Try fewer rows if the width permits, then scroll without reducing date targets or hiding counts. |

The cutoffs depend on available space and font size, not the window height. In extremely short embeds, the outer calendar can also scroll to keep the view reachable. Without a supplied height, Month follows its content in page flow; the other views use a bounded area of up to the smaller of `36rem` and `65dvb` below the toolbar.

```html
<!-- ✅ Works: parent provides height -->
<div style="height: 600px;">
    <lms-calendar></lms-calendar>
</div>

<!-- ✅ Works: full viewport -->
<div style="height: 100vh;">
    <lms-calendar></lms-calendar>
</div>

<!-- All four views share one height in a sized grid. -->
<div style="display: grid; block-size: 100dvh;">
    <lms-calendar></lms-calendar>
</div>

<!-- Unsized Month grows naturally; Day, Week and Year use a bounded fallback. -->
<div>
    <lms-calendar></lms-calendar>
</div>
```

You can also override the default `--height: 100%` for all four views:

```css
lms-calendar {
    --height: 600px; /* or any fixed/viewport value */
}
```

Omit a fixed height (including on the parent) when you want Month to expand with its content.

---

## Responsive Behavior

### Container-Based Sizing

The calendar responds to its own container, not the browser window. It uses `ResizeObserver` for measured layout and CSS container queries for responsive styles. Pointer media queries adjust touch affordances, such as minimum target size. This lets the same page host calendars in a sidebar, modal, and main content area.

### Month Recognition and Selection

By default, below the larger of **768px** and **48 times the host font size**, Month uses quiet presence indicators. Selecting a date keeps Month open and shows its real events in a contextual list after the grid. The page scrolls; the list does not create a nested vertical viewport. The default full list initially shows up to 50 events with an explicit continuation action. The [experimental Month choices](library-usage.md#experimental-presentation-choices) can show continuity marks or dense date totals and start with a shorter list.

`month-day-behavior="auto"` is the default. `inline` keeps contextual date selection at wide sizes too; `day` restores legacy date/count controls that drill into Day. Expanded Month previews remain single-line and bounded to each cell; `+N` counts only genuinely hidden events, not the whole day.

### Week View Condensed Mode

The week view supports a condensed mode via CSS tokens:

```css
lms-calendar {
    --week-day-count: 7; /* columns at full width (1–7) */
    --week-mobile-day-count: 3; /* columns below breakpoint (1–7) */
    --week-mobile-breakpoint: 768px;
}
```

Below the breakpoint, the component:

1. Treats `--week-mobile-day-count` as a maximum, fitting readable columns around the active date
2. Adds peek navigation arrows to slide through the full week
3. Fires legacy `peek-navigate` action notifications, then reports the committed half-open visible window through `calendar-state-change`; use that range for fetching

The default `--week-min-day-width: 8em` further limits visible columns using the measured embed and text size. Set it to `0` to restore fixed-count behavior. Day and Week fit their rendered columns without sideways scrolling unless the timeline is narrower than its readable minimum (the greater of 240px and 11em).

Day and Week reserve the same inline gutter for the date header, all-day band, and timeline when the browser supports `scrollbar-gutter` and uses layout-consuming scrollbars. This keeps their columns aligned even when only one region needs to scroll. Overlay scrollbars do not reserve space.

### Year View Grid Columns

Year arranges twelve months in complete rows. Container width and text size set how many columns fit; counts and coarse-pointer targets need more room. The height and aspect ratio of the area **below the toolbar** then determine whether to use fewer columns. For example, a wide, shallow desktop embed can show six months across, while the same width with more height can show four across in three rows. Week slots align across adjacent months. When the readable minimum does not fit, Year scrolls rather than shrinking targets.

These optional overrides retain control of the layout:

```css
lms-calendar {
    --year-grid-columns: 3; /* pin the column count, bypassing automatic layout */
    --year-grid-columns-tablet: 2; /* tablet: 2 months per row */
    --year-grid-columns-mobile: 1; /* mobile: 1 month per row */
}
```

---

## All-Day Events

Prefer `kind: 'all-day'` with inclusive civil date endpoints and no `time` for the all-day section above the day/week time grid. Explicit `kind: 'timed'` requires endpoints and stays timed even across multiple dates; it is not promoted by continuation metadata.

Without `kind`, legacy promotion is retained: missing time, multi-day dates, an end-hour minus start-hour of at least 23, or `isContinuation: true` is treated as all-day. Do not create time sentinels for new all-day records. See [data contracts](./library-usage.md#data-contracts).

All-day events are allocated into rows by `allocateAllDayRows()` to avoid visual overlap. Sparse Week shows one bar per visible all-day occurrence, with open edges if the event continues outside the window. The band is bounded so timed entries remain reachable. Week shows per-date all-day totals instead of bars when a column has less than about seven times the calendar font size in usable width or more than three rows are needed. Each count opens that date's all-day list without changing the active week. Closing it returns to the count and the prior timed scroll position. A multi-day event is counted on each date it occupies. Day retains an internally scrolling chip band. The default `--all-day-row-height: max(24px, 1.5rem)` scales with document text size; keep the row tall enough when overriding it.

Month measures each cell's preview budget rather than imposing an unconditional two-entry limit. Adjacent visible dates of an all-day event share a bar within a week row; bars do not cross dates where their lane does not fit. The `+N` disclosure still counts hidden events per date and gives access to the full date list. Compact date controls expose full date/activity descriptions for assistive technology; `month-day-behavior="day"` retains the legacy whole-day count action. Enlarged text may require horizontal panning within the Month grid, but the embedding page owns vertical scrolling.

---

## Multi-Day Events

When an entry's `date.start` differs from `date.end`, the component automatically:

1. **Expands** only its intersection with the half-open `visibleRange`, subject to the segment budget
2. **Injects** continuation metadata (`continuation.is`, `continuation.has`, `continuation.index`, `continuation.total`)
3. **Joins** adjacent visible all-day slices into a single bar per week row in Month and per visible window in Week

You don't need to manually split multi-day events — just provide the full date range:

```js
const multiDayEvent = {
    id: 'conference-2026',
    kind: 'all-day',
    date: {
        start: { day: 10, month: 3, year: 2026 },
        end: { day: 12, month: 3, year: 2026 },
    },
    heading: 'Conference',
    content: '3-day event',
    color: '#1976d2',
};
```

---

Explicit timed entries instead describe one continuous interval with an exclusive end; midnight endpoints do not add a phantom final day. Canonical activation/export requests preserve original endpoints rather than the visible slice. Invalid records and budget exhaustion report `entries-invalid` / `entries-error` instead of silent truncation.

## Entry Overlap Handling

Day and Week use `LayoutCalculator` to assign reusable side-by-side lanes. Collision checks include the card’s readable minimum height, so even appointments that do not overlap in time can need separate lanes when the timeline fits all 24 hours. A count means those cards cannot all fit at the current scale and column width; it does not mean all listed events happen at once.

If the lanes are too narrow, a count opens exactly the advertised occurrences, not unrelated events from that date. The selected block stays highlighted in the live timeline while its date, time range, and events appear in a bounded panel. Close or press Escape to return focus to the count without replacing the time grid or changing the active date or visible range.

The standalone `LayoutCalculator` keeps its legacy cascade default; the calendar opts into columns. No synthetic exportable density events are introduced. Visible minimum-height previews may be taller than an event's true duration; their localized start/end range remains authoritative.

---

## Time Grid Sizing

Day and Week adapt to the height left below the toolbar, date headers and all-day band, not to the window height or the number of visible Week columns:

- **Tall:** the full 24-hour timeline fits, with every hour labeled.
- **Medium:** the full timeline still fits. Every second hour is labeled, including both midnight boundaries. Hourly grid lines and event times do not change.
- **Short:** the timeline scrolls at a more detailed scale rather than compressing events further. Larger text or more all-day rows can cause the same embed to switch to this layout.

With timed cards, auto sizing also uses the scrollable detail layout if fitting would merge events that the scrollable scale can show separately or in smaller groups. Set `scroll-time-grid` (or `calendar.scrollTimeGrid = true`) to always use the scrollable detail layout, even in a tall container. Scrolling is native, without snapping. Compatible scrollable Day/Week views preserve the visible minute when resizing or changing views. When the full day fits, no vertical scroll offset is needed.

Late-night minimum-height cards have a reserved space after the midnight line so their labels and targets remain reachable. That space represents **no additional time** and does not change the grid origin, the event's start position or its canonical times. The all-day band can still scroll independently.

Do not assume a host-level `--minute-height` override is a fixed zoom API: the child sizing controller recomputes its values on resize. Adjust the calendar/container height for more space. Collision layout reads effective scale and minimum entry geometry so short/point events remain separated consistently with their rendered size. See [Rendering Pipeline](./rendering-pipeline.md#6-time-grid-sizing).

---

## ResizeObserver + `display: none`

The calendar cannot measure a `display: none` container while hidden. Its observers
reconcile geometry when the container becomes visible again; do not replace the
entries array merely to refresh sizing. Day/Week use their bounded fallback again
if no embed height is supplied. Disconnect/reconnect reacquires observations and
cancels pending frame work.

---

## Common Pitfalls

| Symptom                           | Cause                                     | Fix                                                                                 |
| --------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Day/Week renders with zero height | Parent container is collapsed or clipping | Check the available space and overflow; use a definite size for a constrained embed |
| Month shows dots instead of rows  | Compact for this width or text size       | Select a date for its events, or widen the container for in-cell previews           |
| Week shows fewer than 7 days      | Requested count and readable-column floor | Widen the container; fixed counts also require `--week-min-day-width: 0`            |
| Year view is single-column        | Container is mobile-width                 | Set `--year-grid-columns-mobile` to control column count                            |
| Time grid looks too short/tall    | Available container/header geometry       | Adjust the constrained container height; inspect effective child sizing tokens      |
| Entries overlap incorrectly       | —                                         | This is handled automatically; ensure entries have valid time ranges                |
| All-day section has many rows     | Many overlapping all-day events           | Week shows per-date totals; Day scrolls its all-day band internally                 |
