import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DateTime } from 'luxon';

import { formatLocalizedDate, getLocalizedMonth } from '../lib/localization.js';
import { getMessages } from '../lib/messages.js';
import type { ViewMode } from '../lib/ViewStateController.js';
import { getWeekDates, type FirstDayOfWeek } from '../lib/weekStartHelper.js';

@customElement('lms-calendar-header')
export default class Header extends LitElement {
    @property({ type: String })
    heading?: string;

    @property({ type: Object })
    activeDate?: CalendarDate;

    @property({ type: String })
    viewMode: ViewMode = 'month';

    @property({ type: Object })
    expandedDate?: CalendarDate;

    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    /** Optional condensed-week dates, otherwise derived from the configured week start. */
    @property({ attribute: false })
    visibleDates?: CalendarDate[];

    @property({ type: String })
    locale = 'en';

    @property({ type: Number })
    localeVersion = 0;

    static override styles = css`
        :host {
            display: block;
            container-type: inline-size;
        }

        .controls {
            box-sizing: border-box;
            min-block-size: var(--header-height, 3.5em);
            inline-size: 100%;
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto minmax(max-content, 1fr);
            align-items: center;
            gap: 0.5em 0.75em;
            padding-block: 0.5em;
            border-bottom: 1px solid var(--separator-light);
        }

        .info {
            padding-inline-start: var(
                --header-info-padding-inline-start,
                var(--header-info-padding-left, 1em)
            );
            text-align: start;
            display: grid;
            justify-self: stretch;
            min-inline-size: 0;
            overflow-wrap: anywhere;
        }

        @container (max-width: 50em) {
            .controls {
                font-size: 0.875em;
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
                align-items: center;
                padding: 0.35em 0.5em;
                gap: 0.25em 0.5em;
            }
            .info {
                flex: 1 1 100%;
                display: flex;
                flex-wrap: wrap;
                align-items: baseline;
                justify-content: center;
                gap: 0.4em;
                padding-inline-start: 0;
            }
            .controls .buttons {
                padding-inline-end: 0;
            }
        }

        .calendar-title {
            margin: 0;
            font-size: inherit;
            font-weight: 700;
        }

        .view-detail {
            display: none;
        }

        .view-detail.active {
            display: block;
        }
        .day,
        .week,
        .month,
        .year {
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
        }
        button {
            min-inline-size: 24px;
            min-block-size: 24px;
            padding: 0.4em 0.7em;
            margin: 0;
            border: none;
            background: none;
            font: inherit;
            font-size: 0.85em;
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
            cursor: pointer;
            border-radius: var(--border-radius-sm);
            transition:
                background-color var(--transition-speed) ease,
                color var(--transition-speed) ease;
        }

        button:hover {
            background: var(--hover-bg);
            color: var(--hover-color, var(--header-text-color, rgba(0, 0, 0, 0.6)));
        }

        .context {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            max-inline-size: 100%;
            box-sizing: border-box;
            gap: 0;
            background: var(--context-bg);
            border-radius: var(--border-radius-sm);
            padding: 0.15em;
        }

        .context button {
            border-radius: calc(var(--border-radius-sm) - 1px);
            color: var(--context-text-color, var(--header-text-color, rgba(0, 0, 0, 0.6)));
        }

        .context button[data-active] {
            background: var(--active-indicator-bg);
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            box-shadow: var(--active-indicator-shadow);
        }

        @container (max-width: 16em) {
            .context {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        .buttons {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            justify-content: center;
            padding-inline-end: var(
                --header-buttons-padding-inline-end,
                var(--header-buttons-padding-right, 1em)
            );
            gap: 0.15em;
            justify-self: end;
        }

        button:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: 2px;
        }
        @media (pointer: coarse) {
            button {
                min-block-size: 44px;
                min-inline-size: 44px;
            }
        }
        @media (forced-colors: active) {
            button:focus-visible {
                outline-color: Highlight;
            }
        }

        .buttons .separator {
            width: 1px;
            height: 1.2em;
            background: var(--separator-light, rgba(0, 0, 0, 0.15));
            margin: 0 0.2em;
        }
    `;

