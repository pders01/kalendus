import { css, html, LitElement, nothing, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { formatLocalizedDate, formatLocalizedTimeRange } from '../lib/localization.js';
import { getMessages } from '../lib/messages.js';
import { addDisplayDays } from '../lib/weekStartHelper.js';
import type { CalendarDate, CalendarEntry } from '../lms-calendar.js';
import { downloadEntryIcs, isAllDayExport } from './entryExport.js';

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
    /** Standalone inspectors stay anchored; calendar owners can opt into a stable trailing rail. */
    @property({ type: String }) placement: 'anchor' | 'edge' = 'anchor';
    /** Visible calendar-view bounds, without changing its layout or range. */
    @property({ attribute: false }) containment?: HTMLElement;
    /** Logical fallback when the invoker was removed while the inspector was open. */
    @property({ attribute: false }) returnFocusTarget?: HTMLElement;
    @property({ type: String }) locale = 'en';
    @property({ type: Number }) localeVersion = 0;
    @state() private _exportError = '';
    @state() private _exporting = false;
    @state() private _bodyScrollable = false;
    private _wasOpen = false;
    private _returnFocus?: HTMLElement;
    private _portal?: HTMLElement;
    private _frame = 0;
    private _focusFrame = 0;
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
            flex-direction: column;
            /* Only the body scrolls: neither long headings nor notes can displace actions. */
            overflow: hidden;
            overscroll-behavior: contain;
            background: var(--background-color, Canvas);
            color: var(--text-color, CanvasText);
            border-radius: var(--border-radius-md, 7px);
            box-shadow: var(--shadow-lg, 0 2px 8px #0003);
            border: 1px solid var(--separator-light, GrayText);
            font-family: var(--system-ui, inherit);
            padding: 0;
        }
        .card:is([open], :popover-open) {
            display: flex;
        }
        .header {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            flex: 1 1 auto;
            min-block-size: 0;
        }
        .toolbar {
            grid-area: 1 / 2;
            align-self: start;
            display: flex;
            padding: var(--menu-padding, var(--menu-header-padding, 0.875em 1em));
            padding-inline-start: 0;
            padding-block-end: 0;
        }
        .body {
            grid-area: 1 / 1;
            min-inline-size: 0;
            min-block-size: 0;
            overflow: auto;
            overscroll-behavior: contain;
        }
        .content {
            padding: var(--menu-padding, var(--menu-content-padding, 0.875em 1em));
            padding-block: 0;
        }
        .heading {
            padding: var(--menu-padding, var(--menu-header-padding, 0.875em 1em));
        }
        .title {
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
        :is(button, .body):focus-visible {
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
            font-variant-numeric: tabular-nums;
            overflow-wrap: anywhere;
            font-size: var(--menu-content-font-size, 0.875em);
            color: inherit;
            line-height: 1.5;
        }
        .notes {
            margin-block-start: 0.5em;
            padding-block-start: 0.625em;
            border-block-start: 1px solid var(--separator-light, GrayText);
            font-size: var(--menu-content-font-size, 0.875em);
            overflow-wrap: anywhere;
            white-space: pre-wrap;
            line-height: 1.4;
        }
        .body:focus-visible {
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
        .export-btn[aria-disabled='true'] {
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
            :is(button, .body):focus-visible {
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
        if (this.open && changed.has('containment')) {
            const previous = changed.get('containment') as HTMLElement | undefined;
            if (previous) this._resizeObserver?.unobserve(previous);
            if (this.containment) this._resizeObserver?.observe(this.containment);
        }
        if (this.open && changed.has('eventDetails'))
            this._card.querySelector<HTMLElement>('.body')!.scrollTop = 0;
        if (
            this.open &&
            (changed.has('placement') ||
                changed.has('containment') ||
                changed.has('anchorRect') ||
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
            // A non-modal open dialog; manage focus ourselves, as WebKit's
            // close() can restore its invoker even after focus moved outside.
            card.open = true;
        }
        this._resizeObserver = new ResizeObserver(this._schedulePosition);
        this._resizeObserver.observe(card);
        this._resizeObserver.observe(card.querySelector('.body')!);
        this._resizeObserver.observe(card.querySelector('.title')!);
        this._resizeObserver.observe(card.querySelector('.content')!);
        if (this.containment) this._resizeObserver.observe(this.containment);
        this._computePosition();
        card.querySelector<HTMLButtonElement>('.close-btn')?.focus({ preventScroll: true });
    }
    private _hide(restoreFocus: boolean) {
        if (!this._wasOpen) return;
        this._wasOpen = false;
        const index = openInspectors.indexOf(this);
        if (index >= 0) openInspectors.splice(index, 1);
        cancelAnimationFrame(this._frame);
        cancelAnimationFrame(this._focusFrame);
        this._frame = 0;
        this._focusFrame = 0;
        this._resizeObserver?.disconnect();
        const active = this._deepActiveElement();
        const hadFocus = !!active && !!this._card?.contains(active);
        if (this._hasPopover && this._card?.matches(':popover-open')) this._card.hidePopover();
        if (this._portal) {
            if (this._card) this._card.open = false;
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
    private _focusLeft = () => {
        // Tab can also leave for browser chrome, without a document focusin.
        // Wait for the complete focus transition, not the intermediate body focus.
        cancelAnimationFrame(this._focusFrame);
        this._focusFrame = requestAnimationFrame(() => {
            this._focusFrame = 0;
            if (
                this.open &&
                this._wasOpen &&
                !this._card?.contains(this._deepActiveElement() ?? null)
            )
                this._handleClose(false);
        });
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
        portal.style.fontFamily = computed.fontFamily;
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
        const rtl = getComputedStyle(this).direction === 'rtl';
        const viewportBounds = {
            left: x + 8,
            right: x + width - 8,
            top: y + 8,
            bottom: y + height - 8,
        };
        let bounds = viewportBounds;
        if (this.placement === 'edge' && this.containment?.isConnected) {
            const container = this.containment.getBoundingClientRect();
            const intersection = {
                left: Math.max(viewportBounds.left, container.left + 8),
                right: Math.min(viewportBounds.right, container.right - 8),
                top: Math.max(viewportBounds.top, container.top + 8),
                bottom: Math.min(viewportBounds.bottom, container.bottom - 8),
            };
            // A wholly offscreen/empty owner has no usable intersection.
            if (intersection.right > intersection.left && intersection.bottom > intersection.top)
                bounds = intersection;
        }
        const availableInline = Math.max(0, bounds.right - bounds.left);
        const availableBlock = Math.max(0, bounds.bottom - bounds.top);
        card.style.minInlineSize = `min(var(--menu-min-width, 16em), var(--menu-max-width, 22em), ${availableInline}px)`;
        card.style.maxInlineSize = `min(var(--menu-max-width, 22em), ${availableInline}px)`;
        card.style.maxBlockSize = `${availableBlock}px`;
        card.style.inlineSize = '';
        card.style.blockSize = '';
        if (this.placement === 'edge') {
            const preferredInline = card.getBoundingClientRect().width;
            // Do not leave a sliver of background beside a sheet in a compact embed.
            if (availableInline < preferredInline * 1.5 || availableBlock < 400) {
                card.style.maxInlineSize = `${availableInline}px`;
                card.style.inlineSize = `${availableInline}px`;
            }
            card.style.blockSize = `${availableBlock}px`;
        }
        let rect = card.getBoundingClientRect();
        // Layout-derived focusability cannot be known in willUpdate. Reconcile
        // after the current render finishes, rather than scheduling an update
        // from inside updated() when the inspector first opens.
        queueMicrotask(() => {
            if (!this.isConnected || !this.open) return;
            const body = this._card?.querySelector<HTMLElement>('.body');
            this._bodyScrollable = !!body && body.scrollHeight > body.clientHeight;
        });
        const anchor =
            this.anchorRect &&
            this._returnFocus?.isConnected &&
            this._returnFocus.tagName === 'LMS-CALENDAR-ENTRY'
                ? this._returnFocus.getBoundingClientRect()
                : this.anchorRect;
        let left = x + (width - rect.width) / 2;
        let top = y + (height - rect.height) / 2;
        if (this.placement === 'edge') {
            left = rtl ? bounds.left : bounds.right - rect.width;
            top = bounds.top;
        } else if (anchor && availableInline >= rect.width * 1.5) {
            // Compact viewports deliberately use the centered, bounded
            // nonmodal dialog instead of a nearly full-width anchored overlay.
            const room = {
                left: Math.max(0, anchor.left - 8 - bounds.left),
                right: Math.max(0, bounds.right - anchor.right - 8),
                above: Math.max(0, anchor.top - 8 - bounds.top),
                below: Math.max(0, bounds.bottom - anchor.bottom - 8),
            };
            const preferred = rtl ? 'left' : 'right';
            const other = rtl ? 'right' : 'left';
            let side: 'left' | 'right' | 'above' | 'below' | undefined;
            if (room[preferred] >= rect.width) side = preferred;
            else if (room[other] >= rect.width) side = other;
            else if (room.below >= rect.height) side = 'below';
            else if (room.above >= rect.height) side = 'above';
            else {
                // A long inspector can still leave its event visible. Bound only
                // the scrolling body, never stretch short content into a rail.
                const horizontal = room[preferred] >= room[other] ? preferred : other;
                const vertical = room.below >= room.above ? 'below' : 'above';
                const minimumInline = parseFloat(getComputedStyle(card).minInlineSize);
                if (room[horizontal] >= minimumInline && room[horizontal] > 0) {
                    side = horizontal;
                    card.style.maxInlineSize = `${room[horizontal]}px`;
                } else if (room[vertical] >= 160) {
                    side = vertical;
                    card.style.maxBlockSize = `${room[vertical]}px`;
                }
                rect = card.getBoundingClientRect();
            }
            left = anchor.left + (anchor.width - rect.width) / 2;
            top = anchor.top + (anchor.height - rect.height) / 2;
            if (side === 'left') left = anchor.left - rect.width - 8;
            if (side === 'right') left = anchor.right + 8;
            if (side === 'above') top = anchor.top - rect.height - 8;
            if (side === 'below') top = anchor.bottom + 8;
            // If no usable side exists, a viewport-bounded overlay is unavoidable.
            // It stays non-modal; the close control and background remain usable.
        }
        left = Math.max(bounds.left, Math.min(left, bounds.right - rect.width));
        top = Math.max(bounds.top, Math.min(top, bounds.bottom - rect.height));
        card.style.insetInlineStart = `${rtl ? window.innerWidth - left - rect.width : left}px`;
        card.style.insetBlockStart = `${top}px`;
    }
    private _handleClose = (restoreFocus: boolean | Event = true) => {
        if (!this.open) return;
        this._hide(restoreFocus !== false);
        this.open = false;
        this.dispatchEvent(new CustomEvent('menu-close', { bubbles: true, composed: true }));
    };
    private _handleExport = async () => {
        if (this._exporting) return;
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
            await downloadEntryIcs(
                this,
                entry,
                details.eventId,
                details.heading,
                details.entry ?? details,
            );
        } catch (error) {
            this._exportError = error instanceof Error ? error.message : String(error);
            if (!entry)
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
        const end =
            !isAllDayExport(entry) && entry.time?.end.hour === 24
                ? addDisplayDays(entry.date.end, 1)
                : entry.date.end;
        const first = format(date);
        const last = format(end);
        return first === last ? first : `${first} – ${last}`;
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
    override render(): TemplateResult<1> {
        const msg = getMessages(this.locale);
        const hasNotes = this.eventDetails.content && this.eventDetails.content !== msg.noContent;
        const dateDescription = this._dateDescription();
        return html`<dialog class="card" aria-labelledby="event-title" @toggle=${this._handleToggle} @focusout=${this._focusLeft}>
            <div class="header">
                <div class="toolbar">
                    <button type="button" class="close-btn" @click=${this._handleClose} aria-label=${msg.close} autofocus>&times;</button>
                </div>
                <div class="body" role="region" aria-label=${msg.eventDetails} tabindex=${ifDefined(this._bodyScrollable ? 0 : undefined)}>
                    <div class="heading"><h2 id="event-title" class="title">${this.eventDetails.heading || msg.noTitle}</h2></div>
                    <div class="content">
                        <div class="meta">${this._timeDescription()}</div>
                        ${dateDescription ? html`<div class="meta">${dateDescription}</div>` : nothing}
                        ${hasNotes ? html`<div class="notes">${this.eventDetails.content}</div>` : nothing}
                        ${this._exportError ? html`<p class="error" role="alert">${this._exportError}</p>` : nothing}
                    </div>
                </div>
            </div>
            <div class="actions">
                <button type="button" class="export-btn" @click=${this._handleExport} aria-disabled=${this._exporting ? 'true' : 'false'}>${msg.exportAsICS}</button>
            </div>
        </dialog>`;
    }
}
export default Menu;
