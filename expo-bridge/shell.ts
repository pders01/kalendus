import { encodeOutbound, isState, newToken, parseInbound, PROP_KEYS, VERSION } from './protocol.js';
import type { CalendarState, KalendusProps, Snapshot, ThemeVars } from './types.js';

interface CalendarElement extends HTMLElement {
    updateComplete: Promise<boolean>;
    activeDate: CalendarState['activeDate'];
    viewMode: CalendarState['viewMode'];
    firstDayOfWeek: CalendarState['firstDayOfWeek'];
    visibleRange: CalendarState['range'];
}
declare global {
    interface Window {
        __kalendusReceive?: (raw: unknown) => void;
        ReactNativeWebView?: { postMessage: (raw: string) => void };
    }
}
const element = document.getElementById('cal');
if (!element) throw new Error('Missing calendar host');
// Only the public Lit/root contract is used. No shadow tree inspection or method patches.
const cal = element as CalendarElement;
const documentId = newToken();
let session: string | null = null;
let incoming = 0;
let outgoing = 0;
let rendered = false;
let configured = false;
let applying = false;
let failure: string | null = null;
let previousProps: KalendusProps = {};
let previousTheme: ThemeVars = {};
let previousNavigationRevision: number | undefined;
let capabilities: Snapshot['capabilities'] = { exportICS: false, entryActivation: false };
let defaults: Record<string, unknown> = {};
let lastState = '';

function send(payload: Record<string, unknown>): boolean {
    if (!session || !window.ReactNativeWebView) return false;
    const raw = encodeOutbound({
        ...payload,
        version: VERSION,
        session,
        document: documentId,
        seq: outgoing + 1,
    });
    if (!raw) return false;
    try {
        window.ReactNativeWebView.postMessage(raw);
        outgoing++;
        return true;
    } catch {
        return false;
    }
}
function fail(message: string): void {
    failure = message.slice(0, 2048);
    send({ type: 'error', message: failure });
}
function ready(): void {
    if (failure) send({ type: 'error', message: failure });
    else if (rendered) send({ type: 'ready' });
}
function state(detail: unknown): void {
    if (!configured || applying || !isState(detail)) return;
    const json = JSON.stringify(detail);
    if (json !== lastState && send({ type: 'event', name: 'calendar-state-change', detail }))
        lastState = json;
}
function readState(): CalendarState {
    return {
        activeDate: cal.activeDate,
        viewMode: cal.viewMode,
        firstDayOfWeek: cal.firstDayOfWeek,
        range: cal.visibleRange,
    };
}
function sameDate(a: KalendusProps['activeDate'], b: KalendusProps['activeDate']): boolean {
    return a?.year === b?.year && a?.month === b?.month && a?.day === b?.day;
}
async function apply(snapshot: Snapshot, revision: number): Promise<void> {
    applying = true;
    try {
        const { props, navigationRevision } = snapshot;
        const applyNavigation =
            !configured ||
            (navigationRevision !== undefined && navigationRevision !== previousNavigationRevision);
        for (const key of PROP_KEYS) {
            if (!(key in props)) {
                // The color getter's legacy #000000 is not the unset accent.
                if (key in previousProps)
                    Reflect.set(cal, key, key === 'color' ? '' : defaults[key]);
                continue;
            }
            // Full configuration updates must not replay old navigation. In explicit
            // mode even changed values may be delayed echoes of an earlier web state.
            if (!applyNavigation) {
                const explicit = navigationRevision !== undefined;
                if (
                    key === 'activeDate' &&
                    (explicit || sameDate(props.activeDate, previousProps.activeDate))
                )
                    continue;
                if (key === 'viewMode' && (explicit || props.viewMode === previousProps.viewMode))
                    continue;
            }
            Reflect.set(cal, key, props[key]);
        }
        for (const key of Object.keys(previousTheme))
            if (!(key in snapshot.theme)) cal.style.removeProperty(key);
        for (const [key, value] of Object.entries(snapshot.theme))
            cal.style.setProperty(key, value);
        previousProps = props;
        previousTheme = snapshot.theme;
        previousNavigationRevision = navigationRevision;
        capabilities = snapshot.capabilities;
        document.documentElement.lang =
            Intl.getCanonicalLocales(String(Reflect.get(cal, 'locale')))[0] || 'en';
        configured = true;
        await cal.updateComplete;
        if (revision !== incoming) return;
        applying = false;
        state(readState());
    } catch {
        applying = false;
        fail('Unable to apply calendar snapshot');
    }
}
// Dedicated native injection endpoint: intentionally NO window/document message
// listeners. Ordinary browser postMessage (including opaque-origin messages) is
// not trusted. The embedding app must supply trusted HTML/bundles only.
window.__kalendusReceive = (raw) => {
    const msg = parseInbound(raw);
    if (!msg) return;
    if (msg.type === 'connect') {
        if (session && session !== msg.session) return;
        if (session) return; // one handshake per document
        session = msg.session;
        ready();
        return;
    }
    if (
        !rendered ||
        failure ||
        msg.session !== session ||
        msg.document !== documentId ||
        msg.seq <= incoming
    )
        return;
    incoming = msg.seq;
    void apply(msg.snapshot, msg.seq);
};

