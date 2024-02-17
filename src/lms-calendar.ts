import { LitElement, PropertyValueMap, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ResizeController } from '@lit-labs/observers/resize-controller.js';

import './components/Header.js';
import LMSCalendarHeader from './components/Header';
import './components/Month.js';
import LMSCalendarMonth from './components/Month';
import './components/Day.js';
import LMSCalendarDay from './components/Day';
import './components/Context.js';
import LMSCalendarContext from './components/Context';
import './components/Entry.js';
import LMSCalendarEntry from './components/Entry';
import isEmptyObjectOrUndefined from './utils/isEmptyObjectOrUndefined.js';
import getColorTextWithContrast from './utils/getColorTextWithContrast.js';
import partitionOverlappingIntervals from './utils/partitionOverlappingIntervals.js';
import getOverlappingEntitiesIndices from './utils/getOverlappingEntitiesIndices.js';
import haveSameValues from './utils/haveSameValues.js';
import getSortedGradingsByIndex from './utils/getSortedGradingsByIndex.js';
import CalendarEntryViewAdapter from './lib/CalendarEntryViewAdapter.js';
import DirectionalCalendarDateCalculator from './lib/DirectionalCalendarDateCalculator.js';
import { match } from 'ts-pattern';

@customElement('lms-calendar')
export default class LMSCalendar extends LitElement {
    private currentDate = new Date();

    @property({ type: String })
    heading?: string;

    @property({ type: Object })
    activeDate: CalendarDate = {
        day: this.currentDate.getDate(),
        month: this.currentDate.getMonth() + 1,
        year: this.currentDate.getFullYear(),
    };

    @property({ type: Array })
    entries: CalendarEntry[] = [];

    @property({ type: String })
    color = '#000000';

    @state()
    _expandedDate?: CalendarDate;

    @state() _calendarWidth: number = window.innerWidth;

    private _handleResize = (entries: ResizeObserverEntry[]): void => {
        const [div] = entries;

        this._calendarWidth = div.contentRect.width || this._calendarWidth;
    };

    private _resizeController: ResizeController<void> =
        new ResizeController<void>(this, {
            target: null,
            callback: this._handleResize,
            skipInitial: true,
        });

    static override styles = css`
        :host {
            --shadow-sm: rgba(0, 0, 0, 0.18) 0px 2px 4px;
            --shadow-md: rgba(0, 0, 0, 0.15) 0px 3px 3px 0px;
            --shadow-lg: rgba(0, 0, 0, 0.15) 0px 2px 8px;
            --shadow-hv: rgba(0, 0, 0, 0.08) 0px 4px 12px;

            --breakpoint-xs: 425px;
            --breakpoint-sm: 768px;
            --breakpoint-md: 1024px;

            --separator-light: rgba(0, 0, 0, 0.1);
            --separator-mid: rgba(0, 0, 0, 0.4);
            --separator-dark: rgba(0, 0, 0, 0.7);

            --system-ui: system-ui, 'Segoe UI', Roboto, Helvetica, Arial,
                sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
                'Segoe UI Symbol';

            --border-radius-sm: 5px;
            --border-radius-md: 7px;
            --border-radius-lg: 12px;

            --background-color: #ffffff;

            --height: 100%;
            --width: 100%;
        }
        div {
            width: var(--width);
            height: var(--height);
            background-color: var(--background-color);
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--separator-light);
            font-family: var(--system-ui);
            color: var(--separator-dark);
            box-shadow: var(--shadow-md);
        }
    `;

    protected override firstUpdated(
        _changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        const firstElementChild = this.shadowRoot?.firstElementChild;
        if (!firstElementChild) {
            return;
        }

        this._resizeController.observe(firstElementChild);
    }

    protected override willUpdate(
        _changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        if (!this.entries.length) {
            return;
        }

        this.entries.sort(
            (a, b) =>
                a.time.start.hours - b.time.start.hours ||
                a.time.start.minutes - b.time.start.minutes,
        );
    }

    override render() {
        const hasExpandedDate = !isEmptyObjectOrUndefined(this._expandedDate);
        return html`
            <div>
                <lms-calendar-header
                    @switchdate=${this._handleSwitchDate}
                    @switchview=${this._handleSwitchView}
                    .heading=${this.heading}
                    .activeDate=${this.activeDate}
                    .expandedDate=${this._expandedDate}
                >
                </lms-calendar-header>

                <lms-calendar-context ?hidden=${hasExpandedDate}>
                </lms-calendar-context>

                <lms-calendar-month
                    @expand=${this._handleExpand}
                    .activeDate=${this.activeDate}
                    ?hidden=${hasExpandedDate}
                >
                    ${this._calendarWidth < 768
                        ? this._renderEntriesSumByDay()
                        : this._renderEntries()}
                </lms-calendar-month>

                <lms-calendar-day ?hidden=${!hasExpandedDate}>
                    ${this._renderEntriesByDate()}
                </lms-calendar-day>
            </div>
        `;
    }

