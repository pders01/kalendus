import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { DateTime } from 'luxon';

import { getLocalizedMonth, getLocalizedWeekdayShort } from '../lib/localization.js';
import { getMessages } from '../lib/messages.js';
import { getFirstDayOffset, getWeekdayOrder } from '../lib/weekStartHelper.js';
import type { FirstDayOfWeek } from '../lib/weekStartHelper.js';
import { CurrentDateController } from './CurrentDateController.js';
import { dateKey, keyboardDate } from './dateNavigation.js';

export type DensityMode = 'dot' | 'heatmap' | 'count';
export type DrillTarget = 'day' | 'week' | 'month';

@customElement('lms-calendar-year')
export default class Year extends LitElement {
    @property({ type: Object })
    activeDate: CalendarDate = (() => {
        const today = new Date();
        return { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() };
    })();

    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    @property({ type: String })
    locale = 'en';

    @property({ type: Number })
    localeVersion = 0;

    @property({ type: Object })
    entrySumByDay: Record<string, number> = {};

    @property({ type: String })
    drillTarget: DrillTarget = 'month';

    @property({ type: String })
    densityMode: DensityMode = 'dot';

    private _today = new CurrentDateController(this);
    @state() private _focusedDate?: CalendarDate;
    @state() private _displayYear?: number;
    @state() private _weekFocus?: string;

    override willUpdate(changed: Map<string, unknown>) {
        if (changed.has('activeDate')) {
            this._displayYear = undefined;
            this._focusedDate = this.activeDate;
            this._weekFocus = undefined;
        }
    }

