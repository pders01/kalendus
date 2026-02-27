# Design Token Refactoring Analysis

## Current State Analysis

After examining all component styles, I've identified significant opportunities to reduce duplication and improve consistency through better design token composition.

## Identified Duplication Patterns

### 1. **Hardcoded Values Repeated Across Components**

| Value                                          | Day.ts | Week.ts | Month.ts | Main Calendar |
| ---------------------------------------------- | ------ | ------- | -------- | ------------- |
| `0.75em` (font-size)                           | ✅     | ✅      | ❌       | ❌            |
| `rgba(0, 0, 0, 0.6)` (text color)              | ✅     | ✅      | ❌       | ✅ (as token) |
| `4em` (time column width)                      | ✅     | ✅      | ❌       | ❌            |
| `1px solid var(--separator-light)`             | ✅     | ✅      | ✅       | ✅ (as token) |
| `calc(100% - var(--day-header-height, 3.5em))` | ✅     | ✅      | ❌       | ❌            |
| `repeat(1440, 1fr)`                            | ✅     | ✅      | ❌       | ❌            |
| `center` (text-align)                          | ✅     | ✅      | ❌       | ✅ (as token) |

### 2. **Inconsistent Token Usage**

**Grid Calculations:**

- Day/Week use hardcoded `4em` for time column
- Should use `--time-column-width` token

**Typography:**

- Day/Week use hardcoded `0.75em` for hour indicators
- Should use `--hour-indicator-font-size` token

**Border Styles:**

- Some components use `border-right: 1px solid var(--separator-light)`
- Others use `border-right: var(--sidebar-border, 1px solid var(--separator-light))`
- Inconsistent fallback patterns

### 3. **Missing Semantic Tokens**

**Layout Tokens:**

- No `--time-column-width` (currently hardcoded as `4em`)
- No `--grid-rows-per-day` (currently hardcoded as `1440`)
- No `--main-container-height-offset`

**Typography Tokens:**

- No `--hour-indicator-font-size`
- No `--day-label-font-weight`
- No `--month-indicator-font-weight`

**Grid Tokens:**

- No `--calendar-grid-columns-day`
- No `--calendar-grid-columns-week`
- No `--calendar-grid-columns-month`

## Proposed Design Token Architecture

### 1. **Core Layout Tokens**

```css
/* Time-based grid system */
--time-column-width: 4em;
--grid-rows-per-day: 1440; /* 24 hours × 60 minutes */
--main-container-height-offset: 1em;

/* Grid templates */
--calendar-grid-columns-day: var(--time-column-width) 1fr;
--calendar-grid-columns-week: var(--time-column-width) repeat(7, 1fr);
--calendar-grid-columns-month: repeat(7, 1fr);
--calendar-grid-rows-time: repeat(var(--grid-rows-per-day), 1fr);

/* Container heights */
--view-container-height: calc(100% - var(--day-header-height));
--main-content-height: calc(100% - var(--main-container-height-offset));
```

### 2. **Typography Tokens**

```css
/* Hour indicators */
--hour-indicator-font-size: 0.75em;
--hour-indicator-color: var(--header-text-color);
--hour-indicator-text-align: var(--hour-text-align);

/* Day labels */
--day-label-font-weight: 500;
--day-label-text-align: center;

/* Month indicators */
--month-indicator-font-weight: var(--indicator-font-weight);
--month-indicator-color: var(--indicator-color);
```

### 3. **Border & Spacing Tokens**

```css
/* Consistent border patterns */
--border-separator-standard: 1px solid var(--separator-light);
--border-separator-right: var(--border-separator-standard);
--border-separator-bottom: var(--border-separator-standard);
--border-separator-top: var(--border-separator-standard);

/* Remove border utilities */
--border-none-right: none;
--border-none-bottom: none;
```

### 4. **Component-Specific Mixins**

```css
/* Hour indicator mixin */
--hour-indicator-styles: {
    font-size: var(--hour-indicator-font-size);
    color: var(--hour-indicator-color);
    text-align: var(--hour-indicator-text-align);
    position: relative;
    top: var(--indicator-top);
}

/* Grid container mixin */
--time-grid-container-styles: {
    display: grid;
    grid-template-rows: var(--calendar-grid-rows-time);
    height: var(--main-content-height);
    gap: var(--day-gap);
    padding: var(--day-padding);
    overflow-y: auto;
    position: relative;
};
```

