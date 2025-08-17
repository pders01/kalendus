import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import { SignalWatcher } from '@lit-labs/signals';
import { localized } from '@lit/localize';
import {
    CSSResult,
    LitElement,
    PropertyValueMap,
    css,
    html,
    nothing,
    unsafeCSS,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
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
import getColorTextWithContrast from './lib/getColorTextWithContrast.js';
import { LayoutCalculator } from './lib/LayoutCalculator.js';
import { setAppLocale } from './lib/localization.js';
import {
    slotManager,
    type LayoutDimensions,
    type PositionConfig,
} from './lib/SlotManager.js';
import {
    activeDate as activeSignal,
    currentViewMode,
    jumpToToday,
    navigateNext,
    navigatePrevious,
    setActiveDate,
    switchToDayView,
    switchToMonthView,
    switchToWeekView,
} from './lib/viewState.js';

@customElement('lms-calendar')
@(localized() as ClassDecorator)
export default class LMSCalendar extends SignalWatcher(LitElement) {
    @property({ type: String })
    heading?: string;

    // activeDate is now managed by signals - this property is kept for backward compatibility
    get activeDate(): CalendarDate {
        return activeSignal.get();
    }

    set activeDate(value: CalendarDate) {
        setActiveDate(value);
    }

    @property({ type: Array })
    entries: CalendarEntry[] = [];

    @property({ type: String })
    color = '#000000';

    // _expandedDate is now managed through view mode signals
    get _expandedDate(): CalendarDate | undefined {
        return currentViewMode.get() === 'day' ? activeSignal.get() : undefined;
    }

    @state() _calendarWidth: number = window.innerWidth;

    @state() _menuOpen = false;
    @state() _menuEventDetails?: {
        heading: string;
        content: string;
        time: string;
        date?: CalendarDate;
    };

    private _layoutCalculator = new LayoutCalculator({
        timeColumnWidth: 80,
        minuteHeight: 1,
        eventMinHeight: 20,
        cascadeOffset: 15,
        paddingLeft: 10,
    });

    private _handleResize = (entries: ResizeObserverEntry[]): void => {
        const [div] = entries;

        this._calendarWidth = div.contentRect.width || this._calendarWidth;
    };

    private _resizeController: ResizeController<void> =
        new ResizeController<void>(this, {
            target: null,
            callback: this._handleResize,
            skipInitial: true,
        });

    static override styles = css`
        :host {
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

            --system-ui: system-ui, 'Segoe UI', Roboto, Helvetica, Arial,
                sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
                'Segoe UI Symbol';
            --monospace-ui: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono',
                Consolas, 'Courier New', monospace;

            --border-radius-sm: 5px;
            --border-radius-md: 7px;
            --border-radius-lg: 12px;

            --background-color: white;
            --primary-color: dodgerblue;

            --height: 100%;
            --width: 100%;

            /* Entry design tokens - responsive and density-aware */
            --entry-font-size: 0.7rem;
            --entry-line-height: 1.1;
            --entry-min-height: 1.1em;
            --entry-border-radius: var(--border-radius-sm);
            --entry-background-color: var(--background-color);
            --entry-color: var(--primary-color);
            --entry-highlight-color: var(--separator-light);
            --entry-focus-color: var(--primary-color);
            --entry-padding: 0.1em 0.2em;
            --entry-font-family: system-ui;
            --entry-gap: 0.15em;

            /* Month view dot indicator tokens */
            --entry-dot-size: 0.5em;
            --entry-dot-margin: 0.25em;
            --entry-month-background: transparent;
            --entry-month-padding: 0.1em 0.3em 0.1em 0;
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
            --grid-rows-per-day: 1440;
            --view-container-height-offset: var(--day-header-height, 3.5em);
            --main-content-height-offset: 1em;

            /* Grid template tokens */
            --calendar-grid-columns-day: var(--time-column-width) 1fr;
            --calendar-grid-columns-week: var(--time-column-width)
                repeat(7, 1fr);
            --calendar-grid-columns-month: repeat(7, 1fr);
            --calendar-grid-rows-time: repeat(var(--grid-rows-per-day), 1fr);

            /* Calculated heights */
            --view-container-height: calc(
                100% - var(--view-container-height-offset)
            );
            --main-content-height: calc(
                100% - var(--main-content-height-offset)
            );

            /* Legacy tokens (for backward compatibility) */
            --day-header-height: 3.5em;
            --day-main-offset: var(--main-content-height-offset);
            --day-gap: 1px;
            --day-text-align: center;
            --day-padding: 0.5em;
            --day-all-day-font-size: 16px;
            --day-all-day-margin: 0 1.25em 0 4.25em;
            --hour-text-align: center;
            --indicator-top: -0.6em;
            --separator-border: 1px solid var(--separator-light);
            --sidebar-border: 1px solid var(--separator-light);

            /* Typography tokens */
            --hour-indicator-font-size: 0.75em;
            --hour-indicator-color: var(
                --header-text-color,
                rgba(0, 0, 0, 0.6)
            );
            --day-label-font-weight: 500;

            --header-height: 3.5em;
            --header-height-mobile: 4.5em;
            --header-info-padding-left: 1em;
            --header-text-color: rgba(0, 0, 0, 0.6);
            --header-buttons-padding-right: 1em;
            --button-padding: 0.75em;
            --button-border-radius: var(--border-radius-sm);

            --month-header-context-height: 5.5em;
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
        }
        div {
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            color: var(--separator-dark);
            box-shadow: var(--shadow-md);
        }

        /* Responsive entry scaling based on viewport width */
        @media (max-width: 480px) {
            :host {
                --entry-font-size: var(--entry-font-size-sm);
                --entry-padding: 0.05em 0.15em;
                --entry-gap: 0.1em;
                --entry-line-height: 1;
                --entry-min-height: 1em;
                --entry-compact-show-time: none;
            }
        }

        @media (min-width: 481px) and (max-width: 768px) {
            :host {
                --entry-font-size: var(--entry-font-size-md);
                --entry-padding: 0.08em 0.18em;
                --entry-gap: 0.12em;
                --entry-line-height: 1.05;
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

    protected override firstUpdated(
        _changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        const firstElementChild = this.shadowRoot?.firstElementChild;
        if (!firstElementChild) {
            return;
        }

        this._resizeController.observe(firstElementChild);

        // Initialize locale from document language
        const docLang = document.documentElement.lang?.slice(0, 2);
        if (docLang && ['de', 'en'].includes(docLang)) {
            setAppLocale(docLang);
        }
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
        _changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        if (!this.entries.length) {
            return;
        }

        this.entries = R.pipe(
            this.entries,
            R.filter(
                (entry) =>
                    Interval.fromDateTimes(
                        DateTime.fromObject(
                            R.merge(entry.date.start, entry.time.start),
                        ),
                        DateTime.fromObject(
                            R.merge(entry.date.end, entry.time.end),
                        ),
                    ).isValid,
            ),
            R.sort.strict(
                (a, b) =>
                    a.time.start.hour - b.time.start.hour ||
                    a.time.start.minute - b.time.start.minute,
            ),
        );
    }

    override render() {
        const viewMode = currentViewMode.get();
        const currentActiveDate = activeSignal.get();

        return html`
            <div>
                <lms-calendar-header
                    @switchdate=${this._handleSwitchDate}
                    @switchview=${this._handleSwitchView}
                    @jumptoday=${this._handleJumpToday}
                    .heading=${this.heading}
                    .activeDate=${currentActiveDate}
                    .expandedDate=${viewMode === 'day'
                        ? currentActiveDate
                        : undefined}
                >
                </lms-calendar-header>

                ${viewMode === 'month'
                    ? html`
                          <lms-calendar-context> </lms-calendar-context>

                          <lms-calendar-month
                              @expand=${this._handleExpand}
                              @open-menu=${this._handleOpenMenu}
                              @clear-other-selections=${this
                                  ._handleClearOtherSelections}
                              .activeDate=${currentActiveDate}
                          >
                              ${this._calendarWidth < 768
                                  ? this._renderEntriesSumByDay()
                                  : this._renderEntries()}
                          </lms-calendar-month>
                      `
                    : nothing}
                ${viewMode === 'week'
                    ? html`
                          <lms-calendar-week
                              @expand=${this._handleExpand}
                              @open-menu=${this._handleOpenMenu}
                              @clear-other-selections=${this
                                  ._handleClearOtherSelections}
                              .activeDate=${currentActiveDate}
                          >
                              ${this._renderEntriesByDate()}
                          </lms-calendar-week>
                      `
                    : nothing}
                ${viewMode === 'day'
                    ? html`
                          <lms-calendar-day
                              @open-menu=${this._handleOpenMenu}
                              @clear-other-selections=${this
                                  ._handleClearOtherSelections}
                          >
                              ${this._renderEntriesByDate()}
                          </lms-calendar-day>
                      `
                    : nothing}

                <lms-menu
                    ?open=${this._menuOpen}
                    .eventDetails=${this._menuEventDetails || {
                        heading: '',
                        content: '',
                        time: '',
                    }}
                    @menu-close=${this._handleMenuClose}
                ></lms-menu>
            </div>
        `;
    }

    private _handleSwitchDate(e: CustomEvent) {
        if (e.detail.direction === 'next') {
            navigateNext();
        } else if (e.detail.direction === 'previous') {
            navigatePrevious();
        }
    }

    private _handleSwitchView(e: CustomEvent) {
        return match(e.detail.view)
            .with('day', () => switchToDayView())
            .with('week', () => switchToWeekView())
            .with('month', () => switchToMonthView())
            .otherwise(() => {});
    }

    private _handleJumpToday(_e: CustomEvent) {
        jumpToToday();
    }

    private _handleExpand(e: CustomEvent) {
        setActiveDate(e.detail.date);
        switchToDayView();
    }

    private _handleOpenMenu(e: CustomEvent) {
        // Reset any previously highlighted entries before opening new menu
        // but exclude the entry that triggered this event
        const clickedEntry = e.target as LMSCalendarEntry;
        this.shadowRoot
            ?.querySelectorAll('lms-calendar-entry')
            .forEach((entry) => {
                if (entry !== clickedEntry) {
                    (entry as LMSCalendarEntry).clearSelection();
                }
            });
        this.openMenu(e.detail);
    }

    private _handleClearOtherSelections(e: CustomEvent) {
        // Clear all selections except the entry that triggered this event
        const focusedEntry = e.detail.exceptEntry as LMSCalendarEntry;
        this.shadowRoot
            ?.querySelectorAll('lms-calendar-entry')
            .forEach((entry) => {
                if (entry !== focusedEntry) {
                    (entry as LMSCalendarEntry).clearSelection();
                }
            });
    }

    private _handleMenuClose() {
        this._menuOpen = false;
        this._menuEventDetails = undefined;
    }

    public openMenu(eventDetails: {
        heading: string;
        content: string;
        time: string;
        date?: CalendarDate;
    }) {
        this._menuEventDetails = eventDetails;
        this._menuOpen = true;
    }

    private _composeEntry({
        index,
        slot,
        styles,
        entry,
        isContinuation = false,
        density,
        displayMode = 'default',
        floatText = false,
    }: {
        index: number;
        slot: string;
        styles: CSSResult | typeof nothing;
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
    }) {
        // Determine density based on event duration and context if not explicitly set
        const determinedDensity =
            density ||
            this._determineDensity(entry, undefined, undefined, undefined);

        return html`
            <style>
                ${styles}
            </style>
            <lms-calendar-entry
                class=${`_${index}`}
                slot=${slot}
                .time=${entry.time}
                .heading=${entry.heading ?? ''}
                .content=${entry.content}
                .isContinuation=${isContinuation ?? false}
                .date=${entry.date}
                .density=${determinedDensity}
                .displayMode=${displayMode}
                .floatText=${floatText}
                .accessibility=${entry.accessibility}
            >
            </lms-calendar-entry>
        `;
    }

    private _getEntriesCountForDay(date: CalendarDate): number {
        return this.entries.filter((entry) => {
            // Check if entry overlaps with the given day
            const entryStart = DateTime.fromObject(entry.date.start);
            const entryEnd = DateTime.fromObject(entry.date.end);
            const targetDay = DateTime.fromObject(date);

            return targetDay >= entryStart && targetDay <= entryEnd;
        }).length;
    }

    private _determineDensity(
        entry: Partial<CalendarEntry>,
        _overlappingCount?: number,
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
    }: {
        entry: Partial<CalendarEntry>;
        range: [Date, Date, number];
    }) {
        return Array.from({ length: range[2] }, (_, index) => {
            const currentStartDate = DateTime.fromJSDate(range[0]).plus({
                days: index,
            });
            const currentEndDate = currentStartDate
                .plus({ days: 1 })
                .minus({ seconds: 1 });
            const currentEntry = {
                ...entry,
                date: {
                    start: currentStartDate.toObject(),
                    end: currentEndDate.toObject(),
                },
                isContinuation: index > 0, // Any day after the first is a continuation
                continuation: {
                    has: range[2] > 1,
                    is: index > 0, // Fixed: index > 0, not index > 1
                    index,
                },
                // Preserve original start date for consistent sorting
                originalStartDate: entry.date?.start,
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
        }-${baseDate.day}-${entry.time?.start.hour || 0}-${
            entry.time?.start.minute || 0
        }`;
    }

    private _renderEntries() {
        if (!this.entries.length) {
            return nothing;
        }

        // First, create a mapping of original entries to their IDs for consistent sorting
        const entryIdMap = new Map<string, number>();
        this.entries.forEach((entry, index) => {
            entryIdMap.set(this._createConsistentEventId(entry), index);
        });

        return R.pipe(
            this.entries,
            R.flatMap((entry) => {
                const expandedEntries = this._expandEntryMaybe({
                    entry,
                    range: this._getDaysRange(entry.date),
                });
                return expandedEntries;
            }),
            // Sort: multi-day events first, then by original entry order for consistency
            R.sortBy((entry) => {
                const baseId = this._createConsistentEventId(
                    entry as CalendarEntry,
                );
                const originalIndex = entryIdMap.get(baseId) || 0;
                const expandedEntry = entry as CalendarEntry & {
                    continuation?: Continuation;
                };
                const isMultiDay = expandedEntry.continuation?.has || false;

                // Multi-day events get priority (lower sort value), then original order
                return isMultiDay ? originalIndex - 1000 : originalIndex;
            }),
            R.map(
                (entry) =>
                    [entry, ...getColorTextWithContrast(entry.color)] as [
                        CalendarEntry & { continuation: Continuation },
                        string,
                        string,
                    ],
            ),
            R.map.indexed(([entry, background, _text], index) => {
                const baseId = this._createConsistentEventId(
                    entry as CalendarEntry,
                );
                const originalIndex = entryIdMap.get(baseId) || index;

                const isMultiDay =
                    entry.isContinuation || entry.continuation?.has || false;
                const slotPrefix = isMultiDay ? 'all-day-' : '';

                return this._composeEntry({
                    index: originalIndex, // Use original index for consistent CSS classes
                    slot: `${slotPrefix}${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
                    styles: css`
                        lms-calendar-entry._${originalIndex} {
                            --entry-color: ${unsafeCSS(background)};
                            --entry-background-color: ${unsafeCSS(background)};
                            /* Add z-index based on original order for consistent layering */
                            z-index: ${100 + originalIndex};
                        }
                    `,
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
                        this._getEntriesCountForDay(entry.date.start),
                        undefined,
                        undefined,
                    ),
                    displayMode: 'month-dot',
                });
            }),
        );
    }

    private _renderEntriesByDate() {
        const currentActiveDate = activeSignal.get();
        const viewMode = currentViewMode.get();

        if (viewMode !== 'day' && viewMode !== 'week') {
            return nothing;
        }

        // Get all entries for current day or week
        const allEntriesForDate = R.pipe(
            this.entries,
            R.flatMap((entry) =>
                this._expandEntryMaybe({
                    entry,
                    range: this._getDaysRange(entry.date),
                }),
            ),
            R.filter((entry) => {
                if (viewMode === 'day') {
                    return R.isDeepEqual(
                        DateTime.fromObject(entry.date.start).toISODate(),
                        DateTime.fromObject(currentActiveDate).toISODate(),
                    );
                } else {
                    // Week view: filter for current week
                    const weekStartDate =
                        this._getWeekStartDate(currentActiveDate);
                    const weekDates = Array.from({ length: 7 }, (_, i) => {
                        const date = new Date(weekStartDate);
                        date.setDate(weekStartDate.getDate() + i);
                        return DateTime.fromJSDate(date).toISODate();
                    });
                    const entryDateStr = DateTime.fromObject(
                        entry.date.start,
                    ).toISODate();
                    return weekDates.includes(entryDateStr);
                }
            }),
        ) as Array<
            CalendarEntry & { continuation: { is: boolean; has: boolean } }
        >;

        // Separate all-day and timed entries
        const allDayEntries = allEntriesForDate.filter(
            (entry) =>
                !entry.time ||
                (entry.time &&
                    Number(entry.time.end.hour) -
                        Number(entry.time.start.hour) >=
                        23) ||
                entry.continuation?.is ||
                entry.continuation?.has,
        );

        const entriesByDate = allEntriesForDate.filter(
            (entry) =>
                !!entry.time &&
                !(
                    Number(entry.time.end.hour) -
                        Number(entry.time.start.hour) >=
                    23
                ) &&
                !entry.continuation?.is &&
                !entry.continuation?.has,
        );

        if (!entriesByDate.length && !allDayEntries.length) {
            return nothing;
        }

        // Use SlotManager to handle positioning across different views
        return this._renderEntriesWithSlotManager(
            viewMode,
            currentActiveDate,
            allDayEntries,
            entriesByDate,
        );
    }

    private _renderEntriesWithSlotManager(
        viewMode: 'day' | 'week',
        currentActiveDate: CalendarDate,
        allDayEntries: Array<
            CalendarEntry & { continuation: { is: boolean; has: boolean } }
        >,
        entriesByDate: Array<
            CalendarEntry & { continuation: { is: boolean; has: boolean } }
        >,
    ) {
        const allElements: ReturnType<typeof this._composeEntry>[] = [];

        // Process timed entries
        if (entriesByDate.length > 0) {
            if (viewMode === 'week') {
                // Group timed entries by day for week view
                const entriesByDay = R.groupBy(
                    entriesByDate,
                    (entry) =>
                        `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
                );

                // Process each day's entries separately with LayoutCalculator in proper day order
                const sortedDayEntries = Object.entries(entriesByDay)
                    .map(([dayKey, dayEntries]) => ({ dayKey, dayEntries }))
                    .filter(
                        ({ dayEntries }) => dayEntries && dayEntries.length > 0,
                    ) // Safety check
                    .sort((a, b) => {
                        // Sort by actual day order within the week
                        const dayA = a.dayEntries[0];
                        const dayB = b.dayEntries[0];
                        if (!dayA || !dayB || !dayA.date || !dayB.date)
                            return 0; // Safety check
                        const dayIndexA = slotManager.getWeekDayIndex(
                            dayA.date.start,
                            currentActiveDate,
                        );
                        const dayIndexB = slotManager.getWeekDayIndex(
                            dayB.date.start,
                            currentActiveDate,
                        );
                        return dayIndexA - dayIndexB;
                    });

                sortedDayEntries.forEach(({ dayEntries }) => {
                    const dayElements = this._renderDayEntriesWithSlotManager(
                        dayEntries,
                        viewMode,
                        currentActiveDate,
                        entriesByDate,
                    );
                    allElements.push(...dayElements);
                });
            } else {
                // Day view: process all entries together
                const dayElements = this._renderDayEntriesWithSlotManager(
                    entriesByDate,
                    viewMode,
                    currentActiveDate,
                    entriesByDate,
                );
                allElements.push(...dayElements);
            }
        }

        // Process all-day entries
        const allDayElements = allDayEntries.map((entry, index) => {
            const [background, text] = getColorTextWithContrast(entry.color);

            // Use SlotManager to determine positioning and accessibility
            const positionConfig: PositionConfig = {
                viewMode,
                date: entry.date.start,
                isAllDay: true,
                activeDate: currentActiveDate,
            };

            const position = slotManager.calculatePosition(positionConfig);
            const accessibility =
                slotManager.calculateAccessibility(positionConfig);
            const layoutDimensions: LayoutDimensions = {
                width: 100,
                x: 0,
                zIndex: 100,
                opacity: 1,
            };

            const positionCSS = slotManager.generatePositionCSS(
                position,
                layoutDimensions,
            );

            return this._composeEntry({
                index: index + entriesByDate.length,
                slot: position.slotName || 'week-direct-grid', // Use fallback slot for direct grid positioning
                styles: css`
                    lms-calendar-entry._${index + entriesByDate.length} {
                        --entry-background-color: ${unsafeCSS(background)};
                        --entry-color: ${unsafeCSS(text)};
                        ${positionCSS};
                    }
                `,
                entry: {
                    ...entry,
                    // Add accessibility data to entry
                    accessibility: accessibility,
                },
                density: 'standard',
                floatText: false,
            });
        });

        return [...allDayElements, ...allElements];
    }

    private _renderDayEntriesWithSlotManager(
        dayEntries: Array<
            CalendarEntry & { continuation: { is: boolean; has: boolean } }
        >,
        viewMode: 'day' | 'week',
        currentActiveDate: CalendarDate,
        allEntriesByDate: Array<
            CalendarEntry & { continuation: { is: boolean; has: boolean } }
        >,
    ) {
        // Convert to layout calculator format
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

        // Calculate layout for this set of entries
        const layout = this._layoutCalculator.calculateLayout(layoutEvents);

        // Render entries using SlotManager
        return dayEntries.map((entry, index) => {
            const layoutBox = layout.boxes[index];
            const globalIndex = allEntriesByDate.indexOf(entry);

            // Use SlotManager to determine positioning and accessibility
            const positionConfig: PositionConfig = {
                viewMode,
                date: entry.date.start,
                time: entry.time,
                activeDate: currentActiveDate,
                isAllDay: entry.isContinuation || this._isAllDayEvent(entry), // Add all-day detection
            };

            const position = slotManager.calculatePosition(positionConfig);
            const accessibility =
                slotManager.calculateAccessibility(positionConfig);
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

            return this._composeEntry({
                index: globalIndex,
                slot: position.slotName || 'week-direct-grid', // Use fallback slot for direct grid positioning
                styles: css`
                    lms-calendar-entry._${globalIndex} {
                        --entry-background-color: rgba(250, 250, 250, 0.8);
                        --entry-color: #333;
                        --entry-border: 1px solid rgba(0, 0, 0, 0.15);
                        --entry-handle-color: ${unsafeCSS(
                            entry.color || '#1976d2',
                        )};
                        --entry-handle-width: 4px;
                        --entry-handle-display: block;
                        --entry-padding-left: calc(4px + 0.35em);
                        --entry-layout: ${unsafeCSS(
                            this._getSmartLayout(
                                entry,
                                layoutBox.height,
                                layoutBox.width,
                                {
                                    depth: layoutBox.depth,
                                    opacity: layoutBox.opacity,
                                },
                            ),
                        )};
                        ${positionCSS};
                    }
                `,
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
        return R.pipe(
            this.entries,
            R.flatMap((entry) =>
                this._expandEntryMaybe({
                    entry,
                    range: this._getDaysRange(entry.date),
                }),
            ),
            R.reduce((acc, entry) => {
                const key = `${entry.date.start.day}-${entry.date.start.month}-${entry.date.start.year}`;
                acc[key] = acc[key] ? acc[key] + 1 : 1;
                return acc;
            }, {} as Record<string, number>),
            Object.entries,
            R.map.indexed(([key, value], index) =>
                this._composeEntry({
                    index,
                    slot: key.split('-').reverse().join('-'),
                    styles: css`
                        lms-calendar-entry._${index} {
                            --entry-color: var(--separator-mid);
                            text-align: center;
                        }
                    `,
                    entry: {
                        heading: `${value} events`,
                    },
                    displayMode: 'month-dot',
                }),
            ),
        );
    }

    private _getWeekStartDate(date: CalendarDate): Date {
        const currentDate = new Date(date.year, date.month - 1, date.day);
        const dayOfWeek = currentDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() + mondayOffset);
        return weekStart;
    }

    private _getSmartLayout(
        entry: CalendarEntry,
        height: number,
        width?: number,
        layoutBox?: { depth: number; opacity: number },
    ): 'row' | 'column' {
        if (!entry.time) return 'row';

        // Calculate event duration in minutes
        const durationMinutes = entry.time
            ? entry.time.end.hour * 60 +
              entry.time.end.minute -
              (entry.time.start.hour * 60 + entry.time.start.minute)
            : 0;

        // Estimate content requirements
        const titleLength = entry.heading?.length || 0;
        const hasContent = Boolean(entry.content);

        // Overlap context analysis
        const isOverlapping = layoutBox && layoutBox.depth > 0;
        const isBackgroundEvent = layoutBox && layoutBox.depth > 0;
        const isTransparent = layoutBox && layoutBox.opacity < 0.8;
        const hasSignificantOverlap =
            layoutBox && (layoutBox.depth > 1 || layoutBox.opacity < 0.6);

        // Dynamic thresholds based on content and viewport
        const minTwoLineHeight = hasContent ? 50 : 40; // More space needed if there's content
        const comfortableRowWidth = Math.max(120, this._calendarWidth * 0.15); // Scale with viewport
        const longTitleThreshold = Math.max(
            15,
            Math.min(25, this._calendarWidth / 50),
        ); // Adaptive threshold

        // Multi-factor decision making
        const factors = {
            // Height factors
            hasEnoughHeight: height >= minTwoLineHeight,
            hasComfortableHeight: height >= minTwoLineHeight + 20,

            // Width factors
            hasEnoughWidth: !width || width >= comfortableRowWidth,
            hasComfortableWidth: !width || width >= comfortableRowWidth + 40,

            // Content factors
            hasLongTitle: titleLength > longTitleThreshold,
            hasAdditionalContent: hasContent,

            // Duration factors
            isVeryShort: durationMinutes <= 15, // 15 minutes or less
            isShort: durationMinutes <= 30, // 30 minutes or less
            isMedium: durationMinutes <= 60, // 1 hour or less
            isLong: durationMinutes > 60, // More than 1 hour

            // Overlap factors - KEY FOR VISIBILITY
            isOverlapping: Boolean(isOverlapping),
            isBackgroundEvent: Boolean(isBackgroundEvent),
            isTransparent: Boolean(isTransparent),
            hasSignificantOverlap: Boolean(hasSignificantOverlap),
        };

        // OVERLAP-AWARE DECISION LOGIC - PRIORITIZE VISIBILITY

        // CRITICAL: Force column for background events that might be obscured
        if (factors.isBackgroundEvent && factors.hasEnoughHeight) {
            return 'column'; // Time must be visible in top area
        }

        // CRITICAL: Force column for highly transparent events (poor text contrast)
        if (factors.hasSignificantOverlap && factors.hasEnoughHeight) {
            return 'column'; // Better text visibility with stacked layout
        }

        // Force column for any overlapping event with adequate space
        if (factors.isOverlapping && factors.hasComfortableHeight) {
            return 'column'; // Overlapping events need better visibility
        }

        // Force row ONLY for very short events with no overlapping issues
        if (factors.isVeryShort && !factors.isOverlapping) {
            return 'row';
        }

        // Prefer column when we have long titles and enough height
        if (factors.hasLongTitle && factors.hasEnoughHeight) {
            return 'column';
        }

        // Prefer column when we have additional content and space
        if (
            factors.hasAdditionalContent &&
            factors.hasEnoughHeight &&
            factors.hasEnoughWidth
        ) {
            return 'column';
        }

        // For medium events, consider space efficiency
        if (factors.isMedium) {
            // If we have good height but limited width, stack vertically
            if (factors.hasEnoughHeight && !factors.hasComfortableWidth) {
                return 'column';
            }
            // If we have good width but limited height, go horizontal
            if (factors.hasComfortableWidth && !factors.hasEnoughHeight) {
                return 'row';
            }
        }

        // Default: use height-based decision with width consideration
        if (factors.hasEnoughHeight && factors.hasEnoughWidth) {
            return 'column';
        }

        return 'row';
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

    private _isAllDayEvent(entry: Partial<CalendarEntry>): boolean {
        // Check if it's a true all-day event (0:00 to 23:59)
        if (!entry.time) return true;

        const { start, end } = entry.time;
        return (
            start.hour === 0 &&
            start.minute === 0 &&
            end.hour === 23 &&
            end.minute === 59
        );
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
        'lms-calendar-menu': LMSCalendarMenu;
    }

    type CalendarTime = {
        hour: number;
        minute: number;
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
