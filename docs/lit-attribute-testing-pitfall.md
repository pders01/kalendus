---
layout: base.njk
title: 'Lit Attribute Testing Pitfall'
order: 14
tags: docs
section: Reference
---

# Lit Custom Attribute Names: A Testing Pitfall

## The Bug

Component tests for `Entry.ts` hung for 60 seconds with **zero browser logs**, then
timed out. Binary search across 20 tests isolated it to a single assertion:

```ts
// THIS HANGS
const el: Entry = await fixture(html`<lms-calendar-entry density="compact"></lms-calendar-entry>`);
const timeElement = el.shadowRoot?.querySelector('.time');
expect(timeElement).to.not.exist; // ← never completes
```

Changing the assertion target to `el` instead of `timeElement` made it pass.
Changing `density="compact"` to `.density=${'compact'}` also made it pass.

## Root Cause

`Entry.ts` declares a custom HTML attribute name:

```ts
@property({ type: String, reflect: true, attribute: 'data-density' })
density: 'compact' | 'standard' | 'full' = 'standard';
```

The `attribute: 'data-density'` option tells Lit to observe the `data-density` HTML
attribute — **not** `density`. Writing `density="compact"` in a template sets an
unrecognized HTML attribute that Lit ignores. The `density` _property_ stays at its
default: `'standard'`.

## The Chain Reaction

1. `density` property remains `'standard'` (not `'compact'`).
2. `_shouldShowTime()` returns `true` for standard density.
3. `_renderTime()` calls `_displayInterval(undefined)` (no `.time` prop set).
4. `_displayInterval` returns Lit's `nothing` sentinel when `time` is undefined.
5. **`nothing` is a `Symbol` — truthy in JavaScript** — so the ternary
   `timeString ? html\`<span class="time">…</span>\` : nothing` takes the truthy
   branch.
6. An empty `<span class="time"></span>` is rendered in the shadow DOM.
7. `querySelector('.time')` returns an `HTMLSpanElement`, not `null`.
8. `expect(anHTMLSpanElement).to.not.exist` (or `.to.be.null`) **fails**.
9. Chai/loupe tries to serialize the DOM element for the error message. In the
   web-test-runner + Vite plugin + Playwright context, this serialization hangs
   the browser page indefinitely.
10. web-test-runner never receives test results → 60 s `testsFinishTimeout` expires.
11. Zero browser logs appear because the test runner only collects logs from
    completed (not timed-out) test pages.

## Why It Was Hard to Debug

| Symptom                                   | Misleading Interpretation                   |
| ----------------------------------------- | ------------------------------------------- |
| Zero browser logs                         | "Module isn't loading"                      |
| 60 s timeout                              | "Circular import / infinite loop"           |
| Removing the import type line didn't help | "Not an import issue"                       |
| Minimal fixture with same attr passed     | "Must be a concurrency / interaction issue" |
| Vite serves valid JS (verified via curl)  | "Not a transform issue"                     |
| esbuild plugin shows errors; Vite doesn't | "Vite swallows errors" (true but unrelated) |

The real issue — a wrong HTML attribute name — was invisible because:

- The component renders without errors (just with default density).
- The test _looks_ correct at a glance (`density="compact"` reads naturally).
- The failure mode is a timeout, not an assertion error, because Chai's DOM
  serialization hangs in this environment.

## The Fix

Use **Lit property bindings** (`.property=${value}`) instead of HTML attributes for
any `@property` that declares a custom `attribute:` name:

```diff
- <lms-calendar-entry density="compact">
+ <lms-calendar-entry .density=${'compact'}>
```

Or use the actual HTML attribute name:

```diff
- <lms-calendar-entry density="compact">
+ <lms-calendar-entry data-density="compact">
```

## Rules of Thumb

1. **Check `attribute:` in `@property` declarations.** If a property uses
   `attribute: 'something-else'`, the HTML attribute is `something-else`, not the
   JS property name.

2. **Prefer `.property` bindings in test fixtures.** They always work regardless
   of the attribute mapping and bypass string-to-type coercion.

3. **Be wary of Lit's `nothing` sentinel.** `nothing` is a `Symbol` and is
   **truthy**. Code like `return value ? html\`…\` : nothing`will take the truthy
branch when`value`is`nothing`. If you return `nothing`from a helper, check
for it explicitly:`return value !== nothing && value ? … : nothing`.

4. **Chai + DOM elements in web-test-runner can hang.** When an assertion fails on
   a DOM element, Chai's serializer (loupe) may hang trying to inspect it. If a
   component test times out with zero logs, suspect a failing assertion on a DOM
   element — not a missing module or infinite loop.

## Related Component Properties

These `Entry.ts` properties all use custom attribute names:

| Property      | HTML Attribute      | Gotcha                             |
| ------------- | ------------------- | ---------------------------------- |
| `density`     | `data-density`      | `density="…"` silently ignored     |
| `displayMode` | `data-display-mode` | `displayMode="…"` silently ignored |
| `floatText`   | `data-float-text`   | `floatText` silently ignored       |

Always use `.density`, `.displayMode`, `.floatText` property bindings in templates
and tests for these.
