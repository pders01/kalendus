# Using Kalendus as a Library

This document explains how to consume the `lms-calendar` web component that ships with `@jpahd/kalendus`, with emphasis on package structure, runtime contracts, and integration patterns for application developers embedding the calendar inside their own products.

## Package overview

- **artefacts**: published as pure ESM with `main`/`module` pointing at `dist/kalendus.js` and runtime type definitions exposed through `dist/lms-calendar.d.ts` plus `custom-elements.json` for IDE tooling.
- **peer dependencies**: `lit` and `luxon` are declared as peers; your application must provide them at compatible versions (see `package.json`). Everything else is bundled.
- **component tree**: `<lms-calendar>` composes header, month/week/day grids, entry cards, and the contextual `<lms-menu>` overlay. Internal helpers such as `LayoutCalculator`, `SlotManager`, and `ViewStateController` are private but determine layout and state.

## Installation

```bash
pnpm add @jpahd/kalendus lit luxon
# or: npm/yarn equivalents
```

Kalendus targets modern evergreen browsers with native Custom Elements, Shadow DOM, ResizeObserver, and CSS container queries. For legacy browsers you must supply the relevant polyfills yourself.

## Importing and registration

`src/lms-calendar.ts` registers the element via `@customElement('lms-calendar')`, so importing the package once per bundle is enough:

```ts
// anywhere in your app entry point
import '@jpahd/kalendus';

// later in templates / JSX / HTML
const template = html`<lms-calendar></lms-calendar>`;
```

When tree-shaking, keep the side-effect import (e.g. add it to the `sideEffects` allow list if your bundler strips bare CSS imports).

## Data contracts

TypeScript definitions ship with the package, but the essential shapes are below for quick reference:

```ts
type CalendarDate = { day: number; month: number; year: number };
type CalendarTime = { hour: number; minute: number };
type CalendarTimeInterval = { start: CalendarTime; end: CalendarTime };
type CalendarDateInterval = { start: CalendarDate; end: CalendarDate };

type CalendarEntry = {
    date: CalendarDateInterval;
    time?: CalendarTimeInterval; // omit or span 00:00-23:59 for all-day blocks
    heading: string;
    content?: string;
    color: string; // any valid CSS color
    isContinuation?: boolean; // optional, the component recalculates this
};
```

Constraints enforced inside `willUpdate`:

1. Entries with invalid date/time ranges (end before start) are dropped using `luxon.Interval` validation.
2. Arrays are sorted by start time so you do not need to pre-sort.
3. Multi-day entries are automatically expanded into per-day slices, and continuation metadata is injected for styling.

## `<lms-calendar>` API surface

### Public properties

| Property          | Attribute           | Type                            | Default               | Notes                                                                                          |
| ----------------- | ------------------- | ------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `heading`         | `heading`           | `string`                        | `undefined`           | Optional text rendered in the header.                                                          |
| `activeDate`      | –                   | `CalendarDate`                  | today                 | Getter/setter proxying `ViewStateController`. Assigning triggers navigation.                   |
| `entries`         | –                   | `CalendarEntry[]`               | `[]`                  | Main data source. Provide a new array when mutating so Lit detects the change.                 |
| `color`           | `color`             | `string`                        | `'#000000'`           | Primary accent used by header buttons and gradients.                                           |
| `locale`          | `locale`            | `string`                        | `<html lang>` \\ `en` | Controls UI strings plus date formatting. All supported codes are listed under _Localization_. |
| `firstDayOfWeek`  | `first-day-of-week` | `0`–`6`                         | `1`                   | Changes ISO week alignment; reflected attribute enables declarative authoring.                 |
| `yearDrillTarget` | `year-drill-target` | `'day' \| 'month'`              | `'month'`             | Determines which view opens after clicking a day in the year overview.                         |
| `yearDensityMode` | `year-density-mode` | `'dot' \| 'heatmap' \| 'count'` | `'dot'`               | Selects the per-day density visualization in the year overview.                                |

### Methods

- `openMenu(eventDetails)` opens the built-in `lms-menu` overlay with `{ heading, content, time, date?, anchorRect? }`. Use this to integrate your own action surfaces (e.g., call `openMenu` when a host-side list item is clicked so the same menu renders).

### Reactive updates

