import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import {
    formatLocalizedDate,
    getLocalizedDayMonth,
    getLocalizedWeekdayShort,
} from '../lib/localization.js';
import { getMessageFormatters, normalizeLocale } from '../lib/messages.js';
import {
    type FirstDayOfWeek,
    getMonthCalendarArray,
    getWeekdayOrder,
} from '../lib/weekStartHelper.js';
import { CurrentDateController } from './CurrentDateController.js';
import { dateKey, keyboardDate } from './dateNavigation.js';

@customElement('lms-calendar-month')
export default class Month extends LitElement {
    @property({ attribute: false }) activeDate: CalendarDate = (() => {
        const now = new Date();
        return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    })();
    @property({ type: Number }) firstDayOfWeek: FirstDayOfWeek = 1;
    @property({ type: String }) locale = 'en';
    @property({ type: Number }) localeVersion = 0;
    /** Optional ceiling; by default the available cell height determines density. */
    @property({ type: Number }) maxVisibleRows?: number;
    /** Counts for dates represented by summaries rather than slotted entries. */
    @property({ attribute: false }) entryCounts: Readonly<Record<string, number>> = {};
    @state() private _focusedDate?: CalendarDate;
    @state() private _displayDate?: CalendarDate;
    @state() private _counts: Record<string, number> = {};
    @state() private _summaries: Record<string, boolean> = {};
    @state() private _hiddenCounts: Record<string, number> = {};
    private _today = new CurrentDateController(this);
    private _resizeObserver?: ResizeObserver;
    private _frame = 0;

    static override styles = css`
        :host {
            display: block;
            flex: 1;
            min-height: 0;
            min-inline-size: 0;
        }
        .month {
            height: 100%;
            display: grid;
            /* Keep weekday labels in their own intrinsic track, even in a short embed. */
            grid-template-rows: min-content repeat(6, minmax(calc(3em + 1px), 1fr));
            overflow: auto;
            border-top: 1px solid var(--separator-light);
        }
        .week,
        .weekdays {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
            /* At enlarged text sizes preserve readable cells in this 2-D view
               rather than clipping month labels and event-count controls. */
            min-inline-size: 17.5em;
            min-height: 0;
        }
        .weekday {
            text-align: center;
            font-size: 0.8em;
            padding-block: 0.25em;
        }
        .day {
            position: relative;
            display: flex;
            flex-direction: column;
            min-width: 0;
            min-height: 0;
            overflow: hidden;
            border-block-end: 1px solid var(--separator-light);
            border-inline-end: 1px solid var(--separator-light);
        }
        .day:last-child {
            border-inline-end: none;
        }
        button {
            font: inherit;
            color: inherit;
            background: transparent;
            border: 0;
            cursor: pointer;
            min-block-size: 24px;
            min-inline-size: 24px;
        }
        button:focus-visible {
            outline: 2px solid var(--entry-focus-color, Highlight);
            outline-offset: -2px;
        }
        .indicator {
            align-self: flex-start;
            flex-shrink: 0;
            margin: 0;
            padding: 0 0.35em;
            text-align: start;
            border-radius: var(--month-indicator-border-radius);
            white-space: nowrap;
        }
        .indicator.month-boundary {
            font-size: 0.85em;
            padding-inline: 0.2em;
        }
        .indicator.current {
            color: var(--indicator-color, var(--primary-color));
            font-weight: var(--indicator-font-weight, bold);
            text-decoration: underline;
        }
        .entries {
            display: grid;
            grid-auto-rows: max(24px, var(--all-day-row-height, 1.5rem));
            gap: var(--month-day-gap, 1px);
            min-height: 0;
            flex: 1;
            overflow: hidden;
            align-content: start;
        }
        slot {
            display: contents;
        }
        ::slotted(lms-calendar-entry) {
            grid-row: calc(var(--all-day-row, var(--month-entry-row, 0)) + 1);
            grid-column: 1;
            width: 100%;
            margin: 0;
            min-block-size: 24px;
            max-block-size: max(24px, var(--all-day-row-height, 1.5rem));
        }
        ::slotted([data-month-overflow]) {
            display: none !important;
        }
        .summary {
            flex-shrink: 0;
            align-self: flex-start;
            max-inline-size: calc(100% - 4px);
            margin: 0 2px;
            padding: 0.1em 3px;
            text-align: center;
            border: 1px solid var(--separator-mid, var(--separator-light));
            border-radius: var(--border-radius-sm, 4px);
            background: var(--entry-month-background, var(--separator-light));
            color: var(--text-color, CanvasText);
            font-size: 0.75em;
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .summary::before {
            content: '';
            display: inline-block;
            inline-size: 4px;
            block-size: 4px;
            margin-inline-end: 3px;
            vertical-align: middle;
            border-radius: 50%;
            background: var(--primary-color, currentColor);
        }
        .summary:hover {
            background: var(--hover-bg, var(--separator-light));
        }
        .summary[hidden] {
            display: none;
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
            .month {
                grid-template-rows: min-content repeat(6, minmax(calc(4em + 1px), 1fr));
            }
            .indicator,
            .summary {
                min-block-size: 32px;
            }
        }
        @media (forced-colors: active) {
            button:focus-visible {
                outline-color: Highlight;
            }
            .current {
                border: 1px solid CanvasText;
            }
        }
    `;

