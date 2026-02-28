// ── Kalendus Expo WebView Bridge — Message Protocol Types ──────────────
//
// These types define the JSON message protocol between React Native and
// the WebView hosting the <lms-calendar> web component.

// ── Calendar domain types (serializable mirrors of the web component) ──

export type CalendarDate = {
    day: number;
    month: number;
    year: number;
};

export type CalendarTime = {
    hour: number;
    minute: number;
};

export type CalendarTimeInterval = {
    start: CalendarTime;
    end: CalendarTime;
};

export type CalendarDateInterval = {
    start: CalendarDate;
    end: CalendarDate;
};

export type CalendarEntry = {
    date: CalendarDateInterval;
    time: CalendarTimeInterval;
    heading: string;
    content: string;
    color: string;
    isContinuation: boolean;
    continuation?: {
        has: boolean;
        is: boolean;
        index: number;
        total: number;
    };
};

export type FirstDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type ViewMode = 'month' | 'week' | 'day' | 'year';
export type DrillTarget = 'day' | 'week' | 'month';
export type DensityMode = 'dot' | 'heatmap' | 'count';

// ── Component props (the 7 input properties of <lms-calendar>) ─────────

export type KalendusProps = {
    heading?: string;
    firstDayOfWeek?: FirstDayOfWeek;
    locale?: string;
    yearDrillTarget?: DrillTarget;
    yearDensityMode?: DensityMode;
    entries?: CalendarEntry[];
    color?: string;
};

// ── Theme (CSS custom properties) ──────────────────────────────────────

export type ThemeVars = Record<string, string>;

// ── RN → WebView messages ──────────────────────────────────────────────

export type SetPropsMessage = {
    type: 'setProps';
    props: Partial<KalendusProps>;
};

export type SetThemeMessage = {
    type: 'setTheme';
    vars: ThemeVars;
};

export type InboundMessage = SetPropsMessage | SetThemeMessage;

// ── WebView → RN messages ──────────────────────────────────────────────

export type OpenMenuEvent = {
    type: 'event';
    name: 'open-menu';
    detail: {
        heading: string;
        content: string;
        time?: CalendarTimeInterval;
        displayTime: string;
        date?: CalendarDate;
    };
};

export type ExpandEvent = {
    type: 'event';
    name: 'expand';
    detail: {
        date: CalendarDate;
        drillTarget?: DrillTarget;
    };
};

export type SwitchViewEvent = {
    type: 'event';
    name: 'switchview';
    detail: {
        view: string;
    };
};

export type SwitchDateEvent = {
    type: 'event';
    name: 'switchdate';
    detail: {
        direction: string;
    };
};

export type JumpTodayEvent = {
    type: 'event';
    name: 'jumptoday';
    detail: {
        date: CalendarDate;
    };
};

export type MenuCloseEvent = {
    type: 'event';
    name: 'menu-close';
    detail: Record<string, never>;
};

export type ExportICSEvent = {
    type: 'event';
    name: 'export-ics';
    detail: {
        heading: string;
        content: string;
        time?: CalendarTimeInterval;
        displayTime: string;
        date?: CalendarDate;
    };
};

export type ReadyMessage = {
    type: 'ready';
};

export type ErrorMessage = {
    type: 'error';
    message: string;
};

export type OutboundMessage =
    | OpenMenuEvent
    | ExpandEvent
    | SwitchViewEvent
    | SwitchDateEvent
    | JumpTodayEvent
    | MenuCloseEvent
    | ExportICSEvent
    | ReadyMessage
    | ErrorMessage;

// ── Callback props for the React Native wrapper ────────────────────────

export type KalendusCallbacks = {
    onEntryPress?: (detail: OpenMenuEvent['detail']) => void;
    onDateExpand?: (detail: ExpandEvent['detail']) => void;
    onViewChange?: (detail: SwitchViewEvent['detail']) => void;
    onDateChange?: (detail: SwitchDateEvent['detail']) => void;
    onJumpToday?: (detail: JumpTodayEvent['detail']) => void;
    onMenuClose?: () => void;
    onExportICS?: (detail: ExportICSEvent['detail']) => void;
    onReady?: () => void;
    onError?: (message: string) => void;
};
