import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';

import { expect } from 'chai';

import {
    byteLength,
    encodeInbound,
    encodeOutbound,
    injection,
    MAX_MESSAGE_BYTES,
    NativeSession,
    parseInbound,
    parseOutbound,
    validateSnapshot,
} from '../../../expo-bridge/protocol.js';
import type { CalendarEntry, CalendarState, Snapshot } from '../../../expo-bridge/types.js';

const html = readFileSync(new URL('../../../expo-bridge/kalendus.html', import.meta.url), 'utf8');
const script = html.match(/<script>\n([\s\S]*?)\n<\/script>/)![1];
const date = (day = 7) => ({ year: 2026, month: 3, day });
const entry: CalendarEntry = {
    id: 'original-id',
    kind: 'timed',
    timeZone: 'Europe/Berlin',
    date: { start: date(7), end: date(10) },
    time: { start: { hour: 23, minute: 30 }, end: { hour: 1, minute: 0 } },
    heading: 'Original title',
    content: 'Original notes',
    color: '#123456',
};
const canonicalState: CalendarState = {
    activeDate: date(),
    viewMode: 'week',
    firstDayOfWeek: 1,
    range: { start: '2026-03-02', end: '2026-03-09' },
};
function snapshot(
    props: Snapshot['props'] = {},
    theme: Snapshot['theme'] = {},
    exporting = false,
): Snapshot {
    return { props, theme, capabilities: { exportICS: exporting, entryActivation: false } };
}
const packet = (
    value: Snapshot,
    seq = 1,
    session = 'native_session',
    document = 'document_id',
) => ({ version: 1, type: 'snapshot', session, document, seq, snapshot: value });
const flush = async () => {
    for (let i = 0; i < 12; i++) await Promise.resolve();
};
function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (reason: unknown) => void;
    const promise = new Promise<T>((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
}
class DetailEvent extends Event {
    constructor(
        type: string,
        public detail: unknown,
        options: EventInit = {},
    ) {
        super(type, options);
    }
}
function fixture() {
    const defined = deferred<void>();
    const rendered = deferred<boolean>();
    const messages: string[] = [];
    const timers = new Map<number, () => void>();
    const frames: (() => void)[] = [];
    const styles = new Map<string, string>();
    const cal = Object.assign(new EventTarget(), {
        heading: undefined as string | undefined,
        locale: 'en',
        firstDayOfWeek: 1,
        yearDrillTarget: 'month',
        yearDensityMode: 'dot',
        entries: [] as CalendarEntry[],
        color: '#000000',
        activeDate: date(),
        viewMode: 'month',
        visibleRange: { start: '2026-03-01', end: '2026-04-12' },
        updateComplete: rendered.promise,
        style: {
            setProperty: (k: string, v: string) => styles.set(k, v),
            removeProperty: (k: string) => styles.delete(k),
        },
    });
    const document = Object.assign(new EventTarget(), {
        documentElement: { lang: 'en' },
        getElementById: () => cal,
    });
    const window = Object.assign(new EventTarget(), {
        ReactNativeWebView: { postMessage: (s: string) => messages.push(s) },
    });
    const context = createContext({
        window,
        document,
        customElements: { whenDefined: () => defined.promise },
        setTimeout: (fn: () => void) => {
            const id = timers.size + 1;
            timers.set(id, fn);
            return id;
        },
        clearTimeout: (id: number) => timers.delete(id),
        requestAnimationFrame: (fn: () => void) => frames.push(fn),
        console,
        Intl,
        Date,
        Math,
    });
    runInContext(script, context);
    const receive = (raw: string) => runInContext(injection(raw), context);
    async function boot() {
        defined.resolve();
        rendered.resolve(true);
        await flush();
        frames.splice(0).forEach((fn) => fn());
        await flush();
    }
    const connect = (session = 'native_session') =>
        receive(JSON.stringify({ version: 1, type: 'connect', session }));
    const decoded = () => messages.map((raw) => JSON.parse(raw));
    async function apply(value: Snapshot, seq = 1, session = 'native_session') {
        const ready = decoded().find((m) => m.type === 'ready');
        receive(JSON.stringify(packet(value, seq, session, ready.document)));
        await flush();
    }
    return {
        defined,
        rendered,
        cal,
        window,
        document,
        timers,
        frames,
        styles,
        receive,
        boot,
        connect,
        decoded,
        apply,
        messages,
    };
}

describe('Expo bridge protocol and generated shell (no native runtime)', () => {
    describe('shared bounded runtime schema', () => {
        it('round-trips the canonical entry additions and optional legacy fields', () => {
            const value = packet(
                snapshot({
                    entries: [
                        entry,
                        { ...entry, time: undefined, kind: 'all-day', isContinuation: undefined },
                    ],
                }),
            );
            const raw = encodeInbound(value);
            expect(raw).to.be.a('string');
            expect(parseInbound(raw)).to.deep.equal(JSON.parse(JSON.stringify(value)));
        });
        it('accepts valid end-only 24:00, leap days and half-open state', () => {
            expect(
                validateSnapshot(
                    snapshot({
                        activeDate: { year: 2024, month: 2, day: 29 },
                        entries: [
                            {
                                ...entry,
                                time: {
                                    start: { hour: 0, minute: 0 },
                                    end: { hour: 24, minute: 0 },
                                },
                            },
                        ],
                    }),
                ),
            ).to.equal(true);
            expect(
                encodeOutbound({
                    version: 1,
                    type: 'event',
                    session: 'native_session',
                    document: 'document_id',
                    seq: 1,
                    name: 'calendar-state-change',
                    detail: canonicalState,
                }),
            ).to.be.a('string');
        });
        it('accepts the bounded public range and exclusive upper sentinel without lexical-order mistakes', () => {
            const envelope = {
                version: 1,
                type: 'event',
                session: 'native_session',
                document: 'document_id',
                seq: 1,
                name: 'calendar-state-change',
            };
            for (const range of [
                { start: '0001-01-01', end: '0001-02-11' },
                { start: '9999-12-01', end: '10000-01-01' },
            ]) {
                expect(
                    encodeOutbound({ ...envelope, detail: { ...canonicalState, range } }),
                ).to.be.a('string');
            }
            expect(
                encodeOutbound({
                    ...envelope,
                    detail: {
                        ...canonicalState,
                        range: { start: '10000-01-01', end: '9999-12-01' },
                    },
                }),
            ).to.equal(null);
        });
        it('rejects malformed/null/unknown/oversized inbound and outbound messages without throwing', () => {
            for (const raw of [
                null,
                undefined,
                42,
                {},
                '',
                'null',
                '[]',
                '{}',
                '{',
                '"text"',
                'x'.repeat(MAX_MESSAGE_BYTES + 1),
            ]) {
                expect(parseInbound(raw)).to.equal(null);
                expect(parseOutbound(raw)).to.equal(null);
            }
            for (const change of [
                { version: 2 },
                { seq: 0 },
                { seq: -1 },
                { seq: 1.1 },
                { document: '' },
                { session: 'tiny' },
                { extra: true },
                { type: 'setProps' },
            ]) {
                expect(parseInbound(JSON.stringify({ ...packet(snapshot()), ...change }))).to.equal(
                    null,
                );
            }
            const cycle: Record<string, unknown> = {};
            cycle.self = cycle;
            expect(encodeInbound(cycle)).to.equal(null);
            expect(encodeOutbound(cycle)).to.equal(null);
            expect(
                encodeInbound({
                    ...packet(snapshot()),
                    snapshot: { ...snapshot(), props: { heading: () => 'hidden' } },
                }),
            ).to.equal(null);
        });
        it('bounds actual UTF-8 bytes, not just UTF-16 string length', () => {
            expect(byteLength('Aé😀')).to.equal(7);
            const huge = snapshot({
                entries: Array.from({ length: 40 }, () => ({
                    ...entry,
                    content: 'é'.repeat(16000),
                })),
            });
            const raw = JSON.stringify(packet(huge));
            expect(raw.length).to.be.lessThan(MAX_MESSAGE_BYTES);
            expect(parseInbound(raw)).to.equal(null);
            expect(encodeInbound(packet(huge))).to.equal(null);
        });
        it('rejects invalid props, impossible dates, times, entry keys, locale and theme declarations', () => {
            const badProps = [
                { activeDate: { year: 2026, month: 2, day: 30 } },
                { viewMode: 'agenda' },
                { firstDayOfWeek: 7 },
                { firstDayOfWeek: '1' },
                { locale: 'en_XX' },
                { heading: null },
                { entries: [null] },
                { entries: Array.from({ length: 2001 }, () => entry) },
                { entries: [{ ...entry, timeZone: 'Not/AZone' }] },
                { entries: [{ ...entry, kind: 'timed', time: undefined }] },
                { entries: [{ ...entry, injected: true }] },
                {
                    entries: [
                        {
                            ...entry,
                            time: { start: { hour: 24, minute: 0 }, end: { hour: 24, minute: 1 } },
                        },
                    ],
                },
                { entries: [{ ...entry, kind: undefined }] }, // legacy daily windows cannot run backwards
                { entries: [{ ...entry, date: { start: date(), end: date() } }] }, // same-day timed reversal
                { color: 'red;position:fixed' },
                { privateProperty: true },
            ];
            for (const props of badProps)
                expect(
                    validateSnapshot({ ...snapshot(), props }),
                    JSON.stringify(props).slice(0, 100),
                ).to.equal(false);
            for (const theme of [
                { color: 'red' },
                { '--valid': 'url(https://evil.test)' },
                { '--valid': 'red!important;display:none' },
                { '--valid': 'u\\72l(x)' },
                { '--valid': 'image-set("https://evil.test")' },
                { '--valid': '/* hidden */' },
                { '--valid': '<style>' },
                Object.fromEntries(Array.from({ length: 129 }, (_, i) => [`--token-${i}`, 'red'])),
            ]) {
                expect(validateSnapshot(snapshot({}, theme))).to.equal(false);
            }
        });
        it('validates event payloads in both directions instead of trusting a type discriminator', () => {
            const envelope = {
                version: 1,
                type: 'event',
                session: 'native_session',
                document: 'document_id',
                seq: 1,
            };
            for (const value of [
                { ...envelope, name: 'unknown', detail: {} },
                { ...envelope, name: 'export-ics', detail: { heading: '', content: '' } },
                {
                    ...envelope,
                    name: 'calendar-state-change',
                    detail: {
                        ...canonicalState,
                        range: { start: '2026-03-09', end: '2026-03-02' },
                    },
                },
                { ...envelope, name: 'switchdate', detail: { direction: 'sideways' } },
            ]) {
                expect(encodeOutbound(value)).to.equal(null);
                expect(parseOutbound(JSON.stringify(value))).to.equal(null);
            }
        });
    });

    describe('real generated script readiness and lifecycle', () => {
        it('does not signal ready until definition, root render, bridge installation and a frame', async () => {
            const f = fixture();
            f.connect();
            expect(f.messages).to.have.length(0);
            f.defined.resolve();
            await flush();
            expect(f.messages).to.have.length(0);
            f.rendered.resolve(true);
            await flush();
            expect(f.messages).to.have.length(0);
            f.frames.splice(0).forEach((fn) => fn());
            await flush();
            expect(f.decoded().map((m) => m.type)).to.deep.equal(['ready']);
            expect(f.timers.size).to.equal(0);
        });
        it('reports missing definitions or rejected renders and never reports ready', async () => {
            const missing = fixture();
            missing.connect();
            missing.timers.forEach((fn) => fn());
            await missing.boot();
            expect(missing.decoded().every((m) => m.type === 'error')).to.equal(true);
            expect(missing.decoded()[0].message).to.include('timed out');
            const rejected = fixture();
            rejected.connect();
            rejected.defined.resolve();
            rejected.rendered.reject(new Error('broken'));
            await flush();
            expect(rejected.decoded().map((m) => m.type)).to.deep.equal(['error']);
        });
        it('does not report ready for a defined/rendered but incompatible old calendar bundle', async () => {
            const f = fixture();
            f.connect();
            Reflect.deleteProperty(f.cal, 'visibleRange');
            await f.boot();
            expect(f.decoded().map((m) => m.type)).to.deep.equal(['error']);
        });
        it('handshakes if native connects after the shell has rendered', async () => {
            const f = fixture();
            await f.boot();
            expect(f.messages).to.have.length(0);
            f.connect();
            expect(f.decoded()[0].type).to.equal('ready');
            f.connect();
            expect(f.messages).to.have.length(1);
        });
        it('uses the latest current props/theme on first ready, not the queued startup snapshot', async () => {
            const native = new NativeSession();
            const f = fixture();
            let current = snapshot({ heading: 'startup' }, { '--primary-color': 'red' });
            expect(native.synchronize(current).raw).to.equal(null);
            f.receive(native.connect());
            current = snapshot(
                {
                    heading: 'latest',
                    entries: [entry],
                    activeDate: date(10),
                    viewMode: 'week',
                    locale: 'ar',
                },
                { '--primary-color': 'blue' },
                true,
            );
            await f.boot();
            expect(native.receive(f.messages[0])?.type).to.equal('ready');
            const next = native.synchronize(current);
            expect(next.invalid).to.equal(false);
            f.receive(next.raw!);
            await flush();
            expect(f.cal.heading).to.equal('latest');
            expect(f.cal.entries).to.deep.equal([entry]);
            expect(f.cal.activeDate).to.deep.equal(date(10));
            expect(f.cal.viewMode).to.equal('week');
            expect(f.styles.get('--primary-color')).to.equal('blue');
            expect(f.document.documentElement.lang).to.equal('ar');
            expect(native.synchronize(current).raw).to.equal(null);
        });
        it('replays identical controlled state after reload and rejects delayed old-document messages', async () => {
            const native = new NativeSession();
            const current = snapshot(
                {
                    heading: 'kept',
                    entries: [entry],
                    locale: 'he',
                    activeDate: date(10),
                    viewMode: 'day',
                },
                { '--text-color': 'black' },
            );
            const first = fixture();
            first.receive(native.connect());
            await first.boot();
            native.receive(first.messages[0]);
            const original = native.synchronize(current).raw!;
            first.receive(original);
            await flush();
            const oldState = first.messages[first.messages.length - 1];
            native.reset();
            expect(native.document).to.equal(null);
            expect(native.receive(first.messages[0])).to.equal(null);
            expect(native.receive(oldState)).to.equal(null);
            const second = fixture();
            second.receive(native.connect());
            await second.boot();
            native.receive(second.messages[0]);
            const replay = native.synchronize(current).raw!;
            expect(replay).to.be.a('string');
            second.receive(replay);
            await flush();
            expect(second.cal.heading).to.equal('kept');
            expect(second.cal.entries).to.deep.equal([entry]);
            expect(second.cal.activeDate).to.deep.equal(date(10));
            expect(second.cal.viewMode).to.equal('day');
            expect(second.styles.get('--text-color')).to.equal('black');
            expect(second.document.documentElement.lang).to.equal('he');
            second.receive(original);
            expect(second.cal.heading).to.equal('kept');
        });
        it('resets removed optional props and removes old theme keys, including whole-theme removal', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(
                snapshot(
                    {
                        heading: 'Override',
                        locale: 'ar',
                        color: 'red',
                        firstDayOfWeek: 0,
                        yearDensityMode: 'count',
                        yearDrillTarget: 'day',
                        activeDate: date(20),
                        viewMode: 'year',
                        entries: [entry],
                    },
                    { '--text-color': 'white', '--primary-color': 'red' },
                    true,
                ),
            );
            await f.apply(snapshot({}, { '--primary-color': 'blue' }), 2);
            expect(f.cal.heading).to.equal(undefined);
            expect(f.cal.locale).to.equal('en');
            expect(f.cal.color).to.equal('#000000');
            expect(f.cal.firstDayOfWeek).to.equal(1);
            expect(f.cal.yearDensityMode).to.equal('dot');
            expect(f.cal.yearDrillTarget).to.equal('month');
            expect(f.cal.activeDate).to.deep.equal(date());
            expect(f.cal.viewMode).to.equal('month');
            expect(f.cal.entries).to.deep.equal([]);
            expect(f.document.documentElement.lang).to.equal('en');
            expect([...f.styles]).to.deep.equal([['--primary-color', 'blue']]);
            await f.apply(snapshot(), 3);
            expect(f.styles.size).to.equal(0);
        });
        it('does not reset uncontrolled navigation on unrelated updates', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot({ heading: 'one' }));
            f.cal.activeDate = date(20);
            f.cal.viewMode = 'week';
            await f.apply(snapshot({ heading: 'two' }), 2);
            expect(f.cal.activeDate).to.deep.equal(date(20));
            expect(f.cal.viewMode).to.equal('week');
        });
        it('forwards canonical committed state with the half-open range and deduplicates it', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot());
            f.cal.dispatchEvent(new DetailEvent('calendar-state-change', canonicalState));
            f.cal.dispatchEvent(new DetailEvent('calendar-state-change', canonicalState));
            const states = f.decoded().filter((m) => m.name === 'calendar-state-change');
            expect(states).to.have.length(2); // initial snapshot state, then the committed change
            expect(states[1].detail).to.deep.equal(canonicalState);
        });
        it('rejects browser postMessage, malformed snapshots, stale sessions/documents and replayed sequence numbers', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot({ heading: 'valid' }));
            const doc = f.decoded()[0].document;
            for (const bad of [
                'null',
                '{',
                JSON.stringify(packet(snapshot({ heading: 'evil' }), 2, 'wrong_session', doc)),
                JSON.stringify(
                    packet(snapshot({ heading: 'evil' }), 2, 'native_session', 'wrong_document'),
                ),
                JSON.stringify(packet(snapshot({ heading: 'evil' }), 1, 'native_session', doc)),
                JSON.stringify({
                    ...packet(snapshot(), 2, 'native_session', doc),
                    snapshot: { props: null },
                }),
            ])
                f.receive(bad);
            const browser = Object.assign(new Event('message'), {
                data: JSON.stringify(
                    packet(snapshot({ heading: 'evil' }), 2, 'native_session', doc),
                ),
                origin: 'null',
            });
            f.window.dispatchEvent(browser);
            f.document.dispatchEvent(browser);
            expect(f.cal.heading).to.equal('valid');
            f.connect('other_session');
            await f.apply(snapshot({ heading: 'still valid' }), 2);
            expect(f.cal.heading).to.equal('still valid');
        });
    });

    describe('public event interception, not private component patches', () => {
        it('intercepts one public export request with canonical endpoints/id and compatibility fields', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot({}, {}, true));
            const event = new DetailEvent(
                'export-entry',
                { entry, eventId: entry.id },
                { cancelable: true, bubbles: true, composed: true },
            );
            expect(f.cal.dispatchEvent(event)).to.equal(false);
            const exports = f.decoded().filter((m) => m.name === 'export-ics');
            expect(exports).to.have.length(1);
            expect(exports[0].detail).to.deep.equal({
                entry,
                eventId: entry.id,
                heading: entry.heading,
                content: entry.content,
                date: entry.date.start,
                time: entry.time,
                displayTime: '23:30–01:00',
            });
            expect(exports[0].detail.entry.date.end).to.deep.equal(date(10));
        });
        it('accepts and exports minimal public entries without optional notes or colors', async () => {
            const minimal: CalendarEntry = {
                date: { start: date(), end: date() },
                heading: 'Minimal',
                kind: 'all-day',
            };
            expect(validateSnapshot(snapshot({ entries: [minimal] }))).to.equal(true);
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot({}, {}, true));
            const event = new DetailEvent('export-entry', { entry: minimal }, { cancelable: true });
            expect(f.cal.dispatchEvent(event)).to.equal(false);
            const exports = f.decoded().filter((m) => m.name === 'export-ics');
            expect(exports).to.have.length(1);
            expect(exports[0].detail.entry).to.deep.equal(minimal);
            expect(exports[0].detail.content).to.equal('');
        });
        it('leaves browser export alone without a handler/capability, after handler removal, or on invalid requests', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot());
            const fire = (detail: unknown) => {
                const e = new DetailEvent('export-entry', detail, { cancelable: true });
                f.cal.dispatchEvent(e);
                return e.defaultPrevented;
            };
            expect(fire({ entry })).to.equal(false);
            await f.apply(snapshot({}, {}, true), 2);
            expect(fire({ entry: null })).to.equal(false);
            expect(fire({ entry: { ...entry, content: 'x'.repeat(32769) } })).to.equal(false);
            expect(fire({ entry })).to.equal(true);
            await f.apply(snapshot(), 3);
            expect(fire({ entry })).to.equal(false);
            expect(f.decoded().filter((m) => m.name === 'export-ics')).to.have.length(1);
        });
        it('cancels activation only for an explicit native capability and retains the legacy open-menu notification', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot());
            let event = new DetailEvent('entry-activate', { entry }, { cancelable: true });
            f.cal.dispatchEvent(event);
            expect(event.defaultPrevented).to.equal(false);
            const next = snapshot();
            next.capabilities.entryActivation = true;
            await f.apply(next, 2);
            event = new DetailEvent('entry-activate', { entry }, { cancelable: true });
            f.cal.dispatchEvent(event);
            expect(event.defaultPrevented).to.equal(true);
            f.cal.dispatchEvent(
                new DetailEvent('open-menu', {
                    heading: entry.heading,
                    content: entry.content,
                    displayTime: '',
                    entry,
                    date: entry.date.start,
                    anchorRect: { circularDOMLike: true },
                }),
            );
            const press = f.decoded().find((m) => m.name === 'open-menu');
            expect(press.detail).not.to.have.property('anchorRect');
            expect(press.detail.entry).to.deep.equal(entry);
        });
        it('does not cancel export if native transport throws', async () => {
            const f = fixture();
            f.connect();
            await f.boot();
            await f.apply(snapshot({}, {}, true));
            f.window.ReactNativeWebView.postMessage = () => {
                throw new Error('native gone');
            };
            const e = new DetailEvent('export-entry', { entry }, { cancelable: true });
            f.cal.dispatchEvent(e);
            expect(e.defaultPrevented).to.equal(false);
        });
        it('authors no zoom restriction, private patch, or ordinary browser message listener', () => {
            expect(html).not.to.match(/maximum-scale|user-scalable|_handleExport|MutationObserver/);
            expect(html).not.to.match(/addEventListener\(["']message/);
            expect(html).to.include('width=device-width, initial-scale=1');
        });
    });

    describe('native lifecycle state machine', () => {
        it('requires ready before events and rejects duplicates, wrong versions/documents and stale sequences', () => {
            const native = new NativeSession();
            const base = { version: 1, session: native.session, document: 'document_id', seq: 1 };
            const event = {
                ...base,
                type: 'event',
                name: 'calendar-state-change',
                detail: canonicalState,
            };
            expect(native.receive(JSON.stringify(event))).to.equal(null);
            expect(native.receive(JSON.stringify({ ...base, type: 'ready' }))?.type).to.equal(
                'ready',
            );
            expect(native.receive(JSON.stringify({ ...base, type: 'ready', seq: 2 }))).to.equal(
                null,
            );
            expect(native.receive(JSON.stringify(event))).to.equal(null);
            expect(
                native.receive(JSON.stringify({ ...event, seq: 2, document: 'other_document' })),
            ).to.equal(null);
            expect(native.receive(JSON.stringify({ ...event, seq: 2, version: 2 }))).to.equal(null);
            expect(native.receive(JSON.stringify({ ...event, seq: 2 }))?.type).to.equal('event');
        });
        it('rejects bad/cyclic snapshots without poisoning the next valid snapshot', () => {
            const native = new NativeSession();
            native.receive(
                JSON.stringify({
                    version: 1,
                    session: native.session,
                    document: 'document_id',
                    seq: 1,
                    type: 'ready',
                }),
            );
            const bad = snapshot();
            Reflect.set(bad.props, 'entries', [bad]);
            expect(native.synchronize(bad)).to.deep.equal({ raw: null, invalid: true });
            expect(native.synchronize(snapshot()).raw).to.be.a('string');
        });
        it('escapes script literals without changing their JSON value', () => {
            const raw = JSON.stringify(packet(snapshot({ heading: '</script>\u2028\u2029' })));
            const target: string[] = [];
            runInContext(
                injection(raw),
                createContext({
                    window: { __kalendusReceive: (value: string) => target.push(value) },
                }),
            );
            expect(target).to.deep.equal([raw]);
            expect(injection(raw)).not.to.include('</script>');
        });
    });
});
