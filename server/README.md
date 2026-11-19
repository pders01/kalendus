# Kalendus API server

Optional Hono/SQLite server and browser/Lit adapters. Use Bun as the package manager.

## Breaking stabilization defaults

- **`createApp({ db })` is private and fails closed:** every `/api/calendars` route returns 403 without a host `authorize` policy. `/health` remains public. This includes calendar creation, events, summaries, manifests, telemetry and SSE. Existing tests and demos must explicitly select `mode: 'public'`.
- **Public mode is intentionally unauthenticated**, not a substitute for private deployment. A configured policy still takes precedence over public mode. The standalone CLI is closed unless `KALENDUS_PUBLIC_DEMO=true` is explicitly set; it binds to `127.0.0.1` unless `HOST` is deliberately changed.
- No wildcard CORS default. Cross-origin browser requests require an exact `allowedOrigins` entry; credentialed CORS requires `allowCredentials: true`. Same-origin browser requests and nonbrowser clients still require authorization. CORS is not identity or authorization.
- Dates must be real Gregorian dates in 1970–2100; inclusive date ends and floating wall-clock times remain the legacy server API. Same-day timed intervals must end strictly after they start. An overnight interval needs a later end **date**. PATCH validates the resulting stored event, not just the submitted fields. Unknown write fields, including supplied IDs/foreign calendar IDs, are rejected. Invalid IDs/input are 400, nonexistent parents/resources 404, malformed JSON 400, oversized bodies 413, policy denial 403 and telemetry rate exhaustion 429.
- Mapped client entries retain persistent `id` and `calendarId` and copy nested date/time values. A non-null server `time` maps to `kind: 'timed'` with continuous, floating endpoints (including overnight and multi-day events). Null `time` maps to `kind: 'all-day'`; the legacy `00:00`–`23:59` time object is still supplied for adapter consumers, but the calendar ignores it for all-day entries.
- The Lit adapter consumes only the public `calendar-state-change` contract; old header details are not a data-loading API.

## Install / build / migration

```sh
cd server
bun install                        # if dependencies are not already installed by the workspace
bun run build                      # declarations, ESM, SQL and migration journal assets
DATABASE_URL=./data/private.db bun run db:migrate
DATABASE_URL=./data/private.db bun run db:seed # optional demo data; run migrations first
# Explicit LOCAL demo only (all reads/writes are public):
KALENDUS_PUBLIC_DEMO=true DATABASE_URL=./data/private.db bun run dev
```

`DATABASE_URL` is a filesystem filename (relative to caller cwd), absolute filename, `file:` URL, or `:memory:`. `createDb()`, runtime startup, seed, migrate and drizzle-kit share the same resolution. Missing parent directories are created. Migrations resolve relative to the module, **not cwd**. The built package contains `dist/migrations/*.sql` and `dist/migrations/meta/_journal.json`.

Embedded/installed usage:

```ts
import { createApp, createDb, migrateDb } from '@jpahd/kalendus-server';
const db = createDb(); // DATABASE_URL, default ./data/kalendus.db
migrateDb(db); // deliberate deployment step, idempotent
const { app } = createApp({ db, authorize });
// Mount app.fetch in your authenticated application / HTTP server.
// Shutdown: close HTTP listener/streams, then db.$client.close().
```

Installed migration CLI: `DATABASE_URL=/your/custom/path.db node node_modules/@jpahd/kalendus-server/dist/db/migrate.js`. `migrateDb` is also exported from `@jpahd/kalendus-server/migrate` without import-time DB side effects.

## Host authorization boundary

Kalendus deliberately does **not** ship an identity provider or invent an ownership table. The host must validate a real session/bearer token and resolve permissions from its own trusted storage on **every** request. Calendar IDs are not credentials. Service implementations are trusted internal APIs; do not expose them without the HTTP/host boundary.

```ts
import type { AuthorizationPolicy } from '@jpahd/kalendus-server';

const authorize: AuthorizationPolicy = async ({
    request,
    calendarId,
    eventId,
    resource,
    action,
}) => {
    const session = await hostSessions.authenticate(request); // validate signature/expiry/revocation
    if (!session) return false;
    if (resource === 'calendar' && action === 'create') {
        return session.permissions.includes('calendar:create');
    }
    if (!calendarId) return false;
    const access = await hostPermissions.forCalendar(session.userId, calendarId);
    if (!access) return false; // cross-user denial
    if (action === 'stream') return access.canRead && access.canStream;
    if (action === 'telemetry') return access.canRead && access.canSendTelemetry;
    if (action === 'read') return access.canRead;
    return access.canWrite; // create event, patch, delete; read-only users denied
};

const { app } = createApp({
    db,
    authorize,
    allowedOrigins: ['https://calendar.example'],
    allowCredentials: true, // only if using browser cookies
});
```

