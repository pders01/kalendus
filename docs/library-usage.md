---
layout: base.njk
title: 'Library Usage'
order: 2
tags: docs
section: Usage
---

# Using Kalendus as a Library

`@jpahd/kalendus` provides the `<lms-calendar>` custom element as ESM, with TypeScript declarations and a custom elements manifest. `lit` and `luxon` are peer dependencies. Import the package once to register the element; keep this side-effect import in your bundle.

This guide describes `main`, the **unreleased 0.12.0 candidate**. For the published version, use the [0.11.0 documentation](https://github.com/pders01/kalendus/tree/v0.11.0). The following bundled-browser quick start works with both versions; this command installs the published release:

```sh
bun add @jpahd/kalendus@0.11.0 lit luxon
```

```ts
import '@jpahd/kalendus';
import type { CalendarEntry } from '@jpahd/kalendus';

const date = { day: 17, month: 11, year: 2026 };
const entries: CalendarEntry[] = [
    {
        id: 'studio-check-in',
        kind: 'timed',
        heading: 'Studio check-in',
        date: { start: date, end: date },
        time: { start: { hour: 9, minute: 0 }, end: { hour: 9, minute: 45 } },
    },
];

const calendar = document.createElement('lms-calendar');
calendar.heading = 'My Calendar';
calendar.activeDate = date;
calendar.entries = entries;
document.body.append(calendar);
```

**Sizing on the 0.12.0 candidate:** a definite height bounds the whole calendar in all four views, including Month. A sized Month scrolls its grid or selected-date list inside the view when needed. Without a supplied height, Month grows in page flow; Day, Week, and Year use bounded fallbacks. The published 0.11.0 keeps Month in page flow even with a height and uses the detail scale in Day and Week. See [Layout & Positioning](./layout-and-positioning.md). The component uses Custom Elements, Shadow DOM, ResizeObserver, and CSS container queries; that does not establish shipping Safari, native-device, or assistive-technology compatibility.

## Data contracts

```ts
type CalendarDate = { day: number; month: number; year: number };
type CalendarTime = { hour: number; minute: number };
type CalendarTimeInterval = { start: CalendarTime; end: CalendarTime };
type CalendarDateInterval = { start: CalendarDate; end: CalendarDate };

type CalendarEntry = {
    id?: string;
    kind?: 'all-day' | 'timed';
    timeZone?: string;
    date: CalendarDateInterval;
    time?: CalendarTimeInterval;
    heading: string;
    content?: string;
    color?: string;
    isContinuation?: boolean;
    continuation?: { has: boolean; is: boolean; index: number; total: number };
};
```

### Explicit temporal semantics (preferred)

- **`kind: 'all-day'`**: `date.start` and `date.end` are inclusive Gregorian civil dates. Omit `time`; any supplied time is ignored.
- **`kind: 'timed'`**: `time` is required. The date/time pairs are the original endpoints of **one continuous interval**, with an exclusive end. Overnight/multi-day timed entries stay in the timed grid; interior days are split at midnight only for display. An end at midnight on the following date does not create a segment on that date.
- **Floating**: without `timeZone`, wall-clock values remain floating, not instants inferred from the browser zone. ICS export preserves floating values.
- **Zoned**: `timeZone` must be a valid IANA zone, such as `Europe/Berlin`. Endpoints are interpreted in that zone. DST gaps and ambiguous repeated wall-clock endpoints are rejected rather than silently shifted or guessed. Display remains the supplied civil/wall-clock schedule; this is not a viewer-zone conversion API. ICS export converts explicit zoned endpoints to UTC instants.

```ts
const entries: CalendarEntry[] = [
    {
        id: 'holiday-2026',
        kind: 'all-day',
        heading: 'Holiday',
        date: { start: { year: 2026, month: 3, day: 15 }, end: { year: 2026, month: 3, day: 17 } },
    },
    {
        id: 'overnight-42',
        kind: 'timed',
        heading: 'Maintenance',
        timeZone: 'Europe/Berlin',
        date: { start: { year: 2026, month: 3, day: 15 }, end: { year: 2026, month: 3, day: 16 } },
        time: { start: { hour: 23, minute: 0 }, end: { hour: 2, minute: 0 } },
    },
];
```

Input dates are Gregorian, with years `1..9999` and months `1..12`; dates must exist. Hours are `0..23`, minutes `0..59`; only an **end** boundary may be `24:00`. Reversed intervals are rejected. Zero-duration timed point events are supported with minimum display geometry. Fetch windows are a separate, half-open civil-date contract; only their exclusive end can be `10000-01-01`. The optional source/local-tarball server has a stricter legacy write contract and inclusive range queries (see [server guide](./api-server.md)).

### Legacy compatibility

Omitting `kind` preserves inclusive date ends and the legacy daily time window. A supplied window is validated **before** all-day inference: `23:00`–`02:00` is reversed and rejected even if the dates span multiple days. For overnight events, use explicit `kind: 'timed'` with a later end date, as above. A valid legacy record is promoted to all-day if time is missing, it spans multiple dates, its end-hour minus start-hour is at least 23, or `isContinuation` is `true`. None of those heuristics applies to explicit timed entries. Prefer explicit kinds over `00:00–23:59` sentinels.

### Identity, validation and bounded work

Supply a nonempty, stable `id` from your application, especially across refetches. For duplicate caller IDs or repeated source objects, the **first valid** record wins. Distinct objects without IDs remain distinct; their fallback identity is not a persistent backend identifier. Caller records/arrays are not sorted or expanded in place.

The entire assigned array is validated and its accepted records are normalized and sorted internally, even outside the visible range. Invalid records are dropped individually and reported through `entries-invalid` with `{ issues: [{ index, entry, reason }] }`. On the 0.12.0 candidate, a non-array value clears the rendered entries and reports a collection issue at index `-1`. The exception is `null`, which represents an attribute reset (Lit also yields `null` for invalid JSON or JSON `null`); assign `[]` to clear entries from application code. Only **day expansion** is clipped to the visible range. A 100,000-segment cap prevents unbounded visible expansion. Exceeding it clears derived entries and reports `entries-error` with `{ code: 'segment-budget', message, limit, range }`, plus a default alert (replaceable via content assigned to `slot="entries-error"`). It does not silently truncate. Supply fewer records or select a smaller view.

Canonical original records are retained separately from display slices, so activation/export does not lose original dates, times, or metadata. The TypeScript input requires a string `heading`; the 0.12.0 candidate also rejects missing and non-string headings at runtime. Use `heading: ''` for an intentionally untitled entry: the inspector uses its localized fallback while activation and export retain the unchanged record. See [Events Reference](./events.md).

## `<lms-calendar>` API surface

### Public properties

| Property          | Attribute           | Type                                   | Default                    | Notes                                                                                                                                     |
| ----------------- | ------------------- | -------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `heading`         | `heading`           | `string`                               | unset                      | Header title.                                                                                                                             |
| `activeDate`      | —                   | `CalendarDate`                         | today                      | Owner can assign a date to navigate.                                                                                                      |
| `viewMode`        | `view-mode`         | `'day' \| 'week' \| 'month' \| 'year'` | `'month'`                  | Owner can assign the displayed view.                                                                                                      |
| `entries`         | `entries` (JSON)    | `CalendarEntry[]`                      | `[]`                       | Assign as a JavaScript property with a new array reference.                                                                               |
| `color`           | `color`             | `string`                               | `'#000000'`                | An explicit value sets the accent. When unset, the getter returns `'#000000'` for compatibility, but the default style uses `CanvasText`. |
| `locale`          | `locale`            | BCP 47 `string`                        | page `<html lang>` or `en` | Per-instance formatting and catalog resolution.                                                                                           |
| `firstDayOfWeek`  | `first-day-of-week` | `0..6`                                 | `1`                        | Sunday = 0; Monday default is **not locale-derived**. Invalid values reset to 1.                                                          |
| `yearDrillTarget` | `year-drill-target` | `'day' \| 'week' \| 'month'`           | `'month'`                  | View opened by Year date cells.                                                                                                           |
| `yearDensityMode` | `year-density-mode` | `'dot' \| 'heatmap' \| 'count'`        | `'dot'`                    | Per-day density visualization.                                                                                                            |
| `dir`             | `dir`               | `'ltr' \| 'rtl' \| 'auto'`             | `'auto'`                   | Getter retains requested mode; host attribute exposes resolved direction.                                                                 |
| `scrollTimeGrid`  | `scroll-time-grid`  | `boolean`                              | `false`                    | Unreleased 0.12.0: keep the Day/Week detail scale rather than fitting all 24 hours.                                                       |

The `entries` attribute accepts a JSON array for literal markup. Prefer JavaScript properties for application data and updates. Assign new arrays and changed records instead of mutating them in place.

### Responsive flow and owner status

`monthDayBehavior` / `month-day-behavior` accepts `auto` (default), `inline`, or
`day`. With the default `monthPresentation: 'auto'` and no accordion, compact
`auto` keeps Month open with a selected-date list; wide Month drills into Day,
including from `+N`. `inline` keeps the selection in Month, and `day` requests
legacy Day drilling. An enabled accordion takes precedence over the inline list;
`day` disables the accordion, but explicit `presence` or `previews` still keeps
selection inline.

`loading` (boolean, default false) and `error` (string, default empty) are owner-controlled status inputs. The `status` slot can replace the fallback. Adapters and Expo do not infer loading/error from empty entries.

### Experimental presentation choices

Only the comparison values in the last column are experimental. The defaults are unchanged.

| Property                  | Attribute                   | Default | Other supported values              | Experimental           |
| ------------------------- | --------------------------- | ------- | ----------------------------------- | ---------------------- |
| `monthPresentation`       | `month-presentation`        | `auto`  | —                                   | `presence`, `previews` |
| `monthAgendaPresentation` | `month-agenda-presentation` | `full`  | `preview`, `on-demand`, `accordion` | —                      |
| `timedEntryPresentation`  | `timed-entry-presentation`  | `card`  | —                                   | `marker`               |

### Month and Agenda

Opt in with `<lms-calendar month-agenda-presentation="accordion">`. Month and
Agenda share one calendar, one date, and the Day/Week/Month/Year switcher. Picking
a date opens Agenda. Use **‹ Month** beside the Agenda date to return to the
selected date in the grid. The header arrows advance by day
in Agenda and by month in the grid. Setting `month-day-behavior="day"` disables
the accordion, but does not override the explicit inline `presence` or `previews` modes.

Agenda puts **All Day** before **Timed**, with jumps when both sections exist.
Opening a row dispatches `entry-activate`; unless canceled, the row shows the full
description and a **↓ Download .ics** button inline. The button dispatches `export-entry`.
The latest opened multi-day event is underlined in Month without changing the
selected date or the event counts. Returning to a recently visited date keeps its
open row, without moving toolbar focus to a deep position. The first 50 rows of
each section render immediately; longer lists have a continuation control.
Agenda is not a fifth `viewMode`: it reports `month` and a one-day `visibleRange`.
Existing behaviors and default presentations are unchanged.

In the other Month list modes, selected-date details stay inline. `preview` starts with at
most three chronological rows; `on-demand` starts closed. Their localized header
buttons distinguish Show all/Show fewer from Show events/Hide events. Expansion
keeps the control's space and focus. A sized Month scrolls the grid and list within
its view; an unsized Month grows in page flow. Expansion does not create a separate
nested list scroller.
The complete list starts with 50 rows and continues on request; that rendering
bound is not a claim that a long page is comfortable to browse. Changing the date,
view or list policy resets expansion and the row budget.

The experimental `presence` mode uses at most two individual multi-day
tracks, allocated consistently over the displayed Month. If those cannot represent
all spans, the **entire displayed compact Month** uses localized total event counts
on occupied dates instead. Counts include one-day events and convey cardinality, not hours,
availability or individual multi-day identity. A dense Month cannot individually
trace every event; readable selected-date lists do not solve cross-date comparison.

The experimental `previews` mode shows previews even at compact sizes and keeps
selection inline. `card` retains readable minimum geometry and full textual ranges;
the experimental `marker` mode separates proportional duration marks from readable
labels. These options are not automatically
exposed by the server adapter or Expo wrapper. Invalid values normalize to their
defaults.

### Methods and getters

- **`visibleRange`** (read-only; 0.12.0 semantics): after the first render, the last committed `{ start, end }`, half-open `[start, end)`. Includes Month grid spillover and the actual condensed-week columns, clipped to the supported civil era. Day and Month's opt-in Agenda cover one day; Year covers the active year. These are civil dates, normally `YYYY-MM-DD`, not UTC timestamps. The exclusive end alone may be `10000-01-01`; handle it explicitly or compare parsed civil dates, not unqualified string order.
- **`localeReady: Promise<void>`**: waits for the current load/fallback and root render. It settles even on a failed catalog import; it does not assert every translation or descendant layout is complete.
- **`retryLocale(): Promise<void>`**: reruns catalog resolution after a load failure without toggling the property. A browser-cached module failure may require a page reload.
- **`openMenu(details)`**: opens the built-in inspector without emitting `entry-activate`. Accepts `{ heading, content, displayTime, time?, date?, anchorRect?, entry?, eventId? }`. Supply the canonical `entry` and stable `eventId` for correct multi-day export. When no `entry` is supplied, a `date` allows the inspector to construct a single-day export record; a display-only call without either cannot export.

## Committed state and requests

The component updates its public navigation properties through interaction; an owner can set them and persist the reported state. The root emits an initial **`calendar-state-change`** after rendering and changed committed snapshots:

```ts
type CalendarState = {
    activeDate: CalendarDate;
    viewMode: 'day' | 'week' | 'month' | 'year';
    firstDayOfWeek: number;
    range: { start: string; end: string };
};
```

Use `event.detail` for an atomic committed snapshot: `activeDate` and `viewMode` expose requested navigation, while `visibleRange` exposes the last committed range on the 0.12.0 candidate. Use the snapshot's `range` for data loading. Dedupe unchanged ranges, abort superseded requests, and ignore stale fulfillment **and** rejection. A late-attached listener can initialize from the public getters after `updateComplete`. Do not reconstruct windows from legacy `switchdate.detail.direction` or `switchview.detail.view`.

```js
calendar.addEventListener('calendar-state-change', ({ detail }) => {
    saveNavigation(detail.activeDate, detail.viewMode);
    refreshVisibleRange(detail.range); // application loader accepts a half-open range
});
calendar.viewMode = 'week';
calendar.activeDate = { year: 2026, month: 3, day: 15 };

calendar.addEventListener('entry-activate', (event) => {
    event.preventDefault(); // replace the inspector or inline Agenda disclosure
    showApplicationDetails(event.detail.entry, event.detail.eventId);
});
calendar.addEventListener('export-entry', (event) => {
    event.preventDefault(); // replace the default ICS download
    exportFromApplication(event.detail.entry, event.detail.eventId);
});
```

Both requests are cancelable and carry `{ entry, eventId? }`, using the original record for rendered entries. Ordinary cards and lists emit `open-menu`, then `entry-activate` if not canceled, before opening the inspector. Accordion Agenda uses activation for inline disclosure and dispatches export from its download button. Cancel synchronously with **`preventDefault()`**, not `stopPropagation()`. `export-error` reports generation or download setup failures. Legacy `switchdate`, `switchview`, `jumptoday`, `expand`, `peek-navigate`, `open-menu`, and `menu-close` remain available. See [Events Reference](./events.md) for payloads, diagnostics, and locale events.

**Unreleased 0.12.0:** the opt-in [entry interactions module](./events.md#entry-change-requests-opt-in) adds move and resize proposals for explicit timed entries. Pointer gestures apply to Day/Week cards; app-owned controls can propose a change without dragging. Import the subpath separately; it never writes to `entries` and is not in the 0.11.0 package.

## Entry layout and year controls

**Unreleased 0.12.0:** Day and Week fit all 24 hours when the space below their headers and all-day band allows it without losing timed-card detail. Otherwise they scroll at a readable scale. Use `scroll-time-grid` to always use that detail layout. See [Time Grid Sizing](./layout-and-positioning.md#time-grid-sizing).

Timed entries use minute-based positioning; overlap layout depends on the effective grid scale and minimum card geometry, not a fixed pixel per minute. On the candidate, timed collision counts open a scoped list with the timeline still mounted. Closing the list focuses the trigger if it is visible, or the timeline otherwise. Week all-day totals can replace the grid with a scoped list without navigating. Neither disclosure changes the committed range. All-day entries use row allocation. Narrow Month uses compact indicators by default; condensed weeks use the actual visible window for rendering and range reporting.

Year shows twelve months with localized month and weekday names. `year-density-mode` selects dots (presence), heatmap buckets, or exact counts below the dates. These signals describe the number of events on a date, not availability.

Year uses the available width to limit its column count. It tries a taller arrangement only when the viewport shape favors it, and uses fewer rows if the rendered months would otherwise overflow. Set `--year-grid-columns` to a positive integer to pin the column count and bypass automatic arrangement. When the weekday columns don’t fit, scroll sideways anywhere in Year to pan all months together. Month labels stay at the leading edge of the visible area while their panel is in view. Moving focus with the date keys also scrolls the focused date into view.

`year-drill-target` makes a date cell open Day, Week, or Month (the default); month labels always open Month, and week numbers open Week. Use committed state for routing/fetches; legacy `expand` remains useful for action analytics.

## Styling and theming

To use a built-in theme, import its stylesheet:

```js
import '@jpahd/kalendus/themes/default.css';
```

Alternatively, customize the neutral base on the host with a scheme-aware foreground and background:

```css
lms-calendar {
    color: CanvasText;
    --primary-color: #1976d2;
    --background-color: Canvas;
    --entry-font-size: 0.85rem;
    --week-mobile-day-count: 3;
}
```

Both root/entry `color` **properties** accept the supported hex, named, `rgb()`/`rgba()` and `hsl()`/`hsla()` forms. Alpha is validated and discarded; rendering uses opaque colors. Unsupported/malformed values use a safe fallback. **OKLCH, arbitrary CSS expressions and `var(--custom-color)` are outside the documented property contract.** CSS theme tokens are a separate styling surface; browser CSS support does not extend that contract. See [Theming](./theming.md) and [CSS Tokens](./css-tokens.md).

## Localization

Catalog codes are listed in the [README](https://github.com/pders01/kalendus/blob/main/README.md#supported-locales). Formatting preserves regional/script/numbering preferences independently of catalog fallback: `de-AT`/`de-DE` use German, English variants use built-in English, Simplified Chinese aliases resolve to `zh-Hans`, and Traditional Chinese does not silently use Simplified Chinese. Unsupported tags use English; malformed tags safely normalize to `en`.

Each instance starts from page `<html lang>` unless explicitly configured. The root manages host `lang` (including English fallback) and automatic RTL direction for `ar`, `he`, `fa`, `ur`, `yi`; explicit `dir` overrides are supported. The whole layout, including day flow/time axis, follows the resolved direction.

`firstDayOfWeek` is always an explicit policy with default **1 Monday**, independent of locale. Week numbering is ISO-8601, also independent of that policy.

Header/main content is hidden while a catalog is pending. Failed imports report `locale-error`, show retry/fallback UX, and settle `localeReady`; `locale-ready` includes `{ locale, catalogLocale, fallback }`, including English/fallback loads. Complete contextual/count phrases now have translations in all shipped catalogs, preserving the original legacy values. New translations still require native-speaker review; structural/roundtrip checks do not certify linguistic quality.

Contributors must edit canonical JSON, **not generated templates/XLIFF**. See [translation source of truth](https://github.com/pders01/kalendus/blob/main/src/locales/README.md):

```sh
bun scripts/check-locales.mjs --write
bun run i18n:check
```

## Keyboard and inspector behavior

Header controls are semantic labeled buttons with view state. Date grids implement keyboard navigation; entry controls support Enter/Space. The root has a concise polite range announcement rather than making the full entry tree a live region.

The inspector is **non-modal**, using a top-layer popover where supported and a body-portal/dialog fallback. A short title and close control share one row. The title, temporal metadata and notes can scroll in the adjacent body column while close and export remain reachable; long content is not truncated to preserve the header. Tab can leave it; the background is not inert. Opening focuses its close control; Escape, close and light dismissal dismiss it. Focus restoration avoids stealing focus from a control chosen during light dismissal. These are implementation behaviors, not full-accessibility certification; Safari, real-device, reflow and screen-reader checks remain separate verification.

## Integration and testing

- In Lit, use `.entries=${entries}`, `.activeDate=${date}` and `.viewMode=${view}`; bind custom events with `@calendar-state-change` / `@entry-activate` as appropriate. No `unsafeStatic` is needed for a literal tag.
- In React or Vue, use a typed element ref for object properties and native `addEventListener`/cleanup when needed. Angular integrations should configure custom-element support in the host application. See [Integration Guide](./integration-guide.md).
- Prefer public properties and real controls in tests over dispatching fabricated internal events. `updateComplete` waits for the root, not its entire descendant tree; await `localeReady` for locale settlement and appropriate frames/child updates for layout.
- Filter remote data by the canonical visible range rather than sending an entire database. Assign immutable arrays after refresh.
- Optional backend (source workspace or local tarball, not in the public registry): [API Server Guide](./api-server.md) and [server README](https://github.com/pders01/kalendus/blob/main/server/README.md) cover private authorization, exact-origin CORS, inclusive server queries, and the committed-state adapter.
- Optional native source integration: [Expo bridge](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md) covers the IIFE/inline build, bridge checks, and separate Expo typecheck and device verification. The candidate's protocol v2 requires regenerating the inline shell and updating the copied wrapper together. Do not use the development shell as a standalone Metro HTML asset.

For missing entries, locale loading or layout issues, see [Troubleshooting](./troubleshooting.md).