    override willUpdate(changed: Map<string, unknown>) {
        if (changed.has('activeDate')) {
            this._displayDate = undefined;
            this._focusedDate = this.activeDate;
        }
    }

    override connectedCallback() {
        super.connectedCallback();
        void this.updateComplete.then(() => {
            if (this.isConnected) this._observe();
        });
    }
    override disconnectedCallback() {
        super.disconnectedCallback();
        this._resizeObserver?.disconnect();
        this._resizeObserver = undefined;
        cancelAnimationFrame(this._frame);
        this._frame = 0;
        for (const entry of this.querySelectorAll('[data-month-overflow]'))
            entry.removeAttribute('data-month-overflow');
    }
    private _observe() {
        if (this._resizeObserver) return;
        this._resizeObserver = new ResizeObserver(() => this._scheduleEntries());
        this._resizeObserver.observe(this);
        this._scheduleEntries();
    }
    override updated() {
        this._scheduleEntries();
    }
    private _scheduleEntries = () => {
        if (this._frame || !this.isConnected) return;
        this._frame = requestAnimationFrame(() => {
            this._frame = 0;
            this._syncEntries();
        });
    };
    private _syncEntries() {
        const counts: Record<string, number> = {};
        const summaries: Record<string, boolean> = {};
        const hiddenCounts: Record<string, number> = {};
        for (const cell of this.renderRoot.querySelectorAll<HTMLElement>('.day')) {
            const key = cell.dataset.date!;
            const slots = cell.querySelectorAll('slot');
            const entries = slots[0]
                .assignedElements()
                .filter((el): el is HTMLElement => el instanceof HTMLElement);
            const area = cell.querySelector<HTMLElement>('.entries')!;
            const rowHeight = parseFloat(getComputedStyle(area).gridAutoRows) || 24;
            const gap = parseFloat(getComputedStyle(area).rowGap) || 0;
            const projectedSummary = slots[1]
                .assignedNodes()
                .some((node) => node.nodeType === Node.ELEMENT_NODE || !!node.textContent?.trim());
            const rows = entries.map((entry, index) => {
                const explicit = entry.style.getPropertyValue('--all-day-row');
                const legacyOrder = entry.style.order;
                const value = explicit
                    ? Number(explicit)
                    : legacyOrder
                      ? Number(legacyOrder)
                      : index;
                return Number.isFinite(value) && value >= 0 ? Math.floor(value) : index;
            });
            const indicator = cell.querySelector<HTMLElement>('.indicator')!;
            const summary = cell.querySelector<HTMLElement>('.summary')!;
            const indicatorStyle = getComputedStyle(indicator);
            const summaryStyle = getComputedStyle(summary);
            const margins = (style: CSSStyleDeclaration) =>
                (parseFloat(style.marginBlockStart) || 0) + (parseFloat(style.marginBlockEnd) || 0);
            const available = Math.max(
                0,
                cell.clientHeight - indicator.offsetHeight - margins(indicatorStyle),
            );
            const ceiling = Number.isFinite(this.maxVisibleRows)
                ? Math.max(0, Math.floor(this.maxVisibleRows!))
                : Number.POSITIVE_INFINITY;
            const fit = (height: number) =>
                Math.max(0, Math.min(ceiling, Math.floor((height + gap) / (rowHeight + gap))));
            // Decide overflow before reserving a footer. Measuring the flexed entries
            // area would create a feedback loop as the footer appears/disappears.
            let capacity = fit(available);
            if (projectedSummary || rows.some((row) => row >= capacity)) {
                const footerHeight =
                    Math.max(summary.offsetHeight, parseFloat(summaryStyle.minBlockSize) || 24) +
                    margins(summaryStyle);
                capacity = fit(available - footerHeight);
            }
            let hidden = 0;
            entries.forEach((entry, index) => {
                entry.style.setProperty('--month-entry-row', String(rows[index]));
                const overflow = rows[index] >= capacity;
                entry.toggleAttribute('data-month-overflow', overflow);
                if (overflow) hidden++;
            });
            counts[key] = entries.length;
            hiddenCounts[key] = hidden;
            summaries[key] = projectedSummary;
        }
        if (JSON.stringify(counts) !== JSON.stringify(this._counts)) this._counts = counts;
        if (JSON.stringify(summaries) !== JSON.stringify(this._summaries))
            this._summaries = summaries;
        if (JSON.stringify(hiddenCounts) !== JSON.stringify(this._hiddenCounts))
            this._hiddenCounts = hiddenCounts;
    }

