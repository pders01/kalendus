import { SignalWatcher } from '@lit-labs/signals';
import { localized } from '@lit/localize';
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { DateTime } from 'luxon';

import { getLocalizedMonth } from '../lib/localization.js';
import { messages } from '../lib/messages.js';
import { activeDate, currentViewMode } from '../lib/viewState.js';

@customElement('lms-calendar-header')
@(localized() as ClassDecorator)
export default class Header extends SignalWatcher(LitElement) {
    @property({ type: String })
    heading?: string;

    @property({ type: Object })
    activeDate?: CalendarDate;

    @property({ type: Object })
    expandedDate?: CalendarDate;

    static override styles = css`
        .controls {
            height: var(--header-height, 3.5em);
            width: 100%;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-content: center;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--separator-light);
        }

        @media (max-width: 375px) {
            .controls {
                font-size: small;
                height: auto;
                min-height: var(--header-height-mobile, 4.5em);
                flex-wrap: wrap;
                padding: 0.25em 0;
                gap: 0.25em;
            }
            .info {
                width: 100%;
                text-align: center;
                padding-left: 0;
            }
            .context > * {
                margin: 0 0.25em;
            }
            .buttons {
                padding-right: 0.5em;
            }
            button {
                padding: 0.5em;
            }
        }
        .info {
            padding-left: var(--header-info-padding-left, 1em);
            text-align: right;
        }
        .day,
        .week,
        .month,
        .year {
            color: var(--header-text-color, rgba(0, 0, 0, 0.6));
        }
        .buttons {
            padding-right: var(--header-buttons-padding-right, 1em);
        }
        button {
            padding: var(--button-padding, 0.75em);
            margin: 0;
            border-radius: var(--button-border-radius, 50%);
            line-height: 0.5em;
            border: 1px solid transparent;
        }
        .context {
            display: flex;
        }
        .context > * {
            margin: 0 0.5em;
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
        return html`<div class="controls">
            <div class="info">
                <span>
                    <strong>${this.heading || messages.currentMonth()}</strong>
                </span>
                <div ?hidden=${currentViewMode.get() !== 'day'}>
                    <span class="day">${activeDate.get().day}</span>
                    <span class="month"
                        >${getLocalizedMonth(activeDate.get().month)}</span
                    >
                    <span class="year">${activeDate.get().year}</span>
                </div>
                <div ?hidden=${currentViewMode.get() !== 'week'}>
                    <span class="week"
                        >${messages.calendarWeek()}
                        ${this._getWeekInfo(activeDate.get()).weekNumber}</span
                    >
                    <span class="month"
                        >${getLocalizedMonth(activeDate.get().month)}</span
                    >
                    <span class="year"
                        >${this._getWeekInfo(activeDate.get()).weekYear}</span
                    >
                </div>
                <div ?hidden=${currentViewMode.get() !== 'month'}>
                    <span class="month"
                        >${getLocalizedMonth(activeDate.get().month)}</span
                    >
                    <span class="year">${activeDate.get().year}</span>
                </div>
            </div>
            <div class="context" @click=${this._dispatchSwitchView}>
                <button
                    ?data-active=${currentViewMode.get() === 'day'}
                    data-context="day"
                    class="btn-change-view"
                >
                    ${messages.day()}
                </button>
                <button
                    ?data-active=${currentViewMode.get() === 'week'}
                    data-context="week"
                    class="btn-change-view"
                >
                    ${messages.week()}
                </button>
                <button
                    ?data-active=${currentViewMode.get() === 'month'}
                    data-context="month"
                    class="btn-change-view"
                >
                    ${messages.month()}
                </button>
            </div>
            <div class="buttons" @click=${this._dispatchSwitchDate}>
                <button name="previous">«</button>
                <button name="today" @click=${this._handleTodayClick}>
                    ${messages.today()}
                </button>
                <button name="next">»</button>
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
        const target = e.target;
        if (!(target instanceof HTMLButtonElement)) {
            return;
        }

        const direction = e.target === e.currentTarget ? 'container' : target.name;
        const event = new CustomEvent('switchdate', {
            detail: { direction },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    private _dispatchSwitchView(e: Event) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        const view = e.target === e.currentTarget ? 'container' : target.dataset.context;
        const event = new CustomEvent('switchview', {
            detail: { view },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }
}
