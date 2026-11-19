import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { allDaySlotName, dateSlotKey, timedSlotName } from '../lib/entrySlots.js';
import { formatLocalizedDate, getLocalizedWeekdayShort } from '../lib/localization.js';
import { getMessages, normalizeLocale } from '../lib/messages.js';
import { type FirstDayOfWeek, getWeekDates, getWeekdayOrder } from '../lib/weekStartHelper.js';
import './Day.js';
import { CurrentDateController } from './CurrentDateController.js';
import {
    TimeGridSizingController,
    assignLegacyAllDayRows,
    renderTimeLabels,
    timeGridStyles,
} from './TimeGridSizingController.js';

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

    @property({ type: Boolean, attribute: 'scroll-time-grid' })
    scrollTimeGrid = false;

    @property({ attribute: false })
    allDaySummary = false;

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

    private static layoutStyles = css`
        :host {
            display: block;
            height: 100%;
            width: 100%;
        }

        .week-container {
            display: flex;
            flex-direction: column;
            height: var(--view-container-height, 100%);
            overflow: var(--_time-grid-overflow, clip);
            position: relative;
        }

        /* Classic scrollbars must reserve the same inline space in all three grids. */
        .week-header,
        .all-day-wrapper,
        .week-scroll {
            scrollbar-gutter: stable;
        }

        .week-header {
            display: grid;
            grid-template-columns: var(--calendar-grid-columns-week);
            min-block-size: var(--day-header-height, 2.5em);
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
            flex-wrap: wrap;
            justify-content: center;
            align-items: baseline;
            align-content: center;
            gap: 0.1em 0.35em;
            padding-block: 0.15em;
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
            line-height: 1.65;
            min-inline-size: 1.65em;
        }

        .day-label.current .day-number {
            border-radius: 50%;
            background: var(--current-day-bg, Highlight);
            color: var(--current-day-color, HighlightText);
            font-weight: var(--current-day-font-weight, bold);
        }

        .day-label:hover,
        .day-label.current:hover {
            background-color: var(--hover-bg);
            color: var(--hover-color, var(--text-color, CanvasText));
        }

        .day-label:focus-visible {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: -2px;
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
            grid-template-columns: var(--calendar-grid-columns-week);
            min-block-size: var(--_timeline-min-height, 0px);
        }

        .time-labels {
            background: var(--background-color, white);
        }

        .day-column {
            border-inline-end: var(--sidebar-border, 1px solid var(--separator-light));
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
            --_span-gap: var(--day-gap, 1px);
            position: relative;
            min-height: 2em;
            padding: 0.25em 0;
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: repeat(
                var(--all-day-rows, 1),
                var(--all-day-row-height, max(24px, 1.5rem))
            );
            grid-auto-rows: var(--all-day-row-height, max(24px, 1.5rem));
            gap: 4px;
        }
        .all-day-wrapper[data-summary] .all-day-day-column {
            grid-template-rows: auto;
            grid-auto-rows: auto;
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

        /* Legacy segmented slots on standalone Week components. */
        .all-day-day-column ::slotted(:is(.first-day, .middle-day)) {
            border-start-end-radius: 0 !important;
            border-end-end-radius: 0 !important;
        }
        .all-day-day-column ::slotted(:is(.middle-day, .last-day)) {
            border-start-start-radius: 0 !important;
            border-end-start-radius: 0 !important;
            border-inline-start: var(--multi-day-separator) !important;
            margin-inline-start: -2px !important;
        }

        .all-day-time-header {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--hour-indicator-font-size);
            color: var(--hour-indicator-color);
            font-weight: var(--day-label-font-weight);
            border-inline-end: var(--separator-border);
            overflow-wrap: anywhere;
        }

        .peek-indicators {
            box-sizing: border-box;
            container: week-pager / inline-size;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) auto;
            align-items: center;
            gap: 0.35em 0.75em;
            padding: 0.35em var(--day-padding, 0.5em);
            flex-shrink: 0;
            border-bottom: var(--separator-border);
            background: var(--background-color, Canvas);
        }

        /* Only the navigator stays inside the visible pane; date headers,
           all-day events and times still pan together at the wider grid width. */
        @container week-viewport (min-width: 0px) {
            .peek-indicators {
                position: sticky;
                inset-inline-start: 0;
                align-self: start;
                inline-size: min(100%, 100cqi);
            }
        }
        .window-context {
            min-inline-size: 0;
            text-align: center;
            font-size: 0.8em;
            line-height: 1.4;
        }

        .window-range,
        .window-position {
            display: block;
            overflow-wrap: anywhere;
        }

        .window-position {
            font-variant-numeric: tabular-nums;
        }

        @container week-viewport (inline-size < 28rem) or (block-size < 16rem) {
            .peek-indicators {
                padding-block: 0;
            }
        }
        /* The weekday headings already show these dates. In short embeds,
           keep the labels on the controls but give the extra line to the timeline. */
        @container week-viewport (block-size < 16rem) {
            .window-range {
                display: none;
            }
            .peek-indicator {
                min-inline-size: 44px;
                min-block-size: 44px;
            }
        }
        @container week-pager (width < 28rem) {
            .window-range,
            .peek-caption {
                display: none;
            }
            .window-position {
                font-weight: 600;
            }
            button.peek-indicator {
                min-inline-size: 44px;
                min-block-size: 44px;
                padding: 0;
                border-color: transparent;
            }
            .peek-glyph {
                font-size: 1.5em;
            }
        }

        .peek-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            overflow-wrap: anywhere;
            gap: 0.25em;
            color: var(--text-color, CanvasText);
            font-size: 0.8em;
            cursor: pointer;
            user-select: none;
            padding: 0.25em 0.5em;
            border: 1px solid var(--separator-light, currentColor);
            border-radius: var(--border-radius-sm);
            transition:
                background-color var(--transition-speed) ease,
                color var(--transition-speed) ease;
        }

        .peek-indicator:not(:disabled):hover,
        .peek-indicator:not(:disabled):active {
            background-color: var(--hover-bg);
            color: var(--hover-color, var(--text-color, CanvasText));
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
        .week-scroll:focus-visible,
        .all-day-wrapper:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: -2px;
        }
        @media (forced-colors: active) {
            button:focus-visible,
            .week-scroll:focus-visible,
            .all-day-wrapper:focus-visible {
                outline-color: Highlight;
            }
        }
        .peek-indicator:disabled {
            cursor: default;
            opacity: 0.55;
        }
        @media (pointer: coarse) {
            button {
                min-inline-size: 44px;
                min-block-size: 44px;
            }
        }
    `;

    static override styles = [timeGridStyles, Week.layoutStyles];

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
        new TimeGridSizingController(this, '.week-scroll');
    }

    /** Root drill-down/return focus destination. */
    public async focusDate(date: CalendarDate = this.activeDate) {
        await this.updateComplete;
        this.renderRoot
            .querySelector<HTMLButtonElement>(`button[data-date="${dateSlotKey(date)}"]`)
            ?.focus();
    }

    override render(): TemplateResult<1> {
        const datesToRender = this._getDatesToRender();
        const weekdayOrder = this._getVisibleWeekdayOrder();
        const hasAllDay = this.allDayRowCount > 0;
        const msg = getMessages(this.locale);
        const number = new Intl.NumberFormat(normalizeLocale(this.locale));
        const dateLabel = (date: CalendarDate) =>
            formatLocalizedDate(date.day, date.month, date.year, this.locale);
        const firstDate = datesToRender[0];
        const lastDate = datesToRender[datesToRender.length - 1];
        const windowDates =
            firstDate && lastDate ? `${dateLabel(firstDate)} – ${dateLabel(lastDate)}` : '';
        const windowSummary =
            firstDate && lastDate
                ? `${getLocalizedWeekdayShort(weekdayOrder[0], this.locale)} ${number.format(firstDate.day)} – ${getLocalizedWeekdayShort(weekdayOrder[datesToRender.length - 1], this.locale)} ${number.format(lastDate.day)}`
                : '';
        const firstPosition = number.format(this.visibleStartIndex + 1);
        const visiblePositions =
            datesToRender.length === 1
                ? firstPosition
                : `${firstPosition}–${number.format(this.visibleStartIndex + datesToRender.length)}`;
        const windowPosition = `${visiblePositions}/${number.format(7)}`;

        const showLeftPeek = this._isCondensed && this.visibleStartIndex > 0;
        const showRightPeek = this._isCondensed && this.visibleStartIndex + this.visibleLength < 7;

        return html`
            <div class="week-container">
                <div class="week-header">
                    <div class="time-header"></div>
                    ${datesToRender.map((date, index) => {
                        return html`
                            <button type="button"
                                data-date=${dateSlotKey(date)}
                                class="day-label ${classMap({
                                    current: this._isCurrentDate(date),
                                })}"
                                aria-current=${this._isCurrentDate(date) ? 'date' : 'false'}
                                aria-label="${msg.switchToDayView} ${dateLabel(date)}"
                                @click=${() => this._handleDayLabelClick(date)}
                            >
                                <span class="day-name">${getLocalizedWeekdayShort(weekdayOrder[index], this.locale)}</span>
                                <span class="day-number">${number.format(date.day)}</span>
                            </button>
                        `;
                    })}
                </div>

                ${
                    this._isCondensed
                        ? html`
                              <div class="peek-indicators" role="group" aria-labelledby="window-range window-position">
                                  <button type="button"
                                      class="peek-indicator"
                                      ?disabled=${!showLeftPeek}
                                      aria-label="${msg.previous} · ${msg.showEarlierDays} · ${windowDates}"
                                      @click=${() => this._handlePeekNavigate('previous')}
                                  ><span class="peek-glyph" aria-hidden="true">‹</span><bdi class="peek-caption">${msg.previous}</bdi></button>
                                  <div class="window-context">
                                      <span class="window-range" id="window-range">${windowSummary}</span>
                                      <bdi class="window-position" id="window-position">${windowPosition}</bdi>
                                  </div>
                                  <button type="button"
                                      class="peek-indicator"
                                      ?disabled=${!showRightPeek}
                                      aria-label="${msg.next} · ${msg.showLaterDays} · ${windowDates}"
                                      @click=${() => this._handlePeekNavigate('next')}
                                  ><bdi class="peek-caption">${msg.next}</bdi><span class="peek-glyph" aria-hidden="true">›</span></button>
                              </div>
                          `
                        : nothing
                }

                <!-- All-day events section -->
                ${
                    hasAllDay
                        ? html`
                <div class="all-day-wrapper" ?data-summary=${this.allDaySummary} tabindex=${this.allDaySummary ? '-1' : '0'} role="region" aria-labelledby="all-day-label">
                    <div class="all-day-container" style="--all-day-rows: ${Math.max(1, this.allDayRowCount)}">
                        <div class="all-day-time-header" id="all-day-label">${msg.allDay}</div>
                        ${datesToRender.map(
                            (date) => html`
                                <div class="all-day-day-column">
                                    <slot
                                        name=${allDaySlotName(date)}
                                        @slotchange=${this.allDaySummary ? nothing : assignLegacyAllDayRows}
                                    ></slot>
                                </div>
                            `,
                        )}
                    </div>
                </div>
                `
                        : nothing
                }
                <div class="week-scroll timeline" tabindex="0" role="region" aria-label=${windowDates}>
                    ${renderTimeLabels(this.locale)}
                    ${datesToRender.map(
                        (date) => html`
                            <div class="day-column">
                                <slot
                                    name=${timedSlotName(date)}
                                ></slot>
                            </div>
                        `,
                    )}
                </div>
            </div>
        `;
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