- Reassign the `entries` array to trigger updates (`calendar.entries = [...calendar.entries, newEntry]`). Mutating in place without reassignment will not notify Lit.
- `activeDate` is mutable; consider persisting it in application state if deep-linking.
- The component maintains an internal `viewMode` state (`month | week | day | year`). Currently this is not exposed as a property; respond to the DOM events below if you need to stay in sync with user actions.

## Custom DOM events

All events bubble and are composed, so you can listen directly on `<lms-calendar>` in any framework.

| Event                    | Detail payload                                           | Fired by                                                                 | Typical use                                                                                 |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `switchdate`             | `{ direction: 'next' \| 'previous' }`                    | Header nav buttons                                                       | Mirror navigation in your app bar or analytics.                                             |
| `switchview`             | `{ view: 'day' \| 'week' \| 'month' \| 'year' }`         | Header context buttons                                                   | Track the active zoom level.                                                                |
| `jumptoday`              | `{ date: CalendarDate }`                                 | Header “Today” button                                                    | Reset external filters to today.                                                            |
| `expand`                 | `{ date: CalendarDate; drillTarget?: 'day' \| 'month' }` | Clicking a day label in month/week grid or any cell in the year overview | Switch your surrounding UI (e.g., load day-specific details) when the calendar drills down. |
| `open-menu`              | `{ heading, content, time, date?, anchorRect }`          | Entry cards                                                              | Intercept to show a custom panel or cancel the built-in one.                                |
| `menu-close`             | none                                                     | Menu close button                                                        | Hide mirrored overlays when the built-in menu closes.                                       |
| `clear-other-selections` | `{ exceptEntry: HTMLElement }`                           | Entry focus events                                                       | Keep multi-surface selections in sync.                                                      |

You can stop propagation to replace built-in behavior. For example, intercept `open-menu`, call `event.preventDefault()`, and show your own drawer while leaving the rest of the component untouched.

## Year view integration

- The `<lms-calendar-year>` child receives a pre-computed `entrySumByDay` map (keys such as `2026-04-21`) so density indicators remain O(1) per cell, even with thousands of entries.
- `year-density-mode` toggles how that count is rendered (dot, heatmap buckets, or explicit counts). Pair this with the CSS tokens described in `README.md` if you need brand-specific palettes.
- `year-drill-target` switches the default navigation when a user clicks any day: `day` jumps straight to the 24-hour view, `month` zooms into the grid of that month. Month headers in the year view always set `drillTarget: 'month'`.
- Listen for the `expand` event to synchronize external routers or analytics: `event.detail.drillTarget` mirrors the target you configured, so you can differentiate day-level vs. month-level navigation in your host app.

## Entry ingestion and layout

1. **Validation**: `willUpdate` rejects entries whose `date` or `time` ranges are invalid per `luxon Interval`. Feed valid ISO-like data only.
2. **Day splitting**: `_expandEntryMaybe` uses `DateTime.plus({ days: index })` to clone multi-day events. Continuation metadata is added so entry chips can indicate start, middle, or end segments.
3. **All-day detection**: Any entry without `time`, or whose time interval runs 00:00–23:59, is rendered in the dedicated all-day row using `allocateAllDayRows` logic.
4. **Responsive month mode**: if the observed width is `<768px`, month cells collapse to aggregated dots (`displayMode = 'month-dot'`). Above that threshold, full entry chips render inside each day.
5. **Week/day stacking**: The combination of `LayoutCalculator` and `SlotManager` determines vertical slots (`minuteHeight = 1` pixel) and horizontal cascading (`cascadeOffset = 15`). Overlapping events share column slots with opacity adjustments.

## Styling and theming

The element exposes 80+ CSS custom properties. Common entry points:

| Token                                                         | Purpose                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `--background-color`                                          | Base surface color; default `white`.                             |
| `--primary-color`                                             | Primary accent used in menu buttons and highlights.              |
| `--header-height`, `--header-text-color`                      | Header sizing and typography.                                    |
| `--border-radius-sm/md/lg`                                    | Rounded corners applied across entries, menu, and context chips. |
| `--time-column-width`                                         | Width of the schedule gutter in week/day view.                   |
| `--entry-font-size`, `--entry-line-height`, `--entry-padding` | Entry typography.                                                |
| `--entry-handle-width/color`                                  | Handle strip on timed entries in week/day view.                  |
| `--entry-dot-size`                                            | Dot indicators in compact month rendering.                       |
| `--shadow-sm/md/lg/hv`                                        | Box shadows for cards and overlays.                              |

