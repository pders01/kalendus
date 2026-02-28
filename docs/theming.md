# Theming & CSS Custom Properties

Kalendus exposes 80+ CSS custom properties for comprehensive theming. Override them on the `<lms-calendar>` element to match your design system.

## Primary Colors

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #ffffff;
    --separator-light: rgba(0, 0, 0, 0.1);
    --separator-dark: rgba(0, 0, 0, 0.7);
}
```

## Entry Styling

```css
lms-calendar {
    --entry-border-radius: 6px;
    --entry-font-size: 0.75rem;
    --entry-padding: 0.15em 0.25em;
    --entry-min-height: 1.2em;
}
```

## Layout & Spacing

```css
lms-calendar {
    --header-height: 4em;
    --day-padding: 0.5em;
    --day-gap: 1px;
    --time-column-width: 4em;
}
```

## Week Column Controls

```css
lms-calendar {
    --week-day-count: 7; /* full-width columns (1-7) */
    --week-mobile-day-count: 3; /* columns below breakpoint (1-7) */
    --week-mobile-breakpoint: 768px; /* width threshold */
}
```

`computeWeekDisplayContext` reads these tokens at runtime to decide how many day columns to render. Below the breakpoint the component centers a smaller window (e.g., three days) around the active date and exposes peek navigation so users can slide through the full week without sacrificing readability on narrow screens. Values are clamped to the 1-7 range.

## Year View Tokens

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
