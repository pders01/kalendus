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

**Release scope:** This guide describes the unreleased **0.12.0** source. In published **0.11.0**, Month grows in page flow even when a height is supplied, and Day/Week use the scrollable detail scale instead of fitting 24 hours. See the [v0.11.0 reference](https://github.com/pders01/kalendus/tree/v0.11.0) for that release.

In 0.12.0, a definite height bounds the **whole calendar**, including its toolbar, in all four views. Give the parent a definite height, stretch the calendar in a sized Grid or flex layout, or set its height directly. The view uses the space below the toolbar; the toolbar can wrap as the embed narrows or text grows.

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

By default, below the larger of **768px** and **48 times the host font size**, Month uses quiet presence indicators. Selecting a date keeps Month open and shows its real events in a contextual list after the grid. The default full list initially shows up to 50 events with an explicit continuation action. In a sized Month, the grid and list share the view's scroll area; in an unsized Month, the page scrolls. The list does not create a separate vertical scroller in either case.

With default `month-day-behavior="auto"` and automatic presentation, wide Month shows in-cell previews. Its `+N` counts only hidden events, not the whole day, and opens **Day** for that date. `month-day-behavior="inline"` keeps date selection in Month even at wide sizes. `month-day-behavior="day"` disables the experimental accordion Agenda and uses Day drill-down with automatic presentation. Explicit experimental `month-presentation="presence"` or `month-presentation="previews"` still selects dates inline. See [experimental presentation choices](./library-usage.md#experimental-presentation-choices) for the variants.

### Week View Condensed Mode

The week view supports a condensed mode via CSS tokens:

```css
lms-calendar {
    --week-day-count: 7; /* columns at full width (1–7) */
    --week-mobile-day-count: 3; /* columns below breakpoint (1–7) */
    --week-mobile-breakpoint: 768px;
}
```

Below the breakpoint, Week requests the mobile count; at or above it, Week requests the full count. Both are maxima. The default `--week-min-day-width: 8em` also limits the count based on the measured width and font size, with room reserved for the time gutter and spacing. Set it to `0` to use the requested counts without that capacity cap.

If fewer than seven dates fit, Week centers a sliding window around the active date and shows controls to move it within the week. Those controls fire legacy `peek-navigate` action notifications. For fetching, use the committed half-open window reported by [`calendar-state-change`](./events.md#calendar-state-change). If the embed is narrower than the timeline's minimum width (the greater of `240px` and `11em`), the time-grid view can pan horizontally.

Day and Week reserve the same inline gutter for the date header, all-day band, and timeline when the browser supports `scrollbar-gutter` and uses layout-consuming scrollbars. This keeps their columns aligned even when only one region needs to scroll. Overlay scrollbars do not reserve space.

### Year View Grid Columns

Year's automatic layout chooses from 1, 2, 3, 4, or 6 columns. Width and text size cap the number of columns that fit, with more room reserved for coarse-pointer targets. The aspect ratio **below the toolbar** sets the preferred shape; Year tries more columns (fewer rows), up to that cap, if the content is too tall. If the readable minimum still does not fit, the Year viewport can scroll vertically or pan all months horizontally without shrinking date targets.

Leave `--year-grid-columns` unset for automatic fitting. A positive integer pins the count at **all** widths and can introduce overflow. To tune only the narrower automatic branches, use the optional `--year-grid-columns-mobile` (default `1` when a one-column layout is chosen) or `--year-grid-columns-tablet` (default `2` when width caps the layout at two columns). These are not device-width media queries.

Year's date cells open Month by default. Set `year-drill-target="week"` or `year-drill-target="day"` to open those views; the month labels and calendar-week numbers remain separate Month and Week controls. `year-density-mode` shows a dot, a heatmap mark, or an exact count beneath the date number. In heatmap mode the marks represent 1–2, 3–5, 6–9, and 10+ events; zero has no mark. Date buttons announce the count regardless of visual mode.

---

## All-Day Events

Prefer `kind: 'all-day'` with inclusive civil date endpoints for the all-day section above the Day/Week time grid. Omit `time`; explicit all-day records ignore it. Explicit `kind: 'timed'` requires time endpoints, has an exclusive end, and stays timed even across dates.

Without `kind`, the calendar first validates any supplied daily time window. A later end date does not make a reversed clock interval valid; use explicit `kind: 'timed'` for an overnight interval. For valid kind-less records, missing time, multi-day dates, an end-hour minus start-hour of at least 23, or `isContinuation: true` triggers legacy all-day promotion. Do not create time sentinels for new all-day records. See [data contracts](./library-usage.md#data-contracts).

All-day events are packed into lanes to avoid overlap. Sparse Week shows one bar per visible occurrence, with open edges if it continues outside the window. Week shows per-date all-day totals instead of bars when a column has less than about seven times the calendar font size in usable width or more than three rows are needed. A multi-day occurrence counts on each date it occupies. The total opens an all-day-only list for that date **in place of the Week grid**, without changing the active date, view mode, or visible range. Closing it remounts the grid and restores its prior timed position; focus returns to the count if it still exists, otherwise to the view.

Day retains an internally scrolling all-day band separate from its timeline. The default `--all-day-row-height: max(24px, 1.5rem)` scales with document text size; keep the row tall enough when overriding it.

Month measures each cell's preview budget rather than imposing an unconditional two-entry limit. Adjacent visible dates of an all-day event share a bar within a week row; bars split where the lane does not fit. Hidden all-day and timed previews both contribute to that date's `+N`. Compact date controls announce the date and total activity. Enlarged text may require horizontal panning within the Month grid.

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

If the lanes are too narrow, a count opens exactly the advertised timed occurrences, not unrelated events from that date. Unlike a Week all-day total, the timed count opens a bounded panel while leaving the time grid mounted. This does not change the active date or visible range. Closing the panel or pressing Escape returns focus to the count if it is still sufficiently visible; otherwise focus falls back to the timeline rather than pulling the count into view.

The internal `LayoutCalculator` defaults to legacy cascade when called without a layout mode; the calendar opts into columns. No synthetic exportable density events are introduced. Visible minimum-height previews may be taller than an event's true duration; their localized start/end range remains authoritative.

---

## Time Grid Sizing

Day and Week adapt to the height left below the toolbar, date headers and all-day band, not to the window height or the number of visible Week columns:

- **Tall:** the full 24-hour timeline fits, with every hour labeled.
- **Medium:** the full timeline still fits. Every second hour is labeled, including both midnight boundaries. Hourly grid lines and event times do not change.
- **Short:** the timeline scrolls at a more detailed scale rather than compressing events further. Larger text or more all-day rows can cause the same embed to switch to this layout.

With timed cards, auto sizing also uses the scrollable detail layout if fitting would merge events that the scrollable scale can show separately or in smaller groups. The unreleased `scrollTimeGrid` option defaults to `false` (automatic sizing). Set the `scroll-time-grid` attribute (or `calendar.scrollTimeGrid = true`) to always use the scrollable detail layout, even in a tall container. Scrolling is native, without snapping. Compatible scrollable Day/Week views preserve the visible minute when resizing or changing views. When the full day fits, no vertical scroll offset is needed.

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
| Year view is single-column        | Width and target size limit the arrangement | Widen the embed first; pinning a larger count can cause horizontal overflow         |
| Time grid looks too short/tall    | Available container/header geometry       | Adjust the constrained container height; inspect effective child sizing tokens      |
| Entries overlap incorrectly       | —                                         | This is handled automatically; ensure entries have valid time ranges                |
| All-day section has many rows     | Many overlapping all-day events           | Week shows per-date totals; Day scrolls its all-day band internally                 |
