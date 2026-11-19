---
layout: base.njk
title: 'Library Usage'
order: 2
tags: docs
section: Usage
---

# Using Kalendus as a Library

`@jpahd/kalendus` provides the `<lms-calendar>` custom element as ESM, with TypeScript declarations and a custom elements manifest. `lit` and `luxon` are peer dependencies. Import the package once to register the element; keep this side-effect import in your bundle.

```sh
bun add @jpahd/kalendus lit luxon
```

```ts
import '@jpahd/kalendus';
import type LMSCalendar from '@jpahd/kalendus';
import type { CalendarEntry, CalendarState } from '@jpahd/kalendus';

const calendar = document.querySelector<LMSCalendar>('lms-calendar')!;
calendar.entries = entries;
```

The component uses Custom Elements, Shadow DOM, ResizeObserver and CSS container queries. Give it a height to fit Day, Week, and Year into a specific space, or let those views use their bounded fallback. Month fills extra space in a sized Grid or flex parent that stretches it, while keeping normal page flow when it needs more room. See [Layout & Positioning](./layout-and-positioning.md). Browser API support is not a claim of Safari, native-device or assistive-technology verification.

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

Years are `1..9999`, months `1..12`, and dates must exist. Hours are `0..23`, minutes `0..59`; only an **end** boundary may be `24:00`. Reversed intervals are rejected. Zero-duration timed point events are supported with minimum display geometry; server writes have a stricter legacy contract (see [server guide](./api-server.md)).

### Legacy compatibility

Omitting `kind` preserves inclusive date ends and the legacy repeated daily time window. Missing time, a multi-day date span, an end-hour minus start-hour of at least 23, or `isContinuation: true` promotes a legacy entry to all-day. This is intentionally not applied to explicit timed entries. Prefer explicit kinds rather than constructing `00:00–23:59` sentinels.

### Identity, validation and bounded work

Supply a nonempty, stable `id` from your application, especially across refetches. For duplicate caller IDs or repeated source objects, the **first valid** record wins. Distinct objects without IDs remain distinct; their fallback identity is not a persistent backend identifier. Caller records/arrays are not sorted or expanded in place.

Invalid records are dropped individually and reported through `entries-invalid` with `{ issues: [{ index, entry, reason }] }`. Valid entries are normalized, sorted and expanded **only within the visible range**. A 100,000-segment cap prevents unbounded visible expansion. Exceeding it clears derived entries and reports `entries-error` with `{ code: 'segment-budget', message, limit, range }`, plus a default alert (replaceable via content assigned to `slot="entries-error"`). It does not silently truncate. Supply fewer records or select a smaller view.

Canonical original records are retained separately from display slices, so activation/export does not lose original dates, times or metadata. See [Events Reference](./events.md).

## `<lms-calendar>` API surface

### Public properties

| Property          | Attribute           | Type                                   | Default                    | Notes                                                                                                                                     |
| ----------------- | ------------------- | -------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `heading`         | `heading`           | `string`                               | unset                      | Header title.                                                                                                                             |
| `activeDate`      | —                   | `CalendarDate`                         | today                      | Owner can assign a date to navigate.                                                                                                      |
| `viewMode`        | `view-mode`         | `'day' \| 'week' \| 'month' \| 'year'` | `'month'`                  | Owner can assign the displayed view.                                                                                                      |
| `entries`         | —                   | `CalendarEntry[]`                      | `[]`                       | Use a new array reference for changes.                                                                                                    |
| `color`           | `color`             | `string`                               | `'#000000'`                | An explicit value sets the accent. When unset, the getter returns `'#000000'` for compatibility, but the default style uses `CanvasText`. |
| `locale`          | `locale`            | BCP 47 `string`                        | page `<html lang>` or `en` | Per-instance formatting and catalog resolution.                                                                                           |
| `firstDayOfWeek`  | `first-day-of-week` | `0..6`                                 | `1`                        | Sunday = 0; Monday default is **not locale-derived**. Invalid values reset to 1.                                                          |
| `yearDrillTarget` | `year-drill-target` | `'day' \| 'month'`                     | `'month'`                  | View opened by year day cells.                                                                                                            |
| `yearDensityMode` | `year-density-mode` | `'dot' \| 'heatmap' \| 'count'`        | `'dot'`                    | Per-day density visualization.                                                                                                            |
| `dir`             | `dir`               | `'ltr' \| 'rtl' \| 'auto'`             | `'auto'`                   | Getter retains requested mode; host attribute exposes resolved direction.                                                                 |

