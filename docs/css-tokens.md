---
layout: base.njk
title: 'CSS Token Reference'
order: 3
tags: docs
section: Usage
---

# CSS Custom Properties Reference

Complete reference of all CSS custom properties exposed by `<lms-calendar>`. Override these on the host element to theme or adapt the calendar to your design system.

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #ffffff;
    --entry-border-radius: 6px;
}
```

All properties are defined in the `:host` block of the component's Shadow DOM styles. External CSS cannot pierce the shadow boundary — these tokens are the only styling API.

---

## Shadows

| Token         | Default | Description                         |
| ------------- | ------- | ----------------------------------- |
| `--shadow-sm` | `none`  | Small shadow (entry chips, buttons) |
| `--shadow-md` | `none`  | Medium shadow (menus, overlays)     |
| `--shadow-lg` | `none`  | Large shadow (calendar container)   |
| `--shadow-hv` | `none`  | Hover-state shadow                  |

## Breakpoints

| Token             | Default  | Description                                 |
| ----------------- | -------- | ------------------------------------------- |
| `--breakpoint-xs` | `425px`  | Extra-small breakpoint                      |
| `--breakpoint-sm` | `768px`  | Small breakpoint (month dot-mode threshold) |
| `--breakpoint-md` | `1024px` | Medium breakpoint                           |

## Separators

| Token               | Default              | Description                            |
| ------------------- | -------------------- | -------------------------------------- |
| `--separator-light` | `rgba(0, 0, 0, 0.1)` | Light separator (grid lines, borders)  |
| `--separator-mid`   | `rgba(0, 0, 0, 0.4)` | Medium separator                       |
| `--separator-dark`  | `rgba(0, 0, 0, 0.7)` | Dark separator (text, strong dividers) |

## Typography — Fonts

| Token            | Default     | Description                    |
| ---------------- | ----------- | ------------------------------ |
| `--system-ui`    | `inherit`   | Primary font family            |
| `--monospace-ui` | `monospace` | Monospace font (time displays) |

## Border Radius

| Token                | Default | Description                         |
| -------------------- | ------- | ----------------------------------- |
| `--border-radius-sm` | `0`     | Small radius (buttons, entry chips) |
| `--border-radius-md` | `0`     | Medium radius (menus, cards)        |
| `--border-radius-lg` | `0`     | Large radius (calendar container)   |

## Core Colors

| Token                | Default       | Description                                           |
| -------------------- | ------------- | ----------------------------------------------------- |
| `--background-color` | `Canvas`      | Calendar background. Uses CSS system color by default |
| `--primary-color`    | `AccentColor` | Primary accent for buttons, highlights, gradients     |

## Interaction Tokens

| Token                       | Default       | Description                                |
| --------------------------- | ------------- | ------------------------------------------ |
| `--transition-speed`        | `0s`          | Transition duration for hover/focus states |
| `--hover-bg`                | `transparent` | Background on hover                        |
| `--focus-bg`                | `transparent` | Background on focus                        |
| `--peek-active-bg`          | `transparent` | Background for active peek navigation      |
| `--context-bg`              | `transparent` | Background for context display             |
| `--active-indicator-bg`     | `transparent` | Background for the active day indicator    |
| `--active-indicator-shadow` | `none`        | Shadow for the active day indicator        |

## Float Text Tokens

| Token                        | Default       | Description                            |
| ---------------------------- | ------------- | -------------------------------------- |
| `--float-text-bg`            | `transparent` | Background for floating text labels    |
| `--float-text-border-radius` | `0`           | Border radius for floating text labels |
| `--float-text-shadow`        | `none`        | Shadow for floating text labels        |

## Menu Animation Tokens

| Token                     | Default    | Description                              |
| ------------------------- | ---------- | ---------------------------------------- |
| `--menu-transform-origin` | `scale(1)` | Transform origin for menu open animation |
| `--menu-transform-active` | `scale(1)` | Active transform for menu animation      |
| `--export-hover-opacity`  | `1`        | Opacity of export button on hover        |

## Dimensions

| Token      | Default | Description               |
| ---------- | ------- | ------------------------- |
| `--height` | `100%`  | Calendar container height |
| `--width`  | `100%`  | Calendar container width  |

## Entry Design — Core

| Token                      | Default                | Description                     | Views |
| -------------------------- | ---------------------- | ------------------------------- | ----- |
| `--entry-font-size`        | `0.75rem`              | Base font size for entry chips  | All   |
| `--entry-line-height`      | `1.2`                  | Line height for entry text      | All   |
| `--entry-min-height`       | `1.2em`                | Minimum height of an entry chip | All   |
| `--entry-border-radius`    | `0`                    | Border radius of entry chips    | All   |
| `--entry-background-color` | `transparent`          | Default background for entries  | All   |
| `--entry-color`            | `inherit`              | Text color for entries          | All   |
| `--entry-highlight-color`  | `transparent`          | Highlight/selection color       | All   |
| `--entry-focus-color`      | `var(--primary-color)` | Focus ring color                | All   |
| `--entry-padding`          | `0.15em 0.3em`         | Padding inside entry chips      | All   |
| `--entry-font-family`      | `system-ui`            | Font family for entries         | All   |
| `--entry-gap`              | `0.25em`               | Gap between stacked entries     | All   |

## Entry Design — Month View

| Token                      | Default                  | Description                       |
| -------------------------- | ------------------------ | --------------------------------- |
| `--entry-dot-size`         | `6px`                    | Size of color dot indicators      |
| `--entry-dot-margin`       | `0.25em`                 | Margin around dot indicators      |
| `--entry-month-background` | `transparent`            | Background for month-view entries |
| `--entry-month-padding`    | `0.05em 0.25em 0.05em 0` | Padding for month-view entries    |
| `--entry-time-font`        | `var(--monospace-ui)`    | Font for time display             |
| `--entry-time-align`       | `right`                  | Text alignment for time display   |
| `--entry-month-text-color` | `var(--separator-dark)`  | Text color for month-view entries |

## Entry Design — Typography

| Token                    | Default   | Description                            |
| ------------------------ | --------- | -------------------------------------- |
| `--entry-title-weight`   | `inherit` | Font weight for entry title            |
| `--entry-title-wrap`     | `nowrap`  | Wrapping behavior for entry title      |
| `--entry-time-font-size` | `0.85em`  | Font size for time display             |
| `--entry-time-opacity`   | `1`       | Opacity of time display                |
| `--title-column-weight`  | `inherit` | Font weight for title in column layout |

## Entry Design — Density Mode

| Token                       | Default      | Description                                              |
| --------------------------- | ------------ | -------------------------------------------------------- |
| `--entry-compact-show-time` | `none`       | Display value for time in compact mode (`none` hides it) |
| `--entry-layout`            | `row`        | Flex direction for entry content (`row` or `column`)     |
| `--entry-align`             | `flex-start` | Alignment for entry content                              |

## Entry Design — Responsive Scaling

| Token                  | Default   | Description                    |
| ---------------------- | --------- | ------------------------------ |
| `--entry-font-size-sm` | `0.65rem` | Font size at small breakpoint  |
| `--entry-font-size-md` | `0.7rem`  | Font size at medium breakpoint |
| `--entry-font-size-lg` | `0.75rem` | Font size at large breakpoint  |

## Context Display

| Token                  | Default  | Description                    |
| ---------------------- | -------- | ------------------------------ |
| `--context-height`     | `1.75em` | Height of the context bar      |
| `--context-padding`    | `0.25em` | Padding inside the context bar |
| `--context-text-align` | `start`  | Text alignment in context bar  |

## Time Grid Sizing

| Token                 | Default                             | Description                                | Views     |
| --------------------- | ----------------------------------- | ------------------------------------------ | --------- |
| `--time-column-width` | `4em`                               | Width of the hour gutter                   | Day, Week |
| `--minute-height`     | `0.8px`                             | Height of one minute in the time grid      | Day, Week |
| `--hour-height`       | `calc(60 * var(--minute-height))`   | Height of one hour (derived)               | Day, Week |
| `--day-total-height`  | `calc(1440 * var(--minute-height))` | Total height of the 24-hour grid (derived) | Day, Week |
| `--half-day-height`   | `calc(var(--day-total-height) / 2)` | Half-day height, used for scroll snap      | Day, Week |

## Deprecated Tokens

| Token                       | Default                                 | Description                                                                                                     |
| --------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `--grid-rows-per-day`       | `1440`                                  | **Deprecated.** Kept for backward compatibility; no longer used internally. Replaced by `--minute-height` grid. |
| `--calendar-grid-rows-time` | `repeat(var(--grid-rows-per-day), 1fr)` | **Deprecated.** Kept for backward compatibility; no longer used internally.                                     |

## Week View — Condensed Mode

| Token                      | Default | Description                                     |
| -------------------------- | ------- | ----------------------------------------------- |
| `--week-day-count`         | `7`     | Number of day columns in week view (1–7)        |
| `--week-mobile-day-count`  | `3`     | Number of columns below mobile breakpoint (1–7) |
| `--week-mobile-breakpoint` | `768px` | Width threshold for condensed mode              |

These tokens are read at runtime by `computeWeekDisplayContext`. Below the breakpoint, the component centers a smaller window around the active date and enables peek navigation arrows.

## Grid Templates

| Token                           | Default                                   | Description                     | Views |
| ------------------------------- | ----------------------------------------- | ------------------------------- | ----- |
| `--calendar-grid-columns-day`   | `var(--time-column-width) 1fr`            | CSS grid columns for day view   | Day   |
| `--calendar-grid-columns-week`  | `var(--time-column-width) repeat(7, 1fr)` | CSS grid columns for week view  | Week  |
| `--calendar-grid-columns-month` | `repeat(7, 1fr)`                          | CSS grid columns for month view | Month |
| `--view-container-height`       | `100%`                                    | Height of the view container    | All   |

## Day / Week View — Header & Layout

| Token                     | Default                            | Description                          | Views     |
| ------------------------- | ---------------------------------- | ------------------------------------ | --------- |
| `--day-header-height`     | `2.5em`                            | Height of the day/week header row    | Day, Week |
| `--day-gap`               | `1px`                              | Gap between grid cells               | Day, Week |
| `--day-text-align`        | `center`                           | Text alignment in day cells          | Day, Week |
| `--day-padding`           | `0.5em`                            | Padding inside the time grid         | Day, Week |
| `--day-all-day-font-size` | `0.875rem`                         | Font size for all-day event section  | Day, Week |
| `--day-all-day-margin`    | `0 1.25em 0 4.25em`                | Margin for all-day section           | Day, Week |
| `--hour-text-align`       | `center`                           | Text alignment for hour indicators   | Day, Week |
| `--indicator-top`         | `-0.55em`                          | Top offset for hour indicator labels | Day, Week |
| `--separator-border`      | `1px solid var(--separator-light)` | Horizontal separator between hours   | Day, Week |
| `--sidebar-border`        | `1px solid var(--separator-light)` | Vertical sidebar separator           | Day, Week |

## Day / Week View — Typography

| Token                            | Default                                        | Description                           |
| -------------------------------- | ---------------------------------------------- | ------------------------------------- |
| `--hour-indicator-font-size`     | `0.8125em`                                     | Font size for hour labels             |
| `--hour-indicator-color`         | `var(--header-text-color, rgba(0, 0, 0, 0.6))` | Color for hour labels                 |
| `--day-label-font-weight`        | `inherit`                                      | Font weight for day labels            |
| `--day-label-name-font-size`     | `0.75em`                                       | Font size for day name (e.g., "Mon")  |
| `--day-label-number-font-size`   | `1.125em`                                      | Font size for day number (e.g., "15") |
| `--day-label-number-font-weight` | `inherit`                                      | Font weight for day number            |
| `--day-label-gap`                | `0.15em`                                       | Gap between day name and number       |

## Header

| Token                                 | Default                   | Description                                             |
| ------------------------------------- | ------------------------- | ------------------------------------------------------- |
| `--header-height`                     | `3.5em`                   | Header height on desktop                                |
| `--header-height-mobile`              | `4.5em`                   | Header height on mobile                                 |
| `--header-info-padding-inline-start`  | `1em`                     | Start-edge padding for header info area (adapts to RTL) |
| `--header-text-color`                 | `inherit`                 | Text color in header                                    |
| `--header-buttons-padding-inline-end` | `1em`                     | End-edge padding for header buttons (adapts to RTL)     |
| `--button-padding`                    | `0.75em`                  | Padding inside header buttons                           |
| `--button-border-radius`              | `var(--border-radius-sm)` | Border radius for buttons                               |

> **Migration note:** The old `--header-info-padding-left` and `--header-buttons-padding-right` tokens are still accepted as fallbacks. New code should use the `inline-start/end` variants.

## Month View — Indicators

| Token                             | Default        | Description                        |
| --------------------------------- | -------------- | ---------------------------------- |
| `--month-day-gap`                 | `1px`          | Gap between month day cells        |
| `--indicator-color`               | `currentColor` | Color for day number indicators    |
| `--indicator-font-weight`         | `inherit`      | Font weight for day indicators     |
| `--indicator-backdrop-filter`     | `none`         | Backdrop filter for indicators     |
| `--month-indicator-border-radius` | `0`            | Border radius for month indicators |
| `--indicator-padding`             | `0.25em`       | Padding for day indicators         |
| `--indicator-margin-bottom`       | `0.25em`       | Margin below day indicators        |

## Menu

| Token                           | Default      | Description                     |
| ------------------------------- | ------------ | ------------------------------- |
| `--menu-min-width`              | `17.5em`     | Minimum width of menu overlay   |
| `--menu-max-width`              | `20em`       | Maximum width of menu overlay   |
| `--menu-header-padding`         | `0.75em 1em` | Padding for menu header         |
| `--menu-content-padding`        | `1em`        | Padding for menu body           |
| `--menu-item-padding`           | `0.75em`     | Padding for menu items          |
| `--menu-item-margin-bottom`     | `0.75em`     | Bottom margin for menu items    |
| `--menu-item-font-weight`       | `inherit`    | Font weight for menu items      |
| `--menu-button-size`            | `2em`        | Size of menu action buttons     |
| `--menu-button-padding`         | `0.5em`      | Padding for menu buttons        |
| `--menu-title-font-size`        | `0.875em`    | Font size for menu title        |
| `--menu-title-font-weight`      | `inherit`    | Font weight for menu title      |
| `--menu-content-font-size`      | `0.875em`    | Font size for menu content      |
| `--menu-detail-label-min-width` | `4em`        | Minimum width for detail labels |
| `--menu-detail-label-font-size` | `0.8125em`   | Font size for detail labels     |
| `--menu-detail-gap`             | `0.5em`      | Gap between detail rows         |

## Year View — Grid & Layout

| Token                          | Default   | Description                       |
| ------------------------------ | --------- | --------------------------------- |
| `--year-grid-columns`          | `3`       | Number of month columns (desktop) |
| `--year-grid-columns-tablet`   | `2`       | Number of month columns (tablet)  |
| `--year-grid-columns-mobile`   | `1`       | Number of month columns (mobile)  |
| `--year-month-label-font-size` | `0.875em` | Font size for month name labels   |
| `--year-day-font-size`         | `0.7em`   | Font size for day numbers         |
| `--year-cell-size`             | `1.8em`   | Width/height of day cells         |

## Year View — Density Indicators

| Token                   | Default                                        | Description                         |
| ----------------------- | ---------------------------------------------- | ----------------------------------- |
| `--year-dot-color`      | `var(--indicator-color, var(--primary-color))` | Color for dot density indicators    |
| `--year-heatmap-1`      | `rgba(59, 130, 246, 0.15)`                     | Heatmap shade — 1 event             |
| `--year-heatmap-2`      | `rgba(59, 130, 246, 0.35)`                     | Heatmap shade — 2 events            |
| `--year-heatmap-3`      | `rgba(59, 130, 246, 0.55)`                     | Heatmap shade — 3 events            |
| `--year-heatmap-4`      | `rgba(59, 130, 246, 0.75)`                     | Heatmap shade — 4+ events           |
| `--year-heatmap-4-text` | `inherit`                                      | Text color on darkest heatmap shade |

## Year View — Day Cell Styling

| Token                            | Default       | Description                           |
| -------------------------------- | ------------- | ------------------------------------- |
| `--year-day-cell-border-radius`  | `0`           | Border radius for year day cells      |
| `--year-month-label-hover-color` | `inherit`     | Hover color for month labels          |
| `--year-weekday-font-weight`     | `inherit`     | Font weight for weekday abbreviations |
| `--month-label-font-weight`      | `inherit`     | Font weight for month labels          |
| `--cw-hover-color`               | `inherit`     | Calendar week hover text color        |
| `--cw-hover-bg`                  | `transparent` | Calendar week hover background        |
| `--current-day-bg`               | `AccentColor` | Background for today's cell           |
| `--current-day-color`            | `Canvas`      | Text color for today's cell           |
| `--current-day-font-weight`      | `inherit`     | Font weight for today's cell          |
| `--current-day-hover-opacity`    | `1`           | Hover opacity for today's cell        |
| `--current-dot-bg`               | `Canvas`      | Dot color on today's cell             |

## Year View — Calendar Week Column

| Token                 | Default                                         | Description                          |
| --------------------- | ----------------------------------------------- | ------------------------------------ |
| `--year-cw-width`     | `1.8em`                                         | Width of calendar week number column |
| `--year-cw-font-size` | `0.55em`                                        | Font size for calendar week numbers  |
| `--year-cw-color`     | `var(--header-text-color, rgba(0, 0, 0, 0.45))` | Color for calendar week numbers      |

## Multi-Day Events

| Token                   | Default | Description                            |
| ----------------------- | ------- | -------------------------------------- |
| `--multi-day-separator` | `none`  | Separator between multi-day event rows |