    static override styles = css`
        :host {
            display: block;
            block-size: 100%;
            min-block-size: 0;
            contain: layout style;
            container-type: inline-size;
        }

        .scroll-container {
            block-size: 100%;
            overflow: auto;
            scroll-padding-block: 1em;
        }

        .year-grid {
            display: grid;
            --_month-min-inline: min(
                100%,
                calc(max(24px, var(--year-cw-width, 1.8em)) + 7 * max(24px, var(--year-cell-size, 1.8em)))
            );
            grid-template-columns: repeat(
                var(--year-grid-columns, auto-fit),
                minmax(var(--_month-min-inline), 1fr)
            );
            /* Content-sized rows keep this an overview, not two months per page. */
            align-items: start;
            gap: 1.25em 1em;
            padding: 1em;
        }

        /* Container queries — respond to component width, not viewport */
        /* Font-relative breakpoints leave room for eight usable targets per
           month, including when the embedding calendar enlarges its text. */
        @container (width < 60em) {
            .year-grid {
                grid-template-columns: repeat(var(--year-grid-columns-tablet, 2), minmax(0, 1fr));
            }
        }

        @container (width < 40em) {
            .year-grid {
                grid-template-columns: repeat(var(--year-grid-columns-mobile, 1), minmax(0, 1fr));
                gap: 1em 0.75em;
                padding: 0.75em;
            }
        }

        .mini-month {
            display: flex;
            flex-direction: column;
            gap: 0.15em;
            min-inline-size: 0;
            /* Retain access for intentionally oversized consumer cell tokens. */
            overflow-x: auto;
        }

        .month-label {
            font-size: var(--year-month-label-font-size, 0.875em);
            font-weight: var(--month-label-font-weight);
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            cursor: pointer;
            padding: 0.3em 0;
            border: none;
            background: none;
            text-align: start;
            border-radius: 0;
            font-family: inherit;
            border-bottom: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
            margin-bottom: 0.15em;
        }

        .month-label:hover {
            color: var(--year-month-label-hover-color);
        }

        .weekday-header {
            display: grid;
            grid-template-columns: max(24px, var(--year-cw-width, 1.8em)) repeat(
                    7,
                    minmax(max(24px, var(--year-cell-size, 1.8em)), 1fr)
                );
            text-align: center;
        }

        .weekday-header span {
            font-size: 0.75em;
            color: var(--header-text-color, CanvasText);
            padding: 0.2em 0;
            font-weight: var(--year-weekday-font-weight);
            overflow-wrap: anywhere;
        }

        .day-grid {
            display: block;
        }
        .day-row {
            display: grid;
            grid-template-columns: max(24px, var(--year-cw-width, 1.8em)) repeat(
                    7,
                    minmax(max(24px, var(--year-cell-size, 1.8em)), 1fr)
                );
            grid-auto-rows: minmax(24px, auto);
            padding-block-end: 0.1em;
            justify-items: center;
            align-items: center;
        }

        /* Only count mode places labels outside the date target. */
        .year-grid[data-density-mode='count'] .day-row {
            padding-block-end: 0.4em;
        }

        .cw-label {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: max(0.75em, var(--year-cw-font-size, 0.75em));
            color: var(--year-cw-color, var(--header-text-color, CanvasText));
            cursor: pointer;
            border: none;
            background: none;
            border-radius: var(--border-radius-sm);
            font-family: inherit;
            padding: 0;
            line-height: 1;
        }

        .cw-label:hover {
            color: var(--cw-hover-color);
            background: var(--cw-hover-bg);
        }

        .day-cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: var(--year-day-font-size, 0.8em);
            border: none;
            background: none;
            border-radius: var(--year-day-cell-border-radius);
            cursor: pointer;
            position: relative;
            inline-size: max(24px, var(--year-cell-size, 1.8em));
            block-size: max(24px, var(--year-cell-size, 1.8em));
            padding: 0;
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            font-family: inherit;
            line-height: 1;
            overflow: visible;
        }

        .day-cell:hover {
            background: var(--hover-bg);
        }

        .day-cell.current {
            background: var(--current-day-bg, Highlight);
            color: var(--current-day-color, HighlightText);
            font-weight: var(--current-day-font-weight);
        }

        .day-cell.current:hover {
            opacity: var(--current-day-hover-opacity);
        }

        .day-cell.selected {
            outline: 2px solid var(--primary-color, #3b82f6);
            outline-offset: -2px;
        }

        /* ── Dot density mode ── */
        .day-cell.has-events::after {
            content: '';
            position: absolute;
            bottom: 1px;
            left: 50%;
            transform: translateX(-50%);
            width: 3px;
            height: 3px;
            border-radius: 50%;
            background: var(--year-dot-color, var(--indicator-color, var(--primary-color, #3b82f6)));
        }

        .day-cell.current.has-events::after {
            background: var(--current-dot-bg);
        }

        /* ── Heatmap density mode ── */
        .day-cell[data-density='1'] {
            background: var(--year-heatmap-1, rgba(59, 130, 246, 0.15));
        }
        .day-cell[data-density='2'] {
            background: var(--year-heatmap-2, rgba(59, 130, 246, 0.35));
        }
        .day-cell[data-density='3'] {
            background: var(--year-heatmap-3, rgba(59, 130, 246, 0.55));
        }
        .day-cell[data-density='4'] {
            background: var(--year-heatmap-4, #1d4ed8);
            color: var(--year-heatmap-4-text, white);
        }

        .day-cell.current[data-density] {
            background: var(--current-day-bg, #1d4ed8);
            color: var(--current-day-color, white);
        }

        button {
            min-inline-size: 24px;
            min-block-size: 24px;
        }
        button:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: 1px;
        }
        .day-row > [role='gridcell'] {
            min-inline-size: 0;
        }
        .month-heading {
            margin: 0;
            font-size: inherit;
        }
        .sr-only {
            position: absolute;
            inline-size: 1px;
            block-size: 1px;
            overflow: hidden;
            clip-path: inset(50%);
            white-space: nowrap;
        }
        .month-label {
            inline-size: 100%;
        }
        @media (forced-colors: active) {
            .day-cell.current {
                border: 2px solid CanvasText;
            }
            .day-cell.selected,
            button:focus-visible {
                outline: 2px solid Highlight;
            }
        }

        /* ── Count density mode ── */
        .event-count {
            position: absolute;
            bottom: -0.55em;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.55em;
            color: var(--header-text-color, CanvasText);
            line-height: 1;
        }

        .day-cell.current .event-count {
            color: var(--current-day-color);
        }

        .empty-cell {
            /* Grid auto-rows handles height; no explicit size needed */
        }
    `;

    override render() {
        const year = this._displayYear ?? this.activeDate.year;
        const today = this._today.date;
        const todayDay = today.getDate();
        const todayMonth = today.getMonth() + 1;
        const todayYear = today.getFullYear();

        const weekdayOrder = getWeekdayOrder(this.firstDayOfWeek);

        return html`
            <p id="date-grid-help" class="sr-only" lang="en">Arrow keys move dates; Home/End move within a week; Page Up/Down move months; Shift+Page Up/Down move years. F2 opens the week control; Escape returns to the date.</p>
            <div class="scroll-container">
                <div class="year-grid" data-density-mode=${this.densityMode} role="group" aria-label="${getMessages(this.locale).year} ${year}">
                    ${Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        return this._renderMiniMonth(
                            year,
                            month,
                            todayDay,
                            todayMonth,
                            todayYear,
                            weekdayOrder,
                        );
                    })}
                </div>
            </div>
        `;
    }

