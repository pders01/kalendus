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
    bun add @jpahd/kalendus lit luxon
    ```

    Inspect installed versions with `bun pm ls --all`; avoid duplicate Lit/Luxon copies.

2. **Module not imported** — The component must be imported once for its custom element to register.

    ```js
    import '@jpahd/kalendus';
    ```

3. **Constrained container height** — Check for a zero-sized or clipping flex/grid wrapper. Day and Week have a bounded fallback in auto-height embeds. See [Height and Scrolling](./layout-and-positioning.md#height-and-scrolling).

---

## Calendar Has Zero Height

The component defaults to `--height: 100%` and `--width: 100%`. Month is content-sized; Day and Week use a bounded fallback if there is no height to fill. If the calendar is clipped or needs to fit a specific region, check the wrapper's size and overflow.

**Fix:** Give that region and the calendar a definite height:

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

2. **Invalid date/time ranges** — Invalid records are dropped individually and reported by `entries-invalid` with `{ issues: [{ index, entry, reason }] }`. This includes impossible dates, reversed intervals, duplicate IDs (first valid wins), invalid zones and DST gaps/ambiguous endpoints.

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

4. **Entries are on a different month/day** — Navigate to the correct date or set `activeDate` to match. `visibleRange` is half-open ISO dates and includes the actual rendered window.

5. **Expansion budget exceeded** — `entries-error` with `code: 'segment-budget'` clears derived entries and shows an alert instead of truncating them. Supply fewer records or choose a smaller view/range. Expansion is already clipped to the visible range.

6. **Unexpected all-day promotion** — Prefer explicit `kind: 'timed'` for continuous timed spans (requires `time`) or `kind: 'all-day'` for inclusive civil dates. Omitting `kind` preserves legacy multi-day/full-day/continuation promotion. See [data contracts](./library-usage.md#data-contracts).

---

## Locale Not Updating

**Symptoms:** Calendar stays in English despite setting `locale`.

**Causes & fixes:**

1. **Wrong value or missing update** — Both the `locale` attribute and property work; property binding is convenient for dynamic updates:

    ```js
    calendar.locale = 'de'; // ✅ Property assignment
    ```

    In Lit templates: `.locale=${selectedLocale}` or `locale=${selectedLocale}`.

2. **Catalog resolution/fallback** — <!-- GENERATED:LOCALE_LIST_INLINE:START -->The 28 built-in catalog codes are: `en`, `ar`, `bn`, `cs`, `da`, `de`, `de-DE`, `el`, `es`, `fi`, `fr`, `he`, `hi`, `id`, `it`, `ja`, `ko`, `nb`, `nl`, `pl`, `pt`, `ru`, `sv`, `th`, `tr`, `uk`, `vi`, `zh-Hans`. Regional aliases may resolve to these catalogs; unsupported tags use English fallback.<!-- GENERATED:LOCALE_LIST_INLINE:END -->

3. **`<html lang>` mismatch** — If `locale` is not set, the component reads `document.documentElement.lang`. Ensure this matches your desired locale.

> **Note:** Await `calendar.localeReady` for the current load/fallback and root render. Pending catalogs hide header/main content; failed imports emit `locale-error`, restore usable English fallback and expose retry UX (`await calendar.retryLocale()`). `locale-ready` includes `catalogLocale` and `fallback`, even for English/unsupported tags. Some new phrases deliberately remain English pending review. See [Events Reference](./events.md#locale-ready).

Regional aliases retain formatting preferences (`de-AT` resolves to German); Simplified Chinese aliases use `zh-Hans`, while Traditional Chinese does not silently use Simplified Chinese. The root manages host `lang` and automatic RTL. Week starts are separate: `firstDayOfWeek` defaults to **1 Monday**, never language-derived. For translation changes edit canonical JSON and follow [src/locales/README.md](https://github.com/pders01/kalendus/blob/main/src/locales/README.md), not generated templates/XLIFF.

---

## Menu Stuck Open

**Symptoms:** The detail menu overlay doesn't close, or closes but re-opens immediately.

**Causes & fixes:**

1. **Custom menu replacement** — Use cancelable `entry-activate` and call `preventDefault()` synchronously; do not depend on propagation order or clear internal selection manually:

    ```js
    calendar.addEventListener('entry-activate', (event) => {
        event.preventDefault();
        showCustomPanel(event.detail.entry, event.detail.eventId);
    });
    ```

2. **Externally reopening the menu** — Check owner code calling `openMenu()` on every update or mirroring a legacy notification back into the component. Observe `menu-close` without swallowing it.

The inspector is non-modal: Tab may leave it and background controls remain usable. Light dismissal should not steal focus from the control just chosen. This is not a focus-trapping modal.

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

    // Also works through bubbling/composition, but observes every calendar:
    document.addEventListener('switchview', handler);
    ```

2. **Framework event binding syntax** — Native listeners through a ref work across framework versions; remove them on teardown. Vue 3 can bind custom events directly (for example `@calendar-state-change`); no `.native` modifier is needed.

3. **Calling `stopPropagation` elsewhere** — Another listener earlier in the chain may be stopping propagation.

---

## Month View Shows Dots Instead of Full Entries

**Symptoms:** Month view renders small colored dots instead of entry chips with text.

**Cause:** This is expected responsive behavior. When the calendar's container width is below **768px**, month view switches to dot mode for readability.

**Fixes:**

- Widen the container
- This behavior is based on `ResizeObserver` measuring the actual container width, not the viewport — so a calendar in a narrow sidebar will show dots even on a wide screen

---

## Native Dependency Build Fails on macOS (Node 25+)

**Symptoms:** `bun install` fails with `fatal error: 'climits' file not found` when building `better-sqlite3` or other native addons.

**Cause:** Node 25.x's node-gyp does not pass the correct macOS SDK include path to the compiler.

**Fix:** Set `CXXFLAGS` before installing:

```bash
CXXFLAGS="-isysroot $(xcrun --show-sdk-path)" bun install
```

Or add it to your shell profile (`~/.zshrc`):

```bash
export CXXFLAGS="-isysroot $(xcrun --show-sdk-path)"
```

If Xcode Command Line Tools are not installed:

```bash
xcode-select --install
```

---

## `display: none` Breaks Layout

**Symptoms:** After toggling visibility, the calendar renders at wrong dimensions.

**Cause:** `ResizeObserver` cannot measure an element with `display: none`. When you show the element again, stale dimensions are used.

**Fixes:**

- Use `visibility: hidden; height: 0; overflow: hidden;` instead of `display: none`
- Reassign `calendar.entries = [...calendar.entries]` after making it visible to force re-render
- Alternatively, destroy and recreate the element
