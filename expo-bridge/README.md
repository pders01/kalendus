# Kalendus Expo WebView bridge

Hosts `<lms-calendar>` in an Expo/React Native WebView. This is a **source integration**, not a separately published native package. Copy this directory into your app (excluding tests/build tooling if desired). Native dependencies belong in the app, **not** in the Kalendus root package.

## Build a self-contained document

Use Bun in the Kalendus checkout:

```sh
bun run build:iife
bun expo-bridge/build-shell.mjs           # regenerate the committed development shell
bun expo-bridge/build-shell.mjs --inline  # app artifacts: kalendus-inline.html AND kalendus-inline.ts
```

`protocol.ts` is the **single runtime schema** imported by both wrapper and shell. `shell.ts` is bundled into `kalendus.html` by `build-shell.mjs`, using the installed Bun version. `shell.template.html` is the authored HTML/CSS. Do not edit the generated `kalendus.html` directly. `--check` detects drift. The app artifacts are intentionally ignored and must be regenerated after calendar/bridge changes. Keep Bun/lockfile versions consistent in CI for reproducibility.

The development shell references a sibling `kalendus.iife.js`. **Metro does not automatically copy a sibling JavaScript file next to an HTML asset.** Do not use that shell as a standalone Expo asset. The inline artifacts contain both bridge and calendar code, including calendar dependencies. Generated HTML/module contents are trusted executable code; never accept them from an untrusted API/user.

### Recommended: an actual HTML string

In the Expo app:

```sh
bunx expo install react-native-webview expo-asset
```

Copy the generated `kalendus-inline.ts` and bridge sources into the app, then:

```tsx
import KALENDUS_HTML from './expo-bridge/kalendus-inline';
import { KalendusWebView } from './expo-bridge/KalendusWebView';

export function CalendarScreen() {
    return (
        <KalendusWebView
            htmlSource={KALENDUS_HTML}
            entries={entries}
            locale="en"
            onEntryPress={(detail) => console.log(detail.heading)}
            onCalendarStateChange={(state) => console.log(state.range)}
            onExportICS={(detail) => shareOriginalEntry(detail.entry, detail.eventId)}
            onError={(message) => console.error(message)}
        />
    );
}
```

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

```tsx
<KalendusWebView
    assetSource={require('./assets/kalendus-inline.html')}
    entries={entries}
    onError={console.error}
/>
```

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
| `color`           | CSS color string               | `#000000`                   |
| `activeDate`      | `{year, month, day}`           | document's initial today    |
| `viewMode`        | `month \| week \| day \| year` | `month`                     |

Bridge-only inputs: exactly one of `htmlSource: string` / `assetSource: number`; optional `theme: Record<string,string>`, `style: StyleProp<ViewStyle>` and `showLoadingIndicator: boolean` (default true).

Every update is a **complete configuration replacement**, not a patch. Removing a previously provided prop (including setting it to `undefined`) restores the initial public root default captured after upgrade/render. Removing theme keys calls `style.removeProperty`; removing `theme` clears every prior bridge override. Unprovided navigation props are left alone during ordinary updates, so changing a heading/theme does not reset user navigation. Invalid snapshots are rejected atomically; the last valid configuration remains installed.

Each new document receives the **latest current complete props/theme/capabilities**, even if they did not change since the preceding document. Updates during startup are read at handshake time, not from a queued/stale closure. Keep `activeDate`/`viewMode` in owner state via `onCalendarStateChange` if navigation must survive a reload; uncontrolled navigation starts from the new document's defaults. Source replacement remounts the WebView immediately. Native `onLoadStart` resets session/readiness/deduplication, and old session/document/sequence messages are rejected. Native loading, HTTP, renderer termination and handshake-timeout errors call `onError` and render an error label; remount the wrapper to retry a failed document.

`onReady` means the custom element is defined, its initial root `updateComplete` has settled, a frame has passed, the bridge listeners are installed, and native has dispatched the latest snapshot. It is **not** a guarantee that descendant layout/locale loading or owner snapshot rendering has completed. `onCalendarStateChange` provides committed state after snapshot application. A missing bundle/failed initial render cannot report ready.

## Callbacks and public events

Legacy callback names remain available:

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
| `onReady`               | no arguments, once per successfully bound document                                        |
| `onError`               | bounded message string                                                                    |

Use **`onCalendarStateChange`** for fetches/range synchronization: the root emits it initially and after committed changes, including owner-assigned public properties. `range.start` / `range.end` are **half-open ISO civil dates** (`start` included, `end` excluded), not UTC timestamps. The bridge deduplicates identical committed snapshots. Legacy navigation callbacks continue to describe the input action and must not be treated as the canonical resulting range.

