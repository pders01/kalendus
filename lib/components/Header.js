var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import isEmptyObjectOrUndefined from '../utils/isEmptyObjectOrUndefined.js';
import { localized, msg } from '@lit/localize';
let Header = class Header extends LitElement {
    render() {
        var _a, _b, _c;
        return html `<div class="controls">
      <div class="info">
        <span>
          <strong>${this.heading || msg('Current Month')}</strong>
        </span>
        <br />
        <span class="day" ?hidden=${isEmptyObjectOrUndefined(this.expandedDate)}
          >${(_a = this.expandedDate) === null || _a === void 0 ? void 0 : _a.day}</span
        >
        <span class="month">${(_b = this.activeDate) === null || _b === void 0 ? void 0 : _b.month}</span>
        <span class="year">${(_c = this.activeDate) === null || _c === void 0 ? void 0 : _c.year}</span>
      </div>
      <div class="context" @click=${this._dispatchSwitchView}>
        <span
          ?data-active=${!isEmptyObjectOrUndefined(this.expandedDate)}
          data-context="day"
          >${msg('Day')}</span
        >
        <span
          ?data-active=${isEmptyObjectOrUndefined(this.expandedDate)}
          data-context="month"
          >${msg('Month')}</span
        >
      </div>
      <div class="buttons" @click=${this._dispatchSwitchDate}>
        <button name="previous">«</button>
        <button name="next">»</button>
      </div>
    </div>`;
    }
    _dispatchSwitchDate(e) {
        const target = e.target;
        const direction = e.target === e.currentTarget ? 'container' : target.name;
        const event = new CustomEvent('switchdate', {
            detail: { direction },
            bubbles: true,
            composed: true,
        });
        console.log(event);
        this.dispatchEvent(event);
    }
    _dispatchSwitchView(e) {
        const target = e.target;
        const view = e.target === e.currentTarget ? 'container' : target.dataset.context;
        const event = new CustomEvent('switchview', {
            detail: { view },
            bubbles: true,
            composed: true,
        });
        this.dispatchEvent(event);
    }
};
Header.styles = css `
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
__decorate([
    property({ type: String })
], Header.prototype, "heading", void 0);
__decorate([
    property({ type: Object })
], Header.prototype, "activeDate", void 0);
__decorate([
    property({ type: Object })
], Header.prototype, "expandedDate", void 0);
Header = __decorate([
    localized(),
    customElement('lms-calendar-header')
], Header);
export default Header;
//# sourceMappingURL=Header.js.map