import type { CalendarEntryRequest } from './contracts.js';
import { civilDayDifference, isValidCalendarDate } from './lib/calendarModel.js';
import { proposeTimedEntryChange, type TimedEntryOperation } from './lib/timedEntryChange.js';
import type Calendar from './lms-calendar.js';
import type { CalendarDate, CalendarEntry, CalendarTime } from './lms-calendar.js';

export type EntryOperation = TimedEntryOperation;

/** A proposed edit, not a notification that any data has changed. */
export interface EntryChangeRequest extends CalendarEntryRequest {
    operation: EntryOperation;
    proposed: CalendarEntry;
    source: 'pointer' | 'api';
}

export interface EntryInteractionOptions {
    /** Pointer movement increment in minutes, relative to the original time. Default: 15. */
    snapMinutes?: number;
    /** Synchronous application policy for the original entry and operation. */
    canChange?: (entry: CalendarEntry, operation: EntryOperation) => boolean;
}

export interface EntryInteractions {
    /** Propose an edit to a current record from app-owned controls, without a drag. */
    requestChange(entry: CalendarEntry, operation: EntryOperation, deltaMinutes: number): boolean;
    /** Cancel an active gesture and remove listeners and visual affordances. */
    dispose(): void;
}

declare global {
    interface HTMLElementEventMap {
        'entry-change-request': CustomEvent<EntryChangeRequest>;
    }
}

type Card = HTMLElementTagNameMap['lms-calendar-entry'];
type Grid = HTMLElementTagNameMap['lms-calendar-day'] | HTMLElementTagNameMap['lms-calendar-week'];
type Column = { element: HTMLElement; date: CalendarDate };
type Coordinates = { clientX: number; clientY: number };

const attached = new WeakSet<Calendar>();
const dayMinutes = 1440;
const move: EntryOperation = { kind: 'move' };
const editAttribute = 'data-kalendus-edit';
const gripAttribute = 'data-kalendus-grips';

const styles = `
    lms-calendar-entry[${editAttribute}=move] { cursor: grab; }
    lms-calendar-entry[${editAttribute}=resize] { cursor: ns-resize; }
    lms-calendar-entry[${gripAttribute}]::after {
        content: '';
        position: absolute;
        inset-block: 1px;
        inset-inline: 32%;
        border-radius: 2px;
        border-block: 2px solid currentColor;
        pointer-events: none;
    }
    lms-calendar-entry[${gripAttribute}=start]::after { border-block-end: 0; }
    lms-calendar-entry[${gripAttribute}=end]::after { border-block-start: 0; }
`;

function relativeMinute(origin: CalendarDate, date: CalendarDate, time: CalendarTime) {
    return civilDayDifference(origin, date) * dayMinutes + time.hour * 60 + time.minute;
}

function columnDate(grid: Grid, element: HTMLElement) {
    const name = element.querySelector('slot')?.name;
    if (name === 'timed') return grid.activeDate;
    if (!name?.startsWith('timed-')) return undefined;
    const [year, month, day] = name.slice(6).split('-').map(Number);
    const date = { year, month, day };
    return isValidCalendarDate(date) ? date : undefined;
}

function cardFrom(event: Event, calendar: Calendar) {
    return event
        .composedPath()
        .find(
            (node): node is Card =>
                node instanceof HTMLElement &&
                node.localName === 'lms-calendar-entry' &&
                node.getRootNode() === calendar.shadowRoot,
        );
}

