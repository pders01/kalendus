import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import { DateTime } from 'luxon';

import { formatLocalizedDate, formatLocalizedTimeRange } from '../lib/localization.js';
import { getMessages } from '../lib/messages.js';
import type { CalendarDate, CalendarEntry } from '../lms-calendar.js';
import { generateEntryIcs, isAllDayExport } from './entryExport.js';

export interface EventDetails {
    heading: string;
    content: string;
    time?: CalendarTimeInterval;
    displayTime: string;
    displayDate?: string;
    date?: CalendarDate;
    entry?: CalendarEntry;
    eventId?: string;
}

const legacyUids = new WeakMap<object, string>();
let nextLegacyUid = 0;
const openInspectors: Menu[] = [];

/** A deliberately non-modal, light-dismissible event inspector. */
@customElement('lms-menu')
export class Menu extends LitElement {
    @property({ type: Boolean, reflect: true }) open = false;
    @property({ attribute: false }) eventDetails: EventDetails = {
        heading: '',
        content: '',
        displayTime: '',
    };
    @property({ attribute: false }) anchorRect?: DOMRect;
    /** Logical fallback when the invoker was removed while the inspector was open. */
    @property({ attribute: false }) returnFocusTarget?: HTMLElement;
    @property({ type: String }) locale = 'en';
    @property({ type: Number }) localeVersion = 0;
    private _cardTop = 8;
    private _cardLeft = 8;
    @state() private _exportError = '';
    @state() private _exporting = false;
    @state() private _notesScrollable = false;
    private _wasOpen = false;
    private _returnFocus?: HTMLElement;
    private _portal?: HTMLElement;
    private _frame = 0;
    private _resizeObserver?: ResizeObserver;
    private _card?: HTMLDialogElement;
    private get _hasPopover() {
        return (
            'popover' in HTMLElement.prototype &&
            typeof HTMLElement.prototype.showPopover === 'function'
        );
    }

