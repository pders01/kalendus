import { LitElement, nothing } from 'lit';
export default class Entry extends LitElement {
    time?: CalendarTimeInterval;
    heading: string;
    content?: string;
    isContinuation: Boolean;
    _highlighted?: Boolean;
    _extended?: Boolean;
    static styles: import('lit').CSSResult;
    render(): import('lit').TemplateResult<1>;
    _displayStartTime(time?: CalendarTimeInterval): string | typeof nothing;
    _handleClick(): void;
}
//# sourceMappingURL=Entry.d.ts.map
