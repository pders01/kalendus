import { LitElement } from 'lit';
export default class Header extends LitElement {
    private translations;
    heading?: string;
    activeDate?: CalendarDate;
    expandedDate?: CalendarDate;
    static styles: import("lit").CSSResult;
    render(): import("lit").TemplateResult<1>;
    private _dispatchSwitchDate;
    private _dispatchSwitchView;
}
//# sourceMappingURL=Header.d.ts.map