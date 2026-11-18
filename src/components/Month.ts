import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';

import { parseColorWithDefault } from '../lib/colorParser.js';
import {
    formatLocalizedDate,
    getLocalizedDayMonthParts,
    getLocalizedWeekdayShort,
} from '../lib/localization.js';
import { getMessageFormatters, getMessages, normalizeLocale } from '../lib/messages.js';
import type { MonthSpan } from '../lib/monthSpans.js';
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
    /** Compact date units use presence markers; the owner renders contextual events. */
    @property({ type: Boolean, reflect: true }) compact = false;
    @property({ attribute: false }) selectedDate?: CalendarDate;
    /** Decorative continuity tracks; date controls own selection and hit targets. */
    @property({ attribute: false }) spans: readonly (readonly MonthSpan[])[] = [];
    @property({ attribute: false }) trace: readonly MonthSpan['entry'][] = [];
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
            flex: 0 0 auto;
            min-height: 0;
            min-inline-size: 0;
        }
        .month-strip {
            overflow-x: auto;
        }
        .month {
            height: auto;
            min-inline-size: 17.5em;
            display: grid;
            /* Bounded, font-relative week budgets; overflow is disclosed via +N.
               The grid itself belongs to normal document flow, never a scroller. */
            grid-template-rows: min-content repeat(6, max(6em, var(--month-week-height, 6.5em)));
            overflow: visible;
        }
        .week,
        .weekdays {
            display: grid;
            grid-template-columns: repeat(7, minmax(0, 1fr));
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
            box-sizing: border-box;
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
            position: relative;
            align-self: flex-start;
            flex-shrink: 0;
            display: inline-flex;
            align-items: center;
            gap: 0.15em;
            margin: 0;
            padding: 2px 0.25em;
            text-align: start;
            border-radius: var(--month-indicator-border-radius);
            white-space: nowrap;
        }
        .indicator[data-traced-date]::after {
            content: '';
            position: absolute;
            inset-inline: 0;
            inset-block-end: 0;
            border-block-end: 2px solid currentColor;
            pointer-events: none;
        }
        .indicator[data-traced-date~='start']::after {
            inset-inline-start: 0.35em;
        }
        .indicator[data-traced-date~='end']::after {
            inset-inline-end: 0.35em;
        }
        .date-value {
            display: inline-flex;
            justify-content: center;
            align-items: center;
            min-inline-size: max(24px, 1.65em);
            min-block-size: max(24px, 1.65em);
            border-radius: 50%;
        }
        .month-name {
            font-size: 0.75em;
        }
        .day[data-outside-month] .indicator {
            color: var(--header-text-color, inherit);
        }
        .indicator.current .date-value {
            background: var(--current-day-bg, Highlight);
            color: var(--current-day-color, HighlightText);
            font-weight: var(--indicator-font-weight, bold);
        }
        .activity {
            inline-size: 4px;
            block-size: 4px;
            border-radius: 50%;
            background: currentColor;
            visibility: hidden;
        }
        .activity[data-active] {
            visibility: visible;
        }
        .activity[data-count-summary] {
            background: none;
            border-radius: 0;
            inline-size: auto;
            block-size: 1em;
            font-size: max(12px, 0.75em);
            line-height: 1;
        }
        :host([compact]) {
            flex: 0 0 auto;
        }
        :host([compact]) .month {
            min-inline-size: max(19.25em, 308px);
            block-size: auto;
            height: auto;
            grid-template-rows: min-content repeat(6, max(44px, 2.75em));
            padding-block: 0.35em 0.6em;
        }
        .indicator[data-spans] .activity {
            visibility: hidden;
        }
        .span-marks {
            position: absolute;
            inset-inline: 0;
            inset-block-end: 2px;
            block-size: 7px;
            pointer-events: none;
        }
        .span-mark {
            position: absolute;
            inset-inline: 0;
            block-size: 3px;
            box-sizing: border-box;
            border-block-start: 1px solid currentColor;
            background: var(--span-color);
        }
        .span-mark:not([data-before]) {
            inset-inline-start: 6px;
            border-start-start-radius: 2px;
            border-end-start-radius: 2px;
            border-inline-start: 1px solid currentColor;
        }
        .span-mark:not([data-after]) {
            inset-inline-end: 6px;
            border-start-end-radius: 2px;
            border-end-end-radius: 2px;
            border-inline-end: 1px solid currentColor;
        }
        :host([compact]) .day {
            border: 0;
        }
        :host([compact]) .indicator {
            align-self: stretch;
            flex: 1;
            flex-direction: column;
            justify-content: center;
            gap: 3px;
            min-block-size: 44px;
            border-radius: var(--border-radius-sm, 4px);
        }
        .day[aria-selected='true'] .indicator {
            box-shadow: inset 0 0 0 1px var(--primary-color, Highlight);
            background: var(--focus-bg, transparent);
        }
        :host([compact]) .entries {
            display: none;
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
            padding: 0.15em 0.35em;
            text-align: start;
            border: 0;
            border-radius: var(--border-radius-sm, 4px);
            background: transparent;
            color: var(--text-color, CanvasText);
            font-size: 0.75em;
            line-height: 1.2;
            white-space: normal;
            overflow-wrap: anywhere;
            text-decoration: underline;
            text-underline-offset: 0.15em;
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
                grid-template-rows: min-content repeat(6, max(7em, var(--month-week-height, 7em)));
            }
            .indicator,
            .summary {
                min-block-size: 32px;
            }
        }
        @media (forced-colors: active) {
            .span-mark {
                border-color: CanvasText;
                background: CanvasText;
            }
            button:focus-visible {
                outline-color: Highlight;
            }
            .current .date-value {
                background: Highlight;
                color: HighlightText;
                outline: 1px solid CanvasText;
            }
            .day[aria-selected='true'] .indicator {
                outline: 1px solid CanvasText;
                outline-offset: -2px;
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
        const grid = this.renderRoot.querySelector('.month');
        if (grid) this._resizeObserver.observe(grid);
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
            if (this.compact) {
                counts[key] = entries.length;
                hiddenCounts[key] = 0;
                summaries[key] = projectedSummary;
                for (const entry of entries) entry.removeAttribute('data-month-overflow');
                continue;
            }
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

    private _renderSpans(spans: readonly MonthSpan[], column: number) {
        if (!spans.length) return nothing;
        return html`<span class="span-marks" aria-hidden="true">
            ${spans.map((span) => {
                const index = span.entry.continuation.index + column - span.startColumn;
                const [r, g, b] = parseColorWithDefault(span.entry.color);
                return html`<span class="span-mark" data-span-id=${span.entry.sourceId}
                    ?data-before=${index > 0}
                    ?data-after=${index < span.entry.continuation.total - 1}
                    style=${styleMap({ insetBlockStart: `${span.row * 4}px`, '--span-color': `rgb(${r}, ${g}, ${b})` })}></span>`;
            })}
        </span>`;
    }

    override render() {
        const dates = getMonthCalendarArray(
            this._displayDate ?? this.activeDate,
            this.firstDayOfWeek,
        );
        const today = this._today.date;
        const current = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
        const focused = dateKey(this._focusedDate ?? this.activeDate);
        const selected = this.selectedDate ? dateKey(this.selectedDate) : undefined;
        const displayed = this._displayDate ?? this.activeDate;
        const tracedDates = new Set(this.trace.map((entry) => dateKey(entry.date.start)));
        const format = getMessageFormatters(this.locale);
        const number = new Intl.NumberFormat(normalizeLocale(this.locale));
        // Two tracks are a display capacity, not a relevance ranking. Once they
        // cannot show every lifetime, use date totals consistently for the whole
        // displayed compact Month; an aggregate is not a continuous event.
        const countsOnly =
            this.compact && this.spans.some((week) => week.some((span) => span.row > 1));
        return html`${this.trace.length ? html`<span class="sr-only" id="traced-event">${this.trace[0].heading || getMessages(this.locale).noTitle}</span>` : nothing}
        <div class="month-strip"><div class="month" data-span-presentation=${countsOnly ? 'counts' : 'individual'} role="grid" aria-label=${formatLocalizedDate(1, (this._displayDate ?? this.activeDate).month, (this._displayDate ?? this.activeDate).year, this.locale)}>
            <div class="weekdays" role="row">${getWeekdayOrder(this.firstDayOfWeek).map((day) => html`<span class="weekday" role="columnheader">${getLocalizedWeekdayShort(day, this.locale)}</span>`)}</div>
            ${Array.from(
                { length: 6 },
                (_, week) => html`<div class="week" role="row">
                ${repeat(dates.slice(week * 7, week * 7 + 7), dateKey, (date, column) => {
                    const key = dateKey(date);
                    const traced = tracedDates.has(key);
                    const index = week * 7 + column;
                    const traceEdges = traced
                        ? `${column === 0 || !tracedDates.has(dateKey(dates[index - 1])) ? 'start' : ''} ${column === 6 || !tracedDates.has(dateKey(dates[index + 1])) ? 'end' : ''}`
                        : nothing;
                    const spans =
                        this.compact && !countsOnly
                            ? (this.spans[week] ?? []).filter(
                                  (span) => span.startColumn <= column && span.endColumn >= column,
                              )
                            : [];
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
                    const outside = date.month !== displayed.month || date.year !== displayed.year;
                    return html`<div class="day" role="gridcell" data-date=${key} ?data-outside-month=${outside}
                        aria-selected=${ifDefined(selected ? (key === selected ? 'true' : 'false') : undefined)} @click=${this._backgroundClick}>
                        <button type="button" style=${ifDefined(countsOnly ? 'gap:0' : undefined)} class="indicator ${isToday ? 'current' : ''} ${date.day === 1 ? 'month-boundary' : ''}" data-date=${key} ?data-spans=${spans.length > 0}
                            data-traced-date=${traceEdges} aria-describedby=${traced ? 'traced-event' : nothing}
                            tabindex=${key === focused ? 0 : -1} aria-current=${isToday ? 'date' : 'false'}
                            aria-label=${this.compact || this.selectedDate ? `${dateLabel}, ${format.eventCount(count)}` : dateLabel}
                            @focus=${() => {
                                this._focusedDate = date;
                            }} @keydown=${this._handleKeydown} @click=${this._activateDate}>
                            ${
                                !this.compact && date.day === 1
                                    ? getLocalizedDayMonthParts(
                                          date.day,
                                          date.month,
                                          date.year,
                                          this.locale,
                                      ).map((part) =>
                                          part.type === 'day'
                                              ? html`<span class="date-value">${part.value}</span>`
                                              : html`<span class="month-name">${part.value}</span>`,
                                      )
                                    : html`<span class="date-value">${number.format(date.day)}</span>`
                            }
                            ${this.compact ? html`<span class="activity" aria-hidden="true" ?data-active=${count > 0} ?data-count-summary=${countsOnly}>${countsOnly ? number.format(count) : nothing}</span>${this._renderSpans(spans, column)}` : nothing}
                        </button>
                        <div class="entries"><slot name=${key} @slotchange=${this._scheduleEntries}></slot></div>
                        <button type="button" class="summary" ?hidden=${this.compact || (!hiddenCount && !this._summaries[key])} data-date=${key}
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
        </div></div>`;
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
