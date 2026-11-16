import type { ReactiveController, ReactiveControllerHost } from 'lit';

/** Refreshes date state at local midnight, including after a suspended tab resumes. */
export class CurrentDateController implements ReactiveController {
    date = new Date();
    private timer?: ReturnType<typeof setTimeout>;
    constructor(private host: ReactiveControllerHost) {
        host.addController(this);
    }
    hostConnected() {
        document.addEventListener('visibilitychange', this.refresh);
        this.refresh();
    }
    hostDisconnected() {
        document.removeEventListener('visibilitychange', this.refresh);
        clearTimeout(this.timer);
    }
    private refresh = () => {
        clearTimeout(this.timer);
        const now = new Date();
        if (this.date.toDateString() !== now.toDateString()) {
            this.date = now;
            this.host.requestUpdate();
        }
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        this.timer = setTimeout(this.refresh, midnight.getTime() - now.getTime() + 50);
    };
}