    static override styles = css`
        :host {
            position: absolute;
            inset: 0;
            z-index: 10000;
            pointer-events: none;
            display: none;
        }
        :host([open]) {
            display: block;
        }
        .card {
            position: fixed;
            inset: auto;
            margin: 0;
            pointer-events: auto;
            box-sizing: border-box;
            inline-size: var(--menu-width, var(--menu-max-width, 22em));
            min-inline-size: min(
                var(--menu-min-width, 16em),
                var(--menu-max-width, 22em),
                calc(100vw - 16px)
            );
            max-inline-size: min(var(--menu-max-width, 22em), calc(100vw - 16px));
            max-block-size: calc(100vh - 16px);
            max-block-size: calc(100dvh - 16px);
            display: flex;
            flex-direction: column;
            /* Keep emergency overflow available for unusually large titles/text zoom. */
            overflow: auto;
            overscroll-behavior: contain;
            background: var(--background-color, Canvas);
            color: var(--text-color, CanvasText);
            border-radius: var(--border-radius-md, 7px);
            box-shadow: var(--shadow-lg, 0 2px 8px #0003);
            border: 1px solid var(--separator-light, GrayText);
            font-family: var(--system-ui, system-ui);
            padding: 0;
        }
        .header {
            display: flex;
            align-items: flex-start;
            gap: var(--menu-detail-gap, 0.5em);
            flex: 0 0 auto;
            padding: var(--menu-padding, var(--menu-header-padding, 0.875em 1em));
        }
        .body {
            display: flex;
            flex-direction: column;
            flex: 0 1 auto;
            min-block-size: 0;
            padding: var(--menu-padding, var(--menu-content-padding, 0.875em 1em));
            padding-block: 0;
        }
        .title {
            flex: 1;
            min-inline-size: 0;
            font-size: var(--menu-title-font-size, 1em);
            margin: 0;
            font-weight: var(--menu-title-font-weight, 600);
            line-height: 1.3;
            overflow-wrap: anywhere;
        }
        button {
            box-sizing: border-box;
            font: inherit;
            cursor: pointer;
            min-block-size: 24px;
            min-inline-size: 24px;
            border-radius: var(--border-radius-sm, 4px);
        }
        :is(button, .notes):focus-visible {
            outline: 2px solid currentColor;
            outline-offset: 2px;
        }
        .close-btn {
            flex-shrink: 0;
            background: none;
            border: none;
            font-size: 1em;
            line-height: 1;
            padding: var(--menu-button-padding, 0.15em 0.25em);
            min-inline-size: max(24px, var(--menu-button-size, 24px));
            min-block-size: max(24px, var(--menu-button-size, 24px));
            margin-inline-start: auto;
            color: inherit;
        }
        .close-btn:hover {
            background: var(--hover-bg, #8882);
        }
        .meta {
            flex: 0 0 auto;
            overflow-wrap: anywhere;
            font-size: var(--menu-content-font-size, 0.875em);
            color: inherit;
            line-height: 1.5;
        }
        .notes {
            min-block-size: 0;
            overflow: auto;
            overscroll-behavior: contain;
            margin-block-start: 0.5em;
            padding-block-start: 0.625em;
            border-block-start: 1px solid var(--separator-light, GrayText);
            font-size: var(--menu-content-font-size, 0.875em);
            overflow-wrap: anywhere;
            white-space: pre-wrap;
            line-height: 1.4;
        }
        .notes:focus-visible {
            outline-offset: -2px;
        }
        .actions {
            flex: 0 0 auto;
            padding: var(--menu-padding, var(--menu-content-padding, 0.875em 1em));
            padding-block-start: 0.625em;
        }
        .export-btn {
            background: none;
            border: none;
            padding: 0;
            font-size: var(--menu-content-font-size, 0.875em);
            font-weight: var(--menu-item-font-weight, inherit);
            color: var(--primary-color, LinkText);
        }
        .export-btn:hover {
            text-decoration: underline;
        }
        .export-btn:disabled {
            cursor: wait;
            opacity: 0.65;
        }
        .error {
            color: inherit;
            overflow-wrap: anywhere;
            margin-block: 0.5em 0;
        }
        @media (pointer: coarse) {
            button,
            .close-btn {
                min-block-size: 44px;
                min-inline-size: 44px;
            }
        }
        @media (forced-colors: active) {
            .card {
                border: 1px solid CanvasText;
            }
            :is(button, .notes):focus-visible {
                outline-color: Highlight;
            }
        }
    `;

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('keydown', this._handleKeydown);
        document.addEventListener('pointerdown', this._outsidePointer, true);
        window.addEventListener('resize', this._schedulePosition);
        window.addEventListener('scroll', this._schedulePosition, true);
        window.visualViewport?.addEventListener('resize', this._schedulePosition);
        window.visualViewport?.addEventListener('scroll', this._schedulePosition);
        if (this.hasUpdated && this.open) this.updateComplete.then(() => this._show());
    }
    override disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('keydown', this._handleKeydown);
        document.removeEventListener('pointerdown', this._outsidePointer, true);
        window.removeEventListener('resize', this._schedulePosition);
        window.removeEventListener('scroll', this._schedulePosition, true);
        window.visualViewport?.removeEventListener('resize', this._schedulePosition);
        window.visualViewport?.removeEventListener('scroll', this._schedulePosition);
        this._hide(false);
    }
    override willUpdate(changed: Map<string, unknown>) {
        if (changed.has('eventDetails')) this._exportError = '';
    }
    override updated(changed: Map<string, unknown>) {
        this._card ??= this.renderRoot.querySelector<HTMLDialogElement>('.card')!;
        if (this.open && !this._wasOpen) this._show();
        else if (!this.open && this._wasOpen) this._hide(true);
        if (
            this.open &&
            (changed.has('anchorRect') ||
                changed.has('eventDetails') ||
                changed.has('locale') ||
                changed.has('localeVersion'))
        )
            this._schedulePosition();
    }
    private _deepActiveElement(): HTMLElement | undefined {
        let active = document.activeElement;
        while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
        return active instanceof HTMLElement && active !== document.body ? active : undefined;
    }
    private _show() {
        if (!this.isConnected || this._wasOpen) return;
        const card = this._card ?? this.renderRoot.querySelector<HTMLDialogElement>('.card');
        if (!card) return;
        this._card = card;
        this._wasOpen = true;
        openInspectors.push(this);
        this._returnFocus = this._deepActiveElement();
        if (this._hasPopover) {
            card.setAttribute('popover', 'auto');
            card.showPopover();
        } else {
            // Older WebViews: portal the same Lit-managed node, not a cloned UI.
            // Its own shadow root keeps styling isolated and escapes paint containment.
            const portal = document.createElement('div');
            portal.setAttribute('open', '');
            portal.setAttribute('data-calendar-inspector', '');
            this._copyInheritedStyles(portal);
            const root = portal.attachShadow({ mode: 'open' });
            const style = document.createElement('style');
            style.textContent = Menu.styles.cssText;
            root.append(style, card);
            document.body.append(portal);
            this._portal = portal;
            card.show();
        }
        this._resizeObserver = new ResizeObserver(this._schedulePosition);
        this._resizeObserver.observe(card);
        this._computePosition();
        card.querySelector<HTMLButtonElement>('.close-btn')?.focus({ preventScroll: true });
    }
    private _hide(restoreFocus: boolean) {
        if (!this._wasOpen) return;
        this._wasOpen = false;
        const index = openInspectors.indexOf(this);
        if (index >= 0) openInspectors.splice(index, 1);
        cancelAnimationFrame(this._frame);
        this._frame = 0;
        this._resizeObserver?.disconnect();
        const active = this._deepActiveElement();
        const hadFocus = !!active && !!this._card?.contains(active);
        if (this._hasPopover && this._card?.matches(':popover-open')) this._card.hidePopover();
        if (this._portal) {
            this._card?.close();
            this.renderRoot.append(this._card!);
            this._portal.remove();
            this._portal = undefined;
        }
        if (restoreFocus && hadFocus) {
            const root = this.getRootNode();
            const container = root instanceof ShadowRoot ? root : this.parentElement;
            const fallback = this.returnFocusTarget?.isConnected
                ? this.returnFocusTarget
                : container?.querySelector<HTMLElement>(
                      '[data-menu-focus-fallback], main[tabindex]',
                  );
            const target = this._returnFocus?.isConnected ? this._returnFocus : fallback;
            target?.focus({ preventScroll: true });
        }
    }
    private _handleToggle = (event: Event) => {
        if ((event as ToggleEvent).newState === 'closed' && this.open && this._wasOpen)
            this._handleClose();
    };
    private _handleKeydown = (event: KeyboardEvent) => {
        if (
            this.open &&
            openInspectors[openInspectors.length - 1] === this &&
            event.key === 'Escape'
        ) {
            event.preventDefault();
            this._handleClose();
        }
        // Non-modal: deliberately no Tab trap and no background inertness.
    };
    private _outsidePointer = (event: PointerEvent) => {
        if (this.open && !this._hasPopover && !event.composedPath().includes(this._card!))
            this._handleClose(false);
    };
    private _schedulePosition = () => {
        if (!this.open || this._frame || !this.isConnected) return;
        this._frame = requestAnimationFrame(() => {
            this._frame = 0;
            this._computePosition();
        });
    };
    private _copyInheritedStyles(portal: HTMLElement) {
        const computed = getComputedStyle(this);
        portal.style.cssText = '';
        for (const key of Array.from(computed))
            if (key.startsWith('--')) portal.style.setProperty(key, computed.getPropertyValue(key));
        portal.style.direction = computed.direction;
        portal.style.color = computed.color;
        portal.style.font = computed.font;
    }
    private _computePosition() {
        if (this._portal) this._copyInheritedStyles(this._portal);
        const card = this._card;
        if (!card) return;
        const viewport = window.visualViewport;
        const width = viewport?.width ?? window.innerWidth;
        const height = viewport?.height ?? window.innerHeight;
        const x = viewport?.offsetLeft ?? 0;
        const y = viewport?.offsetTop ?? 0;
        card.style.minWidth = `min(var(--menu-min-width, 16em), var(--menu-max-width, 22em), ${Math.max(0, width - 16)}px)`;
        card.style.maxWidth = `min(var(--menu-max-width, 22em), ${Math.max(0, width - 16)}px)`;
        card.style.maxHeight = `${Math.max(0, height - 16)}px`;
        const rect = card.getBoundingClientRect();
        // Layout-derived focusability cannot be known in willUpdate. Reconcile
        // after the current render finishes, rather than scheduling an update
        // from inside updated() when the inspector first opens.
        queueMicrotask(() => {
            if (!this.isConnected || !this.open) return;
            const notes = this._card?.querySelector<HTMLElement>('.notes');
            this._notesScrollable = !!notes && notes.scrollHeight > notes.clientHeight;
        });
        const anchor =
            this.anchorRect &&
            this._returnFocus?.isConnected &&
            this._returnFocus.tagName === 'LMS-CALENDAR-ENTRY'
                ? this._returnFocus.getBoundingClientRect()
                : this.anchorRect;
        let left = x + (width - rect.width) / 2;
        let top = y + (height - rect.height) / 2;
        if (anchor) {
            const rtl = getComputedStyle(this).direction === 'rtl';
            left = rtl ? anchor.left - rect.width - 8 : anchor.right + 8;
            if (left < x + 8 || left + rect.width > x + width - 8)
                left = rtl ? anchor.right + 8 : anchor.left - rect.width - 8;
            // If neither side fits, center instead of pinning an otherwise
            // narrow card asymmetrically against a phone's viewport edge.
            if (left < x + 8 || left + rect.width > x + width - 8)
                left = x + (width - rect.width) / 2;
            top = anchor.top + (anchor.height - rect.height) / 2;
        }
        this._cardLeft = Math.max(x + 8, Math.min(left, x + width - rect.width - 8));
        this._cardTop = Math.max(y + 8, Math.min(top, y + height - rect.height - 8));
        card.style.left = `${this._cardLeft}px`;
        card.style.top = `${this._cardTop}px`;
    }
    private _handleClose = (restoreFocus: boolean | Event = true) => {
        if (!this.open) return;
        this._hide(restoreFocus !== false);
        this.open = false;
        this.dispatchEvent(new CustomEvent('menu-close', { bubbles: true, composed: true }));
    };
    private _handleExport = async () => {
        const details = this.eventDetails;
        const entry =
            details.entry ??
            (details.date
                ? ({
                      heading: details.heading,
                      content: details.content,
                      date: { start: details.date, end: details.date },
                      time: details.time,
                  } as CalendarEntry)
                : undefined);
        this._exporting = true;
        this._exportError = '';
        try {
            if (!entry) throw new Error('An event date is required for export');
            const request = new CustomEvent('export-entry', {
                detail: { entry, eventId: details.eventId ?? entry.id },
                cancelable: true,
                bubbles: true,
                composed: true,
            });
            if (!this.dispatchEvent(request)) return;
            const identity = details.entry ?? details;
            if (!legacyUids.has(identity))
                legacyUids.set(identity, `legacy-${Date.now()}-${++nextLegacyUid}@lms-calendar`);
            const ics = await generateEntryIcs(entry, details.eventId, legacyUids.get(identity));
            const url = URL.createObjectURL(
                new Blob([ics], { type: 'text/calendar;charset=utf-8' }),
            );
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(details.heading || 'event').replace(/[\\/:*?"<>|]/g, '-')}.ics`;
            document.body.append(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch (error) {
            this._exportError = error instanceof Error ? error.message : String(error);
            this.dispatchEvent(
                new CustomEvent('export-error', {
                    detail: { error, entry, eventId: details.eventId },
                    bubbles: true,
                    composed: true,
                }),
            );
        } finally {
            this._exporting = false;
        }
    };
    private _dateDescription(): string | undefined {
        if (this.eventDetails.displayDate) return this.eventDetails.displayDate;
        const entry = this.eventDetails.entry;
        const date = entry?.date.start ?? this.eventDetails.date;
        if (!date) return undefined;
        const format = (value: CalendarDate) =>
            formatLocalizedDate(value.day, value.month, value.year, this.locale);
        if (!entry) return format(date);
        let end = entry.date.end;
        if (!isAllDayExport(entry) && entry.time?.end.hour === 24) {
            const next = DateTime.fromObject(end, { zone: 'UTC' }).plus({ days: 1 });
            end = { year: next.year, month: next.month, day: next.day };
        }
        return format(date) === format(end) ? format(date) : `${format(date)} – ${format(end)}`;
    }
    private _timeDescription(): string {
        const entry = this.eventDetails.entry;
        const msg = getMessages(this.locale);
        if (!entry) return this.eventDetails.displayTime || msg.noTime;
        if (isAllDayExport(entry)) return msg.allDay;
        return entry.time
            ? `${formatLocalizedTimeRange(entry.time.start.hour, entry.time.start.minute, entry.time.end.hour, entry.time.end.minute, this.locale)}${entry.timeZone ? ` (${entry.timeZone})` : ''}`
            : msg.noTime;
    }
    override render() {
        const msg = getMessages(this.locale);
        const hasNotes = this.eventDetails.content && this.eventDetails.content !== msg.noContent;
        const dateDescription = this._dateDescription();
        return html`<dialog class="card" aria-labelledby="event-title" @toggle=${this._handleToggle}
            style=${styleMap({ top: `${this._cardTop}px`, left: `${this._cardLeft}px` })}>
            <div class="header"><h2 id="event-title" class="title">${this.eventDetails.heading || msg.noTitle}</h2>
                <button type="button" class="close-btn" @click=${this._handleClose} aria-label=${msg.close} autofocus>&times;</button>
            </div>
            <div class="body">
                <div class="meta">${this._timeDescription()}</div>
                ${dateDescription ? html`<div class="meta">${dateDescription}</div>` : nothing}
                ${hasNotes ? html`<div class="notes" role="region" aria-label=${msg.notes} tabindex=${ifDefined(this._notesScrollable ? 0 : undefined)}>${this.eventDetails.content}</div>` : nothing}
            </div>
            <div class="actions">
                <button type="button" class="export-btn" @click=${this._handleExport} ?disabled=${this._exporting}>${msg.exportAsICS}</button>
                ${this._exportError ? html`<p class="error" role="alert">${this._exportError}</p>` : nothing}
            </div>
        </dialog>`;
    }
}
export default Menu;
