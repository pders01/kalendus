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

## Height Requirement

The calendar defaults to `--height: 100%` and `--width: 100%`. This means **the component needs an explicit height from its parent container** — it will not size itself based on content.

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

<!-- ❌ Fails: parent has no height, calendar collapses to 0 -->
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

### Container-Based, Not Viewport-Based

The calendar uses a `ResizeObserver` on its own container — **not CSS media queries**. This means the calendar responds to its container's actual width, which is important for sidebar layouts, modals, and embedded contexts.

### Month View Dot Mode

When the container width falls below **768px**, month view automatically switches from showing full entry chips to compact dot indicators:

- **Above 768px**: Full entry chips with heading and time
- **Below 768px**: Compact numeric count buttons that drill into the day

This threshold is based on the observed container width via `ResizeObserver`.

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

1. Shows only `--week-mobile-day-count` columns centered around the active date
2. Adds peek navigation arrows to slide through the full week
3. Fires legacy `peek-navigate` action notifications, then reports the committed half-open visible window through `calendar-state-change`; use that range for fetching

### Year View Grid Columns

Wide Year grids fit columns intrinsically around readable date targets (four columns at the default 1136px reference width). Font-relative container queries select two or one column for smaller embeds and enlarged text. These optional overrides retain control of the layout:

```css
lms-calendar {
    --year-grid-columns: 3; /* optionally pin wide layouts to 3 columns */
    --year-grid-columns-tablet: 2; /* tablet: 2 months per row */
    --year-grid-columns-mobile: 1; /* mobile: 1 month per row */
}
```

---

## All-Day Events

Prefer `kind: 'all-day'` with inclusive civil date endpoints and no `time` for the all-day section above the day/week time grid. Explicit `kind: 'timed'` requires endpoints and stays timed even across multiple dates; it is not promoted by continuation metadata.

Without `kind`, legacy promotion is retained: missing time, multi-day dates, an end-hour minus start-hour of at least 23, or `isContinuation: true` is treated as all-day. Do not create time sentinels for new all-day records. See [data contracts](./library-usage.md#data-contracts).

All-day events are allocated into rows by `allocateAllDayRows()` to avoid visual overlap. The number of all-day rows affects the available height for the time grid. Bands scroll internally instead of pushing timed entries out of reach. The default `--all-day-row-height: max(24px, 1.5rem)` scales with document text size; keep the row tall enough for the event font when overriding it.

Month view measures each cell's available height rather than imposing an unconditional two-entry limit. A `+N` disclosure counts hidden entries only; narrow layouts use compact whole-day count buttons with full date/count descriptions for assistive technology. Enlarged text can make the two-dimensional month grid scroll horizontally as well as vertically, preserving readable dates and controls instead of clipping them.

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
- Each event in a group gets progressive width reduction and margin offset (cascading layout)
- Cards use opaque theme surfaces so unrelated text cannot bleed through
- Foreground paint order follows chronological order, independently of reused horizontal lanes

Consumers just provide the entry data — no positioning configuration needed. Cascade overlap can still obscure earlier headings, especially in narrow or very dense views. Keyboard focus raises an entry and activation opens its complete details; this is not a side-by-side or full-agenda layout.

---

## Scroll Snap

Day and week views use a half-day scroll snap point:

```css
--half-day-height: calc(var(--day-total-height) / 2);
```

The time labels provide half-day snap targets while scrolling. There is no public automatic initial scroll-to-noon guarantee.

---

## Time Grid Sizing

The base `--minute-height` is `0.8px`, but day/week sizing writes an effective inline scale from observed wrapper/header geometry: the larger of available height divided by 720 minutes and `2.75 × host font size / 60`. It also writes resolved `--hour-height`, `--day-total-height` and `--half-day-height` lengths. This aims to fit half a day when readable; short embeds and enlarged text show fewer hours and scroll rather than crushing event labels. Narrow columns stack title and time using measured two-line geometry.

Do not assume a host-level `--minute-height` override is a fixed zoom API: the child sizing controller recomputes its values on resize. Adjust the calendar/container height for more space. Collision layout reads effective scale and minimum entry geometry so short/point events remain separated consistently with their rendered size. See [Rendering Pipeline](./rendering-pipeline.md#6-time-grid-sizing).

---

## ResizeObserver + `display: none`

The calendar relies on `ResizeObserver` for responsive behavior. If you toggle the calendar's visibility with `display: none`, the observer cannot measure the container and may report stale dimensions.

**Workaround:** Use `visibility: hidden; height: 0; overflow: hidden;` instead of `display: none` if you need the calendar to measure correctly when shown. Alternatively, reassign `entries` after making the calendar visible to trigger a re-render.

---

## Common Pitfalls

| Symptom                              | Cause                                   | Fix                                                                            |
| ------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------ |
| Calendar renders with zero height    | Parent container has no explicit height | Give the parent a height or set `--height` on `<lms-calendar>`                 |
| Month view shows only dots           | Container is below 768px wide           | Expected behavior — widen the container or accept dot mode                     |
| Week shows only 3 days               | Condensed mode is active                | Set `--week-mobile-day-count: 7` to disable, or widen the container            |
| Year view is single-column           | Container is mobile-width               | Set `--year-grid-columns-mobile` to control column count                       |
| Time grid looks too short/tall       | Available container/header geometry     | Adjust the constrained container height; inspect effective child sizing tokens |
| Entries overlap incorrectly          | —                                       | This is handled automatically; ensure entries have valid time ranges           |
| All-day section takes too much space | Many overlapping all-day events         | Expected — rows scale with event count                                         |
