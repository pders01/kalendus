import { LitElement, css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
    formatLocalizedDate,
    formatLocalizedTime,
    formatLocalizedTimeRange,
} from '../lib/localization.js';
import { getMessages, getMessageFormatters } from '../lib/messages.js';
import type { CalendarDateInterval, CalendarEntry } from '../lms-calendar.js';
import { entryDisplayEndDate, isAllDayExport } from './entryExport.js';

/** Generated compatibility labels are not explicit inspector overrides. */
export const generatedDisplayDates = new WeakMap<object, string>();

/**
 * Calendar entry component with accessibility and interaction support
 *
 * @prop {Object} accessibility - Accessibility configuration for tab order and ARIA attributes
 */
@customElement('lms-calendar-entry')
export default class Entry extends LitElement {
    @property({ attribute: false })
    time?: CalendarTimeInterval;

    @property()
    heading = '';

    @property()
    content?: string;

    @property({ type: Boolean })
    isContinuation = false;

    @property({ type: Object }) date?: CalendarDateInterval;

    /** The original event, never a displayed day slice. */
    @property({ attribute: false }) canonicalEntry?: CalendarEntry;
    @property({ type: String }) eventId?: string;

    @property({ type: String, reflect: true, attribute: 'data-density' })
    density: 'compact' | 'standard' | 'full' = 'standard';

    @property({ type: String, reflect: true, attribute: 'data-display-mode' })
    displayMode: 'default' | 'month-dot' | 'month-span' | 'time-mark' = 'default';

    @property({ type: Boolean, reflect: true, attribute: 'data-float-text' })
    floatText = false;

    @property({ type: Object, attribute: false })
    accessibility?: { tabIndex: number; role: 'button'; ariaLabel: string };

    @property({ type: String })
    locale = 'en';

    @property({ type: Number })
    localeVersion = 0;

    @state()
    _highlighted?: boolean;

    /**
     * Check if a time interval represents an all-day event.
     * Handles both 0:00-24:00 and 0:00-23:59 formats.
     */
    private _isAllDayTime(time?: CalendarTimeInterval): boolean {
        if (!time) return true;
        const { start, end } = time;
        return (
            (start.hour === 0 && start.minute === 0 && end.hour === 24) ||
            (start.hour === 0 && start.minute === 0 && end.hour === 23 && end.minute === 59)
        );
    }

    private _isAllDayEntry(): boolean {
        return this.canonicalEntry
            ? isAllDayExport(this.canonicalEntry)
            : this.date
              ? isAllDayExport({
                    date: this.date,
                    time: this.time,
                    heading: this.heading,
                    isContinuation: this.isContinuation,
                })
              : this.isContinuation || this._isAllDayTime(this.time);
    }

