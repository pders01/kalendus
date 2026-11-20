# Kalendus Expo WebView bridge

Hosts `<lms-calendar>` in an Expo/React Native WebView. This is a **source integration**, not a separately published native package. These instructions describe the **unreleased `0.12.0` checkout**; for the published root `0.11.0` see the [stable source and docs](https://github.com/pders01/kalendus/tree/v0.11.0). Copy the wrapper and protocol sources from the same revision as the generated shell. Native dependencies belong in the Expo app, **not** in the Kalendus root package.

## Build a self-contained document

Use Bun at the root of the intended Kalendus checkout:

```sh
bun install --frozen-lockfile
bun run build:iife
bun expo-bridge/build-shell.mjs --inline  # app artifacts: kalendus-inline.html and kalendus-inline.ts
```

Don't reuse old ignored inline artifacts. **Protocol v2 requires a matching wrapper and shell**: rebuild the IIFE, regenerate the inline files and update the copied sources together when changing revisions. The inline artifacts contain both bridge and calendar code, including calendar dependencies. Generated HTML/module contents are trusted executable code; never accept them from an untrusted API/user.

For bridge development, `bun expo-bridge/build-shell.mjs` regenerates committed `kalendus.html` from `shell.template.html` and `shell.ts`; `--check` detects drift in that development artifact only. Both that shell and the wrapper import the same `protocol.ts` schema. Do not edit generated HTML directly. The development shell references a sibling `kalendus.iife.js`; **Metro does not automatically place that script next to an HTML asset.** Use the inline output in an Expo app. Keep Bun and lockfile versions consistent in CI for reproducibility.

### Recommended: an actual HTML string

In the Expo app:

```sh
bunx expo install react-native-webview expo-asset
```

Copy the generated `kalendus-inline.ts` and `KalendusWebView.tsx`, `protocol.ts` and `types.ts` into the app's `expo-bridge/` directory. For an Expo project with an `App.tsx` entry point (or adapt to your route file):

```tsx
import React from 'react';
import KALENDUS_HTML from './expo-bridge/kalendus-inline';
import { KalendusWebView } from './expo-bridge/KalendusWebView';
import type { CalendarEntry } from './expo-bridge/types';

const date = { year: 2026, month: 11, day: 17 };
const entries: CalendarEntry[] = [{
    id: 'open-studio',
    kind: 'all-day',
    heading: 'Open studio',
    date: { start: date, end: date },
}];

export default function App() {
    return (
        <KalendusWebView
            htmlSource={KALENDUS_HTML}
            entries={entries}
            activeDate={date}
            locale="en"
            onError={(message) => console.error('Calendar bridge:', message)}
        />
    );
}
```

This leaves activation and export to the web component; the starter does not intercept them with logging or unimplemented native handlers. A WebView may not support the default Blob download. Only install `onExportICS` once the app implements native serialization/sharing and surfaces failures; only install `onEntryActivate` to replace the built-in entry UI. The wrapper shows native load/handshake failures; use `onError` to surface rejected dynamic configuration in your own UI.

A default `.html` import in Metro is **not** an HTML string. The generated `.ts` string module needs no custom loader. `expo-asset` is currently imported by the wrapper even when using `htmlSource`.

### Alternative: Expo asset module

Copy **`kalendus-inline.html`**, not the development shell, into your app's assets. Ensure Metro treats HTML as an asset; merge this into the app's existing `metro.config.js` rather than replacing unrelated configuration:

```js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts = config.resolver.sourceExts.filter((ext) => ext !== 'html');
if (!config.resolver.assetExts.includes('html')) config.resolver.assetExts.push('html');
module.exports = config;
```

In the starter above, replace `htmlSource={KALENDUS_HTML}` with `assetSource={require('./assets/kalendus-inline.html')}` and remove the `KALENDUS_HTML` import. Keep the entries, date and error handler; pass exactly one source prop.

The wrapper calls `Asset.fromModule(module).downloadAsync()`, waits for an actual `file:` `localUri`, then supplies `{ uri: localUri }`. It never converts/casts a numeric module to a string. Android file loading is enabled only for this asset path, with file-origin/universal fetch access explicitly disabled; iOS read access is scoped to the exact self-contained file, not a sibling directory. Download/resolution failures are surfaced and do not report ready. Asset names, release bundling and local-file access vary by Expo SDK/platform: **this path is not release-device verified here**. Prefer the string module if local HTML access is unavailable in your supported SDK; do not enable arbitrary file/network navigation to hide a load failure. Expo web is not the target for this wrapper.

## Public inputs and replacement/reset semantics

| Calendar prop     | Type                           | Default when not overridden |
| ----------------- | ------------------------------ | --------------------------- |
| `entries`         | `CalendarEntry[]`              | `[]`                        |
| `heading`         | `string`                       | unset                       |
| `locale`          | BCP 47 `string`                | shell/root default `en`     |
| `firstDayOfWeek`  | `0..6` (Sunday = 0)            | `1`                         |
| `yearDrillTarget` | `day \| week \| month`         | `month`                     |
| `yearDensityMode` | `dot \| heatmap \| count`      | `dot`                       |
| `color`           | non-empty CSS color string     | theme accent                |
| `activeDate`      | `{year, month, day}`           | document's initial today    |
| `viewMode`        | `month \| week \| day \| year` | `month`                     |

Bridge-only inputs: exactly one of `htmlSource: string` / `assetSource: number`; optional `theme: Record<string,string>`, `style: StyleProp<ViewStyle>` and `showLoadingIndicator: boolean` (default true).

Every update is a **complete configuration replacement**, not a patch. Removing a previously provided calendar prop (including setting it to `undefined`) restores the initial public root default captured after upgrade/render. For `color`, omission clears the explicit `--calendar-accent` override and lets the theme supply the accent. The element's `color` getter still returns the legacy `#000000` when unset; passing `#000000` as a prop explicitly sets black. Removing theme keys calls `style.removeProperty`; removing `theme` clears every prior bridge override. Snapshots that fail the bridge schema are rejected atomically; the last valid configuration remains installed. A schema-valid snapshot does not guarantee that the calendar accepts each entry.

### Navigation ownership and reassertion

- By default, supplying or changing `activeDate` or `viewMode` navigates that axis independently. Unchanged values (including a new date object for the same civil date) and axes never supplied do not override web navigation on unrelated snapshots. These are navigation inputs, not continuously enforced React control values.
- To give the owner explicit control, pass `navigationRevision` (a non-negative safe integer) from the first render. The first valid snapshot still applies supplied date/view. After that, change `navigationRevision` to apply **all supplied navigation axes**, even if their values did not change. A snapshot with the same revision does not navigate, even if its date/view changed. To control only one axis, leave the other unspecified.
- Keep the revision unchanged when mirroring `onCalendarStateChange` into owner state. This saves the observed values for reloads without replaying an earlier web navigation if that render arrives after a newer navigation. To reject web navigation or deliberately jump, update the desired values and bump the revision in the same owner update. Removing a previously supplied date/view resets that axis to its document default even in explicit mode; removing `navigationRevision` returns to per-axis change tracking.

For example, keep `{ activeDate, viewMode, revision }` together in owner state. In `onCalendarStateChange`, update only the date/view; in a “go to my selected date” action, set the desired date/view and increment `revision`. Pass `revision` as `navigationRevision`. The shell does not infer whether an ordinary prop change without a revision is an acceptance or an intentional navigation command.

Each new document receives the **latest current complete props/theme/capabilities**, even if they did not change since the preceding document. Updates during startup are read at handshake time, not from a queued/stale closure. Keep `activeDate`/`viewMode` in owner state via `onCalendarStateChange` if navigation must survive a reload; uncontrolled navigation starts from the new document's defaults. Source replacement remounts the WebView immediately. Native `onLoadStart` resets session/readiness/deduplication, and old session/document/sequence messages are rejected. Native loading, HTTP, renderer termination and handshake-timeout errors call `onError` and render an error label; remount the wrapper to retry a failed document.

`onReady` means the custom element is defined, its initial root `updateComplete` has settled, a frame has passed, the listeners are installed, the protocol version matches, and native has dispatched the latest bridge-valid snapshot. It does **not** confirm snapshot rendering, acceptance of each entry, descendant layout or locale loading. `onCalendarStateChange` reports committed navigation, not entry acceptance. A missing bundle or failed initial render cannot report ready. If the initial props/theme fail the bridge schema, including size limits, `onError` fires and `onReady` waits until a valid snapshot is dispatched. Correcting the props does not require a reload.

## Callbacks and public events

Available callbacks (including legacy names):

| Callback                | Payload                                                                                   |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `onEntryPress`          | `{heading, content, displayTime, time?, date?, entry?, eventId?}` from legacy `open-menu` |
| `onDateExpand`          | `{date, drillTarget?}`                                                                    |
| `onViewChange`          | `{view}` (legacy navigation notification, not the resulting state)                        |
| `onDateChange`          | `{direction: 'next' \| 'previous'}`                                                       |
| `onJumpToday`           | `{date}`                                                                                  |
| `onMenuClose`           | no arguments                                                                              |
| `onExportICS`           | compatibility fields **plus** `{entry, eventId?}`                                         |
| `onEntryActivate`       | `{entry, eventId?}`; installing this handler delegates activation to native               |
| `onCalendarStateChange` | `{activeDate, viewMode, firstDayOfWeek, range: {start, end}}`                             |
| `onEntriesInvalid`      | `{issueCount, issues: [{index, reason}]}`; no raw entries                                 |
| `onReady`               | no arguments, once per successfully bound document                                        |
| `onError`               | bounded message string                                                                    |

Use **`onCalendarStateChange`** for fetches/range synchronization: the root emits it initially and after committed changes, including owner-assigned public properties. `range.start` / `range.end` are **half-open ISO civil dates** (`start` included, `end` excluded), not UTC timestamps; the upper exclusive boundary can be `10000-01-01`. The bridge deduplicates identical committed snapshots. Legacy navigation callbacks describe the input action, not the resulting range.

Use **`onEntriesInvalid`** for entries that passed transport validation but were rejected by the calendar. It reports the total number of issues (up to the 2,000-entry transport limit) and the first 20 original array indexes and allowlisted reasons. `-1` denotes the collection itself; an unrecognized reason becomes `Other validation issue`. The bridge never forwards the diagnostic's raw `entry` values or arbitrary reason text. This is a non-fatal notification for the update that produced it, not an acknowledgment of the app's latest props, a readiness change, or an `onError` callback.

Only public, cancelable, composed requests are intercepted. No component private method, prototype or shadow-tree observer is patched:

- `export-entry` is intercepted **only while `onExportICS` is installed**, after a valid message was posted. Otherwise the browser's default export is not prevented (whether the device supports its Blob download is a separate platform issue).
- `entry-activate` is intercepted only with `onEntryActivate`. Without it the built-in inspector continues to work. `onEntryPress` remains a compatibility notification and does not itself cancel activation.
- Capability changes are synchronized snapshots; as with any asynchronous bridge, a handler update/removal has a short transport window before the document applies it. Keep native handlers installed for the document lifetime when interception is required.

`onExportICS` is an **export request, not prebuilt ICS text**. Use `detail.entry` and `detail.eventId` for native serialization/sharing, never the displayed chip's slice/date. Original multi-day endpoints, `id`, `kind`, `timeZone` and the server adapter's optional `calendarId` are preserved. The latter is opaque metadata, not a render setting or an authorization claim. Compatibility `date` is the original start; `displayTime` is always a string (`HH:mm–HH:mm` or empty for no time). It is not a localized inspector label. Legacy/all-day `date.end` is inclusive; ICS DATE ends must be advanced to an exclusive next day. Timed entries have original continuous endpoints when `kind: 'timed'`. Preserve identity for UID, honor the explicit zone (or floating semantics), and validate the file in target calendar clients. Native ICS creation, filesystem writes and share sheets belong to the app and are not implemented/tested by this bridge.

```ts
type CalendarEntry = {
    id?: string;
    calendarId?: string; // optional server adapter metadata
    kind?: 'all-day' | 'timed';
    timeZone?: string; // valid IANA zone, e.g. Europe/Berlin
    date: { start: CalendarDate; end: CalendarDate };
    time?: { start: CalendarTime; end: CalendarTime }; // 24:00 only as an end boundary
    heading: string;
    content?: string;
    color?: string;
    isContinuation?: boolean;
    continuation?: { has: boolean; is: boolean; index: number; total: number };
};
```

## Wire protocol v2 and trust boundary

**Update the copied wrapper/protocol sources and regenerate the inline shell artifacts together.** Protocol v2 supports `calendarId` and `navigationRevision`; the v1 schema strictly rejects those fields. The endpoints require an exact version match, with no fallback to v1: incompatible `connect` and `ready` messages cannot bind a session or fire `onReady`. A v1/v2 mismatch surfaces through the handshake timeout (`onError`), even when neither new field is used. `entries-invalid` is an additive v2 event: older v2 wrappers ignore it and continue processing other messages; older v2 shells do not send it.

- The shell installs **no ordinary `window`/`document` `message` listeners**. Native uses `injectJavaScript` to call the dedicated `window.__kalendusReceive(JSON-string)` endpoint. iOS/Android `postMessage` origin/source discrepancies are therefore not papered over with a permissive browser origin check. Ordinary browser `postMessage`, including `origin: 'null'`, cannot issue commands.
- Native sends a fresh `connect {version, session}` at load completion; the shell binds once and responds only after real readiness with `{version, session, document, seq, type:'ready'}`. Configuration and subsequent notifications carry that session/document pair and monotonically increasing sequence numbers. These are freshness markers, **not authentication credentials**; same-document malicious JavaScript can access the native bridge. Only trusted generated HTML/bundles may run here.
- Native validates JSON before invoking callbacks; the shell validates JSON before touching public properties/styles. Both validate outbound objects before **and** after serialization. Unsupported versions/types/keys, null/arrays instead of objects, invalid enum/date/time/zone fields, malformed JSON, stale documents and repeated sequences are rejected without throwing into the transport.
- Maximum message size: **1,048,576 UTF-8 bytes**, maximum **2,000 entries**, heading **2,048**, content **32,768**, `id` and `calendarId` **1–256** characters when present. Years `1..9999`, actual leap/calendar dates, clock bounds, valid BCP 47 locales. These are bridge limits, not calendar or server limits: a server range can return up to **5,000** results, and even fewer than 2,000 entries can exceed the byte limit. Fetch/prepare only the committed visible range and enforce both bridge limits before passing entries. If a result cannot fit, report it and let the user narrow the range; do not silently truncate it.
- The root applies additional entry validation and may reject individual records that pass the transport schema (for example, a whitespace-only `id` or an explicit timed endpoint in a DST gap). `onEntriesInvalid` reports those root rejections; a malformed bridge snapshot is instead rejected atomically through `onError`. Validate and map application data before sending it; schema success, `onReady`, and a committed range are not per-entry acknowledgments. Map REST DTOs (including nullable `time`/`content` and server timestamps) to `CalendarEntry` rather than passing raw DTOs across the bridge.
- Themes: at most **128** keys, matching `--[a-z][a-z0-9-]{0,79}`, string values up to **512** characters. Declaration delimiters, markup, control characters, escapes, comments, resource-loading functions (including `url()`/`image-set()`), `expression()` and at-rules are rejected. Colors have a similar safe value constraint (128 characters). These constraints protect the transport/sinks; they do not promise that every CSS value is supported by the calendar/device. Use the tokens in the root theme source; unknown custom properties have no effect unless consumed by your theme.
- Inline HTML requires RN WebView's wildcard `originWhitelist`; it is **not** the authorization boundary. For navigation requests **reported by** `onShouldStartLoadWithRequest`, the wrapper permits only `about:blank` or the exact resolved local asset URI. `onOpenWindow` does not launch a new browsing context or external app. These WebView hooks are not a general network or subresource sandbox; keep document contents trusted and verify navigation behavior in each supported native SDK/platform.

## Accessibility

The authored viewport allows zoom (no `maximum-scale` or `user-scalable=no`). The document language tracks the applied `locale`, including reset; root locale/direction behavior remains the public component's responsibility. The shell does not clip document overflow, and WebView scrolling is enabled for enlarged content. Native loading/error labels exist, but translations, dynamic text sizing, pinch zoom/reflow, RTL, focus and announcement quality require device verification.

## Checks and integration hooks

```sh
# No native packages required: generated drift, strict pure/shell TS, actual Node Mocha VM tests
bun scripts/check-bridge.mjs

# Real root + real Menu click in a browser iframe, using the generated shell
bun scripts/check-bridge.mjs --browser
TEST_BROWSERS=chromium,webkit bun run web-test-runner --config expo-bridge/web-test-runner.config.mjs

# Also exercise the generated production IIFE/inline HTML, not just Vite's source modules
bun run build:iife
bun expo-bridge/build-shell.mjs --inline
BRIDGE_TEST_INLINE=1 bun run web-test-runner --config expo-bridge/web-test-runner.config.mjs
```

`test/unit/lib/expoBridge.test.ts` is included by the existing root Mocha test glob. It tests the generated shell in a VM and the same `NativeSession` used by React, including readiness, mixed-version rejection, replay rejection, invalid snapshots, navigation reassertion and delayed owner echoes. Browser tests under `expo-bridge/test/` exercise removal of an explicit accent and bounded, record-free diagnostics on the real calendar. They also pass a server-mapped entry through the shell: delegated activation and export retain the original record, while export without a native handler keeps the browser default.

The root package now provides `bun run check:bridge`, `bun run test:bridge`, and `bun run test:bridge:inline`. CI runs the source and production-inline browser checks in its Chromium/Firefox/WebKit matrix; this configuration is not a claim that every browser passed locally. The root unit glob also includes protocol/VM regressions. Regenerate/check the shell on protocol/shell changes. Before packaging an Expo app, rebuild the IIFE and regenerate inline artifacts; actual Expo typechecking and release-device testing remain separate gates.

### Native TSX typecheck gate (separate, not simulated)

The pure checks deliberately exclude `KalendusWebView.tsx`: the root has no `react-native`, `react-native-webview` or `expo-asset` install. Do **not** add fake ambient declarations or install RN dependencies into the root just to make a green check. In the actual supported Expo app, install its SDK-compatible dependencies with `bunx expo install react-native-webview expo-asset`, include the copied bridge `.ts`/`.tsx` in the app's `tsconfig.json`, and run:

```sh
bunx tsc --noEmit --project tsconfig.json
```

Previous strict checks of the wrapper sources used disposable projects created from Expo's official blank TypeScript template with SDK-compatible dependencies. These are fixture results, not a typecheck of your app or a new verification of the starter above:

| Expo SDK | React Native | WebView | Expo Asset | TypeScript |
| -------- | ------------ | ------- | ---------- | ---------- |
| 57.0.33 | 0.86.3 | 13.16.1 | 57.0.21 | 6.0.3 |
| 58.0.26 | 0.88.1 | 14.0.1 | 58.0.21 | 6.0.3 |

To repeat the SDK 58 check from the Kalendus root (use `blank-typescript@57.0.35` for SDK 57):

```sh
fixture=$(mktemp -d "${TMPDIR:-/tmp}/kalendus-expo.XXXXXX")
bunx create-expo-app@5.0.0 "$fixture/app" --template blank-typescript@58.0.35 --no-install --no-agents-md --yes
mkdir "$fixture/app/expo-bridge"
cp expo-bridge/KalendusWebView.tsx expo-bridge/protocol.ts expo-bridge/types.ts "$fixture/app/expo-bridge/"
(
    cd "$fixture/app" &&
    bun install &&
    bunx --no-install expo install react-native-webview expo-asset --bun &&
    bunx --no-install expo install --check &&
    bunx --no-install tsc --noEmit --project tsconfig.json
)
```

Use the Node version supported by your chosen Expo SDK. Keep the fixture's lockfile if you need exact reruns; Expo's compatible versions can change. A fixture pass checks the wrapper against actual published declarations, not Metro packaging, a WebView launch, native callbacks, or device accessibility.

### Release-device gate — still open

On **release-mode iOS and Android devices** verify both generated-string and Expo asset paths, cold start/offline packaging, missing/corrupt bundle and asset failure, unchanged-prop reload/source replacement, rapid props/theme/handler updates during startup, process termination/recovery, actual native callback/share UI, no unintended downloads/navigation, pinch zoom, 200–400% text/reflow, RTL, VoiceOver/TalkBack, focus and scroll. External calendar-client ICS import remains a separate app/manual gate. VM/browser success is not evidence of native WebView/Metro/device accessibility success. Do not label S10–S12 release-device verified without this evidence.
