---
layout: base.njk
title: 'Theming Reference'
order: 4
tags: docs
section: Usage
---

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

Each theme sets all tokens listed in the [CSS Token Reference](./css-tokens.md). You can import a theme as a starting point and override individual properties afterward.

### Color Format Support

The `color` property on `CalendarEntry` accepts any valid CSS color: hex (`#1976d2`), named (`steelblue`), `rgb()`, `hsl()`, `oklch()`, and all CSS Color Level 4 formats.

## CSS Custom Properties

Override tokens on `<lms-calendar>` to fine-tune any theme or build your own from scratch.

### Quick Examples

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #ffffff;
    --entry-border-radius: 6px;
    --entry-font-size: 0.75rem;
    --header-height: 4em;
    --week-mobile-day-count: 3;
    --year-grid-columns: 4;
}
```

For the complete list of all CSS tokens organized by category, see the **[CSS Token Reference](./css-tokens.md)**.