    static override styles = css`
        :host {
            /* Use shared design tokens from root component */
            font-size: var(--entry-font-size);
            line-height: var(--entry-line-height);
            font-family: var(--system-ui, inherit);
            contain: layout style;

            grid-column: 2;
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius);
            grid-row: var(--start-slot);
            width: var(--_span-width, var(--entry-width, 100%));
            margin-inline-start: var(--entry-margin-inline-start, var(--entry-margin-left, 0));
            background-color: var(--entry-background-color);
            color: var(--entry-readable-color, var(--text-color, CanvasText));
            border: var(--entry-border, none);
            /* When a handle is present, remove the start border so the
               ::before handle covers the full start edge without bleed */
            border-inline-start: var(
                --entry-border-inline-start,
                var(--entry-border-left, var(--entry-border, none))
            );
            /* z-index of separators in day view is 0 */
            z-index: var(--entry-z-index, 1);
            opacity: var(--entry-opacity, 1);
            box-sizing: border-box;
            padding-bottom: 1px;
            min-height: max(24px, var(--entry-min-height, 24px));
            min-inline-size: 24px;
            overflow: hidden;
            position: relative;
        }

        /* Color handle indicator on the start edge — absolutely positioned
           so it doesn't affect content width or title visibility */
        :host::before {
            content: '';
            position: absolute;
            inset-inline-start: 0;
            top: 0;
            bottom: 0;
            width: var(--entry-handle-width, 0px);
            background-color: var(--entry-handle-color, transparent);
            /* No border-radius — host's overflow:hidden clips to rounded corners */
            border-radius: 0;
            display: var(--entry-handle-display, none);
        }

        :host(:last-child) {
            padding-bottom: 0;
        }

        .main {
            padding: var(--entry-padding);
            padding-top: calc(var(--entry-padding-top, 0px) + 0.15em);
            border-radius: var(--entry-border-radius);
            text-align: start;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: var(--entry-layout);
            align-items: var(--entry-align); /* Use shared design token */
            justify-content: flex-start; /* Always align content to start */
            gap: var(--entry-gap);
            overflow: visible;
            position: relative;
        }

        /* Compact grouped content - don't stretch to fill height */
        .main.compact,
        .main.standard {
            height: auto; /* Use natural content height instead of 100% */
            min-height: var(--entry-min-height, 1.2em);
        }

        /* When handle design is used, adjust padding for the colored handle */
        .main {
            padding-inline-start: var(--entry-padding-inline-start, var(--entry-padding-left, 0.25em));
        }

        .text-content {
            position: absolute;
            top: var(--entry-text-top, -20px);
            inset-inline-start: var(--entry-text-inline-start, var(--entry-text-left, 0));
            background: var(--float-text-bg);
            padding: 2px 6px;
            border-radius: var(--float-text-border-radius);
            box-shadow: var(--float-text-shadow);
            font-size: 0.7rem;
            z-index: 1000;
            white-space: nowrap;
            pointer-events: auto;
            line-height: 1.2;
        }

        /* Timed cards keep their actual range even at the readable height floor.
           Related text stays clustered; a narrow lane may stack whole labels. */
        .main.compact {
            flex-direction: row;
            flex-wrap: wrap;
            align-items: baseline;
            gap: 0.15em 0.5em;
        }

        /* Title first, metadata second. Wrap intrinsically within the entry, never
           squeeze the heading to zero to keep a time label on the same line. */
        .main.standard {
            flex-direction: var(--entry-layout, row);
            flex-wrap: wrap;
            align-items: baseline;
            gap: 0.15em 0.5em;
        }

        .main.standard .title {
            min-inline-size: min(100%, 8ch);
        }

        /* Full mode: multi-line with all content */
        .main.full {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.1em;
        }

        .title {
            max-inline-size: 100%;
            flex: 0 1 auto;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: var(--entry-title-wrap);
            font-weight: var(--entry-title-weight, inherit);
        }

        .main:has(.timed-label) .title {
            font-weight: var(--entry-title-weight, 600);
        }

        .time {
            max-inline-size: 100%;
            font-family: var(--entry-font-family, inherit);
            font-size: max(0.75rem, var(--entry-time-font-size, 0.85em));
            font-variant-numeric: tabular-nums;
            opacity: var(--entry-time-opacity);
            white-space: nowrap;
            flex-shrink: 0;
            margin-inline-start: 0;
        }

        /* Let the measured text, not a width breakpoint, decide whether the
           end fits. The dash and end wrap together below the visible line. */
        .timed-label {
            display: inline-flex;
            flex-wrap: wrap;
            gap: 1px 0.25em;
            block-size: 1lh;
            overflow: clip;
        }

        :host(:dir(rtl)) .timed-label {
            justify-content: end;
        }

        /* Month view dot indicator styles */
        :host([data-display-mode='month-dot']) {
            background: var(--entry-month-background);
            padding: var(--entry-month-padding);
            border-radius: 0;
            color: var(
                --entry-readable-color,
                var(--entry-month-text-color, var(--text-color, CanvasText))
            );
            position: relative;
            z-index: 1;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
            overflow: hidden;
            contain: style;
            height: var(--all-day-row-height, max(24px, 1.5rem));
            max-height: 100%;
            min-height: 24px;
        }

        /* Multi-day events keep their background in month view */
        :host([data-display-mode='month-dot'][data-is-continuation='true']),
        :host([data-display-mode='month-dot']) .main[data-is-multi-day='true'] {
            background: var(--entry-background-color);
            border-radius: var(--border-radius-sm);
            color: var(--entry-readable-color, var(--text-color, CanvasText));
        }

        /* Reuse the single start-edge accent, including consumer-provided handles.
           A second decorative dot would spend space without adding information. */
        :host([data-display-mode='month-dot'])::before {
            width: var(--entry-handle-width, 2px);
            display: var(--entry-handle-display, block);
            background-color: var(--entry-handle-color, var(--entry-color, currentColor));
        }

        :host([data-display-mode='month-dot']) .main {
            padding: 0;
            padding-inline-start: calc(var(--entry-handle-width, 2px) + 0.35em);
        }
        :host([data-display-mode='month-dot']) .main:has(.time) {
            grid-template-columns: auto minmax(0, 1fr);
        }

        :host([data-display-mode='month-dot']) .time {
            font-family: var(--entry-time-font, var(--monospace-ui, inherit));
            text-align: var(--entry-time-align);
        }

        /* Month view connected bar styles for all-day/multi-day events */
        :host([data-display-mode='month-span']) {
            background: var(--entry-background-color);
            border: var(--entry-border, 1px solid transparent);
            border-radius: var(--entry-border-radius, 3px);
            color: var(--entry-readable-color, var(--text-color, CanvasText));
            position: relative;
            z-index: 1;
            width: calc(100% + 2px);
            min-width: 0;
            box-sizing: border-box;
            overflow: hidden;
            height: var(--all-day-row-height, max(24px, 1.5rem));
            min-height: 24px;
            max-height: var(--all-day-row-height, max(24px, 1.5rem));
            font-size: var(--entry-font-size, 0.75rem);
            padding: 0;
            margin-inline-start: -1px;
            margin-inline-end: -1px;
            contain: style;
        }

        :host([data-display-mode='month-span']) .main {
            padding: 0 0.5em;
        }

        :host([data-display-mode='month-span']) .title {
            font-weight: 500;
        }

        /* Spanning classes for connected multi-day bars */
        :host([data-display-mode='month-span'].first-day) {
            border-start-end-radius: 0;
            border-end-end-radius: 0;
            margin-inline-end: -3px;
        }

        :host([data-display-mode='month-span'].middle-day) {
            border-radius: 0;
            margin-inline-start: -3px;
            margin-inline-end: -3px;
            border-inline-start: none;
        }

        :host([data-display-mode='month-span'].last-day) {
            border-start-start-radius: 0;
            border-end-start-radius: 0;
            margin-inline-start: -3px;
            border-inline-start: none;
        }

        :host([data-display-mode='month-span'].single-day) {
            border-radius: var(--entry-border-radius, 3px);
        }

        /* Only the first visible slice of each weekly span carries a visual title.
           Keep the complete DOM text/name, and reveal it again on keyboard focus. */
        :host([data-display-mode='month-span'].middle-day:not(:focus-visible)) .title,
        :host([data-display-mode='month-span'].last-day:not(:focus-visible)) .title {
            visibility: hidden;
        }

        :host(.open-start) {
            border-start-start-radius: 0;
            border-end-start-radius: 0;
            border-inline-start: none;
        }
        :host(.open-start)::before {
            display: none;
        }
        :host(.open-end) {
            border-start-end-radius: 0;
            border-end-end-radius: 0;
            border-inline-end: none;
        }

        .content {
            font-size: 0.9em;
            opacity: 0.9;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        /* Responsive behavior based on available height */
        :host([data-height='compact']) .main {
            flex-direction: row;
            align-items: center;
        }

        :host([data-height='standard']) .main {
            flex-direction: row;
            align-items: flex-start;
        }

        :host([data-height='full']) .main {
            flex-direction: column;
            align-items: flex-start;
        }

        :host([data-height='full']) .title {
            white-space: normal;
            word-wrap: break-word;
        }

        /* Center the row, not each label: different sizes share one baseline. */
        :host([data-display-mode^='month-']) .main {
            display: grid;
            align-items: baseline;
            align-content: center;
            grid-template-columns: minmax(0, 1fr);
            gap: 0.5em;
            height: 100%;
            min-height: 0;
            overflow: hidden;
        }
        :host([data-display-mode^='month-']) :is(.title, .time) {
            color: inherit;
            white-space: nowrap;
            line-height: 1.2;
            min-inline-size: 0;
        }

        /* ── Interactive state overrides ──────────────────────────
           Placed last so they beat all display-mode rules (equal
           specificity, later source order wins).
           No outline:none — the browser's native focus ring shows
           by default; themes can suppress it when setting
           --entry-focus-color. */
        :host([data-highlighted]) {
            background: var(--entry-highlight-color);
        }

        :host([data-highlighted]) {
            box-shadow: inset 0 0 0 2px var(--entry-focus-color);
            z-index: 999 !important;
        }

        :host(:focus-visible) {
            outline: 2px solid var(--entry-focus-color, currentColor);
            outline-offset: -2px;
            z-index: 999 !important;
        }
        .time,
        :host([data-display-mode='month-dot']) .time {
            opacity: 1;
        }
        /* Comparison variant: the host is a collision/interaction envelope,
           not a duration rectangle. Only the separate mark encodes time. */
        :host([data-display-mode='time-mark']) {
            background: transparent;
            border: 0;
            border-radius: 0;
            overflow: visible;
            padding: 0;
            pointer-events: none;
        }
        :host([data-display-mode='time-mark'])::before {
            display: none;
        }
        :host([data-display-mode='time-mark']) .main {
            margin-inline-start: 1em;
            inline-size: calc(100% - 1em);
            padding: 0.2em 0.3em;
            border: 1px solid var(--separator-light, GrayText);
            background: var(--background-color, Canvas);
            color: var(--text-color, CanvasText);
            pointer-events: auto;
            min-block-size: max(24px, var(--entry-min-height, 24px));
            transform: translateY(var(--entry-label-offset, 0px));
        }
        .label-leader {
            position: absolute;
            inset-inline-start: 9px;
            inset-block-start: var(--entry-label-offset, 0px);
            block-size: calc(-1 * var(--entry-label-offset, 0px));
            inline-size: calc(1em - 9px);
            border-inline-start: 1px dashed currentColor;
            border-block-start: 1px solid currentColor;
            color: var(--text-color, CanvasText);
            pointer-events: none;
        }
        .duration-mark {
            position: absolute;
            inset-block-start: 0;
            inset-inline-start: 2px;
            inline-size: 5px;
            color: var(--entry-handle-color, var(--entry-color, currentColor));
            background: currentColor;
            pointer-events: none;
        }
        .duration-mark::before,
        .duration-mark::after {
            content: '';
            position: absolute;
            inset-inline-start: -2px;
            inline-size: 9px;
            block-size: 1px;
            background: currentColor;
        }
        .duration-mark::before {
            inset-block-start: 0;
        }
        .duration-mark::after {
            inset-block-end: 0;
        }
        .duration-mark[data-point]::before {
            inset-block-start: -3px;
            inline-size: 7px;
            block-size: 7px;
            transform: rotate(45deg);
        }
        .duration-mark[data-point]::after {
            display: none;
        }
        :host([data-display-mode='time-mark'][data-highlighted]),
        :host([data-display-mode='time-mark']:focus-visible) {
            outline: none;
            box-shadow: none;
            background: transparent;
        }
        :host([data-display-mode='time-mark'][data-highlighted]) .main,
        :host([data-display-mode='time-mark']:focus-visible) .main {
            outline: 2px solid var(--entry-focus-color, Highlight);
            outline-offset: -2px;
        }
        @media (pointer: coarse) {
            :host([data-display-mode='time-mark']) .main {
                min-block-size: max(44px, var(--entry-min-height, 44px));
            }
        }
        @media (forced-colors: active) {
            :host {
                border: 1px solid CanvasText;
            }
            :host([data-display-mode='time-mark']) {
                border: 0;
            }
            .duration-mark {
                color: CanvasText;
                background: CanvasText;
            }
            :host([data-highlighted]),
            :host(:focus-visible) {
                outline: 2px solid Highlight;
                outline-offset: -2px;
            }
        }
    `;

