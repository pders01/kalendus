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
│   ├── messages.ts              # Per-instance i18n via direct template lookup
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
- **Remeda**: Functional programming utilities for data transformations
- **ts-pattern**: Pattern matching for cleaner conditional logic
- **ts-ics**: ICS calendar file generation for event export
- **@lit/localize** (build-time only): Template extraction and generation via `lit-localize` CLI

## Design Patterns

- **Per-instance state** via `ViewStateController` (Lit `ReactiveController`)
- **Per-instance localization** via direct template hash lookups (bypasses `@lit/localize` singleton)
- **Event bubbling** for component communication (`switchdate`, `switchview`, `expand`, `open-menu`)
- **CSS custom properties** for theming (151 tokens)
- **Slot-based composition** for entry placement in view grids
- **Container queries** for responsive header layout

For deeper internals, see the [Developer Guide](developer-guide.md) and [Rendering Calculations](rendering-calculations.md).
