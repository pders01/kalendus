var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import Translations from '../translations/Translations';
let Context = class Context extends LitElement {
    constructor() {
        super(...arguments);
        this.translations = new Translations();
    }
    render() {
        return html ` <div>
      <span>${this.translations.getTranslation('Mon')}</span>
      <span>${this.translations.getTranslation('Tues')}</span>
      <span>${this.translations.getTranslation('Wed')}</span>
      <span>${this.translations.getTranslation('Thurs')}</span>
      <span>${this.translations.getTranslation('Fri')}</span>
      <span>${this.translations.getTranslation('Sat')}</span>
      <span>${this.translations.getTranslation('Sun')}</span>
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
    customElement('lms-calendar-context')
], Context);
export default Context;
//# sourceMappingURL=Context.js.map