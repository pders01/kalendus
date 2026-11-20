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

1. **Entry input changes** → `willUpdate` normalizes `.entries`. A visible range change can reuse the normalized records.
2. **Entry caches** use bounded expansion to prepare ISO-date buckets (`_expandedByISODate`) and date counts (`_entrySumByDay`). Rebuilding these caches invalidates the Day and Week layouts.
3. **View selection** uses `ViewStateController` and user events (`switchview`, `switchdate`, `jumptoday`).
4. **Week context** (`computeWeekDisplayContext`) reads CSS tokens to decide how many day columns to render and whether the “peek” navigation should be shown.
5. **View-data helpers** prepare timed boxes, all-day placements, Month previews, and Agenda pages. The root binds that data to Lit templates and owns measurement, focus, and events.

## Key Mechanisms

### Entry validation & expansion

- `normalizeEntries()` in `calendarModel.ts` validates civil dates, time endpoints, IDs and IANA zones without mutating caller records. Explicit `kind` controls all-day/timed semantics; omitted `kind` retains legacy promotion. DST gaps/ambiguous zoned endpoints are rejected.
- `expandEntries()` intersects normalized entries with the half-open `visibleRange`, retaining canonical source records and identity separately from per-day segments/continuation metadata. It enforces a segment budget rather than expanding entire lifetimes.
- The root emits `entries-invalid` and `entries-error` diagnostics; preserve these paths when modifying ingestion.
- `_entrySumByDay` keeps canonical ISO (`YYYY-MM-DD`) keys for year density and compact indicators.
- `_expandedByISODate` is the authoritative lookup for day/week queries. Always prefer reading from it instead of re-splitting the raw entry array.

### Layout pipeline

- **Timed entries**: `layoutTimedEntries()` prepares `LayoutCalculator` boxes cached by ISO date and card/marker presentation. `getDenseTimedGroups()` uses the current lane width to decide which groups need disclosure.
- **All-day entries**: `layoutAllDaySegments()` assigns rows and visible span edges in Month, Day, and Week. Day and Week cache placements by display window.
- **Month and Agenda**: `buildMonthPreviews()` preserves sparse preview lanes. `prepareAgendaEntries()` orders and pages the real segments for date and density lists.
- **SlotManager** owns slot naming, position CSS, and entry accessibility labels. See the [Rendering Pipeline](./rendering-pipeline.md) for the full path.

### Condensed week views

`computeWeekDisplayContext(activeDate, firstDayOfWeek, calendarWidth, hostEl)` returns:

- `visibleDates`, `visibleStartIndex`, `visibleLength`: used by `<lms-calendar-week>` to render the current day window. A configured maximum can be reduced to keep lanes readable.
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

