import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { LitElement, PropertyValueMap, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DateTime, Interval } from 'luxon';
import * as R from 'remeda';
import { match } from 'ts-pattern';

import LMSCalendarContext from './components/Context';
import './components/Context.js';
import LMSCalendarDay from './components/Day';
import './components/Day.js';
import LMSCalendarEntry from './components/Entry';
import './components/Entry.js';
import LMSCalendarHeader from './components/Header';
import './components/Header.js';
import LMSCalendarMenu from './components/Menu';
import './components/Menu.js';
import LMSCalendarMonth from './components/Month';
import './components/Month.js';
import LMSCalendarWeek from './components/Week';
import './components/Week.js';
import LMSCalendarYear from './components/Year';
import './components/Year.js';
import type { DensityMode, DrillTarget } from './components/Year.js';
import { allocateAllDayRows, computeSpanClass, type AllDayEvent } from './lib/allDayLayout.js';
import getColorTextWithContrast from './lib/getColorTextWithContrast.js';
import { LayoutCalculator, type LayoutResult } from './lib/LayoutCalculator.js';
import { getMessages } from './lib/messages.js';
import {
    slotManager,
    type LayoutDimensions,
    type PositionConfig,
    type FirstDayOfWeek,
} from './lib/SlotManager.js';
import { ViewStateController } from './lib/ViewStateController.js';
import { computeWeekDisplayContext, type WeekDisplayContext } from './lib/weekDisplayContext.js';
import { getWeekDates } from './lib/weekStartHelper.js';