    _handleSwitchDate(e: CustomEvent) {
        const dateCalculator = new DirectionalCalendarDateCalculator({});
        dateCalculator.direction = e.detail.direction;

        if (this._expandedDate) {
            dateCalculator.date = this._expandedDate;
            const dateInDirection = dateCalculator.getDateByDayInDirection();
            this._expandedDate = dateInDirection;
            this.activeDate = dateInDirection;
            return;
        }

        dateCalculator.date = this.activeDate;
        this.activeDate = dateCalculator.getDateByMonthInDirection();
    }

    _handleSwitchView(e: CustomEvent) {
        return match(e.detail.view)
            .with('day', () => {
                this._expandedDate = !isEmptyObjectOrUndefined(
                    this._expandedDate,
                )
                    ? this._expandedDate
                    : this.activeDate;
            })
            .with('month', () => {
                this.activeDate = this._expandedDate ?? this.activeDate;
                this._expandedDate = undefined;
            })
            .otherwise(() => {});
    }

    _handleExpand(e: CustomEvent) {
        this._expandedDate = e.detail.date;
    }

    _composeEntry(
        index: number,
        slot: string,
        styles: CalendarEntryStyles,
        data: CalendarEntryData,
    ) {
        return html`
            <style>
                lms-calendar-entry.${`_${index}`} {
                    --start-slot: ${styles.startSlot};
                    --entry-w: ${styles.w};
                    --entry-br: ${styles.br};
                    --entry-m: ${styles.m};
                    --entry-bc: ${styles.bc};
                    --entry-c: ${styles.c};
                }
            </style>
            <lms-calendar-entry
                class=${`_${index}`}
                slot=${slot}
                .time=${data.time}
                .heading=${data.heading}
                .content=${data.content}
                .isContinuation=${data.isContinuation ?? false}
            >
            </lms-calendar-entry>
        `;
    }

    /** Create an array of <lms-calendar-entry> elements for each day the entry spans
     *  and add them to the entries array. */
    _expandEntryMaybe({
        entry,
        entryIndex,
        startDate,
        rangeDays,
        styles,
    }: {
        entry: CalendarEntry;
        entryIndex: number;
        startDate: Date;
        rangeDays: number;
        styles: { background: string; text: string };
    }) {
        return Array.from({ length: rangeDays }, (_, index) => {
            const currentEntry = new CalendarEntryViewAdapter(
                entry,
                startDate,
                index,
            ).getEntry();

            const slot = `${currentEntry.date.start.year}-${currentEntry.date.start.month}-${currentEntry.date.start.day}`;
            const isContinuation = index > 0 && rangeDays > 1;

            return this._composeEntry(
                entryIndex, // Assuming 'entryIndex' is in the outer scope
                slot,
                {
                    br: rangeDays > 1 ? '0' : 'var(--border-radius-sm)',
                    m: `0 ${index !== 0 ? 0 : '0.25em'} 0 ${
                        index !== 0 ? 0 : '1.5em'
                    }`,
                    bc: styles.background,
                    c: styles.text,
                },
                {
                    time: currentEntry.time,
                    heading: isContinuation ? '' : currentEntry.heading,
                    isContinuation,
                },
            );
        });
    }

    _renderEntries() {
        if (!this.entries.length) {
            return nothing;
        }

        return this.entries
            .map((entry, index) => {
                const [background, text] = getColorTextWithContrast(
                    entry.color,
                );
                const [startDate, , rangeDays] = this._getDaysRange(entry.date);

                return this._expandEntryMaybe({
                    entry,
                    entryIndex: index,
                    startDate,
                    rangeDays,
                    styles: { background, text },
                });
            })
            .flat();
    }