Policy context includes raw `request`, `calendarId`, `eventId` when applicable, `resource` (`calendar`, `event`, `manifest`, `stream`, `telemetry`) and action (`create`, `read`, `write`, `delete`, `stream`, `telemetry`). `create` distinguishes POST from PATCH (`write`); `resource` distinguishes calendar creation from event creation. Authenticate and check the requested calendar even for list/summary/manifest/stream reads. Return `true` only to grant. False denies; thrown exceptions never grant. A host can throw Hono `HTTPException(401)` to preserve an authentication status. If inspecting the request body in the policy, use `request.clone()` so the route can still parse it. Policy callbacks must not log tokens or event bodies.

### Safe browser cookie and SSE deployment

Prefer same-origin HTTPS behind a reverse proxy. Set a host-only session cookie such as `__Host-session=...; Secure; HttpOnly; Path=/; SameSite=Lax`, with no `Domain`. The host must enforce CSRF/origin protection for unsafe methods, including trusted cross-origin clients; allowing an origin is an explicit trust grant, not CSRF token validation. Pass short-lived CSRF tokens using `X-CSRF-Token` and validate in the host policy. Do not put bearer tokens/session secrets in query URLs (including stream URLs), referrers, or telemetry.

For cross-origin credentialed cookies, configure both exact allowed origin and `allowCredentials`, plus client `credentials: 'include'`; choose cookie SameSite/partition policy deliberately for the embedding environment. `SameSite=None` requires Secure; third-party cookie restrictions may still prevent access. Prefer a same-origin proxy rather than relying on unrestricted cross-site cookies. Terminate TLS and deploy appropriate CSP/connect-src at the browser host.

Native `EventSource` cannot send arbitrary Authorization/CSRF headers. Cookie-authenticated SSE uses its same-origin cookies or `withCredentials` for explicit cross-origin credentials. Bearer-token apps must inject a reconnecting `streamFactory` implemented with an authenticated fetch stream or another suitable SSE implementation; authenticate each connection. Do not silently fall back from header-auth fetch to unauthenticated native SSE. The client throws if header configuration is present and no custom stream transport is provided. `credentials: 'omit'` also requires a custom stream transport because native EventSource cannot omit same-origin cookies.

SSE is a best-effort, in-process invalidation channel, not durable replay. By default every committed mutation sends `event: invalidated` with `data: {}`. A stream grant lets the client observe **when the calendar changes**, not the mutation kind, event ID, or event details. Refetch through independently authorized REST routes. Deny stream access if even the timing of changes is sensitive.

For legacy consumers that need record-bearing messages, configure the optional `authorizeStreamDetails({ request, calendarId })` policy on `createApp`. It runs **after** ordinary `authorize` has allowed the stream. Return `true` only for principals allowed to read **every event in the calendar**; never grant it to a principal with event-scoped permissions. Missing or false grants keep the stream invalidation-only. The grant applies for the lifetime of the connection and is checked again on reconnect.

**Upgrade order:** deploy clients that use `onInvalidate` (or the updated Lit adapter) before switching servers. Older clients listening only for `created`, `updated`, or `deleted` will not refresh on default invalidations. Keep `onSync` only for callers with the explicit details grant.

Each initial/reconnected `connected` event causes full visible-range reconciliation in the adapter. Configure proxies not to buffer event streams and maintain an appropriate idle timeout. Connections end after five minutes so reconnection reruns the host policy; **revocation is not instantaneous for an existing stream**. A slow consumer is disconnected at 32 pending writes. Multiprocess deployments need external pub/sub or another reconciliation strategy; no cross-process replay guarantee is claimed.

## Browser client

```ts
import { KalendusApiClient } from '@jpahd/kalendus-server/client';
const client = new KalendusApiClient({
    baseUrl: '',
    calendarId,
    credentials: 'same-origin',
    // fetch: hostAuthorizedFetch,
    // headers: async () => ({ Authorization: `Bearer ${await freshToken()}` }),
    // streamFactory: (url, init) => hostAuthenticatedReconnectingStream(url, init),
});
const controller = new AbortController();
const entries = await client.fetchEvents('2026-03-01', '2026-03-31', controller.signal);
// API query ends are inclusive.
```