    private _renderTitle() {
        return this.content == null ? this.heading : `${this.heading}: ${this.content}`;
    }

    private _renderTime() {
        const msg = getMessages(this.locale);

        // The band already labels these events as all-day.
        if (this.slot === 'all-day' || this.slot.startsWith('all-day-')) return nothing;

        // Month-dot mode: show "All Day" or start time
        if (this.displayMode === 'month-dot') {
            if (this._isAllDayEntry()) return html`<span class="time">${msg.allDay}</span>`;
            if (!this.time) return html`<span class="time">${msg.noTime}</span>`;

            const startTime = formatLocalizedTime(
                this.time.start.hour,
                this.time.start.minute,
                this.locale,
            );
            return startTime ? html`<span class="time">${startTime}</span>` : nothing;
        }

        if (this._isAllDayEntry()) return html`<span class="time">${msg.allDay}</span>`;
        if (!this.time) return nothing;

        if (this.displayMode === 'default' && this.slot.startsWith('timed') && !this.floatText) {
            const { start, end } = this.time;
            const first = formatLocalizedTime(start.hour, start.minute, this.locale);
            const point = start.hour === end.hour && start.minute === end.minute;
            return html`<span class="time timed-label" dir="ltr" aria-hidden="true"><bdi>${first}</bdi>${
                point
                    ? nothing
                    : html` <span>– <bdi>${formatLocalizedTime(end.hour, end.minute, this.locale)}</bdi></span>`
            }</span>`;
        }

        const range = formatLocalizedTimeRange(
            this.time.start.hour,
            this.time.start.minute,
            this.time.end.hour,
            this.time.end.minute,
            this.locale,
        );
        return html`<span class="time">${range}</span>`;
    }

