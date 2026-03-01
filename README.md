# kalendus

A sophisticated, responsive calendar web component built with Lit 3.x and TypeScript. Multiple view modes, overlapping event handling, per-instance localization, and 151 CSS design tokens.

![demo](assets/demo.gif)

## Installation

```bash
pnpm add @jpahd/kalendus
```

## Quick Usage

```html
<lms-calendar
  .heading="My Calendar"
  .activeDate=${{ day: 15, month: 3, year: 2024 }}
  .entries=${myEvents}
  .color="#1976d2"
></lms-calendar>
```

Each instance auto-detects its locale from `<html lang="...">`. Override per-instance:

```html
<lms-calendar locale="ja" .firstDayOfWeek="${0}"></lms-calendar>
<lms-calendar locale="es"></lms-calendar>
<lms-calendar locale="zh-Hans"></lms-calendar>
```

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
- **CSS Custom Properties**: 151 design tokens for comprehensive theming

### Per-Instance Localization

- **Independent Locale Per Instance**: Multiple calendars on the same page can each display a different locale
- **28 Built-in Locales**: See [Supported Locales](#supported-locales) below for the full list
- **Localized UI Strings**: All buttons, labels, and messages translated per instance
- **Localized Date Formatting**: Weekday names, month names, and date formats use the instance's locale
- **Configurable Week Start**: `firstDayOfWeek` property supports Monday (ISO), Sunday (US/JP), Saturday (AR), or any day

## Properties

| Property          | Type                            | Default                                   | Description                                                                                   |
| ----------------- | ------------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------- |
| `heading`         | `string`                        | `undefined`                               | Calendar title displayed in header                                                            |
| `activeDate`      | `CalendarDate`                  | Current date                              | Initially displayed date                                                                      |
| `entries`         | `CalendarEntry[]`               | `[]`                                      | Array of calendar events                                                                      |
| `color`           | `string`                        | `'#000000'`                               | Primary theme color (any CSS color format)                                                    |
| `locale`          | `string`                        | `document.documentElement.lang \|\| 'en'` | Locale for UI strings and date formatting (auto-detected from page, overridable per-instance) |
| `firstDayOfWeek`  | `0-6`                           | `1`                                       | First day of the week (0=Sun, 1=Mon, ..., 6=Sat)                                              |
| `yearDrillTarget` | `'day' \| 'month'`              | `'month'`                                 | Determines whether a year-view click opens day or month view                                  |
| `yearDensityMode` | `'dot' \| 'heatmap' \| 'count'` | `'dot'`                                   | Chooses how per-day entry density is visualized in year view                                  |

### Event Structure

```typescript
interface CalendarEntry {
    heading: string;
    content: string;
    color: string; // any CSS color: hex, named, rgb(), hsl(), oklch(), …
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

### Year View Controls

```html
<lms-calendar
    year-drill-target="day"
    year-density-mode="heatmap"
    .entries="${events}"
></lms-calendar>
```

- `year-drill-target` (`day` \| `month`): picking a day can either open the specific day or simply focus its month.
- `year-density-mode` (`dot` \| `heatmap` \| `count`): swap between subtle dots, tonal heatmaps, or explicit counts for per-day density.

### Supported Locales

<!-- GENERATED:LOCALE_TABLE:START -->

| Code      | Language           | Default Week Start |
| --------- | ------------------ | ------------------ |
| `en`      | English            | Sunday             |
| `ar`      | Arabic             | Saturday           |
| `bn`      | Bangla             | Sunday             |
| `cs`      | Czech              | Monday             |
| `da`      | Danish             | Monday             |
| `de`      | German             | Monday             |
| `de-DE`   | German (Germany)   | Monday             |
| `el`      | Greek              | Monday             |
| `es`      | Spanish            | Monday             |
| `fi`      | Finnish            | Monday             |
| `fr`      | French             | Monday             |
| `he`      | Hebrew             | Sunday             |
| `hi`      | Hindi              | Sunday             |
| `id`      | Indonesian         | Sunday             |
| `it`      | Italian            | Monday             |
| `ja`      | Japanese           | Sunday             |
| `ko`      | Korean             | Sunday             |
| `nb`      | Norwegian Bokmål   | Monday             |
| `nl`      | Dutch              | Monday             |
| `pl`      | Polish             | Monday             |
| `pt`      | Portuguese         | Sunday             |
| `ru`      | Russian            | Monday             |
| `sv`      | Swedish            | Monday             |
| `th`      | Thai               | Sunday             |
| `tr`      | Turkish            | Monday             |
| `uk`      | Ukrainian          | Monday             |
| `vi`      | Vietnamese         | Monday             |
| `zh-Hans` | Simplified Chinese | Sunday             |

<!-- GENERATED:LOCALE_TABLE:END -->

## Styling & Theming

Kalendus ships **unstyled by default** (neutral base, respects OS light/dark mode). Import a built-in theme for an opinionated look:

```js
import '@jpahd/kalendus/themes/default.css'; // polished light theme
import '@jpahd/kalendus/themes/ink.css'; // monochrome editorial
import '@jpahd/kalendus/themes/soft.css'; // pastel, generous radii
import '@jpahd/kalendus/themes/brutalist.css'; // bold borders, stark contrast
import '@jpahd/kalendus/themes/midnight.css'; // dark mode
```

Override individual CSS custom properties to fine-tune any theme:

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #ffffff;
    --entry-border-radius: 6px;
}
```

See [Theming Reference](docs/theming.md) for all 5 built-in themes, color format support, and quick-start examples. For the complete token list, see the [CSS Token Reference](docs/css-tokens.md).

## Documentation Map

| Audience               | Document                                                     | Highlights                                               |
| ---------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| Integrators            | [Integration Guide](docs/integration-guide.md)               | Framework recipes, theming tokens, analytics hooks       |
| Application Developers | [Library Usage](docs/library-usage.md)                       | API surface, data contracts, DOM events                  |
| CSS / Design Systems   | [CSS Token Reference](docs/css-tokens.md)                    | Complete reference of all 151 CSS custom properties      |
| CSS / Design Systems   | [Theming Reference](docs/theming.md)                         | Built-in themes, color formats, quick-start examples     |
| Events                 | [Events Reference](docs/events.md)                           | All 8 custom events with payloads and code examples      |
| Layout                 | [Layout & Positioning](docs/layout-and-positioning.md)       | Height requirements, responsive behavior, all-day events |
| Troubleshooting        | [Troubleshooting](docs/troubleshooting.md)                   | Top consumer issues and fixes                            |
| Component Contributors | [Developer Guide](docs/developer-guide.md)                   | Internal architecture, debugging tips, adding locales    |
| Rendering Internals    | [Rendering Calculations](docs/rendering-calculations.md)     | Grid math, condensed weeks, density modes                |
| Architecture           | [Architecture Overview](docs/architecture.md)                | Component tree, technologies, design patterns            |
| Design Tokens          | [Design Token Refactoring](docs/design-token-refactoring.md) | Historical: token audit and proposed hierarchy           |
| Backend/API            | [API Server Guide](docs/api-server.md)                       | REST + SSE backend, database + adapters                  |

## Testing

```bash
# Run unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run component tests (Web Test Runner + Playwright)
pnpm test:components

# Run Storybook interaction tests (Vitest)
pnpm test-storybook
```

### Test Categories

- **Unit tests** (`test/unit/lib/`): Pure function tests with Mocha + Chai
- **Component tests** (`test/unit/components/`): Lit component tests with @open-wc/testing
- **Interaction tests**: Storybook stories with `play` functions, run via `@storybook/addon-vitest`

## Storybook

Explore all features and variations in Storybook:

```bash
pnpm storybook
```

### Available Stories

- **Default**: Basic calendar with sample events
- **Theme stories**: Default, Ink, Soft, Brutalist, Midnight — one story per built-in theme
- **Custom Theming**: Inline CSS variable overrides
- **Locale stories**: Individual stories for each supported locale (German, French, Spanish, Japanese, etc.)
- **LocaleShowcase**: 26 calendars on one page, each with a different locale
- **WeekStartComparison**: Side-by-side Monday-first vs Sunday-first
- **Heavy Event Load**: Stress testing with 200+ events
- **Overlapping Events**: Extreme overlap scenarios
- **Tall Container**: Verifies layout in oversized containers
- **Mobile View**: Responsive mobile experience

## Development

```bash
pnpm install
pnpm storybook      # Start Storybook dev server
pnpm build          # Build with Vite
pnpm test           # Run tests
pnpm lint           # Run lit-analyzer + oxlint
pnpm format         # Format with oxfmt
pnpm demo:gif       # Record demo GIF (requires ffmpeg)
```

See `docs/developer-guide.md` for internal architecture notes, troubleshooting checklists, and tips on extending condensed week layouts or localization.

### API Server (optional)

The repository includes `@jpahd/kalendus-server`, a Hono + SQLite backend with REST/SSE endpoints.

```bash
# From repo root
pnpm --filter @jpahd/kalendus-server db:migrate
pnpm --filter @jpahd/kalendus-server db:seed
pnpm --filter @jpahd/kalendus-server dev
```

Configuration, endpoint overview, and adapter usage live in `docs/api-server.md`.

## License

MIT License - see LICENSE file for details.
