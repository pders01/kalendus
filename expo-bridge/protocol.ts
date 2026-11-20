import type { ConnectMessage, InboundMessage, OutboundMessage, Snapshot } from './types.js';

export const VERSION = 2;
export const MAX_MESSAGE_BYTES = 1_048_576;
export const MAX_ENTRIES = 2000;
const MAX_DIAGNOSTIC_ISSUES = 20;
export const ENTRY_ISSUE_REASONS = [
    'Entries must be an array',
    'Entry must be an object',
    'Invalid date interval',
    'Invalid temporal kind',
    'Invalid entry ID',
    'Invalid continuation flag',
    'Invalid IANA time zone',
    'Invalid heading',
    'Invalid content',
    'Invalid color',
    'Reversed date interval',
    'Invalid time interval',
    'Timed entry requires time endpoints',
    'Reversed time interval',
    'Nonexistent or ambiguous zoned endpoint',
    'Duplicate entry ID; first valid record wins',
    'Duplicate source object; first valid record wins',
    'Other validation issue',
] as const;
export const PROP_KEYS = [
    'heading',
    'firstDayOfWeek',
    'locale',
    'yearDrillTarget',
    'yearDensityMode',
    'entries',
    'color',
    'activeDate',
    'viewMode',
] as const;

type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue =>
    v !== null && typeof v === 'object' && !Array.isArray(v);
const keys = (v: RecordValue, allowed: readonly string[]) =>
    Object.keys(v).every((k) => allowed.includes(k));
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.length <= max;
const integer = (v: unknown, min: number, max: number): v is number =>
    typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const choice = (v: unknown, values: readonly string[]) =>
    typeof v === 'string' && values.includes(v);
const optional = (v: RecordValue, k: string, check: (value: unknown) => boolean) =>
    !(k in v) || v[k] === undefined || check(v[k]);
const token = (v: unknown): v is string =>
    typeof v === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(v);
const view = (v: unknown) => choice(v, ['month', 'week', 'day', 'year']);
const drill = (v: unknown) => choice(v, ['month', 'week', 'day']);
const identity = (v: unknown) => text(v, 256) && v.length > 0;

export function isDate(v: unknown): boolean {
    if (
        !record(v) ||
        !keys(v, ['year', 'month', 'day']) ||
        !integer(v.year, 1, 9999) ||
        !integer(v.month, 1, 12) ||
        !integer(v.day, 1, 31)
    )
        return false;
    const leap = v.year % 4 === 0 && (v.year % 100 !== 0 || v.year % 400 === 0);
    return v.day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][v.month - 1];
}
const dateKey = (v: RecordValue) => Number(v.year) * 10000 + Number(v.month) * 100 + Number(v.day);
const time = (v: unknown, end = false) =>
    record(v) &&
    keys(v, ['hour', 'minute']) &&
    integer(v.minute, 0, 59) &&
    (integer(v.hour, 0, 23) || (end && v.hour === 24 && v.minute === 0));
const times = (v: unknown) =>
    record(v) && keys(v, ['start', 'end']) && time(v.start) && time(v.end, true);
const dates = (v: unknown) =>
    record(v) &&
    keys(v, ['start', 'end']) &&
    isDate(v.start) &&
    isDate(v.end) &&
    record(v.start) &&
    record(v.end) &&
    dateKey(v.start) <= dateKey(v.end);
