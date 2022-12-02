import { LitElement } from 'lit';
export default class Header extends LitElement {
    heading?: string;
    activeDate?: CalendarDate;
    expandedDate?: CalendarDate;
    static styles: import("lit").CSSResult;
    render(): import("lit-html").TemplateResult<1>;
    _dispatchSwitchMonth(e: Event): void;
    _dispatchSwitchView(e: Event): void;
}
//# sourceMappingURL=Header.d.ts.map