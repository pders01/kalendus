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

Month is a normal-flow section: its six-week grid and optional contextual list determine its height. The embedding page owns vertical scrolling. Month intentionally ignores an explicit host height/block-size used for other views, so a long list pushes following content down instead of covering it. Do not constrain a Month wrapper with a fixed height and hidden overflow.

Day, Week, and Year fill the supplied height, including when a CSS Grid or flex parent sizes the calendar. The toolbar takes its own space; the view fills the rest. Without a supplied height, the area below the toolbar defaults to the smaller of `36rem` and `65dvb`. Day and Week scroll their timelines; Year scrolls when the twelve months do not fit at readable target sizes. The shared defaults are `--height: 100%` and `--width: 100%`.

```html
<!-- ✅ Works: parent provides height -->
<div style="height: 600px;">
    <lms-calendar></lms-calendar>
</div>

<!-- ✅ Works: full viewport -->
<div style="height: 100vh;">
    <lms-calendar></lms-calendar>
</div>

<!-- ✅ Works: CSS grid with row height -->
<div style="display: grid; grid-template-rows: 1fr; height: 100vh;">
    <lms-calendar></lms-calendar>
</div>

<!-- Month grows naturally; Day/Week fall back to a bounded scroller -->
<div>
    <lms-calendar></lms-calendar>
</div>
```

Alternatively, override the height token directly:

```css
lms-calendar {
    --height: 600px; /* or any fixed/viewport value */
}
```

The component sets `min-height: 0` on `:host` so it cooperates with CSS grid and flexbox containers without fighting minimum sizing.

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

The default `--week-min-day-width: 8em` further limits visible columns using the measured embed and text size. Set it to `0` to restore fixed-count behavior. Extremely tiny timelines deliberately pan horizontally instead of reducing a lone event to an unreadable sliver.

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

All-day event chips are allocated into rows by `allocateAllDayRows()` to avoid visual overlap. The band is bounded so timed entries remain reachable. In Week, the band shows per-date all-day totals instead of chips when a column has less than about seven times the calendar font size in usable width or more than three rows are needed. Each count opens that date's all-day list without changing the active week. Closing it returns to the count and the prior timed scroll position. A multi-day event is counted on each date it occupies. Day retains an internally scrolling chip band. The default `--all-day-row-height: max(24px, 1.5rem)` scales with document text size; keep the row tall enough when overriding it.

Month measures each cell's preview budget and mounts only the rows that fit, rather than imposing an unconditional two-entry limit. A `+N` disclosure counts unmounted entries only, including events in higher multi-day lanes; it still gives access to the date's full event list. Compact date controls expose full date/activity descriptions for assistive technology; `month-day-behavior="day"` retains the legacy whole-day count action. Enlarged text may require horizontal panning within the Month grid, but the embedding page owns vertical scrolling.

---

## Multi-Day Events

When an entry's `date.start` differs from `date.end`, the component automatically:

1. **Expands** only its intersection with the half-open `visibleRange`, subject to the segment budget
2. **Injects** continuation metadata (`continuation.is`, `continuation.has`, `continuation.index`, `continuation.total`)
3. **Styles** the first, middle, and last slices differently

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

Overlapping timed events in day/week views are handled automatically by `LayoutCalculator`:

- Events sharing time slots are detected and grouped
- The calendar uses reusable side-by-side lanes with opaque surfaces
- Groups too narrow for readable cards become native event-count/range disclosures
- A disclosure opens exactly its advertised real occurrences, not unrelated events that day
- Closing that list restores the view, semantic time position and disclosure focus

The standalone `LayoutCalculator` keeps its legacy cascade default; the calendar opts into columns. No synthetic exportable density events are introduced. Visible minimum-height previews may be taller than an event's true duration; their localized start/end range remains authoritative.

---

## Free Timeline Scrolling

Day and Week scroll freely, without hour or half-day snapping. Legacy snap tokens no longer enable snapping. Compatible Day/Week switches preserve the visible semantic minute, independently of each view's pixel scale and leading axis padding. There is no public automatic initial scroll-to-noon guarantee.

The 24-hour grid ends at midnight, but readable minimum-height cards may extend
into blank trailing scroll space. That space keeps late-night labels/targets
reachable; it is **not** an additional date or proportional duration. The grid's
coordinate height and canonical endpoints do not move. True-duration marker labels
can instead move upward with a leader to their unchanged time mark.

---

## Time Grid Sizing

The base `--minute-height` is `0.8px`, but day/week sizing writes an effective inline scale from the observed timed scroller below the header and all-day band: the larger of available height divided by 720 minutes and `2.75 × host font size / 60`. It also writes resolved `--hour-height`, `--day-total-height` and `--half-day-height` lengths. This aims to fit half a day when readable; short embeds and enlarged text show fewer hours and scroll rather than crushing event labels. Narrow columns stack title and time using measured two-line geometry.

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
