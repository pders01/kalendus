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

    /* Classic scrollbars must reserve the same inline space in all three grids. */
    .day-header,
    .week-header,
    .all-day-wrapper,
    .timeline {
        scrollbar-gutter: stable;
    }
    .day-header,
    .week-header,
    .all-day-container {
        display: grid;
        gap: var(--day-gap, 1px);
    }
    .day-header,
    .week-header {
        min-block-size: var(--day-header-height, 2.5em);
        flex-shrink: 0;
        border-bottom: var(--separator-border);
        padding: 0 var(--day-padding, 0.5em);
        overflow: hidden;
    }
    .time-header {
        border-inline-end: 1px solid var(--separator-light);
    }
    .all-day-wrapper {
        display: block;
        max-block-size: min(35%, var(--all-day-max-height, 12rem));
        overflow-y: auto;
        overscroll-behavior: contain;
        flex-shrink: 0;
    }
    .all-day-time-header {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--hour-indicator-font-size);
        color: var(--hour-indicator-color);
        font-weight: var(--day-label-font-weight);
        overflow-wrap: anywhere;
    }
    .all-day,
    .all-day-day-column {
        display: grid;
        grid-template-rows: repeat(
            var(--all-day-rows, 1),
            var(--all-day-row-height, max(24px, 1.5rem))
        );
        grid-auto-rows: var(--all-day-row-height, max(24px, 1.5rem));
        gap: 4px;
    }
    :is(.all-day, .all-day-day-column) slot {
        display: contents;
    }
    :is(.all-day, .all-day-day-column) ::slotted(lms-calendar-entry) {
        position: relative !important;
        grid-column: 1 !important;
        grid-row: calc(var(--all-day-row, var(--legacy-all-day-row, 0)) + 1) !important;
        min-height: 24px !important;
        height: var(--all-day-row-height, max(24px, 1.5rem)) !important;
        margin-block: 0 !important;
    }
    :is(.timeline, .all-day-wrapper, .day-label, button):focus-visible {
        outline: 2px solid currentColor;
        outline-offset: -2px;
    }
    @media (forced-colors: active) {
        :is(.timeline, .all-day-wrapper, .day-label, button):focus-visible {
            outline-color: Highlight;
        }
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

export function measureTimeGrid(scroll: HTMLElement) {
    const height = scroll.clientHeight;
    const { fontSize, paddingTop, paddingBottom } = getComputedStyle(scroll);
    const font = parseFloat(fontSize);
    const inset = parseFloat(paddingTop);
    // Pay for the axis labels and late preview tail before sizing the day.
    const available = height - inset - parseFloat(paddingBottom);
    return {
        height,
        inset,
        fit: available >= 24 * Math.max(font, inset * 1.25) ? available / 1440 : 0,
        detail: Math.max(height / 720, (font * 2.75) / 60),
    };
}

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
        let previousExtent = 0;
        const rememberScroll = () => {
            // Shrinking the scroll range can auto-clamp at the end; growing it cannot.
            const extent = scroll.scrollHeight;
            const top = scroll.scrollTop;
            if (
                scroll.clientHeight === previousHeight &&
                (extent >= previousExtent || top < extent - previousHeight - 1)
            )
                previousTop = top;
        };
        scroll.addEventListener('scroll', rememberScroll, { passive: true });
        this.unlisten = () => scroll.removeEventListener('scroll', rememberScroll);
        const sync = () => {
            this.lastScroll = this.host.scrollTimeGrid;
            const { height, inset, fit, detail } = measureTimeGrid(scroll);
            if (!height) return;
            const chosenFit = !this.lastScroll && fit;
            const minute = chosenFit || detail;
            const changed = Math.abs(minute - this.lastMinute) > 0.0001;
            this.host.toggleAttribute('data-spaced-hours', !!chosenFit && minute * 60 < inset * 3);
            if (changed || inset !== previousInset) {
                const top = scroll.scrollTop;
                const clamped =
                    (height > previousHeight || inset < previousInset) &&
                    top >= scroll.scrollHeight - height - 1;
                const anchor = clamped ? Math.max(top, previousTop) : top;
                const scale = this.lastMinute;
                if (changed) {
                    this.lastMinute = minute;
                    this.host.style.setProperty('--minute-height', `${minute}px`);
                    this.host.style.setProperty('--hour-height', `${minute * 60}px`);
                    this.host.style.setProperty('--day-total-height', `${minute * 1440}px`);
                    this.host.style.setProperty('--half-day-height', `${minute * 720}px`);
                }
                // Keep native top at zero and let the browser clamp the restored anchor.
                if (scale && anchor > 0)
                    scroll.scrollTop = Math.round(
                        inset + ((anchor - previousInset) / scale) * this.lastMinute,
                    );
            }
            if (changed || height !== previousHeight || inset !== previousInset)
                this.host.dispatchEvent(new Event('time-grid-resize'));
            previousHeight = height;
            previousInset = inset;
            previousTop = scroll.scrollTop;
            previousExtent = scroll.scrollHeight;
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
