import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Draggable } from '@neodrag/vanilla';
import { generateIcsEvent, type IcsEvent } from 'ts-ics';
import type { CalendarDate } from '../lms-calendar';

interface EventDetails {
    heading: string;
    content: string;
    time: string;
    date: CalendarDate;
}

@customElement('lms-menu')
export class Menu extends LitElement {
    @property({ type: Boolean }) open = false;
    @property({ type: Object }) eventDetails: EventDetails = {
        heading: '',
        content: '',
        time: '',
        date: {
            day: 0,
            month: 0,
            year: 0,
        },
    };
    @state() minimized = false;
    private _dragInstance?: Draggable;

    static override styles = css`
        :host {
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translate(-50%, 0);
            z-index: 1000;
            background: var(--menu-bg, #fff);
            box-shadow: 0 4px 16px rgba(0,0,0,0.2);
            border-radius: 8px;
            min-width: 320px;
            transition: opacity 0.2s, visibility 0.2s;
            opacity: 1;
            visibility: visible;
        }
        :host([hidden]), :host([open="false"]) {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }
        .header {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--menu-header-bg, #f0f0f0);
            cursor: grab;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            padding: 0.5rem 1rem;
            user-select: none;
        }
        .header .title {
            flex: 1;
            font-weight: bold;
        }
        .header button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.2em;
            line-height: 1;
            padding: 0 0.25em;
        }
        .content {
            padding: 1rem;
            display: block;
        }
        .content[hidden] {
            display: none;
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
        const { heading, content, time, date } = this.eventDetails as { heading: string; content: string; time: string; date?: CalendarDate };
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
            end: { date: (end && end.date) || new Date(eventYear, eventMonth, eventDay, 13, 0) },
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
            'END:VCALENDAR'
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
        return html`
            <div>
                <div class="header" title="Drag to move menu">
                    <span class="title">Menu</span>
                    <button @click=${this._handleMinimize} title="Minimize">${this.minimized ? '🗖' : '🗕'}</button>
                    <button @click=${this._handleClose} title="Close">✖</button>
                </div>
                <div class="content" ?hidden=${this.minimized}>
                    <div class="menu-item" @click=${this._handleExport} title="Export as ICS">
                        Export as ICS
                    </div>
                    <div><strong>Title:</strong> ${this.eventDetails.heading}</div>
                    <div><strong>Content:</strong> ${this.eventDetails.content}</div>
                    <div><strong>Time:</strong> ${this.eventDetails.time}</div>
                    <div><strong>Date:</strong> ${this.eventDetails.date.day}/${this.eventDetails.date.month}/${this.eventDetails.date.year}</div>
                </div>
            </div>
        `;
    }
}

export default Menu;
