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
            border-right: var(
                --sidebar-border,
                1px solid var(--separator-light)
            );
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
            border-right: var(
                --sidebar-border,
                1px solid var(--separator-light)
            );
            position: relative;
        }

        .day-column:last-child {
            border-right: none;
        }

        .hour-separator {
            grid-column: 2 / 3;
            border-top: var(
                --separator-border,
                1px solid var(--separator-light)
            );
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .all-day-area {
            font-size: var(--day-all-day-font-size, 16px);
            margin: 0;
            padding: 0.25em;
            z-index: 1;
            position: relative;
            overflow: hidden;
            width: 100%;
            box-sizing: border-box;
        }

        .hour-slot-container {
            overflow: hidden;
        }
    `;

    override connectedCallback() {
        super.connectedCallback();
        // Note: open-menu events from entry components naturally bubble up
        // No need to manually forward them as it causes infinite recursion
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
                                @click=${() => this._handleDayLabelClick(date)}
                            >
                                <div>
                                    ${getLocalizedWeekdayShort(index + 1)}
                                </div>
                                <div>${date.day}</div>
                            </div>
                        `,
                    )}
                </div>
                <div class="week-content">
                    <!-- Hour indicators -->
                    ${Array.from({ length: 25 }).map(
                        (_, hour) => html`
                            <div
                                class="hour-indicator"
                                style="grid-column: 1; grid-row: ${hour * 60 +
                                1};"
                            >
                                ${this._renderIndicatorValue(hour)}
                            </div>
                        `,
                    )}

                    <!-- Hour separators -->
                    ${Array.from({ length: 25 }).map(
                        (_, hour) => html`
                            ${hour > 0
                                ? html`
                                      <div
                                          class="hour-separator"
                                          style="grid-column: 2 / -1; grid-row: ${hour *
                                          60};"
                                      ></div>
                                  `
                                : ''}
                        `,
                    )}

                    <!-- All-day area for each day -->
                    ${weekDates.map(
                        (date, dayIndex) => html`
                            <div
                                class="all-day-area"
                                style="grid-column: ${dayIndex +
                                2}; grid-row: 1 / 60;"
                            >
                                <slot
                                    name="all-day-${date.year}-${date.month}-${date.day}"
                                ></slot>
                            </div>
                        `,
                    )}

                    <!-- Hour slots for each day -->
                    ${weekDates.map(
                        (date, dayIndex) => html`
                            ${Array.from({ length: 25 }).map(
                                (_, hour) => html`
                                    <div
                                        class="hour-slot-container"
                                        style="grid-column: ${dayIndex +
                                        2}; grid-row: ${hour * 60 +
                                        1} / ${(hour + 1) * 60 +
                                        1}; position: relative;"
                                    >
                                        <slot
                                            name="${date.year}-${date.month}-${date.day}-${hour}"
                                            data-debug="Day ${dayIndex +
                                            1} (${date.month}/${date.day}) Hour ${hour}"
                                        ></slot>
                                    </div>
                                `,
                            )}
                        `,
                    )}
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

    private _handleDayColumnClick(e: Event, _date: CalendarDate) {
        // Handle clicks on day columns - could be used for day expansion or other interactions
        // For now, just prevent event bubbling if needed
        e.stopPropagation();
    }
}