Only public, cancelable, composed requests are intercepted. No component private method, prototype or shadow-tree observer is patched:

- `export-entry` is intercepted **only while `onExportICS` is installed**, after a valid message was posted. Otherwise the browser's default export is not prevented (whether the device supports its Blob download is a separate platform issue).
- `entry-activate` is intercepted only with `onEntryActivate`. Without it the built-in inspector continues to work. `onEntryPress` remains a compatibility notification and does not itself cancel activation.
- Capability changes are synchronized snapshots; as with any asynchronous bridge, a handler update/removal has a short transport window before the document applies it. Keep native handlers installed for the document lifetime when interception is required.

`onExportICS` is an **export request, not prebuilt ICS text**. Use `detail.entry` and `detail.eventId` for native serialization/sharing, never the displayed chip's slice/date. Original multi-day endpoints, `id`, `kind` and `timeZone` are preserved. Compatibility `date` is the original start; `displayTime` is always a string (`HH:mm–HH:mm` or empty for no time). It is not a localized inspector label. Legacy/all-day `date.end` is inclusive; ICS DATE ends must be advanced to an exclusive next day. Timed entries have original continuous endpoints when `kind: 'timed'`. Preserve identity for UID, honor the explicit zone (or floating semantics), and validate the file in target calendar clients. Native ICS creation, filesystem writes and share sheets belong to the app and are not implemented/tested by this bridge.

```ts
type CalendarEntry = {
    id?: string;
    kind?: 'all-day' | 'timed';
    timeZone?: string; // valid IANA zone, e.g. Europe/Berlin
    date: { start: CalendarDate; end: CalendarDate };
    time?: { start: CalendarTime; end: CalendarTime }; // 24:00 only as an end boundary
    heading: string;
    content: string;
    color: string;
    isContinuation?: boolean;
    continuation?: { has: boolean; is: boolean; index: number; total: number };
};
```

## Wire protocol v1 and trust boundary

- The shell installs **no ordinary `window`/`document` `message` listeners**. Native uses `injectJavaScript` to call the dedicated `window.__kalendusReceive(JSON-string)` endpoint. iOS/Android `postMessage` origin/source discrepancies are therefore not papered over with a permissive browser origin check. Ordinary browser `postMessage`, including `origin: 'null'`, cannot issue commands.
- Native sends a fresh `connect {version, session}` at load completion; the shell binds once and responds only after real readiness with `{version, session, document, seq, type:'ready'}`. Configuration and subsequent notifications carry that session/document pair and monotonically increasing sequence numbers. These are freshness markers, **not authentication credentials**; same-document malicious JavaScript can access the native bridge. Only trusted generated HTML/bundles may run here.
- Native validates JSON before invoking callbacks; the shell validates JSON before touching public properties/styles. Both validate outbound objects before **and** after serialization. Unsupported versions/types/keys, null/arrays instead of objects, invalid enum/date/time/zone fields, malformed JSON, stale documents and repeated sequences are rejected without throwing into the transport.
- Maximum message size: **1,048,576 UTF-8 bytes**, maximum **2,000 entries**, heading **2,048**, content **32,768**, ID **256** characters. Years `1..9999`, actual leap/calendar dates, clock bounds, valid BCP 47 locales. Oversized data is rejected, not silently truncated. Filter entries by the canonical visible range; do not send your whole database.
- Themes: at most **128** keys, matching `--[a-z][a-z0-9-]{0,79}`, string values up to **512** characters. Declaration delimiters, markup, control characters, escapes, comments, resource-loading functions (including `url()`/`image-set()`), `expression()` and at-rules are rejected. Colors have a similar safe value constraint (128 characters). These constraints protect the transport/sinks; they do not promise that every CSS value is supported by the calendar/device. Use the tokens in the root theme source; unknown custom properties have no effect unless consumed by your theme.
- Inline HTML requires RN WebView's wildcard `originWhitelist`; it is **not** the authorization boundary. `onShouldStartLoadWithRequest` permits only `about:blank` or the exact resolved local asset URI. Links/navigation elsewhere are denied, and `onOpenWindow` deliberately does nothing rather than launching a new browsing context/external app. No arbitrary network navigation is enabled.

## Accessibility

The authored viewport allows zoom (no `maximum-scale` or `user-scalable=no`). The document language tracks the applied `locale`, including reset; root locale/direction behavior remains the public component's responsibility. The shell does not clip document overflow, and WebView scrolling is enabled for enlarged content. Native loading/error labels exist, but translations, dynamic text sizing, pinch zoom/reflow, RTL, focus and announcement quality require device verification.

## Checks and integration hooks

