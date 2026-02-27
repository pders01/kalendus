import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';

@customElement('lms-calendar-day')
export default class Day extends LitElement {
    @state()
    _hours = [...Array(25).keys()];

    @state()
    _hasActiveSidebar = false;

    @property({ type: Number })
    allDayRowCount = 0;

    static override styles = css`
        .wrapper {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height);
            width: 100%;
        }

        .container {
            display: flex;
            flex: 1;
            width: 100%;
        }

        .main {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            grid-template-rows: var(--calendar-grid-rows-time);
            height: var(--main-content-height);
            gap: var(--day-gap, 1px);
            overflow-y: scroll;
            text-align: var(--day-text-align, center);
            padding: var(--day-padding, 0.5em);
            position: relative;
        }

        .hour {
            display: var(--day-show-time-column, block);
            text-align: var(--hour-text-align, center);
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
        }

        .indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
        }

        .separator {
            grid-column: 2 / 3;
            border-top: var(--separator-border, 1px solid var(--separator-light));
            position: absolute;
            width: 100%;
            z-index: 0;
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
            border-bottom: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
            padding: 0.5em 0 0.5em 0;
        }

        .all-day {
            font-size: var(--day-all-day-font-size, 16px);
            margin: var(--day-all-day-margin, 0 1.25em 0 4.25em);
        }
    `;

    private _renderSeparatorMaybe(index: number, hour: number) {
        return index ? html`<div class="separator" style="grid-row: ${hour * 60}"></div>` : nothing;
    }

    private _renderIndicatorValue(hour: number) {
        return hour < 10 ? `0${hour}:00` : `${hour}:00`;
    }

    override render() {
        const hasAllDay = this.allDayRowCount > 0;
        const containerHeight = hasAllDay
            ? `calc(100% - 3.5em - ${this.allDayRowCount * 24}px)`
            : '100%';

        return html` <div class="wrapper">
            ${
                hasAllDay
                    ? html`
                      <div class="all-day-wrapper">
                          <div class="all-day">
                              <slot name="all-day" id="all-day" class="entry"></slot>
                          </div>
                      </div>
                  `
                    : html`
                      <div style="display: none;">
                          <slot name="all-day" id="all-day" class="entry"></slot>
                      </div>
                  `
            }
            <div class="container" style="height: ${containerHeight}">
                <div
                    class="main ${classMap({
                        'w-100': !this._hasActiveSidebar,
                        'w-70': this._hasActiveSidebar,
                    })}"
                >
                    ${map(
                        this._hours,
                        (hour, index) => html`
                            <div
                                class="hour"
                                style=${this._getHourIndicator(hour)}
                            >
                                <span class="indicator">
                                    ${this._renderIndicatorValue(hour)}
                                </span>
                            </div>
                            ${this._renderSeparatorMaybe(index, hour)}
                            <slot name="${hour}" class="entry"></slot>
                        `,
                    )}
                </div>
                <div
                    class="sidebar w-30"
                    ?hidden=${!this._hasActiveSidebar}
                ></div>
            </div>
        </div>`;
    }

    private _getHourIndicator(hour: number) {
        return hour !== 24
            ? `grid-row: ${(hour + 1) * 60 - 59}/${(hour + 1) * 60}`
            : 'grid-row: 1440';
    }
}
