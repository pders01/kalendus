import { localized } from '@lit/localize';
import { css, html, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { generateIcsEvent, type IcsEvent } from 'ts-ics';

import { messages } from '../lib/messages.js';
import type { CalendarDate } from '../lms-calendar';

interface EventDetails {
    heading: string;
    content: string;
    time: string;
    date?: CalendarDate;
}

@customElement('lms-menu')
@(localized() as ClassDecorator)
export class Menu extends LitElement {
    @property({ type: Boolean, reflect: true }) open = false;
    @property({ type: Object }) eventDetails: EventDetails = {
        heading: '',
        content: '',
        time: '',
    };
    @property({ attribute: false }) anchorRect?: DOMRect;

    @state() private _cardTop = 0;
    @state() private _cardLeft = 0;
    @state() private _positioned = false;

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
            position: absolute;
            pointer-events: auto;
            background: var(--background-color);
            border-radius: var(--border-radius-md);
            box-shadow: var(--shadow-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            min-width: 16em;
            max-width: 22em;
            padding: 0.875em 1em;
            opacity: 0;
            transform: scale(0.95);
            transition:
                opacity 0.15s ease,
                transform 0.15s ease;
        }
        .card.visible {
            opacity: 1;
            transform: scale(1);
        }
        .header {
            display: flex;
            align-items: flex-start;
            gap: 0.5em;
            margin-bottom: 0.25em;
        }
        .title {
            flex: 1;
            font-size: 1em;
            font-weight: 600;
            color: var(--separator-dark);
            line-height: 1.3;
            word-break: break-word;
        }
        .close-btn {
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.125em;
            line-height: 1;
            padding: 0.15em 0.25em;
            margin: -0.15em -0.25em 0 0;
            border-radius: var(--border-radius-sm);
            color: var(--header-text-color);
            transition: background-color 0.15s;
        }
        .close-btn:hover {
            background-color: var(--separator-light);
        }
        .meta {
            font-size: 0.8125em;
            color: var(--header-text-color);
            line-height: 1.5;
        }
        .notes {
            margin-top: 0.5em;
            padding-top: 0.625em;
            border-top: 1px solid var(--separator-light);
            font-size: 0.8125em;
            color: var(--separator-dark);
            word-break: break-word;
            line-height: 1.4;
        }
        .actions {
            padding-top: 0.625em;
        }
        .export-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-family: var(--system-ui);
            font-size: 0.8125em;
            font-weight: 500;
            color: var(--primary-color);
            padding: 0;
            transition: opacity 0.15s;
        }
        .export-btn:hover {
            opacity: 0.7;
        }
    `;

    override updated(changed: Map<string, unknown>) {
        if (changed.has('open') || changed.has('anchorRect')) {
            if (this.open && this.anchorRect) {
                this._positioned = false;
                this._computePosition();
            }
        }
    }

    private _computePosition() {
        requestAnimationFrame(() => {
            const card = this.renderRoot.querySelector('.card') as HTMLElement;
            const container = this.parentElement;
            if (!card || !container || !this.anchorRect) return;

            const containerRect = container.getBoundingClientRect();
            const cardRect = card.getBoundingClientRect();

            // Convert anchor from viewport coords to container-relative coords
            const anchorTop = this.anchorRect.top - containerRect.top;
            const anchorLeft = this.anchorRect.left - containerRect.left;
            const anchorRight = anchorLeft + this.anchorRect.width;
            const anchorMidY = anchorTop + this.anchorRect.height / 2;

            const gap = 8;
            const cardW = cardRect.width || 260;
            const cardH = cardRect.height || 200;

            // Prefer right placement; flip left if overflow
            let left: number;
            if (anchorRight + gap + cardW <= containerRect.width) {
                left = anchorRight + gap;
            } else if (anchorLeft - gap - cardW >= 0) {
                left = anchorLeft - gap - cardW;
            } else {
                // Fallback: center horizontally in container
                left = Math.max(gap, (containerRect.width - cardW) / 2);
            }

            // Center vertically on anchor, clamp to container
            let top = anchorMidY - cardH / 2;
            top = Math.max(gap, Math.min(top, containerRect.height - cardH - gap));

            this._cardTop = top;
            this._cardLeft = left;
            this._positioned = true;
        });
    }

    private _handleClose = () => {
        this.open = false;
        this.dispatchEvent(new CustomEvent('menu-close', { bubbles: true, composed: true }));
    };

    private _handleExport = () => {
        const { heading, content, time, date } = this.eventDetails as {
            heading: string;
            content: string;
            time: string;
            date?: CalendarDate;
        };
        const eventYear = date?.year ?? 2025;
        const eventMonth = (date?.month ?? 4) - 1;
        const eventDay = date?.day ?? 18;
        let start, end;
        if (typeof time === 'string') {
            const match = time.match(/(\d{2}):(\d{2}) - (\d{2}):(\d{2})/);
            if (match) {
                start = {
                    date: new Date(
                        eventYear,
                        eventMonth,
                        eventDay,
                        parseInt(match[1]),
                        parseInt(match[2]),
                    ),
                };
                end = {
                    date: new Date(
                        eventYear,
                        eventMonth,
                        eventDay,
                        parseInt(match[3]),
                        parseInt(match[4]),
                    ),
                };
            }
        }
        const event: IcsEvent = {
            start: {
                date: (start && start.date) || new Date(eventYear, eventMonth, eventDay, 12, 0),
            },
            end: {
                date: (end && end.date) || new Date(eventYear, eventMonth, eventDay, 13, 0),
            },
            summary: heading,
            description: content,
            status: 'CONFIRMED',
            uid: `${Date.now()}@lms-calendar`,
            stamp: { date: new Date() },
        };
        const vevent = generateIcsEvent(event);
        const icsString = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//LMS Calendar//EN',
            vevent.trim(),
            'END:VCALENDAR',
        ].join('\r\n');
        const blob = new Blob([icsString], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${heading || 'event'}.ics`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    };

    private _formatDate(date: CalendarDate): string {
        const d = new Date(date.year, date.month - 1, date.day);
        return d.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    }

    override render() {
        const cardClasses = `card${this._positioned ? ' visible' : ''}`;
        const hasNotes =
            this.eventDetails.content &&
            this.eventDetails.content !== messages.noContent();

        return html`
            <div
                class=${cardClasses}
                role="dialog"
                aria-label=${messages.eventDetails()}
                style="top: ${this._cardTop}px; left: ${this._cardLeft}px;"
            >
                <div class="header">
                    <span class="title"
                        >${this.eventDetails.heading || messages.noTitle()}</span
                    >
                    <button
                        class="close-btn"
                        @click=${this._handleClose}
                        title=${messages.close()}
                        aria-label=${messages.close()}
                    >
                        &times;
                    </button>
                </div>
                <div class="meta">
                    ${this.eventDetails.time || messages.noTime()}
                </div>
                ${
                    this.eventDetails.date
                        ? html`<div class="meta">
                              ${this._formatDate(this.eventDetails.date)}
                          </div>`
                        : nothing
                }
                ${
                    hasNotes
                        ? html`<div class="notes">${this.eventDetails.content}</div>`
                        : nothing
                }
                <div class="actions">
                    <button
                        class="export-btn"
                        @click=${this._handleExport}
                        title=${messages.exportAsICS()}
                    >
                        ${messages.exportAsICS()}
                    </button>
                </div>
            </div>
        `;
    }
}

export default Menu;
