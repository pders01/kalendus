import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { P, match } from 'ts-pattern';

import DirectionalCalendarDateCalculator from '../lib/DirectionalCalendarDateCalculator.js';
import { getLocalizedDayMonth } from '../lib/localization.js';
import { type FirstDayOfWeek, getFirstDayOffset } from '../lib/weekStartHelper.js';

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
            border-top: 1px solid var(--separator-light);
        }

        .month > div {
            border-bottom: 1px solid var(--separator-light);
            border-right: 1px solid var(--separator-light);
        }

        .month > div:nth-child(7n + 7) {
            border-right: none;
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
            overflow-y: auto;
            gap: var(--month-day-gap, 1px);
            min-width: 0;
            /* Let Blink skip layout/paint for off-screen day cells */
            content-visibility: auto;
            contain-intrinsic-size: auto 6em;
        }

        /* Ensure consistent multi-day event layering */
        ::slotted(lms-calendar-entry) {
            position: relative;
            margin-left: 1em;
            width: calc(100% - 1em);
        }

        .indicator.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
        }

        .indicator {
            position: sticky;
            top: 0.25em;
            left: 0.25em;
            z-index: 500;
            background: transparent;
            backdrop-filter: var(--indicator-backdrop-filter, blur(10px));
            -webkit-backdrop-filter: var(--indicator-backdrop-filter, blur(10px));
            text-align: left;
            min-height: 2em;
            line-height: 2em;
            margin: 0.25em;
            border-radius: 1em;
            align-self: flex-start;
            transition: opacity 0.2s ease-in-out;
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
        // Forward open-menu events from entry components
        this.addEventListener('open-menu', (e: Event) => {
            const customEvent = e as CustomEvent;

            // Only forward if the event came from an entry component, not from our own re-dispatch
            if (e.target !== this) {
                e.stopPropagation(); // Stop the original event
                // Re-dispatch to ensure it bubbles up to calendar
                const forwardedEvent = new CustomEvent('open-menu', {
                    detail: customEvent.detail,
                    bubbles: true,
                    composed: true,
                });
                this.dispatchEvent(forwardedEvent);
            }
        });

        // Add scroll detection for day cells
        this._setupScrollDetection();
    }

    private _setupScrollDetection() {
        // Use requestAnimationFrame for throttling
        let rafId: number | null = null;

        const handleScroll = (dayElement: HTMLElement) => {
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                if (dayElement.scrollTop > 5) {
                    dayElement.classList.add('scrolled');
                } else {
                    dayElement.classList.remove('scrolled');
                }
                rafId = null;
            });
        };

        // Add listeners after render
        this.updateComplete.then(() => {
            const days = this.shadowRoot?.querySelectorAll('.day');
            days?.forEach((day) => {
                const dayElement = day as HTMLElement;
                dayElement.addEventListener('scroll', () => handleScroll(dayElement), {
                    passive: true,
                });
            });
        });
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
            ${day === 1
                ? getLocalizedDayMonth(day, month, year, this.locale)
                : day}
        </div>`;
    }

    override render() {
        return html`
            <div class="month">
                ${this._getCalendarArray()?.map(
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

    private _getDaysInMonth(date: CalendarDate) {
        /** Important note: Passing 0 as the date shifts the
         *  months indices by positive 1, so 1-12 */
        return match(date)
            .with({ year: P.number, month: P.number, day: P.number }, ({ year, month }) => {
                const days = new Date(year, month, 0).getDate();
                return days > 0 ? days : 0;
            })
            .otherwise(() => 0);
    }

    private _getOffsetOfFirstDayInMonth(date: CalendarDate) {
        return getFirstDayOffset(date, this.firstDayOfWeek);
    }

    private _getDatesInMonthAsArray(date: CalendarDate, sliceArgs: number[]) {
        const daysInMonth = this._getDaysInMonth(date);
        return match(daysInMonth)
            .with(0, () => [])
            .otherwise((days) =>
                Array.from(Array(days).keys(), (_, n) => ({
                    year: date.year,
                    month: date.month,
                    day: n + 1,
                })).slice(...(sliceArgs || [0])),
            );
    }

    private _getCalendarArray() {
        if (!this.activeDate) {
            return [];
        }

        const dateTransformer = new DirectionalCalendarDateCalculator({
            date: this.activeDate,
        });

        try {
            dateTransformer.direction = 'previous';
            const offset = this._getOffsetOfFirstDayInMonth(this.activeDate);
            const previousMonth =
                offset > 0
                    ? this._getDatesInMonthAsArray(dateTransformer.getDateByMonthInDirection(), [
                          -offset,
                      ])
                    : [];

            const activeMonth = this._getDatesInMonthAsArray(this.activeDate, []);

            // Reset the date transformer to the active date before getting next month
            dateTransformer.date = this.activeDate;
            dateTransformer.direction = 'next';
            const remainingDays = 42 - (previousMonth.length + activeMonth.length);
            const nextMonth =
                remainingDays > 0
                    ? this._getDatesInMonthAsArray(dateTransformer.getDateByMonthInDirection(), [
                          0,
                          remainingDays,
                      ])
                    : [];

            return previousMonth.concat(activeMonth, nextMonth);
        } catch (error) {
            console.error('Error generating calendar array:', error);
            return [];
        }
    }
}
