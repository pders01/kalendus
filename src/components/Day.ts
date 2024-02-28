import { LitElement, css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';

@customElement('lms-calendar-day')
export default class Day extends LitElement {
    @state()
    _hours = [...Array(25).keys()];

    @state()
    _hasActiveSidebar = false;

    @query('.container') container!: HTMLDivElement;

    static override styles = css`
        .container {
            display: flex;
            /* Header: 3.5em */
            height: calc(100% - 3.5em);
            width: 100%;
        }

        .main {
            display: grid;
            grid-template-columns: 4em 1fr;
            grid-template-rows: repeat(1440, 1fr);
            height: calc(100% - 1em);
            gap: 1px;
            overflow-y: scroll;
            text-align: center;
            padding: 0.5em;
            position: relative;
        }

        .hour {
            text-align: center;
        }

        .indicator {
            position: relative;
            top: -0.6em;
        }

        .separator {
            grid-column: 2 / 3;
            border-top: 1px solid var(--separator-light);
            position: absolute;
            width: 100%;
            z-index: 0;
        }

        .sidebar {
            height: 100%;
            border-left: 1px solid var(--separator-light);
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

        .all-day {
            font-size: 16px;
            margin: 0 1.25em 0 4.25em;
        }
    `;

    private _renderSeparatorMaybe(index: number, hour: number) {
        return index
            ? html`<div class="separator" style="grid-row: ${hour * 60}"></div>`
            : nothing;
    }

    private _renderIndicatorValue(hour: number) {
        return hour < 10 ? `0${hour}:00` : `${hour}:00`;
    }

    override render() {
        return html` <div class="all-day">
                <slot
                    name="all-day"
                    id="all-day"
                    class="entry"
                    @slotchange=${this._handleSlotChange}
                ></slot>
            </div>
            <div class="container">
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
            </div>`;
    }

    private _handleSlotChange(e: Event) {
        const target = e.target;
        if (!(target instanceof HTMLSlotElement)) {
            return;
        }

        const childNodes = target.assignedElements({
            flatten: true,
        }) as Array<HTMLElement>;

        this.container.style.height = `calc(100% - 3.5em - ${
            childNodes.length * 24
        }px)`;
    }

    private _getHourIndicator(hour: number) {
        return hour !== 24
            ? `grid-row: ${(hour + 1) * 60 - 59}/${(hour + 1) * 60}`
            : 'grid-row: 1440';
    }
}