```sh
# No native packages required: generated drift, strict pure/shell TS, actual Node Mocha VM tests
bun scripts/check-bridge.mjs

# Real root + real Menu click in a browser iframe, using the generated shell
bun scripts/check-bridge.mjs --browser
TEST_BROWSERS=chromium,firefox,webkit bun run web-test-runner --config expo-bridge/web-test-runner.config.mjs

# Also exercise the generated production IIFE/inline HTML, not just Vite's source modules
bun run build:iife
bun expo-bridge/build-shell.mjs --inline
BRIDGE_TEST_INLINE=1 bun run web-test-runner --config expo-bridge/web-test-runner.config.mjs
```

`test/unit/lib/expoBridge.test.ts` is included by the existing root Mocha test glob. It tests the actual generated shell in a VM and the same `NativeSession` state machine used by React: readiness timing/failure, startup props race, reload replay, stale/replayed messages, malformed/oversized data, atomic rejection, defaults/theme clearing, canonical state, conditional export/activation and transport failure. Browser tests under `expo-bridge/test/` exercise the real root/Menu public export button and verify one native export/no Blob download versus the uncanceled browser default.

The root package now provides `bun run check:bridge`, `bun run test:bridge`, and `bun run test:bridge:inline`. CI runs the source and production-inline browser checks in its Chromium/Firefox/WebKit matrix; this configuration is not a claim that every browser passed locally. The root unit glob also includes protocol/VM regressions. Regenerate/check the shell on protocol/shell changes. Before packaging an Expo app, rebuild the IIFE and regenerate inline artifacts; actual Expo typechecking and release-device testing remain separate gates.

### Evidence recorded for S10–S12

| Finding | Implemented evidence                                                                                                                                                                                               | Still open                                                                              |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| S10     | Expo Asset local-file resolution; real definition/render/frame readiness; source-remount/load-start sessions; latest complete snapshot replay; missing/old bundle failures; VM lifecycle regressions               | Actual Expo app TSX typecheck and release-mode iOS/Android asset/lifecycle verification |
| S11     | One shared bounded schema; dedicated native transport; stale/replay rejection; prop/theme resets; real Menu button produces one canonical export/no download with capability, preserves browser default without it | Native bridge delivery, callback/share UI and calendar-client imports on devices        |
| S12     | No authored zoom restriction; locale/reset updates shell language; overflow/scroll allowed                                                                                                                         | Pinch zoom, enlarged text/reflow, RTL, VoiceOver/TalkBack and focus/scroll on devices   |

Checks run in this checkout: strict pure protocol/shell TypeScript; **25** Node Mocha/VM bridge tests; **2** Chromium real-root/Menu tests against source modules and the same **2** against the generated production IIFE/inline artifact; root Mocha suite (**438 passing** at the final run, including concurrent work); focused oxlint and whitespace checks. The production IIFE build and inline/module generation also succeeded. A Firefox/WebKit matrix attempt could not launch those browsers because their Playwright executables were not installed; that is a blocker, not a pass. A Bun TSX syntax/bundle check with native dependencies external also passed; that is explicitly **not** a native typecheck. The native TSX/device gates below were **not run**.

### Native TSX typecheck gate (separate, not simulated)

The pure checks deliberately exclude `KalendusWebView.tsx`: the root has no `react-native`, `react-native-webview` or `expo-asset` install. Do **not** add fake ambient declarations or install RN dependencies into the root just to make a green check. In the actual supported Expo app, install its SDK-compatible dependencies with `bunx expo install react-native-webview expo-asset`, include the copied bridge `.ts`/`.tsx` in the app's `tsconfig.json`, and run:

```sh
bunx tsc --noEmit --project tsconfig.json
```

Native TSX is source-reviewed and syntax-bundled here, not claimed native-typechecked/device-tested. Source review specifically checks the real Expo asset/localUri path, source lifetime/remount behavior, latest-props refs, `onLoadStart` reset, load/HTTP/process errors, bounded decoded callbacks, explicit capabilities and pinned navigation. `react-native-webview` 13.16's published types exclude numbers from `WebViewSource` even though its runtime resolves modules; the Expo local-URI path also avoids that type mismatch without a cast.

### Release-device gate — still open

On **release-mode iOS and Android devices** verify both generated-string and Expo asset paths, cold start/offline packaging, missing/corrupt bundle and asset failure, unchanged-prop reload/source replacement, rapid props/theme/handler updates during startup, process termination/recovery, actual native callback/share UI, no unintended downloads/navigation, pinch zoom, 200–400% text/reflow, RTL, VoiceOver/TalkBack, focus and scroll. External calendar-client ICS import remains a separate app/manual gate. VM/browser success is not evidence of native WebView/Metro/device accessibility success. Do not label S10–S12 release-device verified without this evidence.