function gripAt(
    card: Card,
    entry: CalendarEntry,
    date: CalendarDate,
    y: number,
    allows: (entry: CalendarEntry, operation: EntryOperation) => boolean,
) {
    const { top, bottom, height } = card.getBoundingClientRect();
    const hit = Math.min(8, height / 4);
    const start = relativeMinute(date, entry.date.start, entry.time!.start);
    const end = relativeMinute(date, entry.date.end, entry.time!.end);
    const resizeStart = { kind: 'resize', edge: 'start' } as const;
    const resizeEnd = { kind: 'resize', edge: 'end' } as const;
    const hasStart = start >= 0 && start < dayMinutes && allows(entry, resizeStart);
    const hasEnd = end > 0 && end <= dayMinutes && allows(entry, resizeEnd);
    const operation =
        hasStart && y - top < hit
            ? resizeStart
            : hasEnd && bottom - y < hit
              ? resizeEnd
              : allows(entry, move)
                ? move
                : undefined;
    return {
        operation,
        grips: hasStart && hasEnd ? 'both' : hasStart ? 'start' : hasEnd ? 'end' : '',
    };
}

function gridFor(card: Card) {
    const grid = card.closest('lms-calendar-day, lms-calendar-week') as Grid | null;
    const column = card.assignedSlot?.parentElement;
    const scroller = column?.closest<HTMLElement>('.main, .week-scroll');
    if (!grid || !column || !scroller || card.displayMode === 'time-mark') return undefined;
    const date = columnDate(grid, column);
    return date && { grid, column, scroller, date };
}

function clientEdges(element: HTMLElement) {
    const { top, left } = element.getBoundingClientRect();
    const x = left + element.clientLeft;
    const y = top + element.clientTop;
    return { left: x, right: x + element.clientWidth, top: y, bottom: y + element.clientHeight };
}

function minuteAt(y: number, column: DOMRect) {
    return Math.max(0, Math.min(dayMinutes, ((y - column.top) * dayMinutes) / column.height));
}

function previewBand({ element, date }: Column, candidate: CalendarEntry) {
    const start = relativeMinute(date, candidate.date.start, candidate.time!.start);
    const end = relativeMinute(date, candidate.date.end, candidate.time!.end);
    if (start >= dayMinutes || end < 0 || (end === 0 && start < 0)) return undefined;
    const marker = element.ownerDocument.createElement('div');
    const inset = (Math.max(0, start) * 100) / dayMinutes;
    const size = ((Math.min(dayMinutes, end) - Math.max(0, start)) * 100) / dayMinutes;
    marker.toggleAttribute('data-kalendus-change-preview', true);
    marker.setAttribute('aria-hidden', 'true');
    marker.style.cssText = `position:absolute;pointer-events:none;z-index:999;inset-inline:0;inset-block-start:${inset}%;block-size:max(2px,${size}%);box-sizing:border-box;border:2px solid Highlight;background:color-mix(in srgb, Highlight 22%, transparent)`;
    element.append(marker);
    return marker;
}

/**
 * Opt into proposing changes to explicit timed cards in Day and Week. Import
 * this subpath separately; read-only calendars do not load the gesture code.
 */
