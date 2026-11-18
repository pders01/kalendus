---
layout: base.njk
title: 'Events Reference'
order: 5
tags: docs
section: Usage
---

# Custom Events Reference

Listen on the `<lms-calendar>` host. The events below bubble and are composed, so they cross shadow boundaries. Use **committed state** for synchronization and **cancelable requests** to replace defaults; legacy action notifications remain for compatibility and analytics.

## `calendar-state-change`

Emitted by the root after its initial render and whenever the committed snapshot changes. This includes owner assignments to `activeDate` / `viewMode`, header/today navigation, date/count/year drill-down, keyboard navigation, week-start policy and responsive visible-window changes. Identical snapshots are not emitted again. It is not cancelable.

```ts
type CalendarState = {
    activeDate: { year: number; month: number; day: number };
    viewMode: 'day' | 'week' | 'month' | 'year';
    firstDayOfWeek: number; // 0 Sunday ... 6 Saturday; default 1 Monday
    range: { start: string; end: string }; // ISO YYYY-MM-DD, [start, end)
};
```

`range.start` is included and `range.end` is excluded. These are civil dates, **not UTC timestamps**. Month grid ranges include spillover cells; the optional Agenda stays in Month mode and covers one day. Week ranges reflect the actual visible columns, including condensed weeks; Day and Year cover one day and the active calendar year, respectively. The read-only public `visibleRange` getter exposes the same shape.

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

Install the listener before connection to capture the initial event. If attaching later, initialize from the public getters after `await calendar.updateComplete`. Do not calculate fetch ranges from old `detail.direction` / `detail.view` notifications. The server adapter converts the exclusive end to its legacy inclusive query end; see [API Server Guide](./api-server.md).

## Cancelable entry requests

Both requests carry `CalendarEntryRequest` from the public package types:

```ts
type CalendarEntryRequest = {
    entry: CalendarEntry; // canonical original record, not a displayed day slice
    eventId?: string; // caller ID when supplied, otherwise a fallback identity
};
```

The canonical entry retains original multi-day endpoints, `id`, `kind`, `timeZone` and caller metadata. Supply stable caller IDs when identity must survive refetching/reordering. Do not serialize the clicked segment as the whole event.

### `entry-activate`

Dispatched by the root **before** opening the default detail inspector for an activated entry (click, Enter or Space). It has `cancelable: true`.

```js
calendar.addEventListener('entry-activate', (event) => {
    event.preventDefault(); // suppress the built-in inspector
    showCustomPanel(event.detail.entry, event.detail.eventId);
});
```

### `export-entry`

Dispatched by `<lms-menu>` **before** ICS generation/download. It has `cancelable: true`.

```js
calendar.addEventListener('export-entry', (event) => {
    event.preventDefault(); // suppress the browser download
    shareFromApplication(event.detail.entry, event.detail.eventId);
});
```

Call `preventDefault()` **synchronously**, before awaiting your application work. `stopPropagation()` does not cancel a default action. Without cancellation the inspector/download remains enabled.

The default ICS exporter uses the original endpoints, an identity-derived UID when available, exclusive next-day DATE ends for all-day spans, floating values without a zone, and UTC instants for explicit IANA zones. Invalid/nonexistent/ambiguous zoned endpoints are rejected. A zero-duration timed event exports DTSTART without equal DTEND. External calendar-client import and native sharing still require separate verification.

### `export-error`

Non-cancelable error notification from `<lms-menu>` with `{ error, entry, eventId }` when generation/download setup fails. The inspector also shows an error message. `entry` may be undefined if no exportable record was supplied. Cancellation of `export-entry` is not an error.

## Entry diagnostics

### `entries-invalid`

Non-cancelable notification after an `entries` update rejects individual records:

```ts
{
    issues: Array<{ index: number; entry: unknown; reason: string }>;
}
```

Reasons include invalid civil dates/times, reversed intervals, invalid kind/ID/zone, nonexistent or ambiguous zoned endpoints, duplicate IDs and repeated source objects. The **first valid** record wins for a duplicate caller ID/source object. Valid records continue to render. Treat entry bodies as potentially sensitive; do not log them indiscriminately.

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

`localeReady` settles even after a failed import/fallback. `retryLocale()` retries the requested locale without requiring a different property value. See [Localization](./library-usage.md#localization).

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

Month/Week `expand` requests omit `drillTarget` and default to day. Year day cells use `yearDrillTarget`; year week numbers request `week`, and month labels request `month`. Keyboard/date navigation can change committed state without a legacy header notification.

`open-menu` remains a cancelable compatibility request; root handling honors `preventDefault()` before opening the inspector. Prefer `entry-activate` for new code: it offers the canonical record without depending on display labels/geometry. Do not rely on stopping propagation or internal component listeners.

## Inspector and internal coordination

The built-in inspector is **non-modal**: a top-layer popover where supported, with a body-portal/dialog fallback. It does not trap Tab or make the background inert. Escape, close and light dismissal close it; focus is restored when appropriate without stealing focus from another control selected during light dismissal. This describes implemented behavior, not Safari, device or screen-reader verification.

`clear-other-selections` is internal entry-focus coordination with `{ exceptEntry: HTMLElement }`. Application integrations should not use it as a selection API.
