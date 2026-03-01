---
layout: base.njk
title: 'Events Reference'
order: 5
tags: docs
section: Usage
---

# Custom Events Reference

All custom DOM events fired by `<lms-calendar>` and its child components. Every event uses `bubbles: true` and `composed: true`, so you can listen on the `<lms-calendar>` host element from any framework.

```js
const calendar = document.querySelector('lms-calendar');
calendar.addEventListener('switchview', (e) => {
    console.log('View changed to', e.detail.view);
});
```

---

## `switchdate`

Fired when the user navigates forward or backward via header buttons.

| Property | Value                                 |
| -------- | ------------------------------------- |
| Source   | `<lms-calendar-header>`               |
| Bubbles  | `true`                                |
| Composed | `true`                                |
| Detail   | `{ direction: 'next' \| 'previous' }` |

```js
calendar.addEventListener('switchdate', (e) => {
    analytics.track('calendar_navigate', { direction: e.detail.direction });
});
```

---

## `switchview`

Fired when the user switches between view modes (day, week, month, year) via header buttons.

| Property | Value                                            |
| -------- | ------------------------------------------------ |
| Source   | `<lms-calendar-header>`                          |
| Bubbles  | `true`                                           |
| Composed | `true`                                           |
| Detail   | `{ view: 'day' \| 'week' \| 'month' \| 'year' }` |

```js
calendar.addEventListener('switchview', (e) => {
    console.log('Now showing', e.detail.view);
});
```

---

## `jumptoday`

Fired when the user clicks the "Today" button in the header.

| Property | Value                    |
| -------- | ------------------------ |
| Source   | `<lms-calendar-header>`  |
| Bubbles  | `true`                   |
| Composed | `true`                   |
| Detail   | `{ date: CalendarDate }` |

```js
calendar.addEventListener('jumptoday', (e) => {
    myRouter.navigate(`/schedule/${e.detail.date.year}/${e.detail.date.month}`);
});
```

---

## `expand`

Fired when the user clicks a day label, day cell, week number, or month label to drill into a more detailed view. The `detail` payload varies by source:

| Source                        | `detail.drillTarget`     | Notes                                   |
| ----------------------------- | ------------------------ | --------------------------------------- |
| Month view (day click)        | _not present_            | Only `{ date }` is provided             |
| Week view (day label click)   | _not present_            | Only `{ date }` is provided             |
| Year view (day click)         | `this.drillTarget` value | Reflects the `yearDrillTarget` property |
| Year view (week click)        | `'week'`                 | Always drills to week view              |
| Year view (month label click) | `'month'`                | Always drills to month view             |

| Property | Value                                                                |
| -------- | -------------------------------------------------------------------- |
| Source   | `<lms-calendar-month>`, `<lms-calendar-week>`, `<lms-calendar-year>` |
| Bubbles  | `true`                                                               |
| Composed | `true`                                                               |
| Detail   | `{ date: CalendarDate, drillTarget?: 'day' \| 'week' \| 'month' }`   |

```js
calendar.addEventListener('expand', (e) => {
    const { date, drillTarget } = e.detail;
    if (drillTarget === 'day') {
        router.push(`/schedule/${date.year}/${date.month}/${date.day}`);
    }
});
```

> **Tip:** Check for the presence of `drillTarget` to distinguish between month/week clicks (no target) and year-view clicks (always has a target).

---

## `open-menu`

Fired when a calendar entry is activated (click or keyboard). The built-in `<lms-menu>` overlay listens for this internally.

| Property | Value                                                                                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source   | `<lms-calendar-entry>`, forwarded by `<lms-calendar-month>`                                                                                                |
| Bubbles  | `true`                                                                                                                                                     |
| Composed | `true`                                                                                                                                                     |
| Detail   | `{ heading: string, content: string, time: CalendarTimeInterval \| undefined, displayTime: string, date: CalendarDate \| undefined, anchorRect: DOMRect }` |

You can intercept this event to show your own detail panel:

```js
calendar.addEventListener('open-menu', (e) => {
    e.stopPropagation(); // prevent built-in menu
    showCustomPanel(e.detail);
});
```

> **Note:** In month view, `<lms-calendar-month>` re-dispatches this event to ensure it crosses the shadow boundary correctly.

---

## `menu-close`

Fired when the built-in menu overlay is dismissed.

| Property | Value        |
| -------- | ------------ |
| Source   | `<lms-menu>` |
| Bubbles  | `true`       |
| Composed | `true`       |
| Detail   | _none_       |

```js
calendar.addEventListener('menu-close', () => {
    hideCustomSidebar();
});
```

---

## `peek-navigate`

Fired in condensed week view when the user clicks the peek (arrow) buttons to slide the visible day window.

| Property | Value                                                     |
| -------- | --------------------------------------------------------- |
| Source   | `<lms-calendar-week>`                                     |
| Bubbles  | `true`                                                    |
| Composed | `true`                                                    |
| Detail   | `{ date: CalendarDate, direction: 'next' \| 'previous' }` |

```js
calendar.addEventListener('peek-navigate', (e) => {
    console.log('Peeked', e.detail.direction, 'to', e.detail.date);
});
```

> **Note:** This event only fires when the week view is in condensed mode (fewer columns than 7, typically on mobile). The `date` in the payload is the new target date.

---

## `clear-other-selections` (internal)

Fired when an entry receives focus, instructing the parent to clear all other selected entries. **This is an internal coordination event** — you generally should not need to listen for it.

| Property | Value                          |
| -------- | ------------------------------ |
| Source   | `<lms-calendar-entry>`         |
| Bubbles  | `true`                         |
| Composed | `true`                         |
| Detail   | `{ exceptEntry: HTMLElement }` |

The parent `<lms-calendar>` listens for this and calls `clearSelection()` on all other entry elements. If you're building custom multi-selection UI, you may need to handle this.
