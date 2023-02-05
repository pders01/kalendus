var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
let Day = class Day extends LitElement {
    constructor() {
        super(...arguments);
        this._hours = [...Array(25).keys()];
        this._hasActiveSidebar = false;
    }
    render() {
        return html `<div class="container">
      <div class="main w-${!this._hasActiveSidebar ? '100' : '70' !== null && '70' !== void 0 ? '70' : '100'}">
        ${this._hours.map((hour, index) => html `
              <div class="hour" style=${this._getHourIndicator(hour)}>
                <span class="indicator">
                  ${hour < 10 ? `0${hour}:00` : `${hour}:00`}
                </span>
              </div>
              ${index
            ? html `<div
                    class="separator"
                    style="grid-row: ${hour * 60}"
                  ></div>`
            : html ``}
              <slot name="${hour}" class="entry"></slot>
            `)}
      </div>
      <div
        class="sidebar w-${!this._hasActiveSidebar ? '0' : '30' !== null && '30' !== void 0 ? '30' : '0'}"
        ?hidden=${!this._hasActiveSidebar}
      ></div>
    </div>`;
    }
    _getHourIndicator(hour) {
        return hour !== 24
            ? `grid-row: ${(hour + 1) * 60 - 59}/${(hour + 1) * 60}`
            : 'grid-row: 1440';
    }
};
Day.styles = css `
    .container {
      display: flex;
      /* Header: 3.5em */
      height: calc(100% - 3.5em);
      width: 100%;
    }

    .main {
      display: grid;
      grid-template-columns: 4em 1fr;
      grid-template-rows: repeat(1440, 1fr);
      height: calc(100% - 1em);
      gap: 1px;
      overflow-y: scroll;
      text-align: center;
      padding: 0.5em;
      position: relative;
    }

    .hour {
      text-align: center;
    }

    .indicator {
      position: relative;
      top: -0.6em;
    }

    .separator {
      grid-column: 2 / 3;
      border-top: 1px solid var(--separator-light);
      position: absolute;
      width: 100%;
      z-index: 0;
    }

    .sidebar {
      height: 100%;
      border-left: 1px solid var(--separator-light);
    }

    .w-100 {
      width: 100%;
    }

    .w-70 {
      width: 70%;
    }

    .w-30 {
      width: 30%;
    }

    .w-0 {
      width: 0;
    }
  `;
__decorate([
    state()
], Day.prototype, "_hours", void 0);
__decorate([
    state()
], Day.prototype, "_hasActiveSidebar", void 0);
Day = __decorate([
    customElement('lms-calendar-day')
], Day);
export default Day;
//# sourceMappingURL=Day.js.map