    public async focusDate(date: CalendarDate = this.activeDate) {
        this._focusedDate = date;
        await this.updateComplete;
        const button = this.renderRoot.querySelector<HTMLButtonElement>(
            `button[data-date="${dateKey(date)}"]`,
        );
        button?.focus();
        button?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    override render() {
        const dates = getMonthCalendarArray(
            this._displayDate ?? this.activeDate,
            this.firstDayOfWeek,
        );
        const today = this._today.date;
        const current = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const focused = dateKey(this._focusedDate ?? this.activeDate);
        const format = getMessageFormatters(this.locale);
        const number = new Intl.NumberFormat(normalizeLocale(this.locale));
        return html`<div class="month" role="grid" aria-label=${formatLocalizedDate(1, (this._displayDate ?? this.activeDate).month, (this._displayDate ?? this.activeDate).year, this.locale)}>
            <div class="weekdays" role="row">${getWeekdayOrder(this.firstDayOfWeek).map((day) => html`<span class="weekday" role="columnheader">${getLocalizedWeekdayShort(day, this.locale)}</span>`)}</div>
            ${Array.from(
                { length: 6 },
                (_, week) => html`<div class="week" role="row">
                ${repeat(dates.slice(week * 7, week * 7 + 7), dateKey, (date) => {
                    const key = dateKey(date);
                    const isToday = key === current;
                    const count = this.entryCounts[key] ?? this._counts[key] ?? 0;
                    const hiddenCount = this._hiddenCounts[key] ?? 0;
                    const dateLabel = formatLocalizedDate(
                        date.day,
                        date.month,
                        date.year,
                        this.locale,
                    );
                    const overflowLabel = `+${number.format(hiddenCount)}`;
                    return html`<div class="day" role="gridcell" data-date=${key} @click=${this._backgroundClick}>
                        <button type="button" class="indicator ${isToday ? 'current' : ''} ${date.day === 1 ? 'month-boundary' : ''}" data-date=${key}
                            tabindex=${key === focused ? 0 : -1} aria-current=${isToday ? 'date' : 'false'}
                            aria-label=${formatLocalizedDate(date.day, date.month, date.year, this.locale)}
                            @focus=${() => {
                                this._focusedDate = date;
                            }} @keydown=${this._handleKeydown} @click=${this._activateDate}>
                            ${date.day === 1 ? getLocalizedDayMonth(date.day, date.month, date.year, this.locale) : date.day}
                        </button>
                        <div class="entries"><slot name=${key} @slotchange=${this._scheduleEntries}></slot></div>
                        <button type="button" class="summary" ?hidden=${!hiddenCount && !this._summaries[key]} data-date=${key}
                            @click=${this._activateSummary}
                            aria-labelledby=${`summary-label-${key} summary-date-${key}`}
                            aria-describedby=${count ? `summary-description-${key}` : nothing}>
                            <span id=${`summary-label-${key}`}><slot name=${`summary-${key}`} @slotchange=${this._scheduleEntries}>${overflowLabel}</slot></span>
                            <span class="sr-only" id=${`summary-date-${key}`}>${dateLabel}</span>
                            <span class="sr-only" id=${`summary-description-${key}`}>${count ? format.dateSummary(dateLabel, count) : ''}</span>
                        </button>
                    </div>`;
                })}
            </div>`,
            )}
        </div>`;
    }
    private _dateFromElement(element: HTMLElement): CalendarDate {
        const [year, month, day] = element.dataset.date!.split('-').map(Number);
        return { year, month, day };
    }
    private _emitDate(type: 'expand' | 'date-summary', date: CalendarDate) {
        this.dispatchEvent(
            new CustomEvent(type, { detail: { date }, bubbles: true, composed: true }),
        );
    }
    private _activateDate(event: Event) {
        event.stopPropagation();
        this._emitDate('expand', this._dateFromElement(event.currentTarget as HTMLElement));
    }
    private _activateSummary(event: Event) {
        event.stopPropagation();
        this._emitDate('date-summary', this._dateFromElement(event.currentTarget as HTMLElement));
    }
    private _backgroundClick(event: Event) {
        if (
            event
                .composedPath()
                .some(
                    (node) =>
                        node instanceof HTMLElement &&
                        (node.tagName === 'LMS-CALENDAR-ENTRY' || node.tagName === 'BUTTON'),
                )
        )
            return;
        this._emitDate('expand', this._dateFromElement(event.currentTarget as HTMLElement));
    }
    private async _handleKeydown(event: KeyboardEvent) {
        const date = this._dateFromElement(event.currentTarget as HTMLElement);
        const next = keyboardDate(
            event,
            date,
            this.firstDayOfWeek,
            getComputedStyle(this).direction === 'rtl',
        );
        if (!next) return;
        event.preventDefault();
        const dates = getMonthCalendarArray(
            this._displayDate ?? this.activeDate,
            this.firstDayOfWeek,
        );
        if (
            event.key === 'PageUp' ||
            event.key === 'PageDown' ||
            !dates.some((candidate) => dateKey(candidate) === dateKey(next))
        ) {
            this._displayDate = next;
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
}
