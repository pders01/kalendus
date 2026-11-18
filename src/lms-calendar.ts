import { LitElement, PropertyValueMap, TemplateResult, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DateTime } from 'luxon';
import { groupBy, map, pipe, sortBy } from 'remeda';

import LMSCalendarContext from './components/Context.js';
import LMSCalendarDay from './components/Day.js';
import LMSCalendarEntry from './components/Entry.js';
import LMSCalendarHeader from './components/Header.js';
import './components/Context.js';
import LMSCalendarMenu from './components/Menu.js';
import './components/Day.js';
import LMSCalendarMonth from './components/Month.js';
import './components/Entry.js';
import LMSCalendarWeek from './components/Week.js';
import './components/Header.js';
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
import {
    ensureLocale,
    getMessages,
    getMessageFormatters,
    isLocaleLoaded,
    normalizeLocale,
    resolveLocale,
} from './lib/messages.js';
import {
    slotManager,
    type LayoutDimensions,
    type PositionConfig,
    type FirstDayOfWeek,
} from './lib/SlotManager.js';
import type { ViewMode } from './lib/ViewStateController.js';
import { ViewStateController } from './lib/ViewStateController.js';
import { computeWeekDisplayContext, type WeekDisplayContext } from './lib/weekDisplayContext.js';
import { getMonthCalendarArray, getWeekDates } from './lib/weekStartHelper.js';

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

