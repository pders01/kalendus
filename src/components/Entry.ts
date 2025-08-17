import { localized } from '@lit/localize';
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { P, match } from 'ts-pattern';
import { messages } from '../lib/messages.js';
import type { CalendarDateInterval } from '../lms-calendar';

@customElement('lms-calendar-entry')
@(localized() as ClassDecorator)
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

    @property({ type: String, reflect: true, attribute: 'data-density' })
    density: 'compact' | 'standard' | 'full' = 'standard';

    @property({ type: String, reflect: true, attribute: 'data-display-mode' })
    displayMode: 'default' | 'month-dot' = 'default';
    
    @property({ type: Boolean, reflect: true, attribute: 'data-float-text' })
    floatText = false;

    @property({ type: Object })
    _accessibility?: { tabIndex: number; role: string; ariaLabel: string };

    @state()
    _highlighted?: boolean;

    @state()
    _extended?: boolean;

    private _sumReducer: (accumulator: number, currentValue: number) => number =
        (accumulator, currentValue) => accumulator + currentValue;

    static override styles = css`
        :host {
            /* Responsive font sizing based on component scale */
            font-size: var(--entry-font-size, 0.75rem);
            line-height: var(--entry-line-height, 1.2);

            grid-column: 2;
            display: block;
            cursor: pointer;
            user-select: none;
            border-radius: var(--entry-border-radius, var(--border-radius-sm));
            grid-row: var(--start-slot);
            width: var(--entry-width, 100%);
            margin-left: var(--entry-margin-left, 0);
            background-color: var(
                --entry-background-color,
                var(--background-color)
            );
            color: var(--entry-color, var(--primary-color));
            border: var(--entry-border, none);
            /* z-index of separators in day view is 0 */
            z-index: var(--entry-z-index, 1);
            opacity: var(--entry-opacity, 1);
            box-sizing: border-box;
            padding-bottom: 1px;
            min-height: var(--entry-min-height, 1.2em);
            overflow: hidden;
            position: relative;
        }

        /* Color handle indicator on the left - only for day/week views */
        :host::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: var(--entry-handle-width, 0px);
            background-color: var(--entry-handle-color, transparent);
            border-radius: var(--entry-border-radius, var(--border-radius-sm)) 0 0 var(--entry-border-radius, var(--border-radius-sm));
            display: var(--entry-handle-display, none);
        }

        :host(:last-child) {
            padding-bottom: 0;
        }

        :host([data-highlighted]) {
            background: var(--entry-highlight-color, var(--separator-light));
        }

        /* ARIA-compliant highlighted border for active menu entries */
        :host([aria-selected="true"]) {
            outline: 3px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important; /* Ensure highlighted entry appears above others */
        }

        /* Enhance focus styles for better accessibility */
        :host(:focus) {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: 2px;
            position: relative;
            z-index: 999 !important; /* Ensure focused entry appears above others */
        }

        :host([data-extended]) {
            background: var(
                --entry-extended-background-color,
                var(--background-color)
            );
        }

        :host(:focus-within) {
            outline: 2px solid var(--entry-focus-color, var(--primary-color));
            outline-offset: -2px;
            position: relative;
            z-index: 999 !important; /* Ensure entry with focused child appears above others */
        }

        .main {
            padding: var(--entry-padding, 0.15em 0.25em);
            padding-top: calc(var(--entry-padding-top, 0) + 0.15em);
            border-radius: var(--entry-border-radius, var(--border-radius-sm));
            background-color: inherit;
            text-align: left;
            height: 100%;
            box-sizing: border-box;
            display: flex;
            flex-direction: var(--entry-layout, row);
            align-items: flex-start; /* Always align content to top */
            justify-content: flex-start; /* Always align content to left */
            gap: var(--entry-gap, 0.25em);
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
            padding-left: var(--entry-padding-left, 0.25em);
        }
        
        .text-content {
            position: absolute;
            top: var(--entry-text-top, -20px);
            left: var(--entry-text-left, 0);
            background: rgba(255, 255, 255, 0.95);
            padding: 2px 6px;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
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
            align-items: flex-start;
            gap: 0.25em;
        }

        /* Full mode: multi-line with all content */
        .main.full {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.1em;
        }

        .title {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: var(--entry-title-wrap, nowrap);
            font-weight: var(--entry-title-weight, 500);
        }

        .time {
            font-family: var(--entry-font-family, system-ui);
            font-size: var(--entry-time-font-size, 0.85em);
            opacity: var(--entry-time-opacity, 0.8);
            white-space: nowrap;
            flex-shrink: 0;
            margin-left: 0; /* Ensure time stays on the left, don't auto-align to right */
        }

        /* For row layout in overlapping events, ensure content stays grouped */
        .main[style*="--entry-layout: row"] {
            align-items: center; /* Center align for single-line layout */
            gap: 0.5em; /* Small gap between title and time */
        }

        .main[style*="--entry-layout: row"] .title {
            flex: none; /* Don't expand title in row layout */
            max-width: 60%; /* Limit title width to leave space for time */
        }

        /* Month view dot indicator styles */
        :host([data-display-mode='month-dot']) {
            background: var(--entry-month-background, transparent);
            padding: var(--entry-month-padding, 0.1em 0.3em 0.1em 0.5em);
            border-radius: 0;
            color: var(--entry-month-text-color, var(--separator-dark));
            position: relative;
            z-index: 1;
            width: 100%;
            min-width: 0;
            box-sizing: border-box;
        }

        /* Multi-day events keep their background in month view */
        :host([data-display-mode='month-dot'][data-is-continuation='true']),
        :host([data-display-mode='month-dot']) .main[data-is-multi-day='true'] {
            background: var(--entry-background-color, var(--background-color));
            border-radius: var(--border-radius-sm);
            color: var(--entry-color, var(--primary-color));
        }

        :host([data-display-mode='month-dot']) .main {
            padding: 0;
            align-items: center;
            gap: var(--entry-dot-margin, 0.25em);
            flex-wrap: nowrap;
            overflow: hidden;
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
            font-family: var(--entry-time-font, var(--monospace-ui));
            text-align: var(--entry-time-align, right);
            min-width: 3.5em;
            margin-left: auto;
            color: inherit;
            opacity: 0.8;
        }

        .color-dot {
            width: var(--entry-dot-size, 0.5em);
            height: var(--entry-dot-size, 0.5em);
            border-radius: 50%;
            background-color: var(--entry-color, var(--primary-color));
            flex-shrink: 0;
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
    `;

    private _renderTitle() {
        return match(this.content)
            .with(P.nullish, () => this.heading)
            .otherwise(() => `${this.heading}: ${this.content}`);
    }

    private _renderTime() {
        if (this.displayMode === 'month-dot') {
            // In month view, always try to show time when possible
            if (this.isContinuation) {
                return html`<span class="time">${messages.allDay()}</span>`;
            }
            const timeString = this._displayInterval(this.time);
            return timeString
                ? html`<span class="time">${timeString}</span>`
                : nothing;
        }

        if (this.density === 'compact') {
            return nothing; // No time in compact mode by default
        }

        if (this.isContinuation) {
            return html`<span class="time">${messages.allDay()}</span>`;
        }

        const timeString = this._displayInterval(this.time);
        return timeString
            ? html`<span class="time">${timeString}</span>`
            : nothing;
    }

    private _renderContent() {
        if (this.density === 'full' && this.content) {
            return html`<span class="content">${this.content}</span>`;
        }
        return nothing;
    }

    private _shouldShowTime(): boolean {
        if (this.density === 'compact') return false;
        if (this.isContinuation) return true; // Always show "All Day"
        return this.density === 'standard' || this.density === 'full';
    }

    private _getAriaLabel(): string {
        const timeInfo = this.time
            ? `${String(this.time.start.hour).padStart(2, '0')}:${String(this.time.start.minute).padStart(2, '0')} to ${String(this.time.end.hour).padStart(2, '0')}:${String(this.time.end.minute).padStart(2, '0')}`
            : 'All day';
        
        const contentInfo = this.content ? `, ${this.content}` : '';
        
        return `Calendar event: ${this.heading}${contentInfo}, ${timeInfo}. Press Enter or Space to open details.`;
    }

    override render() {
        const mainClass = `main ${this.density}`;


        if (this.displayMode === 'month-dot') {
            const isMultiDay = this.isContinuation;
            return html`
                <div
                    class=${mainClass}
                    tabindex=${this._accessibility?.tabIndex ?? 0}
                    role=${this._accessibility?.role ?? 'button'}
                    aria-label="${this._accessibility?.ariaLabel ?? this._getAriaLabel()}"
                    aria-selected=${this._highlighted ? 'true' : 'false'}
                    title=${this._renderTitle()}
                    data-full-content=${this.content || ''}
                    ?data-extended=${this._extended}
                    ?data-is-multi-day=${isMultiDay}
                >
                    ${!isMultiDay ? html`<span class="color-dot"></span>` : ''}
                    <span class="title">${this.heading}</span>
                    ${this._renderTime()}
                </div>
            `;
        }
        
        // Float text mode: render box with floating text above
        if (this.floatText) {
            return html`
                <div class=${mainClass} style="background-color: var(--entry-background-color); height: 100%; position: relative; overflow: visible;">
                    <div class="text-content">
                        <span style="font-weight: 500;">${this.heading}</span>
                        ${this._renderTime()}
                    </div>
                </div>
            `;
        }

        return html`
            <div
                class=${mainClass}
                tabindex=${this._accessibility?.tabIndex ?? 0}
                role=${this._accessibility?.role ?? 'button'}
                aria-label="${this._accessibility?.ariaLabel ?? this._getAriaLabel()}"
                aria-selected=${this._highlighted ? 'true' : 'false'}
                title=${this._renderTitle()}
                data-full-content=${this.content || ''}
                ?data-extended=${this._extended}
            >
                <span class="title">${this.heading}</span>
                ${this._shouldShowTime() ? this._renderTime() : nothing}
                ${this._renderContent()}
            </div>
        `;
    }

    private _displayInterval(time?: CalendarTimeInterval) {
        if (!time) {
            return nothing;
        }

        const END_HOURS = 2;
        const components = [
            time.start.hour,
            time.start.minute,
            time.end.hour,
            time.end.minute,
        ];

        const lastsAllDay =
            components[END_HOURS] === 24 &&
            components.reduce(this._sumReducer, 0) % 24 === 0;
        if (lastsAllDay) {
            return messages.allDay();
        }

        const [startHours, startMinutes, endHours, endMinutes] = components.map(
            (component) => (component < 10 ? `0${component}` : component),
        );

        return `${startHours}:${startMinutes} - ${endHours}:${endMinutes}`;
    }

    constructor() {
        super();
        this.addEventListener('click', this._handleInteraction);
        this.addEventListener('keydown', this._handleInteraction);
    }

    private _handleInteraction(e: Event) {
        if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') {
            return;
        }
        e.preventDefault();
        e.stopPropagation();

        if (!this._highlighted) {
            this._highlighted = true;
            // Update ARIA attributes for screen readers
            this.setAttribute('aria-selected', 'true');
            
            if (!this.date) {
                return;
            }

            // Dispatch a custom event to communicate with the calendar
            const eventDetails = {
                heading: this.heading || messages.noTitle(),
                content: this.content || messages.noContent(),
                time: this.time
                    ? `${String(this.time.start.hour).padStart(
                          2,
                          '0',
                      )}:${String(this.time.start.minute).padStart(
                          2,
                          '0',
                      )} - ${String(this.time.end.hour).padStart(
                          2,
                          '0',
                      )}:${String(this.time.end.minute).padStart(2, '0')}`
                    : messages.noTime(),
                date: this.date?.start,
            };

            const openMenuEvent = new CustomEvent('open-menu', {
                detail: eventDetails,
                bubbles: true,
                composed: true,
            });

            this.dispatchEvent(openMenuEvent);

            // Listen for menu close to remove highlight
            const handleMenuClose = () => {
                this._highlighted = false;
                this.setAttribute('aria-selected', 'false');
                this.removeEventListener('menu-close', handleMenuClose);
            };
            this.addEventListener('menu-close', handleMenuClose);
        }
    }
}
