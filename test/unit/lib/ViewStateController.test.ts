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
            const modes: ViewMode[] = ['month', 'week', 'day'];
            modes.forEach((mode) => {
                controller.setViewMode(mode);
                expect(controller.viewMode).to.equal(mode);
            });
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
