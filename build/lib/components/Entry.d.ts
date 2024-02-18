import { LitElement } from 'lit';
export default class Entry extends LitElement {
    private translations;
    time?: CalendarTimeInterval;
    heading: string;
    content?: string;
    isContinuation: boolean;
    _highlighted?: boolean;
    _extended?: boolean;
    private _sumReducer;
    static styles: import("lit").CSSResult;
    render(): import("lit").TemplateResult<1>;
    private _displayInterval;
    private _handleClick;
}
//# sourceMappingURL=Entry.d.ts.map