Objects/arrays belong on JavaScript properties, not serialized HTML attributes. Assign new entries/objects instead of mutating them in place.

### Responsive flow and owner status

`monthDayBehavior` / `month-day-behavior` accepts `auto` (default), `inline`, or
`day`. Compact `auto` keeps Month open with a selected-date list; `day` retains
legacy Day drilling. `loading` (boolean, default false) and `error` (string,
default empty) are owner-controlled status inputs. The `status` slot can replace
the fallback. Adapters and Expo do not infer loading/error from empty entries.

### Experimental presentation choices

The library defaults are unchanged. Use these options to choose an alternate presentation:

| Property                  | Attribute                   | Values                                      | Default |
| ------------------------- | --------------------------- | ------------------------------------------- | ------- |
| `monthPresentation`       | `month-presentation`        | `auto`, `presence`, `previews`              | `auto`  |
| `monthAgendaPresentation` | `month-agenda-presentation` | `full`, `preview`, `on-demand`, `accordion` | `full`  |
| `timedEntryPresentation`  | `timed-entry-presentation`  | `card`, `marker`                            | `card`  |

### Month and Agenda

Opt in with `<lms-calendar month-agenda-presentation="accordion">`. Month and
Agenda share one calendar, one date, and the Day/Week/Month/Year switcher. Picking
a date opens Agenda. Use **‹ Month** beside the Agenda date to return to the
selected date in the grid. The header arrows advance by day
in Agenda and by month in the grid. Setting `month-day-behavior="day"` disables
the Agenda option and keeps the existing Month behavior.

Agenda puts **All Day** before **Timed**, with jumps when both sections exist.
Opening a row shows the full description and a **↓ Download .ics** button inline.
The latest opened multi-day event is underlined in Month without changing the
selected date or the event counts. Returning to a recently visited date keeps its
open row, without moving toolbar focus to a deep position. The first 50 rows of
each section render immediately; longer lists have a continuation control.
Agenda is not a fifth `viewMode`: it reports `month` and a one-day `visibleRange`.
Existing behaviors and default presentations are unchanged.

In the other Month list modes, selected-date details stay inline. `preview` starts with at
most three chronological rows; `on-demand` starts closed. Their localized header
buttons distinguish Show all/Show fewer from Show events/Hide events. Expansion
keeps the control's space and focus; it does not create an internal list scroller.
The complete list starts with 50 rows and continues on request; that rendering
bound is not a claim that a long page is comfortable to browse. Changing the date,
view or list policy resets expansion and the row budget.

The explicit simpler `presence` candidate uses at most two individual multi-day
tracks, allocated consistently over the displayed Month. If those cannot represent
all spans, the **entire displayed compact Month** uses localized total event counts
on occupied dates instead. Counts include one-day events and convey cardinality, not hours,
availability or individual multi-day identity. A dense Month cannot individually
trace every event; readable selected-date lists do not solve cross-date comparison.

`card` retains readable minimum geometry and full textual ranges; `marker` separates
proportional duration marks from readable labels. These options are not automatically
exposed by the server adapter or Expo wrapper. Invalid values normalize to their
defaults.

### Methods and getters

