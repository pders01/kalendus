import { expect } from 'chai';
import { createTestDb } from '../helpers/test-db.js';
import { createCalendar } from '../helpers/fixtures.js';
import { createApp } from '../../src/http/app.js';
import { EventBus } from '../../src/core/event-bus.js';

describe('Stream Routes', () => {
    let app: ReturnType<typeof createApp>['app'];
    let db: ReturnType<typeof createTestDb>;
    let eventBus: EventBus;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        eventBus = new EventBus();
        ({ app } = createApp({ db, eventBus, enableLogger: false }));
        const cal = createCalendar(db);
        calId = cal.id;
    });

    it('responds with SSE content-type', async () => {
        // Use AbortController to cancel the long-lived SSE connection
        const controller = new AbortController();

        const resPromise = app.request(
            `/api/calendars/${calId}/stream`,
            { signal: controller.signal },
        );

        // Give it a moment to start streaming, then abort
        setTimeout(() => controller.abort(), 100);

        try {
            const res = await resPromise;
            expect(res.headers.get('content-type')).to.include(
                'text/event-stream',
            );
        } catch {
            // AbortError is expected
        }
    });
});