    private _renderContent() {
        if (this.density === 'full' && this.content) {
            return html`<span class="content">${this.content}</span>`;
        }
        return nothing;
    }

    private _getAriaLabel(): string {
        const msg = getMessages(this.locale);

        const timeInfo = this._isAllDayEntry()
            ? msg.allDay
            : this.time
              ? formatLocalizedTimeRange(
                    this.time.start.hour,
                    this.time.start.minute,
                    this.time.end.hour,
                    this.time.end.minute,
                    this.locale,
                )
              : msg.noTime;

        const context = this.accessibility?.ariaLabel?.replace(msg.pressToOpen, '').trim();
        return context?.includes(this.heading) && this.heading
            ? context
            : `${this.heading || msg.noTitle}, ${context || timeInfo}`;
    }

    override updated() {
        // Sync interactive attributes to :host so the focus outline wraps the
        // full absolutely-positioned entry, not just the inner .main content.
        this.tabIndex = this.accessibility?.tabIndex === -1 ? -1 : 0;
        this.setAttribute('role', 'button');
        this.setAttribute('aria-label', this._getAriaLabel());
        this.setAttribute('aria-haspopup', 'dialog');
        this.setAttribute('aria-description', getMessages(this.locale).pressToOpen);
        this.removeAttribute('aria-selected');
        this.toggleAttribute('data-highlighted', !!this._highlighted);
    }