export function enableEntryInteractions(
    calendar: Calendar,
    options: EntryInteractionOptions = {},
): EntryInteractions {
    if (attached.has(calendar))
        throw new Error('Entry interactions already enabled on this calendar');
    const snap = options.snapMinutes ?? 15;
    if (!Number.isInteger(snap) || snap < 1 || snap > dayMinutes) {
        throw new RangeError('snapMinutes must be an integer from 1 to 1440');
    }
    attached.add(calendar);
    const scope = new AbortController();
    const document = calendar.ownerDocument;
    const win = document.defaultView!;
    const style = document.createElement('style');
    style.textContent = styles;
    const ensureStyle = () => {
        if (!scope.signal.aborted && !style.isConnected) calendar.shadowRoot?.append(style);
    };
    void calendar.updateComplete.then(ensureStyle, () => {});
    let hovered: Card | undefined;
    let cancelGesture: (() => void) | undefined;
    let suppressClick = false;

    function clearHover() {
        hovered?.removeAttribute(editAttribute);
        hovered?.removeAttribute(gripAttribute);
        hovered = undefined;
    }

    function allowed(entry: CalendarEntry, operation: EntryOperation) {
        return (
            !scope.signal.aborted &&
            calendar.isConnected &&
            entry.kind === 'timed' &&
            Array.isArray(calendar.entries) &&
            calendar.entries.includes(entry) &&
            (options.canChange?.(entry, operation) ?? true)
        );
    }

    function notify(
        entry: CalendarEntry,
        operation: EntryOperation,
        proposed: CalendarEntry,
        source: EntryChangeRequest['source'],
        eventId = entry.id,
    ) {
        calendar.dispatchEvent(
            new CustomEvent<EntryChangeRequest>('entry-change-request', {
                bubbles: true,
                composed: true,
                detail: { entry, eventId, operation: { ...operation }, proposed, source },
            }),
        );
    }

    calendar.addEventListener(
        'pointermove',
        (event) => {
            if (event.pointerType === 'touch' || cancelGesture) return;
            const card = cardFrom(event, calendar);
            const entry = card?.canonicalEntry;
            const surface = card && gridFor(card);
            if (hovered !== card) clearHover();
            if (!card || entry?.kind !== 'timed' || !entry.time || !surface) return;
            const { grips, operation } = gripAt(card, entry, surface.date, event.clientY, allowed);
            if (!grips && !operation) {
                clearHover();
                return;
            }
            ensureStyle();
            hovered = card;
            if (operation) card.setAttribute(editAttribute, operation.kind);
            else card.removeAttribute(editAttribute);
            if (grips) card.setAttribute(gripAttribute, grips);
            else card.removeAttribute(gripAttribute);
        },
        { signal: scope.signal },
    );
    calendar.addEventListener('pointerleave', clearHover, { signal: scope.signal });
    calendar.addEventListener(
        'calendar-state-change',
        (e) => {
            if (e.composedPath()[0] !== calendar) return;
            clearHover();
            cancelGesture?.();
        },
        { signal: scope.signal },
    );
    calendar.addEventListener(
        'click',
        (event) => {
            if (!suppressClick || event.detail === 0) return;
            suppressClick = false;
            event.preventDefault();
            event.stopImmediatePropagation();
        },
        { capture: true, signal: scope.signal },
    );

    calendar.addEventListener(
        'pointerdown',
        (event) => {
            if (cancelGesture) return;
            suppressClick = false;
            if (!event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return;
            const card = cardFrom(event, calendar);
            const entry = card?.canonicalEntry;
            if (!card || entry?.kind !== 'timed' || !entry.time) return;
            const surface = gridFor(card);
            if (!surface) return;
            const { grid, column, scroller, date } = surface;
            const picked = gripAt(card, entry, date, event.clientY, allowed).operation;
            if (!picked) return;
            const operation: EntryOperation = picked;
            const pane = grid.parentElement!;
            const columns = [
                ...scroller.querySelectorAll<HTMLElement>('.timed-content, .day-column'),
            ].flatMap((element): Column[] => {
                const date = columnDate(grid, element);
                return date ? [{ element, date }] : [];
            });
            const down = { clientX: event.clientX, clientY: event.clientY };
            const originalMinute = minuteAt(down.clientY, column.getBoundingClientRect());
            const pointerId = event.pointerId;
            const entries = calendar.entries;
            const lifetime = new AbortController();
            const capture = { capture: true, signal: lifetime.signal } as const;
            let last: Coordinates = down;
            let markers: HTMLElement[] = [];
            let started = false;
            let frame = 0;
            let previousFrame = 0;
            let lastDelta = NaN;
            let proposed: CalendarEntry | undefined;

            const isCurrent = () =>
                card.isConnected &&
                card.canonicalEntry === entry &&
                calendar.entries === entries &&
                card.assignedSlot?.parentElement === column;
            const clearPreview = () => {
                markers.forEach((marker) => marker.remove());
                markers = [];
            };
            function cleanup() {
                cancelGesture = undefined;
                lifetime.abort();
                win.cancelAnimationFrame(frame);
                clearPreview();
                if (card!.hasPointerCapture(pointerId)) card!.releasePointerCapture(pointerId);
                clearHover();
            }
            cancelGesture = cleanup;

            function update(autoscroll: number) {
                const { clientX: x, clientY: y } = last;
                const outer = clientEdges(pane);
                const inner = clientEdges(scroller);
                const top = Math.max(outer.top, inner.top);
                const bottom = Math.min(outer.bottom, inner.bottom);
                const inside =
                    x >= Math.max(outer.left, inner.left) &&
                    x < Math.min(outer.right, inner.right) &&
                    y >= top &&
                    y < bottom;
                let delta = NaN;
                if (inside) {
                    const edge = Math.min(40, (bottom - top) / 3);
                    if (autoscroll && edge > 0) {
                        const step =
                            Math.max(0, 1 - (bottom - y) / edge) -
                            Math.max(0, 1 - (y - top) / edge);
                        if (step) scroller.scrollTop += step * autoscroll * 0.5;
                    }
                    for (const target of columns) {
                        const box = target.element.getBoundingClientRect();
                        if (x < box.left || x >= box.right || box.height <= 0) continue;
                        delta =
                            civilDayDifference(date, target.date) * dayMinutes +
                            Math.round((minuteAt(y, box) - originalMinute) / snap) * snap;
                        break;
                    }
                }
                if (Object.is(delta, lastDelta)) return;
                lastDelta = delta;
                proposed = Number.isNaN(delta)
                    ? undefined
                    : proposeTimedEntryChange(entry!, operation, delta);
                clearPreview();
                if (proposed) {
                    for (const target of columns) {
                        const marker = previewBand(target, proposed);
                        if (marker) markers.push(marker);
                    }
                }
            }

            function tick(now: number) {
                if (!isCurrent()) {
                    cleanup();
                    return;
                }
                if (started) update(previousFrame ? Math.min(32, now - previousFrame) : 0);
                previousFrame = now;
                frame = win.requestAnimationFrame(tick);
            }
            frame = win.requestAnimationFrame(tick);
            document.addEventListener(
                'pointermove',
                (e) => {
                    if (e.pointerId !== pointerId) return;
                    last = e;
                    if (
                        !started &&
                        Math.hypot(e.clientX - down.clientX, e.clientY - down.clientY) >= 5
                    ) {
                        started = suppressClick = true;
                        try {
                            card.setPointerCapture(pointerId);
                        } catch {
                            // Document listeners still track the gesture if capture was lost.
                        }
                    }
                    if (started && e.cancelable) e.preventDefault();
                },
                capture,
            );
            document.addEventListener(
                'pointerup',
                (e) => {
                    if (e.pointerId !== pointerId) return;
                    last = e;
                    if (started && isCurrent()) update(0);
                    else proposed = undefined;
                    cleanup();
                    if (proposed && allowed(entry, operation))
                        notify(entry, operation, proposed, 'pointer', card.eventId);
                },
                capture,
            );
            const cancelPointer = (e: PointerEvent) => {
                if (e.pointerId === pointerId) cleanup();
            };
            document.addEventListener('pointercancel', cancelPointer, capture);
            card.addEventListener('lostpointercapture', cancelPointer, capture);
            document.addEventListener(
                'keydown',
                (e) => {
                    if (e.key !== 'Escape') return;
                    if (started) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    cleanup();
                },
                capture,
            );
            win.addEventListener('blur', cleanup, { signal: lifetime.signal });
        },
        { capture: true, signal: scope.signal },
    );

    return {
        requestChange(entry, operation, deltaMinutes) {
            if (!allowed(entry, operation)) return false;
            const proposed = proposeTimedEntryChange(entry, operation, deltaMinutes);
            if (!proposed) return false;
            notify(entry, operation, proposed, 'api');
            return true;
        },
        dispose() {
            if (scope.signal.aborted) return;
            cancelGesture?.();
            clearHover();
            scope.abort();
            style.remove();
            attached.delete(calendar);
        },
    };
}
