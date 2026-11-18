import { LitElement, PropertyValueMap, TemplateResult, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DateTime } from 'luxon';

import LMSCalendarContext from './components/Context.js';
import LMSCalendarDay from './components/Day.js';
import LMSCalendarEntry from './components/Entry.js';
import { downloadEntryIcs } from './components/entryExport.js';
import './components/Context.js';
import LMSCalendarHeader from './components/Header.js';
import './components/Day.js';
import LMSCalendarMenu from './components/Menu.js';
import './components/Entry.js';
import LMSCalendarMonth from './components/Month.js';
import './components/Header.js';
import LMSCalendarWeek from './components/Week.js';
import LMSCalendarYear from './components/Year.js';
import './components/Menu.js';
import type { DensityMode, DrillTarget } from './components/Year.js';
import './components/Month.js';
import type { CalendarState, CalendarVisibleRange, CalendarEntryRequest } from './contracts.js';
import './components/Week.js';
import { allocateAllDayRows, computeSpanClass, type AllDayEvent } from './lib/allDayLayout.js';
import './components/Year.js';
import {
    normalizeEntries,
    expandEntries,
    MAX_EXPANDED_SEGMENTS,
    CalendarExpansionError,
    type EntryValidationIssue,
    type NormalizedCalendarEntry,
    type ExpandedCalendarEntry as ModelExpandedEntry,
} from './lib/calendarModel.js';
import { parseColorWithDefault } from './lib/colorParser.js';
import getColorTextWithContrast from './lib/getColorTextWithContrast.js';
import { LayoutCalculator, type LayoutResult } from './lib/LayoutCalculator.js';
import { formatLocalizedDate, formatLocalizedTime } from './lib/localization.js';
import {
    ensureLocale,
    getMessages,
    getMessageFormatters,
    isLocaleLoaded,
    normalizeLocale,
    resolveLocale,
} from './lib/messages.js';
import { buildMonthSpans, formatMonthSpanRange, type MonthSpan } from './lib/monthSpans.js';
import {
    slotManager,
    type LayoutDimensions,
    type PositionConfig,
    type FirstDayOfWeek,
} from './lib/SlotManager.js';
import type { ViewMode } from './lib/ViewStateController.js';
import { ViewStateController } from './lib/ViewStateController.js';
import { computeWeekDisplayContext, type WeekDisplayContext } from './lib/weekDisplayContext.js';
import { addDisplayDays, getMonthCalendarArray, getWeekDates } from './lib/weekStartHelper.js';

// ── RTL locale detection ───────────────────────────────────────────────
const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'yi']);

/** Resolve a BCP 47 locale to 'ltr' or 'rtl'. */
function resolveDirection(locale: string): 'ltr' | 'rtl' {
    const primary = locale.split('-')[0].toLowerCase();
    return RTL_LOCALES.has(primary) ? 'rtl' : 'ltr';
}

// ── Derived type for expanded (multi-day) entries ──────────────────────
type ExpandedCalendarEntry = ModelExpandedEntry & {
    originalStartDate?: CalendarDate;
    originalIndex: number;
    sourceEntry: CalendarEntry;
    canonicalEntry: CalendarEntry;
};

type EntryRender = { key: string; template: TemplateResult<1> };
const civilDateKey = ({ year, month, day }: CalendarDate) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

function groupByDate(entries: ExpandedCalendarEntry[]) {
    const groups: Record<string, ExpandedCalendarEntry[]> = {};
    for (const entry of entries) (groups[civilDateKey(entry.date.start)] ??= []).push(entry);
    return groups;
}

function sortMonthEntries(entries: ExpandedCalendarEntry[]) {
    const order = (entry: ExpandedCalendarEntry) =>
        entry.originalIndex - (entry.continuation.has ? 1000 : 0);
    return entries
        .sort((a, b) => order(a) - order(b))
        .map((entry) => ({
            entry,
            background: getColorTextWithContrast(entry.color)[0],
            originalIndex: entry.originalIndex,
        }));
}

/** Auto keeps compact Month context inline; day preserves the legacy drill action. */
export type MonthDayBehavior = 'auto' | 'inline' | 'day';
/** Experimental comparison modes; auto preserves the existing responsive policy. */
export type MonthPresentation = 'auto' | 'presence' | 'previews';
/** Selected-date list presentation; density lists retain their existing policy. */
export type MonthAgendaPresentation = 'full' | 'preview' | 'on-demand' | 'accordion';
/** Experimental: separate proportional duration marks from readable label envelopes. */
export type TimedEntryPresentation = 'card' | 'marker';
type DensityScope =
    | { agendaDate: CalendarDate; segmentIds?: never; timeRange?: never }
    | { agendaDate?: never; segmentIds: readonly string[]; timeRange: string };
type DensityReturn = DensityScope & {
    viewMode: 'day' | 'week';
    activeDate: CalendarDate;
    key: string;
    scrollMinute: number;
};

@customElement('lms-calendar')
export default class LMSCalendar extends LitElement {
    /** Optional title displayed in the calendar header. */
    @property({ type: String })
    heading?: string;

    /**
     * First day of the week.
     * `0` = Sunday, `1` = Monday (ISO default), …, `6` = Saturday.
     * Reflected as the `first-day-of-week` HTML attribute.
     */
    @property({ type: Number, attribute: 'first-day-of-week' })
    firstDayOfWeek: FirstDayOfWeek = 1;

    /**
     * BCP 47 locale code for UI strings and date formatting.
     * Auto-detected from `<html lang="…">` when not set explicitly.
     * Each instance can use a different locale.
     */
    @property({ type: String })
    locale = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';

    /**
     * Text direction for the calendar UI chrome.
     * - `'auto'` — detected from `locale` (Arabic, Hebrew → RTL).
     * - `'ltr'` / `'rtl'` — explicit override.
     *
     * The complete layout, including day columns and the time axis, follows
     * the resolved direction. Reading this property preserves the requested mode;
     * the HTML attribute exposes the resolved direction to CSS and descendants.
     */
    @property({ type: String, noAccessor: true })
    override get dir(): 'ltr' | 'rtl' | 'auto' {
        return this._requestedDirection ?? 'auto';
    }

    override set dir(value: 'ltr' | 'rtl' | 'auto') {
        if (this._reflectingDirection) return;
        const previous = this.dir;
        this._requestedDirection = value === 'ltr' || value === 'rtl' ? value : 'auto';
        if (previous !== this._requestedDirection) this.requestUpdate('dir', previous);
    }

    private _requestedDirection: 'ltr' | 'rtl' | 'auto' = 'auto';
    private _reflectingDirection = false;

    /**
     * Determines which view opens when a day cell is clicked in the year overview.
     * - `'month'` — zooms into the month grid (default).
     * - `'day'` — jumps straight to the 24-hour day view.
     */
    @property({ type: String, attribute: 'year-drill-target' })
    yearDrillTarget: DrillTarget = 'month';

    /**
     * Controls how per-day entry density is visualized in the year overview.
     * - `'dot'` — a small dot per day with entries (default).
     * - `'heatmap'` — tonal background intensity based on count.
     * - `'count'` — explicit numeric count.
     */
    @property({ type: String, attribute: 'year-density-mode' })
    yearDensityMode: DensityMode = 'dot';

    /** Compact Month selects a date inline by default. Use day for legacy drill-down. */
    @property({ type: String, attribute: 'month-day-behavior' })
    monthDayBehavior: MonthDayBehavior = 'auto';

    /** Experimental Month comparison. Explicit modes keep selected-date details inline. */
    @property({ type: String, attribute: 'month-presentation' })
    monthPresentation: MonthPresentation = 'auto';

    @property({ type: String, attribute: 'month-agenda-presentation' })
    monthAgendaPresentation: MonthAgendaPresentation = 'full';
    private _monthSpans: MonthSpan[][] = [];

    /** Experimental timed-event comparison; all-day entries are unaffected. */
    @property({ type: String, attribute: 'timed-entry-presentation' })
    timedEntryPresentation: TimedEntryPresentation = 'card';

    private _viewState = new ViewStateController(this);
    @state() private _compactMonth = false;
    @state() private _densityReturn?: DensityReturn;
    @state() private _agendaLimit = 50;
    @state() private _agendaExpanded = false;
    private _agendaKey = '';
    @state() private _agendaSelected = false;
    @state() private _agendaTrace?: string;
    @state() private _agendaError?: { key: string; text: string };
    private _agendaDisclosures = new Map<string, string>();

    private get _hasMonthAgenda() {
        return this.monthAgendaPresentation === 'accordion' && this.monthDayBehavior !== 'day';
    }

    private get _inMonthAgenda() {
        return this.viewMode === 'month' && this._hasMonthAgenda && this._agendaSelected;
    }

    /**
     * The currently displayed date. Assigning a new value navigates
     * the calendar to that date. Defaults to today.
     */
    get activeDate(): CalendarDate {
        return this._viewState.activeDate;
    }

    set activeDate(value: CalendarDate) {
        this._viewState.setActiveDate(value);
    }

    /** Public view control. State synchronization is reported after rendering. */
    @property({ type: String, attribute: 'view-mode', noAccessor: true })
    get viewMode(): ViewMode {
        return this._viewState.viewMode;
    }

    set viewMode(value: ViewMode) {
        if (value !== 'day') this._densityReturn = undefined;
        this._viewState.setViewMode(value);
    }

    /** Half-open ISO civil-date range actually rendered, including month spillover. */
    get visibleRange(): CalendarVisibleRange {
        const active = DateTime.fromObject(this.activeDate, { zone: 'UTC' });
        let start = active.startOf('day');
        let end = start.plus({ days: 1 });
        if (this.viewMode === 'month' && !this._inMonthAgenda) {
            const dates = getMonthCalendarArray(this.activeDate, this.firstDayOfWeek);
            if (dates?.length) {
                start = DateTime.fromObject(dates[0], { zone: 'UTC' });
                end = DateTime.fromObject(dates[dates.length - 1], { zone: 'UTC' }).plus({
                    days: 1,
                });
            }
        } else if (this.viewMode === 'week') {
            const { visibleDates } = this._weekContext();
            start = DateTime.fromObject(visibleDates[0], { zone: 'UTC' });
            end = DateTime.fromObject(visibleDates[visibleDates.length - 1], { zone: 'UTC' }).plus({
                days: 1,
            });
        } else if (this.viewMode === 'year') {
            start = active.startOf('year');
            end = start.plus({ years: 1 });
        }
        // Spillover cells can cross the supported public date domain. Bound data
        // work to years 1–9999 and one exclusive upper sentinel.
        const minimum = DateTime.utc(1, 1, 1);
        const maximum = DateTime.utc(10000, 1, 1);
        if (start < minimum) start = minimum;
        if (end > maximum) end = maximum;
        return { start: start.toFormat('yyyy-MM-dd'), end: end.toFormat('yyyy-MM-dd') };
    }

    /**
     * Array of calendar events to display. Provide a new array reference
     * when mutating (Lit requires immutable updates to detect changes).
     * Invalid entries (end before start) are automatically dropped.
     */
    @property({ type: Array })
    entries: CalendarEntry[] = [];

    /** Owner-supplied fetch state; an empty entries array alone does not imply loading. */
    @property({ type: Boolean }) loading = false;
    /** Owner-supplied, user-facing fetch failure. Rendered as escaped text. */
    @property({ type: String }) error = '';

    /**
     * Primary accent color used for header buttons, highlights, and gradients.
     * Accepts the documented hex, named, rgb()/rgba() and hsl()/hsla() formats.
     * Alpha is discarded; unsupported or malformed values use a safe fallback.
     */
    @property({ type: String })
    color = '#000000';

    get _expandedDate(): CalendarDate | undefined {
        return this._viewState.expandedDate;
    }

    @state() _calendarWidth: number = (typeof window !== 'undefined' && window.innerWidth) || 1024;

    @state() private _localeReady = true;
    @state() private _localeVersion = 0;

    @state() _menuOpen = false;
    @state() _menuEventDetails?: {
        heading: string;
        content: string;
        time?: CalendarTimeInterval;
        displayTime: string;
        date?: CalendarDate;
        anchorRect?: DOMRect;
        entry?: CalendarEntry;
        eventId?: string;
    };
    private _menuTriggerEntry?: HTMLElement;
    private _localeLoad: Promise<void> = Promise.resolve();
    private _localeGeneration = 0;
    @state() private _localeError = false;
    private _derivedRangeKey = '';
    private _lastStateKey = '';
    private _midnightTimer?: ReturnType<typeof setTimeout>;
    private _validationIssues: EntryValidationIssue[] = [];
    private _focusToRestore?: { eventId: string; slot: string };
    @state() private _entriesError = '';

    private _processedEntries: NormalizedCalendarEntry[] = [];

    // ── Memoized derived data (recomputed only when `entries` changes) ──
    // Think of these as `useMemo(() => …, [entries])` — willUpdate is the
    // dependency check, and render methods are pure consumers.

    /** All entries expanded across their date spans (shared by every view). */
    private _expandedEntries: ExpandedCalendarEntry[] = [];

    /** Month view: sorted + color-annotated, ready for _renderEntries. */
    private _monthViewSorted: Array<{
        entry: ExpandedCalendarEntry;
        background: string;
        originalIndex: number;
    }> = [];

    /** Per-day cardinality for accessible date labels and contextual headings. */
    private _entrySumByDay: Record<string, number> = {};

    /** Month view: cached all-day layout data per week row. */
    private _monthAllDayLayoutCache: Array<{
        weekEntries: Array<{
            entry: ExpandedCalendarEntry;
            background: string;
            originalIndex: number;
        }>;
        rowAssignments: Map<string, number>;
        mergedEvents: Map<string, AllDayEvent>;
    }> = [];