    override render(): TemplateResult<1> {
        const mainClass = `main ${this.density}`;

        if (this.displayMode === 'month-dot') {
            const isMultiDay = this.isContinuation;
            return html`
                <div
                    class=${mainClass}
                    title=${this._renderTitle()}
                    data-full-content=${this.content || ''}
                    ?data-is-multi-day=${isMultiDay}
                >
                    ${this._renderTime()}
                    <span class="title">${this.heading}</span>
                </div>
            `;
        }

        if (this.displayMode === 'month-span') {
            return html`
                <div
                    class=${mainClass}
                    title=${this._renderTitle()}
                    data-full-content=${this.content || ''}
                >
                    <span class="title">${this.heading}</span>
                </div>
            `;
        }

        if (this.displayMode === 'time-mark' && this.time && !this._isAllDayEntry()) {
            const { start, end } = this.time;
            const minutes = (end.hour - start.hour) * 60 + end.minute - start.minute;
            return html`
                <span class="label-leader" aria-hidden="true"></span>
                <span class="duration-mark" aria-hidden="true" ?data-point=${minutes === 0}
                    style=${`block-size: calc(${minutes} * var(--minute-height, 0.8px))`}></span>
                <div class=${mainClass} title=${this._renderTitle()} data-full-content=${this.content || ''}>
                    <span class="title">${this.heading}</span>
                    ${this._renderTime()}
                </div>
            `;
        }

        // Float text mode: render box with floating text above
        if (this.floatText) {
            return html`
                <div
                    class=${mainClass}
                    style="background-color: var(--entry-background-color); height: 100%; position: relative; overflow: visible;"
                >
                    <div class="text-content">
                        <span style="font-weight: var(--entry-title-weight, inherit);">${this.heading}</span>
                        ${this._renderTime()}
                    </div>
                </div>
            `;
        }

        return html`
            <div
                class=${mainClass}
                title=${this._renderTitle()}
                data-full-content=${this.content || ''}
            >
                <span class="title">${this.heading}</span>
                ${this._renderTime()}
                ${this._renderContent()}
            </div>
        `;
    }

