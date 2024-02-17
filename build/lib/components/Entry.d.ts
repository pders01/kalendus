import { LitElement, nothing } from 'lit';
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
    _displayInterval(time?: CalendarTimeInterval): string | number | typeof nothing | undefined;
    _handleClick(): void;
}
//# sourceMappingURL=Entry.d.ts.map