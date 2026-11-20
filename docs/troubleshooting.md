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

1. **Missing or incompatible peers** — Bundled applications install `lit` and `luxon` alongside the ESM package. See the [versioned install instructions](./library-usage.md#using-kalendus-as-a-library), check module resolution errors in the console, and inspect your dependency tree with `bun pm ls --all`. The self-contained IIFE already bundles the peers.

2. **Module not imported** — Import `@jpahd/kalendus` in the browser entry point and check `customElements.get('lms-calendar')` after it runs. If the element is still undefined, check that the import wasn't removed or blocked before changing calendar data.

3. **Constrained container height** — Check for a zero-sized or clipping flex/grid wrapper. Day, Week, and Year have bounded fallbacks in auto-height embeds. See [Height and Scrolling](./layout-and-positioning.md#height-and-scrolling).

---

## Calendar Has Zero Height

In 0.12.0, a definite height bounds all four views and includes the toolbar. Without a resolved height, Month grows with its content and the other views use bounded fallbacks. If the calendar is clipped, check the actual wrapper's size, min-size and overflow rather than the page's viewport.

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

7. **Unexpected response shape** — Check the response status and ensure you pass an array of calendar entries, not an error body or an object envelope. Non-array input is treated as empty, not as a set of invalid records. Render fetch failures separately from a successful empty result.

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

> **Note:** Await `calendar.localeReady` for the current load/fallback and root render. Pending catalogs hide header/main content; failed imports emit `locale-error`, restore usable English fallback and expose retry UX (`await calendar.retryLocale()`). If retry keeps showing the fallback after the connection recovers, reload the page: browsers can keep failed module requests cached for the current document. `locale-ready` includes `catalogLocale` and `fallback`, even for English/unsupported tags. See [Events Reference](./events.md#locale-ready).

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

**Symptoms:** Week shows fewer days than the configured count, even in a wide browser window.

**Cause:** Week measures the calendar, not the window. The two count tokens are maxima above and below `--week-mobile-breakpoint` (default `768px`). The default `--week-min-day-width: 8em` can reduce either count to keep lanes readable; enlarged text can reduce it further.

**Fixes:**

- To keep readable lanes, widen the embed or use the day-window pager to see the rest of the week.
- To customize the maxima, set `--week-day-count` (default `7`) and `--week-mobile-day-count` (default `3`).
- To restore fixed counts, set `--week-min-day-width: 0`. Set both count tokens to `7` only if all seven columns are usable in the intended embed.

See [Week View Condensed Mode](./layout-and-positioning.md#week-view-condensed-mode).

---

## Year View Not Responsive

**Symptoms:** Year stays at the same number of columns when the embed changes size, or uses fewer columns than expected.

**Cause:** An explicit `--year-grid-columns` pins the count. With automatic layout, Year responds to the space below the toolbar, text size, pointer targets, and whether dates show counts. The same width can fit different arrangements at different heights.

**Fix:** Remove a pinned `--year-grid-columns` to restore automatic layout. Resize the actual embed rather than just the window. In very narrow embeds, Year can pan horizontally instead of shrinking date targets. See [Year View Grid Columns](./layout-and-positioning.md#year-view-grid-columns).

---

## Events Not Firing

**Symptoms:** `addEventListener` callbacks never execute.

**Causes & fixes:**

1. **Wrong event for the action** — Listen on `<lms-calendar>`. Use `calendar-state-change` for committed navigation, including property assignments. Legacy `switchview` describes a header action, not every change in view.

2. **Listener installed after the initial event** — Attach before connecting the element to receive the first snapshot. If it is already mounted, initialize from the public getters after `updateComplete`. See [Events Reference](./events.md#calendar-state-change).

3. **Framework event binding syntax or interrupted bubbling** — Native listeners through a ref work across framework versions; remove them on teardown. Vue 3 can bind `@calendar-state-change` directly. The documented public events cross shadow boundaries, but an earlier listener can stop propagation.

---

## Month View Shows Dots Instead of Full Entries

**Symptoms:** Month shows activity indicators or per-date counts instead of event previews.

**Cause:** With `month-presentation="auto"`, Month uses compact indicators when the calendar is narrower than the larger of **768px** and **48 times its font size**. The measured embed can be narrow even on a wide screen. Explicit `month-presentation="presence"` or `month-day-behavior="inline"` can also keep the grid compact.

**Fixes:**

- With the default presentation, selecting a compact date stays in Month; `month-day-behavior="day"` drills into Day. Explicit `presence` or `previews` keeps selection in Month (or in Agenda if enabled).
- Widen the embed, or set `month-presentation="previews"` to opt into previews. Only rows that fit are mounted. In default wide Month, **+N** drills into Day; with explicit `previews`, it opens the selected-date list (or Agenda).

See [Month Recognition and Selection](./layout-and-positioning.md#month-recognition-and-selection).

---

## Native Dependency Build Fails on macOS (Node 25+)

**Symptoms:** `bun install` fails with `fatal error: 'climits' file not found` when building `better-sqlite3` or other native addons.

This workaround applies when the native build log indicates missing SDK headers. `better-sqlite3` is an optional **server workspace** dependency, not a dependency of the published calendar package. Server CI uses Node 24; first try the project's tested Node version and verify the Xcode Command Line Tools are installed.

If the compiler still cannot find SDK headers, set the SDK for that installation:

```bash
CXXFLAGS="-isysroot $(xcrun --show-sdk-path)" bun install
```

If the Xcode Command Line Tools are not installed:

```bash
xcode-select --install
```

---

## `display: none` Breaks Layout

**Symptoms:** After toggling visibility, the calendar renders at wrong dimensions.

A `display: none` embed cannot be measured while hidden. The calendar observes its size again when the embed is visible. Let layout and observation settle before reading the date window, and use `calendar-state-change` to observe any correction in Week's visible range.

If the layout is still wrong after reveal, inspect the visible wrapper's width, definite height and overflow. Don't replace `entries` or remount just to request a measurement. See [Height and Scrolling](./layout-and-positioning.md#height-and-scrolling).
