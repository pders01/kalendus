# Kalendus maintainability sweep

Run the sweep after the server boundary fixes have a reviewed baseline. The first pass is **read-only**. The goal is to find tests that do not protect their stated behavior, rules with multiple owners, and complexity that can be removed without losing correctness, reliability, performance, or features. Do not start from a line-count target or a rewrite proposal.

## Inventory and reviewers

Pin the baseline SHA and build an inventory from `git ls-files`. Assign each maintained path to one reviewer; use a second reader for seams between lanes. Run four reviewers in parallel. Each reads implementation, its tests, and the adjacent public contract, not just a diff.

| Lane                                        | Paths and focus                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A — Calendar model and algorithms           | `src/lib/`, `src/contracts.ts`, `src/entry-interactions.ts`, `test/unit/lib/`. Civil dates, canonical records, range/identity, layouts, localization, and edit proposals. Look for equivalent algorithms, independent copies of a rule, and tests that pass on the wrong result.                                             |
| B — Calendar component and browser behavior | `src/lms-calendar.ts`, `src/components/`, `src/themes/`, component tests and calendar E2E. Trace requested vs. committed state, ResizeObserver and focus lifecycle, mounted versus visible controls, slots, scroll, and render caches. Verify assertions against actual usable geometry.                                     |
| C — Server and bridges                      | `server/`, `expo-bridge/`, cross-package tests and integration docs. Follow each wire contract through validation, persistence, notifications, transport and adoption. Recheck the new server fixes; look for mixed ownership and silent failure at boundaries.                                                              |
| D — Delivery, examples and quality gates    | Stories, `.storybook/`, `docs/`, `scripts/`, root/CI configs, package maps, docs and packaging tests. Trace every gate to what it exercises: source or tarball, locked or minimum peers, manager or iframe, external or inline bridge, local or CI. Check that documented recipes and Playwright assertions prove the claim. |

Inventory generated catalogs, tracked bridge HTML, migration snapshots, binary assets, and evidence archives, but review their generators, provenance and consumers rather than manually judging derived copies. Keep archives and local prototypes intact. The plan is not approval to rewrite generated artifacts, release history, tags, or working notes.

After the first four reports, have a second reviewer check the proposed test removals or merges across layers. Map each proposed change to the behavior it covers, its strongest surviving assertion, and any unique fixture, engine or package boundary. Reproduce negative controls in scratch fixtures, never in the shared checkout. Hand off missing coverage separately from redundant coverage.

## What counts as a finding

- **Test with little or no signal:** an assertion passes with the behavior removed, the fixture never reaches the claimed branch, a mock implements the same logic as the code under test, or a timeout/messages hide a failure. State what regression it should catch. Use a negative control (temporarily revert/break the relevant behavior in an isolated fixture) before proposing to delete or replace a test. Keep distinct edge cases and browser-specific checks even when setup is similar.
- **Duplication that can drift:** identify the owners, compare concrete inputs and outputs, and name a case where they disagree or a foreseeable change requires synchronized edits. Preserve intentional differences: UI civil years and `24:00` vs. the server's narrower date/time domain, request vs. committed render, canonical records vs. visible segments, transport acceptance vs. calendar ingestion, and server vs. host authorization.
- **Unnecessary complexity:** trace the current data or lifecycle end to end, identify the extra state or layer, and name the invariant a simpler design would retain. Prefer one owner and fewer translations, not a generic abstraction that moves complexity. Mark unresolved races or performance hypotheses as unverified, not defects.

Use a common report format: **rank / category / file and line / observed behavior / evidence or negative control / exact contract to preserve / smallest safe change**. Record what you checked and what you excluded. The parent independently reproduces the strongest claims, rejects duplicates and false positives, then publishes a ranked fix list before another implementation pass.

## Gates for subsequent fixes

1. Pin a failing assertion or a reproducible before/after path. Keep logical units independent; split test repair from runtime changes when the distinction matters.
2. Retain the original public contract or document a deliberate compatible migration. For changed concurrency and state, cover cancellation, stale fulfillment/rejection, teardown and retries, not just a green happy path.
3. Check counts, bounds or timings on the same data and engine when making a performance claim. Preserve exact indexed behavior where it matters, native scrolling/focus, locale/catalog parity, and the 50,000-byte eager gzip budget. Don't add sleeps, loosen geometry tolerances arbitrarily, or delete expensive tests merely to pass CI.
4. Independently verify the built artifacts and packed consumers; include declared peer floors and the locked peers. Keep Ubuntu/Firefox verification external to Pi. A local Playwright WebKit result is not shipping Safari, and browser bridge tests are not native Expo verification.
