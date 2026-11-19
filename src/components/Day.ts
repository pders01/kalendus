import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { formatLocalizedDate, getLocalizedWeekdayShort } from '../lib/localization.js';
import { getMessages, normalizeLocale } from '../lib/messages.js';
import type { FirstDayOfWeek } from '../lib/weekStartHelper.js';
import { CurrentDateController } from './CurrentDateController.js';
import {
    TimeGridSizingController,
    assignLegacyAllDayRows,
    renderTimeLabels,
    timeGridStyles,
} from './TimeGridSizingController.js';

@customElement('lms-calendar-day')
export default class Day extends LitElement {
    private _today = new CurrentDateController(this);

    @state()
    _hasActiveSidebar = false;

    @property({ type: Number })
    allDayRowCount = 0;

    @property({ type: Boolean, attribute: 'scroll-time-grid' })
    scrollTimeGrid = false;

    @property({ type: String })
    locale = 'en';

    @property({ type: Number })
    localeVersion = 0;

    @property({ attribute: false })
    activeDate: CalendarDate = {
        day: new Date().getDate(),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
    };

    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    constructor() {
        super();
        new TimeGridSizingController(this, '.main');
    }

    /** Root drill-down focus destination; does not add a permanent tab stop. */
    public async focusDate(_date?: CalendarDate) {
        await this.updateComplete;
        this.renderRoot.querySelector<HTMLElement>('.day-label')?.focus();
    }

    private static layoutStyles = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
            min-height: 0;
            overflow: var(--_time-grid-overflow, hidden);
        }

        .wrapper {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height, 100%);
            width: 100%;
            overflow: var(--_time-grid-overflow, hidden);
        }

        /* Classic scrollbars must reserve the same inline space in all three grids. */
        .day-header,
        .all-day-wrapper,
        .main {
            scrollbar-gutter: stable;
        }

        /* Match .week-header so day/week have equal scroll viewports. */
        .day-header {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            min-block-size: var(--day-header-height, 2.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            gap: var(--day-gap, 1px);
            padding: 0 var(--day-padding, 0.5em);
            overflow: hidden;
        }

        .day-header .time-header {
            border-inline-end: 1px solid var(--separator-light);
        }

        .day-header .day-label {
            margin: 0;
            font-size: inherit;
            min-block-size: 24px;
            padding: 0 0.25em;
            font-weight: var(--day-label-font-weight);
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            align-items: baseline;
            align-content: center;
            gap: 0.1em 0.35em;
            padding-block: 0.15em;
            overflow: hidden;
            /* Offset by half the time column so the label visually
               centers across the full calendar width, not just the
               content column */
            padding-inline-end: var(--time-column-width, 4em);
        }

        .day-header .day-name {
            font-size: 0.7em;
            text-transform: uppercase;
            letter-spacing: 0.03em;
        }

        .day-header .day-number {
            font-size: 0.95em;
            font-weight: var(--day-label-number-font-weight);
            line-height: 1.65;
            min-inline-size: 1.65em;
        }

        .day-label.current .day-number {
            border-radius: 50%;
            background: var(--current-day-bg, Highlight);
            color: var(--current-day-color, HighlightText);
            font-weight: var(--current-day-font-weight, bold);
        }

        .day-label.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .container {
            display: flex;
            flex: 1;
            min-block-size: var(--_timeline-min-height, 0px);
            width: 100%;
        }

        .main {
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            height: 100%;
            text-align: var(--day-text-align, center);
        }

        .time-labels {
            display: var(--day-show-time-column, block);
        }

        .timed-content {
            grid-column: 2;
        }

        .sidebar {
            height: 100%;
            border-inline-start: var(--sidebar-border, 1px solid var(--separator-light));
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

        .all-day-wrapper {
            display: block;
            max-block-size: min(35%, var(--all-day-max-height, 12rem));
            overflow-y: auto;
            overscroll-behavior: contain;
            flex-shrink: 0;
            border-bottom: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
            /* This bounded scroller retains every all-day entry. */
        }

        .all-day-container {
            display: grid;
            grid-template-columns: var(--day-grid-columns, var(--calendar-grid-columns-day));
            gap: var(--day-gap, 1px);
            padding-inline: var(--day-padding, 0.5em);
        }
        .all-day-time-header {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
            font-weight: var(--day-label-font-weight);
            border-inline-end: var(--sidebar-border, 1px solid var(--separator-light));
            overflow-wrap: anywhere;
        }
        .all-day {
            font-size: var(--day-all-day-font-size, 16px);
            margin-block: 0;
            margin-inline-start: var(--day-all-day-margin-inline-start, 0);
            margin-inline-end: var(--day-all-day-margin-inline-end, 0);
            min-height: 0;
            padding: 0.5em 0;
            display: grid;
            grid-template-rows: repeat(
                var(--all-day-rows, 1),
                var(--all-day-row-height, max(24px, 1.5rem))
            );
            grid-auto-rows: var(--all-day-row-height, max(24px, 1.5rem));
            gap: 4px;
        }
        .all-day slot {
            display: contents;
        }
        .all-day ::slotted(lms-calendar-entry) {
            grid-column: 1 !important;
            grid-row: calc(var(--all-day-row, var(--legacy-all-day-row, 0)) + 1) !important;
            position: relative !important;
            min-height: 24px !important;
            height: var(--all-day-row-height, max(24px, 1.5rem)) !important;
            margin-block: 0 !important;
        }
        .main:focus-visible,
        .all-day-wrapper:focus-visible,
        .day-label:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: -2px;
        }
        @media (forced-colors: active) {
            .main:focus-visible,
            .all-day-wrapper:focus-visible,
            .day-label:focus-visible {
                outline-color: Highlight;
            }
        }
    `;

    static override styles = [timeGridStyles, Day.layoutStyles];

    private _isCurrentDate() {
        const today = this._today.date;
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
                <h2 id="day-label" class="day-label ${classMap({ current: this._isCurrentDate() })}" tabindex="-1" aria-label=${formatLocalizedDate(this.activeDate.day, this.activeDate.month, this.activeDate.year, this.locale)} aria-current=${this._isCurrentDate() ? 'date' : 'false'}>
                    <span class="day-name">${getLocalizedWeekdayShort(luxonWeekday, this.locale)}</span>
                    <span class="day-number">${new Intl.NumberFormat(normalizeLocale(this.locale)).format(this.activeDate.day)}</span>
                </h2>
            </div>
            ${
                hasAllDay
                    ? html`
                          <div class="all-day-wrapper" tabindex="0" role="region" aria-labelledby="all-day-label">
                              <div class="all-day-container">
                                  <div class="all-day-time-header" id="all-day-label">${getMessages(this.locale).allDay}</div>
                                  <div class="all-day" style="--all-day-rows: ${Math.max(1, this.allDayRowCount)}">
                                      <slot name="all-day" id="all-day" class="entry" @slotchange=${assignLegacyAllDayRows}></slot>
                                  </div>
                              </div>
                          </div>
                      `
                    : nothing
            }
            <div class="container">
                <div
                    class="main timeline ${classMap({
                        'w-100': !this._hasActiveSidebar,
                        'w-70': this._hasActiveSidebar,
                    })}"
                    tabindex="0" role="region" aria-labelledby="day-label"
                >
                    ${renderTimeLabels(this.locale)}
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