// ── Hex color → RGB tuple (for translucent backgrounds) ────────────────
function hexToRgb(hex?: string): [number, number, number] {
    if (!hex || !hex.trim()) return [25, 118, 210]; // default accent
    const normalized = hex.startsWith('#') ? hex : `#${hex}`;
    const match = normalized
        .replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (_m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`)
        .substring(1)
        .match(/.{2}/g);
    if (!match || match.length !== 3) return [25, 118, 210];
    const [r, g, b] = match.map((x) => parseInt(x, 16));
    if (isNaN(r) || isNaN(g) || isNaN(b)) return [25, 118, 210];
    return [r, g, b];
}

// ── Derived type for expanded (multi-day) entries ──────────────────────
type ExpandedCalendarEntry = CalendarEntry & {
    isContinuation: boolean;
    continuation: Continuation;
    originalStartDate?: CalendarDate;
    originalIndex: number;
};

@customElement('lms-calendar')
export default class LMSCalendar extends LitElement {
    @property({ type: String })
    heading?: string;

    @property({ type: Number, attribute: 'first-day-of-week' })
    firstDayOfWeek: FirstDayOfWeek = 1;

    @property({ type: String })
    locale = (typeof document !== 'undefined' && document.documentElement.lang) || 'en';

    @property({ type: String, attribute: 'year-drill-target' })
    yearDrillTarget: DrillTarget = 'month';

    @property({ type: String, attribute: 'year-density-mode' })
    yearDensityMode: DensityMode = 'dot';

    private _viewState = new ViewStateController(this);

    get activeDate(): CalendarDate {
        return this._viewState.activeDate;
    }

    set activeDate(value: CalendarDate) {
        this._viewState.setActiveDate(value);
    }

    @property({ type: Array })
    entries: CalendarEntry[] = [];

    @property({ type: String })
    color = '#000000';

    get _expandedDate(): CalendarDate | undefined {
        return this._viewState.expandedDate;
    }

    @state() _calendarWidth: number = (typeof window !== 'undefined' && window.innerWidth) || 1024;

    @state() _menuOpen = false;
    @state() _menuEventDetails?: {
        heading: string;
        content: string;
        time?: CalendarTimeInterval;
        displayTime: string;
        date?: CalendarDate;
        anchorRect?: DOMRect;
    };
    private _menuTriggerEntry?: HTMLElement;

    private _processedEntries: CalendarEntry[] = [];

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

    private _layoutCalculator = new LayoutCalculator({
        minuteHeight: 1,
        eventMinHeight: 20,
    });

    private _handleResize = (entries: ResizeObserverEntry[]): void => {
        const [div] = entries;

        this._calendarWidth = div.contentRect.width || this._calendarWidth;
    };

    private _resizeController: ResizeController<void> = new ResizeController<void>(this, {
        target: null,
        callback: this._handleResize,
        skipInitial: true,
    });

    static override styles = css`
        :host {
            display: block;
            contain: layout style paint;
            content-visibility: auto;
            contain-intrinsic-size: auto 600px 800px;

            --shadow-sm: rgba(0, 0, 0, 0.18) 0px 2px 4px;
            --shadow-md: rgba(0, 0, 0, 0.15) 0px 3px 3px 0px;
            --shadow-lg: rgba(0, 0, 0, 0.15) 0px 2px 8px;
            --shadow-hv: rgba(0, 0, 0, 0.08) 0px 4px 12px;

            --breakpoint-xs: 425px;
            --breakpoint-sm: 768px;
            --breakpoint-md: 1024px;

            --separator-light: rgba(0, 0, 0, 0.1);
            --separator-mid: rgba(0, 0, 0, 0.4);
            --separator-dark: rgba(0, 0, 0, 0.7);

            --system-ui:
                system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji',
                'Segoe UI Emoji', 'Segoe UI Symbol';
            --monospace-ui:
                'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;

            --border-radius-sm: 5px;
            --border-radius-md: 7px;
            --border-radius-lg: 12px;

            --background-color: white;
            --primary-color: dodgerblue;

            --height: 100%;
            --width: 100%;

            /* Entry design tokens - responsive and density-aware */
            --entry-font-size: 0.75rem;
            --entry-line-height: 1.2;
            --entry-min-height: 1.2em;
            --entry-border-radius: var(--border-radius-sm);
            --entry-background-color: var(--background-color);
            --entry-color: var(--primary-color);
            --entry-highlight-color: var(--separator-light);
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
            --entry-title-weight: 500;
            --entry-title-wrap: nowrap;
            --entry-time-font-size: 0.85em;
            --entry-time-opacity: 0.8;

            /* Entry density mode tokens */
            --entry-compact-show-time: none;
            --entry-layout: row;
            --entry-align: flex-start;

            /* Responsive scaling for different viewport sizes */
            --entry-font-size-sm: 0.65rem;
            --entry-font-size-md: 0.7rem;
            --entry-font-size-lg: 0.75rem;

            --context-height: 1.75em;
            --context-padding: 0.25em;
            --context-text-align: left;

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
            --day-all-day-font-size: 0.875rem;
            --day-all-day-margin: 0 1.25em 0 4.25em;
            --hour-text-align: center;
            --indicator-top: -0.55em;
            --separator-border: 1px solid var(--separator-light);
            --sidebar-border: 1px solid var(--separator-light);

            /* Typography tokens */
            --hour-indicator-font-size: 0.8125em;
            --hour-indicator-color: var(--header-text-color, rgba(0, 0, 0, 0.6));
            --day-label-font-weight: 500;
            --day-label-name-font-size: 0.75em;
            --day-label-number-font-size: 1.125em;
            --day-label-number-font-weight: 600;
            --day-label-gap: 0.15em;

            --header-height: 3.5em;
            --header-height-mobile: 4.5em;
            --header-info-padding-left: 1em;
            --header-text-color: rgba(0, 0, 0, 0.6);
            --header-buttons-padding-right: 1em;
            --button-padding: 0.75em;
            --button-border-radius: var(--border-radius-sm);

            --month-day-gap: 1px;
            --indicator-color: var(--primary-color);
            --indicator-font-weight: bold;
            --indicator-padding: 0.25em;
            --indicator-margin-bottom: 0.25em;

            --menu-min-width: 17.5em;
            --menu-max-width: 20em;
            --menu-header-padding: 0.75em 1em;
            --menu-content-padding: 1em;
            --menu-item-padding: 0.75em;
            --menu-item-margin-bottom: 0.75em;
            --menu-item-font-weight: 500;
            --menu-button-size: 2em;
            --menu-button-padding: 0.5em;
            --menu-title-font-size: 0.875em;
            --menu-title-font-weight: 500;
            --menu-content-font-size: 0.875em;
            --menu-detail-label-min-width: 4em;
            --menu-detail-label-font-size: 0.8125em;
            --menu-detail-gap: 0.5em;

            /* Year view tokens */
            --year-grid-columns: 3;
            --year-grid-columns-tablet: 2;
            --year-grid-columns-mobile: 1;
            --year-month-label-font-size: 0.875em;
            --year-day-font-size: 0.7em;
            --year-cell-size: 1.8em;
            --year-dot-color: var(--indicator-color, var(--primary-color));
            --year-heatmap-1: rgba(30, 144, 255, 0.15);
            --year-heatmap-2: rgba(30, 144, 255, 0.35);
            --year-heatmap-3: rgba(30, 144, 255, 0.55);
            --year-heatmap-4: rgba(30, 144, 255, 0.75);

            /* Year view — calendar week column */
            --year-cw-width: 1.8em;
            --year-cw-font-size: 0.55em;
            --year-cw-color: var(--header-text-color, rgba(0, 0, 0, 0.45));
        }
        .calendar-container {
            box-sizing: border-box;
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--calendar-border-radius, var(--border-radius-lg));
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            color: var(--separator-dark);
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
        main {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            display: flex;
            flex-direction: column;
        }

        /* Responsive entry scaling based on viewport width */
        @media (max-width: 480px) {
            :host {
                --entry-font-size: var(--entry-font-size-sm);
                --entry-padding: 0.1em 0.2em;
                --entry-gap: 0.15em;
                --entry-line-height: 1.15;
                --entry-min-height: 1.1em;
                --entry-compact-show-time: none;
            }
        }

        @media (min-width: 481px) and (max-width: 768px) {
            :host {
                --entry-font-size: var(--entry-font-size-md);
                --entry-padding: 0.15em 0.25em;
                --entry-gap: 0.2em;
                --entry-line-height: 1.2;
                --entry-compact-show-time: none;
            }
        }

        @media (min-width: 769px) {
            :host {
                --entry-font-size: var(--entry-font-size-lg);
                --entry-compact-show-time: inline;
            }
        }
    `;

    override disconnectedCallback() {
        super.disconnectedCallback();
        // Safety net: clean up listeners if component is removed while menu is open
        document.removeEventListener('click', this._handleClickOutside, true);
        document.removeEventListener('keydown', this._handleEscape);
    }

    protected override updated(
        changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        if (changedProperties.has('_menuOpen' as never)) {
            if (this._menuOpen) {
                document.addEventListener('click', this._handleClickOutside, true);
                document.addEventListener('keydown', this._handleEscape);
            } else {
                document.removeEventListener('click', this._handleClickOutside, true);
                document.removeEventListener('keydown', this._handleEscape);
            }
        }
    }

    private _handleClickOutside = (e: MouseEvent) => {
        if (!this._menuOpen) return;

        const path = e.composedPath();
        const menuEl = this.shadowRoot?.querySelector('lms-menu');
        // Close if click is not inside the menu and not on a calendar entry
        const clickedInsideMenu = menuEl && path.includes(menuEl);
        const clickedOnEntry = path.some(
            (el) => el instanceof HTMLElement && el.tagName === 'LMS-CALENDAR-ENTRY',
        );

        if (!clickedInsideMenu && !clickedOnEntry) {
            this._closeMenuAndClearSelections();
        }
    };

    private _handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && this._menuOpen) {
            this._closeMenuAndClearSelections();
        }
    };

    private _closeMenuAndClearSelections() {
        this._menuOpen = false;
        this._menuEventDetails = undefined;
        this._returnFocusToTrigger();
        this.shadowRoot?.querySelectorAll('lms-calendar-entry').forEach((entry) => {
            (entry as LMSCalendarEntry).clearSelection();
        });
    }

    private _returnFocusToTrigger() {
        if (this._menuTriggerEntry) {
            this._menuTriggerEntry.focus();
            this._menuTriggerEntry = undefined;
        }
    }

    protected override firstUpdated(
        _changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        const firstElementChild = this.shadowRoot?.firstElementChild;
        if (!firstElementChild) {
            return;
        }

        this._resizeController.observe(firstElementChild);
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
        if (!changedProperties.has('entries' as never)) {
            return;
        }

        if (!this.entries.length) {
            this._processedEntries = [];
            this._clearEntryCaches();
            return;
        }

        this._processedEntries = R.pipe(
            this.entries,
            R.filter((entry) => {
                // All-day entries without time are always valid
                if (!entry.time) return true;
                return Interval.fromDateTimes(
                    DateTime.fromObject(R.merge(entry.date.start, entry.time.start)),
                    DateTime.fromObject(R.merge(entry.date.end, entry.time.end)),
                ).isValid;
            }),
            R.sort((a, b) => {
                const aHour = a.time?.start.hour ?? 0;
                const bHour = b.time?.start.hour ?? 0;
                const aMin = a.time?.start.minute ?? 0;
                const bMin = b.time?.start.minute ?? 0;
                return aHour - bHour || aMin - bMin;
            }),
        );

        this._computeEntryCaches();
    }

    // ── Memoization helpers (the "compute" side of the memo pattern) ────
    // These run once per `entries` change — equivalent to the factory
    // function inside useMemo(() => { … }, [entries]).

    private _clearEntryCaches() {
        this._expandedEntries = [];
        this._monthViewSorted = [];
        this._entrySumByDay = {};
        this._expandedByISODate.clear();
        this._layoutCache.clear();
        this._allDayLayoutCache.clear();
    }

    private _computeEntryCaches() {
        // 1. Expand all entries across their date spans (the expensive O(n × span) work)
        //    Each expanded entry carries its originalIndex directly, avoiding
        //    repeated string-ID hashing and map lookups.
        this._expandedEntries = this._processedEntries.flatMap((entry, index) =>
            this._expandEntryMaybe({
                entry,
                range: this._getDaysRange(entry.date),
                originalIndex: index,
            }),
        ) as ExpandedCalendarEntry[];

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

        // 3. Month view: sort + compute colors once
        this._monthViewSorted = R.pipe(
            this._expandedEntries,
            R.sortBy((entry) => {
                const isMultiDay = entry.continuation?.has || false;
                return isMultiDay ? entry.originalIndex - 1000 : entry.originalIndex;
            }),
            R.map((entry) => {
                const [background] = getColorTextWithContrast(entry.color);
                return { entry, background, originalIndex: entry.originalIndex };
            }),
        );

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

    override render() {
        const viewMode = this._viewState.viewMode;
        const currentActiveDate = this._viewState.activeDate;

        return html`
            <div class="calendar-container">
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
                    >
                    </lms-calendar-header>
                </header>

                <main role="region" aria-live="polite" aria-label="${getMessages(this.locale)[viewMode]} ${getMessages(this.locale).viewLabel}">
                    ${
                        viewMode === 'month'
                            ? html`
                              <lms-calendar-context
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                                  .locale=${this.locale}
                              > </lms-calendar-context>

                              <lms-calendar-month
                                  @expand=${this._handleExpand}
                                  @open-menu=${this._handleOpenMenu}
                                  @clear-other-selections=${this._handleClearOtherSelections}
                                  .activeDate=${currentActiveDate}
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                                  .locale=${this.locale}
                              >
                                  ${
                                      this._calendarWidth < 768
                                          ? this._renderEntriesSumByDay()
                                          : this._renderEntries()
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
                                          @open-menu=${this._handleOpenMenu}
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          .activeDate=${currentActiveDate}
                                          .allDayRowCount=${result.allDayRowCount}
                                          .firstDayOfWeek=${this.firstDayOfWeek}
                                          .locale=${this.locale}
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
                                          @open-menu=${this._handleOpenMenu}
                                          @clear-other-selections=${this._handleClearOtherSelections}
                                          .allDayRowCount=${result.allDayRowCount}
                                          .activeDate=${currentActiveDate}
                                          .firstDayOfWeek=${this.firstDayOfWeek}
                                          .locale=${this.locale}
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
                                  .activeDate=${currentActiveDate}
                                  .firstDayOfWeek=${this.firstDayOfWeek}
                                  .locale=${this.locale}
                                  .entrySumByDay=${this._entrySumByDay}
                                  .drillTarget=${this.yearDrillTarget}
                                  .densityMode=${this.yearDensityMode}
                              ></lms-calendar-year>
                          `
                            : nothing
                    }
                </main>

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
        return match(e.detail.view)
            .with('day', () => this._viewState.switchToDayView())
            .with('week', () => this._viewState.switchToWeekView())
            .with('month', () => this._viewState.switchToMonthView())
            .with('year', () => this._viewState.switchToYearView())
            .otherwise(() => {});
    }

    private _handleJumpToday(_e: CustomEvent) {
        this._viewState.jumpToToday();
    }

    private _handlePeekNavigate(e: CustomEvent) {
        // Shift active date to the target day, staying in week view
        this._viewState.setActiveDate(e.detail.date);
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
    }

    private _handleOpenMenu(e: CustomEvent) {
        // Reset any previously highlighted entries before opening new menu
        // but exclude the entry that triggered this event
        const clickedEntry = e.target as LMSCalendarEntry;
        this.shadowRoot?.querySelectorAll('lms-calendar-entry').forEach((entry) => {
            if (entry !== clickedEntry) {
                (entry as LMSCalendarEntry).clearSelection();
            }
        });
        this._menuTriggerEntry = clickedEntry;
        this.openMenu(e.detail);
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
        this._returnFocusToTrigger();
    }

    public openMenu(eventDetails: {
        heading: string;
        content: string;
        time?: CalendarTimeInterval;
        displayTime: string;
        date?: CalendarDate;
        anchorRect?: DOMRect;
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
            accessibility?: {
                tabIndex: number;
                role: 'button';
                ariaLabel: string;
            };
        };
        isContinuation?: boolean;
        density?: 'compact' | 'standard' | 'full';
        displayMode?: 'default' | 'month-dot';
        floatText?: boolean;
        spanClass?: string;
    }) {
        // Determine density based on event duration and context if not explicitly set
        const determinedDensity = density || this._determineDensity(entry, undefined, undefined);

        return html`
            <lms-calendar-entry
                class=${`_${index}${spanClass ? ` ${spanClass}` : ''}`}
                slot=${slot}
                style=${inlineStyle}
                .time=${entry.time}
                .heading=${entry.heading ?? ''}
                .content=${entry.content}
                .isContinuation=${isContinuation ?? false}
                .date=${entry.date}
                .density=${determinedDensity}
                .displayMode=${displayMode}
                .floatText=${floatText}
                .accessibility=${entry.accessibility}
                .locale=${this.locale}
            >
            </lms-calendar-entry>
        `;
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

    /** Create an array of <lms-calendar-entry> elements for each day the entry spans
     *  and add them to the entries array. */
    private _expandEntryMaybe({
        entry,
        range,
        originalIndex,
    }: {
        entry: Partial<CalendarEntry>;
        range: [Date, Date, number];
        originalIndex: number;
    }) {
        return Array.from({ length: range[2] }, (_, index) => {
            const currentStartDate = DateTime.fromJSDate(range[0]).plus({
                days: index,
            });
            const currentEndDate = currentStartDate.plus({ days: 1 }).minus({ seconds: 1 });
            const currentEntry = {
                ...entry,
                date: {
                    start: currentStartDate.toObject(),
                    end: currentEndDate.toObject(),
                },
                isContinuation: index > 0, // Any day after the first is a continuation
                continuation: {
                    has: range[2] > 1,
                    is: index > 0,
                    index,
                    total: range[2],
                },
                // Preserve original start date for consistent sorting
                originalStartDate: entry.date?.start,
                originalIndex,
            };

            return currentEntry;
        });
    }

    private _createConsistentEventId(
        entry:
            | CalendarEntry
            | (Partial<CalendarEntry> & {
                  continuation?: Continuation;
                  originalStartDate?: CalendarDate;
              }),
    ): string {
        // For expanded entries, try to find the original start date
        const expandedEntry = entry as Partial<CalendarEntry> & {
            continuation?: Continuation;
            originalStartDate?: CalendarDate;
        };
        const baseDate = expandedEntry.originalStartDate || entry.date?.start;

        if (!baseDate) {
            return `${entry.heading || 'unknown'}-fallback`;
        }

        // Create a deterministic ID based on entry content and original start date
        return `${entry.heading || 'unknown'}-${baseDate.year}-${
            baseDate.month
        }-${baseDate.day}-${entry.time?.start.hour || 0}-${entry.time?.start.minute || 0}`;
    }

    private _renderEntries() {
        if (!this._monthViewSorted.length) {
            return nothing;
        }

        // Pure map over pre-computed cache — no expansion, sorting, or color
        // computation happens here. This is the "read" side of the memo.
        return this._monthViewSorted.map(({ entry, background, originalIndex }) => {
            const isMultiDay = entry.isContinuation || entry.continuation?.has || false;
            const slotPrefix = isMultiDay ? 'all-day-' : '';

            return this._composeEntry({
                index: originalIndex,
                slot: `${slotPrefix}${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
                inlineStyle: `--entry-color: ${background}; --entry-background-color: ${background}; z-index: ${100 + originalIndex}`,
                entry: {
                    time: entry.time,
                    heading: entry.heading,
                    content: entry.content,
                    date: entry.date,
                    isContinuation: entry.isContinuation || false,
                    continuation: entry.continuation,
                },
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
        });
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
                const entriesByDay = R.groupBy(
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
            const [r, g, b] = hexToRgb(entry.color);
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
                inlineStyle: `--entry-background-color: rgba(${r}, ${g}, ${b}, 0.08); --entry-color: #333; --entry-border: 1px solid rgba(${r}, ${g}, ${b}, 0.25); --entry-border-left: none; --entry-handle-color: ${entry.color || '#1976d2'}; --entry-handle-width: 4px; --entry-handle-display: block; --entry-padding-left: calc(4px + 0.35em); order: ${row}; ${positionCSS}`,
                entry: {
                    ...entry,
                    accessibility: accessibility,
                },
                density: 'standard',
                floatText: false,
                spanClass,
            });
        });

        return { elements: [...allDayElements, ...allElements], allDayRowCount: totalRows };
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
            const layoutEvents = dayEntries.map((entry, index) => ({
                id: String(index),
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
            layout = this._layoutCalculator.calculateLayout(layoutEvents);
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
                isAllDay: entry.isContinuation || this._isAllDayEvent(entry),
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
                opacity: layoutBox.opacity,
                height: layoutBox.height,
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
                inlineStyle: `--entry-background-color: rgba(250, 250, 250, 0.8); --entry-color: #333; --entry-border: 1px solid rgba(0, 0, 0, 0.15); --entry-border-left: none; --entry-handle-color: ${entry.color || '#1976d2'}; --entry-handle-width: 4px; --entry-handle-display: block; --entry-padding-left: calc(4px + 0.35em); --entry-layout: ${smartLayout}; ${positionCSS}`,
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

        return entries.map(([key, value], index) =>
            this._composeEntry({
                index,
                slot: key,
                inlineStyle: `--entry-color: var(--separator-mid); text-align: center`,
                entry: {
                    heading: `${value} ${getMessages(this.locale).events}`,
                },
                displayMode: 'month-dot',
            }),
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

        // Non-overlapping events always use row — they have full width available
        if (!isOverlapping) {
            return 'row';
        }

        // Overlapping events: use column when there's enough vertical space
        // so title and time stack clearly within the cascaded box
        const minColumnHeight = 40;
        return height >= minColumnHeight ? 'column' : 'row';
    }

    private _getDaysRange(date: CalendarDateInterval): [Date, Date, number] {
        const { start, end } = date;
        const startDate = new Date(start.year, start.month - 1, start.day);
        const endDate = new Date(end.year, end.month - 1, end.day);

        return [
            startDate,
            endDate,
            (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1,
        ];
    }

    private _isEffectivelyAllDay(entry: ExpandedCalendarEntry): boolean {
        if (!entry.time) return true;
        if (Number(entry.time.end.hour) - Number(entry.time.start.hour) >= 23) return true;
        if (entry.continuation?.is || entry.continuation?.has) return true;
        return false;
    }

    private _isAllDayEvent(entry: Partial<CalendarEntry>): boolean {
        // Check if it's a true all-day event (0:00 to 23:59)
        if (!entry.time) return true;

        const { start, end } = entry.time;
        return start.hour === 0 && start.minute === 0 && end.hour === 23 && end.minute === 59;
    }
}

declare global {
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

    type CalendarDate = {
        day: number;
        month: number;
        year: number;
    };

    type CalendarTime = {
        hour: number;
        minute: number;
    };

    type CalendarTimeInterval = {
        start: CalendarTime;
        end: CalendarTime;
    };

    type CalendarDateInterval = {
        start: CalendarDate;
        end: CalendarDate;
    };

    type CalendarEntry = {
        date: CalendarDateInterval;
        time: CalendarTimeInterval;
        heading: string;
        content: string;
        color: string;
        isContinuation: boolean;
        continuation?: Continuation;
    };

    type Continuation = {
        has: boolean;
        is: boolean;
        index: number;
        total: number;
    };

    type Interval = {
        start: number;
        end: number;
    };

    type Grading = {
        index: number;
        depth: number;
        group: number;
    };

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
