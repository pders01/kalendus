---
layout: base.njk
title: 'Events Reference'
order: 5
tags: docs
section: Usage
---

# Custom Events Reference

This reference describes the public API in **0.12.0**. See [Release Notes](./release-notes.md#0120) for changes since 0.11.0.

Listen on the `<lms-calendar>` host. The events below bubble and are composed, so they cross shadow boundaries. Use **committed state** for synchronization and **cancelable requests** to replace defaults; legacy action notifications remain for compatibility and analytics.

## `calendar-state-change`

Emitted by the root after its initial render and whenever the committed snapshot changes. This includes owner assignments to `activeDate` / `viewMode`, header/today navigation, date and Year drill-down, keyboard navigation, week-start policy and responsive visible-window changes. Identical snapshots are not emitted again. It is not cancelable.

```ts
type CalendarState = {
    activeDate: { year: number; month: number; day: number };
    viewMode: 'day' | 'week' | 'month' | 'year';
    firstDayOfWeek: number; // 0 Sunday ... 6 Saturday; default 1 Monday
    range: { start: string; end: string }; // [start, end), end may be 10000-01-01
};
```

`range.start` is included and `range.end` is excluded. These are Gregorian civil dates, **not UTC timestamps**. Month grid ranges include spillover cells; the optional Agenda stays in Month mode and covers one day. Week ranges reflect the actual visible columns, including condensed weeks; Day and Year cover one day and the active calendar year, respectively. The range is clipped to years 1–9999, with `10000-01-01` allowed only as the exclusive end. For example, Day on December 31, 9999 reports `[9999-12-31, 10000-01-01)`. Do not require four digits for both endpoints or compare the sentinel by plain string order.

`visibleRange` exposes the last committed range after first render. Assignments to `activeDate` or `viewMode` express the next requested state; read the event detail for an atomic snapshot even when another listener requests navigation. Opening or closing a Day/Week timed count or a Week all-day total does not change the committed view, date, or range and does not emit a state change by itself.

```js
calendar.addEventListener('calendar-state-change', (event) => {
    const { activeDate, viewMode, range } = event.detail;
    persistNavigation({ activeDate, viewMode });
    // Your loader must dedupe ranges and abort/ignore stale requests.
    loadVisibleEntries(range.start, range.end); // loader accepts an exclusive end
});
calendar.activeDate = { year: 2026, month: 3, day: 15 };
calendar.viewMode = 'week';
```

Install the listener before connection to capture the initial event. If attaching later, initialize from the public getters after `await calendar.updateComplete`. Do not calculate fetch ranges from old `detail.direction` / `detail.view` notifications. The source/local-tarball server adapter clips to the server's civil-date domain and converts the exclusive end to its legacy inclusive query end; see [API Server Guide](./api-server.md).

## Cancelable entry requests

Both requests carry `CalendarEntryRequest` from the public package types:

```ts
type CalendarEntryRequest = {
    entry: CalendarEntry; // canonical original record, not a displayed day slice
    eventId?: string; // caller ID when supplied, otherwise a fallback identity
};
```

For rendered entries, `entry` is the canonical source object: it retains the original multi-day endpoints, `id`, `kind`, `timeZone`, and caller metadata. Supply stable caller IDs when identity must survive refetching. Do not serialize the clicked segment as the whole event. Owner-driven `openMenu()` exports are described below.

### `entry-activate`

Dispatched by the root when a rendered entry is opened by click, Enter, or Space. It has `cancelable: true`.

- **Ordinary cards and list rows:** emit the cancelable legacy `open-menu` request. If that is not canceled, the root emits `entry-activate` in a microtask. The default inspector opens only if activation is not canceled.
- **Accordion Agenda:** opening a closed row emits `entry-activate` directly, without `open-menu`. The default action reveals inline details. Closing the row does not emit activation.
- **Owner calls to `openMenu(details)`:** open the inspector directly and do not emit either activation request.

```js
calendar.addEventListener('entry-activate', (event) => {
    event.preventDefault(); // suppress the inspector or inline Agenda disclosure
    showCustomPanel(event.detail.entry, event.detail.eventId);
});
```

### `export-entry`

Dispatched **before** default ICS generation/download: from `<lms-menu>` for inspector exports, or from the **Download .ics** button for accordion Agenda exports. It has `cancelable: true` on both paths; listen on the calendar host rather than depending on the source element.

An inspector opened through `openMenu(details)` exports the supplied `entry` if present. If only a `date` was provided, the inspector constructs a single-day record from `date`, `heading`, `content`, and optional `time`. Without either an entry or date there is no exportable record.

```js
calendar.addEventListener('export-entry', (event) => {
    event.preventDefault(); // suppress the browser download
    shareFromApplication(event.detail.entry, event.detail.eventId);
});
```

Call `preventDefault()` **synchronously**, before awaiting your application work. `stopPropagation()` does not cancel a default action. Without cancellation the built-in disclosure or download proceeds.

The default ICS exporter uses the original endpoints: all-day spans have exclusive next-day DATE ends, unzoned times stay floating, and explicit IANA-zoned times export as UTC. Invalid, nonexistent, or ambiguous zoned endpoints are rejected. Zero-duration timed events export `DTSTART` without an equal `DTEND`.

**Export behavior in 0.12.0:** stable application IDs produce stable UIDs. Without an ID, the same source object gets the same generated UID within the same runtime, not across refetches that create new objects or across reloads. If a positive-duration end falls outside the ICS year range (1–9999), the exporter uses `DURATION` instead of `DTEND`. A zoned start that converts outside those years cannot be exported and reports `export-error`. External calendar-client import and native sharing still require separate verification.

### `export-error`

Non-cancelable `{ error, entry, eventId }` notification when generation or download setup fails. It comes from the inspector or the inline Agenda download button, and that surface shows the error. `entry` may be undefined if an owner opened the inspector without an exportable record. Canceling `export-entry` does not emit `export-error`.

## Entry change requests (opt-in)

Since **0.12.0**, import `enableEntryInteractions` from `@jpahd/kalendus/entry-interactions` to opt in per calendar. The main entry point and standalone IIFE do not enable editing. On desktop, drag the body of an explicit timed card to move it or drag its marked top or bottom edge to resize a real endpoint. Week supports edits across rendered day columns. A valid drop emits one typed, bubbling and composed `entry-change-request`. Escape, a drop outside the grid, an invalid or unchanged schedule, or replacing the source entries during the drag emits nothing.

```ts
import '@jpahd/kalendus';
import { enableEntryInteractions } from '@jpahd/kalendus/entry-interactions';

const calendar = document.querySelector('lms-calendar')!;
const edits = enableEntryInteractions(calendar, {
    snapMinutes: 15,
    canChange: (entry) => Boolean(entry.id),
});

calendar.addEventListener('entry-change-request', ({ detail }) => {
    const { entry, proposed } = detail;
    // This example adopts the request locally. For persistence, let your app
    // authorize, save, and reconcile the result before replacing entries.
    calendar.entries = calendar.entries.map((current) => (current === entry ? proposed : current));
});

// From an app-owned button with the current canonical selected entry:
// edits.requestChange(selectedEntry, { kind: 'resize', edge: 'end' }, 15);
// Call edits.dispose() when removing the integration.
```

`EntryChangeRequest` includes:

- **`entry` and `eventId`:** The original record and its identity (a caller ID when provided). The pointer request can also report the view's fallback ID; use caller IDs for persisted updates.
- **`operation`:** `{ kind: 'move' }` or `{ kind: 'resize', edge: 'start' | 'end' }`.
- **`proposed`:** A replacement record with the original identity and metadata. A move preserves the wall-clock duration; a resize changes only the selected endpoint. The time zone is retained, and invalid or ambiguous zoned endpoints are rejected.
- **`source`:** `'pointer'` or `'api'`.

There is **no default mutation**. The request is not cancelable; ignoring it leaves the event where it was. The optional synchronous `canChange(entry, operation)` lets an app disable pointer affordances and reject requests for a record or operation. It is not backend authorization. Set `snapMinutes` to an integer from 1–1440 (default 15). Snapping rounds the pointer's within-column displacement, not the event's original time. Crossing Week columns adds the whole-day displacement separately.

Provide keyboard-accessible controls such as native buttons or a scheduling form; call `requestChange(entry, operation, deltaMinutes)` without pointer snapping. Pass the exact source object still present by reference in `calendar.entries` and accepted by ingestion. The calendar must be connected, the record must have explicit `kind: 'timed'`, and the delta must be a signed safe integer in civil minutes. Disconnected calendars, copied or rejected records (including rejected duplicates), policy denials, zero or invalid deltas, invalid endpoints, and resizes that collapse or reverse an interval return `false` without dispatch. A `true` return means a proposal was dispatched, not that it was accepted or persisted. Calling `enableEntryInteractions()` again on the same calendar before disposal throws; call `dispose()` when removing the integration.

Pointer gestures apply only to Day/Week timed cards; touch dragging, Month, all-day bars, timed markers, and density groups do not get drag handles. Ordinary activation and native touch scrolling are unchanged.

## Entry diagnostics

### `entries-invalid`

Non-cancelable, bubbling and composed notification after the root renders an `entries` update that failed validation:

```ts
{
    issues: Array<{ index: number; entry: unknown; reason: string }>;
}
```

Reasons include invalid civil dates/times, reversed intervals, invalid kind/ID/zone, nonexistent or ambiguous zoned endpoints, duplicate IDs, and repeated source objects. The **first valid** record wins for a duplicate caller ID or source object. The whole assigned array is validated, not just entries in view. Missing or non-string headings are invalid; an empty string is allowed. A non-array input produces one issue with index `-1` and the assigned value as `entry`, except `null` (the Lit attribute reset value). For record issues, `index` is the original zero-based position. Valid records continue to render within the visible range. Treat the raw values in `entry` as potentially sensitive; do not log them indiscriminately.

### `entries-error`

Non-cancelable notification when visible expansion exceeds the segment budget:

```ts
{
    code: 'segment-budget';
    message: string;
    limit: number; // currently 100_000 expanded segments
    range: {
        start: string;
        end: string;
    }
}
```

The calendar clears its derived entry display instead of partially rendering an arbitrary subset. Supply fewer entries or choose a smaller view/range. The default alert can be replaced with light-DOM content in `<slot name="entries-error">` (assign `slot="entries-error"` on your content). Expansion is bounded to the visible range, not an event's full lifetime.

## Locale lifecycle

### `locale-ready`

Root notification after the current locale's load **or fallback** and root render settle, including built-in English and unsupported-tag fallback:

```ts
{
    locale: string;
    fallback: boolean;
    catalogLocale: string;
}
```

`locale` is the normalized requested tag; `catalogLocale` is the resolved UI catalog (possibly `en`). It does not certify that every phrase is translated or that all descendant layout has settled. Pending loads hide header/main content; failed loads restore usable English fallback rather than hiding the calendar indefinitely.

### `locale-error`

Root notification with `{ locale: string, error: unknown }` when a current catalog chunk fails. A `locale-ready` fallback notification follows. Superseded loads do not announce stale readiness/errors.

```js
calendar.addEventListener('locale-error', () => showTranslationRetry());
calendar.locale = 'de-AT'; // German catalog, regional date/number preferences retained
await calendar.localeReady; // current load/fallback and root render, not just an event listener
// When the user requests a retry:
await calendar.retryLocale();
```

`localeReady` settles even after a failed import/fallback. `retryLocale()` reruns catalog resolution without requiring a different property value. If the browser cached a failed module request, reload the page. See [Localization](./library-usage.md#localization).

## Legacy action notifications

These describe an input action, **not the committed state or fetch range**. Keep existing analytics listeners if useful, but synchronize from `calendar-state-change`. Unless noted otherwise they are not cancelable.

| Event           | Source                     | Detail                                                                                         |
| --------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `switchdate`    | Header previous/next       | `{ direction: 'next' \| 'previous' }`                                                          |
| `switchview`    | Header view buttons        | `{ view: 'day' \| 'week' \| 'month' \| 'year' }`                                               |
| `jumptoday`     | Header Today               | `{ date: CalendarDate }`                                                                       |
| `expand`        | Month/Week/Year drill-down | `{ date: CalendarDate, drillTarget?: 'day' \| 'week' \| 'month' }`                             |
| `peek-navigate` | Condensed week arrows      | `{ date: CalendarDate, direction: 'next' \| 'previous' }`                                      |
| `open-menu`     | Entry activation           | `{ heading, content, time?, displayTime, displayDate?, date?, anchorRect?, entry?, eventId? }` |
| `menu-close`    | Inspector dismissal        | No detail                                                                                      |

Month/Week `expand` requests omit `drillTarget`: when handled as drill-down they target Day, but Month's selection policy can keep the date open in Month instead. Year date cells use `yearDrillTarget`; year week numbers request `week`, and month labels request `month`. Keyboard/date navigation can change committed state without a legacy header notification.

`open-menu` remains a cancelable compatibility request for ordinary cards and list rows. Canceling it synchronously also prevents the later `entry-activate` for that action. Prefer `entry-activate` for new code: it covers the accordion path as well and offers the canonical record without depending on display labels or geometry. Do not rely on stopping propagation or internal component listeners.

## Inspector and internal coordination

The built-in inspector is **non-modal**: a top-layer popover where supported, with a body-portal/dialog fallback. It does not trap Tab or make the background inert. Escape, close and light dismissal close it; focus is restored when appropriate without stealing focus from another control selected during light dismissal. This describes implemented behavior, not Safari, device or screen-reader verification.

`clear-other-selections` is internal entry-focus coordination with `{ exceptEntry: HTMLElement }`. Application integrations should not use it as a selection API.
