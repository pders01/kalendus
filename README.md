# kalendus

A sophisticated, responsive calendar web component built with Lit 3.x and TypeScript. Designed for Library Management Systems and other applications requiring advanced calendar functionality with support for overlapping events, multiple view modes, per-instance localization, and extensive customization.

## Features

### Multiple View Modes

- **Month View**: Traditional monthly calendar with color-coded event indicators
- **Week View**: 7-day view with hourly time slots, condensed windows (e.g., 3-day peeks) driven by CSS tokens, and pixel-perfect alignment
- **Day View**: Single-day view with detailed hourly scheduling
- **Year View**: 12 mini-month grids with density indicators (dot, heatmap, or count) and configurable drill targets for instant navigation

### Advanced Event Handling

- **Smart Overlapping**: Cascading layout with progressive transparency preserves event visibility
- **Duration-Based Positioning**: Events positioned precisely by start time and duration via `LayoutCalculator`
- **Multi-Day Events**: Seamless spanning across multiple days with first/middle/last-day visual styling
- **All-Day Events**: Dedicated all-day section with row allocation via `allDayLayout`
- **Responsive Density**: Automatic layout optimization based on event count and viewport size

### Modern Design

- **Responsive Design**: Mobile-first approach with adaptive layouts and container queries
- **Color Dot Indicators**: Scalable month view with color-coded event dots
- **Accessibility**: Full keyboard navigation, ARIA labels, focus trapping, and screen reader support
- **CSS Custom Properties**: 80+ design tokens for comprehensive theming

### Per-Instance Localization

- **Independent Locale Per Instance**: Multiple calendars on the same page can each display a different locale
- **21 Built-in Locales**: English, German, Spanish, French, Hindi, Bengali, Russian, Indonesian, Korean, Turkish, Vietnamese, Italian, Thai, Polish, Ukrainian, Dutch, Japanese, Portuguese, Arabic, Chinese (Simplified), and German (DE)
- **Localized UI Strings**: All buttons, labels, and messages translated per instance
- **Localized Date Formatting**: Weekday names, month names, and date formats use the instance's locale
- **Configurable Week Start**: `firstDayOfWeek` property supports Monday (ISO), Sunday (US/JP), Saturday (AR), or any day

## Installation

```bash
pnpm add @jpahd/kalendus
```

## Usage

### Basic Usage

```html
<lms-calendar
  .heading="My Calendar"
  .activeDate=${{ day: 15, month: 3, year: 2024 }}
  .entries=${myEvents}
  .color="#1976d2"
></lms-calendar>
```

### Per-Instance Locale

By default, every calendar auto-detects its locale from the page's `<html lang="...">` attribute. You can override individual instances with the `locale` property:

```html
<!-- Auto-detects from <html lang="de"> — no config needed -->
<lms-calendar .entries=${events}></lms-calendar>

<!-- Explicitly override to Japanese with Sunday-first weeks -->
<lms-calendar .entries=${events} locale="ja" .firstDayOfWeek=${0}></lms-calendar>

<!-- Multiple locales on the same page - each fully independent -->
<lms-calendar locale="es"></lms-calendar>
<lms-calendar locale="fr"></lms-calendar>
<lms-calendar locale="zh-Hans"></lms-calendar>
```

### Event Structure

```typescript
interface CalendarEntry {
    heading: string;
    content: string;
    color: string;
    isContinuation: boolean;
    date: {
        start: { day: number; month: number; year: number };
        end: { day: number; month: number; year: number };
    };
    time: {
        start: { hour: number; minute: number };
        end: { hour: number; minute: number };
    };
}
```

### Example Events

```typescript
const events = [
    {
        heading: 'Team Meeting',
        content: 'Weekly team sync',
        color: '#1976d2',
        isContinuation: false,
        date: {
            start: { day: 15, month: 3, year: 2024 },
            end: { day: 15, month: 3, year: 2024 },
        },
        time: {
            start: { hour: 9, minute: 0 },
            end: { hour: 10, minute: 30 },
        },
    },
    {
        heading: 'Project Sprint',
        content: 'Development sprint',
        color: '#2e7d32',
        isContinuation: false,
        date: {
            start: { day: 20, month: 3, year: 2024 },
            end: { day: 22, month: 3, year: 2024 },
        },
        time: {
            start: { hour: 8, minute: 0 },
            end: { hour: 17, minute: 0 },
        },
    },
];
```