    /** Day/week view: expanded entries grouped by ISO date for O(1) lookup. */
    private _expandedByISODate = new Map<string, ExpandedCalendarEntry[]>();

    /** Day/week view: cached LayoutCalculator results keyed by ISO date. */
    private _layoutCache = new Map<string, LayoutResult>();

    /** Day/week view: cached all-day row assignments keyed by week/day key. */
    private _allDayLayoutCache = new Map<
        string,
        {
            rowAssignments: Map<string, number>;
            mergedEvents: Map<string, AllDayEvent>;
            totalRows: number;
        }
    >();

    @state() private _timeGridScale = 0.8;
    @state() private _timeGridMinimum = 24;
    @state() private _timeGridStackMinimum = 40;
    @state() private _timeGridForceStack = false;
    @state() private _timeGridColumnWidth = 0;
    private _densityMinimumWidth = 128;
    private _timeGridFont = 16;
    private _timeGridHost?: LMSCalendarDay | LMSCalendarWeek;
    private _timeGridObserver?: MutationObserver;
    private _timeAnchor?: number;
    private _timeRestoreGeneration = 0;
    private _resizeObserver?: ResizeObserver;
    private _containerFrame = 0;

    static override styles = css`
        :host {
            display: block;
            contain: layout style;
            min-inline-size: 0;
            /* Override grid/flex automatic minimum size so that an
               external height (e.g. height: 100% on a grid item) is
               the real constraint — not the min-content height. */
            min-height: 0;

            --shadow-sm: none;
            --shadow-md: none;
            --shadow-lg: none;
            --shadow-hv: none;

            --breakpoint-xs: 425px;
            --breakpoint-sm: 768px;
            --breakpoint-md: 1024px;

            --separator-light: rgba(0, 0, 0, 0.1);
            --separator-mid: rgba(0, 0, 0, 0.4);
            --separator-dark: rgba(0, 0, 0, 0.7);

            --system-ui: inherit;
            --monospace-ui: monospace;

            --border-radius-sm: 0;
            --border-radius-md: 0;
            --border-radius-lg: 0;

            --background-color: Canvas;
            --primary-color: var(--calendar-accent, Highlight);

            /* Interaction tokens — neutral by default */
            --transition-speed: 0s;
            --hover-bg: transparent;
            --focus-bg: transparent;
            --peek-active-bg: transparent;
            --context-bg: transparent;
            --active-indicator-bg: transparent;
            --active-indicator-shadow: none;

            /* Float text tokens */
            --float-text-bg: transparent;
            --float-text-border-radius: 0;
            --float-text-shadow: none;

            /* Menu animation tokens */
            --menu-transform-origin: scale(1);
            --menu-transform-active: scale(1);
            --export-hover-opacity: 1;

            --height: 100%;
            --width: 100%;

            /* Entry design tokens - responsive and density-aware */
            --entry-font-size: 0.75rem;
            --entry-line-height: 1.2;
            --entry-min-height: 1.2em;
            --entry-border-radius: 0;
            --entry-background-color: transparent;
            --entry-color: inherit;
            --entry-highlight-color: rgba(0, 0, 0, 0.08);
            --entry-highlight-color: color-mix(in srgb, var(--primary-color) 12%, transparent);
            --entry-focus-color: var(--primary-color);
            --entry-padding: 0.15em 0.3em;
            --entry-font-family: system-ui;
            --entry-gap: 0.25em;

            /* Month view dot indicator tokens */
            --entry-dot-size: 6px;
            --entry-dot-margin: 0.25em;
            --entry-month-background: transparent;
            --entry-month-padding: 0.05em 0.25em 0.05em 0;
            --entry-time-font: var(--monospace-ui);
            --entry-time-align: right;
            --entry-month-text-color: var(--separator-dark);

            /* Entry typography tokens */
            --entry-title-wrap: nowrap;
            --entry-time-font-size: 0.85em;
            --entry-time-opacity: 1;
            --title-column-weight: inherit;

            /* Entry density mode tokens */
            --entry-compact-show-time: none;
            --entry-layout: row;
            --entry-align: flex-start;

            /* Responsive scaling for different viewport sizes */
            --entry-font-size-sm: 0.75rem;
            --entry-font-size-md: 0.8125rem;
            --entry-font-size-lg: 0.875rem;

            --context-height: 1.75em;
            --context-padding: 0.25em;
            --context-text-align: start;

            /* Core layout tokens */
            --time-column-width: 4em;

            /* Time grid sizing — replaces 1440-row grid */
            --minute-height: 0.8px;
            --hour-height: calc(60 * var(--minute-height));
            --day-total-height: calc(1440 * var(--minute-height));

            /* Snap section: all views share a half-day rhythm.
               Day/week snap at noon; year view splits 6+6 months
               at the same scroll offset. */
            --half-day-height: calc(var(--day-total-height) / 2);

            /* Deprecated: kept for consumers who read them, no longer used internally */
            --grid-rows-per-day: 1440;
            --calendar-grid-rows-time: repeat(var(--grid-rows-per-day), 1fr);

            /* Week view condensed tokens */
            --week-day-count: 7;
            --week-mobile-day-count: 3;
            --week-min-day-width: 8em;
            --week-mobile-breakpoint: 768px;

            /* Grid template tokens */
            --calendar-grid-columns-day: var(--time-column-width) 1fr;
            --calendar-grid-columns-week: var(--time-column-width) repeat(7, 1fr);
            --calendar-grid-columns-month: repeat(7, 1fr);

            /* Calculated heights */
            --view-container-height: 100%;

            /* Day/week view header height */
            --day-header-height: 2.5em;
            --day-gap: 1px;
            --day-text-align: center;
            --day-padding: 0.5em;
            --all-day-row-height: max(24px, 1.5rem);
            --day-all-day-font-size: 0.875rem;
            --day-all-day-margin: 0 1.25em 0 4.25em;
            --hour-text-align: center;
            --indicator-top: -0.6em;
            --calendar-border-color: var(--separator-light);
            --separator-border: 1px solid var(--separator-light);
            --sidebar-border: 1px solid var(--separator-light);

            /* Typography tokens */
            --hour-indicator-font-size: 0.8125em;
            --hour-indicator-color: var(--header-text-color, rgba(0, 0, 0, 0.6));
            --day-label-font-weight: inherit;
            --day-label-name-font-size: 0.75em;
            --day-label-number-font-size: 1.125em;
            --day-label-number-font-weight: inherit;
            --day-label-gap: 0.15em;

            --header-height: 3.5em;
            --header-height-mobile: 4.5em;
            --header-info-padding-inline-start: var(--header-info-padding-left, 1em);
            --header-text-color: inherit;
            --header-buttons-padding-inline-end: var(--header-buttons-padding-right, 1em);
            --button-padding: 0.75em;
            --button-border-radius: var(--border-radius-sm);

            --month-day-gap: 1px;
            --indicator-color: currentColor;
            --indicator-font-weight: inherit;
            --indicator-backdrop-filter: none;
            --month-indicator-border-radius: 0;
            --indicator-padding: 0.25em;
            --indicator-margin-bottom: 0.25em;

            --menu-min-width: 17.5em;
            --menu-max-width: 20em;
            --menu-header-padding: 0.75em 1em;
            --menu-content-padding: 1em;
            --menu-item-padding: 0.75em;
            --menu-item-margin-bottom: 0.75em;
            --menu-item-font-weight: inherit;
            --menu-button-size: 2em;
            --menu-button-padding: 0.5em;
            --menu-title-font-size: 0.875em;
            --menu-title-font-weight: inherit;
            --menu-content-font-size: 0.875em;
            --menu-detail-label-min-width: 4em;
            --menu-detail-label-font-size: 0.8125em;
            --menu-detail-gap: 0.5em;

            /* Year view tokens */
            /* Wide Year grids fit columns intrinsically; explicit consumer
               --year-grid-columns overrides remain authoritative. */
            --year-grid-columns-tablet: 2;
            --year-grid-columns-mobile: 1;
            --year-month-label-font-size: 1em;
            --year-day-font-size: 0.8125em;
            --year-cell-size: 1.8em;
            --year-dot-color: var(--indicator-color, var(--primary-color));
            --year-heatmap-1: rgba(59, 130, 246, 0.15);
            --year-heatmap-2: rgba(59, 130, 246, 0.35);
            --year-heatmap-3: rgba(59, 130, 246, 0.55);
            --year-heatmap-4: rgba(59, 130, 246, 0.75);
            --year-day-cell-border-radius: 0;
            --year-month-label-hover-color: inherit;
            --year-weekday-font-weight: inherit;
            --month-label-font-weight: inherit;
            --cw-hover-color: inherit;
            --cw-hover-bg: transparent;
            --current-day-bg: Highlight;
            --current-day-color: HighlightText;
            --current-day-font-weight: inherit;
            --current-day-hover-opacity: 1;
            --current-dot-bg: Canvas;
            --year-heatmap-4-text: inherit;

            /* Year view — calendar week column */
            --year-cw-width: 1.8em;
            --year-cw-font-size: 0.875em;
            --year-cw-color: var(--header-text-color, var(--separator-dark));

            /* Multi-day separator */
            --multi-day-separator: none;
        }
        .calendar-container.locale-loading > header,
        .calendar-container.locale-loading > .calendar-view {
            visibility: hidden;
        }
        .calendar-container {
            box-sizing: border-box;
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--calendar-border-radius, var(--border-radius-lg));
            border: 1px solid var(--calendar-border-color);
            font-family: var(--system-ui);
            color: inherit;
            box-shadow: var(--calendar-shadow, none);
            contain: layout style;
            position: relative;
            overflow: var(--calendar-overflow, hidden);
            display: flex;
            flex-direction: column;
        }
        /* Month participates in document flow, including inside an older
           fixed-height embed. Its intrinsic minimum prevents overlap/clipping. */
        :host([data-view-mode='month']) {
            /* Month deliberately has no viewport, even when the embedding
               application supplies an inline height for the time-grid views. */
            block-size: auto !important;
            min-block-size: max-content;
        }
        .calendar-container.month-flow {
            height: auto;
            overflow: visible;
        }
        header {
            flex-shrink: 0;
        }
        .calendar-view {
            flex: 1;
            min-height: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        .month-flow > .calendar-view {
            flex: 0 0 auto;
            min-block-size: min-content;
            overflow: visible;
        }
        .calendar-view:is(.time-grid, .agenda-view, .year-view) {
            /* A definite flex basis is the fallback in an auto-height embed.
               With an embed height, the viewport still takes the remaining space. */
            flex: 1 1 auto;
            block-size: min(36rem, 65vh);
            block-size: min(36rem, 65dvb);
        }
        .calendar-view.time-grid {
            overflow-x: auto;
            overflow-y: hidden;
        }
        .year-view {
            container: year-viewport / size;
        }
        :host([data-view-mode='week']) .calendar-view.time-grid {
            container: week-viewport / size;
        }
        .time-grid > :is(lms-calendar-day, lms-calendar-week) {
            min-inline-size: max(240px, 15em);
            flex-shrink: 0;
        }
        .calendar-view.agenda-view {
            overflow-y: auto;
        }

        .calendar-error {
            margin: 0.5em 1em;
        }
        .calendar-progress {
            inline-size: calc(100% - 2em);
            margin: 0.5em 1em;
            flex-shrink: 0;
        }
        .date-agenda {
            container-type: inline-size;
            flex: 0 0 auto;
            min-inline-size: 0;
            padding: 0.9em 1em 1em;
        }
        /* Only the list below a borderless compact grid needs its own divider. */
        lms-calendar-month[compact] + .date-agenda {
            border-block-start: 1px solid var(--separator-light);
        }
        .date-agenda > header {
            display: flex;
            align-items: start;
            justify-content: space-between;
            gap: 0.75em;
            padding-block-end: 0.6em;
        }
        .date-agenda > header > div {
            flex: 1;
            min-inline-size: 0;
            overflow-wrap: anywhere;
        }
        .date-agenda h2 {
            inline-size: fit-content;
            margin: 0;
            font-size: 1em;
            font-weight: 600;
        }
        .agenda-count {
            margin: 0.25em 0 0;
            font-size: 0.8em;
            color: var(--header-text-color, inherit);
        }
        .agenda-action {
            flex-shrink: 0;
            min-block-size: 32px;
            min-inline-size: 32px;
            padding: 0.25em 0.5em;
            font: inherit;
            color: inherit;
            background: transparent;
            border: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm);
            cursor: pointer;
        }
        .agenda-section-heading {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.25em 0.75em;
        }
        .agenda-text {
            min-inline-size: 44px;
            min-block-size: 44px;
            max-inline-size: 100%;
            padding: 0.25em 0.5em;
            border: 0;
            background: none;
            color: inherit;
            font: inherit;
            overflow-wrap: anywhere;
            cursor: pointer;
        }
        .agenda-back {
            max-inline-size: 50%;
        }
        .agenda-text:hover {
            text-decoration: underline;
            text-underline-offset: 0.25em;
        }
        .agenda-text:focus-visible {
            outline: 2px solid var(--entry-focus-color, Highlight);
            outline-offset: -2px;
        }
        .accordion-agenda .agenda-event {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0.2em;
        }
        .agenda-details {
            overflow-wrap: anywhere;
        }
        .agenda-details {
            padding: 0 0.75em 0.4em;
        }
        .agenda-details p {
            margin: 0.65em 0;
            white-space: pre-wrap;
        }
        .agenda-group {
            margin: 0.5em 0 0.25em;
            font-size: 0.8em;
            font-weight: 600;
        }
        .agenda-events {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .all-day .agenda-event {
            grid-template-columns: minmax(0, 1fr);
        }
        .agenda-more {
            margin-block-start: 0.75em;
        }
        .all-day-count {
            min-inline-size: 0;
            min-block-size: 44px;
            padding: 0.125em;
            border: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm);
            background: var(--background-color);
            color: inherit;
            font: inherit;
            font-variant-numeric: tabular-nums;
            overflow-wrap: anywhere;
            cursor: pointer;
        }
        .all-day-count,
        .time-group strong {
            font-weight: 600;
        }
        .all-day-count:hover {
            background: var(--hover-bg);
        }
        .all-day-count:focus-visible {
            outline: 2px solid var(--entry-focus-color, Highlight);
            outline-offset: -2px;
        }
        .agenda-toggle,
        .all-day-list-close {
            min-block-size: 44px;
            max-inline-size: 50%;
        }
        .agenda-toggle {
            display: grid;
        }
        .all-day-list-close {
            overflow-wrap: anywhere;
        }
        .agenda-toggle > span {
            grid-area: 1 / 1;
            align-self: center;
            overflow-wrap: anywhere;
        }
        .agenda-toggle[aria-expanded='true'] .when-closed,
        .agenda-toggle[aria-expanded='false'] .when-open {
            visibility: hidden;
        }
        .agenda-span-range {
            grid-column: 1 / -1;
            font-size: 0.8em;
            overflow-wrap: anywhere;
        }
        .agenda-events li + li {
            border-block-start: 1px solid var(--separator-light);
        }
        .agenda-event {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            align-items: start;
            gap: 0.65em;
            inline-size: 100%;
            box-sizing: border-box;
            min-block-size: 44px;
            padding: 0.7em 0.5em;
            border: 0;
            border-inline-start: 3px solid var(--list-event-color, var(--primary-color));
            background: transparent;
            color: inherit;
            text-align: start;
            font: inherit;
            cursor: pointer;
        }
        @container (min-width: 20em) {
            .agenda-event {
                grid-template-columns: minmax(0, 8.5em) minmax(0, 1fr);
            }
        }
        .agenda-time {
            font-size: 0.8em;
            padding-block-start: 0.1em;
            overflow-wrap: anywhere;
        }
        .agenda-title {
            font-weight: 500;
            overflow-wrap: anywhere;
            min-inline-size: 0;
        }
        .agenda-event:hover,
        .agenda-event[aria-expanded='true'] {
            background: var(--hover-bg);
        }
        .agenda-event:focus-visible,
        .agenda-action:focus-visible,
        .time-group:focus-visible {
            outline: 2px solid var(--entry-focus-color, Highlight);
            outline-offset: -2px;
        }
        .time-group-range {
            box-sizing: border-box;
            border-inline-start: 1px dashed var(--separator-mid);
            padding-inline-start: 3px;
        }
        .time-group {
            position: sticky;
            inset-block-start: 0;
            inline-size: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: start;
            gap: 0;
            padding: 0.15em;
            min-block-size: 44px;
            min-inline-size: 24px;
            border: 1px solid var(--separator-light);
            border-inline-start: 3px solid var(--separator-mid);
            background: var(--background-color);
            color: inherit;
            text-align: start;
            font: inherit;
            cursor: pointer;
            overflow: hidden;
        }
        .time-group strong {
            inline-size: 100%;
            min-inline-size: 0;
            flex-shrink: 0;
            font-size: 0.875em;
            line-height: 1.2;
            overflow-wrap: anywhere;
            text-decoration: underline;
            text-underline-offset: 0.15em;
        }
        .group-meta {
            inline-size: 100%;
            min-block-size: 0;
            font-size: 0.75em;
        }
        .group-meta bdi {
            display: block;
            line-height: 1.2;
            padding-block-start: 0.1em;
            overflow-wrap: anywhere;
        }
        @media (pointer: coarse) {
            .agenda-action {
                min-block-size: 44px;
                min-inline-size: 44px;
            }
        }
        @media (forced-colors: active) {
            .agenda-event:focus-visible,
            .agenda-action:focus-visible,
            .time-group:focus-visible {
                outline-color: Highlight;
            }
            .agenda-event {
                border-inline-start-color: CanvasText;
            }
        }
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
            border: 0;
        }
        /* Follow the observed embed width, not the containing page viewport. */
        :host([data-calendar-size='small']) {
            --entry-font-size: var(--entry-font-size-sm);
            --entry-padding: 0.1em 0.2em;
            --entry-gap: 0.15em;
            --entry-line-height: 1.15;
            --entry-min-height: 1.1em;
            --entry-compact-show-time: none;
        }

        :host([data-calendar-size='medium']) {
            --entry-font-size: var(--entry-font-size-md);
            --entry-padding: 0.15em 0.25em;
            --entry-gap: 0.2em;
            --entry-line-height: 1.2;
            --entry-compact-show-time: none;
        }

        :host([data-calendar-size='large']) {
            --entry-font-size: var(--entry-font-size-lg);
            --entry-compact-show-time: inline;
        }
    `;

