---
layout: base.njk
title: 'Architecture'
order: 10
tags: docs
section: Internals
---

# Architecture

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
│   ├── DirectionalCalendarDateCalculator.ts
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
- **ts-ics**: ICS calendar file generation for event export (lazy-loaded on click)
- **@lit/localize** (build-time only): Template extraction and generation via `lit-localize` CLI

## Design Patterns

- **Per-instance state** via `ViewStateController` (Lit `ReactiveController`)
- **Per-instance localization** via direct template hash lookups (bypasses `@lit/localize` singleton)
- **Public committed state** through owner-controlled `activeDate` / `viewMode`, read-only half-open ISO `visibleRange`, and initial/changed `calendar-state-change` after rendering
- **Cancelable requests** (`entry-activate`, `export-entry`) carrying canonical original records; `preventDefault()` replaces defaults. Legacy action notifications remain, but are not a fetch-range API
- **CSS custom properties** for theming
- **Slot-based composition** for entry placement in view grids
- **Container queries** for responsive header layout

Entry normalization preserves stable caller IDs, explicit timed/all-day semantics and legacy promotion; expansion is clipped to the visible range and segment budget with diagnostics. Locale catalogs are generated from canonical JSON, never edited directly. The inspector is non-modal, using a top-layer popover with a portal/dialog fallback and no focus trap.

For deeper internals, see the [Developer Guide](developer-guide.md), [Rendering Pipeline](rendering-pipeline.md), and [canonical locale workflow](https://github.com/pders01/kalendus/blob/main/src/locales/README.md). The [Rendering Calculations](rendering-calculations.md) page is historical.