- **[src/locales/README.md](https://github.com/pders01/kalendus/blob/main/src/locales/README.md) is authoritative.** Edit English `src/locales/source.json` and translations in `src/locales/catalogs/<locale>.json`; never translate generated TypeScript or XLIFF. When English wording changes, keep the matching eager string or contextual formatter fallback in `src/lib/messages.ts` in sync.
- Run `bun scripts/check-locales.mjs --write`, then `bun run i18n:check`. The check validates completeness, placeholders, preservation and extraction/build roundtrips in a disposable fixture. Raw `i18n:extract` / `i18n:build` are derivative tooling, not the normal source workflow.
- Retrieve legacy fields through `getMessages(locale)` and complete phrases/plurals through `getMessageFormatters(locale)` during render. Preserve stable IDs and all original translations; structural checks do not establish linguistic quality.
- The resolver retains formatting preferences while resolving aliases/catalog fallback. The root owns the current load promise/generation guard, `localeReady`, `retryLocale()`, `locale-error`/`locale-ready`, fallback UX and host `lang`/requested-versus-resolved `dir`. Failed imports settle with usable English fallback; stale loads must not update the current instance.
- The resolver evicts rejected loader promises so `retryLocale()` can invoke the loader again in the same document. That does not clear the browser's module map: after a built chunk fails to load, the browser may remember the failure for that URL and reject a retry without fetching it again. If retry still shows English, reload the page after the chunk is available again.
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

- Unit tests live under `test/unit/`. Use `bun run test` for the Mocha suite or `bun run test -- --grep weekDisplayContext` to filter by a suite/test name. Adding a file path alone does not replace the configured test globs.
- Use `bun run docs:sync` to regenerate docs sections deliberately. `bun run docs:build` checks those sections and builds the site without rewriting source files. Its link check covers internal anchors and pages, not runnable examples or external destinations.
- Week/day layout logic has dedicated tests in `test/unit/lib/allDayLayout.test.ts`, `test/unit/lib/ViewStateController.test.ts`, `test/unit/LayoutCalculator.test.ts`, and `test/unit/week-row-allocation.test.ts`.
- When modifying CSS token behavior or condensed-week logic, extend `test/unit/lib/weekDisplayContext.test.ts` and the browser viewport tests. Pure layout math does not capture real scrollbars, text metrics, or clipping.

### Review calendar layouts

In Storybook, open **Visual review → Viewport matrix** to compare Day, Week,
Month, Agenda, and Year. Controls are available in each linked live story, not
on the matrix itself. Presets describe the iframe in CSS pixels; the calendar
reserves space for surrounding padding and does not emulate real device input.
**Library scenarios** contains longer journeys and embed layouts.

```bash
bun run test:e2e -- test/e2e/calendar-review.spec.ts
REVIEW_CAPTURE=1 bun run test:e2e -- --browser=webkit test/e2e/calendar-review.spec.ts
```

These tests build production Storybook and check, among other paths, Docs and
matrix links, the Month → Agenda → Week journey, and a dense all-day drill-down
in shallow Week. Stop the development server first, or set `E2E_PORT` to a free
port (the default is `6006`). Even a docs-only E2E run starts the production
Storybook server; the docs tests serve a separate local Pages build.

Set `REVIEW_CAPTURE=1` to save screenshots alongside the ignored Playwright
results. Use `--output` with a new directory under `screenshots/` to retain a
run. Screenshots are for review, not pixel baselines or device certification.

### Automated test matrix

| Suite                                                                       | Standalone default | `test:release` default    | CI                        |
| --------------------------------------------------------------------------- | ------------------ | ------------------------- | ------------------------- |
| `test:components` (Web Test Runner)                                         | Chromium           | Chromium, Firefox, WebKit | Chromium, Firefox, WebKit |
| `test:bridge` (external shell) and `test:bridge:inline` (inline IIFE shell) | Chromium           | Chromium, Firefox, WebKit | Chromium, Firefox, WebKit |
| `bun run --cwd server test:browser` (real calendar adapter)                 | Chromium           | Chromium, Firefox, WebKit | Chromium, Firefox, WebKit |
| `test:package` (packed calendar browser smoke)                              | Chromium           | Chromium, Firefox, WebKit | Chromium                  |
| `test-storybook` (Vitest browser project)                                   | Chromium           | Chromium                  | Chromium                  |
| `test:e2e` (production Storybook via Playwright)                            | Chromium           | Chromium                  | Chromium                  |

`TEST_BROWSERS=chromium,firefox,webkit` selects engines only for the first four rows. For E2E, use Playwright's `--browser` flag (for example, `bun run test:e2e -- --browser=webkit`). Storybook's Vitest project explicitly configures Chromium. The nonbrowser root Mocha suite runs on Node 22 and 24 in CI; the server unit and installed-package checks run on Node 24. Playwright WebKit is not shipping Safari.

By default, the packed calendar check validates Bundler and NodeNext declaration consumers with `skipLibCheck: false`, plus runtime behavior using the **locked** peers (Lit 3.3.2 and Luxon 3.7.2). After `bun run build:all`, run `bun run test:package --minimum-peers` to install the tarball with the **declared minimum** peers (Lit 3.0.0 and Luxon 3.4.4) in a fresh consumer and repeat those checks. This tests the direct peer versions; their dependencies still resolve from their own ranges.

The packed browser smoke asserts a fixed public `activeDate`, checks that mounting in English requests no locale chunks, then verifies the rendered Arabic catalog after switching. A separate run serves HTTP 503 for the built Arabic chunk and checks the error event, usable English fallback, and Arabic direction. It observes the result of a same-document retry without requiring recovery, then reloads and verifies HTTP 200 and Arabic rendering. The resolver unit test separately shows that the same resolver can recover if its loader rejects once and succeeds on the next call; it does not simulate the browser's module map.

## Release checklist

1. Use the exact candidate revision in a fresh checkout. Verify the package version, documented peer ranges, and [release notes](./release-notes.md) against its public contracts. Keep screenshots and design experiments out of the package.
2. Run the full automated gate from the workspace root:

    ```bash
    bun install --frozen-lockfile
    bunx playwright install chromium firefox webkit
    bun run test:release
    bun run test:package --minimum-peers
    bun pm pack --dry-run
    ```

    On Linux, Playwright may need system browser dependencies; CI uses `--with-deps`. Use the suite-specific matrix above when reporting verification. A narrower `TEST_BROWSERS` run does not replace the full matrix for suites that honor it. Keep runner startup failures visible rather than marking that engine green.

3. Review the production Storybook journeys and inspect the package contents. The release script builds ESM and IIFE, checks TypeScript and browser consumers of the packed ESM and installed server migrations, validates catalogs and built documentation links, runs the production dependency audit, and checks all three size budgets. The packed browser check matters: source-based component and Storybook tests do not exercise the minified npm entry point.
4. On a real phone, select a Month date, read and export an Agenda event, then switch to Week to compare times. Check shipping Safari and enlarged text/RTL, shallow Week, compact Year drill-down, and keyboard focus return. For the opt-in edit path, separately check desktop move/resize and cancellation in Safari and the app's keyboard/touch alternatives. An automated proposal or canceled download is not a verified persistence workflow or native download. Keep screen-reader and Expo/Metro device verification separate from browser emulation.

Preparation does not publish the package or deploy the server or documentation.

## Adding a New Locale

1. Read [the canonical catalog guide](https://github.com/pders01/kalendus/blob/main/src/locales/README.md) and use its stable source IDs/placeholders.
2. Add the catalog code to `lit-localize.json` target locales and create `src/locales/catalogs/<locale>.json` with complete keys; explicitly retain English fallback where translation is pending review.
3. Register the loader/resolution in `src/lib/messages.ts` as needed without changing other instances' active locale.
4. Run `bun scripts/check-locales.mjs --write` and `bun run i18n:check`. The checker pins the frozen manifest and verifies every historical runtime and XLIFF snapshot against it. New locales do not need preservation snapshots. Do not edit the frozen manifest or snapshots, or copy derivative output over canonical dictionaries.
5. Run `bun run docs:sync`, add relevant component/resolver tests and obtain native-speaker review. ISO week numbering stays independent of the explicit week-start policy.

## Formatting and types

Run `bun run format` to format maintained source, tests, scripts, the Expo bridge TSX, and repository configuration. `bun run format:check` checks the same files in CI. Historical review notes, generated bridge artifacts, and SQLite migration metadata are not formatter inputs.

`bun run typecheck` checks root TypeScript, including Storybook stories. The server uses `bun run --cwd server typecheck`. The Expo wrapper needs the native SDK declarations; follow the [Expo typecheck instructions](https://github.com/pders01/kalendus/tree/main/expo-bridge#native-tsx-typecheck-gate-separate-not-simulated) instead of installing those packages into the workspace.

## Dependency audits

Run `bun run audit:production` from the workspace root. It checks the locked production dependency graph at all severities and blocks CI packaging and the root release suite on a nonzero exit. The server's publish hook also checks its production graph. These checks need access to the registry advisory service; a failed check is not a clean result.

CI also uploads the full `dependency-audit` report, including development tools. It is informational, not an exemption from triage. Use `bun pm why <package>` to trace findings, check whether the affected behavior is used, and prefer targeted upgrades with a frozen-lockfile test run. A clean production audit does not certify runtime security or cover other lockfiles used by consumers.

## Public integration contracts

`src/contracts.ts` defines committed state and entry requests. Keep `activeDate` / `viewMode` owner controls, half-open ISO `visibleRange`, and initial/changed post-render `calendar-state-change` aligned. Do not use legacy header action details to drive adapters. Activation/export requests must remain cancelable before their defaults, carry canonical entries and stable IDs, and honor `preventDefault()`.

The inspector is non-modal (top-layer popover with fallback), with no Tab trap/background inertness. Automated component checks do not establish Safari/device/screen-reader success. See [Events Reference](./events.md), [server README](https://github.com/pders01/kalendus/blob/main/server/README.md) and [native bridge build/check guide](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md) for downstream contracts and remaining manual gates.

## Staying Consistent

- Keep date keys canonical (`YYYY-MM-DD`) across caches and map lookups.
- Prefer declarative data flow (“compute once, read many”)—controllers and helper modules exist so views stay dumb.
- When introducing new view-specific features, document their CSS tokens and event payloads in `README.md` plus the developer guide so integrators stay informed.
