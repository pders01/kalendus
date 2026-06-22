import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { getLocalizedDayMonth } from '../lib/localization.js';
import { type FirstDayOfWeek, getMonthCalendarArray } from '../lib/weekStartHelper.js';

@customElement('lms-calendar-month')
export default class Month extends LitElement {
    private currentDate = new Date();

    @property({ attribute: false })
    activeDate: CalendarDate = {
        day: this.currentDate.getDate(),
        month: this.currentDate.getMonth() + 1,
        year: this.currentDate.getFullYear(),
    };

    @property({ type: Number })
    firstDayOfWeek: FirstDayOfWeek = 1;

    @property({ type: String })
    locale = 'en';

    @property({ type: Number })
    localeVersion = 0;

    static override styles = css`
        :host {
            display: block;
            flex: 1;
            min-height: 0;
        }

        .month {
            height: 100%;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            grid-template-rows: repeat(6, 1fr);
            border-top: 1px solid var(--separator-light);
        }

        .month > div {
            border-bottom: 1px solid var(--separator-light);
            border-inline-end: 1px solid var(--separator-light);
        }

        .month > div:nth-child(7n + 7) {
            border-inline-end: none;
        }

        .month > div:nth-last-child(-n + 7) {
            border-bottom: none;
        }

        .day {
            width: 100%;
            position: relative;
            display: flex;
            flex-direction: column;
            overflow-x: hidden;
            overflow-y: hidden;
            gap: var(--month-day-gap, 1px);
            min-width: 0;
            min-height: 0;
            contain: layout style paint;
        }

        /* Ensure consistent multi-day event layering */
        ::slotted(lms-calendar-entry) {
            position: relative;
            margin-inline-start: 1em;
            width: calc(100% - 1em);
        }

        /* All-day entries (month-span) take full width */
        ::slotted(lms-calendar-entry[data-display-mode='month-span']) {
            margin-inline-start: 0;
            width: 100%;
        }

        .indicator.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .indicator {
            position: sticky;
            top: 0.25em;
            inset-inline-start: 0.25em;
            z-index: 500;
            background: transparent;
            backdrop-filter: var(--indicator-backdrop-filter);
            -webkit-backdrop-filter: var(--indicator-backdrop-filter);
            text-align: start;
            min-height: 2em;
            line-height: 2em;
            margin: 0.25em;
            border-radius: var(--month-indicator-border-radius);
            align-self: flex-start;
            transition: opacity var(--transition-speed) ease-in-out;
            opacity: 1;
            padding: 0 0.25em;
            white-space: nowrap;
        }

        .day.scrolled .indicator {
            opacity: 0;
        }
    `;

    override connectedCallback() {
        super.connectedCallback();

        // Use a single delegated scroll listener on the shadow root for all .day cells.
        // This avoids per-element listener management across re-renders.
        this._setupDelegatedScrollListener();
    }

    private _scrollRafId: number | null = null;

    private _setupDelegatedScrollListener() {
        this.shadowRoot?.addEventListener(
            'scroll',
            (e: Event) => {
                const target = e.target as HTMLElement;
                if (!target.classList?.contains('day')) return;

                if (this._scrollRafId) return;
                this._scrollRafId = requestAnimationFrame(() => {
                    if (target.scrollTop > 5) {
                        target.classList.add('scrolled');
                    } else {
                        target.classList.remove('scrolled');
                    }
                    this._scrollRafId = null;
                });
            },
            { capture: true, passive: true },
        );
    }

    private _isCurrentDate(date: string) {
        return new Date(date).toDateString() === this.currentDate.toDateString();
    }

    private _renderIndicator({ year, month, day }: CalendarDate) {
        const isCurrentDate = this._isCurrentDate(`${year}/${month}/${day}`);
        return html` <div
            class="indicator ${classMap({
                current: isCurrentDate,
            })}"
        >
            ${day === 1 ? getLocalizedDayMonth(day, month, year, this.locale) : day}
        </div>`;
    }

    override render() {
        const calendarArray = this.activeDate
            ? getMonthCalendarArray(this.activeDate, this.firstDayOfWeek)
            : [];

        return html`
            <div class="month">
                ${calendarArray.map(
                    ({ year, month, day }) =>
                        html`<div
                            class="day"
                            data-date="${year}-${month}-${day}"
                            @click=${this._dispatchExpand}
                            @keydown=${this._handleKeydown}
                            tabindex="0"
                        >
                            ${this._renderIndicator({ year, month, day })}
                            <slot name="${year}-${month}-${day}"></slot>
                        </div>`,
                )}
            </div>
        `;
    }

    private _dispatchExpand(e: Event) {
        const target = e.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }

        // Don't expand if the click is on an entry component or inside one
        if (target.closest('lms-calendar-entry')) {
            return;
        }

        const { date } = target.dataset;
        if (!date) {
            return;
        }

        const [year, month, day] = date.split('-').map((field: string) => parseInt(field, 10));
        const event = new CustomEvent('expand', {
            detail: { date: { day, month, year } },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }

    private _handleKeydown(e: KeyboardEvent) {
        const key = e.key;
        if (!(key === 'Space' || key === 'Enter')) {
            return;
        }

        this._dispatchExpand(e);
    }
}
