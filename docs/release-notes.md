---
layout: base.njk
title: 'Release Notes'
order: 2.5
tags: docs
section: Getting Started
---

# Release Notes

## 0.12.0

Published on npm as [`@jpahd/kalendus@0.12.0`](https://www.npmjs.com/package/@jpahd/kalendus/v/0.12.0). The [v0.12.0 source tag](https://github.com/pders01/kalendus/tree/v0.12.0) identifies the tested release commit. The optional server and Expo bridge remain source integrations; they were not published as separate packages.

### New public API

- **App-owned timed edits.** `@jpahd/kalendus/entry-interactions` is a new opt-in module. Enable it for desktop move and resize gestures on explicit timed Day and Week cards. App-owned buttons or forms can call `requestChange()` with the current accepted source record without dragging. An `entry-change-request` is a proposal, not a write: the app decides whether to adopt it and owns authorization, persistence, and reconciliation for saved changes. Read-only calendars do not load the gesture code.
- **Scrollable time-grid detail.** Day and Week fit all 24 hours when the grid can do so without merging timed cards that could be shown separately. Remaining timed groups open in context alongside the live timeline. Set `scroll-time-grid` or `calendar.scrollTimeGrid = true` to keep the scrollable detail scale. Narrow Week adapts its visible day count; set `--week-min-day-width: 0` to retain a fixed configured count.

### Upgrade from 0.11.0

- A definite height now bounds the **whole calendar** in all four views. Sized Month scrolls its grid or selected-date list inside the view; remove the height to let Month grow in page flow. Day, Week, and Year have bounded fallbacks without a height. Within a sized embed, the toolbar stays separate from view scrolling except when the embed is too short for both.
- Counts depend on the view: the default wide Month `+N` still drills into Day; Day/Week timed collision counts keep the timeline mounted; Week all-day totals can replace it with a scoped list without navigating. When a timed list closes, focus returns to its trigger if visible, or to the timeline otherwise. Changes to a timed group's members or schedule, or its date leaving the visible range, close its list. Day/Week list disclosures do not change the committed range.
- **Committed state:** `activeDate` and `viewMode` expose requested navigation, while `visibleRange` returns the last committed range after first render. Fetch from `calendar-state-change` for a consistent snapshot. Civil ranges are half-open and clipped to years 1–9999; the exclusive end may be `10000-01-01`, so do not validate both ends as four-digit years or compare that sentinel lexically.
- **ICS:** for entries without IDs, a generated UID stays stable for the same source object in the same runtime. Supply a stable ID across refetches. A positive-duration end outside ICS years 1–9999 uses `DURATION` in place of `DTEND`; a UTC start outside those years reports `export-error`. Import behavior in external calendar clients is a separate check.
- **Entry validation:** non-array payloads now report a collection issue at index `-1` (except Lit's `null` reset). Entries without a string `heading` are rejected. Use `heading: ''` for the localized untitled presentation without changing the canonical entry returned by callbacks.
- **TypeScript declarations:** emitted template types now refer to `lit`, not to a direct consumer-resolved `lit-html` import. The packed check covers strict Bundler and NodeNext consumers with locked peers; `--minimum-peers` repeats both declaration and runtime checks with the declared direct peer floors.
- **Optional server:** the source workspace/local tarball still accepts its own floating-time API format. Map edit proposals to your persistence contract and validate them there. Custom REST fetch no longer silently falls back to native SSE; configure a stream transport or explicitly opt in to cookie-safe native SSE. Read `streamState` separately from REST results.
- **Expo bridge v2:** update the copied wrapper/protocol and regenerate the inline shell together from the intended source revision; do not reuse existing ignored build artifacts. Protocol v2 adds `calendarId` and `navigationRevision`; a mixed v1/v2 pair cannot complete the handshake even if neither field is used. `onEntriesInvalid` reports bounded, record-free diagnostics for calendar rejection after transport validation. Bridge readiness does not confirm individual entry acceptance or settled layout. Follow the [source bridge guide](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md) and verify native behavior separately.

See [Events Reference](./events.md#entry-change-requests-opt-in) and [Height and Scrolling](./layout-and-positioning.md#height-and-scrolling).

## 0.11.0

This was the previous root release. Use the [0.11.0 documentation](https://github.com/pders01/kalendus/tree/v0.11.0) when following a recipe for this version. It keeps dates and events readable on small screens and gives consumers explicit contracts for fetching entries, opening details, and exporting events.

### What changed

- **One toolbar across views.** Day, Week, Month, and Year share navigation and view switching. Day and Week retain readable time labels and a reachable timeline in shallow embeds. Classic scrollbar gutters line up the date header, all-day band, and timeline where `scrollbar-gutter` is supported.
- **Month stays in context.** Compact selection keeps Month open with a selected-day list. The optional Agenda accordion groups all-day and timed events and lets readers expand descriptions and download `.ics` files inline. Wide Month and sparse Week use one all-day bar per visible span rather than repeating the title on every day. Month mounts only previews that fit; `+N` still reflects the actual hidden events.
- **Readable details and overviews.** The inspector is non-modal, scrolls long details, and returns focus to its invoker when appropriate. Condensed Week limits its visible dates to the available width. Year fits its mini-months to the embed; dot, heatmap, and count modes describe event density, not availability.
- **Theme and locale consistency.** Neutral colors follow the host color scheme, while built-in themes remain opt-in. Time and detail text inherit the calendar font unless explicitly overridden. UI catalogs retain their prior translations and cover the new controls and messages. Calendar dates stay Gregorian and the week-start policy remains explicit.
- **Canonical export.** The `.ics` download uses the source event rather than a clipped preview. The export writes exclusive all-day DATE ends, preserves floating or zoned time semantics, and folds lines by UTF-8 length.

### Upgrade from 0.10.2

| If you use…                                | What to check                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Luxon as a peer**                        | Use Luxon `^3.4.4`; Lit remains `^3.0.0`. Bundled pages that load the IIFE do not install these peers separately.                                                                                                                                                                                                                              |
| **Month date clicks**                      | The default `month-day-behavior="auto"` uses contextual selection in a compact Month. With `month-presentation="auto"`, set `month-day-behavior="day"` to drill into Day. Explicit `presence` and `previews` still select inline. `month-agenda-presentation="accordion"` is opt-in and does not add a fifth public view mode.                 |
| **Timed or multi-day records**             | Prefer explicit `kind: 'timed'` or `kind: 'all-day'`, and stable IDs. Omitted `kind` still uses legacy inference. See the [0.11.0 data contracts](https://github.com/pders01/kalendus/blob/v0.11.0/docs/library-usage.md#data-contracts) for midnight, time-zone, and endpoint rules.                                                          |
| **Range-based loading and custom actions** | Load from `calendar-state-change` using its half-open `detail.range`. Listen for and synchronously cancel `entry-activate` or `export-entry` to replace default details or downloads. See the [0.11.0 Events Reference](https://github.com/pders01/kalendus/blob/v0.11.0/docs/events.md).                                                      |
| **Custom fonts and colors**                | Neutral styling still inherits from the embed, and the built-in themes are opt-in. If you want a separate time face, keep or set the explicit tokens in the [0.11.0 Typography guide](https://github.com/pders01/kalendus/blob/v0.11.0/docs/theming.md#typography).                                                                            |
| **The optional server and SSE adapter**    | Source/local tarball only. No calendar route is implicitly public. Default streams send invalidations, not event records. Update clients to use `onInvalidate` and refetch on `onReconcile`; `onSync` receives only record-bearing events. See the [0.11.0 source guide](https://github.com/pders01/kalendus/blob/v0.11.0/docs/api-server.md). |
| **Expo / React Native**                    | Rebuild the self-contained inline shell using the [0.11.0 native bridge guide](https://github.com/pders01/kalendus/blob/v0.11.0/expo-bridge/README.md). The development shell is not a Metro asset; make native SDK, packaging, and device verification separate checks.                                                                       |

For the current release, start with [Library Usage](./library-usage.md) and the Storybook [review scenarios](./developer-guide.md#review-calendar-layouts). Browser automation and viewport emulation don't replace physical-device, shipping Safari, or assistive-technology review.
