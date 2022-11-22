import { LitElement, css, html, nothing } from 'lit';

export default class Context extends LitElement {
  static properties = {
    weekdays: {},
  };

  static styles = css`
    div {
      height: 34px;
      display: grid;
      grid-template-columns: repeat(7, 1fr);
    }
    span {
      padding: 0.5em 0.25em;
      text-align: left;
    }
  `;

  constructor() {
    super();

    this.weekdays = [];
  }

  render() {
    return this.weekdays
      ? html`<div>
          ${this.weekdays.map((item) => html`<span>${item}</span>`)}
        </div>`
      : nothing;
  }
}