    override connectedCallback() {
        super.connectedCallback();
        this._lastStateKey = '';
        this.requestUpdate();
        this._scheduleMidnightRefresh();
        void this.updateComplete.then(() => {
            if (!this.isConnected) return;
            this._observeContainer();
        });
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver?.disconnect();
        cancelAnimationFrame(this._containerFrame);
        this._containerFrame = 0;
        this._timeGridObserver?.disconnect();
        this._timeGridHost = undefined;
        this._timeRestoreGeneration++;
        clearTimeout(this._midnightTimer);
    }

    protected override updated(
        changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        this.setAttribute('data-view-mode', this.viewMode);
        if (this._menuOpen) {
            const menu = this.shadowRoot?.querySelector<LMSCalendarMenu>('lms-menu');
            if (menu)
                menu.containment =
                    this.shadowRoot?.querySelector<HTMLElement>('.calendar-view') ?? this;
        }
        const focus = this._focusToRestore;
        this._focusToRestore = undefined;
        if (
            focus &&
            !this.shadowRoot?.activeElement &&
            (document.activeElement === document.body || document.activeElement === this)
        ) {
            const entry = [
                ...(this.shadowRoot?.querySelectorAll<LMSCalendarEntry>('lms-calendar-entry') ??
                    []),
            ].find(
                (candidate) => candidate.eventId === focus.eventId && candidate.slot === focus.slot,
            );
            const destination =
                entry && getComputedStyle(entry).display !== 'none'
                    ? entry
                    : this.shadowRoot?.querySelector<HTMLElement>('[data-menu-focus-fallback]');
            destination?.focus({ preventScroll: true });
        }
        this._observeTimeGrid();
        if (changedProperties.has('entries' as never) && this._validationIssues.length) {
            this.dispatchEvent(
                new CustomEvent('entries-invalid', {
                    bubbles: true,
                    composed: true,
                    detail: { issues: [...this._validationIssues] },
                }),
            );
        }
        if (changedProperties.has('_entriesError' as never) && this._entriesError) {
            this.dispatchEvent(
                new CustomEvent('entries-error', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        code: 'segment-budget',
                        message: this._entriesError,
                        limit: MAX_EXPANDED_SEGMENTS,
                        range: this.visibleRange,
                    },
                }),
            );
        }
        this.setAttribute(
            'data-calendar-size',
            this._calendarWidth <= 480 ? 'small' : this._calendarWidth <= 768 ? 'medium' : 'large',
        );
        if (changedProperties.has('color' as never)) {
            const [r, g, b] = parseColorWithDefault(this.color);
            this.style.setProperty('--calendar-accent', `rgb(${r}, ${g}, ${b})`);
        }
        const state: CalendarState = Object.freeze({
            activeDate: Object.freeze(this.activeDate),
            viewMode: this.viewMode,
            firstDayOfWeek: this.firstDayOfWeek,
            range: Object.freeze(this.visibleRange),
        });
        const key = JSON.stringify(state);
        if (key !== this._lastStateKey) {
            this._lastStateKey = key;
            this.dispatchEvent(
                new CustomEvent<CalendarState>('calendar-state-change', {
                    detail: state,
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }

    private _observeTimeGrid() {
        const view =
            this.shadowRoot?.querySelector<LMSCalendarDay | LMSCalendarWeek>(
                'lms-calendar-day, lms-calendar-week',
            ) ?? undefined;
        if (view !== this._timeGridHost) {
            this._timeRestoreGeneration++;
            this._timeGridObserver?.disconnect();
            this._timeGridHost = view;
            if (view) {
                this._timeGridObserver = new MutationObserver(() =>
                    this._readTimeGridGeometry(view),
                );
                this._timeGridObserver.observe(view, {
                    attributes: true,
                    attributeFilter: ['style'],
                });
                if (this._timeAnchor !== undefined) {
                    void this._restoreTimePosition(
                        view,
                        this._timeAnchor,
                        this._timeRestoreGeneration,
                    );
                }
            }
        }
        if (view) void view.updateComplete.then(() => this._readTimeGridGeometry(view));
    }

    private _timePosition(view: LMSCalendarDay | LMSCalendarWeek) {
        const scroller = view.shadowRoot?.querySelector<HTMLElement>('.week-scroll, .main');
        const scale = parseFloat(getComputedStyle(view).getPropertyValue('--minute-height'));
        const inset = scroller ? parseFloat(getComputedStyle(scroller).paddingTop) || 0 : 0;
        return scroller && scale > 0 ? (scroller.scrollTop - inset) / scale : 0;
    }

    private async _restoreTimePosition(
        view: LMSCalendarDay | LMSCalendarWeek,
        minute: number,
        generation: number,
    ) {
        await view.updateComplete;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (
            !this.isConnected ||
            generation !== this._timeRestoreGeneration ||
            view !== this._timeGridHost
        )
            return;
        const scroller = view.shadowRoot?.querySelector<HTMLElement>('.week-scroll, .main');
        const scale = parseFloat(getComputedStyle(view).getPropertyValue('--minute-height'));
        if (scroller && scale > 0) {
            const inset = parseFloat(getComputedStyle(scroller).paddingTop) || 0;
            scroller.scrollTop = Math.round(inset + minute * scale);
        }
    }

    private _handleTimeGridResize({ currentTarget }: Event) {
        if (currentTarget === this._timeGridHost && this._timeGridHost)
            this._readTimeGridGeometry(this._timeGridHost);
    }

    private _readTimeGridGeometry(view: LMSCalendarDay | LMSCalendarWeek) {
        if (!this.isConnected || view !== this._timeGridHost) return;
        const scale = parseFloat(getComputedStyle(view).getPropertyValue('--minute-height'));
        const control = this.shadowRoot?.querySelector<HTMLElement>(
            'lms-calendar-entry[slot^="timed"]',
        );
        const style = control ? getComputedStyle(control) : undefined;
        const main = control?.shadowRoot?.querySelector<HTMLElement>('.main');
        const contentStyle = main ? getComputedStyle(main) : undefined;
        const pixels = (value?: string) => parseFloat(value ?? '') || 0;
        const lineHeight = style ? pixels(style.lineHeight) || pixels(style.fontSize) * 1.2 : 0;
        // The display floor includes a complete text line plus padding/borders,
        // not just CSS min-height. Otherwise enlarged point/short events clip.
        const contentMinimum =
            contentStyle && style
                ? lineHeight +
                  pixels(contentStyle.paddingTop) +
                  pixels(contentStyle.paddingBottom) +
                  pixels(contentStyle.borderTopWidth) +
                  pixels(contentStyle.borderBottomWidth) +
                  pixels(style.paddingTop) +
                  pixels(style.paddingBottom) +
                  pixels(style.borderTopWidth) +
                  pixels(style.borderBottomWidth)
                : 0;
        const time = main?.querySelector<HTMLElement>('.time');
        const timeStyle = time ? getComputedStyle(time) : undefined;
        const timeLine = timeStyle
            ? pixels(timeStyle.lineHeight) || pixels(timeStyle.fontSize) * 1.2
            : 0;
        const gap = pixels(contentStyle?.rowGap);
        const stackMinimum = Math.max(40, Math.ceil(contentMinimum + timeLine + gap));
        const column = view.shadowRoot?.querySelector<HTMLElement>('.day-column, .timed-content');
        const widthPercent = pixels(control?.style.width) || 100;
        const columnWidth =
            column?.getBoundingClientRect().width ??
            ((control?.getBoundingClientRect().width ?? 0) * 100) / widthPercent;
        const hostFont = pixels(getComputedStyle(this).fontSize) || 16;
        this._timeGridFont = hostFont;
        this._densityMinimumWidth = Math.max(128, hostFont * 8);
        const insets =
            pixels(contentStyle?.paddingLeft) +
            pixels(contentStyle?.paddingRight) +
            pixels(contentStyle?.marginLeft) +
            pixels(contentStyle?.marginRight) +
            pixels(style?.paddingLeft) +
            pixels(style?.paddingRight) +
            pixels(style?.borderLeftWidth) +
            pixels(style?.borderRightWidth);
        // Reserve visible title space as well as the time. A height-only rule
        // can leave a routine mobile Week event with a zero-width title.
        // Normalize the sampled card to its column; do not read every event's
        // layout on each update. Narrow overlap groups use an explicit list.
        const rowMinimum =
            (time?.getBoundingClientRect().width ?? 0) + pixels(style?.fontSize) * 3 + gap + insets;
        const forceStack = columnWidth > 0 && columnWidth < Math.max(rowMinimum, hostFont * 12);
        const minimum = Math.max(
            24,
            Math.ceil(hostFont * 2.6),
            pixels(style?.minHeight),
            pixels(contentStyle?.minBlockSize),
            Math.ceil(contentMinimum),
            forceStack ? stackMinimum : 0,
        );
        if (
            (Number.isFinite(scale) &&
                scale > 0 &&
                Math.abs(scale - this._timeGridScale) > 0.0001) ||
            minimum !== this._timeGridMinimum ||
            stackMinimum !== this._timeGridStackMinimum ||
            forceStack !== this._timeGridForceStack ||
            Math.abs(columnWidth - this._timeGridColumnWidth) > 0.5
        ) {
            if (Number.isFinite(scale) && scale > 0) this._timeGridScale = scale;
            this._timeGridMinimum = minimum;
            this._timeGridStackMinimum = stackMinimum;
            this._timeGridForceStack = forceStack;
            this._timeGridColumnWidth = columnWidth;
            this._layoutCache.clear();
        }
    }

    private _scheduleMidnightRefresh() {
        clearTimeout(this._midnightTimer);
        const now = new Date();
        const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        this._midnightTimer = setTimeout(
            () => {
                if (!this.isConnected) return;
                this.requestUpdate();
                this._scheduleMidnightRefresh();
            },
            next.getTime() - now.getTime() + 50,
        );
    }

    protected override firstUpdated(
        _changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        this._observeContainer();
    }

    private _observeContainer() {
        const container = this.shadowRoot?.firstElementChild;
        if (!container || typeof ResizeObserver === 'undefined') return;
        this._resizeObserver?.disconnect();

        // Manual ResizeObserver: only trigger re-render when width actually
        // changes. The @lit-labs ResizeController unconditionally calls
        // requestUpdate() on every observation (even height-only changes),
        // which can create a render loop when combined with view components
        // that set CSS custom properties on their host.
        this._resizeObserver = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            // A compact/expanded transition changes intrinsic Month height.
            // Commit outside the observer delivery cycle so its ancestor can
            // be observed again without an undelivered-notifications loop.
            cancelAnimationFrame(this._containerFrame);
            this._containerFrame = requestAnimationFrame(() => {
                this._containerFrame = 0;
                if (!this.isConnected || w <= 0) return;
                if (w !== this._calendarWidth) this._calendarWidth = w;
                const font = parseFloat(getComputedStyle(this).fontSize) || 16;
                this._compactMonth = w < Math.max(768, font * 48);
            });
        });
        this._resizeObserver.observe(container);
    }

    /** We filter invalid entries in the willUpdate hook, so be prepared:
     *  - This will not be shown
     *   ```json
     *   { date: ..., time: { start: { hour: 10, minute: 30 }, end: { hour: 10, minute: 00 } } }
     *  ```
     *  - The same goes for invalid dates meaning the end date being before the start date.
     *
     *  We then sort the entries inplace.
     */
    protected override willUpdate(
        changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        const previousGrid = this._timeGridHost;
        const leavingGrid =
            previousGrid &&
            (this._densityReturn || previousGrid.localName !== `lms-calendar-${this.viewMode}`);
        if (previousGrid?.isConnected && leavingGrid)
            this._timeAnchor = this._timePosition(previousGrid);
        const focused = this.shadowRoot?.activeElement;
        if (focused instanceof LMSCalendarEntry && focused.eventId) {
            this._focusToRestore = { eventId: focused.eventId, slot: focused.slot };
        }
        if (!['auto', 'inline', 'day'].includes(this.monthDayBehavior))
            this.monthDayBehavior = 'auto';
        if (!['auto', 'presence', 'previews'].includes(this.monthPresentation))
            this.monthPresentation = 'auto';
        if (!['full', 'preview', 'on-demand', 'accordion'].includes(this.monthAgendaPresentation))
            this.monthAgendaPresentation = 'full';
        if (!this._hasMonthAgenda) {
            this._agendaSelected = false;
            this._agendaTrace = undefined;
            this._agendaDisclosures.clear();
        }
        if (!['card', 'marker'].includes(this.timedEntryPresentation))
            this.timedEntryPresentation = 'card';
        if (
            this._densityReturn?.agendaDate &&
            civilDateKey(this._densityReturn.activeDate) !== civilDateKey(this.activeDate)
        )
            this._densityReturn = undefined;
        const agendaKey = `${this.viewMode}:${civilDateKey(this.activeDate)}:${this.monthAgendaPresentation}:${this._densityReturn?.key ?? ''}`;
        if (agendaKey !== this._agendaKey) {
            this._agendaKey = agendaKey;
            this._agendaLimit = 50;
            this._agendaExpanded = false;
            this._agendaError = undefined;
        }
        const canonicalLocale = normalizeLocale(this.locale);
        if (canonicalLocale !== this.locale) this.locale = canonicalLocale;
        if (
            !Number.isInteger(this.firstDayOfWeek) ||
            this.firstDayOfWeek < 0 ||
            this.firstDayOfWeek > 6
        ) {
            this.firstDayOfWeek = 1;
        }
        if (changedProperties.has('dir' as never) || changedProperties.has('locale' as never)) {
            const resolved = this.dir === 'auto' ? resolveDirection(this.locale) : this.dir;
            this._reflectingDirection = true;
            try {
                this.setAttribute('dir', resolved);
            } finally {
                this._reflectingDirection = false;
            }
        }
        if (changedProperties.has('locale' as never)) this._startLocaleLoad();

        // Controller-backed navigation does not populate changedProperties. Key
        // viewport-derived work by the committed range instead of a fictitious
        // activeDate entry in Lit's change map.
        const rangeKey = JSON.stringify([
            this.visibleRange,
            this.viewMode,
            this.firstDayOfWeek,
            this.monthPresentation,
        ]);
        const entriesChanged = changedProperties.has('entries' as never);
        if (!entriesChanged && rangeKey === this._derivedRangeKey) return;
        this._derivedRangeKey = rangeKey;
        if (!entriesChanged) {
            this._computeEntryCaches();
            return;
        }

        if (!Array.isArray(this.entries) || !this.entries.length) {
            this._validationIssues = [];
            this._entriesError = '';
            this._processedEntries = [];
            this._clearEntryCaches();
            return;
        }

        this._validationIssues = [];
        this._processedEntries = normalizeEntries(this.entries, (issue) =>
            this._validationIssues.push(issue),
        ).sort(
            (a, b) =>
                (a.time?.start.hour ?? 0) - (b.time?.start.hour ?? 0) ||
                (a.time?.start.minute ?? 0) - (b.time?.start.minute ?? 0),
        );

        this._computeEntryCaches();
    }

    // ── Memoization helpers (the "compute" side of the memo pattern) ────
    // These run once per `entries` change — equivalent to the factory
    // function inside useMemo(() => { … }, [entries]).

    private _clearEntryCaches() {
        this._expandedEntries = [];
        this._monthViewSorted = [];
        this._monthAllDayLayoutCache = [];
        this._monthSpans = [];
        this._entrySumByDay = {};
        this._expandedByISODate.clear();
        this._layoutCache.clear();
        this._allDayLayoutCache.clear();
    }

    private _computeEntryCaches() {
        // Work is bounded by the visible range, never an event's entire lifetime.
        this._entriesError = '';
        let expanded: ModelExpandedEntry[];
        try {
            expanded = expandEntries(this._processedEntries, this.visibleRange);
        } catch (error) {
            if (!(error instanceof CalendarExpansionError) || error.code !== 'segment-budget')
                throw error;
            this._clearEntryCaches();
            this._entriesError =
                'Too many event segments for this view. Choose a smaller range or provide fewer entries.';
            return;
        }
        const order = new Map(
            this._processedEntries.map((entry, index) => [entry.occurrenceId, index]),
        );
        this._expandedEntries = expanded.map((entry) => ({
            ...entry,
            originalIndex: order.get(entry.occurrenceId) ?? 0,
            originalStartDate: entry.sourceEntry.date.start,
            sourceEntry: entry.sourceEntry as CalendarEntry,
            canonicalEntry: entry.canonicalEntry as CalendarEntry,
        }));

        // 2. Group by ISO date for O(1) day/week lookups (no Luxon needed)
        this._expandedByISODate.clear();
        for (const entry of this._expandedEntries) {
            const key = civilDateKey(entry.date.start);
            let bucket = this._expandedByISODate.get(key);
            if (!bucket) {
                bucket = [];
                this._expandedByISODate.set(key, bucket);
            }
            bucket.push(entry);
        }

        // 3. Month view: partition into all-day vs timed, then sort + compute colors
        const monthAllDay: ExpandedCalendarEntry[] = [];
        const monthTimed: ExpandedCalendarEntry[] = [];
        for (const entry of this._expandedEntries) {
            if (entry.isAllDay) {
                monthAllDay.push(entry);
            } else {
                monthTimed.push(entry);
            }
        }

        this._monthViewSorted = sortMonthEntries(monthTimed);

        // 4. Month view: compute all-day row allocations per week (includes sorting)
        this._monthAllDayLayoutCache =
            this.viewMode === 'month' ? this._computeMonthAllDayLayout(monthAllDay) : [];
        this._monthSpans =
            this.viewMode === 'month' && this.monthPresentation === 'presence'
                ? buildMonthSpans(
                      getMonthCalendarArray(this.activeDate, this.firstDayOfWeek),
                      this._expandedEntries,
                  )
                : [];

        // 5. Mobile badge: aggregate per-day counts once
        this._entrySumByDay = {};
        for (const entry of this._expandedEntries) {
            const key = `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`;
            this._entrySumByDay[key] = (this._entrySumByDay[key] ?? 0) + 1;
        }

        // 6. Invalidate layout caches (entries changed, layouts are stale)
        this._layoutCache.clear();
        this._allDayLayoutCache.clear();
    }

    /**
     * Compute per-week all-day layout for month view.
     * Returns an array of 6 elements (one per week row) with row assignments.
     */
    private _computeMonthAllDayLayout(allDayEntries: ExpandedCalendarEntry[]) {
        if (allDayEntries.length === 0) return [];

        const activeDate = this._viewState.activeDate;
        if (!activeDate) return [];

        const calendarArray = getMonthCalendarArray(activeDate, this.firstDayOfWeek);
        if (!calendarArray?.length) return [];

        // Sort entries (multi-day first, then by original index) and compute colors
        const sorted = sortMonthEntries(allDayEntries);

        type WeekEntry = (typeof sorted)[number];
        const result: Array<{
            weekEntries: WeekEntry[];
            rowAssignments: Map<string, number>;
            mergedEvents: Map<string, AllDayEvent>;
        }> = [];

        for (let weekStart = 0; weekStart < calendarArray.length; weekStart += 7) {
            const weekDates = calendarArray.slice(weekStart, weekStart + 7);

            // Find all-day entries that start on any day of this week
            const weekEntries = sorted.filter(({ entry }) =>
                weekDates.some(
                    (d) =>
                        d.year === entry.date.start.year &&
                        d.month === entry.date.start.month &&
                        d.day === entry.date.start.day,
                ),
            );

            if (weekEntries.length === 0) {
                result.push({
                    weekEntries: [],
                    rowAssignments: new Map(),
                    mergedEvents: new Map(),
                });
                continue;
            }

            // Build AllDayEvent array for row allocation
            const events: AllDayEvent[] = weekEntries.map(({ entry }) => {
                const dayIndex = weekDates.findIndex(
                    (d) =>
                        d.year === entry.date.start.year &&
                        d.month === entry.date.start.month &&
                        d.day === entry.date.start.day,
                );
                return {
                    id: entry.occurrenceId,
                    days: [dayIndex >= 0 ? dayIndex : 0],
                    isMultiDay: entry.continuation?.has || entry.continuation?.is || false,
                };
            });

            // Merge multi-day events
            const mergedEvents = new Map<string, AllDayEvent>();
            for (const event of events) {
                const existing = mergedEvents.get(event.id);
                if (existing) {
                    existing.days.push(...event.days);
                } else {
                    mergedEvents.set(event.id, { ...event, days: [...event.days] });
                }
            }

            const { rowAssignments } = allocateAllDayRows(Array.from(mergedEvents.values()));
            result.push({ weekEntries, rowAssignments, mergedEvents });
        }

        return result;
    }

    /** Retry a failed locale download without changing the requested locale. */
    public retryLocale(): Promise<void> {
        this._startLocaleLoad();
        return this._localeLoad;
    }

    private _startLocaleLoad() {
        const targetLocale = this.locale;
        const generation = ++this._localeGeneration;
        this.lang = targetLocale;
        this._localeReady = isLocaleLoaded(targetLocale);
        this._localeError = false;
        const current = () => generation === this._localeGeneration && this.locale === targetLocale;
        const finish = async () => {
            if (!current()) return;
            this._localeReady = true;
            this._localeVersion++;
            const resolution = resolveLocale(targetLocale);
            const fallback = resolution.fallback || !isLocaleLoaded(targetLocale);
            this.lang = fallback ? 'en' : targetLocale;
            await this.updateComplete;
            if (!current()) return;
            this.dispatchEvent(
                new CustomEvent('locale-ready', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        locale: targetLocale,
                        fallback,
                        catalogLocale: fallback ? 'en' : resolution.catalogLocale,
                    },
                }),
            );
        };
        this._localeLoad = ensureLocale(targetLocale).then(finish, async (error: unknown) => {
            if (!current()) return;
            this._localeError = true;
            this.dispatchEvent(
                new CustomEvent('locale-error', {
                    bubbles: true,
                    composed: true,
                    detail: { locale: targetLocale, error },
                }),
            );
            await finish();
        });
    }

    /** Resolves when the current locale load/fallback and its render settle. */
    get localeReady(): Promise<void> {
        // Wait for pending property changes to select their load promise first.
        // The promise always settles, including a fallback after a failed import.
        return this.updateComplete.then(() => this._localeLoad);
    }

    private _rangeDescription(): string {
        const range = this.visibleRange;
        let formatter: Intl.DateTimeFormat;
        try {
            formatter = new Intl.DateTimeFormat(this.locale, {
                dateStyle: 'long',
                calendar: 'gregory',
                timeZone: 'UTC',
            });
        } catch {
            formatter = new Intl.DateTimeFormat('en', { dateStyle: 'long', timeZone: 'UTC' });
        }
        const start = formatter.format(DateTime.fromISO(range.start, { zone: 'UTC' }).toJSDate());
        const exclusiveEnd =
            range.end === '10000-01-01'
                ? DateTime.utc(10000, 1, 1)
                : DateTime.fromISO(range.end, { zone: 'UTC' });
        const end = formatter.format(exclusiveEnd.minus({ days: 1 }).toJSDate());
        const format = getMessageFormatters(this.locale);
        const label = getMessages(this.locale)[this._inMonthAgenda ? 'agenda' : this.viewMode];
        return `${format.viewLabel(label)}: ${start === end ? start : format.timeRange(start, end)}`;
    }

    private _weekContext() {
        return computeWeekDisplayContext(
            this.activeDate,
            this.firstDayOfWeek,
            this._calendarWidth,
            this,
        );
    }

    override render() {
        const viewMode = this._viewState.viewMode;
        const currentActiveDate = this._viewState.activeDate;
        const weekContext = viewMode === 'week' ? this._weekContext() : undefined;

        return html`
            <div class="calendar-container${viewMode === 'month' ? ' month-flow' : ''}${this._localeReady ? '' : ' locale-loading'}">
                ${
                    this._localeError
                        ? html`<slot name="locale-error"><p role="status" lang="en">
                    Translations could not be loaded; showing English.
                    <button type="button" @click=${() => this.retryLocale()}>Retry translations</button>
                </p></slot>`
                        : nothing
                }
                <header>
                    <lms-calendar-header
                        @switchdate=${this._handleSwitchDate}
                        @switchview=${this._handleSwitchView}
                        @jumptoday=${this._handleJumpToday}
                        .heading=${this.heading}
                        .activeDate=${currentActiveDate}
                        .viewMode=${viewMode}
                        .agenda=${this._inMonthAgenda}
                        .expandedDate=${viewMode === 'day' ? currentActiveDate : undefined}
                        .locale=${this.locale}
                        .localeVersion=${this._localeVersion}
                        .firstDayOfWeek=${this.firstDayOfWeek}
                        .visibleDates=${weekContext?.weekDates}
                    >
                    </lms-calendar-header>
                </header>

                <slot name="status">${this.error ? html`<p class="calendar-error" role="alert">${this.error}</p>` : this.loading ? html`<progress class="calendar-progress" aria-label=${getMessages(this.locale).calendarView}></progress>` : nothing}</slot>
                <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">${this._rangeDescription()}</p>
                <section class="calendar-view${viewMode === 'day' || viewMode === 'week' ? (this._densityReturn ? ' agenda-view' : ' time-grid') : viewMode === 'year' ? ' year-view' : ''}" style=${styleMap({ '--_time-grid-tail': `${this.timedEntryPresentation === 'card' ? this._timeGridMinimum : 0}px` })} role="region" data-menu-focus-fallback tabindex="-1" aria-label=${this._rangeDescription()} aria-busy=${this.loading ? 'true' : 'false'} @open-menu=${this._handleOpenMenu}>
                    ${this._entriesError ? html`<slot name="entries-error"><p role="alert" lang="en">${this._entriesError}</p></slot>` : nothing}
                    ${viewMode === 'month' ? this._renderMonthView() : nothing}
                    ${
                        weekContext
                            ? this._densityReturn?.agendaDate
                                ? this._renderDateAgenda(this._densityReturn.agendaDate, true)
                                : (() => {
                                      const ctx = weekContext;
                                      const result = this._renderEntriesByDate(ctx);
                                      return html`
                                      <lms-calendar-week
                                          @expand=${this._handleExpand}
                                          @peek-navigate=${this._handlePeekNavigate}
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          @time-grid-resize=${this._handleTimeGridResize}
                                          .activeDate=${currentActiveDate}
                                          .allDayRowCount=${result.allDayRowCount}
                                          .allDaySummary=${result.allDaySummary}
                                          .firstDayOfWeek=${this.firstDayOfWeek}
                                          .locale=${this.locale}
                                          .localeVersion=${this._localeVersion}
                                          .visibleDates=${ctx.visibleDates}
                                          .visibleStartIndex=${ctx.visibleStartIndex}
                                          .visibleLength=${ctx.visibleLength}
                                          style=${styleMap({
                                              '--calendar-grid-columns-week': ctx.gridColumns,
                                          })}
                                      >
                                          ${result.elements}
                                      </lms-calendar-week>
                                  `;
                                  })()
                            : nothing
                    }
                    ${
                        viewMode === 'day'
                            ? this._densityReturn
                                ? this._renderDateAgenda(currentActiveDate, true)
                                : (() => {
                                      const result = this._renderEntriesByDate();
                                      return html`
                                      <lms-calendar-day
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          @time-grid-resize=${this._handleTimeGridResize}
                                          .allDayRowCount=${result.allDayRowCount}
                                          .activeDate=${currentActiveDate}
                                          .firstDayOfWeek=${this.firstDayOfWeek}
                                          .locale=${this.locale}
                                          .localeVersion=${this._localeVersion}
                                      >
                                          ${result.elements}
                                      </lms-calendar-day>
                                  `;
                                  })()
                            : nothing
                    }
                    ${
                        viewMode === 'year'
                            ? html`
                              <lms-calendar-year
                                  @expand=${this._handleExpand}
                                  @date-navigate=${this._handleDateNavigate}
                                  .activeDate=${currentActiveDate}
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                                  .locale=${this.locale}
                                  .localeVersion=${this._localeVersion}
                                  .entrySumByDay=${this._entrySumByDay}
                                  .drillTarget=${this.yearDrillTarget}
                                  .densityMode=${this.yearDensityMode}
                              ></lms-calendar-year>
                          `
                            : nothing
                    }
                </section>

                <lms-menu
                    .placement=${'anchor'}
                    ?open=${this._menuOpen}
                    .eventDetails=${
                        this._menuEventDetails || {
                            heading: '',
                            content: '',
                            displayTime: '',
                        }
                    }
                    .anchorRect=${this._menuEventDetails?.anchorRect}
                    .locale=${this.locale}
                    .localeVersion=${this._localeVersion}
                    @menu-close=${this._handleMenuClose}
                ></lms-menu>
            </div>
        `;
    }

    private _handleSwitchDate(e: CustomEvent) {
        if (this._inMonthAgenda) {
            this.activeDate = addDisplayDays(
                this.activeDate,
                e.detail.direction === 'next' ? 1 : -1,
            );
            return;
        }
        if (e.detail.direction === 'next') {
            if (this.viewMode === 'week' && !this._densityReturn) {
                const { isCondensed, weekDates } = this._weekContext();
                // Continue at the start of the next week, not at the old window's offset.
                if (isCondensed) {
                    this._viewState.setActiveDate(addDisplayDays(weekDates[6], 1));
                    return;
                }
            }
            this._viewState.navigateNext();
        } else if (e.detail.direction === 'previous') {
            this._viewState.navigatePrevious();
        }
    }

    private _handleSwitchView(e: CustomEvent) {
        // Persistent toolbar controls retain focus when switching views.
        this._densityReturn = undefined;
        this.viewMode = e.detail.view;
    }

    private async _focusView() {
        await this.updateComplete;
        if (!this.isConnected) return;
        const view = this.shadowRoot?.querySelector<
            LMSCalendarMonth | LMSCalendarYear | LMSCalendarDay | LMSCalendarWeek
        >('lms-calendar-month, lms-calendar-year, lms-calendar-day, lms-calendar-week');
        if (view) await view.focusDate(this.activeDate);
        else
            this.shadowRoot
                ?.querySelector<HTMLElement>(
                    this._inMonthAgenda ? '#agenda-date' : '[data-menu-focus-fallback]',
                )
                ?.focus();
    }

    private async _handleDateNavigate(e: CustomEvent<{ date: CalendarDate }>) {
        this.activeDate = e.detail.date;
        await this._focusView();
    }

    private _handleJumpToday(_e: CustomEvent) {
        this._viewState.jumpToToday();
    }

    private _handlePeekNavigate(e: CustomEvent) {
        // Shift active date to the target day, staying in week view
        this._viewState.setActiveDate(e.detail.date);
        void this._focusView();
    }

    private _handleExpand(e: CustomEvent) {
        this._densityReturn = undefined;
        this._viewState.setActiveDate(e.detail.date);
        const target = e.detail.drillTarget || 'day';
        if (target === 'month') {
            this._agendaSelected = false;
            this._viewState.switchToMonthView();
        } else if (target === 'week') {
            this._viewState.switchToWeekView();
        } else {
            this._viewState.switchToDayView();
        }
        void this._focusView();
    }

    private _handleOpenMenu(e: CustomEvent) {
        const path = e.composedPath();
        const clickedEntry = path.find(
            (target): target is LMSCalendarEntry => target instanceof LMSCalendarEntry,
        );
        const invoker =
            clickedEntry ??
            path.find(
                (target): target is HTMLElement =>
                    target instanceof HTMLElement && target.hasAttribute('data-entry-request'),
            );
        // Ancestor listeners must see the original request before its default
        // action. A handler on an internal view runs before host bubbling.
        queueMicrotask(() => {
            if (!this.isConnected || e.defaultPrevented) {
                clickedEntry?.clearSelection();
                return;
            }
            const canonical = e.detail.entry ?? clickedEntry?.canonicalEntry;
            if (
                canonical &&
                !this._allowEntryActivation(canonical, e.detail.eventId ?? clickedEntry?.eventId)
            ) {
                clickedEntry?.clearSelection();
                return;
            }
            this.shadowRoot?.querySelectorAll('lms-calendar-entry').forEach((entry) => {
                if (entry !== clickedEntry) entry.clearSelection();
            });
            this._menuTriggerEntry = invoker;
            this.openMenu({ ...e.detail, entry: canonical });
        });
    }

    private _allowEntryActivation(entry: CalendarEntry, eventId?: string) {
        return this.dispatchEvent(
            new CustomEvent('entry-activate', {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: { entry, eventId },
            }),
        );
    }

    private _handleClearOtherSelections(e: CustomEvent) {
        // Clear all selections except the entry that triggered this event
        const focusedEntry = e.detail.exceptEntry as LMSCalendarEntry;
        this.shadowRoot?.querySelectorAll('lms-calendar-entry').forEach((entry) => {
            if (entry !== focusedEntry) {
                (entry as LMSCalendarEntry).clearSelection();
            }
        });
    }

    private _handleMenuClose() {
        this._menuOpen = false;
        this._menuEventDetails = undefined;
        // Clear the trigger entry's highlight before returning focus,
        // so it can be clicked again immediately.
        if (this._menuTriggerEntry instanceof LMSCalendarEntry) {
            this._menuTriggerEntry.clearSelection();
        }
        // Menu owns focus restoration. In particular, a non-modal light dismiss
        // must not steal focus back from another control the user just chose.
        this._menuTriggerEntry = undefined;
    }

    /**
     * Opens the built-in detail menu overlay.
     *
     * Use this to show the same menu from external UI (e.g., a sidebar list item).
     * The menu will position itself relative to `anchorRect` if provided.
     *
     * @param eventDetails - The event data to display in the menu.
     */
    public openMenu(eventDetails: {
        heading: string;
        content: string;
        time?: CalendarTimeInterval;
        displayTime: string;
        date?: CalendarDate;
        anchorRect?: DOMRect;
        entry?: CalendarEntry;
        eventId?: string;
    }) {
        const menu = this.shadowRoot?.querySelector<LMSCalendarMenu>('lms-menu');
        if (menu)
            menu.containment =
                this.shadowRoot?.querySelector<HTMLElement>('.calendar-view') ?? this;
        this._menuEventDetails = eventDetails;
        this._menuOpen = true;
    }

    private _composeEntry({
        index,
        slot,
        inlineStyle,
        entry,
        isContinuation = false,
        density,
        displayMode = 'default',
        floatText = false,
        spanClass,
    }: {
        index: number;
        slot: string;
        inlineStyle: string;
        entry: Partial<CalendarEntry> & {
            sourceEntry?: CalendarEntry;
            canonicalEntry?: CalendarEntry;
            sourceId?: string;
            occurrenceId?: string;
            segmentId?: string;
            accessibility?: {
                tabIndex: number;
                role: 'button';
                ariaLabel: string;
            };
        };
        isContinuation?: boolean;
        density?: 'compact' | 'standard' | 'full';
        displayMode?: 'default' | 'month-dot' | 'month-span' | 'time-mark';
        floatText?: boolean;
        spanClass?: string;
    }) {
        // Determine density based on event duration and context if not explicitly set
        const determinedDensity = density || this._determineDensity(entry);

        const canonicalEntry =
            entry.canonicalEntry ?? entry.sourceEntry ?? (entry as CalendarEntry);
        const eventId = entry.sourceId ?? entry.id;
        return {
            key: entry.segmentId ?? `${entry.occurrenceId ?? eventId ?? index}@${slot}`,
            template: html`
            <lms-calendar-entry
                data-event-id=${eventId ?? ''}
                class=${`_${index}${spanClass ? ` ${spanClass}` : ''}`}
                slot=${slot}
                style=${inlineStyle}
                .time=${entry.time}
                .heading=${entry.heading ?? ''}
                .content=${entry.content}
                .isContinuation=${entry.isContinuation ?? isContinuation}
                .date=${entry.date}
                .density=${determinedDensity}
                .displayMode=${displayMode}
                .floatText=${floatText}
                .accessibility=${entry.accessibility}
                .canonicalEntry=${canonicalEntry}
                .eventId=${eventId}
                .locale=${this.locale}
                .localeVersion=${this._localeVersion}
            >
            </lms-calendar-entry>
        `,
        } satisfies EntryRender;
    }

    private _safeEntryColor(color?: string): string {
        if (!color) return 'var(--primary-color)';
        const [r, g, b] = parseColorWithDefault(color);
        return `rgb(${r}, ${g}, ${b})`;
    }

    private _determineDensity(entry: Partial<CalendarEntry>): 'compact' | 'standard' | 'full' {
        if (!entry.time) return 'compact'; // Default to compact for month view

        const durationMinutes =
            (entry.time.end.hour - entry.time.start.hour) * 60 +
            (entry.time.end.minute - entry.time.start.minute);

        // For non-overlapping events, use duration-based density
        if (durationMinutes < 30) {
            return 'compact';
        }

        if (durationMinutes > 120 && entry.content) {
            return 'full';
        }

        return 'standard';
    }

    /**
     * Render all entries for month view (both all-day and timed).
     * All-day entries use connected bar styling, timed entries use dot indicators.
     * All entries go into the same per-day slots.
     */
    private get _inlineMonth() {
        return (
            this.monthPresentation !== 'auto' ||
            this.monthDayBehavior === 'inline' ||
            (this.monthDayBehavior === 'auto' && this._compactMonth)
        );
    }

    private _renderMonthView() {
        return this._inMonthAgenda
            ? this._renderDateAgenda(this.activeDate, false)
            : this._renderMonthGrid();
    }

    private _renderMonthGrid() {
        const trace =
            this._hasMonthAgenda && this._agendaTrace
                ? this._expandedEntries.filter(
                      (entry) =>
                          entry.sourceId === this._agendaTrace && entry.continuation.total > 1,
                  )
                : [];
        const compact =
            this.monthPresentation === 'presence' ||
            (this.monthPresentation === 'auto' &&
                (this._compactMonth || this.monthDayBehavior === 'inline'));
        return html`
            <lms-calendar-month
                @expand=${this._handleMonthDate}
                @date-summary=${this._handleMonthDate}
                @date-navigate=${this._handleDateNavigate}
                @clear-other-selections=${this._handleClearOtherSelections}
                .activeDate=${this.activeDate}
                .firstDayOfWeek=${this.firstDayOfWeek}
                .locale=${this.locale}
                .localeVersion=${this._localeVersion}
                .entryCounts=${this._entrySumByDay}
                .compact=${compact}
                .spans=${this.monthPresentation === 'presence' ? this._monthSpans : []}
                .selectedDate=${this._inlineMonth || this._hasMonthAgenda ? this.activeDate : undefined}
                .trace=${trace}
            >${compact ? nothing : this._renderMonthEntries()}</lms-calendar-month>
            ${this._inlineMonth && !this._hasMonthAgenda ? this._renderDateAgenda(this.activeDate, false) : nothing}
        `;
    }

    private _handleMonthDate(e: CustomEvent<{ date: CalendarDate; view: ViewMode }>) {
        if (!this._inlineMonth && !this._hasMonthAgenda) {
            this._handleExpand(e);
            return;
        }
        this.activeDate = e.detail.date;
        if (this._hasMonthAgenda) this._agendaSelected = true;
        void this._focusView();
    }

    private _entryTimeLabel(entry: ModelExpandedEntry, range = true) {
        if (entry.isAllDay) return getMessages(this.locale).allDay;
        return this._timeLabel(entry.time, range);
    }

    private _timeLabel(time?: CalendarTimeInterval, range = true) {
        if (!time) return '';
        const { start, end } = time;
        const first = formatLocalizedTime(start.hour, start.minute, this.locale);
        return range && (start.hour !== end.hour || start.minute !== end.minute)
            ? getMessageFormatters(this.locale).timeRange(
                  first,
                  formatLocalizedTime(end.hour, end.minute, this.locale),
              )
            : first;
    }

    /** A readable, bounded rendering of real occurrences, never synthetic events. */
    private _renderDateAgenda(date: CalendarDate, density: boolean) {
        const accordion = this._inMonthAgenda && !density;
        if (this._entriesError && !accordion) return nothing;
        const key = civilDateKey(date);
        const drillIn = density ? this._densityReturn : undefined;
        const scope = drillIn?.segmentIds ? new Set(drillIn.segmentIds) : undefined;
        const entries = [...(this._expandedByISODate.get(key) ?? [])]
            .filter((entry) =>
                drillIn?.agendaDate ? entry.isAllDay : !scope || scope.has(entry.segmentId),
            )
            .sort((a, b) => {
                const allDay = Number(b.isAllDay) - Number(a.isAllDay);
                const minutes = (entry: ExpandedCalendarEntry) =>
                    (entry.time?.start.hour ?? 0) * 60 + (entry.time?.start.minute ?? 0);
                return allDay || minutes(a) - minutes(b) || a.originalIndex - b.originalIndex;
            });
        // Keep Timed reachable even when there are hundreds of all-day events.
        const visible = accordion
            ? [true, false].flatMap((allDay) =>
                  entries.filter((entry) => entry.isAllDay === allDay).slice(0, this._agendaLimit),
              )
            : entries.slice(0, this._agendaLimit);
        const mixed = accordion && visible[0]?.isAllDay && !visible.at(-1)?.isAllDay;
        const format = getMessageFormatters(this.locale);
        const messages = getMessages(this.locale);
        const dateLabel = formatLocalizedDate(date.day, date.month, date.year, this.locale);
        const renderRows = (items: ExpandedCalendarEntry[], isAllDay: boolean) =>
            !items.length
                ? nothing
                : html`
            ${
                accordion
                    ? html`<div class="agenda-section-heading">
                <h3 id=${isAllDay ? 'agenda-all-day' : 'agenda-timed'} class="agenda-group" tabindex="-1">${isAllDay ? messages.allDay : messages.timed}</h3>
                ${
                    mixed
                        ? html`<button class="agenda-text" type="button" @click=${() => {
                              const target = this.renderRoot.querySelector<HTMLElement>(
                                  isAllDay ? '#agenda-timed' : '#agenda-all-day',
                              );
                              target?.focus({ preventScroll: true });
                              target?.scrollIntoView({
                                  block: 'start',
                                  inline: 'nearest',
                                  behavior: 'instant',
                              });
                          }}>
                    <span aria-hidden="true">${isAllDay ? '↓' : '↑'}</span> ${isAllDay ? messages.timed : messages.allDay}</button>`
                        : nothing
                }
            </div>`
                    : isAllDay
                      ? html`<h3 class="agenda-group">${messages.allDay}</h3>`
                      : nothing
            }
            <ol class="agenda-events ${isAllDay ? 'all-day' : ''}" role="list">
                ${repeat(
                    items,
                    (entry) => entry.segmentId,
                    (entry) => {
                        const heading = entry.heading || messages.noTitle;
                        const spanRange = formatMonthSpanRange(entry, this.locale);
                        const [color] = getColorTextWithContrast(entry.color);
                        if (accordion)
                            return this._renderAgendaDisclosure(entry, color, heading, spanRange);
                        const label = format.eventLabel(
                            heading,
                            spanRange || dateLabel,
                            this._entryTimeLabel(entry),
                        );
                        return html`<li><button type="button" class="agenda-event" data-entry-request data-event-id=${entry.sourceId}
                        style=${styleMap({ '--list-event-color': color })}
                        aria-label=${label} aria-expanded=${this._menuOpen && this._menuEventDetails?.eventId === entry.sourceId ? 'true' : 'false'}
                        @click=${(event: MouseEvent) => this._requestAgendaEntry(event, entry)}>
                        ${isAllDay ? nothing : html`<bdi class="agenda-time">${this._entryTimeLabel(entry)}</bdi>`}
                        <span class="agenda-title">${heading}</span>
                        ${spanRange ? html`<bdi class="agenda-span-range">${spanRange}</bdi>` : nothing}
                    </button></li>`;
                    },
                )}
            </ol>`;
        const renderBody = (items: ExpandedCalendarEntry[], continuation: boolean) => html`
            ${renderRows(
                items.filter((entry) => entry.isAllDay),
                true,
            )}
            ${renderRows(
                items.filter((entry) => !entry.isAllDay),
                false,
            )}
            ${
                continuation && entries.length > visible.length
                    ? html`<button type="button" class="agenda-action agenda-more" @click=${() => {
                          this._agendaLimit += 50;
                      }}>+${format.moreEvents(entries.length - visible.length)}</button>`
                    : nothing
            }
        `;
        const policy = density ? 'full' : this.monthAgendaPresentation;
        const disclosure =
            entries.length > 0 &&
            (policy === 'on-demand' || (policy === 'preview' && entries.length > 3));
        return html`<section class=${accordion ? 'date-agenda accordion-agenda' : 'date-agenda'} aria-labelledby="agenda-date" data-density-list=${density ? '' : nothing}>
            <header><div><h2 id="agenda-date" tabindex="-1">${dateLabel}</h2>
                ${drillIn?.timeRange ? html`<p class="agenda-count">${drillIn.timeRange}</p>` : nothing}
                ${!entries.length && (this.loading || this.error || this._entriesError) ? nothing : html`<p class="agenda-count">${format.eventCount(entries.length)}</p>`}
            </div>
            ${
                density
                    ? html`<button class="agenda-action${drillIn?.agendaDate ? ' all-day-list-close' : ''}" type="button" aria-label=${messages.close} @click=${this._closeDensityList}>${drillIn?.agendaDate ? messages.close : '×'}</button>`
                    : disclosure
                      ? html`<button class="agenda-action agenda-toggle" type="button" aria-expanded=${this._agendaExpanded ? 'true' : 'false'} aria-controls="agenda-events" aria-describedby="agenda-date"
                          @click=${() => {
                              this._agendaExpanded = !this._agendaExpanded;
                          }}>
                          <span class="when-closed">${format.agendaAction(false, policy === 'preview')}</span>
                          <span class="when-open">${format.agendaAction(true, policy === 'preview')}</span>
                        </button>`
                      : accordion
                        ? html`<button type="button" class="agenda-text agenda-back" @click=${() => {
                              this._agendaSelected = false;
                              void this._focusView();
                          }}><span aria-hidden="true">‹</span> ${messages.month}</button>`
                        : nothing
            }
            </header>
            <div id="agenda-events">${
                disclosure && !this._agendaExpanded
                    ? policy === 'preview'
                        ? renderBody(entries.slice(0, 3), false)
                        : nothing
                    : renderBody(visible, true)
            }</div>
        </section>`;
    }

    private _renderAgendaDisclosure(
        entry: ExpandedCalendarEntry,
        color: string,
        heading: string,
        spanRange: string,
    ) {
        const key = civilDateKey(this.activeDate);
        const open = this._agendaDisclosures.get(key) === entry.sourceId;
        const canonical = entry.canonicalEntry;
        const content = entry.content.trim();
        const messages = getMessages(this.locale);
        return html`<li @keydown=${(event: KeyboardEvent) => {
            if (!open || event.key !== 'Escape') return;
            (event.currentTarget as HTMLElement)
                .querySelector('button')
                ?.focus({ preventScroll: true });
            this._toggleAgendaDisclosure(key, entry.sourceId, true, false);
            event.stopPropagation();
        }}>
            <button type="button" class="agenda-event" aria-expanded=${open ? 'true' : 'false'}
                style=${styleMap({ '--list-event-color': color })}
                @click=${() => {
                    if (!open && !this._allowEntryActivation(canonical, entry.sourceId)) return;
                    this._toggleAgendaDisclosure(
                        key,
                        entry.sourceId,
                        open,
                        entry.continuation.total > 1,
                    );
                }}>
                <span class="agenda-title">${heading}</span>
                ${entry.isAllDay ? nothing : html`<bdi class="agenda-time">${this._entryTimeLabel(entry)}</bdi>`}
                ${spanRange ? html`<bdi class="agenda-span-range">${spanRange}</bdi>` : nothing}
                ${content ? html`<span class="agenda-time">${messages.description}</span>` : nothing}
            </button>
            ${
                open
                    ? html`<div class="agenda-details">
                ${content ? html`<p>${content}</p>` : nothing}
                <button type="button" class="agenda-text" @click=${async (event: MouseEvent) => {
                    const button = event.currentTarget as HTMLButtonElement;
                    if (button.hasAttribute('aria-disabled')) return;
                    button.setAttribute('aria-disabled', 'true');
                    this._agendaError = undefined;
                    try {
                        await downloadEntryIcs(button, canonical, entry.sourceId, heading);
                    } catch (error) {
                        if (button.isConnected)
                            this._agendaError = { key: entry.segmentId, text: String(error) };
                    } finally {
                        button.removeAttribute('aria-disabled');
                    }
                }}><span aria-hidden="true">↓</span> ${messages.downloadIcs}</button>
                ${this._agendaError?.key === entry.segmentId ? html`<p role="alert">${this._agendaError.text}</p>` : nothing}
            </div>`
                    : nothing
            }
        </li>`;
    }

    private _toggleAgendaDisclosure(key: string, id: string, open: boolean, multiDay: boolean) {
        this._agendaDisclosures.delete(key);
        if (!open) {
            this._agendaDisclosures.set(key, id);
            if (this._agendaDisclosures.size > 32)
                this._agendaDisclosures.delete(this._agendaDisclosures.keys().next().value!);
            this._agendaTrace = multiDay ? id : undefined;
        } else if (this._agendaTrace === id) this._agendaTrace = undefined;
        this._agendaError = undefined;
        this.requestUpdate();
    }

    private _requestAgendaEntry(event: MouseEvent, entry: ModelExpandedEntry) {
        const invoker = event.currentTarget as HTMLButtonElement;
        invoker.focus({ preventScroll: true });
        const canonical = entry.canonicalEntry ?? entry.sourceEntry;
        invoker.dispatchEvent(
            new CustomEvent('open-menu', {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    heading: canonical.heading || getMessages(this.locale).noTitle,
                    content: canonical.content ?? '',
                    time: entry.time,
                    displayTime: this._entryTimeLabel(entry),
                    date: entry.date.start,
                    anchorRect: invoker.getBoundingClientRect(),
                    entry: canonical,
                    eventId: entry.sourceId,
                },
            }),
        );
    }

    private _renderMonthEntries() {
        const allElements: EntryRender[] = [];
        const nextRows = new Map<string, number>();

        // 1. Render all-day entries using cached layout
        const activeDate = this._viewState.activeDate;
        if (activeDate && this._monthAllDayLayoutCache.length > 0) {
            const calendarArray = getMonthCalendarArray(activeDate, this.firstDayOfWeek);

            for (let weekIndex = 0; weekIndex < this._monthAllDayLayoutCache.length; weekIndex++) {
                const { weekEntries, rowAssignments, mergedEvents } =
                    this._monthAllDayLayoutCache[weekIndex];

                if (weekEntries.length === 0) continue;

                const weekDates = calendarArray.slice(weekIndex * 7, weekIndex * 7 + 7);

                for (const { entry, originalIndex } of weekEntries) {
                    const eventId = entry.occurrenceId;
                    const row = rowAssignments.get(eventId) ?? 0;
                    const dateKey = `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`;
                    nextRows.set(dateKey, Math.max(nextRows.get(dateKey) ?? 0, row + 1));
                    const mergedEvent = mergedEvents.get(eventId);
                    const visibleDays = mergedEvent?.days ?? [];
                    const sortedDays = [...visibleDays].sort((a, b) => a - b);
                    const dayIndex = weekDates.findIndex(
                        (d) =>
                            d.year === entry.date.start.year &&
                            d.month === entry.date.start.month &&
                            d.day === entry.date.start.day,
                    );

                    const spanClass = computeSpanClass({
                        continuationIndex: dayIndex,
                        totalDays: entry.continuation?.total ?? 1,
                        visibleStartIndex: sortedDays[0] ?? dayIndex,
                        visibleEndIndex: sortedDays[sortedDays.length - 1] ?? dayIndex,
                    });

                    // Use light background with accent color for text (matching week view style)
                    const [r, g, b] = parseColorWithDefault(entry.color);
                    const bgColor = `rgba(${r}, ${g}, ${b}, 0.12)`;
                    const borderColor = `rgba(${r}, ${g}, ${b}, 0.3)`;

                    allElements.push(
                        this._composeEntry({
                            index: originalIndex,
                            slot: `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
                            inlineStyle: `--entry-color: ${this._safeEntryColor(entry.color)}; --entry-background-color: ${bgColor}; --entry-border: 1px solid ${borderColor}; --all-day-row: ${row}; order: ${row}; z-index: ${100 + row}`,
                            entry,
                            density: 'compact',
                            displayMode: 'month-span',
                            spanClass,
                        }),
                    );
                }
            }
        }

        // 2. Render timed entries
        if (this._monthViewSorted.length > 0) {
            const timedElements = this._monthViewSorted.map(
                ({ entry, background, originalIndex }) => {
                    const key = `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`;
                    const row = nextRows.get(key) ?? 0;
                    nextRows.set(key, row + 1);
                    return this._composeEntry({
                        index: originalIndex,
                        slot: `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
                        inlineStyle: `--entry-color: ${background}; --entry-background-color: ${background}; --all-day-row: ${row}; z-index: ${100 + originalIndex}`,
                        entry,
                        density: this._determineDensity(entry),
                        displayMode: 'month-dot',
                    });
                },
            );
            allElements.push(...timedElements);
        }

        return repeat(
            allElements,
            (item) => item.key,
            (item) => item.template,
        );
    }

    private _renderEntriesByDate(weekCtx?: WeekDisplayContext) {
        const currentActiveDate = this._viewState.activeDate;
        const viewMode = this._viewState.viewMode;

        if (viewMode !== 'day' && viewMode !== 'week') {
            return { elements: nothing, allDayRowCount: 0, allDaySummary: false };
        }

        // O(1) map lookups instead of O(n) expansion + Luxon filtering
        let allEntriesForDate: ExpandedCalendarEntry[];

        if (viewMode === 'day') {
            const key = civilDateKey(currentActiveDate);
            allEntriesForDate = this._expandedByISODate.get(key) ?? [];
        } else {
            // Week view: use visible dates from context (condensed or full)
            const datesToRender =
                weekCtx?.visibleDates ?? getWeekDates(currentActiveDate, this.firstDayOfWeek);
            allEntriesForDate = datesToRender.flatMap((wd) => {
                const key = civilDateKey(wd);
                return this._expandedByISODate.get(key) ?? [];
            });
        }

        // Single-pass partition into all-day vs timed entries
        const allDayEntries: ExpandedCalendarEntry[] = [];
        const entriesByDate: ExpandedCalendarEntry[] = [];
        for (const entry of allEntriesForDate) {
            (entry.isAllDay ? allDayEntries : entriesByDate).push(entry);
        }

        if (!entriesByDate.length && !allDayEntries.length) {
            return { elements: nothing, allDayRowCount: 0, allDaySummary: false };
        }

        // Use SlotManager to handle positioning across different views
        return this._renderEntriesWithSlotManager(
            viewMode,
            currentActiveDate,
            allDayEntries,
            entriesByDate,
            weekCtx,
        );
    }

    private _renderEntriesWithSlotManager(
        viewMode: 'day' | 'week',
        currentActiveDate: CalendarDate,
        allDayEntries: ExpandedCalendarEntry[],
        entriesByDate: ExpandedCalendarEntry[],
        weekCtx?: WeekDisplayContext,
    ) {
        const allElements: ReturnType<typeof this._composeEntry>[] = [];

        // Process timed entries
        if (entriesByDate.length > 0) {
            // Build O(1) global-index lookup (replaces O(n) indexOf per entry)
            const globalIndexMap = new Map(entriesByDate.map((entry, i) => [entry, i]));

            if (viewMode === 'week') {
                // Group timed entries by day for week view
                const entriesByDay = groupByDate(entriesByDate);

                const condensedDates = weekCtx?.isCondensed ? weekCtx.visibleDates : undefined;

                // Iterate in known day order — no sort needed
                const datesToRender =
                    condensedDates ?? getWeekDates(currentActiveDate, this.firstDayOfWeek);

                for (const wd of datesToRender) {
                    const dayEntries = entriesByDay[civilDateKey(wd)];
                    if (!dayEntries?.length) continue;

                    const dayElements = this._renderDayEntriesWithSlotManager(
                        dayEntries,
                        viewMode,
                        currentActiveDate,
                        globalIndexMap,
                        condensedDates,
                    );
                    allElements.push(...dayElements);
                }
            } else {
                // Day view: process all entries together
                const dayElements = this._renderDayEntriesWithSlotManager(
                    entriesByDate,
                    viewMode,
                    currentActiveDate,
                    globalIndexMap,
                );
                allElements.push(...dayElements);
            }
        }

        const allDayByDate =
            weekCtx && allDayEntries.length ? groupByDate(allDayEntries) : undefined;
        const maxPreviewRows = 3;
        if (
            weekCtx &&
            allDayByDate &&
            (!weekCtx.canShowAllDayTitles ||
                Object.values(allDayByDate).some((entries) => entries.length > maxPreviewRows))
        ) {
            return this._renderWeekAllDaySummary(weekCtx, allDayByDate, allElements);
        }

        // Compute all-day layout declaratively (cached — only recomputes when entries change)
        const condensedDatesForAllDay = weekCtx?.isCondensed ? weekCtx.visibleDates : undefined;
        const allDayKey =
            viewMode === 'week'
                ? `${currentActiveDate.year}-${currentActiveDate.month}-${currentActiveDate.day}-${this.firstDayOfWeek}-${weekCtx?.visibleStartIndex ?? 0}-${weekCtx?.visibleLength ?? 7}`
                : `day-${currentActiveDate.year}-${currentActiveDate.month}-${currentActiveDate.day}`;

        let allDayLayout = this._allDayLayoutCache.get(allDayKey);
        if (!allDayLayout) {
            const allDayLayoutEvents: AllDayEvent[] = allDayEntries.map((entry) => {
                const eventId = entry.occurrenceId;
                const dayIndex =
                    viewMode === 'week'
                        ? condensedDatesForAllDay
                            ? slotManager.getIndexInDates(entry.date.start, condensedDatesForAllDay)
                            : slotManager.getWeekDayIndex(
                                  entry.date.start,
                                  currentActiveDate,
                                  this.firstDayOfWeek,
                              )
                        : 0;
                return {
                    id: eventId,
                    days: [dayIndex],
                    isMultiDay: entry.continuation?.is || entry.continuation?.has || false,
                };
            });

            const mergedEvents = new Map<string, AllDayEvent>();
            allDayLayoutEvents.forEach((event) => {
                const existing = mergedEvents.get(event.id);
                if (existing) {
                    existing.days.push(...event.days);
                } else {
                    mergedEvents.set(event.id, { ...event, days: [...event.days] });
                }
            });

            const { rowAssignments, totalRows } = allocateAllDayRows(
                Array.from(mergedEvents.values()),
            );

            allDayLayout = { rowAssignments, mergedEvents, totalRows };
            this._allDayLayoutCache.set(allDayKey, allDayLayout);
        }

        const { rowAssignments, mergedEvents, totalRows } = allDayLayout;
        if (weekCtx && allDayByDate && totalRows > maxPreviewRows)
            return this._renderWeekAllDaySummary(weekCtx, allDayByDate, allElements);

        // Process all-day entries with layout info
        const allDayElements = allDayEntries.map((entry, index) => {
            const [r, g, b] = parseColorWithDefault(entry.color);
            const eventId = entry.occurrenceId;

            const positionConfig: PositionConfig = {
                viewMode,
                date: entry.date.start,
                isAllDay: true,
                activeDate: currentActiveDate,
                firstDayOfWeek: this.firstDayOfWeek,
                weekDates: condensedDatesForAllDay,
                locale: this.locale,
            };

            const position = slotManager.calculatePosition(positionConfig);
            const accessibility = slotManager.calculateAccessibility(positionConfig);
            const row = rowAssignments.get(eventId) ?? 0;
            const layoutDimensions: LayoutDimensions = {
                width: 100,
                x: 0,
                zIndex: 100 + row,
                opacity: 1,
            };

            const positionCSS = slotManager.generatePositionCSS(position, layoutDimensions);

            // Compute span class for multi-day events
            const continuation = (entry as CalendarEntry & { continuation?: Continuation })
                .continuation;
            const isMultiDay = continuation?.has || continuation?.is || false;
            let spanClass = 'single-day';
            if (isMultiDay && continuation) {
                const mergedEvent = mergedEvents.get(eventId);
                const visibleDays = mergedEvent?.days ?? [];
                const sortedDays = [...visibleDays].sort((a, b) => a - b);
                const dayIndex =
                    viewMode === 'week'
                        ? condensedDatesForAllDay
                            ? slotManager.getIndexInDates(entry.date.start, condensedDatesForAllDay)
                            : slotManager.getWeekDayIndex(
                                  entry.date.start,
                                  currentActiveDate,
                                  this.firstDayOfWeek,
                              )
                        : 0;
                spanClass = computeSpanClass({
                    continuationIndex: dayIndex,
                    totalDays: continuation.total,
                    visibleStartIndex: sortedDays[0] ?? dayIndex,
                    visibleEndIndex: sortedDays[sortedDays.length - 1] ?? dayIndex,
                });
            }

            return this._composeEntry({
                index: index + entriesByDate.length,
                slot: position.slotName,
                inlineStyle: `--entry-color: ${this._safeEntryColor(entry.color)}; --entry-background-color: rgba(${r}, ${g}, ${b}, 0.08); --entry-border: 1px solid rgba(${r}, ${g}, ${b}, 0.25); --entry-border-inline-start: none; --entry-handle-color: ${this._safeEntryColor(entry.color)}; --entry-handle-width: 4px; --entry-handle-display: block; --entry-padding-inline-start: calc(4px + 0.35em); --all-day-row: ${row}; order: ${row}; ${positionCSS}`,
                entry: {
                    ...entry,
                    accessibility: accessibility,
                },
                density: 'standard',
                floatText: false,
                spanClass,
            });
        });

        return {
            elements: repeat(
                [...allDayElements, ...allElements],
                (item) => item.key,
                (item) => item.template,
            ),
            allDayRowCount: totalRows,
            allDaySummary: false,
        };
    }

    private _renderWeekAllDaySummary(
        context: WeekDisplayContext,
        byDate: Record<string, ExpandedCalendarEntry[]>,
        timed: EntryRender[],
    ) {
        const format = getMessageFormatters(this.locale);
        const messages = getMessages(this.locale);
        const number = new Intl.NumberFormat(this.locale);
        const summaries = context.visibleDates.flatMap((date) => {
            const entries = byDate[civilDateKey(date)];
            if (!entries?.length) return [];
            const key = `all-day:${civilDateKey(date)}`;
            const dateLabel = formatLocalizedDate(date.day, date.month, date.year, this.locale);
            return [
                {
                    key,
                    template: html`
                <button type="button" class="all-day-count" slot=${`all-day-${date.year}-${date.month}-${date.day}`}
                    data-density-key=${key} aria-label=${format.eventLabel(messages.allDay, dateLabel, format.eventCount(entries.length))}
                    @click=${() => this._showDensityList(date, key, { agendaDate: date })}>
                    <bdi>${number.format(entries.length)}</bdi>
                </button>`,
                },
            ];
        });
        return {
            elements: repeat(
                [...summaries, ...timed],
                (item) => item.key,
                (item) => item.template,
            ),
            allDayRowCount: 1,
            allDaySummary: true,
        };
    }

    private _renderDayEntriesWithSlotManager(
        dayEntries: ExpandedCalendarEntry[],
        viewMode: 'day' | 'week',
        currentActiveDate: CalendarDate,
        globalIndexMap: Map<ExpandedCalendarEntry, number>,
        condensedDates?: CalendarDate[],
    ) {
        // Cache key from the day being rendered (all entries share the same date)
        const first = dayEntries[0];
        const cacheKey = `${first.date.start.year}-${String(first.date.start.month).padStart(2, '0')}-${String(first.date.start.day).padStart(2, '0')}:${this.timedEntryPresentation}`;

        // Reuse cached layout when only resize/locale/menu changed (not entries)
        let layout = this._layoutCache.get(cacheKey);
        if (!layout) {
            const layoutEvents = dayEntries.map((entry) => {
                const { start, end } = entry.time!;
                const startMinute = start.hour * 60 + start.minute;
                // Only label collision envelopes move near midnight. Canonical
                // endpoints, SlotManager positioning and duration marks do not.
                const labelStart =
                    this.timedEntryPresentation === 'marker'
                        ? Math.min(
                              startMinute,
                              Math.max(
                                  0,
                                  1440 - Math.ceil(this._timeGridMinimum / this._timeGridScale),
                              ),
                          )
                        : startMinute;
                return {
                    id: entry.segmentId,
                    heading: entry.heading || '',
                    startTime: { hour: Math.floor(labelStart / 60), minute: labelStart % 60 },
                    endTime: end,
                    color: entry.color || '#1976d2',
                };
            });
            layout = new LayoutCalculator({
                minuteHeight: this._timeGridScale,
                eventMinHeight: this._timeGridMinimum,
                layoutMode: 'columns',
            }).calculateLayout(layoutEvents);
            this._layoutCache.set(cacheKey, layout);
        }

        const columnWidth =
            this._timeGridColumnWidth ||
            this._calendarWidth / (viewMode === 'week' ? condensedDates?.length || 7 : 1);
        const denseGroups = new Map<number, number[]>();
        layout.boxes.forEach((box, index) => {
            if (
                (box.columnCount ?? 1) > 1 &&
                columnWidth / (box.columnCount ?? 1) < this._densityMinimumWidth
            ) {
                const indices = denseGroups.get(box.group) ?? [];
                indices.push(index);
                denseGroups.set(box.group, indices);
            }
        });

        // Column lanes never paint over each other. Unreadable connected
        // display groups have a real disclosure action, not a fake event.
        return dayEntries.flatMap((entry, index) => {
            const layoutBox = layout.boxes[index];
            const group = denseGroups.get(layoutBox.group);
            if (group)
                return index === group[0]
                    ? [
                          this._renderDensityGroup(
                              dayEntries,
                              group,
                              layout,
                              viewMode,
                              currentActiveDate,
                              condensedDates,
                          ),
                      ]
                    : [];
            const globalIndex = globalIndexMap.get(entry) ?? index;

            // Use SlotManager to determine positioning and accessibility
            const positionConfig: PositionConfig = {
                viewMode,
                date: entry.date.start,
                time: entry.time,
                activeDate: currentActiveDate,
                isAllDay: false,
                firstDayOfWeek: this.firstDayOfWeek,
                weekDates: condensedDates,
                locale: this.locale,
            };

            const position = slotManager.calculatePosition(positionConfig);
            const accessibility = slotManager.calculateAccessibility(positionConfig);
            const layoutDimensions: LayoutDimensions = {
                width: layoutBox.width,
                x: layoutBox.x,
                zIndex: layoutBox.zIndex,
                // Whole-card translucency lets unrelated titles bleed through
                // overlapping events and also reduces text contrast.
                opacity: 1,
                height: layoutBox.height,
                durationMinutes: layoutBox.durationMinutes,
            };

            const positionCSS = slotManager.generatePositionCSS(
                position,
                layoutDimensions,
                entry.time,
            );

            const smartLayout = this._getSmartLayout(layoutBox.height, layoutBox.width);
            const labelOffset =
                this.timedEntryPresentation === 'marker'
                    ? layoutBox.y / this._timeGridScale -
                      (entry.time!.start.hour * 60 + entry.time!.start.minute)
                    : 0;

            return [
                this._composeEntry({
                    index: globalIndex,
                    slot: position.slotName,
                    inlineStyle: `--entry-color: ${this._safeEntryColor(entry.color)}; --entry-background-color: var(--background-color); --entry-border: 1px solid var(--separator-light); --entry-border-inline-start: none; --entry-handle-color: ${this._safeEntryColor(entry.color)}; --entry-handle-width: 4px; --entry-handle-display: block; --entry-padding-inline-start: calc(4px + 0.35em); --entry-layout: ${smartLayout}; --entry-label-offset: calc(${labelOffset} * var(--minute-height)); ${positionCSS}`,
                    displayMode: this.timedEntryPresentation === 'marker' ? 'time-mark' : 'default',
                    entry: {
                        ...entry,
                        // Add accessibility data to entry
                        accessibility: accessibility,
                    },
                    density: 'standard',
                    floatText: false,
                }),
            ];
        });
    }

    private _renderDensityGroup(
        entries: ExpandedCalendarEntry[],
        indices: number[],
        layout: LayoutResult,
        viewMode: 'day' | 'week',
        activeDate: CalendarDate,
        weekDates?: CalendarDate[],
    ): EntryRender {
        let first = 1440,
            last = 0,
            top = Infinity,
            bottom = 0;
        for (const index of indices) {
            const entry = entries[index];
            first = Math.min(first, entry.time!.start.hour * 60 + entry.time!.start.minute);
            last = Math.max(last, entry.time!.end.hour * 60 + entry.time!.end.minute);
            top = Math.min(top, layout.boxes[index].y);
            bottom = Math.max(bottom, layout.boxes[index].y + layout.boxes[index].height);
        }
        const date = entries[indices[0]].date.start;
        const time = {
            start: { hour: Math.floor(first / 60), minute: first % 60 },
            end: { hour: Math.floor(last / 60), minute: last % 60 },
        };
        const position = slotManager.calculatePosition({
            viewMode,
            date,
            time,
            activeDate,
            isAllDay: false,
            firstDayOfWeek: this.firstDayOfWeek,
            weekDates,
            locale: this.locale,
        });
        const style = slotManager.generatePositionCSS(
            position,
            {
                x: 0,
                width: 100,
                zIndex: 1,
                opacity: 1,
                height: bottom - top,
                durationMinutes: Math.max(last - first, (bottom - top) / this._timeGridScale),
            },
            time,
        );
        const format = getMessageFormatters(this.locale);
        const count = format.eventCount(indices.length);
        const range = this._timeLabel(time);
        const key = `${civilDateKey(date)}:${first}:${last}`;
        const label = format.eventLabel(
            count,
            formatLocalizedDate(date.day, date.month, date.year, this.locale),
            range,
        );
        return {
            key: `density-${key}`,
            template: html`<div class="time-group-range" slot=${position.slotName} style=${style}>
            <button type="button" class="time-group" data-density-key=${key} aria-label=${label}
                @click=${() =>
                    this._showDensityList(date, key, {
                        segmentIds: indices.map((index) => entries[index].segmentId),
                        timeRange: range,
                    })}>
                <strong>${count}</strong>
                <span class="group-meta" aria-hidden="true"><bdi>${range}</bdi></span>
            </button>
        </div>`,
        };
    }

    private async _showDensityList(date: CalendarDate, key: string, scope: DensityScope) {
        if (this.viewMode !== 'day' && this.viewMode !== 'week') return;
        const view = this.shadowRoot?.querySelector<LMSCalendarDay | LMSCalendarWeek>(
            'lms-calendar-day, lms-calendar-week',
        );
        this._densityReturn = {
            viewMode: this.viewMode,
            activeDate: { ...this.activeDate },
            key,
            scrollMinute: view ? this._timePosition(view) : 0,
            ...scope,
        };
        if (!scope.agendaDate) {
            this.activeDate = date;
            this.viewMode = 'day';
        }
        await this.updateComplete;
        this.shadowRoot?.querySelector<HTMLElement>('#agenda-date')?.focus({ preventScroll: true });
    }

    private async _closeDensityList() {
        const previous = this._densityReturn;
        if (!previous) return;
        this._densityReturn = undefined;
        this._timeAnchor = previous.scrollMinute;
        this.activeDate = previous.activeDate;
        this.viewMode = previous.viewMode;
        await this.updateComplete;
        const view = this.shadowRoot?.querySelector<LMSCalendarDay | LMSCalendarWeek>(
            'lms-calendar-day, lms-calendar-week',
        );
        await view?.updateComplete;
        await this.updateComplete;
        if (view)
            await this._restoreTimePosition(
                view,
                previous.scrollMinute,
                this._timeRestoreGeneration,
            );
        const trigger = [
            ...(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-density-key]') ?? []),
        ].find((button) => button.dataset.densityKey === previous.key);
        if (trigger) trigger.focus({ preventScroll: true });
        else await this._focusView();
    }

    private _getSmartLayout(height: number, width: number): 'row' | 'column' {
        const pixels = (this._timeGridColumnWidth * width) / 100;
        const narrow = this._timeGridForceStack || (pixels > 0 && pixels < this._timeGridFont * 12);
        // All lanes follow the same information grammar; reused lane indices
        // are not a reason to change title/time ordering.
        return narrow && height >= this._timeGridStackMinimum - 0.5 ? 'column' : 'row';
    }
}

