import { LitElement, css, html, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import {
    formatLocalizedDate,
    formatLocalizedDateInterval,
    formatLocalizedMonthYear,
    formatLocalizedYear,
} from '../lib/localization.js';
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

    @property({ attribute: false }) agenda = false;

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
            grid-template-areas: 'info' 'identity' 'navigation' 'views';
            grid-template-columns: minmax(0, 1fr);
            align-items: center;
            gap: 0.75em 1em;
            padding: 0.75em 0.5em;
            border-block-end: 1px solid var(--separator-light);
        }

        .info,
        .calendar-title {
            /* Resolve the shared inset before scaling the text on either line. */
            padding-inline-start: var(
                --header-info-padding-inline-start,
                var(--header-info-padding-left, 1em)
            );
            display: grid;
            min-inline-size: 0;
            overflow-wrap: anywhere;
            text-align: start;
        }
        .info {
            grid-area: info;
            justify-self: stretch;
        }

        /* A normal phone gets period + compact navigation, then view controls.
           Very narrow/enlarged embeds keep the safe stacked default. */
        @container (min-width: 20em) {
            .controls {
                grid-template-areas: 'info info navigation' 'identity views views';
                grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(min-content, 8em);
                gap: 0.5em;
            }
            .period-title {
                min-block-size: 2.6em;
            }
            .info,
            .calendar-title {
                padding-inline-start: var(
                    --header-info-padding-inline-start,
                    var(--header-info-padding-left, 0)
                );
            }
            .buttons {
                padding-inline-end: var(
                    --header-buttons-padding-inline-end,
                    var(--header-buttons-padding-right, 0)
                );
            }
        }

        @container (min-width: 40em) {
            .controls {
                grid-template-areas: 'info navigation' 'identity navigation' 'views views';
                grid-template-columns: minmax(0, 1fr) minmax(0, 12em);
                gap: 0.25em 1em;
            }
            .period-title {
                min-block-size: 0;
            }
        }

        @container (min-width: 64em) {
            .controls {
                grid-template-areas: 'info navigation views' 'identity navigation views';
                grid-template-columns: minmax(0, 1fr) minmax(0, 14em) minmax(0, 20em);
            }
        }

        .period-title {
            margin: 0;
            font-size: 1.25em;
            font-weight: 700;
            line-height: 1.3;
            color: var(--separator-dark, CanvasText);
        }

        .calendar-title {
            grid-area: identity;
            margin: 0;
            font-weight: 400;
            line-height: 1.4;
            color: var(--header-text-color, CanvasText);
        }
        .calendar-title > span {
            font-size: 0.875em;
        }

        /* Reserve space for the longest period label at this width without
           exposing the inactive labels to assistive technology. */
        .period-title {
            display: grid;
            align-content: center;
        }
        .view-detail {
            grid-area: 1 / 1;
            visibility: hidden;
        }
        .view-detail.active {
            visibility: visible;
        }
        button {
            box-sizing: border-box;
            min-inline-size: 24px;
            min-block-size: 24px;
            padding: 0.5em 0.6em;
            overflow-wrap: anywhere;
            margin: 0;
            border: none;
            background: none;
            font: inherit;
            font-size: 0.875em;
            color: var(--header-text-color, var(--_muted-color, CanvasText));
            cursor: pointer;
            border-radius: var(--border-radius-sm);
            transition:
                background-color var(--transition-speed) ease,
                color var(--transition-speed) ease;
        }

        button:hover {
            background: var(--hover-bg);
            color: var(--hover-color, var(--header-text-color, var(--_muted-color, CanvasText)));
        }

        .context {
            grid-area: views;
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: stretch;
            min-inline-size: 0;
            max-inline-size: 100%;
            box-sizing: border-box;
            gap: 0;
            background: var(--context-bg);
            border-radius: var(--border-radius-sm);
            padding: 0.15em;
        }

        .context button {
            padding-inline: 0.25em;
            border-radius: calc(var(--border-radius-sm) - 1px);
            color: var(--context-text-color, var(--header-text-color, var(--_muted-color, CanvasText)));
        }

        .context button[data-active] {
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 0.25em;
            background: var(--active-indicator-bg);
            color: var(--separator-dark, CanvasText);
            box-shadow: var(--active-indicator-shadow);
        }

        @container (min-width: 22em) {
            .context {
                grid-template-columns: repeat(4, minmax(0, 1fr));
            }
        }

        .buttons {
            grid-area: navigation;
            display: grid;
            grid-template-columns: auto minmax(min-content, 2fr) auto;
            align-items: stretch;
            min-inline-size: 0;
            padding-inline-end: var(
                --header-buttons-padding-inline-end,
                var(--header-buttons-padding-right, 1em)
            );
            gap: 0.25em;
        }

        button[name='today'] {
            white-space: normal;
            overflow-wrap: normal;
        }

        @container (max-width: 19.999em) {
            .buttons {
                grid-template-columns: auto minmax(0, 1fr) auto;
            }
            button[name='today'] {
                overflow-wrap: anywhere;
            }
        }

        /* The switcher already names itself. Use the same compact tracks in
           every view, retaining the identity row only for a supplied title. */
        @container (width < 40em) {
            .without-title .calendar-title {
                display: none;
            }
            .without-title .context {
                grid-column: 1 / -1;
            }
        }
        @container (width < 20em) {
            .period-title {
                min-block-size: 2lh;
            }
            .controls {
                row-gap: 0.35em;
                padding-block: 0.35em;
            }
            .controls.without-title {
                grid-template-areas: 'info' 'navigation' 'views';
            }
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
            @container (min-width: 20em) and (max-width: 40em) {
                .controls {
                    /* Three 44px targets, gaps, and the legacy end-padding token. */
                    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(min-content, 10em);
                }
                .buttons {
                    grid-template-columns: auto minmax(44px, 1fr) auto;
                }
            }
        }
        @media (forced-colors: active) {
            button:focus-visible {
                outline-color: Highlight;
            }
        }
    `;

    override render(): TemplateResult<1> {
        const now = new Date();
        const date = this.activeDate ?? {
            year: now.getFullYear(),
            month: now.getMonth() + 1,
            day: now.getDate(),
        };
        const msg = getMessages(this.locale);
        const dates = this.visibleDates?.length
            ? this.visibleDates
            : getWeekDates(date, this.firstDayOfWeek);
        const first = dates[0];
        const last = dates[dates.length - 1];

        return html`<div class=${this.heading ? 'controls' : 'controls without-title'}>
            <div class="info">
                <h2 class="period-title">
                <span class="view-detail${this.viewMode === 'day' || this.agenda ? ' active' : ''}">
                    ${formatLocalizedDate(date.day, date.month, date.year, this.locale)}
                </span>
                <span class="view-detail${this.viewMode === 'week' ? ' active' : ''}">
                    <span class="week-range">${formatLocalizedDateInterval(first, last, this.locale)}</span>
                </span>
                <span class="view-detail${this.viewMode === 'month' && !this.agenda ? ' active' : ''}">
                    ${formatLocalizedMonthYear(date.month, date.year, this.locale)}
                </span>
                <span class="view-detail${this.viewMode === 'year' ? ' active' : ''}">
                    <span class="year">${formatLocalizedYear(date.year, this.locale)}</span>
                </span>
                </h2>
            </div>
            <p class="calendar-title"><span>${this.heading || msg.calendarView}</span></p>
            <div class="buttons" role="group" aria-label=${msg.date} @click=${this._dispatchSwitchDate}>
                <button type="button" name="previous" aria-label="${msg.previous}">«</button>
                <button type="button" name="today" @click=${this._handleTodayClick}>
                    ${msg.today}
                </button>
                <button type="button" name="next" aria-label="${msg.next}">»</button>
            </div>
            <div class="context" role="group" aria-label="${msg.calendarView}" @click=${this._dispatchSwitchView}>
                ${(['day', 'week', 'month', 'year'] as const).map(
                    (view) => html`
                    <button type="button" class="btn-change-view" data-context=${view}
                        ?data-active=${this.viewMode === view} aria-pressed=${this.viewMode === view ? 'true' : 'false'}>
                        ${msg[view]}
                    </button>`,
                )}
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
        const target =
            e.target instanceof Element ? e.target.closest<HTMLButtonElement>('button') : null;
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
        const target =
            e.target instanceof Element ? e.target.closest<HTMLButtonElement>('button') : null;
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
