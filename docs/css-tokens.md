---
layout: base.njk
title: 'CSS Token Reference'
order: 3
tags: docs
section: Usage
---

# CSS Custom Properties Reference

These are supported overrides for **0.12.0**, with defaults for the neutral calendar. A custom property found in source or in a theme file is not necessarily used by the current calendar.

Set overrides on `<lms-calendar>` after any [built-in theme](./theming.md). This example uses system colors for both light and dark schemes:

```css
lms-calendar {
    color: CanvasText;
    --background-color: Canvas;
    --primary-color: LinkText;
    --entry-border-radius: 6px;
}
```

## Shadows

| Token               | Default | Description                              |
| ------------------- | ------- | ---------------------------------------- |
| `--calendar-shadow` | `none`  | Shadow around the calendar               |
| `--shadow-lg`       | `none`  | Shadow for the inspector and timed panel |

## Breakpoints

The calendar uses its own measured width, not the window width. Automatic Month presentation switches below the greater of `768px` and `48` times the host font size. The toolbar uses its own container queries at `20em`, `22em` (view buttons), `40em`, and `64em`. Entry text has separate width bands (see [Responsive Scaling](#entry-design--responsive-scaling)). Only Week's condensed threshold is an adjustable breakpoint; see [Week View — Condensed Mode](#week-view--condensed-mode).

## Separators

| Token               | Default                     | Description                                         |
| ------------------- | --------------------------- | --------------------------------------------------- |
| `--separator-light` | `CanvasText` at 10% opacity | Grid lines, subtle borders, and dividers            |
| `--separator-mid`   | `CanvasText` at 40% opacity | Emphasized borders and dividers                     |
| `--separator-dark`  | `CanvasText` at 70% opacity | Period heading, Month preview text, and Year labels |

## Typography — Fonts

| Token         | Default             | Description                                                   |
| ------------- | ------------------- | ------------------------------------------------------------- |
| `--system-ui` | Inherited page font | Calendar font family; built-in themes supply their own stacks |

## Border Radius

| Token                      | Default                   | Description                     |
| -------------------------- | ------------------------- | ------------------------------- |
| `--border-radius-sm`       | `0`                       | Controls and small surfaces     |
| `--border-radius-md`       | `0`                       | Inspector card                  |
| `--border-radius-lg`       | `0`                       | Fallback radius of the calendar |
| `--calendar-border-radius` | `var(--border-radius-lg)` | Calendar container radius       |

## Core Colors

| Token                     | Default                              | Description                                                                                                                        |
| ------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `--background-color`      | `Canvas`                             | Calendar surface, including the inspector and timed cards                                                                          |
| `--text-color`            | `CanvasText`                         | Foreground fallback for entry text, lists, and inspector; the host's text color is set with CSS `color`                            |
| `--primary-color`         | `var(--calendar-accent, CanvasText)` | Accent for controls, highlights, and entries without a supplied color; the calendar's `color` property provides the default accent |
| `--calendar-border-color` | `var(--separator-light)`             | Outer calendar border                                                                                                              |

## Interaction Tokens

| Token                | Default                               | Description                                                     |
| -------------------- | ------------------------------------- | --------------------------------------------------------------- |
| `--transition-speed` | `0s`                                  | Color and background transitions on controls                    |
| `--hover-bg`         | `transparent`                         | Hover background on controls and list rows                      |
| `--focus-bg`         | `transparent`                         | Month preview region's focus background                         |
| `--hover-color`      | Header text color or muted foreground | Hover text for toolbar controls; also used by Week date headers |

## Float Text Tokens

The floating-label tokens `--float-text-bg`, `--float-text-border-radius`, and `--float-text-shadow` belong to an internal entry mode; the root calendar does not render it. They are not overrides for the current timed cards or markers.

## Menu Animation Tokens

The inspector does not consume the old `--menu-transform-origin`, `--menu-transform-active`, or `--export-hover-opacity` values. See [Menu](#menu) for inspector overrides.

## Dimensions

| Token      | Default | Description                                                         |
| ---------- | ------- | ------------------------------------------------------------------- |
| `--height` | `100%`  | Host block size. A definite height bounds all four views in 0.12.0. |
| `--width`  | `100%`  | Width of the inner calendar container                               |

See [Height and Scrolling](./layout-and-positioning.md#height-and-scrolling) for sized and unsized layouts and changes since 0.11.0.

## Entry Design — Core

| Token                     | Default                                                     | Description                                                                               |
| ------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `--entry-font-size`       | `0.75rem` before responsive rules                           | Base entry font size; an explicit host override takes precedence over the width bands     |
| `--entry-line-height`     | `1.2` (`1.15` in the small band)                            | Base entry text line height                                                               |
| `--entry-min-height`      | `1.2em` (`1.1em` in the small band)                         | Minimum entry geometry; timed cards also incorporate measured text and target-size floors |
| `--entry-border-radius`   | `0`                                                         | Corner radius for entry cards and span bars                                               |
| `--entry-highlight-color` | `color-mix(in srgb, var(--primary-color) 12%, transparent)` | Highlight background in the entry component                                               |
| `--entry-focus-color`     | `var(--primary-color)`                                      | Focus outline or ring                                                                     |
| `--entry-padding`         | `0.15em 0.3em`, adjusted in smaller width bands             | Padding for the entry interior                                                            |

The root computes event colors and several backgrounds itself. Use `CalendarEntry.color` for an event-specific accent, not `--entry-color` as a host-wide override. Timed cards use `--background-color` for the surface; all-day spans derive their surfaces from the event color.

## Entry Design — Month View

| Token                      | Default                                    | Description                                  |
| -------------------------- | ------------------------------------------ | -------------------------------------------- |
| `--entry-month-background` | `transparent`                              | Background for single-line Month previews    |
| `--entry-month-padding`    | `0.05em 0.25em 0.05em 0`                   | Padding for single-line Month previews       |
| `--entry-time-font`        | Calendar font (or legacy `--monospace-ui`) | Font family for Month preview time labels    |
| `--entry-time-align`       | `right`                                    | Text alignment for Month preview time labels |
| `--entry-month-text-color` | `var(--separator-dark)`                    | Text color for single-line Month previews    |

## Entry Design — Typography

| Token                    | Default                                    | Description                                                                                   |
| ------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `--entry-title-weight`   | `600` for timed cards; `inherit` otherwise | Event title weight                                                                            |
| `--entry-title-wrap`     | `nowrap`                                   | Title white-space handling                                                                    |
| `--entry-font-family`    | Calendar font                              | Font family for Day/Week event time labels; Month previews have their own `--entry-time-font` |
| `--entry-time-font-size` | `0.85em`, with a `0.75rem` minimum         | Event time label size                                                                         |
| `--entry-time-opacity`   | `1`                                        | Event time label opacity                                                                      |

## Entry Design — Density Mode

Density and timed-card stacking are selected by the calendar, not by a host-level `--entry-layout` override. The old `--entry-compact-show-time` no longer controls time labels. See [Entry Overlap Handling](./layout-and-positioning.md#entry-overlap-handling) and [presentation choices](./library-usage.md#experimental-presentation-choices).

## Entry Design — Responsive Scaling

| Token                  | Default     | Measured calendar width  |
| ---------------------- | ----------- | ------------------------ |
| `--entry-font-size-sm` | `0.75rem`   | Up to `480px`            |
| `--entry-font-size-md` | `0.8125rem` | Above `480px` to `768px` |
| `--entry-font-size-lg` | `0.875rem`  | Above `768px`            |

## Context Display

These tokens style the toolbar's view switcher, not a separate context row.

| Token                       | Default                               | Description                   |
| --------------------------- | ------------------------------------- | ----------------------------- |
| `--context-bg`              | `transparent`                         | View-switcher background      |
| `--context-text-color`      | Header text color or muted foreground | Inactive view-button text     |
| `--active-indicator-bg`     | `transparent`                         | Active view-button background |
| `--active-indicator-shadow` | `none`                                | Active view-button shadow     |

## Time Grid Sizing

| Token                 | Default | Description                                                                                        |
| --------------------- | ------- | -------------------------------------------------------------------------------------------------- |
| `--time-column-width` | `4em`   | Day and Week time gutter. Use `px` or `em` so Week's capacity calculation can also read the value. |

`--minute-height`, `--hour-height`, `--day-total-height`, and `--half-day-height` are measured values written on the Day/Week elements. They are not host-level zoom controls. For a permanent scrollable detail grid in 0.12.0, use [`scrollTimeGrid`](./layout-and-positioning.md#time-grid-sizing) instead.

## Deprecated Tokens

- **Live compatibility fallbacks:** `--header-info-padding-left` and `--header-buttons-padding-right` still work if the matching logical token is unset. `--monospace-ui` still provides the Month preview time font if `--entry-time-font` is unset.
- **Retired, not overrides:** `--breakpoint-xs`, `--breakpoint-sm`, `--breakpoint-md`, `--grid-rows-per-day`, `--calendar-grid-rows-time`, and `--day-all-day-margin` do not drive the current layout. The Day all-day band no longer uses the old physical shorthand margin.

## Week View — Condensed Mode

| Token                      | Default | Description                                                                                         |
| -------------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `--week-day-count`         | `7`     | Maximum day columns at or above the breakpoint (integer `1`–`7`)                                    |
| `--week-mobile-day-count`  | `3`     | Maximum day columns below the breakpoint (integer `1`–`7`)                                          |
| `--week-mobile-breakpoint` | `768px` | Measured width threshold in pixels                                                                  |
| `--week-min-day-width`     | `8em`   | Readable column floor (`px` or `em`) on both sides of the breakpoint; `0` disables the capacity cap |

A window with fewer than seven dates can page within the week. See [Week View Condensed Mode](./layout-and-positioning.md#week-view-condensed-mode).

## Grid Templates

Use the dimension, Week count, and Year controls rather than replacing calendar grid templates. The root supplies the measured Week template to the child view; `--view-container-height` is child geometry, and the old `--calendar-grid-columns-month` declaration is unused.

## Day / Week View — Header & Layout

| Token                  | Default                            | Description                                                                                     |
| ---------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--day-header-height`  | `2.5em`                            | Minimum date-header height in Day and Week                                                      |
| `--day-gap`            | `1px`                              | Gutter between tracks in the time grid                                                          |
| `--day-text-align`     | `center`                           | Text alignment within the Day grid                                                              |
| `--day-padding`        | `0.5em`                            | Inline inset of time grid and date headers                                                      |
| `--all-day-row-height` | `max(24px, 1.5rem)`                | Height of all-day rows and Month preview rows; preserve readable lines and targets              |
| `--all-day-max-height` | `12rem`                            | Upper bound for the separate Day/Week all-day band, also capped at 35%                          |
| `--hour-text-align`    | `center`                           | Alignment of hour labels                                                                        |
| `--separator-border`   | `1px solid var(--separator-light)` | Border below date headers and around Week tracks; hourly lines use `--separator-light` directly |
| `--sidebar-border`     | `1px solid var(--separator-light)` | Border along the time gutter                                                                    |

## Day / Week View — Typography

| Token                            | Default                                           | Description             |
| -------------------------------- | ------------------------------------------------- | ----------------------- |
| `--hour-indicator-font-size`     | `0.8125em`                                        | Hour-label font size    |
| `--hour-indicator-color`         | `--header-text-color`, otherwise muted foreground | Hour-label color        |
| `--day-label-font-weight`        | `inherit`                                         | Date-header font weight |
| `--day-label-number-font-weight` | `inherit`                                         | Date-number font weight |

## Header

| Token                                 | Default                                   | Description                                                                                     |
| ------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `--header-height`                     | `3.5em`                                   | Minimum toolbar block size; controls can wrap and grow taller                                   |
| `--header-info-padding-inline-start`  | `--header-info-padding-left` or `1em`     | Start-edge padding for both the period and calendar title lines                                 |
| `--header-buttons-padding-inline-end` | `--header-buttons-padding-right` or `1em` | End-edge padding for navigation buttons                                                         |
| `--header-text-color`                 | `inherit`                                 | Calendar title, control text, and other date labels; the period heading uses `--separator-dark` |

Use logical padding tokens for new selectors, including RTL layouts. Toolbar reflow is controlled by container queries, not `--header-height-mobile`.

## Month View — Indicators

| Token                             | Default   | Description                                                                    |
| --------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `--month-day-gap`                 | `1px`     | Gap between preview entries; also used at span boundaries                      |
| `--month-week-height`             | Unset     | Optional row-height override; a sized embed still retains its view scroll area |
| `--indicator-font-weight`         | `inherit` | Weight of today's date indicator                                               |
| `--month-indicator-border-radius` | `0`       | Corner radius of the date indicator                                            |

## Menu

| Token                      | Default      | Description                                         |
| -------------------------- | ------------ | --------------------------------------------------- |
| `--menu-min-width`         | `17.5em`     | Inspector minimum width, bounded by available space |
| `--menu-max-width`         | `20em`       | Inspector maximum width, bounded by available space |
| `--menu-header-padding`    | `0.75em 1em` | Inspector header and footer padding                 |
| `--menu-content-padding`   | `1em`        | Inspector body padding                              |
| `--menu-item-font-weight`  | `inherit`    | Action label weight                                 |
| `--menu-button-size`       | `2em`        | Minimum close-button size, with a `24px` floor      |
| `--menu-button-padding`    | `0.5em`      | Close-button padding                                |
| `--menu-title-font-size`   | `0.875em`    | Inspector title size                                |
| `--menu-title-font-weight` | `inherit`    | Inspector title weight                              |
| `--menu-content-font-size` | `0.875em`    | Inspector body and action text size                 |

## Year View — Grid & Layout

| Token                          | Default    | Description                                                                                  |
| ------------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| `--year-grid-columns`          | Unset      | Positive integer to pin the count at all widths and bypass automatic fitting; not `auto-fit` |
| `--year-grid-columns-tablet`   | `2`        | Count used when width caps the automatic layout at two columns                               |
| `--year-grid-columns-mobile`   | `1`        | Count used when the automatic layout picks one column                                        |
| `--year-month-label-font-size` | `1em`      | Month label size                                                                             |
| `--year-day-font-size`         | `0.8125em` | Date grid's font size                                                                        |
| `--year-cell-size`             | `1.8em`    | Cell sizing, subject to minimum target sizes                                                 |

The automatic layout uses embed width, text size, pointer type, and available height, not device categories. Pinning a numeric count can cause scrolling. See [Year View Grid Columns](./layout-and-positioning.md#year-view-grid-columns).

## Year View — Density Indicators

| Token              | Default                                        | Description                 |
| ------------------ | ---------------------------------------------- | --------------------------- |
| `--year-dot-color` | `var(--indicator-color, var(--primary-color))` | Dot-mode mark               |
| `--year-heatmap-1` | `rgba(59, 130, 246, 0.15)`                     | Heatmap mark for 1–2 events |
| `--year-heatmap-2` | `rgba(59, 130, 246, 0.35)`                     | Heatmap mark for 3–5 events |
| `--year-heatmap-3` | `rgba(59, 130, 246, 0.55)`                     | Heatmap mark for 6–9 events |
| `--year-heatmap-4` | `rgba(59, 130, 246, 0.75)`                     | Heatmap mark for 10+ events |

Heat colors apply to the mark below the date, not to a cell background or its text. Zero events have no mark; `--year-heatmap-4-text` is unused.

## Year View — Day Cell Styling

| Token                            | Default        | Description                                                       |
| -------------------------------- | -------------- | ----------------------------------------------------------------- |
| `--year-day-cell-border-radius`  | `0`            | Radius for Year date cells                                        |
| `--year-month-label-hover-color` | `inherit`      | Hover color for month labels                                      |
| `--year-weekday-font-weight`     | `inherit`      | Weekday label weight                                              |
| `--month-label-font-weight`      | `inherit`      | Month label weight                                                |
| `--current-day-bg`               | `CanvasText`   | Background of today's date marker (also in other views)           |
| `--current-day-color`            | `Canvas`       | Text color of today's date marker (also in other views)           |
| `--current-day-font-weight`      | `inherit`      | Weight of today's date in Year, Day, and Week                     |
| `--current-day-hover-opacity`    | `1`            | Hover opacity of today's date marker in Year                      |
| `--indicator-color`              | `currentColor` | Year dot color fallback; also used in Day and Week's today labels |

## Year View — Calendar Week Column

| Token                 | Default                                           | Description                                       |
| --------------------- | ------------------------------------------------- | ------------------------------------------------- |
| `--year-cw-width`     | `1.8em`                                           | Week column width, subject to minimum target size |
| `--year-cw-font-size` | `0.875em`                                         | Week number font size, with a `0.875em` floor     |
| `--year-cw-color`     | `var(--header-text-color, var(--separator-dark))` | Week number color                                 |
| `--cw-hover-color`    | `inherit`                                         | Hover text color of week controls                 |
| `--cw-hover-bg`       | `transparent`                                     | Hover background of week controls                 |

## Multi-Day Events

| Token                   | Default | Description                                         |
| ----------------------- | ------- | --------------------------------------------------- |
| `--multi-day-separator` | `none`  | Start-edge border for all-day continuations in Week |
