---
layout: base.njk
title: 'API Server Guide'
order: 14
tags: docs
section: Reference
---

# API Server Guide

The optional `@jpahd/kalendus-server` package provides a Hono/SQLite REST API, in-process SSE invalidation and browser/Lit adapters. **[server/README.md](https://github.com/pders01/kalendus/blob/main/server/README.md) is the authoritative API and deployment guide**, including authorization policy context, limits, migrations, cookie/header transports, telemetry and package checks.

## Breaking security defaults

- **Private-deny by default:** `createApp({ db })` returns 403 on every `/api/calendars` route unless the host injects an `authorize` policy. This includes creation, event reads/writes, summary, manifest, telemetry and SSE. `/health` remains public.
- The host authenticates real sessions/tokens and checks trusted per-calendar permissions on **every** request. Calendar IDs are not credentials. A configured policy takes precedence over public mode; policy errors never grant access.
- SSE sends payload-free invalidations by default. Full event details require a separate `authorizeStreamDetails` grant for readers with access to every event in the calendar. Stream permission never bypasses REST authorization.
- `mode: 'public'` is an explicit unauthenticated demo choice, not a private deployment shortcut. The CLI stays closed unless `KALENDUS_PUBLIC_DEMO=true`; it binds to `127.0.0.1` unless deliberately changed.
- There is no wildcard CORS default. Cross-origin browser access requires exact `allowedOrigins`; credentialed CORS also requires `allowCredentials: true`. CORS is not authentication, authorization or CSRF validation. Same-origin/nonbrowser clients still require authorization.

```ts
import { createApp, createDb, migrateDb } from '@jpahd/kalendus-server';

const db = createDb();
migrateDb(db); // deliberate deployment step
const { app } = createApp({
    db,
    authorize: hostAuthorizationPolicy, // validates identity and calendar permissions
    allowedOrigins: ['https://calendar.example'],
    allowCredentials: true, // only if browser cookies are intended
});
// Mount app.fetch in your host HTTP server.
```

The policy and host CSRF/session implementation are application-owned, not provided by this snippet. Use the complete policy/deployment discussion in the [server README](https://github.com/pders01/kalendus/blob/main/server/README.md#host-authorization-boundary).

## Local demo and build

From the checkout, using Bun:

```sh
cd server
bun install
bun run build
DATABASE_URL=./data/demo.db bun run db:migrate
DATABASE_URL=./data/demo.db bun run db:seed # optional demo data, after migration
# All reads/writes intentionally public; local demo only:
KALENDUS_PUBLIC_DEMO=true DATABASE_URL=./data/demo.db bun run dev
```

Do not generate new database migrations merely to start the existing demo. `DATABASE_URL` accepts a filename, `file:` URL or `:memory:`; relative filenames resolve against caller cwd. Migration assets resolve relative to the module and are included in the server build. See the server guide for installed-package migration usage and shutdown.

## Data and range boundaries

The server retains its **legacy inclusive date-end/floating-time API**; it is not the root component's explicit temporal model. Dates must be real Gregorian dates in `1970..2100`; same-day timed writes require a strictly positive interval. Overnight writes need a later end date. Unknown write fields and client-supplied IDs are rejected, and PATCH validates the complete resulting record.

Range/summary queries accept inclusive `start`/`end` civil dates and are limited to 366 days and 5000 matching entries. Over-limit requests fail rather than silently truncating. Adapters preserve persistent IDs and independent nested date/time copies. See the server README for all validation/body/telemetry limits and status codes.

## Browser client

Prefer same-origin authenticated deployment. Every client fetch uses configured fetch/headers/credentials:

```ts
import { KalendusApiClient } from '@jpahd/kalendus-server/client';

const client = new KalendusApiClient({
    baseUrl: '',
    calendarId: 'your-calendar-id',
    credentials: 'same-origin',
});
const controller = new AbortController();
const entries = await client.fetchEvents('2026-03-01', '2026-03-31', controller.signal);
calendar.entries = entries; // inclusive API end, not visibleRange.end
// On teardown: controller.abort(); client.disconnect();
```

A host owns request-generation checks and loading/error UI when using the client directly. Subscribe with `onInvalidate` for changes and `onReconcile` to refetch the visible range on every initial or reconnected stream. Both return unsubscribe callbacks. `onSync` is reserved for compatibility with record-bearing streams and does not fire for default invalidations. Deploy the updated client before enabling the new server default.

Native EventSource cannot attach arbitrary bearer/CSRF headers. Header-authenticated apps must inject an authenticated reconnecting `streamFactory`, or disable sync; the client does not silently downgrade to unauthenticated SSE. Cross-origin cookie SSE needs deliberate credentials/CORS/cookie policy. Do not put secrets in stream URLs. See the authoritative [transport guidance](https://github.com/pders01/kalendus/blob/main/server/README.md#safe-browser-cookie-and-sse-deployment).

## Lit adapter and committed state

```ts
import { LitElement, html } from 'lit';
import '@jpahd/kalendus';
import { KalendusLitAdapter } from '@jpahd/kalendus-server/lit';

class RemoteCalendar extends LitElement {
    adapter = new KalendusLitAdapter(this, {
        baseUrl: '',
        calendarId: 'your-calendar-id',
        enableSync: true,
        credentials: 'same-origin',
    });
    render() {
        return html`<lms-calendar .entries=${this.adapter.entries}></lms-calendar>`;
    }
}
```

The adapter consumes **only public committed state**: `activeDate`, `viewMode`, `firstDayOfWeek`, `visibleRange` and `calendar-state-change`. The root emits an initial snapshot plus changed snapshots after rendering. The adapter does **not** derive windows from `switchdate.detail.direction` / `switchview.detail.view`, private `_viewState`, a hardcoded Monday or a fixed six-week grid.

It intersects the visible range with the server’s 1970–2100 date domain, then converts the exclusive end to the preceding **civil date** for the inclusive query. An SSE invalidation during a same-range read queues a trailing refresh without aborting the read. Reconnected SSE triggers full reconciliation. Explicit `refresh()` or `fetchRange(start, inclusiveEnd, true)` aborts and replaces a pending read so callers can recover from a stuck query. Navigation to another query range also aborts obsolete work. Superseded queries cannot publish late results or errors. Multiple calendars or non-queryable hosts should use an explicit `target`, `initialState` or `setState(snapshot)` as documented in the server README. Owners still bind `.entries` and render `loading`/`error` state.

See [Events Reference](./events.md#calendar-state-change) for the canonical snapshot payload.

## Operational limits and verification

SSE is best-effort **in-process invalidation**, not durable replay or cross-process pub/sub. After an HTTP calendar deletion commits, the server sends open streams one final payload-free invalidation and closes them. Otherwise connections expire after five minutes to rerun authorization; revocation is not immediate on an already open stream. Slow consumers are bounded/disconnected. Production edge quotas, reverse-proxy buffering/timeouts, external identity, CSRF, durable telemetry and multiprocess reconciliation remain host responsibilities.

```sh
cd server
bun run test
bun run typecheck
bun run lint
bun run build
bun run test:package
bun run test:browser # optional workspace browser integration
```

These are commands to run, not a claim that this documentation update executed them or verified a production deployment. Native integration has separate build/check and device gates in [expo-bridge/README.md](https://github.com/pders01/kalendus/blob/main/expo-bridge/README.md).