function isoKey(v: unknown, upperBoundary = false): number | null {
    if (upperBoundary && v === '10000-01-01') return 100000101;
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    const [year, month, day] = v.split('-').map(Number);
    return isDate({ year, month, day }) ? year * 10000 + month * 100 + day : null;
}
// Do not allow declarations, resource loads, escapes or executable CSS. Values are
// assigned with style.setProperty, never concatenated into markup/stylesheets.
const cssValue = (v: unknown) =>
    text(v, 512) &&
    !/[;{}<>\\@]/.test(v) &&
    !Array.from(v).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127) &&
    !/(?:url|expression|image-set|image|cross-fade|paint|element|src)\s*\(|\/\*/i.test(v);
const color = (v: unknown) => text(v, 128) && v.length > 0 && cssValue(v);
const locale = (v: unknown) => {
    if (!text(v, 64) || !/^[a-zA-Z]{2,8}(?:-[a-zA-Z0-9]{1,8})*$/.test(v)) return false;
    try {
        return Intl.getCanonicalLocales(v).length === 1;
    } catch {
        return false;
    }
};
const zone = (v: unknown) => {
    if (!text(v, 128) || v.length === 0) return false;
    try {
        new Intl.DateTimeFormat('en', { timeZone: v });
        return true;
    } catch {
        return false;
    }
};
function timeOrder(v: RecordValue): boolean {
    if (v.time === undefined || v.kind === 'all-day') return true;
    if (
        !record(v.time) ||
        !record(v.time.start) ||
        !record(v.time.end) ||
        !record(v.date) ||
        !record(v.date.start) ||
        !record(v.date.end)
    )
        return false;
    if (v.kind === 'timed' && dateKey(v.date.start) < dateKey(v.date.end)) return true;
    const minutes = (value: RecordValue) => Number(value.hour) * 60 + Number(value.minute);
    return minutes(v.time.start) <= minutes(v.time.end);
}
export function isEntry(v: unknown): boolean {
    return (
        record(v) &&
        keys(v, [
            'id',
            'calendarId',
            'kind',
            'timeZone',
            'date',
            'time',
            'heading',
            'content',
            'color',
            'isContinuation',
            'continuation',
        ]) &&
        dates(v.date) &&
        text(v.heading, 2048) &&
        optional(v, 'content', (x) => text(x, 32768)) &&
        optional(v, 'color', color) &&
        optional(v, 'id', identity) &&
        optional(v, 'calendarId', identity) &&
        optional(v, 'kind', (x) => choice(x, ['all-day', 'timed'])) &&
        optional(v, 'timeZone', zone) &&
        optional(v, 'time', times) &&
        (v.kind !== 'timed' || times(v.time)) &&
        timeOrder(v) &&
        optional(v, 'isContinuation', (x) => typeof x === 'boolean') &&
        optional(
            v,
            'continuation',
            (x) =>
                record(x) &&
                keys(x, ['has', 'is', 'index', 'total']) &&
                typeof x.has === 'boolean' &&
                typeof x.is === 'boolean' &&
                integer(x.total, 1, 3_652_059) &&
                integer(x.index, 0, x.total - 1),
        )
    );
}
function props(v: unknown): boolean {
    return (
        record(v) &&
        keys(v, PROP_KEYS) &&
        optional(v, 'heading', (x) => text(x, 2048)) &&
        optional(v, 'firstDayOfWeek', (x) => integer(x, 0, 6)) &&
        optional(v, 'locale', locale) &&
        optional(v, 'yearDrillTarget', drill) &&
        optional(v, 'yearDensityMode', (x) => choice(x, ['dot', 'heatmap', 'count'])) &&
        optional(
            v,
            'entries',
            (x) => Array.isArray(x) && x.length <= MAX_ENTRIES && x.every(isEntry),
        ) &&
        optional(v, 'color', color) &&
        optional(v, 'activeDate', isDate) &&
        optional(v, 'viewMode', view)
    );
}
function theme(v: unknown): boolean {
    return (
        record(v) &&
        Object.keys(v).length <= 128 &&
        Object.entries(v).every(
            ([k, value]) => /^--[a-z][a-z0-9-]{0,79}$/.test(k) && cssValue(value),
        )
    );
}
function snapshot(v: unknown): boolean {
    return (
        record(v) &&
        keys(v, ['props', 'theme', 'capabilities', 'navigationRevision']) &&
        optional(v, 'navigationRevision', (x) => integer(x, 0, Number.MAX_SAFE_INTEGER)) &&
        props(v.props) &&
        theme(v.theme) &&
        record(v.capabilities) &&
        keys(v.capabilities, ['exportICS', 'entryActivation']) &&
        typeof v.capabilities.exportICS === 'boolean' &&
        typeof v.capabilities.entryActivation === 'boolean'
    );
}
function request(v: unknown): boolean {
    return (
        record(v) &&
        keys(v, ['entry', 'eventId']) &&
        isEntry(v.entry) &&
        optional(v, 'eventId', identity)
    );
}
function entryPress(v: unknown, exporting = false): boolean {
    return (
        record(v) &&
        keys(v, ['heading', 'content', 'displayTime', 'date', 'time', 'entry', 'eventId']) &&
        text(v.heading, 2048) &&
        text(v.content, 32768) &&
        text(v.displayTime, 2048) &&
        optional(v, 'date', isDate) &&
        optional(v, 'time', times) &&
        optional(v, 'entry', isEntry) &&
        optional(v, 'eventId', identity) &&
        (!exporting || isEntry(v.entry))
    );
}
export function isState(v: unknown): boolean {
    return (
        record(v) &&
        keys(v, ['activeDate', 'viewMode', 'firstDayOfWeek', 'range']) &&
        isDate(v.activeDate) &&
        view(v.viewMode) &&
        integer(v.firstDayOfWeek, 0, 6) &&
        record(v.range) &&
        keys(v.range, ['start', 'end']) &&
        isoKey(v.range.start) !== null &&
        isoKey(v.range.end, true) !== null &&
        Number(isoKey(v.range.start)) < Number(isoKey(v.range.end, true))
    );
}
/** Do not even read issue.entry: it can contain arbitrary caller data. */
export function projectEntriesInvalid(v: unknown) {
    if (!record(v) || !Array.isArray(v.issues) || !integer(v.issues.length, 1, MAX_ENTRIES))
        return null;
    const issues = [];
    for (const issue of v.issues.slice(0, MAX_DIAGNOSTIC_ISSUES)) {
        if (!record(issue) || !integer(issue.index, -1, MAX_ENTRIES - 1)) return null;
        issues.push({
            index: issue.index,
            reason:
                ENTRY_ISSUE_REASONS.find((reason) => reason === issue.reason) ??
                'Other validation issue',
        });
    }
    return { issueCount: v.issues.length, issues };
}
function detail(name: unknown, v: unknown): boolean {
    if (!record(v)) return false;
    switch (name) {
        case 'open-menu':
            return entryPress(v);
        case 'export-ics':
            return entryPress(v, true);
        case 'entry-activate':
            return request(v);
        case 'calendar-state-change':
            return isState(v);
        case 'entries-invalid':
            return (
                keys(v, ['issueCount', 'issues']) &&
                integer(v.issueCount, 1, MAX_ENTRIES) &&
                Array.isArray(v.issues) &&
                v.issues.length === Math.min(v.issueCount, MAX_DIAGNOSTIC_ISSUES) &&
                v.issues.every(
                    (issue) =>
                        record(issue) &&
                        keys(issue, ['index', 'reason']) &&
                        integer(issue.index, -1, MAX_ENTRIES - 1) &&
                        choice(issue.reason, ENTRY_ISSUE_REASONS),
                )
            );
        case 'expand':
            return (
                keys(v, ['date', 'drillTarget']) &&
                isDate(v.date) &&
                optional(v, 'drillTarget', drill)
            );
        case 'switchview':
            return keys(v, ['view']) && view(v.view);
        case 'switchdate':
            return keys(v, ['direction']) && choice(v.direction, ['next', 'previous']);
        case 'jumptoday':
            return keys(v, ['date']) && isDate(v.date);
        case 'menu-close':
            return keys(v, []);
        default:
            return false;
    }
}
function envelope(v: RecordValue): boolean {
    return token(v.session) && token(v.document) && integer(v.seq, 1, Number.MAX_SAFE_INTEGER);
}
function inbound(v: unknown): v is InboundMessage | ConnectMessage {
    if (!record(v) || v.version !== VERSION) return false;
    if (v.type === 'connect') return keys(v, ['version', 'type', 'session']) && token(v.session);
    return (
        keys(v, ['version', 'type', 'session', 'document', 'seq', 'snapshot']) &&
        envelope(v) &&
        v.type === 'snapshot' &&
        snapshot(v.snapshot)
    );
}
function outbound(v: unknown): v is OutboundMessage {
    // Gate ready as well as events/errors: only a matching shell can bind native.
    if (!record(v) || v.version !== VERSION || !envelope(v)) return false;
    if (v.type === 'ready') return keys(v, ['version', 'type', 'session', 'document', 'seq']);
    if (v.type === 'error')
        return (
            keys(v, ['version', 'type', 'session', 'document', 'seq', 'message']) &&
            text(v.message, 2048)
        );
    return (
        keys(v, ['version', 'type', 'session', 'document', 'seq', 'name', 'detail']) &&
        v.type === 'event' &&
        detail(v.name, v.detail)
    );
}
/** Exact UTF-8 size without relying on TextEncoder in React Native. */
export function byteLength(s: string): number {
    let bytes = 0;
    for (const char of s) {
        const cp = char.codePointAt(0)!;
        bytes += cp <= 0x7f ? 1 : cp <= 0x7ff ? 2 : cp <= 0xffff ? 3 : 4;
    }
    return bytes;
}
function decode<T>(raw: unknown, validate: (v: unknown) => v is T): T | null {
    try {
        if (
            typeof raw !== 'string' ||
            raw.length > MAX_MESSAGE_BYTES ||
            byteLength(raw) > MAX_MESSAGE_BYTES
        )
            return null;
        const value: unknown = JSON.parse(raw);
        return validate(value) ? value : null;
    } catch {
        return null;
    }
}
export const parseInbound = (raw: unknown) => decode(raw, inbound);
export const parseOutbound = (raw: unknown) => decode(raw, outbound);
function encode(value: unknown, validate: (v: unknown) => boolean): string | null {
    try {
        // Check before AND after serialization: functions/toJSON must not silently
        // disappear into an apparently valid snapshot. Optional undefined is omission.
        if (!validate(value)) return null;
        const raw = JSON.stringify(value);
        return raw &&
            raw.length <= MAX_MESSAGE_BYTES &&
            byteLength(raw) <= MAX_MESSAGE_BYTES &&
            validate(JSON.parse(raw))
            ? raw
            : null;
    } catch {
        return null;
    }
}
export const encodeInbound = (v: unknown) => encode(v, inbound);
export const encodeOutbound = (v: unknown) => encode(v, outbound);
export function validateSnapshot(v: unknown): v is Snapshot {
    return (
        encode(
            {
                version: VERSION,
                session: 'validate',
                document: 'validate',
                seq: 1,
                type: 'snapshot',
                snapshot: v,
            },
            inbound,
        ) !== null
    );
}
let counter = 0;
/** Freshness marker, NOT a credential or a substitute for trusted shell code. */
export const newToken = () =>
    `k_${Date.now().toString(36)}_${(++counter).toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
/** Encode a string literal safely even if the transport embeds it in a script. */
export const jsString = (s: string) =>
    JSON.stringify(s)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029');
export const injection = (raw: string) =>
    `window.__kalendusReceive && window.__kalendusReceive(${jsString(raw)}); true;`;

/** Lifecycle state shared by React and the non-native regressions. Kept in this
 * pure module so app sources need no runtime .js-to-.ts remapping in Metro. */
export class NativeSession {
    session = newToken();
    document: string | null = null;
    private incoming = 0;
    private outgoing = 0;
    private lastSnapshot: string | null = null;
    reset(): void {
        this.session = newToken();
        this.document = null;
        this.incoming = this.outgoing = 0;
        this.lastSnapshot = null;
    }
    connect(): string {
        return JSON.stringify({ version: VERSION, type: 'connect', session: this.session });
    }
    receive(raw: unknown): OutboundMessage | null {
        const msg = parseOutbound(raw);
        if (!msg || msg.session !== this.session || msg.seq <= this.incoming) return null;
        if (this.document === null) {
            // Startup errors must never establish readiness.
            if (msg.type === 'error') return msg;
            if (msg.type !== 'ready') return null;
            this.document = msg.document;
        } else if (msg.document !== this.document || msg.type === 'ready') return null;
        this.incoming = msg.seq;
        return msg;
    }
    /** Read current props at ready time, not a startup-time queued closure. */
    synchronize(current: Snapshot): { raw: string | null; invalid: boolean; initial?: boolean } {
        if (this.document === null) return { raw: null, invalid: false };
        const raw = encodeInbound({
            version: VERSION,
            type: 'snapshot',
            session: this.session,
            document: this.document,
            seq: this.outgoing + 1,
            snapshot: current,
        });
        if (!raw) return { raw: null, invalid: true };
        // Compare only after validation: cycles cannot crash a render/effect.
        const json = JSON.stringify(JSON.parse(raw).snapshot);
        if (json === this.lastSnapshot) return { raw: null, invalid: false };
        const initial = this.lastSnapshot === null;
        this.lastSnapshot = json;
        this.outgoing++;
        return { raw, invalid: false, initial };
    }
}
