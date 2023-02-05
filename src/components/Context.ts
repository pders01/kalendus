import {localized, msg} from '@lit/localize';
import {LitElement, css, html} from 'lit';
import {customElement} from 'lit/decorators.js';

@localized()
@customElement('lms-calendar-context')
export default class Context extends LitElement {
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
    return html` <div>
      <span>${msg('Mon')}</span>
      <span>${msg('Tues')}</span>
      <span>${msg('Wed')}</span>
      <span>${msg('Thurs')}</span>
      <span>${msg('Fri')}</span>
      <span>${msg('Sat')}</span>
      <span>${msg('Sun')}</span>
    </div>`;
  }
}
