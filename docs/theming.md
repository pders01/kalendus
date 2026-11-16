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

Each theme supplies opinionated token values. Import one as a starting point and override individual properties afterward; see the [CSS Token Reference](./css-tokens.md).

### Color Format Support

The documented safe contract for root `color` and `CalendarEntry.color` is limited to hex (`#1976d2`), named (`steelblue`), `rgb()`/`rgba()` and `hsl()`/`hsla()` forms. Alpha is validated and discarded; rendered colors are opaque. Malformed or unsupported values use a safe fallback. OKLCH, arbitrary CSS expressions and `var(--custom-color)` are outside this documented property contract; do not rely on browser CSS parsing to extend it.

CSS custom properties used by themes are a separate styling surface. A browser accepting a token value does not make it a supported JavaScript `color` property input.

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
