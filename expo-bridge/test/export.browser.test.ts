import { expect, waitUntil, nextFrame } from '@open-wc/testing';

import { toCalendarEntry } from '../../server/src/adapters/kalendus-api-client.js';
import type Menu from '../../src/components/Menu.js';
import type LMSCalendar from '../../src/lms-calendar.js';
import { injection, NativeSession, parseOutbound } from '../protocol.js';
import type { Snapshot } from '../types.js';

declare const __BRIDGE_INLINE__: boolean;

/** Real calendar, executing the exact generated bridge in its own document. */
describe('Expo shell public integration', () => {
    let frame: HTMLIFrameElement | undefined;
    afterEach(() => {
        frame?.remove();
        frame = undefined;
    });

    async function mountShell() {
        const shell = await (
            await fetch(
                __BRIDGE_INLINE__
                    ? '/expo-bridge/kalendus-inline.html'
                    : '/expo-bridge/kalendus.html',
            )
        ).text();
        const markup = shell.replace(
            '<body>',
            `<body><script>
            window.__bridgeMessages = [];
            window.__browserDownloads = 0;
            window.ReactNativeWebView = { postMessage: function(raw) { window.__bridgeMessages.push(raw); } };
            URL.createObjectURL = function() { window.__browserDownloads++; return 'blob:bridge-test'; };
            URL.revokeObjectURL = function() {};
            HTMLAnchorElement.prototype.click = function() {};
        </script>`,
        );
        frame = document.createElement('iframe');
        frame.style.cssText = 'width:900px;height:700px';
        frame.srcdoc = __BRIDGE_INLINE__
            ? markup
            : markup.replace(
                  '<script src="kalendus.iife.js"></script>',
                  '<script type="module" src="/src/lms-calendar.ts"></script>',
              );
        document.body.append(frame);
        const win = frame.contentWindow!;
        await waitUntil(
            () => typeof Reflect.get(win, '__kalendusReceive') === 'function',
            'shell receiver',
            { timeout: 10000 },
        );
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
        await waitUntil(
            () => messages().some((raw) => parseOutbound(raw)?.type === 'ready'),
            'actual root rendered',
            { timeout: 10000 },
        );
        const ready = messages().find((raw) => parseOutbound(raw)?.type === 'ready')!;
        expect(native.receive(ready)?.type).to.equal('ready');
        const cal = frame.contentDocument!.querySelector('lms-calendar') as LMSCalendar;
        const apply = async (snapshot: Snapshot) => {
            const { raw } = native.synchronize(snapshot);
            expect(raw, 'snapshot accepted by native').to.be.a('string');
            inject(raw!);
            await cal.updateComplete;
            await nextFrame();
        };
        return { win, cal, messages, apply, native };
    }

    async function mount(exportICS: boolean, entryActivation = false) {
        const { win, cal, messages, apply } = await mountShell();
        const entry = toCalendarEntry({
            id: 'persisted-42',
            calendarId: 'server-calendar',
            date: {
                start: { year: 2026, month: 3, day: 7 },
                end: { year: 2026, month: 3, day: 10 },
            },
            time: { start: { hour: 23, minute: 30 }, end: { hour: 1, minute: 0 } },
            heading: 'Canonical original',
            content: 'Original notes',
            color: '#123456',
            createdAt: '2026-03-01T00:00:00Z',
            updatedAt: '2026-03-02T00:00:00Z',
        });
        await apply({
            props: {
                activeDate: entry.date.start,
                locale: 'ar',
                viewMode: 'week',
                entries: [entry],
            },
            theme: {},
            capabilities: { exportICS, entryActivation },
        });
        expect(cal.entries).to.deep.equal([entry]);
        const menu = cal.shadowRoot!.querySelector('lms-menu') as Menu;
        const card = cal.shadowRoot!.querySelector<HTMLElement>(
            'lms-calendar-entry[data-event-id="persisted-42"]',
        );
        if (!card) throw new Error('Expected the server entry to be rendered');
        card.click();
        if (!entryActivation) {
            await waitUntil(() => menu.open, 'default inspector opens');
            await menu.updateComplete;
        }
        return { win, cal, menu, messages, entry };
    }

    it('clears the real calendar accent when a replacement snapshot omits color', async () => {
        const { cal, apply } = await mountShell();
        const snapshot: Snapshot = {
            props: {},
            theme: {},
            capabilities: { exportICS: false, entryActivation: false },
        };
        const accent = () => cal.style.getPropertyValue('--calendar-accent');
        await apply(snapshot);
        expect(cal.color).to.equal('#000000');
        expect(accent()).to.equal('');

        // Supplying the legacy getter value explicitly is different from omitting it.
        await apply({ ...snapshot, props: { color: '#000000' } });
        expect(accent()).to.equal('rgb(0, 0, 0)');

        await apply(snapshot);
        expect(cal.color).to.equal('#000000');
        expect(accent()).to.equal('');
    });

    it('reports root-invalid entries without forwarding records or blocking valid siblings', async () => {
        const { cal, apply, messages, native } = await mountShell();
        const day = { year: 2026, month: 3, day: 7 };
        const good = { id: 'valid-sibling', date: { start: day, end: day }, heading: 'Visible' };
        const invalid = { ...good, id: ' ', heading: 'Private title', content: 'Private notes' };
        await apply({
            props: { entries: [invalid, good], activeDate: day, viewMode: 'day' },
            theme: {},
            capabilities: { exportICS: false, entryActivation: false },
        });
        const diagnostics = messages()
            .map((raw) => native.receive(raw))
            .filter((message) => message?.type === 'event' && message.name === 'entries-invalid');
        expect(diagnostics).to.have.length(1);
        expect(diagnostics[0]?.detail).to.deep.equal({
            issueCount: 1,
            issues: [{ index: 0, reason: 'Invalid entry ID' }],
        });
        expect(messages().join(''))
            .not.to.contain('Private title')
            .and.not.to.contain('Private notes');
        const cards = cal.shadowRoot!.querySelectorAll('lms-calendar-entry');
        expect(cards).to.have.length(1);
        expect(cards[0].canonicalEntry).to.deep.equal(good);
    });

    it('a real Menu export-button click posts exactly one canonical native export and no download', async () => {
        const { win, menu, messages, entry, cal } = await mount(true);
        expect(cal.locale).to.equal('ar');
        expect(frame!.contentDocument!.documentElement.lang).to.equal('ar');
        const states = messages()
            .map(parseOutbound)
            .filter(
                (message) => message?.type === 'event' && message.name === 'calendar-state-change',
            );
        const state = states[states.length - 1];
        if (state?.type !== 'event' || state.name !== 'calendar-state-change')
            throw new Error('Expected committed state');
        expect(state.detail).to.deep.equal({
            activeDate: cal.activeDate,
            viewMode: cal.viewMode,
            firstDayOfWeek: cal.firstDayOfWeek,
            range: cal.visibleRange,
        });
        menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        await nextFrame();
        const exports = messages()
            .map(parseOutbound)
            .filter((message) => message?.type === 'event' && message.name === 'export-ics');
        expect(exports).to.have.length(1);
        const message = exports[0];
        if (message?.type !== 'event' || message.name !== 'export-ics')
            throw new Error('Expected export payload');
        expect(message.detail.entry).to.deep.equal(entry);
        expect(message.detail.eventId).to.equal('persisted-42');
        expect(message.detail.displayTime).to.equal('23:30–01:00');
        expect(message.detail.date).to.deep.equal(entry.date.start);
        expect(Reflect.get(win, '__browserDownloads')).to.equal(0);
    });

    it('a real entry click sends the original server record on delegated activation', async () => {
        const { menu, messages, entry } = await mount(false, true);
        await nextFrame();
        const activations = messages()
            .map(parseOutbound)
            .filter((message) => message?.type === 'event' && message.name === 'entry-activate');
        expect(activations).to.have.length(1);
        expect(activations[0]?.detail).to.deep.equal({ entry, eventId: entry.id });
        expect(menu.open).not.to.equal(true);
    });

    it('without an explicit capability the same real click keeps the browser default', async () => {
        const { win, menu, messages } = await mount(false);
        menu.shadowRoot!.querySelector<HTMLButtonElement>('.export-btn')!.click();
        await waitUntil(
            () =>
                Reflect.get(win, '__browserDownloads') === 1 ||
                Boolean(menu.shadowRoot!.querySelector('.error')),
            'browser default export',
            { timeout: 10000 },
        );
        expect(menu.shadowRoot!.querySelector('.error')?.textContent || '').to.equal('');
        expect(Reflect.get(win, '__browserDownloads')).to.equal(1);
        expect(
            messages()
                .map(parseOutbound)
                .filter((message) => message?.type === 'event' && message.name === 'export-ics'),
        ).to.have.length(0);
    });
});
