import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { formatLocalizedTime } from '../lib/localization.js';

@customElement('lms-calendar-day')
export default class Day extends LitElement {
    @state()
    _hours = [...Array(25).keys()];

    @state()
    _hasActiveSidebar = false;

    @property({ type: Number })
    allDayRowCount = 0;

    @property({ type: String })
    locale = 'en';

    static override styles = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .wrapper {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height);
            width: 100%;
            overflow: hidden;
        }

        .container {
            display: flex;
            flex: 1;
            width: 100%;
        }

        .main {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            grid-template-rows: 1fr;
            height: var(--main-content-height);
            gap: var(--day-gap, 1px);
            overflow-y: scroll;
            text-align: var(--day-text-align, center);
            padding: var(--day-padding, 0.5em);
            position: relative;
            contain: content;
        }

        .time-labels {
            grid-column: 1;
            position: relative;
            height: var(--day-total-height);
            display: var(--day-show-time-column, block);
            border-right: var(--sidebar-border, 1px solid var(--separator-light));
        }

        .hour-label {
            position: absolute;
            left: 0;
            right: 0;
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
        }

        .hour-label .indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
        }

        .timed-content {
            grid-column: 2;
            position: relative;
            height: var(--day-total-height);
            background-image: repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent calc(var(--hour-height) - 1px),
                var(--separator-light) calc(var(--hour-height) - 1px),
                var(--separator-light) var(--hour-height)
            );
            background-size: 100% var(--hour-height);
        }

        .sidebar {
            height: 100%;
            border-left: var(--sidebar-border, 1px solid var(--separator-light));
        }

        .w-100 {
            width: 100%;
        }

        .w-70 {
            width: 70%;
        }

        .w-30 {
            width: 30%;
        }

        .w-0 {
            width: 0;
        }

        .all-day-wrapper {
            display: grid;
            grid-template-rows: 1fr;
            border-bottom: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
            /* Isolate repaint from the hour-grid scroller beneath */
            contain: paint;
        }

        .all-day {
            font-size: var(--day-all-day-font-size, 16px);
            margin: var(--day-all-day-margin, 0 1.25em 0 4.25em);
            overflow: hidden;
            min-height: 0;
            padding: 0.5em 0;
        }
    `;

    private _renderIndicatorValue(hour: number) {
        return formatLocalizedTime(hour, 0, this.locale);
    }

    override render() {
        const hasAllDay = this.allDayRowCount > 0;
        const containerHeight = hasAllDay
            ? `calc(100% - 3.5em - ${this.allDayRowCount * 24}px)`
            : '100%';

        return html` <div class="wrapper">
            ${hasAllDay ? html`
            <div class="all-day-wrapper">
                <div class="all-day">
                    <slot name="all-day" id="all-day" class="entry"></slot>
                </div>
            </div>
            ` : nothing}
            <div class="container" style="height: ${containerHeight}">
                <div
                    class="main ${classMap({
                        'w-100': !this._hasActiveSidebar,
                        'w-70': this._hasActiveSidebar,
                    })}"
                >
                    <div class="time-labels">
                        ${this._hours.map(
                            (hour) => html`
                                <div
                                    class="hour-label"
                                    style="top: calc(${hour} * var(--hour-height))"
                                >
                                    <span class="indicator">
                                        ${this._renderIndicatorValue(hour)}
                                    </span>
                                </div>
                            `,
                        )}
                    </div>
                    <div class="timed-content">
                        <slot name="timed"></slot>
                    </div>
                </div>
                <div
                    class="sidebar w-30"
                    ?hidden=${!this._hasActiveSidebar}
                ></div>
            </div>
        </div>`;
    }
}
