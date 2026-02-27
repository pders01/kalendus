import { localized } from '@lit/localize';
import { Draggable } from '@neodrag/vanilla';
import { css, html, LitElement } from 'lit';
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
    @property({ type: Boolean }) open = false;
    @property({ type: Object }) eventDetails: EventDetails = {
        heading: '',
        content: '',
        time: '',
    };
    @state() minimized = false;
    private _dragInstance?: Draggable;

    static override styles = css`
        :host {
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 10000;
            background: var(--background-color);
            box-shadow: var(--shadow-md);
            border: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm);
            min-width: var(--menu-min-width);
            max-width: var(--menu-max-width);
            font-family: var(--system-ui);
            transition:
                opacity 0.2s,
                visibility 0.2s;
            opacity: 1;
            visibility: visible;
        }
        .header {
            display: flex;
            align-items: center;
            gap: var(--menu-detail-gap);
            background: var(--background-color);
            cursor: grab;
            padding: var(--menu-header-padding);
            border-bottom: 1px solid var(--separator-light);
            border-radius: var(--border-radius-sm) var(--border-radius-sm) 0 0;
            user-select: none;
        }
        .header .title {
            flex: 1;
            font-size: var(--menu-title-font-size);
            font-weight: var(--menu-title-font-weight);
            color: var(--separator-dark);
        }
        .header button {
            background: none;
            border: 1px solid transparent;
            border-radius: var(--button-border-radius);
            cursor: pointer;
            font-size: var(--menu-title-font-size);
            line-height: 1;
            padding: var(--menu-button-padding);
            width: var(--menu-button-size);
            height: var(--menu-button-size);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--header-text-color);
            transition:
                background-color 0.15s,
                color 0.15s;
        }
        .header button:hover {
            background-color: var(--separator-light);
            color: var(--separator-dark);
        }
        .content {
            padding: var(--menu-content-padding);
            display: block;
            font-size: var(--menu-content-font-size);
        }
        .content[hidden] {
            display: none;
        }
        .menu-item {
            padding: var(--menu-item-padding);
            margin-bottom: var(--menu-item-margin-bottom);
            background: var(--separator-light);
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            font-weight: var(--menu-item-font-weight);
            text-align: center;
            transition:
                background-color 0.15s,
                color 0.15s;
            border: 1px solid transparent;
        }
        .menu-item:hover {
            background: var(--primary-color);
            color: white;
        }
        .event-details {
            display: flex;
            flex-direction: column;
            gap: var(--menu-detail-gap);
        }
        .event-detail {
            display: flex;
            align-items: flex-start;
            gap: var(--menu-detail-gap);
        }
        .event-detail strong {
            min-width: var(--menu-detail-label-min-width);
            font-weight: var(--menu-item-font-weight);
            color: var(--header-text-color);
            font-size: var(--menu-detail-label-font-size);
        }
        .event-detail span {
            flex: 1;
            color: var(--separator-dark);
            word-break: break-word;
        }
    `;

    override connectedCallback() {
        super.connectedCallback();
        // Removed out-of-bounds click detection for now; rely on close button only
    }
    override disconnectedCallback() {
        super.disconnectedCallback();
        this._dragInstance?.destroy();
    }

    override firstUpdated() {
        const handle = this.renderRoot.querySelector('.header') as HTMLElement;
        if (handle) {
            this._dragInstance = new Draggable(this, { handle });
        }
    }

    private _handleMinimize = () => {
        this.minimized = !this.minimized;
    };

    private _handleClose = () => {
        this.open = false;
        this.minimized = false;
        this.dispatchEvent(new CustomEvent('menu-close', { bubbles: true, composed: true }));
    };

    private _handleExport = () => {
        const { heading, content, time, date } = this.eventDetails as {
            heading: string;
            content: string;
            time: string;
            date?: CalendarDate;
        };
        // Use date for ICS export
        const eventYear = date?.year ?? 2025;
        const eventMonth = (date?.month ?? 4) - 1; // JS months are 0-based
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

    override render() {
        // Use display style instead of hidden attribute to avoid update cycles
        this.style.display = this.open ? '' : 'none';
        return html`
            <div>
                <div class="header" title=${messages.dragToMove()}>
                    <span class="title">${messages.eventDetails()}</span>
                    <button
                        @click=${this._handleMinimize}
                        title=${messages.minimize()}
                    >
                        ${this.minimized ? '+' : '-'}
                    </button>
                    <button
                        @click=${this._handleClose}
                        title=${messages.close()}
                    >
                        ×
                    </button>
                </div>
                <div class="content" ?hidden=${this.minimized}>
                    <div
                        class="menu-item"
                        @click=${this._handleExport}
                        title=${messages.exportAsICS()}
                    >
                        ${messages.exportAsICS()}
                    </div>
                    <div class="event-details">
                        <div class="event-detail">
                            <strong>${messages.title()}:</strong>
                            <span
                                >${this.eventDetails.heading || messages.noTitle()}</span
                            >
                        </div>
                        <div class="event-detail">
                            <strong>${messages.time()}:</strong>
                            <span
                                >${this.eventDetails.time || messages.noTime()}</span
                            >
                        </div>
                        ${
                            this.eventDetails.date
                                ? html`<div class="event-detail">
                                  <strong>${messages.date()}:</strong>
                                  <span
                                      >${this.eventDetails.date.day}/${
                                          this.eventDetails.date.month
                                      }/${this.eventDetails.date.year}</span
                                  >
                              </div>`
                                : ''
                        }
                        ${
                            this.eventDetails.content
                                ? html`<div class="event-detail">
                                  <strong>${messages.notes()}:</strong>
                                  <span>${this.eventDetails.content}</span>
                              </div>`
                                : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
}

export default Menu;
