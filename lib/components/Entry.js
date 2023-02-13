var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import isEmptyObjectOrUndefined from '../utils/isEmptyObjectOrUndefined.js';
let Entry = class Entry extends LitElement {
    constructor() {
        super(...arguments);
        this.heading = '';
        this.isContinuation = false;
    }
    render() {
        return html `
      <div
        class="main"
        ?data-highlighted=${this._highlighted}
        ?data-extended=${this._extended}
      >
        <span @click=${this._handleClick}>
          <span> ${this.heading} </span>
          <span ?hidden=${isEmptyObjectOrUndefined(this.content)}
            >· ${this.content}</span
          >
        </span>
        ${this.isContinuation
            ? "..."
            : html `<span>${this._displayStartTime(this.time)}</span> `}
      </div>
    `;
    }
    _displayStartTime(time) {
        if (!time) {
            return nothing;
        }
        const hours = time.start.hours;
        let minutes = time.start.minutes;
        if (minutes < 10) {
            minutes = `0${minutes}`;
        }
        return `${hours}:${minutes}`;
    }
    _handleClick() {
        this._highlighted = !this._highlighted;
        this._extended = !this._extended;
    }
};
Entry.styles = css `
    :host {
      font-size: small;
      grid-column: 2;

      border-radius: var(--entry-br);
      grid-row: var(--start-slot);
      width: var(--entry-w);
      margin: var(--entry-m);
      background-color: var(--entry-bc);
      color: var(--entry-c);
      /* z-index of separators in day view is 0 */
      z-index: 1;
    }

    .main {
      display: flex;
      justify-content: space-between;
      padding: 0.25em;
      border-radius: var(--border-radius-sm);
      background-color: inherit;
    }

    .main > span:first-child {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    div[data-highlighted] {
      background: var(--separator-light);
    }
  `;
__decorate([
    property({ attribute: false })
], Entry.prototype, "time", void 0);
__decorate([
    property()
], Entry.prototype, "heading", void 0);
__decorate([
    property()
], Entry.prototype, "content", void 0);
__decorate([
    property()
], Entry.prototype, "isContinuation", void 0);
__decorate([
    state()
], Entry.prototype, "_highlighted", void 0);
__decorate([
    state()
], Entry.prototype, "_extended", void 0);
Entry = __decorate([
    customElement('lms-calendar-entry')
], Entry);
export default Entry;
//# sourceMappingURL=Entry.js.map