# Theming & CSS Custom Properties

Kalendus ships **unstyled by default** — it renders with a neutral base that respects OS light/dark mode via CSS system colors (`Canvas`, `CanvasText`, `AccentColor`). Import a built-in theme to apply an opinionated design, or override individual tokens to match your design system.

## Built-in Themes

| Theme     | Import                                 | Description                                                        |
| --------- | -------------------------------------- | ------------------------------------------------------------------ |
| Default   | `@jpahd/kalendus/themes/default.css`   | Polished light theme — blue primary, soft shadows, rounded corners |
| Ink       | `@jpahd/kalendus/themes/ink.css`       | Monochrome editorial — serif type, no shadows, no radii            |
| Soft      | `@jpahd/kalendus/themes/soft.css`      | Pastel palette — generous radii, gentle shadows, warm feel         |
| Brutalist | `@jpahd/kalendus/themes/brutalist.css` | Bold borders, stark contrast, hard shadows, zero radii             |
| Midnight  | `@jpahd/kalendus/themes/midnight.css`  | Dark mode — deep charcoal, glowing indigo accents                  |

```js
// Pick one:
import '@jpahd/kalendus/themes/default.css';
import '@jpahd/kalendus/themes/midnight.css';
// …etc.
```

Each theme sets all 80+ tokens listed below. You can import a theme as a starting point and override individual properties afterward.

### Color Format Support

The `color` property on `CalendarEntry` accepts any valid CSS color: hex (`#1976d2`), named (`steelblue`), `rgb()`, `hsl()`, `oklch()`, and all CSS Color Level 4 formats.

## CSS Custom Properties

Override these on `<lms-calendar>` to fine-tune any theme or build your own from scratch.

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
    --week-day-count: 7; /* full-width columns (1-7) */
    --week-mobile-day-count: 3; /* columns below breakpoint (1-7) */
    --week-mobile-breakpoint: 768px; /* width threshold */
}
```

`computeWeekDisplayContext` reads these tokens at runtime to decide how many day columns to render. Below the breakpoint the component centers a smaller window (e.g., three days) around the active date and exposes peek navigation so users can slide through the full week without sacrificing readability on narrow screens. Values are clamped to the 1-7 range.

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
