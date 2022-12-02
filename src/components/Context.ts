import {LitElement, css, html, nothing} from 'lit';
import {customElement, property} from 'lit/decorators.js';

@customElement('lms-calendar-context')
export default class Context extends LitElement {
  @property({attribute: false})
  weekdays: string[] = [];

  static override styles = css`
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

  override render() {
    return this.weekdays
      ? html`<div>
          ${this.weekdays.map((item) => html`<span>${item}</span>`)}
        </div>`
      : nothing;
  }
}
