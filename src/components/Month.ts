import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { match } from 'ts-pattern';
import DirectionalCalendarDateCalculator from '../lib/DirectionalCalendarDateCalculator';
import Translations from '../locales/Translations';

@customElement('lms-calendar-month')
export default class Month extends LitElement {
    private translations = new Translations();

    private currentDate = new Date();

    @property({ attribute: false })
    activeDate: CalendarDate = {
        day: this.currentDate.getDate(),
        month: this.currentDate.getMonth() + 1,
        year: this.currentDate.getFullYear(),
    };

    static override styles = css`
        .month {
            /* Header: 3.5em, Context: 2em, Border: 2px */
            height: calc(100% - 5.5em + 2px);
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
            gap: 1px;
        }

        .indicator.current {
            color: crimson;
            font-weight: bold;
        }

        .indicator {
            position: sticky;
            top: 0.25em;
            text-align: right;
            padding: 0 0.25em;
            margin-bottom: 0.25em;
            text-align: left;
        }
    `;

    private _isCurrentDate(date: string) {
        return (
            new Date(date).toDateString() === this.currentDate.toDateString()
        );
    }

    private _renderIndicator({ year, month, day }: CalendarDate) {
        const isCurrentDate = this._isCurrentDate(`${year}/${month}/${day}`);
        return html` <div
            class="indicator ${classMap({
                current: isCurrentDate,
            })}"
        >
            ${match(day)
                .with(
                    1,
                    () => html`
                        ${day}. ${this.translations.getTranslation(month)}
                    `,
                )
                .otherwise(() => html` ${day} `)}
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

        const { date } = target.dataset;
        if (!date) {
            return;
        }

        const [year, month, day] = date
            .split('-')
            .map((field: string) => parseInt(field, 10));
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
        return new Date(date.year, date.month, 0).getDate();
    }

    private _getOffsetOfFirstDayInMonth(date: CalendarDate) {
        const offset = new Date(`${date.year}/${date.month}/01`).getDay();
        return offset === 0 ? 6 : offset - 1;
    }

    private _getDatesInMonthAsArray(date: CalendarDate, sliceArgs: number[]) {
        return [
            ...Array.from(Array(this._getDaysInMonth(date)).keys(), (_, n) => ({
                year: date.year,
                month: date.month,
                day: n + 1,
            })).slice(...sliceArgs),
        ];
    }

    private _getCalendarArray() {
        if (!this.activeDate) {
            return;
        }

        const dateTransformer = new DirectionalCalendarDateCalculator({
            date: this.activeDate,
        });

        dateTransformer.direction = 'previous';
        const previousMonth = this._getDatesInMonthAsArray(
            dateTransformer.getDateByMonthInDirection(),
            this._getOffsetOfFirstDayInMonth(this.activeDate)
                ? [this._getOffsetOfFirstDayInMonth(this.activeDate) * -1]
                : [-0, -0],
        );
        const activeMonth = this._getDatesInMonthAsArray(this.activeDate, []);
        dateTransformer.direction = 'next';
        const nextMonth = this._getDatesInMonthAsArray(
            dateTransformer.getDateByMonthInDirection(),
            [0, 42 - (previousMonth.length + activeMonth.length)],
        );

        return previousMonth.concat(activeMonth, nextMonth);
    }
}
