import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DateTime } from 'luxon';

import { getLocalizedMonth, getLocalizedWeekdayShort } from '../lib/localization.js';
import { getMessages } from '../lib/messages.js';
import { getFirstDayOffset, getWeekdayOrder } from '../lib/weekStartHelper.js';
import type { FirstDayOfWeek } from '../lib/weekStartHelper.js';

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

    @property({ type: Object })
    entrySumByDay: Record<string, number> = {};

    @property({ type: String })
    drillTarget: DrillTarget = 'month';

    @property({ type: String })
    densityMode: DensityMode = 'dot';

    static override styles = css`
        :host {
            display: block;
            contain: content;
            overflow-y: auto;
            container-type: inline-size;
        }

        .year-grid {
            display: grid;
            grid-template-columns: repeat(var(--year-grid-columns, 3), 1fr);
            gap: 1.25em 1em;
            padding: 1em;
        }

        /* Container queries — respond to component width, not viewport */
        @container (max-width: 400px) {
            .year-grid {
                grid-template-columns: repeat(var(--year-grid-columns-mobile, 1), 1fr);
                gap: 1em 0.75em;
                padding: 0.75em;
            }
        }

        @container (min-width: 401px) and (max-width: 700px) {
            .year-grid {
                grid-template-columns: repeat(var(--year-grid-columns-tablet, 2), 1fr);
            }
        }

        .mini-month {
            display: flex;
            flex-direction: column;
            gap: 0.15em;
            min-width: 0; /* prevent grid blowout */
        }

        .month-label {
            font-size: var(--year-month-label-font-size, 0.875em);
            font-weight: 600;
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            cursor: pointer;
            padding: 0.3em 0;
            border: none;
            background: none;
            text-align: left;
            border-radius: 0;
            font-family: inherit;
            border-bottom: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
            margin-bottom: 0.15em;
        }

        .month-label:hover {
            color: var(--primary-color, dodgerblue);
        }

        .weekday-header {
            display: grid;
            grid-template-columns: var(--year-cw-width, 1.8em) repeat(7, 1fr);
            text-align: center;
        }

        .weekday-header span {
            font-size: 0.65em;
            color: var(--header-text-color, rgba(0, 0, 0, 0.45));
            padding: 0.2em 0;
            font-weight: 500;
            overflow: hidden;
        }

        .day-grid {
            display: grid;
            grid-template-columns: var(--year-cw-width, 1.8em) repeat(7, 1fr);
            grid-auto-rows: calc(var(--year-cell-size, 1.8em) + 0.6em);
            justify-items: center;
            align-items: start;
        }

        .cw-label {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: var(--year-cw-font-size, 0.55em);
            color: var(--year-cw-color, var(--header-text-color, rgba(0, 0, 0, 0.45)));
            cursor: pointer;
            border: none;
            background: none;
            border-radius: var(--border-radius-sm, 4px);
            font-family: inherit;
            padding: 0;
            line-height: 1;
        }

        .cw-label:hover {
            color: var(--primary-color, dodgerblue);
            background: var(--separator-light, rgba(0, 0, 0, 0.06));
        }

        .day-cell {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-size: var(--year-day-font-size, 0.7em);
            border: none;
            background: none;
            border-radius: 50%;
            cursor: pointer;
            position: relative;
            width: var(--year-cell-size, 1.8em);
            height: var(--year-cell-size, 1.8em);
            padding: 0;
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            font-family: inherit;
            line-height: 1;
            overflow: visible;
        }

        .day-cell:hover {
            background: var(--separator-light, rgba(0, 0, 0, 0.08));
        }

        .day-cell.current {
            background: var(--primary-color, dodgerblue);
            color: white;
            font-weight: bold;
        }

        .day-cell.current:hover {
            opacity: 0.85;
        }

        .day-cell.selected {
            outline: 2px solid var(--primary-color, dodgerblue);
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
            background: var(--year-dot-color, var(--indicator-color, var(--primary-color, dodgerblue)));
        }

        .day-cell.current.has-events::after {
            background: rgba(255, 255, 255, 0.9);
        }

        /* ── Heatmap density mode ── */
        .day-cell[data-density="1"] {
            background: var(--year-heatmap-1, rgba(30, 144, 255, 0.15));
        }
        .day-cell[data-density="2"] {
            background: var(--year-heatmap-2, rgba(30, 144, 255, 0.35));
        }
        .day-cell[data-density="3"] {
            background: var(--year-heatmap-3, rgba(30, 144, 255, 0.55));
        }
        .day-cell[data-density="4"] {
            background: var(--year-heatmap-4, rgba(30, 144, 255, 0.75));
            color: white;
        }

        .day-cell.current[data-density] {
            background: var(--primary-color, dodgerblue);
        }

        /* ── Count density mode ── */
        .event-count {
            position: absolute;
            bottom: -0.55em;
            left: 50%;
            transform: translateX(-50%);
            font-size: 0.55em;
            color: var(--header-text-color, rgba(0, 0, 0, 0.5));
            line-height: 1;
        }

        .day-cell.current .event-count {
            color: rgba(255, 255, 255, 0.8);
        }

        .empty-cell {
            /* Grid auto-rows handles height; no explicit size needed */
        }
    `;

    override render() {
        const year = this.activeDate.year;
        const today = new Date();
        const todayDay = today.getDate();
        const todayMonth = today.getMonth() + 1;
        const todayYear = today.getFullYear();

        const weekdayOrder = getWeekdayOrder(this.firstDayOfWeek);

        return html`
            <div class="year-grid" role="grid" aria-label="${getMessages(this.locale).year} ${year}">
                ${Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    return this._renderMiniMonth(year, month, todayDay, todayMonth, todayYear, weekdayOrder);
                })}
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
                <button
                    type="button"
                    class="month-label"
                    @click=${() => this._handleMonthClick(year, month)}
                >
                    ${getLocalizedMonth(month, this.locale)}
                </button>
                <div class="weekday-header">
                    <span></span>
                    ${weekdayOrder.map(
                        (wd) => html`<span>${getLocalizedWeekdayShort(wd, this.locale).charAt(0)}</span>`,
                    )}
                </div>
                <div class="day-grid">
                    ${weeks.map((week) => {
                        const firstDay = week.find((d) => d !== null);
                        const weekNum = firstDay
                            ? DateTime.fromObject({ year, month, day: firstDay }).weekNumber
                            : null;
                        return html`
                            ${weekNum !== null
                                ? html`<button
                                      type="button"
                                      class="cw-label"
                                      aria-label="${msg.calendarWeek} ${weekNum}"
                                      @click=${() => this._handleWeekClick(year, month, firstDay!)}
                                  >${weekNum}</button>`
                                : html`<span class="empty-cell"></span>`}
                            ${week.map((day) =>
                                day !== null
                                    ? this._renderDayCell(
                                          year,
                                          month,
                                          day,
                                          day === todayDay && month === todayMonth && year === todayYear,
                                          day === this.activeDate.day &&
                                              month === this.activeDate.month &&
                                              year === this.activeDate.year,
                                          this.entrySumByDay[`${year}-${month}-${day}`] ?? 0,
                                      )
                                    : html`<span class="empty-cell"></span>`,
                            )}
                        `;
                    })}
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
                @click=${() => this._handleDayClick(year, month, day)}
                aria-label="${day} ${getLocalizedMonth(month, this.locale)} ${year}${eventCount > 0 ? `, ${eventCount} ${getMessages(this.locale).events}` : ''}"
            >
                ${day}
                ${this.densityMode === 'count' && eventCount > 0
                    ? html`<span class="event-count">${eventCount}</span>`
                    : nothing}
            </button>
        `;
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
