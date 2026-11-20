import type { ENTRY_ISSUE_REASONS, VERSION } from './protocol.js';

/** Serializable mirrors of the public calendar contract; no React Native dependency. */
export type CalendarDate = { day: number; month: number; year: number };
export type CalendarTime = { hour: number; minute: number };
export type CalendarTimeInterval = { start: CalendarTime; end: CalendarTime };
export type CalendarDateInterval = { start: CalendarDate; end: CalendarDate };
export type CalendarEntry = {
    id?: string;
    /** Opaque calendar identity from the server adapter; not used for rendering. */
    calendarId?: string;
    kind?: 'all-day' | 'timed';
    timeZone?: string;
    date: CalendarDateInterval;
    time?: CalendarTimeInterval;
    heading: string;
    content?: string;
    color?: string;
    isContinuation?: boolean;
    continuation?: { has: boolean; is: boolean; index: number; total: number };
};
export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ViewMode = 'month' | 'week' | 'day' | 'year';
export type DrillTarget = 'day' | 'week' | 'month';
export type DensityMode = 'dot' | 'heatmap' | 'count';
export type CalendarState = {
    activeDate: CalendarDate;
    viewMode: ViewMode;
    firstDayOfWeek: FirstDayOfWeek;
    /** Half-open ISO civil dates, not timestamps. */
    range: { start: string; end: string };
};
export type EntryRequest = { entry: CalendarEntry; eventId?: string };
export type KalendusProps = {
    heading?: string;
    firstDayOfWeek?: FirstDayOfWeek;
    locale?: string;
    yearDrillTarget?: DrillTarget;
    yearDensityMode?: DensityMode;
    entries?: CalendarEntry[];
    color?: string;
    activeDate?: CalendarDate;
    viewMode?: ViewMode;
};
export type ThemeVars = Record<string, string>;
export type Snapshot = {
    props: KalendusProps;
    theme: ThemeVars;
    capabilities: { exportICS: boolean; entryActivation: boolean };
    /** Opt in to explicit navigation commands. Changes to this value reapply supplied axes. */
    navigationRevision?: number;
};
export type Envelope = { version: typeof VERSION; session: string; document: string; seq: number };
export type ConnectMessage = { version: typeof VERSION; type: 'connect'; session: string };
export type InboundMessage = Envelope & { type: 'snapshot'; snapshot: Snapshot };
export type EntryPressDetail = {
    heading: string;
    content: string;
    displayTime: string;
    time?: CalendarTimeInterval;
    date?: CalendarDate;
    entry?: CalendarEntry;
    eventId?: string;
};
/** Compatibility fields plus the original, unsliced entry and identity. */
export type ExportICSDetail = EntryPressDetail & EntryRequest;
export type EntriesInvalidDetail = {
    issueCount: number;
    /** First 20 issues, without the original records; -1 refers to the collection. */
    issues: { index: number; reason: (typeof ENTRY_ISSUE_REASONS)[number] }[];
};
export type EventDetails = {
    'open-menu': EntryPressDetail;
    'entry-activate': EntryRequest;
    'calendar-state-change': CalendarState;
    'entries-invalid': EntriesInvalidDetail;
    expand: { date: CalendarDate; drillTarget?: DrillTarget };
    switchview: { view: ViewMode };
    switchdate: { direction: 'next' | 'previous' };
    jumptoday: { date: CalendarDate };
    'menu-close': Record<string, never>;
    'export-ics': ExportICSDetail;
};
export type BridgeEvent = {
    [K in keyof EventDetails]: Envelope & { type: 'event'; name: K; detail: EventDetails[K] };
}[keyof EventDetails];
export type OutboundMessage =
    | BridgeEvent
    | (Envelope & { type: 'ready' })
    | (Envelope & { type: 'error'; message: string });
// Named aliases retained for existing callback consumers.
export type OpenMenuEvent = Extract<BridgeEvent, { name: 'open-menu' }>;
export type ExpandEvent = Extract<BridgeEvent, { name: 'expand' }>;
export type SwitchViewEvent = Extract<BridgeEvent, { name: 'switchview' }>;
export type SwitchDateEvent = Extract<BridgeEvent, { name: 'switchdate' }>;
export type JumpTodayEvent = Extract<BridgeEvent, { name: 'jumptoday' }>;
export type MenuCloseEvent = Extract<BridgeEvent, { name: 'menu-close' }>;
export type ExportICSEvent = Extract<BridgeEvent, { name: 'export-ics' }>;
export type ReadyMessage = Extract<OutboundMessage, { type: 'ready' }>;
export type ErrorMessage = Extract<OutboundMessage, { type: 'error' }>;
export type KalendusCallbacks = {
    onEntryPress?: (detail: EntryPressDetail) => void;
    /** Installing this handler delegates activation to native (suppresses inspector). */
    onEntryActivate?: (detail: EntryRequest) => void;
    onCalendarStateChange?: (detail: CalendarState) => void;
    /** Reports root ingestion failures, not a transport failure or a readiness change. */
    onEntriesInvalid?: (detail: EntriesInvalidDetail) => void;
    onDateExpand?: (detail: EventDetails['expand']) => void;
    onViewChange?: (detail: EventDetails['switchview']) => void;
    onDateChange?: (detail: EventDetails['switchdate']) => void;
    onJumpToday?: (detail: EventDetails['jumptoday']) => void;
    onMenuClose?: () => void;
    onExportICS?: (detail: ExportICSDetail) => void;
    onReady?: () => void;
    onError?: (message: string) => void;
};
