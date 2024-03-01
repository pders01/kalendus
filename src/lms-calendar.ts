import { ResizeController } from '@lit-labs/observers/resize-controller.js';
import {
    CSSResult,
    LitElement,
    PropertyValueMap,
    css,
    html,
    nothing,
    unsafeCSS,
} from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DateTime, Interval } from 'luxon';
import * as R from 'remeda';
import { match } from 'ts-pattern';
import LMSCalendarContext from './components/Context';
import './components/Context.js';
import LMSCalendarDay from './components/Day';
import './components/Day.js';
import LMSCalendarEntry from './components/Entry';
import './components/Entry.js';
import LMSCalendarHeader from './components/Header';
import './components/Header.js';
import LMSCalendarMonth from './components/Month';
import './components/Month.js';
import DirectionalCalendarDateCalculator from './lib/DirectionalCalendarDateCalculator.js';
import getColorTextWithContrast from './lib/getColorTextWithContrast.js';
import getOverlappingEntitiesIndices from './lib/getOverlappingEntitiesIndices.js';
import getSortedGradingsByIndex from './lib/getSortedGradingsByIndex.js';
import partitionOverlappingIntervals from './lib/partitionOverlappingIntervals.js';

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

            --background-color: white;
            --primary-color: dodgerblue;

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

    /** We filter invalid entries in the willUpdate hook, so be prepared:
     *  - This will not be shown
     *   ```json
     *   { date: ..., time: { start: { hour: 10, minute: 30 }, end: { hour: 10, minute: 00 } } }
     *  ```
     *  - The same goes for invalid dates meaning the end date being before the start date.
     *
     *  We then sort the entries inplace.
     */
    protected override willUpdate(
        _changedProperties: PropertyValueMap<never> | Map<PropertyKey, unknown>,
    ): void {
        if (!this.entries.length) {
            return;
        }

        this.entries = R.pipe(
            this.entries,
            R.filter(
                (entry) =>
                    Interval.fromDateTimes(
                        DateTime.fromObject(
                            R.merge(entry.date.start, entry.time.start),
                        ),
                        DateTime.fromObject(
                            R.merge(entry.date.end, entry.time.end),
                        ),
                    ).isValid,
            ),
            R.sort.strict(
                (a, b) =>
                    a.time.start.hour - b.time.start.hour ||
                    a.time.start.minute - b.time.start.minute,
            ),
        );
    }

    override render() {
        const hasExpandedDate = !R.isEmpty(this._expandedDate ?? {});
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

    private _handleSwitchDate(e: CustomEvent) {
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

    private _handleSwitchView(e: CustomEvent) {
        return match(e.detail.view)
            .with('day', () => {
                this._expandedDate = !R.isEmpty(this._expandedDate ?? {})
                    ? this._expandedDate
                    : this.activeDate;
            })
            .with('month', () => {
                this.activeDate = this._expandedDate ?? this.activeDate;
                this._expandedDate = undefined;
            })
            .otherwise(() => {});
    }

    private _handleExpand(e: CustomEvent) {
        this._expandedDate = e.detail.date;
    }

    private _composeEntry({
        index,
        slot,
        styles,
        entry,
        isContinuation = false,
    }: {
        index: number;
        slot: string;
        styles: CSSResult | typeof nothing;
        entry: Partial<CalendarEntry>;
        isContinuation?: boolean;
    }) {
        return html`
            <style>
                ${styles}
            </style>
            <lms-calendar-entry
                class=${`_${index}`}
                slot=${slot}
                .time=${entry.time}
                .heading=${entry.heading ?? ''}
                .content=${entry.content}
                .isContinuation=${isContinuation ?? false}
            >
            </lms-calendar-entry>
        `;
    }

    /** Create an array of <lms-calendar-entry> elements for each day the entry spans
     *  and add them to the entries array. */
    private _expandEntryMaybe({
        entry,
        range,
    }: {
        entry: Partial<CalendarEntry>;
        range: [Date, Date, number];
    }) {
        return Array.from({ length: range[2] }, (_, index) => {
            const currentStartDate = DateTime.fromJSDate(range[0]).plus({
                days: index,
            });
            const currentEndDate = currentStartDate
                .plus({ days: 1 })
                .minus({ seconds: 1 });
            const currentEntry = {
                ...entry,
                date: {
                    start: currentStartDate.toObject(),
                    end: currentEndDate.toObject(),
                },
                continuation: {
                    has: range[2] > 1,
                    is: index > 1,
                    index,
                },
            };

            return currentEntry;
        });
    }

    private _renderEntries() {
        if (!this.entries.length) {
            return nothing;
        }

        return R.pipe(
            this.entries,
            R.flatMap((entry) =>
                this._expandEntryMaybe({
                    entry,
                    range: this._getDaysRange(entry.date),
                }),
            ),
            R.map(
                (entry) =>
                    [entry, ...getColorTextWithContrast(entry.color)] as [
                        CalendarEntry & { continuation: Continuation },
                        string,
                        string,
                    ],
            ),
            R.map.indexed(([entry, background, text], index) =>
                this._composeEntry({
                    index,
                    slot: `${entry.date.start.year}-${entry.date.start.month}-${entry.date.start.day}`,
                    styles: css`
                        lms-calendar-entry._${index} {
                            --entry-border-radius: ${unsafeCSS(
                                entry.continuation.has
                                    ? 0
                                    : 'var(--border-radius-sm)',
                            )};
                            --entry-margin: 0
                                ${unsafeCSS(
                                    entry.continuation.has ? 0 : '0.25em',
                                )}
                                0
                                ${unsafeCSS(
                                    entry.continuation.has ? 0 : '1.5em',
                                )};
                            --entry-background-color: ${unsafeCSS(background)};
                            --entry-color: ${unsafeCSS(text)};
                        }
                    `,
                    entry: {
                        time: entry.time,
                        heading: entry.heading,
                        isContinuation: entry.continuation.is,
                    },
                }),
            ),
        );
    }

    private _renderEntriesByDate() {
        if (R.isEmpty(this._expandedDate ?? {})) {
            return nothing;
        }

        const entriesByDate = R.pipe(
            this.entries,
            R.flatMap((entry) =>
                this._expandEntryMaybe({
                    entry,
                    range: this._getDaysRange(entry.date),
                }),
            ),
            R.filter((entry) =>
                R.equals(
                    DateTime.fromObject(entry.date.start).toISODate(),
                    DateTime.fromObject(this._expandedDate ?? {}).toISODate(),
                ),
            ),
        );

        let grading: Grading[] = [];
        if (!R.isEmpty(entriesByDate)) {
            grading = R.pipe(
                entriesByDate,
                R.map((entry) =>
                    Number(entry.time?.end.hour) -
                        Number(entry.time?.start.hour) <
                        23 &&
                    !entry.continuation.is &&
                    !entry.continuation.has
                        ? entry
                        : {
                              ...entry,
                              time: {
                                  start: { hour: 0, minute: -1 },
                                  end: { hour: 0, minute: 1 },
                              },
                          },
                ),
                R.map(({ time }) =>
                    this._getGridSlotByTime(time!)
                        .replace(/[^0-9/]+/g, '')
                        .split('/'),
                ),
                R.map(([start, end]) => ({
                    start: parseInt(start, 10),
                    end: parseInt(end, 10),
                })),
                partitionOverlappingIntervals,
                getOverlappingEntitiesIndices,
                getSortedGradingsByIndex,
            );
        }

        return R.pipe(
            entriesByDate,
            R.map((entry) => ({
                ...entry,
                isAllDay:
                    Number(entry.time?.end.hour) -
                        Number(entry.time?.start.hour) >=
                    23,
            })),
            R.map(
                (entry) =>
                    [entry, ...getColorTextWithContrast(entry.color)] as [
                        CalendarEntry & {
                            isAllDay: boolean;
                            continuation: Continuation;
                        },
                        string,
                        string,
                    ],
            ),
            R.map.indexed(([entry, background, text], index) =>
                //TODO: match on shapes instead.
                match(
                    entry.continuation.is ||
                        entry.continuation.has ||
                        entry.isAllDay,
                )
                    .with(true, () =>
                        this._composeEntry({
                            index,
                            slot: 'all-day',
                            styles: css`
                                lms-calendar-entry._${index} {
                                    --entry-background-color: ${unsafeCSS(
                                        background,
                                    )};
                                    --entry-color: ${unsafeCSS(text)};
                                }
                            `,
                            entry,
                        }),
                    )
                    .otherwise(() =>
                        this._composeEntry({
                            index,
                            slot: entry.time.start.hour.toString(),
                            styles: css`
                                lms-calendar-entry._${index} {
                                    --start-slot: ${unsafeCSS(
                                        this._getGridSlotByTime(entry.time),
                                    )};
                                    --entry-width: ${this._getWidthByGroupSize({
                                        grading,
                                        index,
                                    })}%;
                                    --entry-margin: 0 1.5em 0
                                        ${this._getOffsetByDepth({
                                            grading,
                                            index,
                                        })}%;
                                    --entry-border-radius: var(
                                        --border-radius-sm
                                    );
                                    --entry-background-color: ${unsafeCSS(
                                        background,
                                    )};
                                    --entry-color: ${unsafeCSS(text)};
                                }
                            `,
                            entry,
                        }),
                    ),
            ),
        );
    }

    private _renderEntriesSumByDay() {
        return R.pipe(
            this.entries,
            R.flatMap((entry) =>
                this._expandEntryMaybe({
                    entry,
                    range: this._getDaysRange(entry.date),
                }),
            ),
            R.reduce((acc, entry) => {
                const key = `${entry.date.start.day}-${entry.date.start.month}-${entry.date.start.year}`;
                acc[key] = acc[key] ? acc[key] + 1 : 1;
                return acc;
            }, {} as Record<string, number>),
            Object.entries,
            R.map.indexed(([key, value], index) =>
                this._composeEntry({
                    index,
                    slot: key.split('-').reverse().join('-'),
                    styles: css`
                        lms-calendar-entry._${index} {
                            --entry-border-radius: var(--border-radius-sm);
                            --entry-margin: 0 auto;
                            --entry-background-color: whitesmoke;
                            --entry-color: black;
                        }
                    `,
                    entry: {
                        heading: `[ ${value} ]`,
                    },
                }),
            ),
        );
    }

    private _getGridSlotByTime({ start, end }: CalendarTimeInterval) {
        const startRow = start.hour * 60 + (start.minute + 1);
        const endRow = startRow + (end.hour * 60 + end.minute - startRow);
        if (startRow === endRow) {
            return `${startRow}/${endRow + 1}`;
        }

        return `${startRow}/${endRow}`;
    }

    private _getWidthByGroupSize({
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

    private _getOffsetByDepth({
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

    private _getDaysRange(date: CalendarDateInterval): [Date, Date, number] {
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
        hour: number;
        minute: number;
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
        isContinuation: boolean;
    };

    type Continuation = {
        has: boolean;
        is: boolean;
        index: number;
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
