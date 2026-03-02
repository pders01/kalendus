---
layout: base.njk
title: 'API Server Guide'
order: 14
tags: docs
section: Reference
---

# API Server Guide

Kalendus ships with an optional Node.js server that exposes REST and Server-Sent Events (SSE) endpoints for calendars and events. It gives products a ready-made backend for persisting entries, broadcasting real-time updates, and collecting telemetry without building a bespoke API.

## Architecture

- **Framework**: [Hono](https://hono.dev/) with middleware for CORS, logging, and Zod-powered validation.
- **Database**: SQLite (via `better-sqlite3`) with [Drizzle ORM](https://orm.drizzle.team/) schema/migrations. Dates are decomposed into `startYear/startMonth/...` columns for efficient range queries.
- **Services**: `CalendarService`, `EventService`, `SyncService` (in-process event bus), and `TelemetryService` encapsulate business logic.
- **Adapters**:
    - `KalendusApiClient` – vanilla fetch + EventSource wrapper.
    - `KalendusLitAdapter` – Lit `ReactiveController` that binds `<lms-calendar>` navigation events to API calls.

## Running locally

```bash
# Install deps (once)
npm install

# From the server directory
cd server

# Generate database artifacts (stored in server/src/migrations)
npm run db:generate

# Apply migrations & seed demo data
npm run db:migrate
npm run db:seed

# Start the dev server with TSX hot reload
npm run dev
```

Environment variables:

| Variable       | Default              | Description      |
| -------------- | -------------------- | ---------------- |
| `PORT`         | `3000`               | HTTP port        |
| `DATABASE_URL` | `./data/kalendus.db` | SQLite file path |

## REST endpoints (all rooted at `/api/calendars`)

| Method & path                                             | Description                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------------- |
| `GET /:calendarId`                                        | Fetch calendar manifest (name, locale, theme tokens).                      |
| `POST /`                                                  | Create calendar.                                                           |
| `PATCH /:calendarId`                                      | Update calendar metadata.                                                  |
| `DELETE /:calendarId`                                     | Remove calendar (cascades events).                                         |
| `GET /:calendarId/events?start=YYYY-MM-DD&end=YYYY-MM-DD` | List events in range.                                                      |
| `GET /:calendarId/events/summary?start=...&end=...`       | Per-day counts for mobile/month badges.                                    |
| `POST /:calendarId/events`                                | Create event (JSON body validated by Zod).                                 |
| `PATCH /:calendarId/events/:eventId`                      | Update event.                                                              |
| `DELETE /:calendarId/events/:eventId`                     | Remove event.                                                              |
| `GET /:calendarId/manifest`                               | Lightweight manifest for client bootstrapping.                             |
| `POST /:calendarId/telemetry`                             | Fire-and-forget analytics events.                                          |
| `GET /:calendarId/stream`                                 | SSE channel broadcasting `{type, event}` payloads on create/update/delete. |

Additional utility route: `GET /health` returns `{ status: 'ok' }`.

## Real-time sync & telemetry

`SyncService` publishes `created`, `updated`, and `deleted` messages through `/stream`. `KalendusApiClient.connect()` opens the SSE channel and `onSync` subscribers receive structured payloads. Heartbeats fire every 30s to keep proxies alive.

Telemetry posts (e.g., navigation actions) are accepted asynchronously and intentionally return `202 Accepted` so clients can fire-and-forget.

## Using the client adapters

### Vanilla client

```ts
import { KalendusApiClient } from '@jpahd/kalendus-server/client';

const client = new KalendusApiClient({
    baseUrl: 'http://localhost:3000',
    calendarId: 'demo',
});

const entries = await client.fetchEvents('2026-03-01', '2026-03-31');
calendar.entries = entries; // bind to <lms-calendar>

client.onSync((msg) => {
    console.log('SSE update', msg);
});
client.connect();
```

### Lit ReactiveController

```ts
import { KalendusLitAdapter } from '@jpahd/kalendus-server/lit';

class RemoteCalendar extends LitElement {
    adapter = new KalendusLitAdapter(this, {
        baseUrl: 'http://localhost:3000',
        calendarId: 'demo',
        enableSync: true,
    });

    render() {
        return html` <lms-calendar .entries=${this.adapter.entries}></lms-calendar> `;
    }
}
```

The adapter listens to `switchdate`/`switchview`, fetches the relevant range, and optionally emits telemetry.

## Testing the server

```bash
cd server
npm test                # 54 tests
npm run lint            # oxlint
npm run format:check
```

Contract tests keep API shapes aligned with the Zod schemas in `server/src/http/middleware/validator.ts` and the TypeScript types consumed by the adapters.

For production deployments, front a process manager (e.g., PM2) or container runtime, persist the SQLite file (or swap in another Drizzle-supported driver), and secure the `/telemetry` endpoint as needed.