    private _getWeekInfo(date: CalendarDate) {
        const dt = DateTime.fromObject({
            year: date.year,
            month: date.month,
            day: date.day,
        });

        return {
            weekNumber: dt.weekNumber,
            weekYear: dt.weekYear,
        };
    }

    override render() {
        const now = new Date();
        const date = this.activeDate ?? {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
        };
        const msg = getMessages(this.locale);

        return html`<div class="controls">
            <div class="info">
                <h2 class="calendar-title">${this.heading || msg.calendarView}</h2>
                <div class="view-detail${this.viewMode === 'day' ? ' active' : ''}">
                    <span class="day">${date.day}</span>
                    <span class="month"
                        >${getLocalizedMonth(date.month, this.locale)}</span
                    >
                    <span class="year">${date.year}</span>
                </div>
                <div class="view-detail${this.viewMode === 'week' ? ' active' : ''}">
                    ${(() => {
                        const { weekNumber } = this._getWeekInfo(date);
                        const dates = this.visibleDates?.length
                            ? this.visibleDates
                            : getWeekDates(date, this.firstDayOfWeek);
                        const first = dates[0];
                        const last = dates[dates.length - 1];
                        return html`
                            <span class="week"
                                >${msg.calendarWeek}
                                ${weekNumber}</span
                            >
                            <span class="week-range">${formatLocalizedDate(first.day, first.month, first.year, this.locale)} – ${formatLocalizedDate(last.day, last.month, last.year, this.locale)}</span>
                        `;
                    })()}
                </div>
                <div class="view-detail${this.viewMode === 'month' ? ' active' : ''}">
                    <span class="month"
                        >${getLocalizedMonth(date.month, this.locale)}</span
                    >
                    <span class="year">${date.year}</span>
                </div>
                <div class="view-detail${this.viewMode === 'year' ? ' active' : ''}">
                    <span class="year">${date.year}</span>
                </div>
            </div>
            <nav class="context" aria-label="${msg.calendarView}" @click=${this._dispatchSwitchView}>
                <button
                    type="button"
                    ?data-active=${this.viewMode === 'day'}
                    aria-pressed=${this.viewMode === 'day' ? 'true' : 'false'}
                    data-context="day"
                    class="btn-change-view"
                >
                    ${msg.day}
                </button>
                <button
                    type="button"
                    ?data-active=${this.viewMode === 'week'}
                    aria-pressed=${this.viewMode === 'week' ? 'true' : 'false'}
                    data-context="week"
                    class="btn-change-view"
                >
                    ${msg.week}
                </button>
                <button
                    type="button"
                    ?data-active=${this.viewMode === 'month'}
                    aria-pressed=${this.viewMode === 'month' ? 'true' : 'false'}
                    data-context="month"
                    class="btn-change-view"
                >
                    ${msg.month}
                </button>
                <button
                    type="button"
                    ?data-active=${this.viewMode === 'year'}
                    aria-pressed=${this.viewMode === 'year' ? 'true' : 'false'}
                    data-context="year"
                    class="btn-change-view"
                >
                    ${msg.year}
                </button>
            </nav>
            <div class="buttons" @click=${this._dispatchSwitchDate}>
                <button type="button" name="previous" aria-label="${msg.previous}">«</button>
                <button type="button" name="next" aria-label="${msg.next}">»</button>
                <span class="separator"></span>
                <button type="button" name="today" @click=${this._handleTodayClick}>
                    ${msg.today}
                </button>
            </div>
        </div>`;
    }

    private _handleTodayClick(e: Event) {
        e.stopPropagation(); // Prevent triggering _dispatchSwitchDate

        const today = new Date();
        const todayDate = {
            day: today.getDate(),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
        };

        const event = new CustomEvent('jumptoday', {
            detail: { date: todayDate },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    private _dispatchSwitchDate(e: Event) {
        const target = e.target instanceof Element ? e.target.closest('button') : null;
        if (!target || !['previous', 'next'].includes(target.name)) return;
        const direction = target.name;
        const event = new CustomEvent('switchdate', {
            detail: { direction },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    private _dispatchSwitchView(e: Event) {
        const target = e.target instanceof Element ? e.target.closest('button') : null;
        const view = target?.dataset.context;
        if (!view) return;
        const event = new CustomEvent('switchview', {
            detail: { view },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }
}
