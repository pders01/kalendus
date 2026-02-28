# Integration Guide

Practical recipes for embedding `<lms-calendar>` in different environments.

## Vanilla JS / HTML

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <script type="module" src="/node_modules/@jpahd/kalendus/dist/kalendus.js"></script>
    <style>
      lms-calendar {
        max-width: 1200px;
        margin: 0 auto;
      }
    </style>
  </head>
  <body>
    <lms-calendar id="demo"></lms-calendar>
    <script type="module">
      import events from './data/events.js';
      const calendar = document.getElementById('demo');
      calendar.entries = events;
      calendar.addEventListener('open-menu', (evt) => {
        console.log('Selected entry', evt.detail);
      });
    </script>
  </body>
</html>
```

### Tips

- Set `document.documentElement.lang` so the default locale matches your site. Override per instance with the `locale` property.
- Use CSS variables (`--primary-color`, `--week-mobile-day-count`, etc.) on the `<lms-calendar>` element to theme per instance.

## React

Wrap the custom element using `React.useEffect` for imperative props:

```tsx
import { useEffect, useRef } from 'react';
import '@jpahd/kalendus';

export function Calendar({ entries, onOpenMenu }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.entries = entries;
      const handler = (event) => onOpenMenu?.(event.detail);
      ref.current.addEventListener('open-menu', handler);
      return () => ref.current.removeEventListener('open-menu', handler);
    }
  }, [entries, onOpenMenu]);

  return <lms-calendar ref={ref} color="#0d47a1" />;
}
```

- When server-rendering, remember to load the component module (`@jpahd/kalendus`) once; the custom element registers globally.
- Consider a thin adapter component to map application data into the `CalendarEntry` shape.

## Lit / Web Components

Because Kalendus is built with Lit, it interoperates directly:

```ts
import { LitElement, html } from 'lit';
import '@jpahd/kalendus';

export class HostCalendar extends LitElement {
  static properties = {
    entries: { type: Array },
  };

  render() {
    return html`
      <lms-calendar
        .entries=${this.entries}
        .heading="Library Schedule"
        year-density-mode="count"
      ></lms-calendar>
    `;
  }
}
```

## Theming & CSS Tokens

| Token | Purpose |
| --- | --- |
| `--primary-color` | Header buttons, selection highlights |
| `--week-day-count` / `--week-mobile-day-count` | Number of columns in week view |
| `--week-mobile-breakpoint` | Width threshold for condensed weeks |
| `--entry-font-size`, `--entry-padding` | Entry card typography |
| `--year-grid-columns*` | Year-view layout controls |

Set tokens inline, via component-scoped styles, or globally.

```css
lms-calendar.theme-ocean {
  --primary-color: #006994;
  --background-color: #022b3a;
  --entry-font-size: 0.85rem;
  --week-mobile-day-count: 4;
}
```

## Analytics Hooks

Listen on the element for user actions:

| Event | Detail payload | When it fires |
| --- | --- | --- |
| `switchview` | `{ view: 'day'|'week'|'month'|'year' }` | Header view buttons |
| `switchdate` | `{ direction: 'next'|'previous' }` | Header navigation |
| `peek-navigate` | `{ direction: 'next'|'previous' }` | Condensed week peek arrows |
| `expand` | `{ date, drillTarget }` | Month/Week/Year day clicks |
| `open-menu` | `{ heading, content, time, date, anchorRect }` | Entry selection |

Example (vanilla):

```js
calendar.addEventListener('switchview', (event) => {
  analytics.track('calendar_switch_view', event.detail);
});
```

## Common Recipes

### 1. Toggle condensed weeks on phones

```css
@media (max-width: 768px) {
  lms-calendar {
    --week-mobile-day-count: 3;
  }
}
```

### 2. Highlight weekends

Use `::part(day-cell)` once the component exposes parts, or wrap `<lms-calendar-month>` with your own CSS using the attribute selectors the component emits (coming soon). For now, listen to `expand` events and decorate surrounding UI.

### 3. Inject external actions into the menu

Use the public `openMenu` method:

```js
calendar.openMenu({
  heading: 'Custom entry',
  content: 'Details rendered externally',
  time: '08:00 – 09:00',
});
```

### 4. Integrate with routing

```js
calendar.addEventListener('expand', (event) => {
  const { date } = event.detail;
  router.push(`/schedule/${date.year}/${date.month}/${date.day}`);
});
```

### 5. Provide initial data from APIs

```js
fetch('/api/events')
  .then((res) => res.json())
  .then((entries) => {
    calendar.entries = entries;
  });
```

## FAQ

**How do I lazy-load event data?**

Listen to `switchdate` and `expand` events, then fetch data for the new date range before updating `entries`.

**Can I render multiple calendars with different locales?**

Yes—each instance holds its own `ViewStateController`. Set `locale` per component and they'll stay independent.

**How do I theme the menu?**

Override the CSS variables defined in `src/components/Menu.ts` by applying tokens on the `<lms-calendar>` element (e.g., `--menu-background`, `--menu-button-color`).

**Does Kalendus work with Shadow DOM encapsulation?**

Yes. The component ships as a custom element with its own shadow root. Consumers can use standard custom-element patterns (attributes/properties/events) regardless of framework.
