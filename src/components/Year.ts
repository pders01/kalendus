import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DateTime } from 'luxon';

import { dateSlotKey } from '../lib/entrySlots.js';
import {
    formatLocalizedDate,
    formatLocalizedYear,
    getLocalizedMonth,
    getLocalizedWeekdayShort,
} from '../lib/localization.js';
import { getMessageFormatters, getMessages, normalizeLocale } from '../lib/messages.js';
import { getFirstDayOffset, getWeekdayOrder } from '../lib/weekStartHelper.js';
import type { FirstDayOfWeek } from '../lib/weekStartHelper.js';
import { CurrentDateController } from './CurrentDateController.js';
import { keyboardDate } from './dateNavigation.js';

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
    private _numberFormat = new Intl.NumberFormat('en');
    private _dateNumberFormat = new Intl.NumberFormat('en', { useGrouping: false });
    @state() private _focusedDate?: CalendarDate;
    @state() private _displayYear?: number;
    @state() private _weekFocus?: string;
    private _fitObserver?: ResizeObserver;

    override connectedCallback() {
        super.connectedCallback();
        this._fitObserver ??= new ResizeObserver(() => this._fitMonths());
        this._fitObserver.observe(this);
    }

    override disconnectedCallback() {
        this._fitObserver?.disconnect();
        super.disconnectedCallback();
    }

    override updated() {
        this._fitMonths();
    }

    private _fitMonths() {
        const grid = this.renderRoot.querySelector<HTMLElement>('.year-grid');
        if (!grid) return;
        const scroll = grid.parentElement!.parentElement!;
        const styles = getComputedStyle(grid);
        if (styles.getPropertyValue('--year-grid-columns')) return;
        const font = parseFloat(styles.fontSize);
        // The preferred shape must not depend on scrollbars left by the previous shape.
        const width = scroll.offsetWidth;
        const height = scroll.offsetHeight;
        if (!height) return;
        const capacity = width / (font * (matchMedia('(pointer: coarse)').matches ? 24 : 14));
        const widest =
            capacity >= 6 ? 6 : capacity >= 4 ? 4 : capacity >= 3 ? 3 : capacity >= 2 ? 2 : 1;
        const aspect = width / height;
        const preferred = aspect <= 2 / 3 ? 2 : aspect <= 1.25 ? 3 : aspect <= 2.1 ? 4 : 6;
        const start = Math.min(preferred, widest);
        // Try the preferred shape first; use fewer rows if the content needs it.
        const top = scroll.scrollTop;
        const left = scroll.scrollLeft;
        for (const count of [1, 2, 3, 4, 6]) {
            if (count < start || count > widest) continue;
            grid.style.setProperty(
                '--_columns',
                count === 1
                    ? 'var(--year-grid-columns-mobile,1)'
                    : count === 2 && widest === 2
                      ? 'var(--year-grid-columns-tablet,2)'
                      : String(count),
            );
            if (count === widest || scroll.scrollHeight <= scroll.clientHeight) break;
        }
        scroll.scrollTop = top;
        scroll.scrollLeft = left;
    }

    override willUpdate(changed: Map<string, unknown>) {
        if (changed.has('locale')) {
            const locale = normalizeLocale(this.locale);
            this._numberFormat = new Intl.NumberFormat(locale);
            this._dateNumberFormat = new Intl.NumberFormat(locale, { useGrouping: false });
        }
        const previousDate = changed.get('activeDate') as CalendarDate | undefined;
        if (
            changed.has('activeDate') &&
            (!previousDate || dateSlotKey(previousDate) !== dateSlotKey(this.activeDate))
        ) {
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
            --_target-min: max(24px, 1.85em);
        }

        .scroll-container {
            block-size: 100%;
            overflow: auto;
            background: var(--background-color);
            scroll-padding: 1em 0.75em;
        }
        /* Measure inside the scrollbar so sticky headings fit the usable width. */
        .scroll-container > div {
            block-size: 100%;
            container-type: inline-size;
        }

        .year-grid {
            display: grid;
            grid-template-columns: repeat(
                var(--year-grid-columns, var(--_columns, 1)),
                minmax(min-content, 1fr)
            );
            /* Let one viewport pan all months when their tracks cannot fit. */
            box-sizing: border-box;
            inline-size: fit-content;
            min-inline-size: 100%;
            min-block-size: 100%;
            grid-auto-rows: minmax(min-content, 1fr);
            gap: 0.25em 1em;
            /* Keep a 1px (at 16px) end-padding margin for line-box rounding. */
            padding: 0.375em 0.75em 0.3125em;
        }

        .mini-month {
            display: flex;
            flex-direction: column;
            gap: 0.15em;
            min-inline-size: 0;
        }

        .month-label {
            font-size: var(--year-month-label-font-size, 1em);
            font-weight: var(--month-label-font-weight);
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            cursor: pointer;
            padding: 0.3em 0;
            border: none;
            background: none;
            text-align: start;
            border-radius: 0;
            font-family: inherit;
            border-block-end: 1px solid var(--separator-light, rgba(0, 0, 0, 0.1));
            overflow-wrap: anywhere;
            inline-size: 100%;
        }

        .month-label:hover {
            color: var(--year-month-label-hover-color);
            text-decoration: underline;
        }

        :is(.weekday-header, .day-row) {
            display: grid;
            grid-template-columns: var(--_week-inline) repeat(7, minmax(var(--_day-inline), 1fr));
        }
        :is(.weekday-header, .day-row) > :first-child {
            box-sizing: border-box;
            align-self: stretch;
            border-inline-end: 1px solid var(--separator-light, #ddd);
        }
        .weekday-header {
            text-align: center;
        }

        .weekday-header span {
            font-size: 0.925em;
            color: var(--header-text-color, CanvasText);
            padding-block: 0.1em;
            font-weight: var(--year-weekday-font-weight);
            overflow-wrap: anywhere;
        }

        .day-grid {
            display: grid;
            flex: 1;
            /* Align week slots across neighboring months; unused slots have no targets. */
            grid-template-rows: auto repeat(6, minmax(auto, 1fr));
            font-size: var(--year-day-font-size, 0.8125em);
            --_week-inline: max(var(--_target-min), var(--year-cw-width, 1.8em));
            --_day-inline: max(var(--_target-min), var(--year-cell-size, 1.8em));
        }
        /* Headers can widen a track without splitting words or moving dates off center. */
        @supports (grid-template-columns: subgrid) {
            .day-grid {
                grid-template-columns: var(--_week-inline) repeat(7, minmax(min-content, 1fr));
            }
            :is(.weekday-header, .day-row) {
                grid-column: 1 / -1;
                grid-template-columns: subgrid;
            }
            .weekday-header > :not(:first-child) {
                white-space: nowrap;
                padding-inline: 0.15em;
            }
            .day-row > [role='gridcell']:not(:first-child) {
                min-inline-size: var(--_day-inline);
            }
        }
        .day-row {
            grid-auto-rows: minmax(var(--_target-min), auto);
            justify-items: center;
        }

        .cw-label {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: inherit;
            color: var(--year-cw-color, var(--header-text-color, var(--separator-dark, CanvasText)));
            cursor: pointer;
            border: none;
            background: none;
            border-radius: var(--border-radius-sm);
            font-family: inherit;
            padding: 0;
            line-height: 1;
        }

        .cw-number {
            font-size: max(0.875em, var(--year-cw-font-size, 0.875em));
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
            font-size: inherit;
            border: none;
            background: none;
            border-radius: var(--year-day-cell-border-radius);
            cursor: pointer;
            position: relative;
            box-sizing: border-box;
            inline-size: 100%;
            min-block-size: max(var(--_target-min), var(--year-cell-size, 1.8em));
            padding: 0;
            color: var(--separator-dark, rgba(0, 0, 0, 0.7));
            font-family: inherit;
            line-height: 1;
            overflow: visible;
        }

        .date-number {
            box-sizing: border-box;
            display: grid;
            place-items: center;
            min-inline-size: 1.5em;
            min-block-size: 1.5em;
            padding: 0;
            border: 2px solid transparent;
            border-radius: var(--year-day-cell-border-radius);
        }

        .day-cell:hover .date-number {
            background: var(--hover-bg);
        }

        /* Today belongs to the date, never the activity slot. */
        .day-cell.current .date-number {
            border-radius: 50%;
            background: var(--current-day-bg, CanvasText);
            color: var(--current-day-color, Canvas);
            font-weight: var(--current-day-font-weight);
        }

        .day-cell.current:hover .date-number {
            opacity: var(--current-day-hover-opacity);
        }

        .day-cell.selected .date-number {
            border-color: var(--primary-color, #3b82f6);
        }

        .day-cell.current.selected .date-number {
            border-color: var(--current-day-color, Canvas);
        }

        /* Activity is centered below the date and never paints the selection. */
        .activity-slot {
            display: grid;
            place-items: center;
            inline-size: 100%;
            min-block-size: 4px;
            font-size: 0.75em;
            line-height: 1.1;
            color: var(--header-text-color, CanvasText);
            overflow-wrap: anywhere;
        }

        [data-density-mode='count'] .activity-slot {
            min-block-size: 1.1em;
        }

        .activity-mark {
            inline-size: 4px;
            block-size: 4px;
            border-radius: 50%;
            background: var(--year-dot-color, var(--indicator-color, var(--primary-color, #3b82f6)));
        }

        /* Heat expresses cardinality in the activity slot, not availability
           or date selection. Today stays recognizable in every density mode. */
        .day-cell[data-density] .activity-mark {
            inline-size: 1.25em;
            block-size: 4px;
            border-radius: 2px;
        }
        .day-cell[data-density='1'] .activity-mark {
            background: var(--year-heatmap-1, rgba(59, 130, 246, 0.15));
        }
        .day-cell[data-density='2'] .activity-mark {
            background: var(--year-heatmap-2, rgba(59, 130, 246, 0.35));
        }
        .day-cell[data-density='3'] .activity-mark {
            background: var(--year-heatmap-3, rgba(59, 130, 246, 0.55));
        }
        .day-cell[data-density='4'] .activity-mark {
            background: var(--year-heatmap-4, #1d4ed8);
        }

        button {
            min-inline-size: var(--_target-min);
            min-block-size: var(--_target-min);
        }
        button:focus-visible {
            outline: 2px solid currentColor;
            outline-offset: 1px;
        }
        .day-row > [role='gridcell'] {
            min-inline-size: 0;
            inline-size: 100%;
            display: grid;
        }
        .month-heading {
            position: sticky;
            inset-inline-start: 0.75em;
            max-inline-size: calc(100cqi - 1.5em);
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
        @media (pointer: coarse) {
            :host {
                --_target-min: max(44px, 1.85em);
            }
            /* A single-column touch overview has no neighboring weeks to align. */
            @container (inline-size < 48em) {
                .day-grid {
                    grid-template-rows: auto;
                    grid-auto-rows: minmax(auto, 1fr);
                }
            }
        }
        @media (forced-colors: active) {
            .day-cell.current .date-number {
                border-color: CanvasText;
            }
            .day-cell.selected .date-number {
                border-color: Highlight;
            }
            button:focus-visible {
                outline-color: Highlight;
            }
            .activity-mark {
                outline: 1px solid CanvasText;
            }
        }

        .event-count {
            font-variant-numeric: tabular-nums;
        }
    `;

    override render(): TemplateResult<1> {
        const year = this._displayYear ?? this.activeDate.year;
        const today = this._today.date;
        const todayDay = today.getDate();
        const todayMonth = today.getMonth() + 1;
        const todayYear = today.getFullYear();

        const weekdays = getWeekdayOrder(this.firstDayOfWeek).map((day) =>
            getLocalizedWeekdayShort(day, this.locale),
        );
        const format = getMessageFormatters(this.locale);

        return html`
            <p id="date-grid-help" class="sr-only" lang="en">Arrow keys move dates; Home/End move within a week; Page Up/Down move months; Shift+Page Up/Down move years. F2 opens the week control; Escape returns to the date.</p>
            <div class="scroll-container"><div>
                <div class="year-grid" data-density-mode=${this.densityMode} role="group" aria-label="${getMessages(this.locale).year} ${formatLocalizedYear(year, this.locale)}">
                    ${Array.from({ length: 12 }, (_, i) => {
                        const month = i + 1;
                        return this._renderMiniMonth(
                            year,
                            month,
                            todayDay,
                            todayMonth,
                            todayYear,
                            weekdays,
                            format,
                        );
                    })}
                </div>
            </div></div>
        `;
    }

    private _renderMiniMonth(
        year: number,
        month: number,
        todayDay: number,
        todayMonth: number,
        todayYear: number,
        weekdays: string[],
        format: ReturnType<typeof getMessageFormatters>,
    ) {
        const daysInMonth = DateTime.utc(year, month).daysInMonth!;
        const firstDayOffset = getFirstDayOffset({ year, month, day: 1 }, this.firstDayOfWeek);
        const msg = getMessages(this.locale);

        const weekCount = Math.ceil((daysInMonth + firstDayOffset) / 7);
        const activeMonth = year === this.activeDate.year && month === this.activeDate.month;
        const currentMonth = year === todayYear && month === todayMonth;

        return html`
            <div class="mini-month">
                <h3 class="month-heading"><button
                    type="button"
                    class="month-label"
                    id=${`month-${month}`}
                    @click=${() => this._handleDrill(year, month, 1, 'month')}
                >
                    ${getLocalizedMonth(month, this.locale, 'long')}
                </button></h3>
                <div class="day-grid" role="grid" aria-labelledby=${`month-${month}`} aria-describedby="date-grid-help">
                <div class="weekday-header" role="row">
                    <span role="columnheader">${msg.calendarWeek}</span>
                    ${weekdays.map((day) => html`<span role="columnheader">${day}</span>`)}
                </div>
                    ${Array.from({ length: weekCount }, (_, index) => {
                        const weekStart = index * 7 + 1 - firstDayOffset;
                        const firstDay = Math.max(1, weekStart);
                        const weekKey = `${year}-${month}-${firstDay}`;
                        const weekNum = DateTime.utc(year, month, firstDay).weekNumber;
                        return html`<div class="day-row" role="row">
                            <div role="gridcell"><button
                                type="button"
                                class="cw-label"
                                data-week=${weekKey}
                                tabindex=${this._weekFocus === weekKey ? 0 : -1}
                                aria-label=${format.showWeek(weekNum)}
                                @keydown=${(event: KeyboardEvent) => this._handleWeekKeydown(event, { year, month, day: firstDay })}
                                @click=${() => this._handleDrill(year, month, firstDay, 'week')}
                            ><span class="cw-number">${this._dateNumberFormat.format(weekNum)}</span></button></div>
                            ${Array.from({ length: 7 }, (_, column) => {
                                const day = weekStart + column;
                                const selected = activeMonth && day === this.activeDate.day;
                                return html`<div role="gridcell" aria-selected=${selected ? 'true' : 'false'}>${
                                    day >= 1 && day <= daysInMonth
                                        ? this._renderDayCell(
                                              year,
                                              month,
                                              day,
                                              currentMonth && day === todayDay,
                                              selected,
                                              this.entrySumByDay[
                                                  dateSlotKey({ year, month, day })
                                              ] ?? 0,
                                              daysInMonth,
                                              format.eventCount,
                                          )
                                        : nothing
                                }</div>`;
                            })}
                        </div>`;
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
        daysInMonth: number,
        countLabel: (count: number) => string,
    ) {
        const classes = ['day-cell'];
        if (isCurrent) classes.push('current');
        if (isSelected) classes.push('selected');

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
                data-date=${dateSlotKey({ year, month, day })}
                tabindex=${!this._weekFocus?.startsWith(`${year}-${month}-`) && day === (this._focusedDate?.month === month && this._focusedDate.year === year ? this._focusedDate.day : Math.min(this.activeDate.day, daysInMonth)) ? 0 : -1}
                aria-current=${isCurrent ? 'date' : 'false'}
                @focus=${() => {
                    this._focusedDate = { year, month, day };
                    this._weekFocus = undefined;
                }}
                @keydown=${this._handleDateKeydown}
                @click=${() => this._handleDrill(year, month, day, this.drillTarget)}
                aria-label="${formatLocalizedDate(day, month, year, this.locale)}, ${countLabel(eventCount)}"
            >
                <span class="date-number">${this._dateNumberFormat.format(day)}</span>
                <span class="activity-slot" aria-hidden="true">
                    ${
                        eventCount > 0
                            ? this.densityMode === 'count'
                                ? html`<span class="event-count">${this._numberFormat.format(eventCount)}</span>`
                                : html`
                                      <span class="activity-mark"></span>
                                  `
                            : nothing
                    }
                </span>
            </button>
        `;
    }

    public async focusDate(date: CalendarDate = this.activeDate) {
        this._focusedDate = date;
        this._weekFocus = undefined;
        await this.updateComplete;
        const button = this.renderRoot.querySelector<HTMLButtonElement>(
            `[data-date="${dateSlotKey(date)}"]`,
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

    private _handleDrill(year: number, month: number, day: number, drillTarget: DrillTarget) {
        this.dispatchEvent(
            new CustomEvent('expand', {
                detail: { date: { year, month, day }, drillTarget },
                bubbles: true,
                composed: true,
            }),
        );
    }
}
