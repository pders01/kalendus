import { LitElement } from 'lit';
import type { CalendarDate } from '../lms-calendar';
interface EventDetails {
    heading: string;
    content: string;
    time: string;
    date: CalendarDate;
}
export declare class Menu extends LitElement {
    open: boolean;
    eventDetails: EventDetails;
    minimized: boolean;
    private _dragInstance?;
    static styles: import("lit").CSSResult;
    connectedCallback(): void;
    disconnectedCallback(): void;
    firstUpdated(): void;
    private _handleMinimize;
    private _handleClose;
    private _handleExport;
    render(): import("lit").TemplateResult<1>;
}
export default Menu;
//# sourceMappingURL=Menu.d.ts.map