    private _renderMiniMonth(
        year: number,
        month: number,
        todayDay: number,
        todayMonth: number,
        todayYear: number,
        weekdayOrder: number[],
    ) {
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDayOffset = getFirstDayOffset({ year, month, day: 1 }, this.firstDayOfWeek);
        const msg = getMessages(this.locale);

        // Build explicit week rows: each row is a 7-slot array (null = empty cell)
        const weeks: (number | null)[][] = [];
        let currentWeek: (number | null)[] = Array.from({ length: firstDayOffset }, () => null);
        for (let day = 1; day <= daysInMonth; day++) {
            currentWeek.push(day);
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        }
        if (currentWeek.length > 0) {
            while (currentWeek.length < 7) currentWeek.push(null);
            weeks.push(currentWeek);
        }

        return html`
            <div class="mini-month">
                <h3 class="month-heading"><button
                    type="button"
                    class="month-label"
                    id=${`month-${month}`}
                    @click=${() => this._handleMonthClick(year, month)}
                >
                    ${getLocalizedMonth(month, this.locale)}
                </button></h3>
                <div class="day-grid" role="grid" aria-labelledby=${`month-${month}`} aria-describedby="date-grid-help">
                <div class="weekday-header" role="row">
                    <span role="columnheader">${msg.calendarWeek}</span>
                    ${weekdayOrder.map(
                        (wd) =>
                            html`<span role="columnheader" aria-label=${getLocalizedWeekdayShort(wd, this.locale)}>${getLocalizedWeekdayShort(wd, this.locale).charAt(0)}</span>`,
                    )}
                </div>
                    ${repeat(
                        weeks,
                        (_, index) => index,
                        (week) => {
                            const firstDay = week.find((d) => d !== null);
                            const weekNum = firstDay
                                ? DateTime.fromObject({ year, month, day: firstDay }).weekNumber
                                : null;
                            return html`<div class="day-row" role="row">
                            <div role="gridcell">${
                                weekNum !== null
                                    ? html`<button
                                      type="button"
                                      class="cw-label"
                                      data-week=${`${year}-${month}-${firstDay}`}
                                      tabindex=${this._weekFocus === `${year}-${month}-${firstDay}` ? 0 : -1}
                                      aria-label="${msg.calendarWeek} ${weekNum}"
                                      @keydown=${(event: KeyboardEvent) => this._handleWeekKeydown(event, { year, month, day: firstDay! })}
                                      @click=${() => this._handleWeekClick(year, month, firstDay!)}
                                  >${weekNum}</button>`
                                    : html`
                                          <span class="empty-cell"></span>
                                      `
                            }</div>
                            ${week.map(
                                (day) =>
                                    html`<div role="gridcell" aria-selected=${day === this.activeDate.day && month === this.activeDate.month && year === this.activeDate.year ? 'true' : 'false'}>${
                                        day !== null
                                            ? this._renderDayCell(
                                                  year,
                                                  month,
                                                  day,
                                                  day === todayDay &&
                                                      month === todayMonth &&
                                                      year === todayYear,
                                                  day === this.activeDate.day &&
                                                      month === this.activeDate.month &&
                                                      year === this.activeDate.year,
                                                  this.entrySumByDay[`${year}-${month}-${day}`] ??
                                                      0,
                                              )
                                            : html`
                                                  <span class="empty-cell"></span>
                                              `
                                    }</div>`,
                            )}
                        </div>`;
                        },
                    )}
                </div>
            </div>
        `;
    }

