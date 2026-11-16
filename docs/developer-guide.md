---
layout: base.njk
title: 'Developer Guide'
order: 8
tags: docs
section: Internals
---

# Developer Guide

This guide documents the internal mechanisms of Kalendus so contributors can diagnose issues, extend features, and keep behavior consistent across views.

## Architecture Snapshot

| Layer                | Responsibility                                                         | Key files                                                                          |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Reactive controllers | Per-instance state (`viewMode`, `activeDate`) and navigation helpers   | `src/lib/ViewStateController.ts`                                                   |
| Entry processing     | Normalize on `.entries` changes; expand/cache on visible-range changes | `src/lib/calendarModel.ts`, `src/lms-calendar.ts`                                  |
| Layout pipeline      | Convert expanded entries into visual boxes for each view               | `src/lib/LayoutCalculator.ts`, `src/lib/allDayLayout.ts`, `src/lib/SlotManager.ts` |
| Rendering shells     | View-specific components (Header, Week, Month, Day, Year)              | `src/components/*.ts`                                                              |
| Localization         | Message bundle + generated locale templates                            | `src/lib/messages.ts`, `src/generated/locales/*.ts`                                |

### Typical render flow

1. **Inputs change** (usually `.entries`, `.locale`, or CSS width) → `willUpdate` validates entries, sorts timed items, and precomputes derived caches.
2. **Expanded entries** are stored once per update, along with: ISO-date buckets (`_expandedByISODate`), per-day counts (`_entrySumByDay`), and layout caches invalidated for day/week views.
3. **View selection** uses `ViewStateController` and user events (`switchview`, `switchdate`, `jumptoday`).
4. **Week context** (`computeWeekDisplayContext`) reads CSS tokens to decide how many day columns to render and whether the “peek” navigation should be shown.
5. **SlotManager + LayoutCalculator** convert expanded entries into positioned `<lms-calendar-entry>` elements for each view, reusing memoized layout results whenever possible.

## Key Mechanisms

### Entry validation & expansion

- `normalizeEntries()` in `calendarModel.ts` validates civil dates, time endpoints, IDs and IANA zones without mutating caller records. Explicit `kind` controls all-day/timed semantics; omitted `kind` retains legacy promotion. DST gaps/ambiguous zoned endpoints are rejected.
- `expandEntries()` intersects normalized entries with the half-open `visibleRange`, retaining canonical source records and identity separately from per-day segments/continuation metadata. It enforces a segment budget rather than expanding entire lifetimes.
- The root emits `entries-invalid` and `entries-error` diagnostics; preserve these paths when modifying ingestion.
- `_entrySumByDay` keeps canonical ISO (`YYYY-MM-DD`) keys for year density and compact indicators.
- `_expandedByISODate` is the authoritative lookup for day/week queries. Always prefer reading from it instead of re-splitting the raw entry array.

### Layout pipeline

- **Timed entries**: `_renderDayEntriesWithSlotManager` maps each entry to a `LayoutCalculator` box. Results are cached per ISO date, so repeated renders only reconstruct DOM nodes when data changes.
- **All-day entries**: `allocateAllDayRows` receives normalized `AllDayEvent` records (`id`, `days`, `isMultiDay`) to determine row stacking. Cache keys include the condensed-week offsets so each peek window reuses assignments.
- **SlotManager** abstracts slot naming and CSS generation. Prefer `slotManager.generatePositionCSS` + `slotManager.calculateAccessibility` instead of duplicating grid math.

### Condensed week views

`computeWeekDisplayContext(activeDate, firstDayOfWeek, calendarWidth, hostEl)` returns:

- `visibleDates`, `visibleStartIndex`, `visibleLength`: used by `<lms-calendar-week>` to render 3-day peeks (or any other configured size).
- `gridColumns`: CSS string applied to the week component (`var(--time-column-width) repeat(n, 1fr)`).
- `isCondensed`: enables peek navigation. The root assigns the target active date and reports the resulting visible window in committed state.

To customize behavior, override CSS tokens on the host component:

```css
lms-calendar {
    --week-day-count: 7; /* desktop columns */
    --week-mobile-day-count: 4; /* columns below breakpoint */
    --week-mobile-breakpoint: 640px;
}
```

### Localization workflow

