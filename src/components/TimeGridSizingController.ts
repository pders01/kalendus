import { css, html, type LitElement, type ReactiveController, type TemplateResult } from 'lit';

import { formatLocalizedTime } from '../lib/localization.js';

export const timeGridStyles = css`
    .timeline {
        display: grid;
        overflow-y: auto;
        /* Retired snap tokens cannot turn snapping back on. */
        scroll-snap-type: none;
        overflow-anchor: none;
        gap: var(--day-gap, 1px);
        --_axis-inset: calc(var(--hour-indicator-font-size, 0.8125em) * 0.625);
        padding: var(--_axis-inset) var(--day-padding, 0.5em);
        padding-block-end: calc(
            var(--_axis-inset) + var(--_time-grid-tail, max(24px, var(--entry-min-height, 3em)))
        );
        box-sizing: border-box;
        contain: content;
    }

    .time-labels,
    .timed-content,
    .day-column {
        position: relative;
        block-size: var(--day-total-height);
    }

    .time-labels {
        grid-column: 1;
        border-inline-end: var(--sidebar-border, 1px solid var(--separator-light));
    }

    .hour-label {
        position: absolute;
        inset-inline: 0;
        margin-block-start: -0.625em;
        text-align: var(--hour-text-align, center);
        font-size: var(--hour-indicator-font-size, 0.8125em);
        font-variant-numeric: tabular-nums;
        line-height: 1.25;
        white-space: nowrap;
        color: var(--hour-indicator-color);
        pointer-events: none;
    }

    .indicator {
        display: block;
        block-size: 1.25em;
    }

    :host([data-spaced-hours]) .hour-label:nth-child(even) {
        display: none;
    }

    .timed-content,
    .day-column {
        /* Late minimum-height cards may spill into the reserved tail. */
        background-image: linear-gradient(to bottom, var(--separator-light) 1px, transparent 1px);
        background-size: 100% var(--hour-height);
    }
`;

const hours = Array.from({ length: 25 }, (_, hour) => hour);
export function renderTimeLabels(locale: string): TemplateResult<1> {
    return html`<div class="time-labels">
        ${hours.map(
            (hour) => html`<div class="hour-label" style="top: calc(${hour} * var(--hour-height))">
                <span class="indicator">${formatLocalizedTime(hour, 0, locale)}</span>
            </div>`,
        )}
    </div>`;
}

/** Reacquires observations on every connection; owns and cancels queued writes. */
export class TimeGridSizingController implements ReactiveController {
    private observer?: ResizeObserver;
    private frame = 0;
    private lastMinute = 0;
    private lastScroll?: boolean;
    private sync?: () => void;
    private unlisten?: () => void;
    constructor(
        private host: LitElement & { scrollTimeGrid: boolean },
        private scrollerSelector: string,
    ) {
        host.addController(this);
    }
    hostConnected() {
        void this.host.updateComplete.then(() => {
            if (this.host.isConnected) this.start();
        });
    }
    hostUpdated() {
        if (!this.host.isConnected) return;
        if (!this.observer) this.start();
        else if (this.lastScroll !== this.host.scrollTimeGrid) this.sync?.();
    }
    hostDisconnected() {
        this.observer?.disconnect();
        this.observer = undefined;
        this.sync = undefined;
        this.unlisten?.();
        this.unlisten = undefined;
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.lastMinute = 0;
    }
    private start() {
        if (this.observer) return;
        const scroll = this.host.renderRoot.querySelector<HTMLElement>(this.scrollerSelector);
        if (!scroll) return;
        let previousHeight = 0;
        let previousInset = 0;
        let previousTop = 0;
        const rememberScroll = () => {
            // A clamp caused by a resize is not a user choosing a new time.
            if (scroll.clientHeight === previousHeight) previousTop = scroll.scrollTop;
        };
        scroll.addEventListener('scroll', rememberScroll, { passive: true });
        this.unlisten = () => scroll.removeEventListener('scroll', rememberScroll);
        const sync = () => {
            this.lastScroll = this.host.scrollTimeGrid;
            const height = scroll.clientHeight;
            if (!height) return;
            const { fontSize, paddingTop, paddingBottom } = getComputedStyle(scroll);
            const font = parseFloat(fontSize);
            const inset = parseFloat(paddingTop);
            const available = height - inset - parseFloat(paddingBottom);
            // Pay for the axis labels and late preview tail before sizing the day.
            const fit = !this.lastScroll && available >= 24 * Math.max(font, inset * 1.25);
            const minute = fit ? available / 1440 : Math.max(height / 720, (font * 2.75) / 60);
            this.host.toggleAttribute('data-spaced-hours', fit && minute * 60 < inset * 3);
            if (Math.abs(minute - this.lastMinute) > 0.0001) {
                const top = scroll.scrollTop;
                const clamped = height > previousHeight && top >= scroll.scrollHeight - height - 1;
                const position =
                    this.lastMinute > 0
                        ? ((clamped ? Math.max(top, previousTop) : top) - previousInset) /
                          this.lastMinute
                        : undefined;
                this.lastMinute = minute;
                this.host.style.setProperty('--minute-height', `${minute}px`);
                this.host.style.setProperty('--hour-height', `${minute * 60}px`);
                this.host.style.setProperty('--day-total-height', `${minute * 1440}px`);
                this.host.style.setProperty('--half-day-height', `${minute * 720}px`);
                // Avoid cumulative subpixel truncation during repeated restores.
                if (position !== undefined)
                    scroll.scrollTop = Math.round(inset + position * minute);
                this.host.dispatchEvent(new Event('time-grid-resize'));
            }
            previousHeight = height;
            previousInset = inset;
            previousTop = scroll.scrollTop;
        };
        this.sync = sync;
        sync();
        this.observer = new ResizeObserver(() => {
            cancelAnimationFrame(this.frame);
            this.frame = requestAnimationFrame(() => {
                this.frame = 0;
                if (this.host.isConnected) sync();
            });
        });
        this.observer.observe(scroll);
    }
}

/** Compatibility for consumers still passing only CSS order. New layouts set --all-day-row. */
export function assignLegacyAllDayRows(event: Event) {
    const slot = event.target as HTMLSlotElement;
    slot.assignedElements().forEach((element, index) => {
        if (element instanceof HTMLElement)
            element.style.setProperty('--legacy-all-day-row', element.style.order || String(index));
    });
}
