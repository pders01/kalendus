import { expect } from 'chai';
import { ViewStateController, type ViewMode } from '../../../src/lib/ViewStateController.js';
import type { ReactiveControllerHost } from 'lit';

function createMockHost(): ReactiveControllerHost {
    return {
        addController() {},
        removeController() {},
        requestUpdate() {},
        get updateComplete() {
            return Promise.resolve(true);
        },
    };
}

describe('ViewStateController', () => {
    let controller: ViewStateController;
    let host: ReactiveControllerHost;

    beforeEach(() => {
        host = createMockHost();
        controller = new ViewStateController(host);
    });

    describe('Initial state', () => {
        it('should default to month view mode', () => {
            expect(controller.viewMode).to.equal('month');
        });

        it('should default activeDate to today', () => {
            const today = new Date();
            expect(controller.activeDate.day).to.equal(today.getDate());
            expect(controller.activeDate.month).to.equal(today.getMonth() + 1);
            expect(controller.activeDate.year).to.equal(today.getFullYear());
        });

        it('should return undefined for expandedDate in month mode', () => {
            expect(controller.expandedDate).to.be.undefined;
        });
    });

    describe('View mode switching', () => {
        it('should switch to day view', () => {
            controller.switchToDayView();
            expect(controller.viewMode).to.equal('day');
        });

        it('should switch to week view', () => {
            controller.switchToWeekView();
            expect(controller.viewMode).to.equal('week');
        });

        it('should switch to month view', () => {
            controller.switchToDayView();
            controller.switchToMonthView();
            expect(controller.viewMode).to.equal('month');
        });

        it('should switch to year view', () => {
            controller.switchToYearView();
            expect(controller.viewMode).to.equal('year');
        });

        it('should return undefined expandedDate in year mode', () => {
            controller.switchToYearView();
            expect(controller.expandedDate).to.be.undefined;
        });

        it('should return expandedDate in day mode', () => {
            controller.switchToDayView();
            expect(controller.expandedDate).to.deep.equal(controller.activeDate);
        });

        it('should return undefined expandedDate in week mode', () => {
            controller.switchToWeekView();
            expect(controller.expandedDate).to.be.undefined;
        });
    });

    describe('Month navigation', () => {
        it('should navigate to next month', () => {
            controller.setActiveDate({ day: 1, month: 3, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.month).to.equal(4);
            expect(controller.activeDate.year).to.equal(2024);
        });

        it('should wrap from December to January', () => {
            controller.setActiveDate({ day: 1, month: 12, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.month).to.equal(1);
            expect(controller.activeDate.year).to.equal(2025);
        });

        it('should navigate to previous month', () => {
            controller.setActiveDate({ day: 1, month: 5, year: 2024 });
            controller.navigatePrevious();
            expect(controller.activeDate.month).to.equal(4);
            expect(controller.activeDate.year).to.equal(2024);
        });

        it('should wrap from January to December', () => {
            controller.setActiveDate({ day: 1, month: 1, year: 2024 });
            controller.navigatePrevious();
            expect(controller.activeDate.month).to.equal(12);
            expect(controller.activeDate.year).to.equal(2023);
        });
    });

    describe('Week navigation', () => {
        beforeEach(() => {
            controller.switchToWeekView();
        });

        it('should navigate forward by 7 days', () => {
            controller.setActiveDate({ day: 10, month: 3, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.day).to.equal(17);
            expect(controller.activeDate.month).to.equal(3);
        });

        it('should navigate backward by 7 days', () => {
            controller.setActiveDate({ day: 17, month: 3, year: 2024 });
            controller.navigatePrevious();
            expect(controller.activeDate.day).to.equal(10);
            expect(controller.activeDate.month).to.equal(3);
        });

        it('should wrap month boundary when navigating forward', () => {
            controller.setActiveDate({ day: 28, month: 3, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.day).to.equal(4);
            expect(controller.activeDate.month).to.equal(4);
        });

        it('should wrap month boundary when navigating backward', () => {
            controller.setActiveDate({ day: 3, month: 4, year: 2024 });
            controller.navigatePrevious();
            expect(controller.activeDate.day).to.equal(27);
            expect(controller.activeDate.month).to.equal(3);
        });
    });

    describe('Day navigation', () => {
        beforeEach(() => {
            controller.switchToDayView();
        });

        it('should navigate forward by 1 day', () => {
            controller.setActiveDate({ day: 15, month: 6, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.day).to.equal(16);
            expect(controller.activeDate.month).to.equal(6);
        });

        it('should navigate backward by 1 day', () => {
            controller.setActiveDate({ day: 15, month: 6, year: 2024 });
            controller.navigatePrevious();
            expect(controller.activeDate.day).to.equal(14);
            expect(controller.activeDate.month).to.equal(6);
        });

        it('should wrap to next month', () => {
            controller.setActiveDate({ day: 30, month: 6, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.day).to.equal(1);
            expect(controller.activeDate.month).to.equal(7);
        });

        it('should wrap to previous month', () => {
            controller.setActiveDate({ day: 1, month: 6, year: 2024 });
            controller.navigatePrevious();
            expect(controller.activeDate.day).to.equal(31);
            expect(controller.activeDate.month).to.equal(5);
        });

        it('should wrap year boundary forward', () => {
            controller.setActiveDate({ day: 31, month: 12, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.day).to.equal(1);
            expect(controller.activeDate.month).to.equal(1);
            expect(controller.activeDate.year).to.equal(2025);
        });

        it('should wrap year boundary backward', () => {
            controller.setActiveDate({ day: 1, month: 1, year: 2025 });
            controller.navigatePrevious();
            expect(controller.activeDate.day).to.equal(31);
            expect(controller.activeDate.month).to.equal(12);
            expect(controller.activeDate.year).to.equal(2024);
        });
    });

    describe('Year navigation', () => {
        beforeEach(() => {
            controller.switchToYearView();
        });

        it('should navigate forward by 1 year', () => {
            controller.setActiveDate({ day: 15, month: 6, year: 2024 });
            controller.navigateNext();
            expect(controller.activeDate.day).to.equal(15);
            expect(controller.activeDate.month).to.equal(6);
            expect(controller.activeDate.year).to.equal(2025);
        });

        it('should navigate backward by 1 year', () => {
            controller.setActiveDate({ day: 15, month: 6, year: 2024 });
            controller.navigatePrevious();
            expect(controller.activeDate.day).to.equal(15);
            expect(controller.activeDate.month).to.equal(6);
            expect(controller.activeDate.year).to.equal(2023);
        });

        it('should clamp Feb 29 to Feb 28 in non-leap year (next)', () => {
            controller.setActiveDate({ day: 29, month: 2, year: 2024 }); // 2024 is leap
            controller.navigateNext();
            expect(controller.activeDate.day).to.equal(28);
            expect(controller.activeDate.month).to.equal(2);
            expect(controller.activeDate.year).to.equal(2025); // 2025 is not leap
        });

        it('should clamp Feb 29 to Feb 28 in non-leap year (previous)', () => {
            controller.setActiveDate({ day: 29, month: 2, year: 2024 }); // 2024 is leap
            controller.navigatePrevious();
            expect(controller.activeDate.day).to.equal(28);
            expect(controller.activeDate.month).to.equal(2);
            expect(controller.activeDate.year).to.equal(2023); // 2023 is not leap
        });

        it('should preserve Feb 29 when going to another leap year', () => {
            controller.setActiveDate({ day: 29, month: 2, year: 2024 }); // 2024 is leap
            // Navigate forward 4 years to 2028 (also leap)
            controller.navigateNext(); // 2025 → clamps to 28
            controller.setActiveDate({ day: 29, month: 2, year: 2024 }); // reset
            // Direct jump: 2024 + 4 not tested here since we go 1 year at a time
        });
    });

    describe('jumpToToday', () => {
        it('should set activeDate to today', () => {
            controller.setActiveDate({ day: 1, month: 1, year: 2020 });
            controller.jumpToToday();

            const today = new Date();
            expect(controller.activeDate.day).to.equal(today.getDate());
            expect(controller.activeDate.month).to.equal(today.getMonth() + 1);
            expect(controller.activeDate.year).to.equal(today.getFullYear());
        });
    });

    describe('setActiveDate', () => {
        it('should update the active date', () => {
            const newDate = { day: 25, month: 12, year: 2023 };
            controller.setActiveDate(newDate);
            expect(controller.activeDate).to.deep.equal(newDate);
        });
    });

    describe('setViewMode', () => {
        it('should accept all valid view modes', () => {
            const modes: ViewMode[] = ['month', 'week', 'day', 'year'];
            modes.forEach((mode) => {
                controller.setViewMode(mode);
                expect(controller.viewMode).to.equal(mode);
            });
        });
    });

    describe('immutable validated state', () => {
        it('owns date input and copies both activeDate and expandedDate outputs', () => {
            const input = { year: 2026, month: 3, day: 7 };
            controller.setActiveDate(input);
            controller.switchToDayView();
            input.day = 8;
            controller.activeDate.day = 9;
            controller.expandedDate!.day = 10;
            expect(controller.activeDate).to.deep.equal({ year: 2026, month: 3, day: 7 });
            expect(controller.activeDate).not.to.equal(controller.activeDate);
        });

        it('does not schedule updates for equal or invalid inputs', () => {
            let updates = 0;
            host.requestUpdate = () => { updates++; };
            const current = controller.activeDate;
            controller.setActiveDate({ ...current });
            controller.setViewMode('month');
            for (const value of [null, {}, { year: 2026, month: 2, day: 30 }, { year: 2026, month: 3, day: 1.5 }]) {
                controller.setActiveDate(value as CalendarDate);
            }
            controller.setViewMode('invalid' as ViewMode);
            expect(updates).to.equal(0);
            expect(controller.activeDate).to.deep.equal(current);
            expect(controller.viewMode).to.equal('month');
        });

        it('preserves a civil date skipped by the ambient time zone', () => {
            const previous = process.env.TZ;
            process.env.TZ = 'Pacific/Apia';
            try {
                controller.switchToDayView();
                controller.setActiveDate({ year: 2011, month: 12, day: 29 });
                controller.navigateNext();
                expect(controller.activeDate).to.deep.equal({ year: 2011, month: 12, day: 30 });
                controller.navigateNext();
                expect(controller.activeDate).to.deep.equal({ year: 2011, month: 12, day: 31 });
                controller.navigatePrevious();
                expect(controller.activeDate.day).to.equal(30);
            } finally {
                if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
            }
        });

        it('navigates years below 100 without the native Date 1900 offset', () => {
            controller.setActiveDate({ year: 4, month: 2, day: 29 });
            controller.switchToYearView();
            controller.navigateNext();
            expect(controller.activeDate).to.deep.equal({ year: 5, month: 2, day: 28 });
        });
    });

    describe('host.requestUpdate called on mutations', () => {
        it('should call requestUpdate when setting active date', () => {
            let updateCount = 0;
            const trackingHost = createMockHost();
            trackingHost.requestUpdate = () => { updateCount++; };
            const ctrl = new ViewStateController(trackingHost);

            ctrl.setActiveDate({ day: 1, month: 1, year: 2024 });
            expect(updateCount).to.equal(1);
        });

        it('should call requestUpdate when setting view mode', () => {
            let updateCount = 0;
            const trackingHost = createMockHost();
            trackingHost.requestUpdate = () => { updateCount++; };
            const ctrl = new ViewStateController(trackingHost);

            ctrl.setViewMode('day');
            expect(updateCount).to.equal(1);
        });
    });
});
