import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { formatLocalizedTime, getLocalizedWeekdayShort } from '../lib/localization.js';
import { getMessages } from '../lib/messages.js';
import { type FirstDayOfWeek, getWeekDates, getWeekdayOrder } from '../lib/weekStartHelper.js';
import './Day.js';

@customElement('lms-calendar-week')
export default class Week extends LitElement {
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
            height: var(--view-container-height);
            overflow: hidden;
            position: relative;
        }

        .week-header {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            height: var(--day-header-height, 3.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            position: relative;
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
            gap: var(--day-label-gap, 0.15em);
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .day-name {
            font-size: var(--day-label-name-font-size, 0.75em);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            opacity: 0.7;
        }

        .day-number {
            font-size: var(--day-label-number-font-size, 1.125em);
            font-weight: var(--day-label-number-font-weight, 600);
            line-height: 1;
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

        .week-scroll {
            flex: 1;
            overflow-y: auto;
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            grid-template-rows: 1fr;
            gap: var(--day-gap, 1px);
            padding: var(--day-padding, 0.5em);
            min-height: 0;
            position: relative;
            contain: content;
        }

        .time-labels {
            grid-column: 1;
            position: relative;
            height: var(--day-total-height);
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
            background: var(--background-color, white);
        }

        .hour-label {
            position: absolute;
            left: 0;
            right: 0;
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
            transform: translateY(var(--indicator-top, -0.55em));
            pointer-events: none;
        }

        .day-column {
            position: relative;
            height: var(--day-total-height);
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
            background-image: repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent calc(var(--hour-height) - 1px),
                var(--separator-light) calc(var(--hour-height) - 1px),
                var(--separator-light) var(--hour-height)
            );
            background-size: 100% var(--hour-height);
        }

        .day-column:last-child {
            border-right: none;
        }

        /* All-day events section */
        .all-day-wrapper {
            display: grid;
            grid-template-rows: 1fr;
            border-bottom: var(--separator-border);
            background: var(--background-color);
            z-index: 2;
            position: relative;
            /* Isolate repaint from the hour-grid scroller beneath */
            contain: paint;
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
            overflow: hidden;
        }

        /* Stack all-day events vertically with consistent positioning */
        .all-day-container .all-day-day-column ::slotted(lms-calendar-entry) {
            position: relative !important;
            display: block !important;
            margin-bottom: 0.25em !important;
            z-index: var(--entry-z-index, 1) !important;
        }

        /* Enhanced multi-day spanning styles with consistent ordering */
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

        /* Peek indicators for condensed view */
        .peek-indicators {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 0.25em;
            height: 1.5em;
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
            border-radius: var(--border-radius-sm, 4px);
            transition:
                background-color 0.15s ease,
                color 0.15s ease;
        }

        .peek-indicator:hover {
            background-color: var(--separator-light, rgba(0, 0, 0, 0.06));
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
        }

        .peek-indicator:active {
            background-color: var(--separator-mid, rgba(0, 0, 0, 0.12));
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
        const today = new Date();
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

    override render() {
        const datesToRender = this._getDatesToRender();
        const weekdayOrder = this._getVisibleWeekdayOrder();
        const hasAllDay = this.allDayRowCount > 0;
        const allDayHeight = hasAllDay ? Math.max(2.5, this.allDayRowCount * 2) + 1 : 0;
        const weekContentHeight = hasAllDay
            ? `calc(var(--main-content-height) - ${allDayHeight}em)`
            : 'var(--main-content-height)';

        const showLeftPeek = this._isCondensed && this.visibleStartIndex > 0;
        const showRightPeek = this._isCondensed && this.visibleStartIndex + this.visibleLength < 7;

        return html`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${datesToRender.map((date, index) => {
                        const msg = getMessages(this.locale);
                        return html`
                            <div
                                class="day-label ${classMap({
                                    current: this._isCurrentDate(date),
                                })}"
                                tabindex="0"
                                role="button"
                                aria-label="${msg.switchToDayView} ${getLocalizedWeekdayShort(
                                    weekdayOrder[index],
                                    this.locale,
                                )}, ${date.day}"
                                @click=${() => this._handleDayLabelClick(date)}
                                @keydown=${(e: KeyboardEvent) =>
                                    this._handleDayLabelKeydown(e, date)}
                            >
                                <span class="day-name">${getLocalizedWeekdayShort(weekdayOrder[index], this.locale)}</span>
                                <span class="day-number">${date.day}</span>
                            </div>
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
                    <span
                        class="peek-indicator ${classMap({ 'peek-indicator--hidden': !showLeftPeek })}"
                        role="button"
                        tabindex=${showLeftPeek ? '0' : '-1'}
                        aria-label="${msg.showEarlierDays}"
                        @click=${() => this._handlePeekNavigate('previous')}
                        @keydown=${(e: KeyboardEvent) => this._handlePeekKeydown(e, 'previous')}
                    >\u2039 ${msg.more}</span>
                    <span
                        class="peek-indicator ${classMap({ 'peek-indicator--hidden': !showRightPeek })}"
                        role="button"
                        tabindex=${showRightPeek ? '0' : '-1'}
                        aria-label="${msg.showLaterDays}"
                        @click=${() => this._handlePeekNavigate('next')}
                        @keydown=${(e: KeyboardEvent) => this._handlePeekKeydown(e, 'next')}
                    >${msg.more} \u203A</span>
                </div>
                `;
                          })()
                        : nothing
                }

                <!-- All-day events section -->
                ${
                    hasAllDay
                        ? html`
                <div class="all-day-wrapper">
                    <div class="all-day-container">
                        <div class="all-day-time-header">${getMessages(this.locale).allDay}</div>
                        ${datesToRender.map(
                            (date) => html`
                                <div class="all-day-day-column">
                                    <slot
                                        name="all-day-${date.year}-${date.month}-${date.day}"
                                    ></slot>
                                </div>
                            `,
                        )}
                    </div>
                </div>
                `
                        : nothing
                }
                <div class="week-scroll" style="height: ${weekContentHeight}">
                    <div class="time-labels">
                        ${Array.from({ length: 25 }).map(
                            (_, hour) => html`
                                <div
                                    class="hour-label"
                                    style="top: calc(${hour} * var(--hour-height))"
                                >
                                    ${this._renderIndicatorValue(hour)}
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

    private _handleDayLabelKeydown(e: KeyboardEvent, date: CalendarDate) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handleDayLabelClick(date);
        }
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

    private _handlePeekKeydown(e: KeyboardEvent, direction: 'previous' | 'next') {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this._handlePeekNavigate(direction);
        }
    }
}
