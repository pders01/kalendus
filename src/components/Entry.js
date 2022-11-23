import { LitElement, css, html } from 'lit';

export default class Entry extends LitElement {
  static properties = {
    time: {},
    title: {},
    content: {},
  };

  static styles = css`
    :host {
      padding: 0.25em;
      /*TODO: Margins are subject to change */
      margin-right: 0.25em;
      margin-left: 1.5em;
      font-size: small;
      border-radius: 5px;
    }

    .main {
      display: flex;
      justify-content: space-between;
    }
    
    .main > span:first-child {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  constructor() {
    super();
    this.time = {};
    this.title = {};
    this.content = {};
  }

  render() {
    return html`
      <div class="main">
        <span>${this.title}</span>
        <span>${this.time.hours}:${this.time.minutes}</span>
      </div>
      <div hidden>${this.content}</div>
    `;
  }
}
