---
layout: base.njk
title: 'Integration Guide'
order: 1
tags: docs
section: Usage
---

# Integration Guide

Practical recipes for embedding `<lms-calendar>` in different environments.

## Vanilla JS / HTML

For a static page without a bundler or import map, copy `dist/kalendus.iife.js` from the installed package to your site. This build includes Lit and Luxon. The regular package ESM uses bare peer imports and must be resolved by your bundler or import map.

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Calendar example</title>
        <script defer src="./kalendus.iife.js"></script>
        <style>
            lms-calendar {
                max-width: 1200px;
                margin: 0 auto;
            }
        </style>
    </head>
    <body>
        <lms-calendar id="demo"></lms-calendar>
        <script>
            customElements.whenDefined('lms-calendar').then(() => {
                const calendar = document.getElementById('demo');
                const date = { year: 2026, month: 11, day: 17 };
                calendar.activeDate = date;
                calendar.entries = [{
                    id: 'open-studio',
                    kind: 'all-day',
                    heading: 'Open studio',
                    date: { start: date, end: date },
                }];
                calendar.addEventListener('entry-activate', (event) => {
                    console.log(event.detail.entry.heading);
                });
            });
        </script>
    </body>
</html>
```

### Tips

- Set `document.documentElement.lang` so the default locale matches your site. Override per instance with `locale`; the root manages host `lang`/automatic RTL and exposes `localeReady` / `retryLocale()` for loading/fallback. `firstDayOfWeek` defaults to **1 Monday**, not a locale-derived value.
- Give Day, Week, and Year a definite height when fitting a fixed region; leave Month in normal flow. See [Layout & Positioning](./layout-and-positioning.md).
- Use CSS variables (`--primary-color`, `--week-mobile-day-count`, etc.) on the `<lms-calendar>` element to theme per instance.

## React

Assign object properties through a typed ref. For TypeScript JSX, declare the custom tag in React’s `JSX.IntrinsicElements`:

```tsx
import { useEffect, useRef, type DetailedHTMLProps, type HTMLAttributes } from 'react';
import '@jpahd/kalendus';
import type LMSCalendar from '@jpahd/kalendus';
import type { CalendarEntry, CalendarEntryRequest } from '@jpahd/kalendus';

declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'lms-calendar': DetailedHTMLProps<HTMLAttributes<LMSCalendar>, LMSCalendar>;
        }
    }
}

type CalendarProps = {
    entries: CalendarEntry[];
    onEntryActivate?: (detail: CalendarEntryRequest) => void;
};

export function Calendar({ entries, onEntryActivate }: CalendarProps) {
    const ref = useRef<LMSCalendar>(null);

    useEffect(() => {
        const calendar = ref.current;
        if (!calendar) return;
        calendar.entries = entries;
        const handler = (event: CustomEvent<CalendarEntryRequest>) => {
            onEntryActivate?.(event.detail);
        };
        calendar.addEventListener('entry-activate', handler);
        return () => calendar.removeEventListener('entry-activate', handler);
    }, [entries, onEntryActivate]);

    return <lms-calendar ref={ref} />;
}
```

- In an SSR framework, use this in a client-side wrapper. Registration and interactions are browser behavior; this recipe does not render the shadow tree on the server.
- Consider a thin adapter component to map application data into the `CalendarEntry` shape.

## Lit / Web Components

Because Kalendus is built with Lit, it interoperates directly:

```ts
import { LitElement, html } from 'lit';
import '@jpahd/kalendus';

import type { CalendarEntry } from '@jpahd/kalendus';

export class HostCalendar extends LitElement {
    static properties = {
        entries: { type: Array },
    };
    declare entries: CalendarEntry[];

    constructor() {
        super();
        this.entries = [];
    }