- **`visibleRange`** (read-only): `{ start, end }` in ISO `YYYY-MM-DD`, half-open `[start, end)`. Includes Month grid spillover and actual condensed-week columns. Day and Month's opt-in Agenda cover one day; Year covers the active year. These are dates, not UTC timestamps.
- **`localeReady: Promise<void>`**: waits for the current load/fallback and root render. It settles even on a failed catalog import; it does not assert every translation or descendant layout is complete.
- **`retryLocale(): Promise<void>`**: reruns catalog resolution after a load failure without toggling the property. A browser-cached module failure may require a page reload.
- **`openMenu(details)`**: opens the built-in inspector with `{ heading, content, displayTime, time?, date?, anchorRect?, entry?, eventId? }`. Supply the canonical `entry` and stable `eventId` for correct multi-day export. A display-only call without a date/entry cannot export an event.

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

Use `event.detail.range` for data loading. Dedupe unchanged ranges, abort superseded requests and ignore stale fulfillment **and** rejection. A late-attached listener can initialize from the public getters after `updateComplete`. Do not reconstruct windows from legacy `switchdate.detail.direction` or `switchview.detail.view`.

```js
calendar.addEventListener('calendar-state-change', ({ detail }) => {
    saveNavigation(detail.activeDate, detail.viewMode);
    refreshVisibleRange(detail.range); // application loader accepts a half-open range
});
calendar.viewMode = 'week';
calendar.activeDate = { year: 2026, month: 3, day: 15 };

calendar.addEventListener('entry-activate', (event) => {
    event.preventDefault(); // replace the default inspector
    showApplicationDetails(event.detail.entry, event.detail.eventId);
});
calendar.addEventListener('export-entry', (event) => {
    event.preventDefault(); // replace the default ICS download
    exportFromApplication(event.detail.entry, event.detail.eventId);
});
```

Both requests are cancelable and carry canonical original `{ entry, eventId? }`, not a rendered segment. Cancel synchronously with **`preventDefault()`**, not `stopPropagation()`. `export-error` reports generation failures. Legacy `switchdate`, `switchview`, `jumptoday`, `expand`, `peek-navigate`, `open-menu` and `menu-close` remain available. See [Events Reference](./events.md) for payloads, diagnostics and locale events.

The optional [entry interactions module](./events.md#entry-change-requests-opt-in) adds move and resize requests to timed Day/Week cards. It is imported separately and never writes to `entries`.

## Entry layout and year controls

Day and Week fit all 24 hours when the space below their headers and all-day band allows it without hiding more timed-card detail. Otherwise they scroll at a readable scale. Use `scroll-time-grid` to always use that detail layout. See [Time Grid Sizing](./layout-and-positioning.md#time-grid-sizing).

Timed entries use minute-based absolute positioning with overlap layout calculated from effective grid scale/minimum geometry; they are not fixed at one pixel per minute. All-day entries use row allocation. Narrow month layouts use compact indicators; condensed weeks use the actual visible window for both rendering and range reporting.

Year shows twelve months with localized month and weekday names. `year-density-mode` selects dots (presence), heatmap buckets, or exact counts below the dates. These signals describe the number of events on a date, not availability.

Year uses the available width to limit its column count. It tries a taller arrangement only when the viewport shape favors it, and uses fewer rows if the rendered months would otherwise overflow. Set `--year-grid-columns` to bypass automatic arrangement. When the weekday columns don’t fit, scroll sideways anywhere in Year to pan all months together. Month labels stay at the leading edge of the visible area while their panel is in view. Moving focus with the date keys also scrolls the focused date into view.

`year-drill-target` controls what opens when selecting a date; month labels always open Month, and week numbers open Week. Use committed state for routing/fetches; legacy `expand` remains useful for action analytics.

## Styling and theming

Import a built-in theme or override CSS custom properties on the host:

```js
import '@jpahd/kalendus/themes/default.css';
```

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #fefefe;
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
- Optional backend: [API Server Guide](./api-server.md) and authoritative [server README](https://github.com/pders01/kalendus/blob/main/server/README.md) cover private authorization, exact-origin CORS, inclusive server queries and the committed-state adapter.
- Optional native source integration: [Expo bridge](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md) covers IIFE/inline build, bridge checks, separate Expo typecheck and unverified device gates. Do not use its development shell as a standalone Metro HTML asset.

For missing entries, locale loading or layout issues, see [Troubleshooting](./troubleshooting.md).