cal.addEventListener('calendar-state-change', (event) =>
    state((event as CustomEvent<unknown>).detail),
);
for (const name of ['open-menu', 'expand', 'switchview', 'switchdate', 'jumptoday', 'menu-close']) {
    cal.addEventListener(name, (event) => {
        if (!configured) return;
        const original: unknown = (event as CustomEvent<unknown>).detail;
        const detail: Record<string, unknown> = {};
        // Project the compatibility contract; never serialize DOMRect/DOM nodes.
        if (original && typeof original === 'object') {
            for (const key of [
                'heading',
                'content',
                'displayTime',
                'date',
                'time',
                'entry',
                'eventId',
                'drillTarget',
                'view',
                'direction',
            ]) {
                const value: unknown = Reflect.get(original, key);
                if (value !== undefined) detail[key] = value;
            }
        }
        send({ type: 'event', name, detail });
    });
}
cal.addEventListener('entry-activate', (event) => {
    if (!configured || !capabilities.entryActivation || !event.cancelable || event.defaultPrevented)
        return;
    if (
        send({
            type: 'event',
            name: 'entry-activate',
            detail: (event as CustomEvent<unknown>).detail,
        })
    )
        event.preventDefault();
});
cal.addEventListener('export-entry', (event) => {
    if (!configured || !capabilities.exportICS || !event.cancelable || event.defaultPrevented)
        return;
    const detail: unknown = (event as CustomEvent<unknown>).detail;
    if (!detail || typeof detail !== 'object') return;
    const entry: unknown = Reflect.get(detail, 'entry');
    if (!entry || typeof entry !== 'object') return;
    const date: unknown = Reflect.get(entry, 'date');
    const time: unknown = Reflect.get(entry, 'time');
    let displayTime = '';
    if (time && typeof time === 'object') {
        const format = (v: unknown) =>
            v && typeof v === 'object'
                ? `${String(Reflect.get(v, 'hour')).padStart(2, '0')}:${String(Reflect.get(v, 'minute')).padStart(2, '0')}`
                : '';
        displayTime = `${format(Reflect.get(time, 'start'))}–${format(Reflect.get(time, 'end'))}`;
    }
    const payload = {
        entry,
        eventId: Reflect.get(detail, 'eventId') ?? Reflect.get(entry, 'id'),
        heading: Reflect.get(entry, 'heading'),
        content: Reflect.get(entry, 'content') ?? '',
        time,
        displayTime,
        date: date && typeof date === 'object' ? Reflect.get(date, 'start') : undefined,
    };
    // Cancel only if a valid, bounded request was actually posted to a capable native host.
    if (send({ type: 'event', name: 'export-ics', detail: payload })) event.preventDefault();
});
window.addEventListener('error', () => fail('Calendar script or resource failed to load'), true);
window.addEventListener('unhandledrejection', () =>
    fail('Calendar render or asynchronous operation failed'),
);
const timeout = setTimeout(
    () => fail('Calendar definition/render timed out (check the bundled IIFE)'),
    15000,
);
void (async () => {
    try {
        await customElements.whenDefined('lms-calendar');
        if (!cal.updateComplete || typeof cal.updateComplete.then !== 'function')
            throw new Error('Missing Lit contract');
        let complete = false;
        for (let attempt = 0; attempt < 10 && !complete; attempt++)
            complete = await cal.updateComplete;
        if (!complete) throw new Error('Calendar did not settle');
        if (!isState(readState())) throw new Error('Incompatible public calendar state contract');
        // updateComplete covers the root render, not descendant paints.
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (failure) return;
        defaults = Object.fromEntries(PROP_KEYS.map((key) => [key, Reflect.get(cal, key)]));
        rendered = true;
        clearTimeout(timeout);
        ready();
    } catch {
        clearTimeout(timeout);
        fail('Calendar initial render failed');
    }
})();
