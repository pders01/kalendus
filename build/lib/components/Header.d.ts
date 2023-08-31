import { LitElement } from 'lit';
export default class Header extends LitElement {
    private translations;
    heading?: string;
    activeDate?: CalendarDate;
    expandedDate?: CalendarDate;
    static styles: import("lit").CSSResult;
    render(): import("lit").TemplateResult<1>;
    _dispatchSwitchDate(e: Event): void;
    _dispatchSwitchView(e: Event): void;
}
//# sourceMappingURL=Header.d.ts.map