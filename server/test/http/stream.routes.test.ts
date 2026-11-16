import { expect } from 'chai';

import { EventBus } from '../../src/core/event-bus.js';
import { createApp } from '../../src/http/app.js';
import { createCalendar } from '../helpers/fixtures.js';
import { createTestDb } from '../helpers/test-db.js';

describe('Stream Routes', () => {
    let app: ReturnType<typeof createApp>['app'];
    let db: ReturnType<typeof createTestDb>;
    let eventBus: EventBus;
    let calId: string;

    beforeEach(() => {
        db = createTestDb();
        eventBus = new EventBus();
        ({ app } = createApp({ db, eventBus, enableLogger: false, mode: 'public' }));
        const cal = createCalendar(db);
        calId = cal.id;
    });

    afterEach(() => {
        db.$client.close();
    });

    it('delivers committed mutations only to their calendar and cleans up both readers', async () => {
        const secondId = createCalendar(db).id;
        const first = await app.request(`/api/calendars/${calId}/stream`);
        const second = await app.request(`/api/calendars/${secondId}/stream`);
        const readers = [first.body!.getReader(), second.body!.getReader()];
        const read = async (index: number): Promise<string> => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            try {
                const chunk = await Promise.race([
                    readers[index].read(),
                    new Promise<never>((_, reject) => {
                        timer = setTimeout(() => reject(new Error('SSE delivery timeout')), 1000);
                    }),
                ]);
                return new TextDecoder().decode(chunk.value);
            } finally {
                if (timer) clearTimeout(timer);
            }
        };
        const post = (calendarId: string) =>
            app.request(`/api/calendars/${calendarId}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    heading: 'SSE event',
                    date: {
                        start: { year: 2026, month: 3, day: 15 },
                        end: { year: 2026, month: 3, day: 15 },
                    },
                }),
            });
        try {
            expect(await read(0)).to.include('event: connected');
            expect(await read(1)).to.include('event: connected');
            const created = await post(calId);
            expect(created.status).to.equal(201);
            const entry = (await created.json()) as { id: string };
            const message = await read(0);
            expect(message).to.include('event: created');
            expect(message).to.include(entry.id);
            const other = await post(secondId);
            expect(other.status).to.equal(201);
            const otherEntry = (await other.json()) as { id: string };
            const otherMessage = await read(1);
            expect(otherMessage).to.include(otherEntry.id);
            expect(otherMessage).not.to.include(entry.id);
            await app.request(`/api/calendars/${calId}/events/${entry.id}`, { method: 'DELETE' });
            const deleted = await read(0);
            expect(deleted).to.include('event: deleted');
            expect(deleted).not.to.include(otherEntry.id);
        } finally {
            await Promise.all(readers.map((reader) => reader.cancel()));
        }
        expect(eventBus.subscriberCount(`calendar:${calId}`)).to.equal(0);
        expect(eventBus.subscriberCount(`calendar:${secondId}`)).to.equal(0);
    });

    it('responds with SSE content-type', async () => {
        const controller = new AbortController();
        const res = await app.request(`/api/calendars/${calId}/stream`, {
            signal: controller.signal,
        });
        const reader = res.body!.getReader();
        try {
            expect(res.headers.get('content-type')).to.include('text/event-stream');
            const chunk = await reader.read();
            expect(new TextDecoder().decode(chunk.value)).to.include('event: connected');
            expect(eventBus.subscriberCount(`calendar:${calId}`)).to.equal(1);
        } finally {
            // In-process request signals do not cancel the live response body.
            await reader.cancel();
            controller.abort();
        }
        expect(eventBus.subscriberCount(`calendar:${calId}`)).to.equal(0);
    });
});
