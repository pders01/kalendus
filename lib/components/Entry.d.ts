import { LitElement } from 'lit';
export default class Entry extends LitElement {
    time?: CalendarTimeInterval;
    heading: string;
    content?: string;
    _highlighted?: Boolean;
    _extended?: Boolean;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    _handleClick(): void;
}
//# sourceMappingURL=Entry.d.ts.map