    private _renderDayCell(
        year: number,
        month: number,
        day: number,
        isCurrent: boolean,
        isSelected: boolean,
        eventCount: number,
    ) {
        const classes = ['day-cell'];
        if (isCurrent) classes.push('current');
        if (isSelected && !isCurrent) classes.push('selected');

        // Density-specific attributes
        let densityAttr = '';
        if (this.densityMode === 'dot' && eventCount > 0) {
            classes.push('has-events');
        } else if (this.densityMode === 'heatmap' && eventCount > 0) {
            const bucket = eventCount <= 2 ? 1 : eventCount <= 5 ? 2 : eventCount <= 9 ? 3 : 4;
            densityAttr = `${bucket}`;
        }

        return html`
            <button
                type="button"
                class=${classes.join(' ')}
                data-density=${densityAttr || nothing}
                data-date="${year}-${month}-${day}"
                tabindex=${!this._weekFocus?.startsWith(`${year}-${month}-`) && day === (this._focusedDate?.month === month && this._focusedDate.year === year ? this._focusedDate.day : Math.min(this.activeDate.day, new Date(year, month, 0).getDate())) ? 0 : -1}
                aria-current=${isCurrent ? 'date' : 'false'}
                @focus=${() => {
                    this._focusedDate = { year, month, day };
                    this._weekFocus = undefined;
                }}
                @keydown=${this._handleDateKeydown}
                @click=${() => this._handleDayClick(year, month, day)}
                aria-label="${day} ${getLocalizedMonth(month, this.locale)} ${year}${eventCount > 0 ? `, ${eventCount} ${getMessages(this.locale).events}` : ''}"
            >
                ${day}
                ${
                    this.densityMode === 'count' && eventCount > 0
                        ? html`<span class="event-count">${eventCount}</span>`
                        : nothing
                }
            </button>
        `;
    }

    public async focusDate(date: CalendarDate = this.activeDate) {
        this._focusedDate = date;
        this._weekFocus = undefined;
        await this.updateComplete;
        const button = this.renderRoot.querySelector<HTMLButtonElement>(
            `[data-date="${dateKey(date)}"]`,
        );
        button?.focus();
        button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    private async _handleDateKeydown(event: KeyboardEvent) {
        const target = event.currentTarget as HTMLElement;
        const [year, month, day] = target.dataset.date!.split('-').map(Number);
        if (event.key === 'F2') {
            event.preventDefault();
            const button = target
                .closest('.day-row')
                ?.querySelector<HTMLButtonElement>('.cw-label');
            if (button) {
                this._weekFocus = button.dataset.week;
                await this.updateComplete;
                button.focus();
            }
            return;
        }
        const next = keyboardDate(
            event,
            { year, month, day },
            this.firstDayOfWeek,
            getComputedStyle(this).direction === 'rtl',
        );
        if (!next) return;
        event.preventDefault();
        if (next.year !== (this._displayYear ?? this.activeDate.year)) {
            this._displayYear = next.year;
            this.dispatchEvent(
                new CustomEvent('date-navigate', {
                    detail: { date: next },
                    bubbles: true,
                    composed: true,
                }),
            );
        }
        await this.focusDate(next);
    }

    private async _handleWeekKeydown(event: KeyboardEvent, date: CalendarDate) {
        if (['Escape', 'ArrowRight', 'ArrowLeft'].includes(event.key)) {
            event.preventDefault();
            await this.focusDate(
                this._focusedDate?.month === date.month ? this._focusedDate : date,
            );
        } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            const buttons = Array.from(
                (event.currentTarget as HTMLElement)
                    .closest('.day-grid')!
                    .querySelectorAll<HTMLButtonElement>('.cw-label'),
            );
            const index =
                buttons.indexOf(event.currentTarget as HTMLButtonElement) +
                (event.key === 'ArrowDown' ? 1 : -1);
            const next = buttons[index];
            if (next) {
                event.preventDefault();
                this._weekFocus = next.dataset.week;
                await this.updateComplete;
                next.focus();
            }
        }
    }

    private _handleDayClick(year: number, month: number, day: number) {
        this.dispatchEvent(
            new CustomEvent('expand', {
                detail: {
                    date: { year, month, day },
                    drillTarget: this.drillTarget,
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    private _handleWeekClick(year: number, month: number, day: number) {
        this.dispatchEvent(
            new CustomEvent('expand', {
                detail: {
                    date: { year, month, day },
                    drillTarget: 'week',
                },
                bubbles: true,
                composed: true,
            }),
        );
    }

    private _handleMonthClick(year: number, month: number) {
        this.dispatchEvent(
            new CustomEvent('expand', {
                detail: {
                    date: { year, month, day: 1 },
                    drillTarget: 'month',
                },
                bubbles: true,
                composed: true,
            }),
        );
    }
}