    constructor() {
        super();
        this.addEventListener('click', this._handleInteraction);
        this.addEventListener('keydown', (event: KeyboardEvent) => {
            if (event.key === ' ') {
                event.preventDefault();
                return;
            }
            this._handleInteraction(event);
        });
        this.addEventListener('keyup', (event: KeyboardEvent) => {
            if (event.key === ' ') this._handleInteraction(event);
        });
        this.addEventListener('focus', this._handleFocus);
    }

    /**
     * Public method to clear the selection state
     */
    public clearSelection() {
        this._highlighted = false;
    }

    private _handleFocus(_e: FocusEvent) {
        // When an entry receives focus via keyboard navigation,
        // clear any previously selected entries (but don't open menu)
        const clearSelectionEvent = new CustomEvent('clear-other-selections', {
            detail: { exceptEntry: this },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(clearSelectionEvent);
    }

    private _handleInteraction(e: Event) {
        if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        this._highlighted = true;
        if (!this.date && !this.canonicalEntry) return;

        const msg = getMessages(this.locale);
        const format = getMessageFormatters(this.locale);
        const entry = this.canonicalEntry ?? {
            date: this.date!,
            time: this.time,
            heading: this.heading,
            content: this.content,
            isContinuation: this.isContinuation,
        };
        const dateLabel = (date: CalendarDate) =>
            formatLocalizedDate(date.day, date.month, date.year, this.locale);
        const firstDate = dateLabel(entry.date.start);
        const allDay = isAllDayExport(entry);
        const lastDate = dateLabel(entryDisplayEndDate(entry, allDay));
        const spansDates = firstDate !== lastDate;
        const displayDate = spansDates ? format.timeRange(firstDate, lastDate) : firstDate;
        const time = entry.time;
        let displayTime = allDay ? msg.allDay : msg.noTime;
        if (!allDay && time) {
            const firstTime = formatLocalizedTime(time.start.hour, time.start.minute, this.locale);
            const lastTime = formatLocalizedTime(time.end.hour % 24, time.end.minute, this.locale);
            displayTime = spansDates
                ? format.timeRange(`${firstDate} ${firstTime}`, `${lastDate} ${lastTime}`)
                : format.timeRange(firstTime, lastTime);
            if (entry.timeZone) displayTime += ` (${entry.timeZone})`;
        }
        const eventDetails = {
            heading: entry.heading || msg.noTitle,
            content: entry.content || msg.noContent,
            time,
            displayTime,
            displayDate,
            date: entry.date.start,
            anchorRect:
                (this.displayMode === 'time-mark'
                    ? this.renderRoot.querySelector('.main')
                    : null
                )?.getBoundingClientRect() ?? this.getBoundingClientRect(),
            entry,
            eventId: this.eventId ?? entry.id,
        };
        generatedDisplayDates.set(eventDetails, displayDate);
        this.dispatchEvent(
            new CustomEvent('open-menu', {
                detail: eventDetails,
                cancelable: true,
                bubbles: true,
                composed: true,
            }),
        );
    }
}