    render() {
        return html`
            <lms-calendar
                .entries=${this.entries}
                heading="Library Schedule"
                year-density-mode="count"
            ></lms-calendar>
        `;
    }
}
```

## Theming & CSS Tokens

| Token                                          | Purpose                              |
| ---------------------------------------------- | ------------------------------------ |
| `--primary-color`                              | Header buttons, selection highlights |
| `--week-day-count` / `--week-mobile-day-count` | Number of columns in week view       |
| `--week-mobile-breakpoint`                     | Width threshold for condensed weeks  |
| `--entry-font-size`, `--entry-padding`         | Entry card typography                |
| `--year-grid-columns*`                         | Year-view layout controls            |

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

| Event           | Detail payload                                                          | When it fires                                        |
| --------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| `switchview`    | <code>{ view: 'day' &#124; 'week' &#124; 'month' &#124; 'year' }</code> | Header view buttons                                  |
| `switchdate`    | <code>{ direction: 'next' &#124; 'previous' }</code>                    | Header navigation                                    |
| `peek-navigate` | <code>{ date, direction: 'next' &#124; 'previous' }</code>              | Condensed week peek arrows                           |
| `expand`        | `{ date, drillTarget }`                                                 | Month/Week/Year day clicks                           |
| `open-menu`     | `{ heading, content, time, date, anchorRect }`                          | Entry selection                                      |
| `locale-ready`  | `{ locale, catalogLocale, fallback }`                                   | Current locale load/fallback and root render settled |
| `menu-close`    | _none_                                                                  | Menu dismiss                                         |

> **Note:** The `expand` event's `drillTarget` is only present when fired from the year view. See the [Events Reference](./events.md) for full payload details.

Illustrative listener (replace `analytics` with your application’s analytics client):

```js
calendar.addEventListener('switchview', (event) => {
    analytics.track('calendar_switch_view', event.detail);
});
```

## State synchronization and replacing defaults

Assign public `activeDate` and `viewMode` to control navigation. Use **`calendar-state-change`** for initial and changed committed `{ activeDate, viewMode, firstDayOfWeek, range }`; `range` is half-open ISO civil dates. Month spillover and condensed weeks are included correctly. Legacy action notifications in the analytics table are not resulting state: do not derive a fetch window from `detail.direction` or `detail.view`.

To replace the default inspector/download, listen for cancelable `entry-activate` / `export-entry` and call **`preventDefault()` synchronously**, not `stopPropagation()`. Both carry the canonical original `{ entry, eventId }`, preserving multi-day endpoints and caller identity. See [Events Reference](./events.md).

## Connecting to the Kalendus API server

The optional server exposes REST + SSE under `/api/calendars`. It is **private-deny by default**: the host must inject `authorize`, including reads/streams/telemetry. Public mode is an explicit unauthenticated demo choice. Cross-origin use needs exact allowed origins; CORS is not authorization. Prefer same-origin authenticated deployment. [server/README.md](https://github.com/pders01/kalendus/blob/main/server/README.md) is authoritative; see [API Server Guide](./api-server.md) for setup and security boundaries.

### Vanilla client

This example assumes an existing page with a mounted calendar. Supply `refreshVisibleRange` in your application to refetch the calendar’s current range and handle cancellation.

```ts
import { KalendusApiClient } from '@jpahd/kalendus-server/client';

const client = new KalendusApiClient({
    baseUrl: '',
    calendarId: 'your-calendar-id',
    credentials: 'same-origin',
});

// Legacy API query ends are inclusive (not visibleRange.end).
// Fetch a range and push into the component
const calendar = document.querySelector('lms-calendar');
if (calendar) {
    calendar.entries = await client.fetchEvents('2026-03-01', '2026-03-31');
}

// Notifications contain no event IDs or details by default. Refetch via REST.
const stopChanges = client.onInvalidate(refreshVisibleRange);
const stopReconnect = client.onReconcile(refreshVisibleRange);
client.connect();
// On teardown: stopChanges(); stopReconnect(); client.disconnect();
```

Header-authenticated SSE requires an injected authenticated reconnecting `streamFactory` (native EventSource cannot send arbitrary headers), or disable sync. Reconcile the visible range on every initial/reconnected connection; SSE is in-process invalidation, not durable replay. Direct-client loaders own cancellation/generation checks and error UI; see the server README.

### Lit adapter

```ts
import { html, LitElement } from 'lit';
import '@jpahd/kalendus';
import { KalendusLitAdapter } from '@jpahd/kalendus-server/lit';

