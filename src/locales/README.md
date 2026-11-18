# Translation source of truth

**Edit `catalogs/<locale>.json`, not `src/generated/locales/*.ts` or `xliff/*.xlf`.**
`source.json` contains the English source text for every stable message ID. Existing
hashed IDs and all legacy `getMessages()` fields are retained. `source.ts` is an
extraction-only Lit adapter; it is never imported by the calendar at runtime. Runtime
locale choice remains per calendar instance, not Lit's global active locale.

## Normal workflow

```sh
# After editing English sources/translations, regenerate only locale artifacts:
bun scripts/check-locales.mjs --write
# Validate completeness, placeholders, freshness, original translations and roundtrip:
bun scripts/check-locales.mjs
```

The check creates a disposable fixture under the repository (for package resolution),
runs the installed `lit-localize extract` and `lit-localize build` twice via `bunx`,
checks every regenerated dictionary against canonical JSON, and compares generated
module/XLIFF bytes between cycles. The fixture is removed in `finally`. It never
runs destructive extraction against the working catalogs.

`lit-localize.json` deliberately limits extraction to `source.ts`. The legacy
`bun run i18n:extract` / `bun run i18n:build` commands can still process these complete
messages, but they operate on derivative files and may change their formatting.
After using them, use the canonical generator above to restore repository formatting;
never copy generated output over canonical dictionaries. The JSON catalog check is
the required gate. The package-script/docs owner should point contributor-facing
commands at this workflow.

## Preservation evidence

`preserved/sha256.json` identifies **54 original artifacts**. Their exact original
bytes are stored under `preserved/<original-path>.txt`; the `.txt` suffix keeps
historical TypeScript out of compilation and published declarations. Do not edit
these snapshots.

- Every one of the **810 original runtime dictionary values** is unchanged.
- **16 additional translations**, across eight locales, existed only in XLIFF for
  the retired `Minimize` and `Drag to move menu` IDs. They are retained in canonical
  JSON, extraction and regenerated XLIFF. The published runtime omits these two
  unused actions only when they were not original runtime keys. The generator and
  a separate regression check retain all 810 original runtime values explicitly.
- Every canonical locale has **59 IDs**; active runtime modules have **57**. The `allDayEventsWeek` label, complete contextual/count phrases, and the four added Agenda labels have values in every catalog.
- The UI correction translates only post-preservation English seeds, never the
  original translations or already translated complete phrases.
  **New translations require native-speaker review**; roundtrip/key checks prove
  preservation and structure, not linguistic correctness.

## Complete phrases and number/date policy

`getMessageFormatters(locale)` adds `eventCount`, `moreEvents`, `dateSummary`,
`switchToDayView`, `showWeek`, `viewLabel`, `eventLabel`, `timeRange` and
`agendaAction(expanded, preview)`. The four list-action IDs `A/F/S/H` mean Show all,
Show fewer, Show events and Hide events. The superseded uncommitted `showAll`
count-bearing phrase/formatter was removed; this does not remove a legacy message. Every phrase
can be reordered by translators with named placeholders. Count messages select
`zero/one/two/few/many/other` with `Intl.PluralRules`, and use `Intl.NumberFormat`.
Counts must be nonnegative safe integers. Legacy fragment fields remain compatible
while component owners migrate their callers. Evaluate the helpers during render;
loading a locale still requires a render request by the owning component.

Formatting preserves canonical script/region/numbering preferences, independently
of catalog fallback. `de-AT`/`de-DE` use `de`; English variants and unsupported tags
resolve to the ready built-in English dictionary. Malformed tags safely use `en`.
Simplified Chinese aliases resolve to `zh-Hans`; Traditional Chinese does not
silently resolve to Simplified Chinese.

Date-only formatting uses an explicit Gregorian calendar and UTC civil-date carrier
(not an event instant), including historically skipped local dates and years below 100. Locale order and requested numbering systems are retained; WebKit's Gregorian
ASCII-digit fallback is reconciled with the locale's number formatter. Week numbering is explicitly
**ISO-8601** and independent of `firstDayOfWeek`. The component's default remains
Monday; locale-specific starts are recommendations, not automatic defaults.

## Loading and root integration

`ensureLocale(locale): Promise<void>` is compatible with existing callers. It
settles for source/unknown locales, shares in-flight catalog loads across aliases,
rejects a failed chunk, and evicts failed pending entries so a subsequent call can
retry. `loadLocale(locale)` additionally returns `{ requestedLocale, locale,
catalogLocale, fallback }`. `resolveLocale()` exposes that resolution synchronously.
`isLocaleLoaded()` reports readiness of the **resolved** catalog, including an
intentional English fallback. Immutable catalog data can be shared without changing
any instance's active locale.

The root owns its current load promise, generation guard, visible English fallback,
error reporting/retry UX, and a `localeReady` accessor returning the current settling
promise (not a listener installed after an event may already have fired). The root
also owns host `lang`/requested-versus-resolved `dir`. Resolver tests cannot establish
that final DOM wiring; root/component integration tests remain required.