- **[src/locales/README.md](https://github.com/pders01/kalendus/blob/main/src/locales/README.md) is authoritative.** Edit English `src/locales/source.json` and translations in `src/locales/catalogs/<locale>.json`; never translate generated TypeScript or XLIFF.
- Run `bun scripts/check-locales.mjs --write`, then `bun run i18n:check`. The check validates completeness, placeholders, preservation and extraction/build roundtrips in a disposable fixture. Raw `i18n:extract` / `i18n:build` are derivative tooling, not the normal source workflow.
- Retrieve legacy fields through `getMessages(locale)` and complete phrases/plurals through `getMessageFormatters(locale)` during render. Preserve stable IDs and all original translations; structural checks do not establish linguistic quality.
- The resolver retains formatting preferences while resolving aliases/catalog fallback. The root owns the current load promise/generation guard, `localeReady`, `retryLocale()`, `locale-error`/`locale-ready`, fallback UX and host `lang`/requested-versus-resolved `dir`. Failed imports settle with usable fallback and remain retryable; stale loads must not update the current instance.
- Monday (`firstDayOfWeek = 1`) is the explicit default, independent of locale. Recommended week starts are not automatic policy.

### Common Use Cases / Troubleshooting

| Scenario                                    | Recommended steps                                                                                                                                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Add a new locale**                        | Follow the canonical catalog workflow below; never edit generated templates.                                                                                                             |
| **Different condensed-window sizes**        | Override `--week-mobile-day-count` or `--week-day-count`. The controller automatically clamps between 1 and 7 days and re-centers around the active date.                                |
| **All-day events overlap incorrectly**      | Prefer `kind: 'all-day'`; inspect bounded `allocateAllDayRows` inputs and stable IDs, not sentinel time heuristics.                                                                      |
| **Performance spikes with huge entry sets** | Keep visible-range expansion bounded in `calendarModel.ts` and reuse normalized records/caches. Preserve segment-budget diagnostics.                                                     |
| **Custom analytics on view changes**        | Listen for `switchview`, `switchdate`, `peek-navigate`, and `expand` events on `<lms-calendar>`. Drill targets (e.g., `'day'` vs `'month'`) are included in the `expand` detail payload. |

### Testing Tips

- Unit tests live under `test/unit/`. Use `bun run test` for the Mocha suite or `bun run test -- path/to/file.test.ts` for a targeted run.
- Week/day layout logic has dedicated tests in `test/unit/lib/allDayLayout.test.ts`, `test/unit/lib/ViewStateController.test.ts`, `test/unit/LayoutCalculator.test.ts`, and `test/unit/week-row-allocation.test.ts`.
- When modifying CSS token behavior or condensed-week logic, add/extend tests in `test/unit/lib/weekDisplayContext.test.ts` (create this file if missing) to ensure the context math stays stable.

## Adding a New Locale

1. Read [the canonical catalog guide](https://github.com/pders01/kalendus/blob/main/src/locales/README.md) and use its stable source IDs/placeholders.
2. Add the catalog code to `lit-localize.json` target locales and create `src/locales/catalogs/<locale>.json` with complete keys; explicitly retain English fallback where translation is pending review.
3. Register the loader/resolution in `src/lib/messages.ts` as needed without changing other instances' active locale.
4. Run `bun scripts/check-locales.mjs --write` and `bun run i18n:check`; do not copy derivative output over canonical dictionaries or edit preservation snapshots.
5. Run `bun run docs:sync`, add relevant component/resolver tests and obtain native-speaker review. ISO week numbering stays independent of the explicit week-start policy.

## Public integration contracts

`src/contracts.ts` defines committed state and entry requests. Keep `activeDate` / `viewMode` owner controls, half-open ISO `visibleRange`, and initial/changed post-render `calendar-state-change` aligned. Do not use legacy header action details to drive adapters. Activation/export requests must remain cancelable before their defaults, carry canonical entries and stable IDs, and honor `preventDefault()`.

The inspector is non-modal (top-layer popover with fallback), with no Tab trap/background inertness. Automated component checks do not establish Safari/device/screen-reader success. See [Events Reference](./events.md), [server README](https://github.com/pders01/kalendus/blob/main/server/README.md) and [native bridge build/check guide](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md) for downstream contracts and remaining manual gates.

## Staying Consistent

- Keep date keys canonical (`YYYY-MM-DD`) across caches and map lookups.
- Prefer declarative data flow (“compute once, read many”)—controllers and helper modules exist so views stay dumb.
- When introducing new view-specific features, document their CSS tokens and event payloads in `README.md` plus the developer guide so integrators stay informed.
