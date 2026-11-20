---
layout: base.njk
title: 'Architecture'
order: 10
tags: docs
section: Internals
---

# Architecture

This describes the unreleased **0.12.0** source. For the published package, see the [v0.11.0 reference](https://github.com/pders01/kalendus/tree/v0.11.0).

## Component Structure

```
src/
├── lms-calendar.ts              # Main calendar component & global types
├── contracts.ts                 # Committed state, half-open range, entry requests
├── locales/                     # Canonical JSON source/catalogs; see its README
├── components/
│   ├── Header.ts                # Navigation and view controls
│   ├── Month.ts                 # Monthly calendar grid
│   ├── Week.ts                  # Weekly time-based view
│   ├── Day.ts                   # Daily detailed view
│   ├── Year.ts                  # Year overview with drill targets and density modes
│   ├── Entry.ts                 # Individual event component
│   ├── Context.ts               # Weekday header row (month view)
│   └── Menu.ts                  # Event detail popover with ICS export
├── lib/
│   ├── calendarModel.ts         # Civil-date validation, identity, bounded expansion
│   ├── messages.ts              # Per-instance catalog resolution/loading and phrase helpers
│   ├── localization.ts          # Locale-parameterized date/time formatting
│   ├── ViewStateController.ts   # Per-instance view mode & date state
│   ├── LayoutCalculator.ts      # Overlap detection & box layout
│   ├── SlotManager.ts           # Slot naming & CSS position generation
│   ├── allDayLayout.ts          # All-day event row allocation
│   ├── weekStartHelper.ts       # Week start offset & locale mapping
│   ├── weekDisplayContext.ts    # Condensed week display logic
│   ├── colorParser.ts           # Color parsing & contrast utils
│   └── getColorTextWithContrast.ts
└── generated/
    ├── locale-codes.ts          # Source & target locale definitions
    └── locales/                 # Generated translation templates (hash ID → string)
        ├── ar.ts, bn.ts, cs.ts, da.ts, de-DE.ts, de.ts, el.ts
        ├── es.ts, fi.ts, fr.ts, he.ts, hi.ts, id.ts, it.ts
        ├── ja.ts, ko.ts, nb.ts, nl.ts, pl.ts, pt.ts, ru.ts
        └── sv.ts, th.ts, tr.ts, uk.ts, vi.ts, zh-Hans.ts
```

## Key Technologies

- **Lit 3.x**: Modern web components with reactive properties and decorators
- **TypeScript**: Type-safe development with strict mode
- **Luxon**: Robust date/time manipulation and locale-aware formatting
- **Remeda**: Functional programming utilities (named imports only for tree-shaking)
- **iCalendar export**: the single-event RFC 5545 serializer loads on demand; browser tests parse its files with `ts-ics`.
- **@lit/localize** (build-time only): Template extraction and generation via `lit-localize` CLI

## Design Patterns

- **Per-instance state:** `ViewStateController` (a Lit `ReactiveController`) holds each calendar's view mode and active date. The root owns its entry/layout caches, disclosure state, and requested locale and direction. Locale catalog loading and locale-keyed formatter caches are shared; they do not set a global active locale.
- **Requested state vs. commit:** Owners set `activeDate` and `viewMode`. `visibleRange` reads the last root-committed half-open civil-date range; `calendar-state-change` reports the initial and changed snapshots after the root renders. This is not a descendant layout-ready signal: child updates and geometry observers can still settle afterward, and a Week width change can commit a new range.
- **Cancelable requests:** `entry-activate` and `export-entry` carry canonical original records. Cancel synchronously to replace the built-in action. Legacy action notifications remain, but are not a fetch-range API. See [Events](./events.md).
- **Composition and layout:** The root supplies data and slots entries into the view grids. CSS container queries drive header reflow; `ResizeObserver` drives geometry-dependent layout. [CSS custom properties](./css-tokens.md) are the supported theming surface, not a contract for child DOM or measured geometry.

On an `entries` change the root normalizes and sorts a separate array, retaining caller objects for canonical requests. Only per-day expansion is clipped to the visible range and segment budget. Locale catalogs are generated from canonical JSON, never edited directly. The inspector is non-modal, using a top-layer popover with a portal/dialog fallback and no focus trap.

The source tree above describes implementation modules, not import paths. Use [Library Usage](./library-usage.md) for the public package root (`@jpahd/kalendus`), built-in theme exports, and the unreleased `@jpahd/kalendus/entry-interactions` subpath. Helpers such as `LayoutCalculator`, `SlotManager`, and `calendarModel` are internal.

For deeper internals, see the [Developer Guide](developer-guide.md), [Rendering Pipeline](rendering-pipeline.md), and [canonical locale workflow](https://github.com/pders01/kalendus/blob/main/src/locales/README.md). The [Rendering Calculations](rendering-calculations.md) page is historical.
