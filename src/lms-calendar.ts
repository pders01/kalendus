import { LitElement, PropertyValueMap, TemplateResult, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import LMSCalendarContext from './components/Context.js';
import LMSCalendarDay from './components/Day.js';
import LMSCalendarEntry from './components/Entry.js';
import { downloadEntryIcs } from './components/entryExport.js';
import LMSCalendarHeader from './components/Header.js';
import './components/Context.js';
import LMSCalendarMenu from './components/Menu.js';
import './components/Day.js';
import LMSCalendarMonth from './components/Month.js';
import './components/Entry.js';
import { measureTimeGrid } from './components/TimeGridSizingController.js';
import './components/Header.js';
import LMSCalendarWeek from './components/Week.js';
import LMSCalendarYear from './components/Year.js';
import './components/Menu.js';
import type { DensityMode, DrillTarget } from './components/Year.js';
import './components/Month.js';
import type { CalendarState, CalendarVisibleRange, CalendarEntryRequest } from './contracts.js';
import './components/Week.js';
import { entryStartMinute, prepareAgendaEntries } from './lib/agendaEntries.js';
import { joinVisibleSpans, layoutAllDaySegments, type VisibleSpan } from './lib/allDayLayout.js';
import './components/Year.js';
import {
    normalizeEntries,
    expandEntries,
    civilDateKey,
    parseCalendarDate,
    MAX_EXPANDED_SEGMENTS,
    CalendarExpansionError,
    type EntryValidationIssue,
    type NormalizedCalendarEntry,
    type ExpandedCalendarEntry as ModelExpandedEntry,
} from './lib/calendarModel.js';
import { parseColorWithDefault } from './lib/colorParser.js';
import { allDaySlotName, dateSlotKey } from './lib/entrySlots.js';
import getColorTextWithContrast from './lib/getColorTextWithContrast.js';
import type { LayoutResult } from './lib/LayoutCalculator.js';
import {
    formatLocalizedDate,
    formatLocalizedDateInterval,
    formatLocalizedTime,
} from './lib/localization.js';
import {
    ensureLocale,
    getMessages,
    getMessageFormatters,
    isLocaleLoaded,
    normalizeLocale,
    resolveLocale,
} from './lib/messages.js';
import { buildMonthPreviews, type MonthPreviewRows } from './lib/monthPreviews.js';
import { buildMonthSpans, formatMonthSpanRange, type MonthSpan } from './lib/monthSpans.js';
import {
    slotManager,
    type LayoutDimensions,
    type PositionConfig,
    type FirstDayOfWeek,
} from './lib/SlotManager.js';
import { gainsTimedDetail, getDenseTimedGroups, layoutTimedEntries } from './lib/timedLayout.js';
import type { ViewMode } from './lib/ViewStateController.js';
import { ViewStateController } from './lib/ViewStateController.js';
import { computeWeekDisplayContext, type WeekDisplayContext } from './lib/weekDisplayContext.js';
import { addDisplayDays, getMonthCalendarArray } from './lib/weekStartHelper.js';

// ── RTL locale detection ───────────────────────────────────────────────
function resolveDirection(locale: string): 'ltr' | 'rtl' {
    return /^(ar|he|fa|ur|yi)(-|$)/i.test(locale) ? 'rtl' : 'ltr';
}

// ── Derived type for expanded (multi-day) entries ──────────────────────
type ExpandedCalendarEntry = ModelExpandedEntry & {
    originalStartDate?: CalendarDate;
    originalIndex: number;
    sourceEntry: CalendarEntry;
    canonicalEntry: CalendarEntry;
};

type EntryRender = { key: string; template: TemplateResult<1> };

function groupByDate(entries: ExpandedCalendarEntry[]) {
    const groups: Record<string, ExpandedCalendarEntry[]> = {};
    for (const entry of entries) (groups[civilDateKey(entry.date.start)] ??= []).push(entry);
    return groups;
}

/** Auto keeps compact Month context inline; day preserves the legacy drill action. */
export type MonthDayBehavior = 'auto' | 'inline' | 'day';
/** Experimental comparison modes; auto preserves the existing responsive policy. */
export type MonthPresentation = 'auto' | 'presence' | 'previews';
/** Selected-date list presentation; density lists retain their existing policy. */
export type MonthAgendaPresentation = 'full' | 'preview' | 'on-demand' | 'accordion';
/** Experimental: separate proportional duration marks from readable label envelopes. */
export type TimedEntryPresentation = 'card' | 'marker';
type DensityList = {
    date: CalendarDate;
    viewMode: 'day' | 'week';
    activeDay: string;
    key: string;
    timed?: {
        segmentIds: ReadonlySet<string>;
        time: CalendarTimeInterval;
        above: boolean;
        leading: boolean;
        inset: number;
    };
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
        this._requestedDirection = value === 'ltr' || value === 'rtl' ? value : 'auto';
        // Even the same request can overwrite the resolved HTML attribute.
        this.requestUpdate('dir');
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

    /** Keep Day and Week at a scrollable detail scale instead of fitting 24 hours. */
    @property({ type: Boolean, attribute: 'scroll-time-grid' })
    scrollTimeGrid = false;

    private _viewState = new ViewStateController(this);
    @state() private _compactMonth = false;
    @state() private _densityList?: DensityList;
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
    @property({ attribute: false, noAccessor: true })
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
        this._viewState.setViewMode(value);
    }

    /** Half-open ISO civil-date range actually rendered, including month spillover. */
    get visibleRange(): CalendarVisibleRange {
        return this._renderedState?.range ?? this._calculateVisibleRange();
    }

    private _calculateVisibleRange(): CalendarVisibleRange {
        const { activeDate, viewMode } = this;
        const dates =
            viewMode === 'month' && !this._inMonthAgenda
                ? getMonthCalendarArray(activeDate, this.firstDayOfWeek)
                : viewMode === 'week'
                  ? this._weekContext().visibleDates
                  : undefined;
        const first =
            dates?.[0] ??
            (viewMode === 'year' ? { year: activeDate.year, month: 1, day: 1 } : activeDate);
        const last =
            dates?.at(-1) ??
            (viewMode === 'year' ? { year: activeDate.year, month: 12, day: 31 } : activeDate);
        // Keep machine keys independent of formatting settings; clip display
        // padding to the public domain, allowing one exclusive upper sentinel.
        return {
            start: first.year < 1 ? '0001-01-01' : civilDateKey(first),
            end: last.year > 9999 ? '10000-01-01' : civilDateKey(addDisplayDays(last, 1)),
        };
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
     * Alpha is discarded. Omit the accent or assign an empty string to use the theme default.
     */
    @property({ type: String, noAccessor: true })
    get color(): string {
        // Keep the legacy property default without forcing black onto dark hosts.
        return this._accent ?? '#000000';
    }

    set color(value: string) {
        this._accent = value || undefined;
    }

    @state() private _accent?: string;

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
    private _renderedState!: CalendarState;
    private _validationIssues: EntryValidationIssue[] = [];
    private _focusToRestore?: LMSCalendarEntry;
    @state() private _entriesError = '';

    private _processedEntries: NormalizedCalendarEntry[] = [];

    // ── Memoized derived data (recomputed only when `entries` changes) ──
    // Think of these as `useMemo(() => …, [entries])` — willUpdate is the
    // dependency check, and render methods are pure consumers.

    /** All entries expanded across their date spans (shared by every view). */
    private _expandedEntries: ExpandedCalendarEntry[] = [];

    /** Each date's array is indexed by preview row, preserving gaps in span lanes. */
    private _monthPreviews: MonthPreviewRows<ExpandedCalendarEntry> = {};
    @state() private _monthCapacity: Record<string, number> = {};

    /** Per-day cardinality for accessible date labels and contextual headings. */
    private _entrySumByDay: Record<string, number> = {};

    /** Day/week view: expanded entries grouped by ISO date for O(1) lookup. */
    private _expandedByISODate: Record<string, ExpandedCalendarEntry[]> = {};

    /** Day/week view: cached LayoutCalculator results keyed by ISO date. */
    private _layoutCache = new Map<string, LayoutResult>();

    /** Day/week view: cached all-day placements keyed by week/day key. */
    private _allDayLayoutCache = new Map<
        string,
        ReturnType<typeof layoutAllDaySegments<ExpandedCalendarEntry>>
    >();

    @state() private _preferTimeGridScroll = false;
    private _timeFitKey = '';
    @state() private _timeGridScale = 0.8;
    @state() private _timeGridMinimum = 24;
    @state() private _timeGridStackMinimum = 40;
    @state() private _timeGridForceStack = false;
    @state() private _timeGridColumnWidth = 0;
    private _densityMinimumWidth = 128;
    private _timeGridFont = 16;
    private _timeGridHost?: LMSCalendarDay | LMSCalendarWeek;
    private _timeAnchor?: number;
    private _timeRestore?: Promise<void>;
    private _timeRestoreGeneration = 0;
    private _resizeObserver?: ResizeObserver;
    private _containerFrame = 0;

    static override styles = css`
        :host {
            display: block;
            contain: layout style;
            block-size: var(--height);
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

            /* Match Canvas in the embedding page's used color scheme. */
            --separator-light: color-mix(in srgb, CanvasText 10%, transparent);
            --separator-mid: color-mix(in srgb, CanvasText 40%, transparent);
            --separator-dark: color-mix(in srgb, CanvasText 70%, transparent);
            --_muted-color: color-mix(in srgb, CanvasText 60%, transparent);

            --border-radius-sm: 0;
            --border-radius-md: 0;
            --border-radius-lg: 0;

            color: CanvasText;
            --background-color: Canvas;
            --primary-color: var(--calendar-accent, CanvasText);

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
            --entry-gap: 0.25em;

            /* Month view dot indicator tokens */
            --entry-dot-size: 6px;
            --entry-dot-margin: 0.25em;
            --entry-month-background: transparent;
            --entry-month-padding: 0.05em 0.25em 0.05em 0;
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
            --hour-indicator-color: var(--header-text-color, var(--_muted-color));
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
            --current-day-bg: CanvasText;
            --current-day-color: Canvas;
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
        .calendar-container.locale-loading .calendar-body {
            visibility: hidden;
        }
        .calendar-container {
            box-sizing: border-box;
            width: var(--width);
            block-size: 100%;
            background-color: var(--background-color);
            border-radius: var(--calendar-border-radius, var(--border-radius-lg));
            border: 1px solid var(--calendar-border-color);
            font-family: var(--system-ui, inherit);
            color: inherit;
            box-shadow: var(--calendar-shadow, none);
            contain: layout style;
            position: relative;
            /* A very short embed can scroll the toolbar out of the way. */
            overflow: var(--calendar-overflow, auto);
            display: flex;
            flex-direction: column;
        }
        header {
            flex-shrink: 0;
        }
        .calendar-view {
            flex: 1;
            min-block-size: min(100%, 5em);
            overflow: clip;
            display: flex;
            flex-direction: column;
        }
        .month-flow .calendar-view {
            overflow: auto;
        }
        .month-flow lms-calendar-month:not([compact]) {
            display: grid;
            flex: 1 1 auto;
            --_month-week-min: max(64px, 4em, var(--_month-touch-min, 0px), var(--month-week-height, 0px));
            block-size: calc(6 * var(--month-week-height, 6.5em) + 1.4em);
            /* Keep the six readable rows and weekday line in the same scroller. */
            min-block-size: calc(6 * var(--_month-week-min) + 1.4em);
        }
        .calendar-body {
            display: contents;
        }
        .calendar-body.timeline-body {
            display: grid;
            grid-template: minmax(0, 1fr) / minmax(0, 1fr);
            container-type: size;
            min-block-size: min(100%, 5em);
        }
        .timeline-body,
        .calendar-view:is(.agenda-view, .year-view) {
            /* A definite flex basis is the fallback in an auto-height embed.
               With an embed height, the viewport still takes the remaining space. */
            flex: 1 1 auto;
            block-size: min(36rem, 65vh);
            block-size: min(36rem, 65dvb);
        }
        .calendar-view.time-grid {
            --_time-grid-overflow: visible;
            --_timeline-min-height: 5em;
            grid-area: 1 / 1;
            min-block-size: 0;
            /* Allow the date header, pager and all-day area to scroll out of
               the way rather than reducing the timeline to a sliver. */
            overflow: auto;
        }
        :host([data-view-mode='week']) .calendar-view.time-grid {
            container: week-viewport / size;
        }
        .time-grid > :is(lms-calendar-day, lms-calendar-week) {
            min-inline-size: max(240px, 11em);
            flex-shrink: 0;
        }
        .time-grid lms-calendar-entry {
            --entry-border-inline-start: none;
            --entry-handle-color: var(--entry-color);
            --entry-handle-width: 4px;
            --entry-handle-display: block;
            --entry-padding-inline-start: calc(4px + 0.35em);
        }
        .time-grid lms-calendar-entry[slot^='timed'] {
            --entry-background-color: var(--background-color);
            --entry-border: 1px solid var(--separator-light);
        }
        .calendar-view.agenda-view {
            overflow-y: auto;
        }

        .timed-panel {
            grid-area: 1 / 1;
            z-index: 3;
            align-self: end;
            box-sizing: border-box;
            margin-block-end: var(--_panel-inset);
            max-block-size: min(100%, max(9em, 46%));
            display: flex;
            flex-direction: column;
            /* Normally only the rows scroll. Extremely short embeds can also
               scroll the header out of the way to reach the rows. */
            overflow: auto;
            overscroll-behavior: contain;
            background: var(--background-color);
            border: 1px solid var(--separator-mid);
            box-shadow: var(--shadow-lg);
        }
        .timed-panel:where([data-above]) {
            align-self: start;
            margin-block: var(--_panel-inset) 0;
        }
        .timed-panel > header {
            flex: none;
        }
        .timed-panel > #agenda-events {
            min-block-size: 44px;
            overflow: auto;
        }
        @container (block-size < 14em) {
            .timed-panel {
                max-block-size: 100%;
            }
            .timed-panel > #agenda-events {
                flex: none;
                overflow: visible;
            }
        }
        @container (min-width: 48em) {
            .timed-panel {
                align-self: center;
                justify-self: end;
                inline-size: min(22em, 42%);
                margin-block: 0;
                max-block-size: 90%;
            }
            .timed-panel[data-leading] {
                justify-self: start;
                margin-inline-start: var(--time-column-width, 4em);
            }
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
        .accordion-agenda .agenda-event {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            gap: 0.2em;
        }
        .agenda-details {
            padding: 0 0.75em 0.4em;
            overflow-wrap: anywhere;
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
        .agenda-toggle,
        .density-list-close {
            min-block-size: 44px;
            max-inline-size: 50%;
        }
        .agenda-toggle {
            display: grid;
        }
        .density-list-close {
            min-inline-size: 44px;
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
        }
        .agenda-events li + li {
            border-block-start: 1px solid var(--separator-light);
        }
        .agenda-event {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            align-items: baseline;
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
        .agenda-time,
        .agenda-span-range,
        .group-meta {
            font-variant-numeric: tabular-nums;
        }
        .agenda-time,
        .agenda-span-range {
            font-size: 0.8em;
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
        .agenda-text:focus-visible,
        .all-day-count:focus-visible,
        .time-group:focus-visible,
        .time-group[aria-expanded='true'] {
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
            :host {
                --_month-touch-min: 68px;
            }
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
        this._timeGridHost = undefined;
        this._timeRestoreGeneration++;
    }

    protected override updated(
        changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        const state = this._renderedState;
        this.setAttribute('data-view-mode', state.viewMode);
        if (this._menuOpen) {
            const menu = this.shadowRoot?.querySelector<LMSCalendarMenu>('lms-menu');
            if (menu) {
                menu.containment =
                    this.shadowRoot?.querySelector<HTMLElement>('.calendar-view') ?? this;
                const trigger = this._menuTriggerEntry;
                menu.returnFocusTarget =
                    trigger instanceof LMSCalendarEntry && !trigger.isConnected
                        ? this._entryFocusTarget(trigger)
                        : undefined;
            }
        }
        const focus = this._focusToRestore;
        this._focusToRestore = undefined;
        if (
            focus &&
            !this.shadowRoot?.activeElement &&
            (document.activeElement === document.body || document.activeElement === this)
        ) {
            this._entryFocusTarget(focus)?.focus({ preventScroll: true });
        }
        this._observeTimeGrid();
        const list = this._densityList;
        if (
            list &&
            (list.timed
                ? !this.shadowRoot?.querySelector('.time-group[aria-expanded="true"]')
                : !this.loading &&
                  !this.error &&
                  !this._entriesError &&
                  !this._expandedByISODate[civilDateKey(list.date)]?.some(
                      (entry) => entry.isAllDay,
                  ))
        )
            void this._closeDensityList(
                !!this.shadowRoot?.activeElement?.closest('[data-density-list]'),
            );
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
                        range: state.range,
                    },
                }),
            );
        }
        this.setAttribute(
            'data-calendar-size',
            this._calendarWidth <= 480 ? 'small' : this._calendarWidth <= 768 ? 'medium' : 'large',
        );
        if (changedProperties.has('_accent' as never)) {
            this.style.setProperty(
                '--calendar-accent',
                this._accent ? `rgb(${parseColorWithDefault(this._accent).join(', ')})` : '',
            );
        }
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
            this._timeGridHost = view;
            this._timeRestore =
                view && this._timeAnchor !== undefined
                    ? this._restoreTimePosition(view, this._timeAnchor, this._timeRestoreGeneration)
                    : undefined;
        }
        if (view) void view.updateComplete.then(() => this._readTimeGridGeometry(view));
    }

    private _timePosition(view: LMSCalendarDay | LMSCalendarWeek) {
        const scroller = view.shadowRoot?.querySelector<HTMLElement>('.timeline');
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
        const scroller = view.shadowRoot?.querySelector<HTMLElement>('.timeline');
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
        this._preferTimeGridScroll = this._prefersDetail(view, columnWidth, minimum);
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

    private _prefersDetail(view: LMSCalendarDay | LMSCalendarWeek, width: number, minimum: number) {
        const timeline = view.shadowRoot?.querySelector<HTMLElement>('.timeline');
        if (timeline && !this.scrollTimeGrid && this.timedEntryPresentation === 'card' && width) {
            const { fit, detail } = measureTimeGrid(timeline);
            if (fit && fit < detail) {
                const dates = (view instanceof LMSCalendarWeek ? view.visibleDates : undefined) ?? [
                    this.activeDate,
                ];
                const days = dates.map(civilDateKey);
                const key = [fit, detail, width, minimum, this._densityMinimumWidth, ...days].join(
                    ':',
                );
                if (key === this._timeFitKey) return this._preferTimeGridScroll;
                this._timeFitKey = key;
                return days.some((day) => {
                    const entries = this._expandedByISODate[day]?.filter(
                        (entry) => !entry.isAllDay,
                    );
                    return (
                        entries &&
                        entries.length > 1 &&
                        gainsTimedDetail(
                            entries,
                            fit,
                            detail,
                            minimum,
                            width,
                            this._densityMinimumWidth,
                        )
                    );
                });
            }
        }
        this._timeFitKey = '';
        return false;
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
            ((this._densityList && !this._densityList.timed) ||
                previousGrid.localName !== `lms-calendar-${this.viewMode}`);
        if (previousGrid?.isConnected && leavingGrid)
            this._timeAnchor = this._timePosition(previousGrid);
        const focused = this.shadowRoot?.activeElement;
        if (focused instanceof LMSCalendarEntry && focused.eventId) this._focusToRestore = focused;
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
            this._densityList &&
            (this._densityList.viewMode !== this.viewMode ||
                this._densityList.activeDay !== civilDateKey(this.activeDate))
        )
            this._densityList = undefined;
        if (
            (this.viewMode !== 'month' || this._inMonthAgenda) &&
            Object.keys(this._monthCapacity).length
        )
            this._monthCapacity = {};
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
            if (this.getAttribute('dir') !== resolved) {
                this._reflectingDirection = true;
                try {
                    this.setAttribute('dir', resolved);
                } finally {
                    this._reflectingDirection = false;
                }
            }
        }
        if (changedProperties.has('locale' as never)) this._startLocaleLoad();

        // Capture the render's inputs before any post-render listener can
        // synchronously request the next view or date.
        this._renderedState = Object.freeze({
            activeDate: Object.freeze(this.activeDate),
            viewMode: this.viewMode,
            firstDayOfWeek: this.firstDayOfWeek,
            range: Object.freeze(this._calculateVisibleRange()),
        });
        this._updateEntryCaches(
            this._renderedState.range,
            changedProperties.has('entries' as never),
        );
        const agendaKey = `${this.viewMode}:${civilDateKey(this.activeDate)}:${this.monthAgendaPresentation}:${this._densityList?.key ?? ''}`;
        if (agendaKey !== this._agendaKey) {
            this._agendaKey = agendaKey;
            this._agendaLimit = 50;
            this._agendaExpanded = false;
            this._agendaError = undefined;
        }
    }

    private _updateEntryCaches(range: CalendarVisibleRange, entriesChanged: boolean) {
        // Controller-backed navigation does not populate Lit's changed properties.
        const rangeKey = JSON.stringify([
            range,
            this.viewMode,
            this.firstDayOfWeek,
            this.monthPresentation,
        ]);
        if (!entriesChanged && rangeKey === this._derivedRangeKey) return;
        this._derivedRangeKey = rangeKey;
        this._timeFitKey = '';

        const list = this._densityList;
        const date = list && civilDateKey(list.date);
        const ids = list?.timed?.segmentIds;
        const signature = () =>
            date &&
            ids &&
            this._expandedByISODate[date]
                ?.filter((entry) => ids.has(entry.segmentId))
                .map(({ segmentId, isAllDay, time }) => JSON.stringify([segmentId, isAllDay, time]))
                .sort()
                .join('\n');
        const previous = signature();
        if (entriesChanged) {
            this._validationIssues = [];
            this._processedEntries = normalizeEntries(this.entries, (issue) =>
                this._validationIssues.push(issue),
            ).sort((a, b) => entryStartMinute(a) - entryStartMinute(b));
        }
        if (this._processedEntries.length) this._computeEntryCaches(range);
        else {
            this._entriesError = '';
            this._clearEntryCaches();
        }
        if (
            date &&
            (date < range.start ||
                (range.end !== '10000-01-01' && date >= range.end) ||
                previous !== signature())
        ) {
            void this._closeDensityList(
                !!this.shadowRoot?.activeElement?.closest('[data-density-list]'),
            );
        }
    }

    // ── Memoization helpers (the "compute" side of the memo pattern) ────
    // These run once per `entries` change — equivalent to the factory
    // function inside useMemo(() => { … }, [entries]).

    private _clearEntryCaches() {
        this._expandedEntries = [];
        this._monthPreviews = {};
        this._monthSpans = [];
        this._entrySumByDay = {};
        this._expandedByISODate = {};
        this._layoutCache.clear();
        this._allDayLayoutCache.clear();
    }

    private _computeEntryCaches(range: CalendarVisibleRange) {
        // Work is bounded by the visible range, never an event's entire lifetime.
        this._entriesError = '';
        let expanded: ModelExpandedEntry[];
        try {
            expanded = expandEntries(this._processedEntries, range);
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

        // Group once for direct Day, Week, and Agenda lookups. Order by the
        // rendered segment's start: overnight continuations start at midnight.
        this._expandedByISODate = groupByDate(this._expandedEntries);
        for (const day of Object.values(this._expandedByISODate))
            day.sort((a, b) => entryStartMinute(a) - entryStartMinute(b));

        if (
            this.viewMode === 'month' &&
            !this._inMonthAgenda &&
            this.monthPresentation !== 'presence'
        )
            this._monthPreviews = buildMonthPreviews(
                getMonthCalendarArray(this.activeDate, this.firstDayOfWeek),
                this._expandedEntries,
            );
        this._monthSpans =
            this.viewMode === 'month' && this.monthPresentation === 'presence'
                ? buildMonthSpans(
                      getMonthCalendarArray(this.activeDate, this.firstDayOfWeek),
                      this._expandedEntries,
                  )
                : [];

        // Month and Year consume the same counts under their date-grid keys.
        this._entrySumByDay = {};
        for (const bucket of Object.values(this._expandedByISODate)) {
            this._entrySumByDay[dateSlotKey(bucket[0].date.start)] = bucket.length;
        }

        // Entries changed; cached layouts are stale.
        this._layoutCache.clear();
        this._allDayLayoutCache.clear();
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
        const { range, viewMode } = this._renderedState;
        const first = parseCalendarDate(range.start)!;
        const last =
            range.end === '10000-01-01'
                ? { year: 9999, month: 12, day: 31 }
                : addDisplayDays(parseCalendarDate(range.end)!, -1);
        const format = getMessageFormatters(this.locale);
        const label = getMessages(this.locale)[this._inMonthAgenda ? 'agenda' : viewMode];
        return `${format.viewLabel(label)}: ${formatLocalizedDateInterval(first, last, this.locale)}`;
    }

    private _weekContext() {
        return computeWeekDisplayContext(
            this.activeDate,
            this.firstDayOfWeek,
            this._calendarWidth,
            this,
        );
    }

    private _handleTimelineFocus(event: FocusEvent) {
        const timeline = event.composedPath()[0];
        if (!(timeline instanceof Element) || !timeline.matches('.timeline')) return;
        const view = event.currentTarget as HTMLElement;
        requestAnimationFrame(() => {
            if (!timeline.matches(':focus')) return;
            // Native focus can leave a nested timeline partly clipped. Reveal it
            // inside the calendar without scrolling the page or changing the time.
            let { top, bottom } = timeline.getBoundingClientRect();
            for (const port of [view, view.closest<HTMLElement>('.calendar-container')!]) {
                const start = port.getBoundingClientRect().top + port.clientTop;
                const end = start + port.clientHeight;
                const before = top - start;
                const after = bottom - end;
                const offset = port.scrollTop;
                if (before * after > 0)
                    port.scrollTop += Math.abs(before) < Math.abs(after) ? before : after;
                // Reveal only the part that the inner scrollport can show.
                const moved = offset - port.scrollTop;
                top = Math.max(top + moved, start);
                bottom = Math.min(bottom + moved, end);
            }
        });
    }

    override render() {
        const { viewMode, activeDate: currentActiveDate } = this._renderedState;
        const weekContext = viewMode === 'week' ? this._weekContext() : undefined;
        const list = this._densityList;
        const replacingGrid = list?.timed ? undefined : list;
        const timeGrid = (viewMode === 'day' || viewMode === 'week') && !replacingGrid;
        const scrollTimeGrid = this.scrollTimeGrid || this._preferTimeGridScroll;
        const rangeDescription = this._rangeDescription();

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
                <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">${rangeDescription}</p>
                <div class="calendar-body${timeGrid ? ' timeline-body' : ''}" @open-menu=${this._handleOpenMenu} @keydown=${this._handleDensityKeydown}>
                <section class="calendar-view${timeGrid ? ' time-grid' : replacingGrid ? ' agenda-view' : viewMode === 'year' ? ' year-view' : ''}" style=${styleMap({ '--_time-grid-tail': `${this.timedEntryPresentation === 'card' ? this._timeGridMinimum : 0}px` })} role="region" data-menu-focus-fallback tabindex="-1" aria-label=${rangeDescription} aria-busy=${this.loading ? 'true' : 'false'} @focusin=${this._handleTimelineFocus}>
                    ${this._entriesError ? html`<slot name="entries-error"><p role="alert" lang="en">${this._entriesError}</p></slot>` : nothing}
                    ${viewMode === 'month' ? this._renderMonthView() : nothing}
                    ${
                        replacingGrid
                            ? this._renderDateAgenda(replacingGrid.date, replacingGrid)
                            : weekContext
                              ? (() => {
                                    const ctx = weekContext;
                                    const result = this._renderEntriesByDate(ctx);
                                    return html`
                                      <lms-calendar-week
                                          @expand=${this._handleExpand}
                                          @peek-navigate=${this._handlePeekNavigate}
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          @time-grid-resize=${this._handleTimeGridResize}
                                          .scrollTimeGrid=${scrollTimeGrid}
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
                              : viewMode === 'day'
                                ? (() => {
                                      const result = this._renderEntriesByDate();
                                      return html`
                                      <lms-calendar-day
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          @time-grid-resize=${this._handleTimeGridResize}
                                          .scrollTimeGrid=${scrollTimeGrid}
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
                ${list?.timed ? this._renderDateAgenda(list.date, list) : nothing}
                </div>

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
            if (this.viewMode === 'week') {
                const { isCondensed, weekDates } = this._weekContext();
                // Continue at the start of the next week, not at the old window's offset.
                if (isCondensed) {
                    this._viewState.setActiveDate(addDisplayDays(weekDates[6], 1));
                    return;
                }
            }
            this._viewState.navigateNext(this.firstDayOfWeek);
        } else if (e.detail.direction === 'previous') {
            this._viewState.navigatePrevious(this.firstDayOfWeek);
        }
    }

    private _handleSwitchView(e: CustomEvent) {
        // Persistent toolbar controls retain focus when switching views.
        this._densityList = undefined;
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
        this._densityList = undefined;
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

    private _entryFocusTarget(origin: LMSCalendarEntry) {
        const root = this.shadowRoot!;
        const date = origin.date && civilDateKey(origin.date.start);
        const entry = [...root.querySelectorAll('lms-calendar-entry')].find(
            (candidate) =>
                candidate.eventId === origin.eventId &&
                (candidate.slot === origin.slot ||
                    (date &&
                        candidate.date &&
                        candidate.displayMode === 'month-span' &&
                        civilDateKey(candidate.date.start) <= date &&
                        civilDateKey(candidate.date.end) >= date)),
        );
        if (entry && getComputedStyle(entry).display !== 'none') return entry;
        return (
            root.querySelector('lms-calendar-month')?.previewFocusTarget(origin.slot) ??
            root.querySelector<HTMLElement>(`[data-density-key="all-day:${date}"]`) ??
            root.querySelector<HTMLElement>('[data-menu-focus-fallback]') ??
            undefined
        );
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

    private get _inlineMonth() {
        return (
            this.monthPresentation !== 'auto' ||
            this.monthDayBehavior === 'inline' ||
            (this.monthDayBehavior === 'auto' && this._compactMonth)
        );
    }

    private _renderMonthView() {
        return this._inMonthAgenda
            ? this._renderDateAgenda(this.activeDate)
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
                @preview-capacity-change=${(event: CustomEvent<Record<string, number>>) => {
                    this._monthCapacity = event.detail;
                }}
                @date-navigate=${this._handleDateNavigate}
                @clear-other-selections=${this._handleClearOtherSelections}
                .activeDate=${this.activeDate}
                .firstDayOfWeek=${this.firstDayOfWeek}
                .locale=${this.locale}
                .localeVersion=${this._localeVersion}
                .entryCounts=${this._entrySumByDay}
                .compact=${compact}
                .previewRows=${compact ? undefined : this._monthPreviews}
                .spans=${this.monthPresentation === 'presence' ? this._monthSpans : []}
                .selectedDate=${this._inlineMonth || this._hasMonthAgenda ? this.activeDate : undefined}
                .trace=${trace}
            >${compact ? nothing : this._renderMonthEntries()}</lms-calendar-month>
            ${this._inlineMonth && !this._hasMonthAgenda ? this._renderDateAgenda(this.activeDate) : nothing}
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

    private _timeLabel(time?: CalendarTimeInterval) {
        if (!time) return '';
        const { start, end } = time;
        const first = formatLocalizedTime(start.hour, start.minute, this.locale);
        return start.hour !== end.hour || start.minute !== end.minute
            ? getMessageFormatters(this.locale).timeRange(
                  first,
                  formatLocalizedTime(end.hour, end.minute, this.locale),
              )
            : first;
    }

    /** A readable, bounded rendering of real occurrences, never synthetic events. */
    private _renderDateAgenda(date: CalendarDate, list?: DensityList) {
        const accordion = this._inMonthAgenda && !list;
        if (this._entriesError && !accordion && !list) return nothing;
        const policy = list ? 'full' : this.monthAgendaPresentation;
        const { allDay, timed, total, disclosure, remaining } = prepareAgendaEntries(
            this._expandedByISODate[civilDateKey(date)] ?? [],
            {
                limit: this._agendaLimit,
                perSection: accordion,
                previewSize: policy === 'preview' ? 3 : policy === 'on-demand' ? 0 : undefined,
                expanded: this._agendaExpanded,
                allDayOnly: !!list && !list.timed,
                segmentIds: list?.timed?.segmentIds,
            },
        );
        const mixed = accordion && allDay.length > 0 && timed.length > 0;
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
                    (entry) => this._renderAgendaRow(entry, dateLabel, accordion),
                )}
            </ol>`;
        return html`<section class="date-agenda${accordion ? ' accordion-agenda' : list?.timed ? ' timed-panel' : ''}"
            id=${ifDefined(list?.timed ? 'timed-panel' : undefined)} ?data-above=${list?.timed?.above} ?data-leading=${list?.timed?.leading}
            style=${list?.timed ? `--_panel-inset:${list.timed.inset}px` : ''}
            aria-labelledby=${list?.timed ? 'agenda-date timed-panel-range' : 'agenda-date'} data-density-list=${list ? '' : nothing}>
            <header><div><h2 id="agenda-date" tabindex="-1">${dateLabel}</h2>
                ${list?.timed ? html`<p id="timed-panel-range" class="agenda-count">${this._timeLabel(list.timed.time)}</p>` : nothing}
                ${!total && (this.loading || this.error || this._entriesError) ? nothing : html`<p class="agenda-count">${format.eventCount(total)}</p>`}
            </div>
            ${
                list
                    ? html`<button class="agenda-action density-list-close" type="button" @click=${() => this._closeDensityList()}>${messages.close}</button>`
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
            <div id="agenda-events">
                ${renderRows(allDay, true)}
                ${renderRows(timed, false)}
                ${
                    remaining > 0
                        ? html`<button type="button" class="agenda-action agenda-more" @click=${this._showMoreAgenda}>+${format.moreEvents(remaining)}</button>`
                        : nothing
                }
            </div>
        </section>`;
    }

    private _renderAgendaRow(entry: ExpandedCalendarEntry, dateLabel: string, accordion: boolean) {
        const messages = getMessages(this.locale);
        const heading = entry.heading || messages.noTitle;
        const spanRange = formatMonthSpanRange(entry, this.locale);
        const [color] = getColorTextWithContrast(entry.color);
        const time = entry.isAllDay ? messages.allDay : this._timeLabel(entry.time);
        const timeLabel = entry.isAllDay ? nothing : html`<bdi class="agenda-time">${time}</bdi>`;
        const label = accordion
            ? nothing
            : getMessageFormatters(this.locale).eventLabel(heading, spanRange || dateLabel, time);
        const key = accordion ? civilDateKey(this.activeDate) : '';
        const open = accordion && this._agendaDisclosures.get(key) === entry.sourceId;
        const expanded = accordion
            ? open
            : this._menuOpen && this._menuEventDetails?.eventId === entry.sourceId;
        const canonical = entry.canonicalEntry;
        const content = accordion ? entry.content.trim() : '';
        return html`<li @keydown=${
            open
                ? (event: KeyboardEvent) => {
                      if (event.key !== 'Escape') return;
                      (event.currentTarget as HTMLElement)
                          .querySelector('button')
                          ?.focus({ preventScroll: true });
                      this._toggleAgendaDisclosure(key, entry.sourceId, true, false);
                      event.stopPropagation();
                  }
                : nothing
        }>
            <button type="button" class="agenda-event" aria-label=${label} aria-expanded=${expanded ? 'true' : 'false'}
                data-entry-request=${accordion ? nothing : ''} data-event-id=${accordion ? nothing : entry.sourceId}
                style=${styleMap({ '--list-event-color': color })}
                @click=${(event: MouseEvent) => {
                    if (!accordion) return this._requestAgendaEntry(event, entry, time);
                    if (!open && !this._allowEntryActivation(canonical, entry.sourceId)) return;
                    this._toggleAgendaDisclosure(
                        key,
                        entry.sourceId,
                        open,
                        entry.continuation.total > 1,
                    );
                }}>
                ${accordion ? nothing : timeLabel}
                <span class="agenda-title">${heading}</span>
                ${accordion ? timeLabel : nothing}
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

    private _requestAgendaEntry(
        event: MouseEvent,
        entry: ExpandedCalendarEntry,
        displayTime: string,
    ) {
        const invoker = event.currentTarget as HTMLButtonElement;
        invoker.focus({ preventScroll: true });
        const canonical = entry.canonicalEntry;
        invoker.dispatchEvent(
            new CustomEvent('open-menu', {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    heading: canonical.heading || getMessages(this.locale).noTitle,
                    content: canonical.content ?? '',
                    time: entry.time,
                    displayTime,
                    date: entry.date.start,
                    anchorRect: invoker.getBoundingClientRect(),
                    entry: canonical,
                    eventId: entry.sourceId,
                },
            }),
        );
    }

    private _renderMonthEntries() {
        const visible = [];
        for (const [column, [slot, rows]] of Object.entries(this._monthPreviews).entries()) {
            const capacity = Math.min(rows.length, this._monthCapacity[slot] ?? 0);
            for (let row = 0; row < capacity; row++) {
                const entry = rows[row];
                if (entry) visible.push({ entry, row, column });
            }
        }
        const elements = joinVisibleSpans(visible).map((run) => {
            const { entry, row } = run;
            if (entry.isAllDay) return this._renderAllDayBar(run, 'month');
            const [color] = getColorTextWithContrast(entry.color);
            return this._composeEntry({
                index: entry.originalIndex,
                slot: dateSlotKey(entry.date.start),
                inlineStyle: `--entry-color: ${color}; --entry-background-color: ${color}; --all-day-row: ${row}`,
                entry,
                displayMode: 'month-dot',
            });
        });
        return repeat(
            elements,
            (item) => item.key,
            (item) => item.template,
        );
    }

    private _renderAllDayBar(
        { entry, end, row, length }: VisibleSpan<ExpandedCalendarEntry>,
        view: 'day' | 'week' | 'month',
    ) {
        const { year, month, day } = entry.date.start;
        const preview = view === 'month';
        const [r, g, b] = parseColorWithDefault(entry.color);
        const range =
            formatMonthSpanRange(entry, this.locale) ||
            formatLocalizedDate(day, month, year, this.locale);
        const result = this._composeEntry({
            index: entry.originalIndex,
            slot: preview
                ? dateSlotKey(entry.date.start)
                : view === 'week'
                  ? allDaySlotName(entry.date.start)
                  : 'all-day',
            inlineStyle: `--entry-color: ${this._safeEntryColor(entry.color)}; --entry-background-color: rgba(${r}, ${g}, ${b}, ${preview ? 0.12 : 0.08}); --entry-border: 1px solid rgba(${r}, ${g}, ${b}, ${preview ? 0.3 : 0.25}); --_span-width: calc(${length * 100}% + ${length - 1} * var(--_span-gap, 1px)); --all-day-row: ${row}; --entry-z-index: ${100 + row};`,
            entry: {
                ...entry,
                date: { start: entry.date.start, end: end.date.end },
                accessibility: {
                    tabIndex: 0,
                    role: 'button',
                    ariaLabel: getMessageFormatters(this.locale).eventLabel(
                        entry.heading || getMessages(this.locale).noTitle,
                        range,
                        getMessages(this.locale).allDay,
                    ),
                },
            },
            density: preview ? 'compact' : 'standard',
            displayMode: preview ? 'month-span' : 'default',
            spanClass:
                view === 'day'
                    ? ''
                    : `${entry.continuation.is ? 'open-start' : ''} ${end.continuation.has ? 'open-end' : ''}`,
        });
        // Week has one window: keep the bar keyed to the occurrence even if
        // its first visible date changes. Month can show several runs.
        if (view === 'week') result.key = entry.occurrenceId;
        return result;
    }

    private _renderEntriesByDate(weekCtx?: WeekDisplayContext) {
        const currentActiveDate = this.activeDate;
        const viewMode = weekCtx ? 'week' : 'day';
        const dates = weekCtx?.visibleDates ?? [currentActiveDate];
        const condensedDates = weekCtx?.isCondensed ? dates : undefined;
        const allDayEntries: ExpandedCalendarEntry[] = [];
        const allElements: EntryRender[] = [];
        // Keep the cached date buckets and their reading order, rather than
        // flattening and regrouping Week on each render.
        let offset = 0;
        for (const date of dates) {
            const timed: ExpandedCalendarEntry[] = [];
            for (const entry of this._expandedByISODate[civilDateKey(date)] ?? [])
                (entry.isAllDay ? allDayEntries : timed).push(entry);
            if (timed.length) {
                allElements.push(
                    ...this._renderDayEntriesWithSlotManager(
                        timed,
                        viewMode,
                        currentActiveDate,
                        offset,
                        condensedDates,
                    ),
                );
                offset += timed.length;
            }
        }
        if (!offset && !allDayEntries.length)
            return { elements: nothing, allDayRowCount: 0, allDaySummary: false };

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

        const allDayKey = `${viewMode}:${civilDateKey(dates[0])}:${dates.length}`;
        let allDayLayout = this._allDayLayoutCache.get(allDayKey);
        if (!allDayLayout) {
            allDayLayout = layoutAllDaySegments(
                allDayEntries.map((entry) => ({
                    entry,
                    column: slotManager.getIndexInDates(entry.date.start, dates),
                })),
            );
            this._allDayLayoutCache.set(allDayKey, allDayLayout);
        }

        const { placements, totalRows } = allDayLayout;
        if (weekCtx && allDayByDate && totalRows > maxPreviewRows)
            return this._renderWeekAllDaySummary(weekCtx, allDayByDate, allElements);

        const allDayElements = joinVisibleSpans(placements).map((run) =>
            this._renderAllDayBar(run, viewMode),
        );

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
                <button type="button" class="all-day-count" slot=${allDaySlotName(date)}
                    data-density-key=${key} aria-label=${format.eventLabel(messages.allDay, dateLabel, format.eventCount(entries.length))}
                    @click=${() => this._showDensityList(date, key)}>
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
        offset: number,
        condensedDates?: CalendarDate[],
    ) {
        // Cache key from the day being rendered (all entries share the same date)
        const cacheKey = `${civilDateKey(dayEntries[0].date.start)}:${this.timedEntryPresentation}`;
        const useMarkers = this.timedEntryPresentation === 'marker';

        // A width change can affect density without changing the collision boxes.
        let layout = this._layoutCache.get(cacheKey);
        if (!layout) {
            layout = layoutTimedEntries(
                dayEntries,
                { minuteHeight: this._timeGridScale, eventMinHeight: this._timeGridMinimum },
                useMarkers,
            );
            this._layoutCache.set(cacheKey, layout);
        }

        const columnWidth =
            this._timeGridColumnWidth ||
            this._calendarWidth / (viewMode === 'week' ? condensedDates?.length || 7 : 1);
        const denseGroups = getDenseTimedGroups(
            layout.boxes,
            columnWidth,
            this._densityMinimumWidth,
        );

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
            const globalIndex = offset + index;

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
            const labelOffset = useMarkers
                ? layoutBox.y / this._timeGridScale - entryStartMinute(entry)
                : 0;

            return [
                this._composeEntry({
                    index: globalIndex,
                    slot: position.slotName,
                    inlineStyle: `--entry-color: ${this._safeEntryColor(entry.color)}; --entry-layout: ${smartLayout}; --entry-label-offset: calc(${labelOffset} * var(--minute-height)); ${positionCSS}`,
                    displayMode: useMarkers ? 'time-mark' : 'default',
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
            first = Math.min(first, entryStartMinute(entry));
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
        const open = this._densityList?.key === key && this._densityList.timed;
        const expanded =
            !!open &&
            open.segmentIds.size === indices.length &&
            indices.every((index) => open.segmentIds.has(entries[index].segmentId));
        return {
            key: `density-${key}`,
            template: html`<div class="time-group-range" slot=${position.slotName} style=${style}>
            <button type="button" class="time-group" data-density-key=${key} aria-label=${label}
                aria-expanded=${expanded} aria-controls=${expanded ? 'timed-panel' : nothing}
                @click=${(event: Event) => {
                    if (expanded) return this._closeDensityList();
                    const view =
                        this.shadowRoot!.querySelector('.time-grid')!.getBoundingClientRect();
                    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
                    const frame = this.getBoundingClientRect();
                    const top = Math.max(0, frame.top, view.top);
                    const bottom = Math.min(innerHeight, frame.bottom, view.bottom);
                    const above = rect.top + rect.bottom > top + bottom;
                    return this._showDensityList(date, key, {
                        segmentIds: new Set(indices.map((index) => entries[index].segmentId)),
                        time,
                        above,
                        inset: above ? top - view.top : view.bottom - bottom,
                        leading:
                            rect.width < view.width / 2 &&
                            rect.left + rect.right > view.left + view.right !==
                                (this.getAttribute('dir') === 'rtl'),
                    });
                }}>
                <strong>${count}</strong>
                <span class="group-meta" aria-hidden="true"><bdi>${range}</bdi></span>
            </button>
        </div>`,
        };
    }

    private async _showDensityList(date: CalendarDate, key: string, timed?: DensityList['timed']) {
        const { viewMode, activeDate } = this;
        if (viewMode !== 'day' && viewMode !== 'week') return;
        const list: DensityList = {
            date,
            viewMode,
            activeDay: civilDateKey(activeDate),
            key,
            timed,
        };
        this._densityList = list;
        await this.updateComplete;
        if (this._densityList !== list) return;
        const panel = this.shadowRoot?.querySelector<HTMLElement>('#timed-panel');
        if (panel) {
            panel.scrollTop = 0;
            panel.querySelector<HTMLElement>('#agenda-events')!.scrollTop = 0;
        }
        this.shadowRoot?.querySelector<HTMLElement>('#agenda-date')?.focus({ preventScroll: true });
    }

    private async _showMoreAgenda(event: Event) {
        const trigger = event.currentTarget as HTMLElement;
        this._agendaLimit += 50;
        if (this.shadowRoot?.activeElement !== trigger) return;
        const agenda = trigger.closest('.date-agenda')!;
        const before = new Set(agenda.querySelectorAll('.agenda-event'));
        await this.updateComplete;
        if (!agenda.isConnected) return;
        [...agenda.querySelectorAll<HTMLButtonElement>('.agenda-event')]
            .find((row) => !before.has(row))
            ?.focus();
    }

    private _handleDensityKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape' && this._densityList?.timed && !event.defaultPrevented) {
            event.preventDefault();
            void this._closeDensityList();
        }
    }

    private async _closeDensityList(restoreFocus = true) {
        const previous = this._densityList;
        if (!previous) return;
        this._densityList = undefined;
        if (!restoreFocus) return;
        await this.updateComplete;
        const generation = this._timeRestoreGeneration;
        await this._timeRestore;
        if (!this.isConnected || generation !== this._timeRestoreGeneration || this._densityList)
            return;
        const trigger = [
            ...(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-density-key]') ?? []),
        ].find((button) => button.dataset.densityKey === previous.key);
        const timeline =
            previous.timed &&
            this._timeGridHost?.shadowRoot?.querySelector<HTMLElement>('.timeline');
        if (timeline) {
            const rect = trigger?.getBoundingClientRect();
            const port = timeline.getBoundingClientRect();
            const frame = this.getBoundingClientRect();
            const visible =
                rect &&
                Math.min(rect.bottom, port.bottom, frame.bottom, innerHeight) -
                    Math.max(rect.top, port.top, frame.top, 0) >=
                    Math.min(24, rect.height) &&
                Math.min(rect.right, port.right, frame.right, innerWidth) -
                    Math.max(rect.left, port.left, frame.left, 0) >=
                    Math.min(24, rect.width);
            (visible ? trigger : timeline)?.focus({ preventScroll: true });
        } else if (trigger) trigger.focus({ preventScroll: true });
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
        /** Invalid entry records or a non-array input (index -1). */
        'entries-invalid': CustomEvent<{ issues: EntryValidationIssue[] }>;
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