### Year View Controls

The year overview makes it easy to hop between distant dates. Two properties tune how it behaves:

```html
<lms-calendar
  year-drill-target="day"
  year-density-mode="heatmap"
  .entries=${events}
></lms-calendar>
```

- `year-drill-target` (`day` \| `month`): picking a day can either open the specific day or simply focus its month.
- `year-density-mode` (`dot` \| `heatmap` \| `count`): swap between subtle dots, tonal heatmaps, or explicit counts for per-day density.

## Properties

| Property         | Type              | Default      | Description                                              |
| ---------------- | ----------------- | ------------ | -------------------------------------------------------- |
| `heading`        | `string`          | `undefined`  | Calendar title displayed in header                       |
| `activeDate`     | `CalendarDate`    | Current date | Initially displayed date                                 |
| `entries`        | `CalendarEntry[]` | `[]`         | Array of calendar events                                 |
| `color`          | `string`          | `'#000000'`  | Primary theme color                                      |
| `locale`         | `string`          | `document.documentElement.lang \|\| 'en'` | Locale for UI strings and date formatting (auto-detected from page, overridable per-instance) |
| `firstDayOfWeek` | `0-6`             | `1`          | First day of the week (0=Sun, 1=Mon, ..., 6=Sat)         |
| `yearDrillTarget` | `'day' \| 'month'` | `'month'` | Determines whether a year-view click opens day or month view |
| `yearDensityMode` | `'dot' \| 'heatmap' \| 'count'` | `'dot'` | Chooses how per-day entry density is visualized in year view |

### Supported Locales

| Code      | Language             | Default Week Start |
| --------- | -------------------- | ------------------ |
| `en`      | English              | Sunday             |
| `de`      | German               | Monday             |
| `de-DE`   | German (Germany)     | Monday             |
| `es`      | Spanish              | Monday             |
| `fr`      | French               | Monday             |
| `hi`      | Hindi                | Sunday             |
| `bn`      | Bengali              | Sunday             |
| `ru`      | Russian              | Monday             |
| `id`      | Indonesian           | Sunday             |
| `ko`      | Korean               | Sunday             |
| `tr`      | Turkish              | Monday             |
| `vi`      | Vietnamese           | Monday             |
| `it`      | Italian              | Monday             |
| `th`      | Thai                 | Sunday             |
| `pl`      | Polish               | Monday             |
| `uk`      | Ukrainian            | Monday             |
| `nl`      | Dutch                | Monday             |
| `ja`      | Japanese             | Sunday             |
| `pt`      | Portuguese           | Sunday             |
| `ar`      | Arabic               | Saturday           |
| `zh-Hans` | Chinese (Simplified) | Sunday             |

## Styling & Theming

The calendar uses CSS custom properties for comprehensive theming:

### Primary Colors

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #ffffff;
    --separator-light: rgba(0, 0, 0, 0.1);
    --separator-dark: rgba(0, 0, 0, 0.7);
}
```

### Entry Styling

```css
lms-calendar {
    --entry-border-radius: 6px;
    --entry-font-size: 0.75rem;
    --entry-padding: 0.15em 0.25em;
    --entry-min-height: 1.2em;
}
```

### Layout & Spacing

```css
lms-calendar {
    --header-height: 4em;
    --day-padding: 0.5em;
    --day-gap: 1px;
    --time-column-width: 4em;
}
```

### Week Column Controls

```css
lms-calendar {
    --week-day-count: 7;          /* full-width columns */
    --week-mobile-day-count: 3;   /* columns when condensed */
    --week-mobile-breakpoint: 768px;
}
```

`computeWeekDisplayContext` reads these tokens at runtime to decide how many day columns to render. Below the breakpoint the component centers a smaller window (e.g., three days) around the active date and exposes peek navigation so users can slide through the full week without sacrificing readability on narrow screens.

### Year View Tokens

```css
lms-calendar {
    --year-grid-columns: 3;
    --year-grid-columns-tablet: 2;
    --year-grid-columns-mobile: 1;
    --year-month-label-font-size: 0.875em;
    --year-day-font-size: 0.7em;
    --year-cell-size: 1.8em;
    --year-dot-color: var(--indicator-color, var(--primary-color));
    --year-heatmap-1: rgba(30, 144, 255, 0.15);
    --year-heatmap-2: rgba(30, 144, 255, 0.35);
    --year-heatmap-3: rgba(30, 144, 255, 0.55);
    --year-heatmap-4: rgba(30, 144, 255, 0.75);
}
```

Adjust these tokens to align the overview grid with your design system (e.g., forcing a single-column mobile layout or brand-specific heatmap shades).

### Week View Tokens

```css
lms-calendar {
    --week-day-count: 7;              /* columns at full width (1-7) */
    --week-mobile-day-count: 3;       /* columns below breakpoint (1-7) */
    --week-mobile-breakpoint: 768px;  /* width threshold */
}
```

On narrow viewports the week view automatically condenses to show fewer day columns centered on the active date, with subtle peek indicators at the edges. Values are clamped to the 1-7 range.

## Architecture

### Component Structure

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
│   ├── getOverlappingEntitiesIndices.ts
│   ├── getSortedGradingsByIndex.ts
│   ├── partitionOverlappingIntervals.ts
│   └── getColorTextWithContrast.ts
└── generated/
    ├── locale-codes.ts          # Source & target locale definitions
    └── locales/                 # Generated translation templates (hash ID → string)
        ├── ar.ts, bn.ts, de.ts, de-DE.ts, es.ts, fr.ts, hi.ts
        ├── id.ts, it.ts, ja.ts, ko.ts, nl.ts, pl.ts, pt.ts
        ├── ru.ts, th.ts, tr.ts, uk.ts, vi.ts
        └── zh-Hans.ts
```

### Key Technologies

- **Lit 3.x**: Modern web components with reactive properties and decorators
- **TypeScript**: Type-safe development with strict mode
- **Luxon**: Robust date/time manipulation and locale-aware formatting
- **Remeda**: Functional programming utilities for data transformations
- **ts-pattern**: Pattern matching for cleaner conditional logic
- **ts-ics**: ICS calendar file generation for event export
- **@lit/localize** (build-time only): Template extraction and generation via `lit-localize` CLI

### Design Patterns

- **Per-instance state** via `ViewStateController` (Lit `ReactiveController`)
- **Per-instance localization** via direct template hash lookups (bypasses `@lit/localize` singleton)
- **Event bubbling** for component communication (`switchdate`, `switchview`, `expand`, `open-menu`)
- **CSS custom properties** for theming (80+ tokens)
- **Slot-based composition** for entry placement in view grids
- **Container queries** for responsive header layout

## Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run Storybook tests
pnpm test-storybook
```

### Test Categories

- **Unit tests** (`test/unit/lib/`): Pure function tests with Mocha + Chai
- **Component tests** (`test/unit/components/`): Lit component tests with @open-wc/testing
- **Visual tests**: Storybook stories for all views, locales, and edge cases

## Storybook

Explore all features and variations in Storybook:

```bash
pnpm storybook
```

### Available Stories

- **Default**: Basic calendar with sample events
- **Locale stories**: Individual stories for each supported locale (German, French, Spanish, Japanese, etc.)
- **LocaleShowcase**: 19 calendars on one page, each with a different locale
- **WeekStartComparison**: Side-by-side Monday-first vs Sunday-first
- **Heavy Event Load**: Stress testing with 200+ events
- **Overlapping Events**: Extreme overlap scenarios
- **Mobile View**: Responsive mobile experience
- **Custom Theming**: Theme variations and customization

## Development

```bash
pnpm install
pnpm storybook     # Start Storybook dev server
pnpm build          # Build with Vite
pnpm test           # Run tests
pnpm lint           # Run lit-analyzer + oxlint
pnpm format         # Format with oxfmt
```

See `docs/developer-guide.md` for internal architecture notes, troubleshooting checklists, and tips on extending condensed week layouts or localization.

### Adding a New Locale

1. Add the locale code to `lit-localize.json` target locales
2. Run `pnpm exec lit-localize extract` to generate the template file
3. Translate strings in `src/generated/locales/<locale>.ts`
4. Add the import and entry in `src/lib/messages.ts` (`allTemplates` map)
5. Optionally add a `LUXON_LOCALE_MAP` entry in `localization.ts` if the locale code differs from Intl/Luxon conventions

## License

MIT License - see LICENSE file for details.