    _renderEntriesByDate() {
        if (isEmptyObjectOrUndefined(this._expandedDate)) {
            return;
        }

        const entriesByDate = this.entries.filter((entry) => {
            const start = entry.time.start;
            const end = entry.time.end;
            const sameDay = haveSameValues(
                entry.date.start,
                this._expandedDate ?? {},
            );

            return (
                sameDay &&
                (start.hours < end.hours ||
                    (start.hours === end.hours && start.minutes < end.minutes))
            );
        });

        const grading = getSortedGradingsByIndex(
            !isEmptyObjectOrUndefined(entriesByDate)
                ? getOverlappingEntitiesIndices(
                      this._getPartitionedSlottedItems(entriesByDate),
                  )
                : [],
        );

        return entriesByDate.map(({ time, heading, content, color }, index) => {
            const [background, text] = getColorTextWithContrast(color);
            const slot = time.start.hours.toString();
            return this._composeEntry(
                index,
                slot,
                {
                    startSlot: this._getGridSlotByTime(time),
                    w: `${this._getWidthByGroupSize({ grading, index })}%`,
                    m: `0 1.5em 0 ${this._getOffsetByDepth({
                        grading,
                        index,
                    })}%`,
                    bc: background,
                    c: text,
                },
                {
                    time,
                    heading,
                    content,
                },
            );
        });
    }

    _renderEntriesSumByDay() {
        const entriesByDay = this.entries.reduce((acc, entry) => {
            const { day, month, year } = entry.date.start;
            const key = `${day}-${month}-${year}`;
            acc[key] = acc[key] ? acc[key] + 1 : 1;
            return acc;
        }, {} as { [key: string]: number });

        return Object.keys(entriesByDay).map((key, index) => {
            const [day, month, year] = key.split('-');
            const slot = `${year}-${month}-${day}`;
            return this._composeEntry(
                index,
                slot,
                {
                    br: 'var(--border-radius-sm)',
                    m: '0 auto',
                    bc: 'whitesmoke',
                    c: 'black',
                },
                {
                    heading: `[ ${entriesByDay[key]} ]`,
                },
            );
        });
    }

    _getGridSlotByTime({ start, end }: CalendarTimeInterval) {
        const startRow = start.hours * 60 + (start.minutes + 1);
        return `${startRow}/${
            startRow + (end.hours * 60 + end.minutes - startRow)
        }`;
    }

    _getWidthByGroupSize({
        grading,
        index,
    }: {
        grading: Grading[];
        index: number;
    }) {
        return (
            100 /
            grading.filter((item) => item.group === grading[index].group).length
        );
    }

    _getOffsetByDepth({
        grading,
        index,
    }: {
        grading: Grading[];
        index: number;
    }) {
        if (!grading[index]) {
            return 0;
        }

        return grading[index].depth === 0
            ? 0
            : grading[index].depth *
                  (100 /
                      grading.filter(
                          (item) => item.group === grading[index].group,
                      ).length);
    }

    _getPartitionedSlottedItems(items: CalendarEntry[]) {
        return partitionOverlappingIntervals(
            items
                .map((entry: CalendarEntry) =>
                    this._getGridSlotByTime(entry.time)
                        .replace(/[^0-9/]+/g, '')
                        .split('/'),
                )
                .map(([start, end]) => [parseInt(start, 10), parseInt(end, 10)])
                .map(([start, end]) => ({ start, end })),
        );
    }

    _getDaysRange(date: CalendarDateInterval): [Date, Date, number] {
        const { start, end } = date;
        const startDate = new Date(start.year, start.month - 1, start.day);
        const endDate = new Date(end.year, end.month - 1, end.day);

        return [
            startDate,
            endDate,
            (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1,
        ];
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'lms-calendar': LMSCalendar;
        'lms-calendar-header': LMSCalendarHeader;
        'lms-calendar-month': LMSCalendarMonth;
        'lms-calendar-day': LMSCalendarDay;
        'lms-calendar-context': LMSCalendarContext;
        'lms-calendar-entry': LMSCalendarEntry;
    }

    type CalendarDate = {
        day: number;
        month: number;
        year: number;
    };

    type CalendarDateInterval = {
        start: CalendarDate;
        end: CalendarDate;
    };

    type CalendarTime = {
        hours: number;
        minutes: number;
    };

    type CalendarTimeInterval = {
        start: CalendarTime;
        end: CalendarTime;
    };

    type CalendarEntry = {
        date: CalendarDateInterval;
        time: CalendarTimeInterval;
        heading: string;
        content: string;
        color: string;
    };

    type CalendarEntryStyles = {
        startSlot?: string;
        w?: string;
        br?: string;
        m: string;
        bc: string;
        c: string;
    };

    type CalendarEntryData = {
        time?: CalendarTimeInterval;
        heading: string;
        content?: string;
        isContinuation?: boolean;
    };

    type Interval = {
        start: number;
        end: number;
    };

    type Grading = {
        index: number;
        depth: number;
        group: number;
    };

    type Partition = {
        index?: number;
        depth?: number;
        group?: number;
        start: number;
        end: number;
    };
}
