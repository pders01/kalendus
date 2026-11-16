import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DateTime } from 'luxon';

import {
    formatLocalizedDate,
    formatLocalizedTime,
    formatLocalizedTimeRange,
} from '../lib/localization.js';
import { getMessages, getMessageFormatters } from '../lib/messages.js';
import type { CalendarDateInterval, CalendarEntry } from '../lms-calendar.js';
import { isAllDayExport } from './entryExport.js';

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
    displayMode: 'default' | 'month-dot' | 'month-span' = 'default';

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
            font-family: var(--system-ui);
            contain: layout style;

            grid-column: 2;
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius);
            grid-row: var(--start-slot);
            width: var(--entry-width, 100%);
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
            align-self: flex-start; /* Don't stretch vertically */
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

        /* Compact mode: single line with title only */
        .main.compact {
            flex-direction: row;
            align-items: flex-start; /* Top-left alignment for better overlapping visibility */
            gap: 0;
        }

        /* Standard mode: title + time in various layouts */
        .main.standard {
            flex-direction: var(--entry-layout, row);
            align-items: baseline;
            gap: 0.25em;
        }

        /* The band already labels these as all-day. Do not spend scarce day-column
           width repeating that metadata on every event; the accessible name retains it. */
        :host([slot='all-day']) .time,
        :host([slot^='all-day-']) .time {
            display: none;
        }

        /* Full mode: multi-line with all content */
        .main.full {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.1em;
        }

        .title {
            max-inline-size: 100%;
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: var(--entry-title-wrap);
            font-weight: var(--entry-title-weight);
        }

        .time {
            max-inline-size: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: var(--entry-font-family, var(--system-ui));
            font-size: var(--entry-time-font-size);
            opacity: var(--entry-time-opacity);
            white-space: nowrap;
            flex-shrink: 0;
            margin-inline-start: 0; /* Ensure time stays at start, don't auto-align to end */
        }

        /* Row layout: optimized for side-by-side content */
        .main[style*='--entry-layout: row'] {
            align-items: baseline; /* Baseline-align title and time text */
            gap: 0.5em; /* Gap between title and time */
            flex-wrap: nowrap; /* Prevent wrapping */
            min-height: 1.4em; /* Ensure consistent height */
        }

        .main[style*='--entry-layout: row'] .title {
            flex: 1 1 auto; /* Allow title to grow but not beyond container */
            min-width: 0; /* Allow title to shrink below content size */
            max-width: 65%; /* Reserve space for time, but allow more for title */
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .main[style*='--entry-layout: row'] .time {
            flex: 0 0 auto; /* Fixed size, don't grow or shrink */
            min-width: fit-content; /* Ensure time always fits */
            font-size: 0.8em; /* Slightly smaller in row layout */
            opacity: 0.9;
        }

        /* Column layout: optimized for stacked content */
        .main[style*='--entry-layout: column'] {
            align-items: flex-start;
            gap: 0.15em; /* Tighter spacing for stacked layout */
            padding-top: 0.2em; /* Slight top padding for better visual balance */
        }

        .main[style*='--entry-layout: column'] .title {
            width: 100%;
            font-weight: var(--title-column-weight);
            line-height: 1.2;
            margin-bottom: 0.1em;
        }

        .main[style*='--entry-layout: column'] .time {
            width: 100%;
            font-size: 0.85em;
            opacity: 0.8;
            line-height: 1.1;
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
            overflow: visible;
            contain: style;
            min-height: 24px;
        }

        /* Multi-day events keep their background in month view */
        :host([data-display-mode='month-dot'][data-is-continuation='true']),
        :host([data-display-mode='month-dot']) .main[data-is-multi-day='true'] {
            background: var(--entry-background-color);
            border-radius: var(--border-radius-sm);
            color: var(--entry-readable-color, var(--text-color, CanvasText));
        }

        :host([data-display-mode='month-dot']) .main {
            padding: 0;
            align-items: center;
            gap: var(--entry-dot-margin);
            flex-wrap: nowrap;
            overflow: visible;
            flex-direction: row !important;
        }

        :host([data-display-mode='month-dot']) .title {
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
        }

        :host([data-display-mode='month-dot']) .time {
            font-family: var(--entry-time-font);
            text-align: var(--entry-time-align);
            min-width: 0;
            margin-inline-start: auto;
            color: inherit;
            opacity: 0.8;
            flex-shrink: 1;
            overflow: hidden;
            text-overflow: ellipsis;
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
            line-height: 1.6em;
            margin-inline-start: -1px;
            margin-inline-end: -1px;
            contain: style;
        }

        :host([data-display-mode='month-span']) .main {
            padding: 0 0.5em;
            align-items: center;
            gap: 0;
            flex-wrap: nowrap;
            overflow: hidden;
            flex-direction: row !important;
            height: 100%;
        }

        :host([data-display-mode='month-span']) .title {
            color: inherit;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            flex: 1;
            min-width: 0;
            font-weight: 500;
        }

        :host([data-display-mode='month-span']) .time {
            display: none;
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

        .color-dot {
            width: var(--entry-dot-size);
            height: var(--entry-dot-size);
            border-radius: 50%;
            background-color: var(--entry-color);
            flex-shrink: 0;
            aspect-ratio: 1;
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

        :host([data-height='compact']) .time {
            display: var(--entry-compact-show-time, none);
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
        @media (forced-colors: active) {
            :host {
                border: 1px solid CanvasText;
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

        // Month-span mode: no time labels (bars represent all-day/multi-day events)
        if (this.displayMode === 'month-span') {
            return nothing;
        }

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

        // Default mode (day/week views)
        if (this.density === 'compact') {
            return nothing;
        }

        if (this._isAllDayEntry()) return html`<span class="time">${msg.allDay}</span>`;

        if (!this.time) return nothing;

        // Show start time only (e.g. "9:30 AM") — keeps title visible
        const startTime = formatLocalizedTime(
            this.time.start.hour,
            this.time.start.minute,
            this.locale,
        );
        return startTime ? html`<span class="time">${startTime}</span>` : nothing;
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

    override render() {
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
                    ${
                        !isMultiDay
                            ? html`
                                  <span class="color-dot"></span>
                              `
                            : ''
                    }
                    <span class="title">${this.heading}</span>
                    ${this._renderTime()}
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

        // Float text mode: render box with floating text above
        if (this.floatText) {
            return html`
                <div
                    class=${mainClass}
                    style="background-color: var(--entry-background-color); height: 100%; position: relative; overflow: visible;"
                >
                    <div class="text-content">
                        <span style="font-weight: var(--entry-title-weight);">${this.heading}</span>
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
        const endDate =
            !allDay && entry.time?.end.hour === 24
                ? DateTime.fromObject(entry.date.end, { zone: 'UTC' }).plus({ days: 1 }).toObject()
                : entry.date.end;
        const lastDate = dateLabel(endDate as CalendarDate);
        const displayDate =
            firstDate === lastDate ? firstDate : format.timeRange(firstDate, lastDate);
        const time = entry.time;
        let displayTime = allDay ? msg.allDay : msg.noTime;
        if (!allDay && time) {
            const firstTime = formatLocalizedTime(time.start.hour, time.start.minute, this.locale);
            const lastTime = formatLocalizedTime(time.end.hour % 24, time.end.minute, this.locale);
            displayTime =
                firstDate === lastDate
                    ? format.timeRange(firstTime, lastTime)
                    : format.timeRange(`${firstDate} ${firstTime}`, `${lastDate} ${lastTime}`);
            if (entry.timeZone) displayTime += ` (${entry.timeZone})`;
        }
        const eventDetails = {
            heading: entry.heading || msg.noTitle,
            content: entry.content || msg.noContent,
            time,
            displayTime,
            displayDate,
            date: entry.date.start,
            anchorRect: this.getBoundingClientRect(),
            entry,
            eventId: this.eventId ?? entry.id,
        };
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
