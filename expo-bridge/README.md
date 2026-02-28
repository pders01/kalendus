# Kalendus Expo WebView Bridge

Run the [Kalendus](https://github.com/pders01/kalendus) calendar web component inside a React Native / Expo app via WebView.

## Prerequisites

```bash
# In your Expo / RN project
npx expo install react-native-webview

# In the Kalendus repo — build the self-contained IIFE bundle
pnpm run build:iife
# Output: dist/kalendus.iife.js
```

## Quick Start — Inline HTML Source

The simplest approach bundles the HTML and JS into a single string at build time:

```tsx
import { KalendusWebView } from './expo-bridge/KalendusWebView';
import KALENDUS_HTML from './expo-bridge/kalendus-inline.html'; // your bundled HTML

export default function CalendarScreen() {
  return (
    <KalendusWebView
      htmlSource={KALENDUS_HTML}
      entries={myEntries}
      locale="en"
      onEntryPress={(detail) => {
        console.log('Entry tapped:', detail.heading);
      }}
      onExportICS={(detail) => {
        // Handle ICS export natively (e.g. share sheet)
        console.log('Export ICS for:', detail.heading);
      }}
    />
  );
}
```

To create the inline HTML, either:
1. Copy `kalendus.html` and replace `<script src="kalendus.iife.js">` with the inlined contents of `dist/kalendus.iife.js`
2. Use a build-time script to assemble the HTML string

## Quick Start — Asset Source

If you prefer loading from the file system (better for large bundles):

```tsx
import { KalendusWebView } from './expo-bridge/KalendusWebView';

export default function CalendarScreen() {
  return (
    <KalendusWebView
      assetSource={require('./assets/kalendus.html')}
      entries={myEntries}
    />
  );
}
```

> **Note:** When using `assetSource`, the `kalendus.iife.js` file must be co-located with the HTML file so the `<script src>` resolves. On Android, you may need to place both files in `android/app/src/main/assets/`.

## Props

### Calendar Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `entries` | `CalendarEntry[]` | `[]` | Calendar events to display |
| `heading` | `string` | — | Optional heading text |
| `locale` | `string` | `'en'` | BCP 47 locale code |
| `firstDayOfWeek` | `0-6` | `1` (Monday) | First day of the week (0 = Sunday) |
| `yearDrillTarget` | `'day' \| 'month'` | `'month'` | What clicking a year-view day drills into |
| `yearDensityMode` | `'dot' \| 'heatmap' \| 'count'` | `'dot'` | Year view density indicator style |
| `color` | `string` | `'#000000'` | Primary accent color |

### Bridge Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `htmlSource` | `string` | — | Inline HTML source string |
| `assetSource` | `number` | — | Expo `require()` for the HTML asset |
| `theme` | `Record<string, string>` | — | CSS custom property overrides |
| `style` | `ViewStyle` | — | Container style |
| `showLoadingIndicator` | `boolean` | `true` | Show spinner until WebView is ready |

### Callbacks

| Callback | Payload | Fires when… |
|----------|---------|-------------|
| `onEntryPress` | `{ heading, content, time, date? }` | User taps a calendar entry |
| `onDateExpand` | `{ date, drillTarget? }` | User drills into a date |
| `onViewChange` | `{ view }` | View mode changes (month/week/day/year) |
| `onDateChange` | `{ direction }` | Navigation arrow pressed |
| `onJumpToday` | `{ date }` | Today button pressed |
| `onMenuClose` | — | Detail menu dismissed |
| `onExportICS` | `{ heading, content, time, date? }` | ICS export requested |
| `onReady` | — | WebView finished loading |
| `onError` | `message: string` | Uncaught error in WebView |

## Theming

Pass CSS custom properties via the `theme` prop:

```tsx
<KalendusWebView
  htmlSource={html}
  entries={entries}
  theme={{
    '--primary-color': '#6366f1',
    '--background-color': '#fafafa',
    '--border-radius-lg': '16px',
    '--entry-font-size': '0.85rem',
  }}
/>
```

All ~110 CSS custom properties defined on the `:host` block of the calendar component are available. See the [main README](../README.md) or `src/lms-calendar.ts` for the full list.

## ICS Export Handling

In a browser, Kalendus creates a `.ics` file download via Blob URL. In a WebView, this doesn't work — the bridge intercepts the export and fires `onExportICS` instead.

Handle it natively with the Expo share sheet:

```tsx
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function handleExportICS(detail) {
  const icsContent = buildIcsString(detail); // Build ICS from detail
  const path = FileSystem.cacheDirectory + `${detail.heading || 'event'}.ics`;
  await FileSystem.writeAsStringAsync(path, icsContent);
  await Sharing.shareAsync(path, { mimeType: 'text/calendar' });
}

<KalendusWebView onExportICS={handleExportICS} /* ... */ />
```

## CalendarEntry Format

```ts
type CalendarEntry = {
  date: {
    start: { day: number; month: number; year: number };
    end: { day: number; month: number; year: number };
  };
  time: {
    start: { hour: number; minute: number };
    end: { hour: number; minute: number };
  };
  heading: string;
  content: string;
  color: string;        // CSS color for the entry
  isContinuation: boolean;
  continuation?: {
    has: boolean;
    is: boolean;
    index: number;
    total: number;
  };
};
```

## Troubleshooting

### Android: Messages not received

Android WebView uses `document.addEventListener('message', ...)` instead of `window.addEventListener('message', ...)`. The HTML shell listens on both — this should work out of the box.

### Large entry arrays are slow

The bridge serializes entries to JSON on every update. For very large datasets (1000+ entries):
- Filter entries to only the visible date range before passing them
- The bridge diffs props and skips unchanged entries, but the stringify comparison itself has a cost

### WebView caching

If the calendar doesn't update after rebuilding the IIFE bundle:
- Clear the Expo development cache: `npx expo start --clear`
- On Android, WebView aggressively caches assets. Use the inline `htmlSource` approach for development

### Blank screen on load

1. Verify `kalendus.iife.js` is accessible from the HTML file
2. Check `onError` callback for JavaScript errors
3. Ensure `react-native-webview` is properly linked: `npx expo install react-native-webview`
