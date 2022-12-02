var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
let Context = class Context extends LitElement {
    constructor() {
        super(...arguments);
        this.weekdays = [];
    }
    render() {
        return this.weekdays
            ? html `<div>
          ${this.weekdays.map((item) => html `<span>${item}</span>`)}
        </div>`
            : nothing;
    }
};
Context.styles = css `
    div {
      height: 1.75em;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    span {
      padding: 0.25em;
      text-align: left;
    }
  `;
__decorate([
    property({ attribute: false })
], Context.prototype, "weekdays", void 0);
Context = __decorate([
    customElement('lms-calendar-context')
], Context);
export default Context;
//# sourceMappingURL=Context.js.map