import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import isEmptyObjectOrUndefined from '../utils/isEmptyObjectOrUndefined.js';

@customElement('lms-calendar-header')
export default class Header extends LitElement {
  @property({type: String})
  heading?: string;

  @property({type: Object})
  activeDate?: CalendarDate;

  @property({type: Object})
  expandedDate?: CalendarDate;

  static override styles = css`
    .controls {
      height: 3.5em;
      width: 100%;
      /* padding: 0.75em 0; */
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      align-content: center;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--separator-light);
    }

    @media (max-width: 360px) {
      .controls {
        font-size: small;
        height: 4.5em;
      }
    }
    .info {
      padding-left: 1em;
      text-align: right;
    }
    .day,
    .month,
    .year {
      color: rgba(0, 0, 0, 0.6);
    }
    .context {
      display: flex;
    }
    .context > * {
      padding: 0.25em 0.5em;
      border: 1px solid var(--separator-light);
    }
    .context > *:first-child {
      border-radius: var(--border-radius-sm) 0 0 var(--border-radius-sm);
      border-right: none;
    }
    .context > *:last-child {
      border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
      border-left: none;
    }

    .buttons {
      padding-right: 1em;
    }
    button {
      padding: 0.75em;
      margin: 0;
      border-radius: 50%;
      line-height: 0.5em;
      border: 1px solid transparent;
    }
    span[data-active] {
      background-color: var(--separator-light);
    }
  `;

  override render() {
    return html`<div class="controls">
      <div class="info">
        <span>
          <strong>${this.heading}</strong>
        </span>
        <br />
        <span class="day" ?hidden=${isEmptyObjectOrUndefined(this.expandedDate)}
          >${this.expandedDate?.day}</span
        >
        <span class="month">${this.activeDate?.month}</span>
        <span class="year">${this.activeDate?.year}</span>
      </div>
      <div class="context" @click=${this._dispatchSwitchView}>
        <span
          ?data-active=${!isEmptyObjectOrUndefined(this.expandedDate)}
          data-context="day"
          >Day</span
        >
        <span
          ?data-active=${isEmptyObjectOrUndefined(this.expandedDate)}
          data-context="month"
          >Month</span
        >
      </div>
      <div class="buttons" @click=${this._dispatchSwitchMonth}>
        <button name="previous">«</button>
        <button name="next">»</button>
      </div>
    </div>`;
  }

  _dispatchSwitchMonth(e: Event) {
    const target = e.target as HTMLButtonElement;
    const direction = e.target === e.currentTarget ? 'container' : target.name;
    const event = new CustomEvent('switchmonth', {
      detail: {direction},
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  _dispatchSwitchView(e: Event) {
    const target = e.target as HTMLElement;
    const view =
      e.target === e.currentTarget ? 'container' : target.dataset.context;
    const event = new CustomEvent('switchview', {
      detail: {view},
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }
}
