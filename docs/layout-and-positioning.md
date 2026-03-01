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
- **Below 768px**: Color dots showing entry count

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
3. Fires `peek-navigate` events when users use the arrows

### Year View Grid Columns

The year view adapts its month grid via container queries and CSS tokens:

```css
lms-calendar {
    --year-grid-columns: 3; /* desktop: 3 months per row */
    --year-grid-columns-tablet: 2; /* tablet: 2 months per row */
    --year-grid-columns-mobile: 1; /* mobile: 1 month per row */
}
```

---

## All-Day Events

Events are rendered in the all-day section (above the time grid in day/week views) when any of these conditions are met:

| Condition                    | Example                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| No `time` property           | `{ date: { start: ..., end: ... }, heading: "Holiday" }`                 |
| Time spans 00:00–23:59       | `time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } }` |
| Multi-day event continuation | Automatically detected when `date.start !== date.end`                    |

All-day events are allocated into rows by `allocateAllDayRows()` to avoid visual overlap. The number of all-day rows affects the available height for the time grid.

---

## Multi-Day Events

When an entry's `date.start` differs from `date.end`, the component automatically:

1. **Expands** the entry into per-day slices
2. **Injects** continuation metadata (`continuation.is`, `continuation.has`, `continuation.index`, `continuation.total`)
3. **Styles** the first, middle, and last slices differently

You don't need to manually split multi-day events — just provide the full date range:

```js
const multiDayEvent = {
    date: {
        start: { day: 10, month: 3, year: 2026 },
        end: { day: 12, month: 3, year: 2026 },
    },
    time: { start: { hour: 0, minute: 0 }, end: { hour: 23, minute: 59 } },
    heading: 'Conference',
    content: '3-day event',
    color: '#1976d2',
};
```

---

## Entry Overlap Handling

Overlapping timed events in day/week views are handled automatically by `LayoutCalculator`:

- Events sharing time slots are detected and grouped
- Each event in a group gets progressive width reduction and margin offset (cascading layout)
- Opacity decreases with depth for visual hierarchy
- Z-index ensures correct stacking order

Consumers just provide the entry data — no positioning configuration needed.

---

## Scroll Snap

Day and week views use a half-day scroll snap point:

```css
--half-day-height: calc(var(--day-total-height) / 2);
```

When the view loads, it auto-scrolls to align the noon mark, putting typical working hours (8 AM–5 PM) in view.

---

## Time Grid Sizing

The time grid height is controlled by `--minute-height`:

```css
lms-calendar {
    --minute-height: 0.8px; /* default: each minute = 0.8px */
}
```

This gives a total day height of `1440 × 0.8px = 1152px`. Increase for more spacious layouts:

```css
lms-calendar {
    --minute-height: 1.2px; /* each minute = 1.2px → 1728px total */
}
```

The `--hour-height` and `--day-total-height` tokens are derived automatically.

---

## ResizeObserver + `display: none`

The calendar relies on `ResizeObserver` for responsive behavior. If you toggle the calendar's visibility with `display: none`, the observer cannot measure the container and may report stale dimensions.

**Workaround:** Use `visibility: hidden; height: 0; overflow: hidden;` instead of `display: none` if you need the calendar to measure correctly when shown. Alternatively, reassign `entries` after making the calendar visible to trigger a re-render.

---

## Common Pitfalls

| Symptom                              | Cause                                   | Fix                                                                  |
| ------------------------------------ | --------------------------------------- | -------------------------------------------------------------------- |
| Calendar renders with zero height    | Parent container has no explicit height | Give the parent a height or set `--height` on `<lms-calendar>`       |
| Month view shows only dots           | Container is below 768px wide           | Expected behavior — widen the container or accept dot mode           |
| Week shows only 3 days               | Condensed mode is active                | Set `--week-mobile-day-count: 7` to disable, or widen the container  |
| Year view is single-column           | Container is mobile-width               | Set `--year-grid-columns-mobile` to control column count             |
| Time grid looks too short/tall       | `--minute-height` doesn't match design  | Adjust `--minute-height` (default: `0.8px`)                          |
| Entries overlap incorrectly          | —                                       | This is handled automatically; ensure entries have valid time ranges |
| All-day section takes too much space | Many overlapping all-day events         | Expected — rows scale with event count                               |
