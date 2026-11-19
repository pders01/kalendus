---
layout: base.njk
title: 'Release Notes'
order: 2.5
tags: docs
section: Getting Started
---

# Release Notes

## 0.11.0

This release makes the calendar fit its embed, keeps dates and events readable on small screens, and gives consumers explicit contracts for fetching entries, opening details, and exporting events.

### What changed

- **One toolbar across views.** Day, Week, Month, and Year share navigation and view switching. Day and Week retain readable time labels and a reachable timeline in shallow embeds. Classic scrollbar gutters line up the date header, all-day band, and timeline where `scrollbar-gutter` is supported.
- **Month stays in context.** Compact selection keeps Month open with a selected-day list. The optional Agenda accordion groups all-day and timed events and lets readers expand descriptions and download `.ics` files inline. Wide Month and sparse Week use one all-day bar per visible span rather than repeating the title on every day. Month mounts only previews that fit; `+N` still reflects the actual hidden events.
- **Readable details and overviews.** The inspector is non-modal, scrolls long details, and returns focus to its invoker when appropriate. Condensed Week limits its visible dates to the available width. Year fits its mini-months to the embed; dot, heatmap, and count modes describe event density, not availability.
- **Theme and locale consistency.** Neutral colors follow the host color scheme, while built-in themes remain opt-in. Time and detail text inherit the calendar font unless explicitly overridden. UI catalogs retain their prior translations and cover the new controls and messages. Calendar dates stay Gregorian and the week-start policy remains explicit.
- **Canonical export.** The `.ics` download uses the source event rather than a clipped preview. The export preserves exclusive all-day ends, floating or zoned time semantics, and UTF-8 line folding.

### Upgrade from 0.10.2

| If you use…                                | What to check                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Luxon as a peer**                        | Use Luxon `^3.4.4`; Lit remains `^3.0.0`. Bundled pages that load the IIFE do not install these peers separately.                                                                                                                                                                                                                                  |
| **Month date clicks**                      | The default `month-day-behavior="auto"` uses contextual selection in a compact Month. Set `month-day-behavior="day"` to always drill into Day. `month-agenda-presentation="accordion"` is opt-in and does not add a fifth public view mode.                                                                                                        |
| **Timed or multi-day records**             | Prefer explicit `kind: 'timed'` or `kind: 'all-day'`, and stable IDs. Omitted `kind` still uses legacy inference. See the [data contracts](./library-usage.md#data-contracts) for midnight, time-zone, and endpoint rules.                                                                                                                         |
| **Range-based loading and custom actions** | Load from `calendar-state-change`. Its `detail.range` mirrors the calendar’s half-open ISO `visibleRange`. Listen for and synchronously cancel `entry-activate` or `export-entry` to replace the default inspector or download. See [Events Reference](./events.md).                                                                               |
| **Custom fonts and colors**                | Neutral styling still inherits from the embed, and the built-in themes are opt-in. If you want a separate time face, keep or set the explicit tokens in the [Typography guide](./theming.md#typography).                                                                                                                                           |
| **The optional server and SSE adapter**    | No calendar route is implicitly public. Default streams send invalidations, not event records. **Deploy updated clients first**: use `onInvalidate` and refetch on `onReconcile`; `onSync` receives only record-bearing events. Use the [API Server Guide](./api-server.md) for the independent host authorization policy and transport migration. |
| **Expo / React Native**                    | Rebuild the self-contained inline shell using the [native bridge guide](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md). The development shell is not a Metro asset; make native SDK, packaging, and device verification separate checks.                                                                                     |

Start with [Library Usage](./library-usage.md) and the Storybook [review scenarios](./developer-guide.md#review-calendar-layouts). Browser automation and viewport emulation don't replace physical-device, shipping Safari, or assistive-technology review.
