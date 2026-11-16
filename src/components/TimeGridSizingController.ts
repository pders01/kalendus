import type { LitElement, ReactiveController } from 'lit';

/** Reacquires observations on every connection; owns and cancels queued writes. */
export class TimeGridSizingController implements ReactiveController {
    private observer?: ResizeObserver;
    private frame = 0;
    private lastMinute = 0;
    constructor(
        private host: LitElement,
        private wrapperSelector: string,
        private headerSelector: string,
    ) {
        host.addController(this);
    }
    hostConnected() {
        void this.host.updateComplete.then(() => {
            if (this.host.isConnected) this.start();
        });
    }
    hostUpdated() {
        if (this.host.isConnected && !this.observer) this.start();
    }
    hostDisconnected() {
        this.observer?.disconnect();
        this.observer = undefined;
        cancelAnimationFrame(this.frame);
        this.frame = 0;
        this.lastMinute = 0;
    }
    private start() {
        if (this.observer) return;
        const wrapper = this.host.renderRoot.querySelector<HTMLElement>(this.wrapperSelector);
        const header = this.host.renderRoot.querySelector<HTMLElement>(this.headerSelector);
        if (!wrapper || !header) return;
        const sync = () => {
            const height = wrapper.clientHeight - header.clientHeight;
            const fontSize = parseFloat(getComputedStyle(this.host).fontSize) || 16;
            // Fit twelve hours only when that leaves readable text space. In
            // short embeds or enlarged text, scroll more rather than crushing
            // a two-line event into a one-line hour. Canonical times stay intact.
            const minute = Math.max(height / 720, (fontSize * 2.75) / 60);
            if (height > 0 && Math.abs(minute - this.lastMinute) > 0.0001) {
                this.lastMinute = minute;
                this.host.style.setProperty('--minute-height', `${minute}px`);
                this.host.style.setProperty('--hour-height', `${minute * 60}px`);
                this.host.style.setProperty('--day-total-height', `${minute * 1440}px`);
                this.host.style.setProperty('--half-day-height', `${minute * 720}px`);
            }
        };
        sync();
        this.observer = new ResizeObserver(() => {
            cancelAnimationFrame(this.frame);
            this.frame = requestAnimationFrame(() => {
                this.frame = 0;
                if (this.host.isConnected) sync();
            });
        });
        this.observer.observe(wrapper);
        this.observer.observe(header);
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
