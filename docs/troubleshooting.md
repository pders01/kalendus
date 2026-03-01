---
layout: base.njk
title: 'Troubleshooting'
order: 7
tags: docs
section: Layout
---

# Troubleshooting

Common issues and solutions when using `<lms-calendar>`.

---

## Nothing Renders

**Symptoms:** The page is blank where the calendar should be, or you see just a thin line.

**Causes & fixes:**

1. **Missing peer dependencies** — `lit` and `luxon` must be installed alongside `@jpahd/kalendus`. Duplicate copies can break `instanceof` checks.

    ```bash
    pnpm add @jpahd/kalendus lit luxon
    ```

    Verify a single copy: `pnpm ls lit luxon`

2. **Module not imported** — The component must be imported once for its custom element to register.

    ```js
    import '@jpahd/kalendus';
    ```

3. **Zero container height** — The calendar defaults to `--height: 100%`. If its parent has no explicit height, the calendar collapses to zero. See [Layout Guide](./layout-and-positioning.md#height-requirement).

---

## Calendar Has Zero Height

The most common issue. The component's `:host` block sets `--height: 100%` and `--width: 100%`. Without an ancestor providing height, it collapses.

**Fix:** Give the parent an explicit height:

```html
<div style="height: 600px;">
    <lms-calendar></lms-calendar>
</div>
```

Or set the height directly:

```css
lms-calendar {
    --height: 80vh;
}
```

---

## Entries Not Showing

**Symptoms:** Calendar renders, navigates correctly, but no events appear.

**Causes & fixes:**

1. **Array mutation without reassignment** — Lit requires a new array reference to detect changes.

    ```js
    // ❌ Won't trigger update
    calendar.entries.push(newEntry);

    // ✅ Triggers update
    calendar.entries = [...calendar.entries, newEntry];
    ```

2. **Invalid date/time ranges** — Entries where `end` is before `start` are silently dropped during validation.

    ```js
    // ❌ Dropped: end date before start
    { date: { start: { day: 15, month: 3, year: 2026 }, end: { day: 10, month: 3, year: 2026 } } }
    ```

3. **Wrong date format** — Months are 1-indexed (1–12), not 0-indexed. Days are 1-indexed (1–31).

    ```js
    // ❌ Month 0 is invalid
    { day: 15, month: 0, year: 2026 }

    // ✅ January is month 1
    { day: 15, month: 1, year: 2026 }
    ```

4. **Entries are on a different month/day** — Navigate to the correct date or set `activeDate` to match.

---

## Locale Not Updating

**Symptoms:** Calendar stays in English despite setting `locale`.

**Causes & fixes:**

1. **Using attribute instead of property** — For dynamic locale changes, use property binding:

    ```js
    calendar.locale = 'de'; // ✅ Property assignment
    ```

    In Lit templates: `.locale=${'de'}` (not `locale="de"` — though the attribute works for static values).

2. **Unsupported locale code** — <!-- GENERATED:LOCALE_LIST_INLINE:START -->Only these 28 codes are supported: `en`, `ar`, `bn`, `cs`, `da`, `de`, `de-DE`, `el`, `es`, `fi`, `fr`, `he`, `hi`, `id`, `it`, `ja`, `ko`, `nb`, `nl`, `pl`, `pt`, `ru`, `sv`, `th`, `tr`, `uk`, `vi`, `zh-Hans`.<!-- GENERATED:LOCALE_LIST_INLINE:END -->

3. **`<html lang>` mismatch** — If `locale` is not set, the component reads `document.documentElement.lang`. Ensure this matches your desired locale.

---

## Menu Stuck Open

**Symptoms:** The detail menu overlay doesn't close, or closes but re-opens immediately.

**Causes & fixes:**

1. **Event listener swallowing `menu-close`** — If you listen on `menu-close` and call `stopPropagation()`, the internal close handler won't fire.

2. **Custom menu replacement** — If you intercept `open-menu` to show a custom panel, call `clearSelection()` on the triggering `<lms-calendar-entry>` to reset ARIA state:
    ```js
    calendar.addEventListener('open-menu', (e) => {
        e.stopPropagation();
        // After showing your custom UI:
        const entry = e.composedPath().find((el) => el.tagName === 'LMS-CALENDAR-ENTRY');
        entry?.clearSelection();
    });
    ```

---

## Week View Shows Wrong Number of Columns

**Symptoms:** Week view shows 3 days instead of 7, or vice versa.

**Cause:** The condensed week mode is controlled by CSS tokens read at runtime:

```css
lms-calendar {
    --week-day-count: 7; /* full-width columns */
    --week-mobile-day-count: 3; /* columns below breakpoint */
    --week-mobile-breakpoint: 768px;
}
```

If the calendar's container is narrower than `--week-mobile-breakpoint`, it switches to `--week-mobile-day-count` columns automatically.

**Fixes:**

- To always show 7 days: `--week-mobile-day-count: 7;`
- To change the threshold: `--week-mobile-breakpoint: 480px;`
- Widen the container if the calendar is in a narrow sidebar

---

## Year View Not Responsive

**Symptoms:** Year view shows all 12 months in 3 columns regardless of screen size.

**Cause:** The year view uses container queries with these tokens:

```css
lms-calendar {
    --year-grid-columns: 3;
    --year-grid-columns-tablet: 2;
    --year-grid-columns-mobile: 1;
}
```

If the container doesn't support container queries (very old browsers), the grid falls back to the desktop value.

**Fix:** Ensure your browser supports CSS container queries, or override with a fixed column count.

---

## Events Not Firing

**Symptoms:** `addEventListener` callbacks never execute.

**Causes & fixes:**

1. **Listening on wrong element** — All events bubble and are composed, so listen on the `<lms-calendar>` host:

    ```js
    // ✅ Correct
    document.querySelector('lms-calendar').addEventListener('switchview', handler);

    // ❌ Won't work: events don't propagate past the component boundary unless composed
    document.addEventListener('switchview', handler); // works, but may be unintentional
    ```

2. **Framework event binding syntax** — In React, use `ref` + `addEventListener` since React's synthetic events don't support custom elements. In Vue, use `@switchview.native` or `ref` approach.

3. **Calling `stopPropagation` elsewhere** — Another listener earlier in the chain may be stopping propagation.

---

## Month View Shows Dots Instead of Full Entries

**Symptoms:** Month view renders small colored dots instead of entry chips with text.

**Cause:** This is expected responsive behavior. When the calendar's container width is below **768px**, month view switches to dot mode for readability.

**Fixes:**

- Widen the container
- This behavior is based on `ResizeObserver` measuring the actual container width, not the viewport — so a calendar in a narrow sidebar will show dots even on a wide screen

---

## `display: none` Breaks Layout

**Symptoms:** After toggling visibility, the calendar renders at wrong dimensions.

**Cause:** `ResizeObserver` cannot measure an element with `display: none`. When you show the element again, stale dimensions are used.

**Fixes:**

- Use `visibility: hidden; height: 0; overflow: hidden;` instead of `display: none`
- Reassign `calendar.entries = [...calendar.entries]` after making it visible to force re-render
- Alternatively, destroy and recreate the element
