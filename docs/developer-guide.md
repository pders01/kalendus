# Developer Guide

This guide documents the internal mechanisms of Kalendus so contributors can diagnose issues, extend features, and keep behavior consistent across views.

## Architecture Snapshot

| Layer                | Responsibility                                                       | Key files                                                                          |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Reactive controllers | Per-instance state (`viewMode`, `activeDate`) and navigation helpers | `src/lib/ViewStateController.ts`                                                   |
| Entry processing     | Validate, expand, and cache entries whenever `.entries` changes      | `src/lms-calendar.ts` (`willUpdate`, `_computeEntryCaches`)                        |
| Layout pipeline      | Convert expanded entries into visual boxes for each view             | `src/lib/LayoutCalculator.ts`, `src/lib/allDayLayout.ts`, `src/lib/SlotManager.ts` |
| Rendering shells     | View-specific components (Header, Week, Month, Day, Year)            | `src/components/*.ts`                                                              |
| Localization         | Message bundle + generated locale templates                          | `src/lib/messages.ts`, `src/generated/locales/*.ts`                                |

### Typical render flow

1. **Inputs change** (usually `.entries`, `.locale`, or CSS width) → `willUpdate` validates entries, sorts timed items, and precomputes derived caches.
2. **Expanded entries** are stored once per update, along with: ISO-date buckets (`_expandedByISODate`), per-day counts (`_entrySumByDay`), and layout caches invalidated for day/week views.
3. **View selection** uses `ViewStateController` and user events (`switchview`, `switchdate`, `jumptoday`).
4. **Week context** (`computeWeekDisplayContext`) reads CSS tokens to decide how many day columns to render and whether the “peek” navigation should be shown.
5. **SlotManager + LayoutCalculator** convert expanded entries into positioned `<lms-calendar-entry>` elements for each view, reusing memoized layout results whenever possible.

## Key Mechanisms

### Entry validation & expansion

- `willUpdate` treats missing `time` as all-day, so consumers can omit `time` for all-day blocks.
- `_expandEntryMaybe` splits multi-day entries into per-day slices and annotates `continuation` metadata (`index`, `total`, `has`, `is`).
- `_entrySumByDay` keeps ISO (`YYYY-M-D`) keys. The Year view, mobile “month-dot” badges, and responsive indicators consume this map directly.
- `_expandedByISODate` is the authoritative lookup for day/week queries. Always prefer reading from it instead of re-splitting the raw entry array.

### Layout pipeline

- **Timed entries**: `_renderDayEntriesWithSlotManager` maps each entry to a `LayoutCalculator` box. Results are cached per ISO date, so repeated renders only reconstruct DOM nodes when data changes.
- **All-day entries**: `allocateAllDayRows` receives normalized `AllDayEvent` records (`id`, `days`, `isMultiDay`) to determine row stacking. Cache keys include the condensed-week offsets so each peek window reuses assignments.
- **SlotManager** abstracts slot naming and CSS generation. Prefer `slotManager.generatePositionCSS` + `slotManager.calculateAccessibility` instead of duplicating grid math.

### Condensed week views

`computeWeekDisplayContext(activeDate, firstDayOfWeek, calendarWidth, hostEl)` returns:

- `visibleDates`, `visibleStartIndex`, `visibleLength`: used by `<lms-calendar-week>` to render 3-day peeks (or any other configured size).
- `gridColumns`: CSS string applied to the week component (`var(--time-column-width) repeat(n, 1fr)`).
- `isCondensed`: instructs navigation handlers to emit `peek-navigate` events, shifting the window left/right without changing the active date.

To customize behavior, override CSS tokens on the host component:

```css
lms-calendar {
    --week-day-count: 7; /* desktop columns */
    --week-mobile-day-count: 4; /* columns below breakpoint */
    --week-mobile-breakpoint: 640px;
}
```

### Localization workflow

- Message keys live in `src/lib/messages.ts`. Add new keys there, then run `pnpm i18n:extract` / `pnpm i18n:build` to update `src/generated/locales/*.ts`.
- Consumers can override UI text by providing new target locales or by translating the generated template files.
- Common a11y strings (`previous`, `next`, `events`, `viewLabel`) are part of the message bundle. Prefer retrieving them via `getMessages(locale)`.

### Common Use Cases / Troubleshooting

| Scenario                                    | Recommended steps                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Add a new locale**                        | 1) Append code to `lit-localize.json`. 2) Run `pnpm i18n:extract`. 3) Translate strings in `src/generated/locales/<code>.ts`. 4) Register the template map in `src/lib/messages.ts` and `lit-localize.json`. 5) Add sample Storybook locale if needed. |
| **Different condensed-window sizes**        | Override `--week-mobile-day-count` or `--week-day-count`. The controller automatically clamps between 1 and 7 days and re-centers around the active date.                                                                                              |
| **All-day events overlap incorrectly**      | Ensure entries without `time` remain all-day; avoid providing `time` ranges shorter than 24 hours for all-day blocks. Inspect `allocateAllDayRows` inputs by logging `allDayLayoutEvents`.                                                             |
| **Performance spikes with huge entry sets** | Verify that layout caches are reused. When adding new derived data, store per-entry metadata during `_expandEntryMaybe` to avoid re-hashing in inner loops.                                                                                            |
| **Custom analytics on view changes**        | Listen for `switchview`, `switchdate`, `peek-navigate`, and `expand` events on `<lms-calendar>`. Drill targets (e.g., `'day'` vs `'month'`) are included in the `expand` detail payload.                                                               |

### Testing Tips

- Unit tests live under `test/unit/`. Use `pnpm test` for the full suite or `NODE_OPTIONS=--experimental-vm-modules mocha path/to/file.test.ts` for targeted runs.
- Week/day layout logic has dedicated tests in `test/unit/lib/allDayLayout.test.ts`, `test/unit/lib/ViewStateController.test.ts`, and `test/unit/week-rendering.test.ts`.
- When modifying CSS token behavior or condensed-week logic, add/extend tests in `test/unit/lib/weekDisplayContext.test.ts` (create this file if missing) to ensure the context math stays stable.

## Adding a New Locale

1. Add the locale code to `lit-localize.json` target locales
2. Run `pnpm exec lit-localize extract` to generate the template file
3. Translate strings in `src/generated/locales/<locale>.ts`
4. Add the import and entry in `src/lib/messages.ts` (`allTemplates` map)
5. Optionally add a `LUXON_LOCALE_MAP` entry in `localization.ts` if the locale code differs from Intl/Luxon conventions

## Staying Consistent

- Keep date keys canonical (`YYYY-MM-DD`) across caches and map lookups.
- Prefer declarative data flow (“compute once, read many”)—controllers and helper modules exist so views stay dumb.
- When introducing new view-specific features, document their CSS tokens and event payloads in `README.md` plus the developer guide so integrators stay informed.
