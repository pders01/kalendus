---
layout: base.njk
title: 'API Server Guide'
order: 14
tags: docs
section: Reference
---

# API Server Guide

The optional `@jpahd/kalendus-server` package provides a Hono/SQLite REST API, in-process SSE invalidation and browser/Lit adapters. **The server is not published on npm**: use the checkout workspace or a locally built tarball. The integration examples build the calendar and the server from the same checkout. Only the root calendar library is available on npm as [`@jpahd/kalendus@0.12.0`](https://www.npmjs.com/package/@jpahd/kalendus/v/0.12.0). The [server README](https://github.com/pders01/kalendus/blob/main/server/README.md) is the reference for API and deployment details.

## Breaking security defaults

- **Private-deny by default:** API requests that reach authorization under `/api/calendars` receive 403 unless the host injects an `authorize` policy and it grants access. This includes creation, event reads/writes, summary, manifest, telemetry and SSE. Public `/health`, CORS preflight and malformed/oversized requests have separate handling.
- The host authenticates real sessions/tokens and checks trusted per-calendar permissions on **every** request. Calendar IDs are not credentials. A configured policy takes precedence over public mode; policy errors never grant access. Permissions are declared on matched routes; `HEAD` uses the matching `GET` permission. Event list, page and summary permissions expose data across the **whole calendar**; the stock routes do not filter by event ACL. Keep calendar deletion (which cascades) separate from editing events.
- SSE sends payload-free invalidations by default. Full event details require a separate `authorizeStreamDetails` grant for readers with access to every event in the calendar. Stream permission never bypasses REST authorization.
- `mode: 'public'` is an explicit unauthenticated demo choice, not a private deployment shortcut. The CLI stays closed unless `KALENDUS_PUBLIC_DEMO=true`; it defaults to `127.0.0.1` but honors `HOST`, so set the bind explicitly for demos.
- There is no wildcard CORS default. Cross-origin browser access requires exact `allowedOrigins`; credentialed CORS also requires `allowCredentials: true`. CORS is not authentication, authorization or CSRF validation. Same-origin/nonbrowser clients still require authorization.

For a private deployment, embed `createApp({ db, authorize })` and mount `app.fetch` in your host HTTP server. Identity, permissions and CSRF/session implementation are host-owned. See the [whole-calendar policy example and deployment guidance](https://github.com/pders01/kalendus/blob/main/server/README.md#host-authorization-boundary).

## Local demo and build

Run the [workspace install, build and demo commands](https://github.com/pders01/kalendus/blob/main/server/README.md#install--build--migration) from the checkout root. They use Bun as package manager, Node.js and native `better-sqlite3` for migrate/seed/start, a **fresh disposable SQLite file** and an explicit **`HOST=127.0.0.1`**. The demo permits unauthenticated reads and writes; don't use real data, expose the port beyond loopback or forward it through a tunnel. Separate migrate, seed and start processes cannot share a `:memory:` database.

Note the printed seed ID and date, then follow the [Lit starter](./integration-guide.md#lit-adapter) for local tarball installation, proxy configuration and mounting. Run the existing migrations; do not generate new migrations merely to start the demo. The server README also covers using migrations from an installed tarball and closing the HTTP listener and database.

## Data and range boundaries

The server uses **inclusive civil-date queries and floating wall-clock times**. Dates must be real Gregorian dates in `1970..2100`; same-day timed writes require a strictly positive interval. Overnight writes need a later end date. For an all-day event omit `time` on POST; on PATCH send `time: null` to clear existing times. Omitted PATCH fields are unchanged, and PATCH validates the complete resulting record. Unknown write fields such as `kind`, `timeZone`, IDs and timestamps are rejected, so don't send the root `CalendarEntry` or a read DTO verbatim. See [routes, DTOs and HTTP statuses](https://github.com/pders01/kalendus/blob/main/server/README.md#http-routes-and-event-dtos).

Event queries accept inclusive `start`/`end` civil dates and are limited to 366 days. The unpaged detail route rejects more than 5000 matches instead of truncating. For denser ranges use the `/events/page` route or `client.fetchRawEventPage()` with `nextCursor` as the next request's `after`. `fetchRawEvents()` returns wire DTOs; `fetchEvents()` maps them to display records with persistent IDs and independent nested date/time copies. Summary returns counts by civil date and has a separate 50,000-match limit.

## Browser client

Use the [direct-client integration](./integration-guide.md#vanilla-client) for non-Lit hosts. The host owns request deduplication, abort/generation checks and loading/error UI. Configured `fetch`, `headers` and `credentials` apply to **REST**; the stream is a separate transport. Choose one of:

- **REST only:** don't call `client.connect()` or enable the Lit adapter's `enableSync`. Refetch after writes, on return to the page or on a suitable manual/periodic refresh.
- **Cookie-authenticated SSE:** prefer same-origin HTTPS. Cross-origin cookie SSE needs `credentials: 'include'` plus exact configured CORS origins, credential allowance and a compatible cookie policy. With a custom `fetch`, supply `streamFactory` or set `allowNativeEventSourceWithCustomFetch: true` only after confirming native cookies can safely authorize `/stream` without relying on the REST wrapper. Explicit `headers` or `credentials: 'omit'` always require a factory for SSE.
- **Bearer-authenticated SSE:** inject an authenticated reconnecting `streamFactory`, or use REST only. `connect()` rejects a custom `fetch` without a factory or the cookie-only opt-in; native EventSource cannot send authorization headers added by a fetch wrapper. Do not put secrets in stream URLs. See the [server transport guidance](https://github.com/pders01/kalendus/blob/main/server/README.md#safe-browser-cookie-and-sse-deployment).

Use `onInvalidate` for committed event CRUD and parent deletion, and `onReconcile` after the server's `connected` on initial or successful reconnected streams. Calendar metadata PATCH does not invalidate event reads. Both subscriptions return unsubscribe callbacks. `onSync` is only for compatibility mutation messages (delete carries `{ id }`); it does not fire for default invalidations. Deploy clients that understand invalidations before switching the server default.

Read `client.streamState` and use `client.onStreamStateChange()` for transport status, separately from REST. `connected` requires the server's named event, not transport `open`. Synchronous startup failures throw and report `status: 'error'` with `phase: 'startup'`; transport errors report `phase: 'transport'` without refetching or clearing records. This is not a heartbeat monitor. At logout or account changes, disconnect the stream, abort old requests, and clear protected UI without waiting for SSE.

## Lit adapter and committed state

The [mounted Lit starter](./integration-guide.md#lit-adapter) shows registration, property binding and loading/error UI. The adapter consumes the public `calendar-state-change` snapshot and can initialize from public getters (`activeDate`, `viewMode`, `firstDayOfWeek`, `visibleRange`). Fetch against the committed `range`, not requested navigation. The root emits initial and changed snapshots after rendering. The adapter does **not** derive windows from `switchdate.detail.direction` / `switchview.detail.view`, private `_viewState`, a hardcoded Monday or a fixed six-week grid.

It intersects the visible range with the server’s 1970–2100 date domain, then converts the exclusive end to the preceding **civil date** for the inclusive query. An SSE invalidation during a same-range read queues a trailing refresh without aborting the read. A successful stream connection or reconnection triggers reconciliation. Explicit `refresh()` or `fetchRange(start, inclusiveEnd, true)` aborts and replaces a pending read so callers can recover from a stuck query. Navigation to another query range also aborts obsolete work. Superseded queries cannot publish late results or errors. Multiple calendars or non-queryable hosts should use an explicit `target`, `initialState` or `setState(snapshot)` as documented in the server README. Owners still bind `.entries` and render REST `loading`/`error` state. Read `adapter.streamState` separately to show live-update availability.

See [Events Reference](./events.md#calendar-state-change) for the canonical snapshot payload.

## Operational limits and verification

SSE is best-effort **in-process invalidation**, not durable replay or cross-process pub/sub. Committed HTTP writes and writes through the services returned by `createApp()` publish the same notifications. Calendar deletion sends open streams one final payload-free invalidation and closes them; the refetch can report a missing calendar. Apps with a shared injected bus are scoped to the same database object by default; use an explicit shared scope only for handles to one logical store. A stream `HEAD` checks authorization and calendar existence but does not open a subscription. Active connections expire after five minutes so reconnect reruns authorization; revocation is not immediate on an already open stream. Slow consumers are disconnected. Production edge quotas, reverse-proxy buffering/timeouts, external identity, CSRF, durable telemetry and multiprocess reconciliation remain host responsibilities.

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
