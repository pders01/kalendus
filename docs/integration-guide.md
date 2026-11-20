---
layout: base.njk
title: 'Integration Guide'
order: 1
tags: docs
section: Usage
---

# Integration Guide

Practical recipes for embedding `<lms-calendar>` in different environments. This guide describes the **unreleased `0.12.0` checkout**. For the current npm release, see the [published `0.11.0` source and docs](https://github.com/pders01/kalendus/tree/v0.11.0). Use one version for the calendar, its assets and its documentation. To generate the static file below from this checkout, run `bun install --frozen-lockfile` and `bun run build:iife` from the checkout root. The optional server and Expo bridge are checkout integrations; see their setup below.

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
- Size the calendar or its parent to give all four views the same height. Month uses spare space for more previews and scrolls within a sized embed if the grid or list is too tall. Without a supplied height, Month grows in page flow. See [Height and Scrolling](./layout-and-positioning.md#height-and-scrolling).
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
    color-scheme: dark;
    color: #e8f5fb;
    --background-color: #022b3a;
    --primary-color: #70d6ff;
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

Assign public `activeDate` and `viewMode` to request navigation. Use **`calendar-state-change`** for the initial and changed committed `{ activeDate, viewMode, firstDayOfWeek, range }`; `visibleRange` reads the last committed range. It is a half-open window of ISO civil dates, including Month spillover and condensed weeks. At the upper civil bound the exclusive end can be `10000-01-01`. Legacy action notifications are not resulting state: do not derive a fetch window from `detail.direction` or `detail.view`.

To replace default activation (inspector or inline Agenda details) or download, listen for cancelable `entry-activate` / `export-entry` on the calendar and call **`preventDefault()` synchronously**, not `stopPropagation()`. Both carry the canonical original `{ entry, eventId }`, preserving multi-day endpoints and caller identity. An owner call to `openMenu()` does not emit `entry-activate`. See [Events Reference](./events.md).

## Connecting to the Kalendus API server

The optional REST + SSE server is **not published on npm**. Build it from the `server/` workspace or install a local tarball. Only the loopback demo below is unauthenticated. In production, prefer same-origin authenticated deployment with a host-supplied authorization policy for reads, writes, streams and telemetry. See the [API Server Guide](./api-server.md) and [server README](https://github.com/pders01/kalendus/blob/main/server/README.md).

### Vanilla client

With the [local packages installed](https://github.com/pders01/kalendus/blob/main/server/README.md#install-the-local-packages-into-another-project), use `KalendusApiClient` from `@jpahd/kalendus-server/client` in a non-Lit host. A client configured with `{ baseUrl: '', calendarId, credentials: 'same-origin' }` uses the same proxy as the Lit starter below. Register and mount `<lms-calendar>` before assigning `calendar.entries`. Subscribe to `calendar-state-change` before its initial commit (or read `visibleRange` after the commit), then call `client.fetchEvents(start, inclusiveEnd, signal)`. Use the committed range, clip to the server's date domain, and convert its exclusive end to the prior civil date. `fetchEvents()` maps wire records; `fetchRawEvents()` returns DTOs, not display-ready entries.

A direct-client loader owns loading/error UI, request deduplication, and cancellation. Abort superseded requests and ignore late fulfillment **and** rejection even if the transport ignores abort. Don't show an empty success on a failed load. If using a custom backend, also validate the response shape before assigning data. On teardown remove the state listener and abort active reads.

If enabling sync, subscribe to **both** `client.onInvalidate()` (event changes or parent deletion) and `client.onReconcile()` (successful initial or reconnected stream). Both should refetch the current range via REST, not patch it from SSE. For asynchronous callbacks, use a synchronous wrapper such as `() => { void reloadVisibleRange().catch(showLoadError); }`, where the app's reload function suppresses canceled/stale errors and `showLoadError` updates the UI. Handle synchronous `client.connect()` failures, and use `client.streamState` / `client.onStreamStateChange()` for live status independently of REST. On teardown unsubscribe and call `client.disconnect()`. A failed reconnect does not trigger reconciliation. See [transport choices and stream health](./api-server.md#browser-client) before enabling live updates.

### Lit adapter

This starter uses **REST only** with a manual refresh button. First, run the [disposable loopback server demo](./api-server.md#local-demo-and-build) and keep it running. Note its seed calendar ID and seed date. In another terminal, build the two [local tarballs](https://github.com/pders01/kalendus/blob/main/server/README.md#install-the-local-packages-into-another-project) from the same checkout.

In a new app directory **outside the checkout**, initialize the app and install the tarballs, peers and Vite. Set `ARTIFACTS` to the absolute directory printed by the packaging step:

```sh
bun init -y
bun add "$ARTIFACTS/kalendus.tgz" "$ARTIFACTS/kalendus-server.tgz" 'lit@^3.0.0' 'luxon@^3.4.4'
bun add -d vite@^7.3.8
```

Create `.env.local` with the actual values from the seed step. These are public demo identifiers, **not secrets**:

```dotenv
VITE_DEMO_CALENDAR_ID=replace_with_seeded_calendar_id
VITE_DEMO_DATE=replace_with_seed_date_as_YYYY-MM-DD
```

`vite.config.mjs` proxies API requests under the app's origin. Preserve the browser-facing `Host` so the server's same-origin check can match it when a request sends `Origin`:

```js
import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        proxy: {
            '/api/calendars': { target: 'http://127.0.0.1:3000', changeOrigin: false },
        },
    },
});
```

`index.html` mounts the demo component:

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Local Kalendus API demo</title>
        <script type="module" src="/calendar.js"></script>
    </head>
    <body>
        <remote-calendar></remote-calendar>
    </body>
</html>
```

`calendar.js` registers the wrapper and uses the adapter's managed loading, cancellation and error state:

```js
import { html, LitElement } from 'lit';
import '@jpahd/kalendus';
import { KalendusLitAdapter } from '@jpahd/kalendus-server/lit';

const calendarId = import.meta.env.VITE_DEMO_CALENDAR_ID ?? '';
const seedDate = import.meta.env.VITE_DEMO_DATE ?? '';
const parsed = new Date(`${seedDate}T00:00:00Z`);
const activeDate = {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
};
const validConfig =
    /^[A-Za-z0-9_-]{1,128}$/.test(calendarId) &&
    /^\d{4}-\d{2}-\d{2}$/.test(seedDate) &&
    activeDate.year >= 1970 && activeDate.year <= 2100 &&
    parsed.toISOString().slice(0, 10) === seedDate;

class RemoteCalendar extends LitElement {
    adapter = validConfig
        ? new KalendusLitAdapter(this, {
              baseUrl: '',
              calendarId,
              credentials: 'same-origin',
              enableSync: false,
          })
        : null;

    render() {
        if (!this.adapter) {
            return html`<p role="alert">Set the seed ID and date in .env.local, then restart Vite.</p>`;
        }
        const { entries, loading, error } = this.adapter;
        return html`
            <p role="status">${loading ? 'Loading calendar events…' : ''}</p>
            ${error ? html`<p role="alert">Calendar refresh failed. Check the demo server and seed ID.</p>` : ''}
            <button type="button" @click=${this.refresh}>Refresh events</button>
            <lms-calendar
                .entries=${entries}
                .activeDate=${activeDate}
                view-mode="day"
                heading="Local API demo"
            ></lms-calendar>
        `;
    }

    refresh() {
        // Load failures are rendered through adapter.error; report unexpected rejections.
        this.adapter?.refresh().catch(() => console.error('Calendar refresh failed unexpectedly.'));
    }
}

customElements.define('remote-calendar', RemoteCalendar);
```

Run `bun run vite --host 127.0.0.1 --port 5173 --strictPort` and open `http://127.0.0.1:5173`. The initial Day view uses the explicit seed date, so it should show **Team Standup** and **Lunch Break** even if the browser's local date differs. If you changed the server port, update the proxy target as well. Do not expose either demo port on a network.

The adapter consumes public committed state, converts the exclusive end to an inclusive server query end, deduplicates ranges, and suppresses stale results/errors. The calendar stays mounted while loading so it can continue reporting range changes. Transient errors may leave prior results visible alongside the error message; this is not a fresh empty result. If you enable sync in your app, render `adapter.streamState` separately from REST `loading` and `error`. Disconnecting the host aborts work and releases listeners/streams. See [adapter behavior](./api-server.md#lit-adapter-and-committed-state) for explicit targets and server bounds. Telemetry is off in this starter; if enabling it, do not send secrets or event bodies.

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
    --current-day-color: #12304a;
    --indicator-color: LinkText;
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

For an app-specific endpoint, check `response.ok` before decoding JSON, check that the result is the expected entry array (not an error object, an envelope or summary counts), and validate/map records to [the input contract](./library-usage.md). Assign a new `.entries` array only after a successful load. Show loading, fetch/validation errors and a retry path; an empty array is a successful result, not an error fallback. If navigation, account changes or unmount can overtake a load, abort it and guard both late success and late failure. For the Kalendus server, use the [Lit starter](#lit-adapter) rather than assigning raw wire DTOs.

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

The optional Expo/React Native bridge is a source integration, not a separately published native package. Update the protocol v2 wrapper and regenerate the self-contained HTML/string from the same checkout. See the [Expo build instructions and starter](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md); the development shell is not a self-contained Metro asset. Bridge readiness and schema checks do not guarantee acceptance of each entry by the root. Expo app TSX checking, release-device behavior, native sharing and VoiceOver/TalkBack remain separate gates, not implied by browser/VM checks.

## Further Reading

- **[Events Reference](./events.md)** — complete event documentation with payload types and code examples.
- **[CSS Token Reference](./css-tokens.md)** — all CSS custom properties organized by category.
- **[Layout & Positioning](./layout-and-positioning.md)** — height requirements, responsive behavior, all-day events.
- **[Troubleshooting](./troubleshooting.md)** — solutions for common issues.
