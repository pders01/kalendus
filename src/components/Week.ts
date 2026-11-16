import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { formatLocalizedTime, getLocalizedWeekdayShort } from '../lib/localization.js';
import { getMessages } from '../lib/messages.js';
import { type FirstDayOfWeek, getWeekDates, getWeekdayOrder } from '../lib/weekStartHelper.js';
import './Day.js';
import { CurrentDateController } from './CurrentDateController.js';
import { dateKey } from './dateNavigation.js';
import { TimeGridSizingController, assignLegacyAllDayRows } from './TimeGridSizingController.js';

@customElement('lms-calendar-week')
export default class Week extends LitElement {
    private _today = new CurrentDateController(this);
    @property({ attribute: false })
    activeDate: CalendarDate = {
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    };

    @property({ type: Number })
    allDayRowCount = 0;

    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    @property({ type: String })
    locale = 'en';

    @property({ type: Number })
    localeVersion = 0;

    /** Condensed subset of dates to render (defaults to full week). */
    @property({ attribute: false })
    visibleDates?: CalendarDate[];

    /** Start offset into the full 7-day week. */
    @property({ type: Number })
    visibleStartIndex = 0;

    /** Number of visible day columns. */
    @property({ type: Number })
    visibleLength = 7;

    static override styles = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .week-container {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height, 100%);
            overflow: hidden;
            position: relative;
        }

        .week-header {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            height: var(--day-header-height, 2.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            gap: var(--day-gap, 1px);
            padding: 0 var(--day-padding, 0.5em);
            position: relative;
            overflow: hidden;
        }

        .time-header {
            border-inline-end: 1px solid var(--separator-light);
        }

        .day-label {
            text-align: center;
            padding: 0 0.25em;
            font-weight: var(--day-label-font-weight);
            border-inline-end: var(--separator-border);
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 0.35em;
            cursor: pointer;
            transition: background-color var(--transition-speed) ease;
            overflow: hidden;
        }

        .day-name {
            font-size: 0.7em;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .day-number {
            font-size: 0.95em;
            font-weight: var(--day-label-number-font-weight);
            line-height: 1;
        }

        .day-label:hover {
            background-color: var(--hover-bg);
        }

        .day-label:focus {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: 2px;
            background-color: var(--focus-bg);
        }

        .day-label:last-child {
            border-inline-end: none;
        }

        .day-label.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .week-scroll {
            flex: 1;
            overflow-y: auto;
            scroll-snap-type: y proximity;
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            grid-template-rows: 1fr;
            gap: var(--day-gap, 1px);
            /* Vertical padding gives the first/last hour labels room to
               render above/below the grid without clipping.
               Horizontal padding keeps the scrollport flush. */
            padding: 0.6em var(--day-padding, 0.5em);
            min-height: 0;
            position: relative;
            contain: content;
        }

        .time-labels {
            grid-column: 1;
            position: relative;
            height: var(--day-total-height);
            border-inline-end: var(--sidebar-border, 1px solid var(--separator-light));
            background: var(--background-color, white);
        }

        .hour-label {
            position: absolute;
            left: 0;
            right: 0;
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
            pointer-events: none;
        }

        .hour-label .indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
        }

        /* Snap at noon: first scroll stop aligns with --half-day-height */
        .hour-label.snap-target {
            scroll-snap-align: start;
        }

        .day-column {
            position: relative;
            height: var(--day-total-height);
            border-inline-end: var(--sidebar-border, 1px solid var(--separator-light));
            /* Match time-labels clipping */
            overflow: clip;
            background-image: linear-gradient(to bottom, var(--separator-light) 1px, transparent 1px);
            background-size: 100% var(--hour-height);
        }

        .day-column:last-child {
            border-inline-end: none;
        }

        /* All-day events section */
        .all-day-wrapper {
            display: block;
            max-block-size: min(35%, var(--all-day-max-height, 12rem));
            overflow-y: auto;
            overscroll-behavior: contain;
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            background: var(--background-color);
            z-index: 2;
            position: relative;
            /* Bounded scroller: the timed grid always retains usable space. */
        }

        .all-day-container {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            min-height: 0;
            overflow: hidden;
        }

        .all-day-day-column {
            position: relative;
            min-height: 2em;
            padding: 0.25em 0;
            display: grid;
            grid-template-rows: repeat(
                var(--all-day-rows, 1),
                var(--all-day-row-height, max(24px, 1.5rem))
            );
            grid-auto-rows: var(--all-day-row-height, max(24px, 1.5rem));
            gap: 4px;
        }
        .all-day-day-column slot {
            display: contents;
        }

        /* Stack all-day events vertically with consistent positioning */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry) {
            position: relative !important;
            display: block !important;
            grid-column: 1 !important;
            grid-row: calc(var(--all-day-row, var(--legacy-all-day-row, 0)) + 1) !important;
            min-height: 24px !important;
            height: var(--all-day-row-height, max(24px, 1.5rem)) !important;
            margin-block: 0 !important;
            z-index: var(--entry-z-index, 1) !important;
        }

        /* Enhanced multi-day spanning styles with consistent ordering */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.first-day) {
            border-start-end-radius: 0 !important;
            border-end-end-radius: 0 !important;
            border-start-start-radius: var(--entry-border-radius) !important;
            border-end-start-radius: var(--entry-border-radius) !important;
            position: relative !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.middle-day) {
            border-start-start-radius: 0 !important;
            border-start-end-radius: 0 !important;
            border-end-start-radius: 0 !important;
            border-end-end-radius: 0 !important;
            position: relative !important;
            border-inline-start: var(--multi-day-separator) !important;
            margin-inline-start: -2px !important;
        }

        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry.last-day) {
            border-start-start-radius: 0 !important;
            border-end-start-radius: 0 !important;
            border-start-end-radius: var(--entry-border-radius) !important;
            border-end-end-radius: var(--entry-border-radius) !important;
            position: relative !important;
            border-inline-start: var(--multi-day-separator) !important;
            margin-inline-start: -2px !important;
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
            border-inline-end: var(--separator-border);
        }

        /* Peek indicators for condensed view */
        .peek-indicators {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 0.25em;
            min-height: 24px;
            flex-shrink: 0;
            border-bottom: var(--separator-border);
        }

        .peek-indicator {
            display: flex;
            align-items: center;
            gap: 0.25em;
            color: var(--hour-indicator-color, rgba(0, 0, 0, 0.5));
            font-size: 0.75em;
            cursor: pointer;
            user-select: none;
            padding: 0.1em 0.35em;
            border-radius: var(--border-radius-sm);
            transition:
                background-color var(--transition-speed) ease,
                color var(--transition-speed) ease;
        }

        .peek-indicator:hover {
            background-color: var(--hover-bg);
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
        }

        .peek-indicator:active {
            background-color: var(--peek-active-bg);
        }

        button {
            font: inherit;
            color: inherit;
            border: none;
            background: none;
            min-inline-size: 24px;
            min-block-size: 24px;
        }
        button:focus-visible,
        .all-day-wrapper:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: -2px;
        }
        @media (forced-colors: active) {
            button:focus-visible,
            .all-day-wrapper:focus-visible {
                outline-color: Highlight;
            }
        }
        .peek-indicator--hidden {
            visibility: hidden;
            pointer-events: none;
        }
    `;

    private _getWeekDates(): CalendarDate[] {
        return getWeekDates(this.activeDate, this.firstDayOfWeek);
    }

    /** Return the dates to actually render (condensed subset or full week). */
    private _getDatesToRender(): CalendarDate[] {
        return this.visibleDates ?? this._getWeekDates();
    }

    /** Return the weekday order slice matching the visible dates. */
    private _getVisibleWeekdayOrder(): number[] {
        const fullOrder = getWeekdayOrder(this.firstDayOfWeek);
        if (this.visibleDates && this.visibleLength < 7) {
            return fullOrder.slice(
                this.visibleStartIndex,
                this.visibleStartIndex + this.visibleLength,
            );
        }
        return fullOrder;
    }

    private _isCurrentDate(date: CalendarDate) {
        const today = this._today.date;
        return (
            date.day === today.getDate() &&
            date.month === today.getMonth() + 1 &&
            date.year === today.getFullYear()
        );
    }

    /** Whether the view is condensed (showing fewer than 7 days). */
    private get _isCondensed(): boolean {
        return this.visibleDates !== undefined && this.visibleLength < 7;
    }

    constructor() {
        super();
        new TimeGridSizingController(this, '.week-container', '.week-header');
    }

    /** Root drill-down/return focus destination. */
    public async focusDate(date: CalendarDate = this.activeDate) {
        await this.updateComplete;
        this.renderRoot
            .querySelector<HTMLButtonElement>(`button[data-date="${dateKey(date)}"]`)
            ?.focus();
    }

    override render() {
        const datesToRender = this._getDatesToRender();
        const weekdayOrder = this._getVisibleWeekdayOrder();
        const hasAllDay = this.allDayRowCount > 0;

        const showLeftPeek = this._isCondensed && this.visibleStartIndex > 0;
        const showRightPeek = this._isCondensed && this.visibleStartIndex + this.visibleLength < 7;

        return html`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${datesToRender.map((date, index) => {
                        const msg = getMessages(this.locale);
                        return html`
                            <button type="button"
                                data-date=${dateKey(date)}
                                class="day-label ${classMap({
                                    current: this._isCurrentDate(date),
                                })}"
                                aria-current=${this._isCurrentDate(date) ? 'date' : 'false'}
                                aria-label="${msg.switchToDayView} ${getLocalizedWeekdayShort(
                                    weekdayOrder[index],
                                    this.locale,
                                )}, ${date.day}"
                                @click=${() => this._handleDayLabelClick(date)}
                            >
                                <span class="day-name">${getLocalizedWeekdayShort(weekdayOrder[index], this.locale)}</span>
                                <span class="day-number">${date.day}</span>
                            </button>
                        `;
                    })}
                </div>

                <!-- Peek indicators for condensed view -->
                ${
                    this._isCondensed
                        ? (() => {
                              const msg = getMessages(this.locale);
                              return html`
                <div class="peek-indicators">
                    <button type="button"
                        class="peek-indicator ${classMap({ 'peek-indicator--hidden': !showLeftPeek })}"
                        ?disabled=${!showLeftPeek}
                        tabindex=${showLeftPeek ? '0' : '-1'}
                        aria-label="${msg.showEarlierDays}"
                        @click=${() => this._handlePeekNavigate('previous')}
                    >\u2039 ${msg.more}</button>
                    <button type="button"
                        class="peek-indicator ${classMap({ 'peek-indicator--hidden': !showRightPeek })}"
                        ?disabled=${!showRightPeek}
                        tabindex=${showRightPeek ? '0' : '-1'}
                        aria-label="${msg.showLaterDays}"
                        @click=${() => this._handlePeekNavigate('next')}
                    >${msg.more} \u203A</button>
                </div>
                `;
                          })()
                        : nothing
                }

                <!-- All-day events section -->
                ${
                    hasAllDay
                        ? html`
                <div class="all-day-wrapper" tabindex="0" role="region" aria-label=${getMessages(this.locale).allDay}>
                    <div class="all-day-container" style="--all-day-rows: ${Math.max(1, this.allDayRowCount)}">
                        <div class="all-day-time-header">${getMessages(this.locale).allDay}</div>
                        ${datesToRender.map(
                            (date) => html`
                                <div class="all-day-day-column">
                                    <slot
                                        name="all-day-${date.year}-${date.month}-${date.day}"
                                        @slotchange=${assignLegacyAllDayRows}
                                    ></slot>
                                </div>
                            `,
                        )}
                    </div>
                </div>
                `
                        : nothing
                }
                <div class="week-scroll">
                    <div class="time-labels">
                        ${Array.from({ length: 25 }).map(
                            (_, hour) => html`
                                <div
                                    class="hour-label${hour % 12 === 0 ? ' snap-target' : ''}"
                                    style="top: calc(${hour} * var(--hour-height))"
                                >
                                    <span class="indicator">
                                        ${this._renderIndicatorValue(hour)}
                                    </span>
                                </div>
                            `,
                        )}
                    </div>
                    ${datesToRender.map(
                        (date) => html`
                            <div class="day-column">
                                <slot
                                    name="timed-${date.year}-${date.month}-${date.day}"
                                ></slot>
                            </div>
                        `,
                    )}
                </div>
            </div>
        `;
    }

    private _renderIndicatorValue(hour: number) {
        return formatLocalizedTime(hour, 0, this.locale);
    }

    private _handleDayLabelClick(date: CalendarDate) {
        const event = new CustomEvent('expand', {
            detail: { date },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    /**
     * Navigate the visible window by shifting the active date by 1 day.
     * The parent's `computeWeekDisplayContext` re-centers the window around the new date.
     */
    private _handlePeekNavigate(direction: 'previous' | 'next') {
        const weekDates = this._getWeekDates();
        let targetDate: CalendarDate | undefined;

        if (direction === 'previous' && this.visibleStartIndex > 0) {
            targetDate = weekDates[this.visibleStartIndex - 1];
        } else if (direction === 'next' && this.visibleStartIndex + this.visibleLength < 7) {
            targetDate = weekDates[this.visibleStartIndex + this.visibleLength];
        }

        if (targetDate) {
            this.dispatchEvent(
                new CustomEvent('peek-navigate', {
                    detail: { date: targetDate, direction },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
    }
}
