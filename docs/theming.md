---
layout: base.njk
title: 'Theming Reference'
order: 4
tags: docs
section: Usage
---

# Theming & CSS Custom Properties

Kalendus ships with a **neutral base** that follows the embedding page’s CSS `color-scheme`. Its surface and foreground use `Canvas` and `CanvasText`; muted text and dividers use tints of `CanvasText`. Import a built-in theme for an opinionated design, or set `color` and the individual tokens on `lms-calendar` to match your design system.

## Built-in Themes

| Theme     | Import                                 | Description                                                        |
| --------- | -------------------------------------- | ------------------------------------------------------------------ |
| Default   | `@jpahd/kalendus/themes/default.css`   | Polished light theme — blue primary, soft shadows, rounded corners |
| Ink       | `@jpahd/kalendus/themes/ink.css`       | Monochrome editorial — serif type, no shadows, no radii            |
| Soft      | `@jpahd/kalendus/themes/soft.css`      | Pastel palette — generous radii, gentle shadows, warm feel         |
| Brutalist | `@jpahd/kalendus/themes/brutalist.css` | Bold borders, stark contrast, hard shadows, zero radii             |
| Midnight  | `@jpahd/kalendus/themes/midnight.css`  | Dark mode — deep charcoal, glowing indigo accents                  |

```js
import '@jpahd/kalendus/themes/default.css'; // choose one theme from the table above
```

Each theme supplies opinionated token values. Import one as a starting point and override individual properties afterward; see the [CSS Token Reference](./css-tokens.md).

### Color Format Support

The documented safe contract for root `color` and `CalendarEntry.color` is limited to hex (`#1976d2`), named (`steelblue`), `rgb()`/`rgba()` and `hsl()`/`hsla()` forms. Alpha is validated and discarded; rendered colors are opaque. Malformed or unsupported values use a safe fallback. OKLCH, arbitrary CSS expressions and `var(--custom-color)` are outside this documented property contract; do not rely on browser CSS parsing to extend it.

CSS custom properties used by themes are a separate styling surface. A browser accepting a token value does not make it a supported JavaScript `color` property input.

## CSS Custom Properties

Override tokens on `<lms-calendar>` to fine-tune any theme or build your own from scratch.

### Typography

By default, the toolbar, date and time labels, event lists, and inspector all use the calendar's font. The neutral calendar inherits the page's family; the built-in themes supply their own `--system-ui` stacks. Time labels request tabular numerals where the font supports them.

Set `--entry-time-font` for a different Month preview time font, or `--entry-font-family` for Day and Week event times. Existing explicit `--monospace-ui` values still serve as a fallback for Month previews; built-in themes no longer apply a separate monospace family by default.

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
