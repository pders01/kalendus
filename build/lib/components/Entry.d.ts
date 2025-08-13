import { LitElement } from 'lit';
import type { CalendarDate } from '../lms-calendar';
export default class Entry extends LitElement {
    private translations;
    time?: CalendarTimeInterval;
    heading: string;
    content?: string;
    isContinuation: boolean;
    date?: CalendarDate;
    _highlighted?: boolean;
    _extended?: boolean;
    private _sumReducer;
    static styles: import("lit").CSSResult;
    private _renderTitle;
    private _renderInterval;
    render(): import("lit").TemplateResult<1>;
    private _displayInterval;
    constructor();
    private _handleInteraction;
}
//# sourceMappingURL=Entry.d.ts.map