class RemoteCalendar extends LitElement {
    adapter = new KalendusLitAdapter(this, {
        baseUrl: '',
        calendarId: 'your-calendar-id',
        credentials: 'same-origin',
        enableSync: true,
        enableTelemetry: true,
    });

    render() {
        return html`
            <lms-calendar
                .entries=${this.adapter.entries}
                heading="Synced Calendar"
            ></lms-calendar>
        `;
    }
}
```

The adapter consumes the public `calendar-state-change`/getter contract, converts the half-open end to an inclusive server query end, deduplicates ranges and suppresses stale requests/results. It does not infer windows from legacy header events. Owners still bind `.entries` and render `adapter.loading` / `adapter.error`; `adapter.refresh()` retries a current range. Configure an explicit target for multiple calendars or non-queryable hosts. Telemetry is optional and must not contain secrets or event bodies.

## Common Recipes

### 1. Toggle condensed weeks on phones

```css
@media (max-width: 768px) {
    lms-calendar {
        --week-mobile-day-count: 3;
    }
}
```

<span id="2-highlight-weekends"></span>

### 2. Highlight today and activity

The component uses Shadow DOM, so external CSS cannot target internal elements directly. Instead, use CSS custom properties to style day cells:

```css
lms-calendar {
    --current-day-bg: #e3f2fd;
    --indicator-color: #1976d2;
}
```

These tokens style today and the activity indicators, not weekend columns. To distinguish weekend events, assign entry colors in your data layer.

<span id="3-inject-external-actions-into-the-menu"></span>

### 3. Open the inspector from an external list

Use the public `openMenu` method:

```js
calendar.openMenu({
    heading: 'Custom entry',
    content: 'Details rendered externally',
    time: { start: { hour: 8, minute: 0 }, end: { hour: 9, minute: 0 } },
    displayTime: '08:00 – 09:00',
    // Supply canonical entry/eventId for export, or at least a date for a single-day item.
});
```

### 4. Integrate with routing

Replace `router` with your application’s router.

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

Listen to initial/changed `calendar-state-change` and fetch its half-open `detail.range`, then assign a new `entries` array. Dedupe ranges and abort/ignore stale fulfillment and rejection. If your backend uses inclusive ends, convert the exclusive end by one civil day, not timestamp arithmetic. The shipped Lit adapter does this for the legacy server API.

**Can I render multiple calendars with different locales?**

Yes—each instance holds its own `ViewStateController`. Set `locale` per component and they'll stay independent.

**How do I theme the menu?**

Override the menu CSS custom properties on the `<lms-calendar>` element (e.g., `--menu-min-width`, `--menu-header-padding`, `--menu-title-font-size`). See the [CSS Token Reference](./css-tokens.md) for the full list.

**Does Kalendus work with Shadow DOM encapsulation?**

Yes. The component ships as a custom element with its own shadow root. Consumers can use standard custom-element patterns (attributes/properties/events) regardless of framework.

## Native integration

The optional Expo/React Native bridge is source integration, not a separately published native package. See [expo-bridge/README.md](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md) for `bun run build:iife`, inline HTML/string generation and `bun scripts/check-bridge.mjs`. Its development shell is not a self-contained Metro asset. Expo app TSX checking, release-device behavior, native sharing and VoiceOver/TalkBack remain separate gates, not implied by browser/VM checks.

## Further Reading

- **[Events Reference](./events.md)** — complete event documentation with payload types and code examples.
- **[CSS Token Reference](./css-tokens.md)** — all CSS custom properties organized by category.
- **[Layout & Positioning](./layout-and-positioning.md)** — height requirements, responsive behavior, all-day events.
- **[Troubleshooting](./troubleshooting.md)** — solutions for common issues.