declare global {
    interface HTMLElementEventMap {
        /** Initial and subsequent rendered state snapshots, including owner assignments. */
        'calendar-state-change': CustomEvent<CalendarState>;
        /** Cancel to replace the built-in details inspector. */
        'entry-activate': CustomEvent<CalendarEntryRequest>;
        /** Cancel to handle export outside the browser (e.g. a native share sheet). */
        'export-entry': CustomEvent<CalendarEntryRequest>;
    }

    interface HTMLElementTagNameMap {
        'lms-calendar': LMSCalendar;
        'lms-calendar-header': LMSCalendarHeader;
        'lms-calendar-month': LMSCalendarMonth;
        'lms-calendar-week': LMSCalendarWeek;
        'lms-calendar-day': LMSCalendarDay;
        'lms-calendar-context': LMSCalendarContext;
        'lms-calendar-entry': LMSCalendarEntry;
        'lms-menu': LMSCalendarMenu;
        'lms-calendar-year': LMSCalendarYear;
    }

    /** A calendar date represented by day, month, and year numbers. */
    type CalendarDate = {
        /** Day of the month (1–31). */
        day: number;
        /** Month number (1–12). */
        month: number;
        /** Four-digit year. */
        year: number;
    };

    /** A time-of-day represented by hour and minute. */
    type CalendarTime = {
        /** Hour in 24-hour format (0–23). */
        hour: number;
        /** Minute (0–59). */
        minute: number;
    };

    /** A time range within a single day. */
    type CalendarTimeInterval = {
        /** Start time. */
        start: CalendarTime;
        /** End time (must be after start). */
        end: CalendarTime;
    };

    /** A date range spanning one or more days. */
    type CalendarDateInterval = {
        /** Start date (inclusive). */
        start: CalendarDate;
        /** End date (inclusive). */
        end: CalendarDate;
    };

    /**
     * A single calendar event.
     *
     * Multi-day events are automatically expanded into per-day slices
     * by the component. Prefer explicit `kind: 'all-day'` or `kind: 'timed'`.
     * Legacy omitted-time/full-day/multi-day promotion remains compatible.
     */
    type CalendarEntry = {
        /** Stable application identity, preserved by adapters and exports. */
        id?: string;
        /** Explicit semantics. Omission retains the legacy daily-window behavior. */
        kind?: 'all-day' | 'timed';
        /** Optional IANA zone for continuous timed endpoints; omit for floating local times. */
        timeZone?: string;
        /** Date range the event spans. */
        date: CalendarDateInterval;
        /** Legacy daily window, or original continuous endpoints when kind is timed. */
        time?: CalendarTimeInterval;
        /** Title displayed on the entry chip. */
        heading: string;
        /** Body text shown in details. Defaults to empty. */
        content?: string;
        /** Opaque color in the documented parser formats. Defaults to the calendar accent. */
        color?: string;
        /**
         * Whether this entry is a continuation slice of a multi-day event.
         * The component recalculates this automatically — you can omit it.
         */
        isContinuation?: boolean;
        /**
         * Metadata about multi-day continuation.
         * Injected automatically by the component.
         */
        continuation?: Continuation;
    };

    /**
     * Metadata describing a multi-day event's continuation slices.
     * Populated automatically by the component during entry expansion.
     */
    type Continuation = {
        /** `true` if this event continues into the next day. */
        has: boolean;
        /** `true` if this is a continuation from the previous day. */
        is: boolean;
        /** Zero-based index of this slice within the multi-day span. */
        index: number;
        /** Total number of days this event spans. */
        total: number;
    };

    /**
     * A numeric interval used by the overlap layout algorithm.
     * @internal
     */
    type Interval = {
        start: number;
        end: number;
    };

    /**
     * Layout grading metadata for overlapping event positioning.
     * @internal
     */
    type Grading = {
        index: number;
        depth: number;
        group: number;
    };

    /**
     * A partitioned interval with optional grading metadata.
     * @internal
     */
    type Partition = {
        index?: number;
        depth?: number;
        group?: number;
        start: number;
        end: number;
    };
}

export {
    CalendarDate,
    CalendarDateInterval,
    CalendarEntry,
    CalendarTime,
    CalendarTimeInterval,
    Continuation,
    Grading,
    Interval,
    Partition,
};
export type { CalendarState, CalendarVisibleRange, CalendarEntryRequest } from './contracts.js';
export type { ViewMode } from './lib/ViewStateController.js';