Apply tokens on the host element:

```css
lms-calendar {
    --primary-color: #1976d2;
    --background-color: #fefefe;
    --entry-font-size: 0.85rem;
}
```

All styles live inside the component’s shadow root, so global CSS will not leak in unless you override the provided tokens.

## Localization

- Set `locale` per instance to any of the built-in codes: `en`, `de`, `de-DE`, `es`, `fr`, `hi`, `bn`, `ru`, `id`, `ko`, `tr`, `vi`, `it`, `th`, `pl`, `uk`, `nl`, `ja`, `pt`, `ar`, `zh-Hans`.
- The component auto-detects from `<html lang>` when `locale` is unset.
- Day and month names come from Luxon/Intl; UI strings come from `src/lib/messages.ts`.
- Override the week structure via `firstDayOfWeek` (0=Sunday … 6=Saturday) to match local conventions independently of locale.

## Accessibility behavior

- Header controls use semantic `<button>` elements with ARIA labels and `aria-pressed` states for the current view.
- Entry chips expose `role="button"`, `aria-selected`, and keyboard handlers for Space/Enter activation.
- Focus management: when an entry opens the menu, focus moves into `<lms-menu>`; closing the menu restores focus to the triggering entry.
- `aria-live="polite"` wraps the main content so screen readers announce view changes.

## Integration patterns

### Vanilla JS

```js
const calendar = document.querySelector('lms-calendar');
calendar.entries = buildEntriesFromApi(data);
calendar.addEventListener('switchview', (event) => {
    console.log('View changed to', event.detail.view);
});
```

### React wrapper

```tsx
import { useEffect, useRef } from 'react';
import '@jpahd/kalendus';

export function Calendar({ entries }: { entries: CalendarEntry[] }) {
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.entries = entries;
        }
    }, [entries]);

    return <lms-calendar ref={ref as React.RefObject<any>} heading="Schedule" />;
}
```

### Vue 3 example

```vue
<template>
    <lms-calendar ref="calendar" :heading="heading" />
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from 'vue';
import '@jpahd/kalendus';

const calendar = ref<HTMLElement | null>(null);
const entries = ref<CalendarEntry[]>([]);

watch(entries, (value) => {
    if (calendar.value) calendar.value.entries = value;
});

onMounted(() => {
    calendar.value?.addEventListener('open-menu', (event) => {
        // sync with Vue state
    });
});
</script>
```

For Angular or Lit apps, treat `<lms-calendar>` as any other custom element; Angular 14+ supports standalone custom elements automatically, and Lit components can include it via `unsafeStatic('lms-calendar')` if needed.

## Performance and state tips

- **Immutable updates**: always assign new arrays/objects so Lit notices changes.
- **Chunked data**: when streaming hundreds of events, pre-group by day server side to limit client work. The component handles large lists but layout work scales linearly with expanded entries.
- **All-day events**: omit the `time` block entirely for true all-day spans; this skips unnecessary minute grid calculations.
- **Menu override**: intercept `open-menu` for bulk updates instead of reading DOM to figure out which event was clicked.
- **Resize awareness**: the calendar uses `ResizeObserver`; keep it in a visible container so the observer can measure actual width.

## Testing hooks

- Import `@jpahd/kalendus` inside your test harness once, then use `@open-wc/testing` fixtures to instantiate the element.
- Assert properties rather than DOM text when possible (e.g., `expect(el.activeDate.year).to.equal(2026);`).
- Dispatch DOM events to simulate navigation (`el.shadowRoot.querySelector('lms-calendar-header')?.dispatchEvent(new CustomEvent('switchview', { detail: { view: 'week' }, bubbles: true, composed: true }));`).

## Troubleshooting

- **Nothing renders**: confirm `lit` and `luxon` peer deps are resolved once; duplicate copies can break instanceof checks.
- **Entries not updating**: ensure you reassign `calendar.entries` instead of mutating the existing array.
- **Menu stuck open**: check for listeners that swallow `menu-close`. If you replace the built-in menu, call `clearSelection()` on the triggering `<lms-calendar-entry>` to reset ARIA state.
- **Incorrect locale**: pass `locale` explicitly when embedding calendars inside documents whose `<html lang>` differs from the desired language.

Refer to `docs/rendering-calculations.md` for deeper insight into the slot math that powers week/day positioning if you need to extend the component.
