import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { formatLocalizedTime, getLocalizedWeekdayShort } from '../lib/localization.js';
import type { FirstDayOfWeek } from '../lib/weekStartHelper.js';

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

    @property({ attribute: false })
    activeDate: CalendarDate = {
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    };

    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    private _scrollRO?: ResizeObserver;
    private _lastScrollH = 0;

    /**
     * Observe the scroll container and derive --minute-height (+ all dependent
     * tokens) so that exactly 12 hours fills the visible viewport.
     *
     * CSS custom properties resolve var() at the element where the property is
     * SET, not where it's consumed. So overriding --minute-height alone on this
     * element won't recalculate --hour-height or --day-total-height (those were
     * already resolved at the lms-calendar host). We must override every
     * derived token directly.
     *
     * Style writes are deferred to the next frame via requestAnimationFrame to
     * avoid the "ResizeObserver loop completed with undelivered notifications"
     * error that occurs when synchronous style changes trigger additional
     * layout observations within the same frame.
     */
    override firstUpdated() {
        const scrollEl = this.renderRoot?.querySelector('.main');
        if (!scrollEl) return;

        // Eager initial sync — clientHeight forces synchronous layout so
        // the first paint already uses the correct --minute-height.
        this._applyScrollHeight(scrollEl.clientHeight);

        // ResizeObserver for ongoing size changes (window resize, all-day
        // section appearing, etc.). Uses rAF to avoid the benign
        // "ResizeObserver loop completed" error.
        this._scrollRO = new ResizeObserver(([entry]) => {
            const h = entry.contentRect.height;
            if (h > 0 && Math.abs(h - this._lastScrollH) > 0.5) {
                requestAnimationFrame(() => this._applyScrollHeight(h));
            }
        });
        this._scrollRO.observe(scrollEl);
    }

    private _applyScrollHeight(h: number) {
        if (h <= 0) return;
        this._lastScrollH = h;
        const m = h / 720;
        this.style.setProperty('--minute-height', `${m}px`);
        this.style.setProperty('--hour-height', `${m * 60}px`);
        this.style.setProperty('--day-total-height', `${m * 1440}px`);
        this.style.setProperty('--half-day-height', `${h}px`);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._scrollRO?.disconnect();
    }

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

        /* Matches .week-header height so day/week scroll viewports
           are equal and the noon snap aligns across both views. */
        .day-header {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            height: var(--day-header-height, 2.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            gap: var(--day-gap, 1px);
            padding: 0 var(--day-padding, 0.5em);
            overflow: hidden;
        }

        .day-header .time-header {
            border-right: 1px solid var(--separator-light);
        }

        .day-header .day-label {
            padding: 0 0.25em;
            font-weight: var(--day-label-font-weight);
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 0.35em;
            overflow: hidden;
            /* Offset by half the time column so the label visually
               centers across the full calendar width, not just the
               content column */
            padding-right: var(--time-column-width, 4em);
        }

        .day-header .day-name {
            font-size: 0.7em;
            text-transform: uppercase;
            letter-spacing: 0.03em;
            opacity: 0.7;
        }

        .day-header .day-number {
            font-size: 0.95em;
            font-weight: var(--day-label-number-font-weight);
            line-height: 1;
        }

        .day-label.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .container {
            display: flex;
            flex: 1;
            min-height: 0;
            width: 100%;
        }

        .main {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            grid-template-rows: 1fr;
            /* 100% of .container = wrapper − day-header, matching week-scroll */
            height: 100%;
            gap: var(--day-gap, 1px);
            overflow-y: scroll;
            scroll-snap-type: y proximity;
            text-align: var(--day-text-align, center);
            /* Vertical padding gives the first/last hour labels room to
               render above/below the grid without clipping.
               Horizontal padding keeps the scrollport flush. */
            padding: 0.6em var(--day-padding, 0.5em);
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

        /* Snap at noon: first scroll stop aligns with --half-day-height */
        .hour-label.snap-target {
            scroll-snap-align: start;
        }

        .hour-label .indicator {
            position: relative;
            top: var(--indicator-top, -0.6em);
        }

        .timed-content {
            grid-column: 2;
            position: relative;
            height: var(--day-total-height);
            /* Match time-labels clipping */
            overflow: clip;
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
            flex-shrink: 0;
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

    private _isCurrentDate() {
        const today = new Date();
        return (
            this.activeDate.day === today.getDate() &&
            this.activeDate.month === today.getMonth() + 1 &&
            this.activeDate.year === today.getFullYear()
        );
    }

    private _getWeekday(): number {
        const jsDay = new Date(
            this.activeDate.year,
            this.activeDate.month - 1,
            this.activeDate.day,
        ).getDay();
        // Convert JS day (0=Sun) to Luxon weekday (1=Mon..7=Sun)
        return jsDay === 0 ? 7 : jsDay;
    }

    override render() {
        const hasAllDay = this.allDayRowCount > 0;

        const luxonWeekday = this._getWeekday();

        return html` <div class="wrapper">
            <div class="day-header">
                <div class="time-header"></div>
                <div class="day-label ${classMap({ current: this._isCurrentDate() })}">
                    <span class="day-name">${getLocalizedWeekdayShort(luxonWeekday, this.locale)}</span>
                    <span class="day-number">${this.activeDate.day}</span>
                </div>
            </div>
            ${
                hasAllDay
                    ? html`
                          <div class="all-day-wrapper">
                              <div class="all-day">
                                  <slot name="all-day" id="all-day" class="entry"></slot>
                              </div>
                          </div>
                      `
                    : nothing
            }
            <div class="container">
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