## Refactoring Implementation Plan

### Phase 1: Core Layout Tokens

1. **Add new tokens to main calendar**:

```css
--time-column-width: 4em;
--grid-rows-per-day: 1440;
--calendar-grid-columns-day: var(--time-column-width) 1fr;
--calendar-grid-columns-week: var(--time-column-width) repeat(7, 1fr);
--view-container-height: calc(100% - var(--day-header-height));
--main-content-height: calc(100% - var(--day-main-offset));
```

2. **Update Day component**:

```css
.container {
    height: var(--view-container-height);
}

.main {
    grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
    grid-template-rows: var(--calendar-grid-rows-time);
    height: var(--main-content-height);
}
```

3. **Update Week component**:

```css
.week-container {
    height: var(--view-container-height);
}

.week-header {
    grid-template-columns: var(--calendar-grid-columns-week);
}

.week-content {
    grid-template-columns: var(--calendar-grid-columns-week);
    grid-template-rows: var(--calendar-grid-rows-time);
    height: var(--main-content-height);
}
```

### Phase 2: Typography Tokens

1. **Add typography tokens**:

```css
--hour-indicator-font-size: 0.75em;
--hour-indicator-color: var(--header-text-color);
--day-label-font-weight: 500;
```

2. **Update all hour indicator styles**:

```css
/* Day.ts */
.hour {
    font-size: var(--hour-indicator-font-size);
    color: var(--hour-indicator-color);
}

/* Week.ts */
.hour-indicator {
    font-size: var(--hour-indicator-font-size);
    color: var(--hour-indicator-color);
}

.day-label {
    font-weight: var(--day-label-font-weight);
}
```

### Phase 3: Border Standardization

1. **Standardize border usage**:

```css
/* Replace inconsistent patterns */
/* OLD: border-right: 1px solid var(--separator-light) */
/* NEW: border-right: var(--border-separator-right) */

/* OLD: border-right: var(--sidebar-border, 1px solid var(--separator-light)) */
/* NEW: border-right: var(--sidebar-border, var(--border-separator-right)) */
```

### Phase 4: Utility Classes

1. **Create reusable utility classes**:

```css
/* Width utilities (currently duplicated) */
.w-100 {
    width: 100%;
}
.w-70 {
    width: 70%;
}
.w-30 {
    width: 30%;
}
.w-0 {
    width: 0;
}

/* Border removal utilities */
.border-right-none {
    border-right: var(--border-none-right);
}
.border-bottom-none {
    border-bottom: var(--border-none-bottom);
}

/* Grid positioning utilities */
.grid-col-1 {
    grid-column: 1;
}
.grid-col-2-to-end {
    grid-column: 2 / -1;
}
```

## Benefits of Refactoring

### 1. **Reduced Duplication**

- Remove ~20 hardcoded values across components
- Eliminate inconsistent fallback patterns
- Consolidate repeated calculation patterns

### 2. **Improved Maintainability**

- Single source of truth for layout values
- Easier to modify grid system globally
- Consistent token naming patterns

### 3. **Better Theming Support**

- All layout values become themeable
- Consistent override patterns
- Clear semantic meaning

### 4. **Enhanced Developer Experience**

- Clear token names indicate purpose
- Easier to understand component relationships
- Better IDE autocomplete with consistent naming

## Implementation Priority

1. **High Priority** (Phase 1): Layout tokens - fixes hardcoded grid values
2. **Medium Priority** (Phase 2): Typography tokens - standardizes text styling
3. **Low Priority** (Phase 3-4): Border/utility standardization - reduces minor duplication

## Testing Strategy

1. **Visual regression testing**: Ensure no visual changes after refactoring
2. **Token validation**: Verify all tokens resolve correctly
3. **Override testing**: Confirm theming still works as expected
4. **Performance testing**: Ensure no CSS performance regression

## Files to Update

### Core Token Definitions

- `src/lms-calendar.ts` - Add new design tokens

### Component Updates

- `src/components/Day.ts` - Replace hardcoded values
- `src/components/Week.ts` - Replace hardcoded values
- `src/components/Month.ts` - Add missing token usage

### Documentation Updates

- `docs/rendering-calculations.md` - Update with new token system
- Add token documentation for themers
- Update examples with new token names

This refactoring will significantly reduce duplication while improving consistency and maintainability across the entire calendar system.
