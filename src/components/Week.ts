import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { getLocalizedWeekdayShort } from '../lib/localization.js';
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
            display: grid;
            grid-template-rows: 1fr;
            transition: grid-template-rows 0.2s ease;
            border-bottom: var(--separator-border);
            background: var(--background-color);
            z-index: 2;
            position: relative;
        }

        .all-day-wrapper.collapsed {
            grid-template-rows: 0fr;
            overflow: hidden;
            border-bottom: none;
        }

        .all-day-wrapper.collapsed .all-day-container {
            padding: 0;
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
    `;

    override connectedCallback() {
        super.connectedCallback();
    }

    private _getWeekDates(): CalendarDate[] {
        return getWeekDates(this.activeDate, this.firstDayOfWeek);
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
        const weekdayOrder = getWeekdayOrder(this.firstDayOfWeek);
        const hasAllDay = this.allDayRowCount > 0;
        const allDayHeight = hasAllDay
            ? Math.max(2.5, this.allDayRowCount * 2) + 1
            : 0;
        const weekContentHeight = hasAllDay
            ? `calc(var(--main-content-height) - ${allDayHeight}em)`
            : 'var(--main-content-height)';

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
                        `,
                    )}
                </div>

                <!-- All-day events section -->
                <div
                    class="all-day-wrapper ${classMap({
                        collapsed: !hasAllDay,
                    })}"
                >
                    <div class="all-day-container">
                        <div class="all-day-time-header">${getMessages(this.locale).allDay}</div>
                        ${weekDates.map(
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
                <div class="week-content" style="height: ${weekContentHeight}">
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
