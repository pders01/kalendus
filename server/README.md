# Kalendus API server

Optional Hono/SQLite server and browser/Lit adapters. **`@jpahd/kalendus-server` is not published on npm.** Use the `server/` workspace in this checkout or install a tarball built from it. The synchronized calendar example uses the unreleased `0.12.0` root build from the same checkout; for the published root `0.11.0`, see the [stable source and docs](https://github.com/pders01/kalendus/tree/v0.11.0).

## Breaking stabilization defaults

- **`createApp({ db })` is private and fails closed:** without a host `authorize` policy, requests that reach authorization for `/api/calendars` are denied with 403. This includes calendar creation, events, summaries, manifests, telemetry and SSE. CORS preflight, ID/body checks and public `/health` have separate handling. Tests and demos that need unauthenticated API access must explicitly select `mode: 'public'`.
- **Public mode is intentionally unauthenticated**, not a substitute for private deployment. A configured policy still takes precedence over public mode. The standalone CLI is closed unless `KALENDUS_PUBLIC_DEMO=true` is explicitly set; it binds to `127.0.0.1` unless `HOST` is deliberately changed.
- No wildcard CORS default. Cross-origin browser requests require an exact `allowedOrigins` entry; credentialed CORS requires `allowCredentials: true`. Same-origin browser requests and nonbrowser clients still require authorization. CORS is not identity or authorization.
- The Lit adapter consumes only public calendar state; old header details are not a data-loading API.

## Install / build / migration

Use Bun for the workspace install and scripts, and **Node.js** (e.g. Node 24 as in CI) to run the server, migration and seed scripts. `better-sqlite3` needs a native binary for that Node version and platform. If Bun reports that its install script was blocked, review it and run `bun pm trust better-sqlite3` in the consuming project if you trust it. Platforms without a matching prebuild need the native build prerequisites for `better-sqlite3`.

Run this from the **checkout root**. It creates a fresh, disposable file database, seeds it, and binds the unauthenticated demo explicitly to loopback. Do not reuse a database with real data, expose the server on a network, or tunnel the demo port.

```sh
bun install --frozen-lockfile
bun run --cwd server build
```

```sh
(
    set -eu
    demo_dir=$(mktemp -d "${TMPDIR:-/tmp}/kalendus-server-demo.XXXXXX")
    export DATABASE_URL="$demo_dir/demo.db"
    bun run --cwd server db:migrate
    TZ=UTC bun run --cwd server db:seed
    echo "Seed date (UTC): $(node -p 'new Date().toISOString().slice(0, 10)')"
    HOST=127.0.0.1 PORT=3000 KALENDUS_ALLOWED_ORIGINS='' KALENDUS_PUBLIC_DEMO=true \
        bun run --cwd server start
)
```

Record the ID from `Seeded calendar …` and the seed date. The first two events are on the seed day, and more follow over the next several days. Keep the server running and follow the [Lit starter](../docs/integration-guide.md#lit-adapter) to view those events. If port 3000 is in use, change both `PORT` and the starter's proxy target; do not change the bind address. Stop the demo with Ctrl+C. The temporary directory is not removed automatically.

`DATABASE_URL` accepts a filename (relative to caller cwd or absolute), a path-only `file:` URL, or `:memory:`. File URL queries and fragments are rejected rather than silently ignored; options such as `?mode=ro` are not supported. A memory database is scoped to its connection, so the separate migrate, seed and start processes above need the same **file**. Missing parent directories are created. Migrations resolve relative to the module, **not cwd**. The built package contains `dist/migrations/*.sql` and `dist/migrations/meta/_journal.json`.

### Install the local packages into another project

From the checkout root, after the workspace install and server build above, write the tarballs to a fresh directory. `--ignore-scripts` packs the artifacts you just built without running release lifecycle scripts.

```sh
(
    set -eu
    ARTIFACTS=$(mktemp -d "${TMPDIR:-/tmp}/kalendus-packages.XXXXXX")
    bun run build:all
    bun pm pack --ignore-scripts --filename "$ARTIFACTS/kalendus.tgz"
    (cd server && bun pm pack --ignore-scripts --filename "$ARTIFACTS/kalendus-server.tgz")
    printf 'Tarball directory: %s\n' "$ARTIFACTS"
)
```

In the consuming project, set `ARTIFACTS` to that absolute directory and run:

```sh
bun add "$ARTIFACTS/kalendus.tgz" "$ARTIFACTS/kalendus-server.tgz" 'lit@^3.0.0' 'luxon@^3.4.4'
```

The root ESM package uses Lit and Luxon peers; TypeScript consumers also need `bun add -d @types/luxon`. The server's public subpaths `@jpahd/kalendus-server/client` and `@jpahd/kalendus-server/lit` are for browsers; the root server and `/migrate` imports are for Node, not your browser bundle. A Node-only host installing the server tarball alone does not need the calendar package or its peers.

Embedded/installed usage:

```ts
import { createApp, createDb, migrateDb } from '@jpahd/kalendus-server';
const db = createDb(); // set DATABASE_URL to your intended private database
migrateDb(db); // deliberate deployment step, idempotent
// Supply the host-owned authorize policy described below.
const { app } = createApp({ db, authorize });
// Mount app.fetch in your authenticated application / HTTP server.
// Shutdown: close HTTP listener/streams, then db.$client.close().
```

Installed migration CLI: `DATABASE_URL=/your/custom/path.db node node_modules/@jpahd/kalendus-server/dist/db/migrate.js`. `migrateDb` is also exported from `@jpahd/kalendus-server/migrate` without import-time DB side effects.

### Repairing old event rows

The original SQLite schema did not enforce date ordering. Summaries now skip reversed legacy date intervals so they cannot subtract from valid counts; this does not rewrite the database or hide those rows from all range queries. Back up the database and identify affected rows before repairing them:

```sql
SELECT calendar_id, id, start_year, start_month, start_day, end_year, end_month, end_day
FROM events
WHERE (start_year, start_month, start_day) > (end_year, end_month, end_day);
```

Use a trusted source to determine the intended interval; don't automatically swap endpoints. Repair each row with an authorized event `PATCH` supplying the corrected `date` (and `time` if needed), or delete it if it should not exist. Current writes still reject invalid intervals.

Old rows may also have only some clock columns populated. Reads retain the legacy projection, but PATCH does not treat that projection as stored data. Repair such a row by supplying the complete intended `time` interval, or `time: null` if it is all-day; a heading-only PATCH cannot silently leave a partial clock in storage.

## Host authorization boundary

Kalendus deliberately does **not** ship an identity provider or invent an ownership table. The host must validate a real session/bearer token and resolve permissions from its own trusted storage on **every** request. Calendar IDs are not credentials. Service implementations are trusted internal APIs; do not expose them without the HTTP/host boundary.

```ts
import type { AuthorizationPolicy } from '@jpahd/kalendus-server';

// hostSessions and hostPermissions are application-owned, trusted services.
const authorize: AuthorizationPolicy = async ({ request, calendarId, resource, action }) => {
    const session = await hostSessions.authenticate(request); // verify expiry/revocation as well as identity
    if (!session) return false;
    if (resource === 'calendar' && action === 'create') {
        return session.permissions.includes('calendar:create');
    }
    if (!calendarId) return false;
    const access = await hostPermissions.forCalendar(session.userId, calendarId);
    if (!access) return false;

    if (resource === 'event') {
        if (action === 'read') return access.canReadAllEvents;
        if (action === 'create' || action === 'write') return access.canEditEvents;
        if (action === 'delete') return access.canDeleteEvents;
    }
    if (resource === 'calendar') {
        if (action === 'read') return access.canReadCalendar;
        if (action === 'write') return access.canEditCalendar;
        if (action === 'delete') return access.canDeleteCalendar; // cascades to every event
    }
    if (resource === 'manifest' && action === 'read') return access.canReadCalendar;
    if (resource === 'stream' && action === 'stream') {
        return access.canReadAllEvents && access.canStream;
    }
    if (resource === 'telemetry' && action === 'telemetry') return access.canSendTelemetry;
    return false;
};

const { app } = createApp({
    db,
    authorize,
    allowedOrigins: ['https://calendar.example'],
    allowCredentials: true, // only if using browser cookies
});
```

This is a **whole-calendar ACL**, not row-level filtering. Granting the event list, page, or summary route exposes matching entries or aggregate counts across the entire calendar. The sample's event write permissions likewise apply to all events there; editing an event does not grant calendar metadata updates or parent deletion. For event-scoped access, deny whole-calendar reads/summaries and implement filtered host routes (or separate calendars). If allowing scoped event PATCH/DELETE, check the trusted `(calendarId, eventId)` permission in the host policy. Do not grant stream details to scoped readers, and consider whether they should see change timing at all.

Policy context includes raw `request`, matched `calendarId`, `eventId` for individual event writes, `resource` (`calendar`, `event`, `manifest`, `stream`, `telemetry`) and action (`create`, `read`, `write`, `delete`, `stream`, `telemetry`). Each route declares its policy: event lists, pages and summaries are calendar-wide event reads. `HEAD` uses the matching `GET` permission (the raw request method is still `HEAD`), and stream `HEAD` never opens a subscription. `create` distinguishes POST from PATCH (`write`); `resource` distinguishes calendar creation from event creation. Authenticate and check the requested calendar even for range/page/summary/manifest/stream reads. Return `true` only to grant. False denies; thrown exceptions never grant. A host can throw Hono `HTTPException(401)` to preserve an authentication status. If inspecting the request body in the policy, use `request.clone()` so the route can still parse it. Policy callbacks must not log tokens or event bodies.

### Safe browser cookie and SSE deployment

Prefer same-origin HTTPS behind a reverse proxy. Set a host-only session cookie such as `__Host-session=...; Secure; HttpOnly; Path=/; SameSite=Lax`, with no `Domain`. The host must enforce CSRF/origin protection for unsafe methods, including trusted cross-origin clients; allowing an origin is an explicit trust grant, not CSRF token validation. Pass short-lived CSRF tokens using `X-CSRF-Token` and validate in the host policy. Do not put bearer tokens/session secrets in query URLs (including stream URLs), referrers, or telemetry.

For cross-origin credentialed cookies, configure both exact allowed origin and `allowCredentials`, plus client `credentials: 'include'`; choose cookie SameSite/partition policy deliberately for the embedding environment. `SameSite=None` requires Secure; third-party cookie restrictions may still prevent access. Prefer a same-origin proxy rather than relying on unrestricted cross-site cookies. Terminate TLS and deploy appropriate CSP/connect-src at the browser host.

Native `EventSource` cannot send arbitrary Authorization/CSRF headers. Without a custom fetch, cookie-authenticated SSE can use native same-origin cookies or `withCredentials` for explicit cross-origin credentials. **For bearer auth, supply an authenticated, reconnecting `streamFactory`, or use REST only** (don't call `connect()`; leave the Lit adapter's `enableSync` off). The factory must obtain fresh credentials for each connection; the client doesn't pass its REST `fetch` or `headers` to it.

If you supply a custom `fetch`, `connect()` requires `streamFactory` unless you explicitly set `allowNativeEventSourceWithCustomFetch: true`. Only opt in after confirming `/stream` is authorized by native cookies and doesn't rely on any behavior of the REST wrapper, such as auth headers, URL rewriting or a different cookie policy. The opt-in **does not override** the restriction on `headers` or `credentials: 'omit'`. This check happens at `connect()`; REST-only callers can use any supported `fetch`, `headers` or credentials without configuring a stream.

SSE is a best-effort, in-process invalidation channel, not durable replay. By default committed **event** creates, updates and deletes send `event: invalidated` with `data: {}`. The trusted services returned by `createApp()` publish the same notifications as HTTP writes. Raw database writes and independently constructed services do not automatically publish. For mutations with notifications, let the service own the transaction; the notifier cannot determine when a caller-owned SQLite transaction commits. A calendar metadata PATCH does not send an invalidation; refresh metadata separately. A stream grant lets the client observe **when the calendar changes**, not the event mutation kind, event ID, or event details. Refetch through independently authorized REST routes. Deny stream access if even the timing of changes is sensitive.

If injecting an `EventBus` into `createApp()`, apps using the same bus and `db` object share event and removal channels; unrelated database objects are isolated even when their calendar IDs match. If several handles refer to the same logical store, pass the same `eventBusScope` object with the shared bus. Never share that scope across independent stores. Use the app's returned, scoped `eventBus` or `syncService` to observe that app's notifications.

For legacy consumers that need record-bearing messages, configure the optional `authorizeStreamDetails({ request, calendarId })` policy on `createApp`. It runs **after** ordinary `authorize` has allowed the stream. Return `true` only for principals allowed to read **every event in the calendar**; never grant it to a principal with event-scoped permissions. Missing or false grants keep the stream invalidation-only. The grant applies for the lifetime of the connection and is checked again on reconnect. Compatibility `created`/`updated` messages carry the event DTO; `deleted` carries only `{ id }`.

Deleting the parent through `createApp` sends open streams one final `event: invalidated` / `data: {}` after the database commits the cascade, then closes the streams. This applies even to streams with the details grant. Delivery is still best effort.

**Upgrade order:** deploy clients that use `onInvalidate` (or the updated Lit adapter) before switching servers. Older clients listening only for `created`, `updated`, or `deleted` will not refresh on default invalidations. Keep `onSync` only for callers with the explicit details grant.

Each server `connected` event causes visible-range reconciliation in the adapter, both on initial connection and **successful** reconnection. Neither transport `open` nor `error` triggers reconciliation. A failed reconnect does not clear existing entries or report a REST error. The server sends a `heartbeat` roughly every 30 seconds while writable; `streamState` reports transport events, not a heartbeat timeout or proof that access is still current. Revalidate through REST on window focus or a suitable periodic/manual refresh. Close streams, abort pending reads and clear/remove protected UI on logout or account changes; do not wait for SSE to report revocation.

Configure proxies not to buffer event streams and maintain an appropriate idle timeout. Connections end after five minutes so reconnection reruns the host policy; **revocation is not instantaneous for an existing stream**. A slow consumer is disconnected at 32 pending writes. Multiprocess deployments need external pub/sub or another reconciliation strategy; no cross-process replay guarantee is claimed.

## HTTP routes and event DTOs

Routes below are relative to `/api/calendars`. `GET /health` is public liveness, not an authorization or stream-health check.

| Method and path                                                   | Successful response                                                          |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `POST /`, `PATCH /:calendarId`, `GET /:calendarId`                | Calendar DTO; POST is 201, PATCH/GET are 200                                 |
| `DELETE /:calendarId`, `DELETE /:calendarId/events/:eventId`      | 200 `{ "ok": true }`; calendar deletion cascades                             |
| `GET /:calendarId/events?start=YYYY-MM-DD&end=YYYY-MM-DD`         | 200 array of overlapping event DTOs, subject to the unpaged result cap       |
| `GET /:calendarId/events/page?start=YYYY-MM-DD&end=YYYY-MM-DD`    | 200 `{ entries, nextCursor }`; optional `limit` and exclusive `after` cursor |
| `GET /:calendarId/events/summary?start=YYYY-MM-DD&end=YYYY-MM-DD` | 200 object mapping dates to nonzero counts, not an entry array               |
| `POST /:calendarId/events`, `PATCH /:calendarId/events/:eventId`  | Event DTO; POST is 201, PATCH is 200                                         |
| `GET /:calendarId/manifest`                                       | 200 theme/locale metadata, not entries                                       |
| `GET /:calendarId/stream`                                         | 200 SSE after stream authorization                                           |
| `POST /:calendarId/telemetry`                                     | 202 `{ "ok": true }`; quota exhaustion is 429 with `Retry-After`             |

Invalid IDs, fields, query windows or JSON are 400; oversized bodies are 413. Route schema and merged-state validation failures share `{ error, details }`, with messages grouped by field in `details`. An ordinary policy denial is 403, or the host can explicitly return an authentication status such as 401 via `HTTPException`. A missing calendar (after authorization) or missing event on PATCH/DELETE is 404. CORS middleware can answer preflight with 204; that does not authorize the requested operation.

- `POST` an event with `heading` and `date: { start, end }` (each endpoint is `{ year, month, day }`). Optional `content`, `color` and `time` are non-null when sent; **omit `time`** for all-day. A timed record supplies `time: { start, end }` using `{ hour, minute }` endpoints.
- `PATCH` accepts those fields as a partial update. Omitted fields remain unchanged; send **`"time": null`** to make an event all-day or `"content": null` to clear its description. If sending a `date` or non-null `time` interval, supply both endpoints. The server validates the full merged record.
- The server accepts real Gregorian dates in **1970–2100**, clock hours **0–23** (not `24:00`), minutes 0–59, and six-digit `#RRGGBB` colors. Same-day timed intervals must be positive; overnight events need a later end date. There is no `kind` or `timeZone` field on the wire. App-specific zoned times need an explicit conversion policy rather than dropping a zone silently.
- Read/CRUD responses contain server-generated `id`, `calendarId`, `createdAt` and `updatedAt` (ISO timestamp strings), plus `heading`, `date`, `color` and nullable `time`/`content`. Do not post a read DTO or a root `CalendarEntry` verbatim: unknown write fields, including IDs, timestamps, `kind`, `timeZone` and render-only flags, are rejected. Event query ends are inclusive; the root's committed `visibleRange.end` is exclusive.

## Browser client

Use the [`KalendusApiClient` recipe](../docs/integration-guide.md#vanilla-client) for non-Lit hosts or the [mounted Lit starter](../docs/integration-guide.md#lit-adapter). `fetchRawEvents()` and event create/update methods return wire DTOs. `fetchEvents()` maps them for the root: it retains `id`/`calendarId`, copies nested date/time values, and maps non-null time to explicit `kind: 'timed'` with continuous floating endpoints. Null time maps to `kind: 'all-day'` (the mapped legacy `00:00`–`23:59` time object is ignored by the root). Refetch the range after a successful write when sync is off; even with sync enabled, handle write failure explicitly. Client reads throw on non-2xx; result shapes are typed, not comprehensively validated at runtime. Validate at the host boundary when a custom or untrusted backend is involved.

For a dense range, `client.fetchRawEventPage(start, end, { limit, after }, signal)` returns one page of wire DTOs ordered by event ID. Pass the preceding result's `nextCursor` as `after` with the same range until `nextCursor` is `null`. Pagination is not a database snapshot across calls. The page size bounds returned rows, not the number of SQLite rows examined. Do not silently load all pages into a calendar with thousands of entries; choose a narrower query or render pages as needed.

For imported rows that encoded all-day events with a non-null `00:00`–`23:59` sentinel, pass `isLegacyAllDay: ({ id }) => knownImportedAllDayIds.has(id)` to the API client or Lit adapter. It is consulted only for that exact time pair and applies only to mapped `fetchEvents()` results. An identical time pair on a new timed record is valid and cannot be distinguished by times alone. Use known provenance rather than opting in for every row. To repair known legacy rows permanently, send an authorized event `PATCH` with `{ "time": null }` for those IDs. Raw reads and wire writes are unchanged.

Every REST fetch path (queries, CRUD, manifest and telemetry) uses the supplied fetch, dynamic headers and credentials. `streamFactory(url, { withCredentials, credentials })` returns a fresh `{ addEventListener(type, listener), close() }`, with events delivered after listener setup. It must deliver `connected` after **every** successful server connection, `error` when the transport fails (including rejected reconnects), `invalidated` for payload-free changes, and compatibility `created`, `updated`, `deleted` events with JSON `MessageEvent.data` when present. It must implement reconnect/cleanup itself. `client.onInvalidate()` listens to both default and compatibility changes; `client.onReconcile()` signals a fresh connection; `client.onSync()` receives only compatibility messages.

Read `client.streamState` and subscribe to transitions with `client.onStreamStateChange(state => …)`. The status is `disconnected` (including before `connect()`), `connecting`, `connected` (after the named event), or `error`. For `error`, `phase` is `startup` (synchronous `connect()` failure, which also throws; fix the configuration or retry `connect()`) or `transport` (an `error` event; the transport owns retry). To restart a stopped transport explicitly, call `disconnect()` before `connect()`. Stream errors expose a safe `error` message, not raw transport events or exceptions. All subscriptions return unsubscribe callbacks. Listeners aren't awaited: handle promise rejections inside your refresh callback. Unsubscribe and call `disconnect()` on teardown.

## Lit adapter and canonical state contract

The root [`src/contracts.ts`](../src/contracts.ts) defines the public snapshot. Server client types mirror it structurally so the separately packaged adapter does not import root source or generated private state:

```ts
// calendar-state-change; bubbles: true, composed: true
{
    activeDate: { year: 2026, month: 3, day: 15 },
    viewMode: 'day', // 'day' | 'week' | 'month' | 'year'
    firstDayOfWeek: 0, // 0..6
    range: { start: '2026-03-15', end: '2026-03-16' } // half-open ISO civil dates
}
```

The root emits the initial snapshot after render and then reports committed state changes, whether initiated by header, today, date/count/year drill-down, keyboard, owner properties, week policy or responsive layout. The adapter uses the snapshot or initializes from public `activeDate`, `viewMode`, `firstDayOfWeek` and `visibleRange`; the snapshot is the atomic record of committed state. It intersects the range with the server's civil-date domain (`1970-01-01` through `2100-12-31`) before converting the exclusive end to a legacy inclusive end. Month spillover remains visible; a wholly out-of-domain view clears entries, cancels obsolete work and makes no event query. The adapter never hardcodes Monday, six weeks, viewport size or private `_viewState`.

See the [checkout-backed Lit starter](../docs/integration-guide.md#lit-adapter) for registration, mounting, loading/error UI and retry.

Initialization works when a newly acquired child is found in the host's `renderRoot`/`querySelector`, or from its composed state event. Once the target emits a valid committed snapshot, the adapter no longer derives its range from getters. A manual query is not canceled by an unrelated render; a new committed range or target can supersede it. Removing a target stops its pending reads and releases its range. Multiple calendars, closed/remote targets or slots should use `target: calendarElement` / `target: () => this.calendarRef ?? null`. Hosts without queryable DOM can supply `initialState` or call `adapter.setState(snapshot)` from the canonical event. Binding `.entries` remains the owner's responsibility.

Identical queries dedupe and same-turn SSE bursts coalesce. An invalidation during a same-range query marks it dirty without aborting it: its result can still render, then one trailing refresh runs. Explicit `refresh()` and `fetchRange(start, inclusiveEnd, true)` abort and replace a pending read, even for the same range, so callers can recover from a stuck query. Navigation to another query range also aborts obsolete work. A generation guard suppresses **both stale fulfillment and stale rejection**, even if a custom transport ignores cancellation. Manual `fetchRange` queries are not clipped; server validation still applies.

Event query `404`/`410` clears entries for a missing/gone calendar; `401`/`403` also clears entries because access is no longer confirmed. Transient failures (such as network errors or `503`) retain the last successful entries. HTTP errors expose `KalendusHttpError.status`; the adapter surfaces errors in `error` rather than treating a failed query as an empty success. Disconnect aborts work and releases listeners/streams; reattachment initializes again. `entries`, `loading`, and `error` are REST render state; use `adapter.streamState` separately for live-update status. The adapter schedules a host update on stream transitions while mounted.

React/non-Lit hosts can use `KalendusApiClient` directly with their own effect cleanup/AbortController and generation check, and `onInvalidate` plus `onReconcile` for refreshes and missed-update recovery. The package does not add React as a dependency or provide a React hook.

## Limits and telemetry

- All HTTP request bodies are byte-counted before JSON parsing (including chunked/misleading Content-Length): default 32 KiB, configurable `maxBodyBytes` up to 16 MiB.
- Range, page and summary queries are limited to 366 inclusive civil dates. The unpaged detail route fails with 400 above 5000 matches rather than truncating; use the paged route when narrowing the range is not enough. Pages default to 250 entries and allow up to 500. Summary counts use date bounds instead of materializing event DTOs and have their own 50,000-match budget.
- Event headings 500 chars, content 5000; calendar names 255; theme tokens 64 entries, key 128/value 512 chars. Foreign IDs are validated as 1–128 ASCII letters/digits/underscore/hyphen.
- Telemetry metadata is bounded JSON: 32 top-level keys, 4096 UTF-8 bytes, 256 visited nodes, maximum depth 8. Route and body calendar IDs must agree, and the calendar must exist.
- `telemetry: { capacity: 1000, ttlMs: 3600000, sink }` configures inspection retention (zero disables storage). Reads/writes lazily prune expired records; returned snapshots cannot mutate stored records. Sink delivery is best effort: at most eight in flight, drop instead of queue, isolate synchronous/asynchronous failures. The host owns delivery timeouts, redaction, observability and durable storage. Never send PII/secrets.
- Default telemetry admission: 60 attempts/calendar/minute plus a shared 600/minute guard. `telemetryRate: { limit, windowMs, capacity }` changes per-calendar admission (global guard is 10× limit). Key retention is capped at 1024; new keys are denied at capacity instead of evicting active limits, and expired keys are lazily removed. Untrusted forwarded-IP headers are not used for identity. Production edge/per-principal quotas and stream connection limits remain the host's responsibility.
- Expected HTTP exceptions preserve status/headers. Mutation commits do not roll back or become 500 because an SSE subscriber throws/rejects. Subscribers receive independent snapshots; notification delivery is not guaranteed.

## Verification / integration

```sh
cd server
bun run test           # complete Node/Mocha suite, exits normally; no --exit
bun run typecheck
bun run lint
bun run build
bun run test:package   # tarball extraction, custom-path migration and exports smoke
bun run test:browser   # optional workspace browser integration
```

The package smoke test checks the packed server API and native client types in an isolated production install with strict TypeScript settings. It allows only specific known Drizzle declaration diagnostics (matched by file, code, and message); it does not certify an unfiltered strict dependency graph.

The optional browser suite uses the workspace's existing Lit, @open-wc/testing, Web Test Runner/Vite plugin and Playwright/Chromium tooling; none are loaded by nonbrowser tests. It imports the real parent calendar and exercises the public contract and real controls. It is not a standalone production dependency and does not add root package dependencies. Install the workspace's browser tools/binary before running it in CI.

**Integrated verification:** root release scripts/CI include server tests, typecheck, lint, build, package smoke and real-root browser adapter journeys. Public API docs use the fail-closed defaults; the reviewed root lockfile and packed consumers are integrated. The default gate includes Chromium, Firefox and Playwright WebKit; consult CI for the status of the exact candidate revision. Actual Safari, reverse-proxy, multiple-process and external identity/session behavior remain deployment verification, not claimed test passes.
