var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { localized, msg } from '@lit/localize';
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
let Context = class Context extends LitElement {
    render() {
        return html ` <div>
      <span>${msg('Mon')}</span>
      <span>${msg('Tues')}</span>
      <span>${msg('Wed')}</span>
      <span>${msg('Thurs')}</span>
      <span>${msg('Fri')}</span>
      <span>${msg('Sat')}</span>
      <span>${msg('Sun')}</span>
    </div>`;
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
Context = __decorate([
    localized(),
    customElement('lms-calendar-context')
], Context);
export default Context;
//# sourceMappingURL=Context.js.map