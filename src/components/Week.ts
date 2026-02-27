import { localized } from '@lit/localize';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { getLocalizedWeekdayShort } from '../lib/localization.js';
import './Day.js';

@customElement('lms-calendar-week')
@(localized() as ClassDecorator)
export default class Week extends LitElement {
    @property({ attribute: false })
    activeDate: CalendarDate = {
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    };

    private _hasAllDayEvents = false;
    private _allDayEventCount = 0;
    private _allDayEventsByPosition = new Map<number, Array<HTMLElement>>();
    private _eventRowAssignments = new Map<string, number>(); // Track row assignments for multi-day events

    static override styles = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .week-container {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height);
            overflow: hidden;
        }

        .week-header {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            height: var(--day-header-height, 3.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
        }

        .time-header {
            border-right: 1px solid var(--separator-light);
        }

        .day-label {
            text-align: center;
            padding: var(--day-padding, 0.5em);
            font-weight: var(--day-label-font-weight);
            border-right: var(--separator-border);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .day-label:hover {
            background-color: var(--separator-light);
        }

        .day-label:focus {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: 2px;
            background-color: var(--separator-light);
        }

        .day-label:last-child {
            border-right: none;
        }

        .day-label.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .week-content {
            flex: 1;
            overflow-y: auto;
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            grid-template-rows: var(--calendar-grid-rows-time);
            height: var(--main-content-height);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            min-height: 0;
            position: relative;
        }

        .time-slots {
            grid-column: 1;
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
            background: var(--background-color, white);
        }

        .hour-indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
        }

        .week-days {
            display: contents;
        }

        .day-column {
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
            position: relative;
        }

        .day-column:last-child {
            border-right: none;
        }

        .hour-separator {
            grid-column: 2 / 3;
            border-top: var(--separator-border, 1px solid var(--separator-light));
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .hour-slot-container {
            overflow: hidden;
        }

        /* All-day events section */
        .all-day-wrapper {
            border-bottom: var(--separator-border);
            padding: var(--day-padding) 0;
            background: var(--background-color);
            z-index: 2;
            position: relative;
            transition: height 0.2s ease;
        }

        /* JS-controlled visibility for all-day wrapper */
        .all-day-wrapper.hidden {
            display: none;
        }

        .all-day-container {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            gap: var(--day-gap, 1px);
            padding: 0 var(--day-padding, 0.5em);
            min-height: 2em;
        }

        .all-day-day-column {
            position: relative;
            min-height: 2em;
            padding: 0.25em 0;
        }

        /* Stack all-day events vertically with consistent positioning */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry) {
            position: relative !important;
            display: block !important;
            margin-bottom: 0.25em !important;
            z-index: var(--entry-z-index, 1) !important;
        }

        /* Multi-day event continuation styling */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry[data-is-continuation]) {
            margin-left: -2px !important; /* Slight overlap for visual connection */
            border-left: 3px solid rgba(255, 255, 255, 0.4) !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry:not([data-is-continuation])) {
            border-right: 1px solid rgba(255, 255, 255, 0.2) !important; /* Prepare for continuation */
        }

        /* Enhanced multi-day spanning styles with consistent ordering */
        /* Use higher specificity to override Entry component's border-radius */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.first-day) {
            border-top-right-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            border-top-left-radius: var(--entry-border-radius) !important;
            border-bottom-left-radius: var(--entry-border-radius) !important;
            position: relative !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.middle-day) {
            border-top-left-radius: 0 !important;
            border-top-right-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-bottom-right-radius: 0 !important;
            position: relative !important;
            border-left: 3px solid rgba(255, 255, 255, 0.4) !important;
            margin-left: -2px !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.last-day) {
            border-top-left-radius: 0 !important;
            border-bottom-left-radius: 0 !important;
            border-top-right-radius: var(--entry-border-radius) !important;
            border-bottom-right-radius: var(--entry-border-radius) !important;
            position: relative !important;
            border-left: 3px solid rgba(255, 255, 255, 0.4) !important;
            margin-left: -2px !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.single-day) {
            border-radius: var(--entry-border-radius) !important;
            position: relative !important;
        }

        .all-day-time-header {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
            font-weight: var(--day-label-font-weight);
            border-right: var(--separator-border);
        }

        /* Multi-day event spanning styles */
        .week-spanning-event {
            position: absolute;
            top: 0;
            height: 1.5em;
            margin-bottom: 0.25em;
            border-radius: var(--entry-border-radius);
            font-size: var(--entry-font-size);
            padding: var(--entry-padding);
            display: flex;
            align-items: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            z-index: 3;
        }

        .week-spanning-event.first-day {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
        }

        .week-spanning-event.middle-day {
            border-radius: 0;
        }

        .week-spanning-event.last-day {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
        }

        .week-spanning-event.single-day {
            border-radius: var(--entry-border-radius);
        }
    `;

    override connectedCallback() {
        super.connectedCallback();
        // Note: open-menu events from entry components naturally bubble up
        // No need to manually forward them as it causes infinite recursion
    }

    override firstUpdated() {
        this._updateAllDayState();
    }

    private _updateAllDayState() {
        // Count all-day slots across all days to determine container height
        const weekDates = this._getWeekDates();

        // Clear previous positioning maps
        this._allDayEventsByPosition.clear();
        this._eventRowAssignments.clear();

        // First pass: collect all events and identify unique events (both multi-day and single-day)
        const allEventsByDay = new Map<number, HTMLElement[]>();
        const uniqueEvents = new Map<string, { days: Set<number>; isMultiDay: boolean }>(); // event ID -> event info

        weekDates.forEach((date, dayIndex) => {
            const slotName = `all-day-${date.year}-${date.month}-${date.day}`;
            const allDaySlot = this.shadowRoot?.querySelector(
                `slot[name="${slotName}"]`,
            ) as HTMLSlotElement;

            if (allDaySlot) {
                const childNodes = allDaySlot.assignedElements({
                    flatten: true,
                }) as Array<HTMLElement>;

                allEventsByDay.set(dayIndex, childNodes);

                // Track all events by their heading/id
                childNodes.forEach((node) => {
                    const element = node as HTMLElement & {
                        heading?: string;
                        isContinuation?: boolean;
                        time?: { start: { hour: number; minute: number } };
                    };
                    // Create a unique event ID based on heading and other properties
                    const eventId = this._getEventUniqueId(element);

                    // Check if this is a multi-day event
                    const isMultiDay = element.isContinuation || false;

                    if (!uniqueEvents.has(eventId)) {
                        uniqueEvents.set(eventId, {
                            days: new Set(),
                            isMultiDay: isMultiDay,
                        });
                    }
                    uniqueEvents.get(eventId)!.days.add(dayIndex);
                });
            }
        });

        // Second pass: assign consistent row positions for all events
        // using a proper allocation algorithm that handles overlaps
        const eventRows = new Map<string, number>();
        const nextRow = this._allocateRowsForEvents(uniqueEvents, eventRows);

        // Third pass: position all events with consistent row assignments
        let maxRowsNeeded = nextRow; // Start with the number of multi-day event rows

        weekDates.forEach((_date, dayIndex) => {
            const events = allEventsByDay.get(dayIndex) || [];
            const sortedEvents = this._sortAndPositionEvents(events, eventRows, nextRow);

            // Apply visual styling
            this._applyEventPositioning(sortedEvents, dayIndex);

            // Track the maximum number of rows needed
            const rowsForThisDay = this._calculateRowsNeeded(sortedEvents, eventRows);
            maxRowsNeeded = Math.max(maxRowsNeeded, rowsForThisDay);

            // Store positioned events for this day
            this._allDayEventsByPosition.set(dayIndex, sortedEvents);
        });

        this._hasAllDayEvents =
            allEventsByDay.size > 0 &&
            Array.from(allEventsByDay.values()).some((events) => events.length > 0);
        this._allDayEventCount = maxRowsNeeded;

        // Adjust week content height based on all-day events
        const weekContent = this.shadowRoot?.querySelector('.week-content') as HTMLElement;
        if (weekContent) {
            if (this._hasAllDayEvents) {
                const allDayHeight = Math.max(2.5, this._allDayEventCount * 2) + 1; // Base height + events
                weekContent.style.height = `calc(var(--main-content-height) - ${allDayHeight}em)`;
            } else {
                weekContent.style.height = 'var(--main-content-height)';
            }
        }

        // Trigger re-render to update visibility
        this.requestUpdate();
    }

    private _handleAllDaySlotChange = () => {
        // Debounce to avoid excessive recalculations
        setTimeout(() => this._updateAllDayState(), 0);
    };

    /**
     * Sort events and assign them consistent row positions
     * Multi-day events get their pre-assigned rows, single-day events fill in below
     */
    private _sortAndPositionEvents(
        events: HTMLElement[],
        eventRows: Map<string, number>,
        _nextAvailableRow: number,
    ): HTMLElement[] {
        // Sort events by their assigned row
        const sortedEvents = events.sort((a, b) => {
            const aElement = a as HTMLElement & {
                heading?: string;
                time?: { start: { hour: number; minute: number } };
            };
            const bElement = b as HTMLElement & {
                heading?: string;
                time?: { start: { hour: number; minute: number } };
            };
            const aId = this._getEventUniqueId(aElement);
            const bId = this._getEventUniqueId(bElement);
            const aRow = eventRows.get(aId) ?? 999;
            const bRow = eventRows.get(bId) ?? 999;
            return aRow - bRow;
        });

        // Apply row positioning to all events
        sortedEvents.forEach((event) => {
            const element = event as HTMLElement & { heading?: string };
            const eventId = this._getEventUniqueId(element);
            const row = eventRows.get(eventId);

            if (row !== undefined) {
                event.style.order = row.toString();
                event.setAttribute('data-row', row.toString());
            }
        });

        return sortedEvents;
    }

    /**
     * Calculate the number of rows needed for a day's events
     */
    private _calculateRowsNeeded(events: HTMLElement[], eventRows: Map<string, number>): number {
        let maxRow = 0;

        events.forEach((event) => {
            const element = event as HTMLElement & {
                heading?: string;
                time?: { start: { hour: number; minute: number } };
            };
            const eventId = this._getEventUniqueId(element);
            const row = eventRows.get(eventId) || 0;
            maxRow = Math.max(maxRow, row + 1);
        });

        return maxRow;
    }

    /**
     * Get a unique identifier for an event
     */
    private _getEventUniqueId(
        element: HTMLElement & {
            heading?: string;
            time?: { start: { hour: number; minute: number } };
            date?: { start?: { year: number; month: number; day: number } };
            isContinuation?: boolean;
        },
    ): string {
        // Create a unique identifier based on the event's properties
        const heading = element.heading || 'untitled';
        const time = element.time
            ? `${element.time.start.hour}:${element.time.start.minute}`
            : 'allday';
        const date = element.date?.start
            ? `${element.date.start.year}-${element.date.start.month}-${element.date.start.day}`
            : 'nodate';

        // For continuation events (multi-day), use a consistent ID
        if (element.isContinuation && element.date?.start) {
            // Use the start date of the multi-day span as part of the ID
            return `${heading}-${date}-continuation`;
        }

        // For regular events, include more details to ensure uniqueness
        return `${heading}-${date}-${time}`;
    }

    /**
     * Allocate rows for all events using a proper algorithm that handles overlaps
     * This ensures events don't "jump" rows when other events end
     */
    private _allocateRowsForEvents(
        uniqueEvents: Map<string, { days: Set<number>; isMultiDay: boolean }>,
        eventRows: Map<string, number>,
    ): number {
        // Separate and sort events: multi-day first, then single-day
        const multiDayEvents: Array<[string, Set<number>]> = [];
        const singleDayEvents: Array<[string, Set<number>]> = [];

        uniqueEvents.forEach((info, eventId) => {
            if (info.isMultiDay) {
                multiDayEvents.push([eventId, info.days]);
            } else {
                singleDayEvents.push([eventId, info.days]);
            }
        });

        // Sort multi-day events by start day, then by event ID
        multiDayEvents.sort((a, b) => {
            const aMinDay = Math.min(...Array.from(a[1]));
            const bMinDay = Math.min(...Array.from(b[1]));
            if (aMinDay !== bMinDay) return aMinDay - bMinDay;
            return a[0].localeCompare(b[0]);
        });

        // Sort single-day events by day
        singleDayEvents.sort((a, b) => {
            const aDay = Math.min(...Array.from(a[1]));
            const bDay = Math.min(...Array.from(b[1]));
            return aDay - bDay;
        });

        // Track which rows are occupied on each day
        const rowOccupancy = new Map<number, Set<number>>(); // day -> set of occupied rows
        for (let day = 0; day < 7; day++) {
            rowOccupancy.set(day, new Set());
        }

        // First, assign rows to multi-day events
        multiDayEvents.forEach(([eventId, days]) => {
            // Find the lowest available row that's free on all days this event spans
            let assignedRow = 0;
            let foundRow = false;

            while (!foundRow) {
                // Check if this row is available on all days the event spans
                let rowAvailable = true;
                for (const day of days) {
                    if (rowOccupancy.get(day)?.has(assignedRow)) {
                        rowAvailable = false;
                        break;
                    }
                }

                if (rowAvailable) {
                    // This row is available, assign it
                    foundRow = true;
                    eventRows.set(eventId, assignedRow);

                    // Mark this row as occupied on all days the event spans
                    for (const day of days) {
                        rowOccupancy.get(day)?.add(assignedRow);
                    }
                } else {
                    // Try the next row
                    assignedRow++;
                }
            }
        });

        // Then assign rows to single-day events
        singleDayEvents.forEach(([eventId, days]) => {
            // For single-day events, find the first available row on that day
            const day = Array.from(days)[0]; // Single day
            let assignedRow = 0;

            while (rowOccupancy.get(day)?.has(assignedRow)) {
                assignedRow++;
            }

            eventRows.set(eventId, assignedRow);
            rowOccupancy.get(day)?.add(assignedRow);
        });

        // Return the maximum number of rows needed
        let maxRows = 0;
        rowOccupancy.forEach((rows) => {
            maxRows = Math.max(maxRows, rows.size);
        });
        return maxRows;
    }

    /**
     * Apply positioning and visual styling to sorted events
     * Ensures visual connections for multi-day spanning events
     */
    private _applyEventPositioning(events: HTMLElement[], dayIndex: number) {
        events.forEach((event, eventIndex) => {
            // Set z-index based on position (higher for events at top)
            const zIndex = 10 + (events.length - eventIndex);
            event.style.zIndex = zIndex.toString();

            // Always apply styling to determine correct positioning
            this._applyMultiDaySpanningStyles(event, dayIndex);

            // Set consistent vertical positioning
            event.style.position = 'relative';
            event.style.order = eventIndex.toString();
        });
    }

    /**
     * Apply visual styling for multi-day spanning events
     * Creates visual connections across days
     */
    private _applyMultiDaySpanningStyles(event: HTMLElement, dayIndex: number) {
        const eventElement = event as HTMLElement & {
            heading?: string;
            isContinuation?: boolean;
            continuation?: { has?: boolean; is?: boolean; index?: number };
        };
        const continuation = eventElement.continuation;
        const isContinuation = eventElement.isContinuation;
        const isMultiDay = continuation?.has || isContinuation || false;

        if (!isMultiDay) {
            // For single-day events, just ensure they have the single-day class
            event.classList.remove('first-day', 'middle-day', 'last-day');
            event.classList.add('single-day');
            return;
        }

        // Remove all positioning classes first
        event.classList.remove('first-day', 'middle-day', 'last-day', 'single-day');

        // Determine position based on continuation.index and total span length
        // We need to find all events with the same heading to determine the span length
        const eventId = this._getEventUniqueId(eventElement);
        const weekDates = this._getWeekDates();

        // Count how many days this event spans within the current week
        let eventSpanInWeek = 0;
        let eventStartIndex = -1;

        // Find this event across all days in the week
        weekDates.forEach((date, index) => {
            const slotName = `all-day-${date.year}-${date.month}-${date.day}`;
            const slot = this.shadowRoot?.querySelector(
                `slot[name="${slotName}"]`,
            ) as HTMLSlotElement;
            if (slot) {
                const events = slot.assignedElements({
                    flatten: true,
                }) as HTMLElement[];
                const matchingEvent = events.find(
                    (e) =>
                        this._getEventUniqueId(
                            e as HTMLElement & {
                                heading?: string;
                                time?: {
                                    start: { hour: number; minute: number };
                                };
                                date?: {
                                    start?: {
                                        year: number;
                                        month: number;
                                        day: number;
                                    };
                                };
                            },
                        ) === eventId,
                );
                if (matchingEvent) {
                    if (eventStartIndex === -1) eventStartIndex = index;
                    eventSpanInWeek++;
                }
            }
        });

        // Determine position within the week span
        const currentDayPosition = dayIndex - eventStartIndex;
        const isFirstDay = currentDayPosition === 0;
        const isLastDay = currentDayPosition === eventSpanInWeek - 1;

        if (isFirstDay && isLastDay) {
            // Single day (shouldn't happen for multi-day, but safety check)
            event.classList.add('single-day');
        } else if (isFirstDay) {
            event.classList.add('first-day');
        } else if (isLastDay) {
            event.classList.add('last-day');
            // Add visual connection styling for continuation
            event.style.borderLeftWidth = '3px';
            event.style.borderLeftStyle = 'solid';
            event.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)';
            event.style.marginLeft = '-2px';
        } else {
            event.classList.add('middle-day');
            // Add visual connection styling for continuation
            event.style.borderLeftWidth = '3px';
            event.style.borderLeftStyle = 'solid';
            event.style.borderLeftColor = 'rgba(255, 255, 255, 0.4)';
            event.style.marginLeft = '-2px';
        }

        // Set the data attribute for CSS styling
        event.setAttribute('data-is-continuation', isMultiDay ? 'true' : 'false');
    }

    private _getWeekDates(): CalendarDate[] {
        // Get the start of the week (Monday)
        const currentDate = new Date(
            this.activeDate.year,
            this.activeDate.month - 1,
            this.activeDate.day,
        );
        const dayOfWeek = currentDate.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() + mondayOffset);

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            return {
                day: date.getDate(),
                month: date.getMonth() + 1,
                year: date.getFullYear(),
            };
        });
    }

    private _isCurrentDate(date: CalendarDate) {
        const today = new Date();
        return (
            date.day === today.getDate() &&
            date.month === today.getMonth() + 1 &&
            date.year === today.getFullYear()
        );
    }

    override render() {
        const weekDates = this._getWeekDates();

        return html`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${weekDates.map(
                        (date, index) => html`
                            <div
                                class="day-label ${classMap({
                                    current: this._isCurrentDate(date),
                                })}"
                                tabindex="0"
                                role="button"
                                aria-label="Switch to day view for ${getLocalizedWeekdayShort(
                                    index + 1,
                                )}, ${date.day}"
                                @click=${() => this._handleDayLabelClick(date)}
                                @keydown=${(e: KeyboardEvent) =>
                                    this._handleDayLabelKeydown(e, date)}
                            >
                                <div>
                                    ${getLocalizedWeekdayShort(index + 1)}
                                </div>
                                <div>${date.day}</div>
                            </div>
                        `,
                    )}
                </div>

                <!-- All-day events section -->
                <div
                    class="all-day-wrapper ${classMap({
                        hidden: !this._hasAllDayEvents,
                    })}"
                >
                    <div class="all-day-container">
                        <div class="all-day-time-header">All Day</div>
                        ${weekDates.map(
                            (date) => html`
                                <div class="all-day-day-column">
                                    <slot
                                        name="all-day-${date.year}-${date.month}-${date.day}"
                                        @slotchange=${this._handleAllDaySlotChange}
                                    ></slot>
                                </div>
                            `,
                        )}
                    </div>
                </div>
                <div class="week-content">
                    <!-- Hour indicators -->
                    ${Array.from({ length: 25 }).map(
                        (_, hour) => html`
                            <div
                                class="hour-indicator"
                                style="grid-column: 1; grid-row: ${hour * 60 + 1};"
                            >
                                ${this._renderIndicatorValue(hour)}
                            </div>
                        `,
                    )}

                    <!-- Hour separators -->
                    ${Array.from({ length: 25 }).map(
                        (_, hour) => html`
                            ${
                                hour > 0
                                    ? html`
                                      <div
                                          class="hour-separator"
                                          style="grid-column: 2 / -1; grid-row: ${hour * 60};"
                                      ></div>
                                  `
                                    : ''
                            }
                        `,
                    )}

                    <!-- Hour slots for each day -->
                    ${weekDates.map(
                        (date, dayIndex) => html`
                            ${Array.from({ length: 25 }).map(
                                (_, hour) => html`
                                    <div
                                        class="hour-slot-container"
                                        style="grid-column: ${dayIndex + 2}; grid-row: ${
                                            hour * 60 + 1
                                        } / ${(hour + 1) * 60 + 1}; position: relative;"
                                    >
                                        <slot
                                            name="${date.year}-${date.month}-${date.day}-${hour}"
                                            data-debug="Day ${
                                                dayIndex + 1
                                            } (${date.month}/${date.day}) Hour ${hour}"
                                        ></slot>
                                    </div>
                                `,
                            )}
                        `,
                    )}

                    <!-- Fallback slot for direct grid positioned entries -->
                    <slot
                        name="week-direct-grid"
                        style="display: contents;"
                    ></slot>
                </div>
            </div>
        `;
    }

    private _renderIndicatorValue(hour: number) {
        return hour < 10 ? `0${hour}:00` : `${hour}:00`;
    }

    private _handleDayLabelClick(date: CalendarDate) {
        // Dispatch event to switch to day view for the clicked date
        const event = new CustomEvent('expand', {
            detail: { date },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    private _handleDayLabelKeydown(e: KeyboardEvent, date: CalendarDate) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleDayLabelClick(date);
        }
    }
}
