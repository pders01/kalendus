import { expect, waitUntil, nextFrame } from '@open-wc/testing';
import type LMSCalendar from '../../src/lms-calendar.js';
import type Menu from '../../src/components/Menu.js';
import { injection, NativeSession, parseOutbound } from '../protocol.js';
import type { CalendarEntry, Snapshot } from '../types.js';

declare const __BRIDGE_INLINE__: boolean;

/** Real root + real Menu, executing the exact generated bridge in its own document. */
describe('Expo shell public export integration', () => {
    let frame: HTMLIFrameElement | undefined;
    afterEach(() => { frame?.remove(); frame = undefined; });

    async function mount(exportICS: boolean) {
        const shell = await (await fetch(__BRIDGE_INLINE__ ? '/expo-bridge/kalendus-inline.html' : '/expo-bridge/kalendus.html')).text();
        const markup = shell.replace('<body>', `<body><script>
            window.__bridgeMessages = [];
            window.__browserDownloads = 0;
            window.ReactNativeWebView = { postMessage: function(raw) { window.__bridgeMessages.push(raw); } };
            URL.createObjectURL = function() { window.__browserDownloads++; return 'blob:bridge-test'; };
            URL.revokeObjectURL = function() {};
            HTMLAnchorElement.prototype.click = function() {};
        </script>`).replace('<script src="kalendus.iife.js"></script>', '<script type="module" src="/src/lms-calendar.ts"></script>');
        frame = document.createElement('iframe');
        frame.style.cssText = 'width:900px;height:700px';
        frame.srcdoc = markup;
        document.body.append(frame);
        const win = frame.contentWindow!;
        await waitUntil(() => typeof Reflect.get(win, '__kalendusReceive') === 'function', 'shell receiver', { timeout: 10000 });
        const native = new NativeSession();
        // Use the same native injection string used by the wrapper.
        const inject = (raw: string) => {
            const script = frame!.contentDocument!.createElement('script');
            script.textContent = injection(raw);
            frame!.contentDocument!.body.append(script);
            script.remove();
        };
        const messages = (): string[] => Reflect.get(win, '__bridgeMessages');
        inject(native.connect());
        await waitUntil(() => messages().some(raw => parseOutbound(raw)?.type === 'ready'), 'actual root rendered', { timeout: 10000 });
        const ready = messages().find(raw => parseOutbound(raw)?.type === 'ready')!;
        native.receive(ready);
        const snapshot: Snapshot = { props: { activeDate: { year: 2026, month: 3, day: 7 }, locale: 'ar', viewMode: 'week' },
            theme: {}, capabilities: { exportICS, entryActivation: false } };
        inject(native.synchronize(snapshot).raw!);
        const cal = frame.contentDocument!.querySelector('lms-calendar') as LMSCalendar;
        await cal.updateComplete; await nextFrame();
        const menu = cal.shadowRoot!.querySelector('lms-menu') as Menu;
        const entry: CalendarEntry = { id: 'persisted-42', kind: 'timed', timeZone: 'Europe/Berlin',
            date: { start: { year: 2026, month: 3, day: 7 }, end: { year: 2026, month: 3, day: 10 } },
            time: { start: { hour: 23, minute: 30 }, end: { hour: 1, minute: 0 } },
            heading: 'Canonical original', content: 'Original notes', color: '#123456' };
        menu.eventDetails = { heading: 'Displayed segment', content: 'Segment notes', displayTime: 'Shown time',
            date: { year: 2026, month: 3, day: 9 }, entry, eventId: entry.id };
        menu.open = true;
        await menu.updateComplete;
        return { win, cal, menu, messages, entry };
    }

    it('a real Menu export-button click posts exactly one canonical native export and no download', async () => {
        const { win, menu, messages, entry, cal } = await mount(true);
        expect(cal.locale).to.equal('ar');
        expect(frame!.contentDocument!.documentElement.lang).to.equal('ar');
        const states = messages().map(parseOutbound).filter(message => message?.type === 'event' && message.name === 'calendar-state-change');
        const state = states[states.length - 1];
        if (state?.type !== 'event' || state.name !== 'calendar-state-change') throw new Error('Expected committed state');
        expect(state.detail).to.deep.equal({ activeDate: cal.activeDate, viewMode: cal.viewMode,
            firstDayOfWeek: cal.firstDayOfWeek, range: cal.visibleRange });
        menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        await nextFrame();
        const exports = messages().map(parseOutbound).filter(message => message?.type === 'event' && message.name === 'export-ics');
        expect(exports).to.have.length(1);
        const message = exports[0];
        if (message?.type !== 'event' || message.name !== 'export-ics') throw new Error('Expected export payload');
        expect(message.detail.entry).to.deep.equal(entry);
        expect(message.detail.eventId).to.equal('persisted-42');
        expect(message.detail.displayTime).to.equal('23:30–01:00');
        expect(message.detail.date).to.deep.equal(entry.date.start);
        expect(Reflect.get(win, '__browserDownloads')).to.equal(0);
    });

    it('without an explicit capability the same real click keeps the browser default', async () => {
        const { win, menu, messages } = await mount(false);
        menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        await waitUntil(() => Reflect.get(win, '__browserDownloads') === 1 || Boolean(menu.shadowRoot!.querySelector('.error')),
            'browser default export', { timeout: 10000 });
        expect(menu.shadowRoot!.querySelector('.error')?.textContent || '').to.equal('');
        expect(Reflect.get(win, '__browserDownloads')).to.equal(1);
        expect(messages().map(parseOutbound).filter(message => message?.type === 'event' && message.name === 'export-ics')).to.have.length(0);
    });
});