type EntryRender = { key: string; template: TemplateResult };

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

    private _viewState = new ViewStateController(this);

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
        this._viewState.setViewMode(value);
    }

    /** Half-open ISO civil-date range actually rendered, including month spillover. */
    get visibleRange(): CalendarVisibleRange {
        const active = DateTime.fromObject(this.activeDate, { zone: 'UTC' });
        let start = active.startOf('day');
        let end = start.plus({ days: 1 });
        if (this.viewMode === 'month') {
            const dates = getMonthCalendarArray(this.activeDate, this.firstDayOfWeek);
            if (dates?.length) {
                start = DateTime.fromObject(dates[0], { zone: 'UTC' });
                end = DateTime.fromObject(dates[dates.length - 1], { zone: 'UTC' }).plus({
                    days: 1,
                });
            }
        } else if (this.viewMode === 'week') {
            const { visibleDates } = computeWeekDisplayContext(
                this.activeDate,
                this.firstDayOfWeek,
                this._calendarWidth,
                this,
            );
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

    /** Mobile badge view: per-day event counts, ready for _renderEntriesSumByDay. */
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
    private _timeGridHost?: LMSCalendarDay | LMSCalendarWeek;
    private _timeGridObserver?: MutationObserver;
    private _resizeObserver?: ResizeObserver;

    static override styles = css`
        :host {
            display: block;
            contain: layout style paint;
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
            --primary-color: var(--calendar-accent, AccentColor);

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
            --entry-highlight-color: color-mix(in srgb, AccentColor 12%, transparent);
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
            --entry-title-weight: inherit;
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
            --year-month-label-font-size: 0.875em;
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
            --current-day-bg: AccentColor;
            --current-day-color: Canvas;
            --current-day-font-weight: inherit;
            --current-day-hover-opacity: 1;
            --current-dot-bg: Canvas;
            --year-heatmap-4-text: inherit;

            /* Year view — calendar week column */
            --year-cw-width: 1.8em;
            --year-cw-font-size: 0.55em;
            --year-cw-color: var(--header-text-color, rgba(0, 0, 0, 0.45));

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
        header {
            flex-shrink: 0;
        }
        .calendar-view {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
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
        .day-summary {
            display: block;
            min-width: 24px;
            min-height: 24px;
            max-width: 100%;
            margin-block: 2px;
            padding: 0.25em 0.5em;
            border: 1px solid var(--separator-mid);
            border-radius: var(--border-radius-sm);
            background: var(--background-color);
            color: inherit;
            font: inherit;
            cursor: pointer;
        }
        .day-summary:focus-visible {
            outline: 2px solid var(--entry-focus-color);
            outline-offset: 2px;
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
        this._timeGridObserver?.disconnect();
        this._timeGridHost = undefined;
        clearTimeout(this._midnightTimer);
    }

    protected override updated(
        changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
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
            }
        }
        if (view) void view.updateComplete.then(() => this._readTimeGridGeometry(view));
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
        const widthPercent = pixels(control?.style.width) || 100;
        const columnWidth = ((control?.getBoundingClientRect().width ?? 0) * 100) / widthPercent;
        const insets =
            pixels(contentStyle?.paddingLeft) +
            pixels(contentStyle?.paddingRight) +
            pixels(style?.paddingLeft) +
            pixels(style?.paddingRight) +
            pixels(style?.borderLeftWidth) +
            pixels(style?.borderRightWidth);
        // Reserve visible title space as well as the time. A height-only rule
        // can leave a routine mobile Week event with a zero-width title.
        // Normalize the sampled card to its column, then allow for the 65%
        // foreground cascade; do not read every event's layout on each update.
        const rowMinimum =
            (time?.getBoundingClientRect().width ?? 0) + pixels(style?.fontSize) * 3 + gap + insets;
        const forceStack = !!time && columnWidth > 0 && columnWidth * 0.65 < rowMinimum;
        const minimum = Math.max(
            24,
            pixels(style?.minHeight),
            Math.ceil(contentMinimum),
            forceStack ? stackMinimum : 0,
        );
        if (
            (Number.isFinite(scale) &&
                scale > 0 &&
                Math.abs(scale - this._timeGridScale) > 0.0001) ||
            minimum !== this._timeGridMinimum ||
            stackMinimum !== this._timeGridStackMinimum ||
            forceStack !== this._timeGridForceStack
        ) {
            if (Number.isFinite(scale) && scale > 0) this._timeGridScale = scale;
            this._timeGridMinimum = minimum;
            this._timeGridStackMinimum = stackMinimum;
            this._timeGridForceStack = forceStack;
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
            if (w > 0 && w !== this._calendarWidth) {
                this._calendarWidth = w;
            }
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
        const focused = this.shadowRoot?.activeElement;
        if (focused instanceof LMSCalendarEntry && focused.eventId) {
            this._focusToRestore = { eventId: focused.eventId, slot: focused.slot };
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
        const rangeKey = JSON.stringify([this.visibleRange, this.viewMode, this.firstDayOfWeek]);
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
            const { year, month, day } = entry.date.start;
            const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
            if (this._isEffectivelyAllDay(entry)) {
                monthAllDay.push(entry);
            } else {
                monthTimed.push(entry);
            }
        }

        // Sort timed entries for month view (existing behavior)
        this._monthViewSorted = pipe(
            monthTimed,
            sortBy((entry) => {
                const isMultiDay = entry.continuation?.has || false;
                return isMultiDay ? entry.originalIndex - 1000 : entry.originalIndex;
            }),
            map((entry) => {
                const [background] = getColorTextWithContrast(entry.color);
                return { entry, background, originalIndex: entry.originalIndex };
            }),
        );

        // 4. Month view: compute all-day row allocations per week (includes sorting)
        this._monthAllDayLayoutCache =
            this.viewMode === 'month' ? this._computeMonthAllDayLayout(monthAllDay) : [];

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
        const sorted = pipe(
            allDayEntries,
            sortBy((entry) => {
                const isMultiDay = entry.continuation?.has || false;
                return isMultiDay ? entry.originalIndex - 1000 : entry.originalIndex;
            }),
            map((entry) => {
                const [background] = getColorTextWithContrast(entry.color);
                return { entry, background, originalIndex: entry.originalIndex };
            }),
        );

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
                    id: this._createConsistentEventId(entry),
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
        return `${format.viewLabel(getMessages(this.locale)[this.viewMode])}: ${start === end ? start : format.timeRange(start, end)}`;
    }

    override render() {
        const viewMode = this._viewState.viewMode;
        const currentActiveDate = this._viewState.activeDate;

        return html`
            <div class="calendar-container${this._localeReady ? '' : ' locale-loading'}">
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
                        .expandedDate=${viewMode === 'day' ? currentActiveDate : undefined}
                        .locale=${this.locale}
                        .localeVersion=${this._localeVersion}
                        .firstDayOfWeek=${this.firstDayOfWeek}
                        .visibleDates=${viewMode === 'week' ? computeWeekDisplayContext(currentActiveDate, this.firstDayOfWeek, this._calendarWidth, this).visibleDates : undefined}
                    >
                    </lms-calendar-header>
                </header>

                <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">${this._rangeDescription()}</p>
                <section class="calendar-view" role="region" data-menu-focus-fallback tabindex="-1" aria-label=${this._rangeDescription()} @open-menu=${this._handleOpenMenu}>
                    ${this._entriesError ? html`<slot name="entries-error"><p role="alert" lang="en">${this._entriesError}</p></slot>` : nothing}
                    ${
                        viewMode === 'month'
                            ? html`
                              <lms-calendar-month
                                  @expand=${this._handleExpand}
                                  @date-summary=${this._handleExpand}
                                  @date-navigate=${this._handleDateNavigate}
                                  @clear-other-selections=${this._handleClearOtherSelections}
                                  .activeDate=${currentActiveDate}
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                                  .locale=${this.locale}
                                  .localeVersion=${this._localeVersion}
                                  .entryCounts=${this._entrySumByDay}
                              >
                                  ${
                                      this._calendarWidth < 768
                                          ? this._renderEntriesSumByDay()
                                          : this._renderMonthEntries()
                                  }
                              </lms-calendar-month>
                          `
                            : nothing
                    }
                    ${
                        viewMode === 'week'
                            ? (() => {
                                  const ctx = computeWeekDisplayContext(
                                      currentActiveDate,
                                      this.firstDayOfWeek,
                                      this._calendarWidth,
                                      this,
                                  );
                                  const result = this._renderEntriesByDate(ctx);
                                  return html`
                                      <lms-calendar-week
                                          @expand=${this._handleExpand}
                                          @peek-navigate=${this._handlePeekNavigate}
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          .activeDate=${currentActiveDate}
                                          .allDayRowCount=${result.allDayRowCount}
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
                            ? (() => {
                                  const result = this._renderEntriesByDate();
                                  return html`
                                      <lms-calendar-day
                                          @clear-other-selections=${this._handleClearOtherSelections}
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
        if (e.detail.direction === 'next') {
            this._viewState.navigateNext();
        } else if (e.detail.direction === 'previous') {
            this._viewState.navigatePrevious();
        }
    }

    private _handleSwitchView(e: CustomEvent) {
        // Persistent toolbar controls retain focus when switching views.
        this.viewMode = e.detail.view;
    }

    private async _focusView() {
        await this.updateComplete;
        if (!this.isConnected) return;
        const view = this.shadowRoot?.querySelector<
            LMSCalendarMonth | LMSCalendarYear | LMSCalendarDay | LMSCalendarWeek
        >('lms-calendar-month, lms-calendar-year, lms-calendar-day, lms-calendar-week');
        if (view) await view.focusDate(this.activeDate);
        else this.shadowRoot?.querySelector<HTMLElement>('[data-menu-focus-fallback]')?.focus();
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
        this._viewState.setActiveDate(e.detail.date);
        const target = e.detail.drillTarget || 'day';
        if (target === 'month') {
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
        displayMode?: 'default' | 'month-dot' | 'month-span';
        floatText?: boolean;
        spanClass?: string;
    }) {
        // Determine density based on event duration and context if not explicitly set
        const determinedDensity = density || this._determineDensity(entry, undefined, undefined);

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

    private _determineDensity(
        entry: Partial<CalendarEntry>,
        grading?: Grading[],
        index?: number,
    ): 'compact' | 'standard' | 'full' {
        if (!entry.time) return 'compact'; // Default to compact for month view

        // For overlapping events in day/week view, use consistent density
        // based on depth to maintain visual hierarchy
        if (grading && index !== undefined && grading[index]) {
            // All overlapping events should have consistent display
            // Top event (depth 0): show time
            // Deeper events: also show time for consistency
            // This prevents the visual chaos of mixed display modes
            return 'standard';
        }

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

    private _createConsistentEventId(entry: ExpandedCalendarEntry): string {
        return entry.occurrenceId;
    }

    /**
     * Render all entries for month view (both all-day and timed).
     * All-day entries use connected bar styling, timed entries use dot indicators.
     * All entries go into the same per-day slots.
     */
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
                    const eventId = this._createConsistentEventId(entry);
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
                        density: this._determineDensity(
                            {
                                time: entry.time,
                                heading: entry.heading,
                                content: entry.content,
                            },
                            undefined,
                            undefined,
                        ),
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
            return { elements: nothing, allDayRowCount: 0 };
        }

        // O(1) map lookups instead of O(n) expansion + Luxon filtering
        let allEntriesForDate: ExpandedCalendarEntry[];

        if (viewMode === 'day') {
            const key = `${currentActiveDate.year}-${String(currentActiveDate.month).padStart(2, '0')}-${String(currentActiveDate.day).padStart(2, '0')}`;
            allEntriesForDate = this._expandedByISODate.get(key) ?? [];
        } else {
            // Week view: use visible dates from context (condensed or full)
            const datesToRender =
                weekCtx?.visibleDates ?? getWeekDates(currentActiveDate, this.firstDayOfWeek);
            allEntriesForDate = datesToRender.flatMap((wd) => {
                const key = `${wd.year}-${String(wd.month).padStart(2, '0')}-${String(wd.day).padStart(2, '0')}`;
                return this._expandedByISODate.get(key) ?? [];
            });
        }

        // Single-pass partition into all-day vs timed entries
        const allDayEntries: ExpandedCalendarEntry[] = [];
        const entriesByDate: ExpandedCalendarEntry[] = [];
        for (const entry of allEntriesForDate) {
            (this._isEffectivelyAllDay(entry) ? allDayEntries : entriesByDate).push(entry);
        }

        if (!entriesByDate.length && !allDayEntries.length) {
            return { elements: nothing, allDayRowCount: 0 };
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
                const entriesByDay = groupBy(
                    entriesByDate,
                    (entry) =>
                        `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
                );

                const condensedDates = weekCtx?.isCondensed ? weekCtx.visibleDates : undefined;

                // Iterate in known day order — no sort needed
                const datesToRender =
                    condensedDates ?? getWeekDates(currentActiveDate, this.firstDayOfWeek);

                for (const wd of datesToRender) {
                    const dayEntries = entriesByDay[`${wd.year}-${wd.month}-${wd.day}`];
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

        // Compute all-day layout declaratively (cached — only recomputes when entries change)
        const condensedDatesForAllDay = weekCtx?.isCondensed ? weekCtx.visibleDates : undefined;
        const allDayKey =
            viewMode === 'week'
                ? `${currentActiveDate.year}-${currentActiveDate.month}-${currentActiveDate.day}-${this.firstDayOfWeek}-${weekCtx?.visibleStartIndex ?? 0}-${weekCtx?.visibleLength ?? 7}`
                : `day-${currentActiveDate.year}-${currentActiveDate.month}-${currentActiveDate.day}`;

        let allDayLayout = this._allDayLayoutCache.get(allDayKey);
        if (!allDayLayout) {
            const allDayLayoutEvents: AllDayEvent[] = allDayEntries.map((entry) => {
                const eventId = this._createConsistentEventId(entry);
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

        // Process all-day entries with layout info
        const allDayElements = allDayEntries.map((entry, index) => {
            const [r, g, b] = parseColorWithDefault(entry.color);
            const eventId = this._createConsistentEventId(entry);

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
        const cacheKey = `${first.date.start.year}-${String(first.date.start.month).padStart(2, '0')}-${String(first.date.start.day).padStart(2, '0')}`;

        // Reuse cached layout when only resize/locale/menu changed (not entries)
        let layout = this._layoutCache.get(cacheKey);
        if (!layout) {
            const layoutEvents = dayEntries.map((entry) => ({
                id: entry.segmentId,
                heading: entry.heading || '',
                startTime: {
                    hour: entry.time!.start.hour,
                    minute: entry.time!.start.minute,
                },
                endTime: {
                    hour: entry.time!.end.hour,
                    minute: entry.time!.end.minute,
                },
                color: entry.color || '#1976d2',
            }));
            layout = new LayoutCalculator({
                minuteHeight: this._timeGridScale,
                eventMinHeight: this._timeGridMinimum,
            }).calculateLayout(layoutEvents);
            this._layoutCache.set(cacheKey, layout);
        }

        // Render entries using SlotManager
        return dayEntries.map((entry, index) => {
            const layoutBox = layout.boxes[index];
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

            const smartLayout = this._getSmartLayout(entry, layoutBox.height, layoutBox.width, {
                depth: layoutBox.depth,
                opacity: layoutBox.opacity,
            });

            return this._composeEntry({
                index: globalIndex,
                slot: position.slotName,
                inlineStyle: `--entry-color: ${this._safeEntryColor(entry.color)}; --entry-background-color: var(--background-color); --entry-border: 1px solid var(--separator-light); --entry-border-inline-start: none; --entry-handle-color: ${this._safeEntryColor(entry.color)}; --entry-handle-width: 4px; --entry-handle-display: block; --entry-padding-inline-start: calc(4px + 0.35em); --entry-layout: ${smartLayout}; ${positionCSS}`,
                entry: {
                    ...entry,
                    // Add accessibility data to entry
                    accessibility: accessibility,
                },
                density: 'standard',
                floatText: false,
            });
        });
    }

    private _renderEntriesSumByDay() {
        // Pure read from pre-computed cache — no expansion or reduction.
        const entries = Object.entries(this._entrySumByDay);
        if (!entries.length) return nothing;

        return repeat(
            entries,
            ([key]) => key,
            ([key, value]) => {
                const number = new Intl.NumberFormat(normalizeLocale(this.locale));
                const label = value > 99 ? `${number.format(99)}+` : number.format(value);
                return html`<span slot=${`summary-${key}`}>${label}</span>`;
            },
        );
    }

    private _getSmartLayout(
        entry: CalendarEntry,
        height: number,
        _width?: number,
        layoutBox?: { depth: number; opacity: number },
    ): 'row' | 'column' {
        if (!entry.time) return 'row';

        const isOverlapping = layoutBox && layoutBox.depth > 0;

        if (!isOverlapping && !this._timeGridForceStack) return 'row';

        // Use the measured two-line requirement, not twice a single-line
        // target floor. Narrow columns reserve that height in collision work.
        return height >= this._timeGridStackMinimum - 0.5 ? 'column' : 'row';
    }

    private _isEffectivelyAllDay(entry: ExpandedCalendarEntry): boolean {
        return entry.isAllDay;
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