Every fetch path (queries, CRUD, manifest and telemetry) uses the supplied fetch, dynamic headers and credentials. `streamFactory(url, { withCredentials, credentials })` returns `{ addEventListener(type, listener), close() }`; it must deliver named events including `connected` after **every** successful connection, `invalidated` for payload-free changes, and compatibility `created`, `updated`, `deleted` events with JSON `MessageEvent.data` when present. It must implement reconnect/cleanup itself. `client.onInvalidate()` listens to both default and compatibility changes; `client.onReconcile()` signals a fresh connection; `client.onSync()` receives only record-bearing messages. All return unsubscribe callbacks. Dispose with `disconnect()`.

## Lit adapter and canonical state contract

The parent-owned root `src/contracts.ts` is authoritative. Server client types mirror it structurally so the separately packaged adapter does not import root source or generated private state:

```ts
// calendar-state-change; bubbles: true, composed: true
{
    activeDate: { year: 2026, month: 3, day: 15 },
    viewMode: 'day', // 'day' | 'week' | 'month' | 'year'
    firstDayOfWeek: 0, // 0..6
    range: { start: '2026-03-15', end: '2026-03-16' } // half-open ISO civil dates
}
```

The required root contract exposes public `activeDate`, `viewMode`, `firstDayOfWeek` and `visibleRange` and emits the initial snapshot after render plus every committed range change, whether initiated by header, today, date/count/year drill-down, keyboard, owner properties, week policy or responsive layout. The adapter reads only these public getters/events. It converts the exclusive `range.end` to the preceding **civil date** for legacy inclusive server queries. It never hardcodes Monday, six weeks, viewport size or private `_viewState`.

```ts
import { LitElement, html } from 'lit';
import { KalendusLitAdapter } from '@jpahd/kalendus-server/lit';

class CalendarPage extends LitElement {
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

Initialization works when an existing child is found in the host's `renderRoot`/`querySelector` during `hostUpdated`, or from its composed state event. Multiple calendars, closed/remote targets or slots should use `target: calendarElement` / `target: () => this.calendarRef ?? null`. Hosts without queryable DOM can supply `initialState` or call `adapter.setState(snapshot)` from the canonical event. Binding `.entries` remains the owner's responsibility.

Identical visible ranges dedupe and same-turn SSE bursts coalesce into one refresh; `refresh()` explicitly retries/refetches after a current error. `fetchRange(start, inclusiveEnd, force?)` remains a manual legacy-query escape hatch. A new request aborts its predecessor and a generation guard suppresses **both stale fulfillment and stale rejection**, even if custom transports ignore cancellation. Disconnect aborts work and releases listeners/streams; reattachment initializes again. `entries`, `loading`, `error` are public render state; the host decides loading/error UI. With bearer auth, pass both an authorized fetch setup and an authenticated streamFactory, or disable sync.

React/non-Lit hosts can use `KalendusApiClient` directly with their own effect cleanup/AbortController and generation check, and `onInvalidate` plus `onReconcile` for refreshes and missed-update recovery. The package does not add React as a dependency or provide a React hook.

## Limits and telemetry

- All HTTP request bodies are byte-counted before JSON parsing (including chunked/misleading Content-Length): default 32 KiB, configurable `maxBodyBytes` up to 16 MiB.
- Range/summary queries are limited to 366 inclusive civil dates and 5000 matching entries. Over-limit requests fail with 400 and an instruction to narrow the range; results are never silently truncated. Summary work is O(matching entries + queried days), independent of event lifetimes.
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

The optional browser suite uses the workspace's existing Lit, @open-wc/testing, Web Test Runner/Vite plugin and Playwright/Chromium tooling; none are loaded by nonbrowser tests. It imports the real parent calendar and exercises the public contract and real controls. It is not a standalone production dependency and does not add root package dependencies. Install the workspace's browser tools/binary before running it in CI.

**Integrated verification:** root release scripts/CI include server tests, typecheck, lint, build, package smoke and real-root browser adapter journeys. Public API docs use the fail-closed defaults; the reviewed root lockfile and packed consumers are integrated. The default gate includes Chromium, Firefox and Playwright WebKit; consult CI for the status of the exact candidate revision. Actual Safari, reverse-proxy, multiple-process and external identity/session behavior remain deployment verification, not claimed test passes.
