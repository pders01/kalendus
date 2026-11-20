import { expect } from 'chai';

import { EventBus } from '../../src/core/event-bus.js';
import { SyncServiceImpl } from '../../src/core/sync.service.js';
import type { SseEvent } from '../../src/core/types.js';

describe('EventBus', () => {
    let bus: EventBus;

    beforeEach(() => {
        bus = new EventBus();
    });

    it('delivers messages to subscribers', () => {
        const received: unknown[] = [];
        bus.subscribe('ch1', (data) => received.push(data));
        bus.publish('ch1', { hello: 'world' });

        expect(received).to.deep.equal([{ hello: 'world' }]);
    });

    it('does not cross channels', () => {
        const received: unknown[] = [];
        bus.subscribe('ch1', (data) => received.push(data));
        bus.publish('ch2', { nope: true });

        expect(received).to.have.lengthOf(0);
    });

    it('supports multiple subscribers per channel', () => {
        const a: unknown[] = [];
        const b: unknown[] = [];
        bus.subscribe('ch', (data) => a.push(data));
        bus.subscribe('ch', (data) => b.push(data));
        bus.publish('ch', 42);

        expect(a).to.deep.equal([42]);
        expect(b).to.deep.equal([42]);
    });

    it('unsubscribe removes the callback', () => {
        const received: unknown[] = [];
        const unsub = bus.subscribe('ch', (data) => received.push(data));
        unsub();
        bus.publish('ch', 'after');

        expect(received).to.have.lengthOf(0);
    });

    it('owns a separate subscription for each registration of the same callback', () => {
        const received: unknown[] = [];
        const callback = (data: unknown) => received.push(data);
        const first = bus.subscribe('ch', callback);
        const second = bus.subscribe('ch', callback);

        expect(bus.subscriberCount('ch')).to.equal(2);
        bus.publish('ch', 'both');
        first();
        first();
        bus.publish('ch', 'second');
        second();
        bus.publish('ch', 'neither');

        expect(received).to.deep.equal(['both', 'both', 'second']);
        expect(bus.subscriberCount('ch')).to.equal(0);
    });

    it('does not let an already-used handle unsubscribe a later registration', () => {
        const received: unknown[] = [];
        const callback = (data: unknown) => received.push(data);
        const stale = bus.subscribe('ch', callback);
        stale();
        bus.subscribe('ch', callback);
        stale();
        bus.publish('ch', 'later');

        expect(received).to.deep.equal(['later']);
    });

    it('does not let a handle from before clear unsubscribe a later registration', () => {
        const received: unknown[] = [];
        const callback = (data: unknown) => received.push(data);
        const stale = bus.subscribe('ch', callback);
        bus.clear();
        bus.subscribe('ch', callback);
        stale();
        bus.publish('ch', 'later');

        expect(received).to.deep.equal(['later']);
    });

    it('tracks subscriber count', () => {
        expect(bus.subscriberCount('ch')).to.equal(0);
        const unsub = bus.subscribe('ch', () => {});
        expect(bus.subscriberCount('ch')).to.equal(1);
        unsub();
        expect(bus.subscriberCount('ch')).to.equal(0);
    });

    it('clear removes all channels', () => {
        bus.subscribe('a', () => {});
        bus.subscribe('b', () => {});
        bus.clear();
        expect(bus.subscriberCount('a')).to.equal(0);
        expect(bus.subscriberCount('b')).to.equal(0);
    });

    it('shares channels only on the same bus and owner identity', () => {
        const owner = {};
        const first = bus.scopedTo(owner);
        const same = bus.scopedTo(owner);
        const second = bus.scopedTo({});
        const otherRoot = new EventBus().scopedTo(owner);
        expect(first).to.equal(same);

        const received: unknown[] = [];
        first.subscribe('ch', (data) => received.push(data));
        same.publish('ch', 'owner');
        second.publish('ch', 'other owner');
        otherRoot.publish('ch', 'other bus');
        bus.publish('ch', 'raw');

        expect(received).to.deep.equal(['owner']);
        expect(same.subscriberCount('ch')).to.equal(1);
        expect(second.subscriberCount('ch')).to.equal(0);
        expect(bus.subscriberCount('ch')).to.equal(0);
    });

    it('clears only the channels owned by the receiver', () => {
        const first = bus.scopedTo({});
        const second = bus.scopedTo({});
        const received: unknown[] = [];
        const callback = (data: unknown) => received.push(data);
        bus.subscribe('ch', callback);
        first.subscribe('ch', callback);
        second.subscribe('ch', callback);

        first.clear();
        first.publish('ch', 'cleared scope');
        bus.publish('ch', 'raw');
        bus.clear();
        bus.publish('ch', 'cleared root');
        second.publish('ch', 'unaffected scope');

        expect(received).to.deep.equal(['raw', 'unaffected scope']);
    });

    it('isolates mutation payloads and subscriber failures in the same scope', () => {
        const scoped = bus.scopedTo({});
        const sender = new SyncServiceImpl(scoped);
        const receiver = new SyncServiceImpl(scoped);
        const event: SseEvent = { type: 'deleted', calendarId: 'a', event: { id: 'original' } };
        const received: SseEvent[] = [];
        receiver.subscribe('a', (data) => {
            data.event.id = 'changed';
            throw new Error('subscriber failed');
        });
        receiver.subscribe('a', async () => {
            throw new Error('async subscriber failed');
        });
        receiver.subscribe('a', (data) => received.push(data));

        sender.broadcast(event);

        expect(received).to.deep.equal([{ ...event, event: { id: 'original' } }]);
        expect(received[0]).not.to.equal(event);
        expect(received[0]?.event).not.to.equal(event.event);
        expect(event.event.id).to.equal('original');
    });

    it('keeps removal signals scoped by calendar and separate from mutation events', () => {
        const owner = {};
        const sender = new SyncServiceImpl(bus.scopedTo(owner));
        const receiver = new SyncServiceImpl(bus.scopedTo(owner));
        const unrelated = new SyncServiceImpl(bus.scopedTo({}));
        const received: string[] = [];
        const unsubscribe = receiver.onCalendarRemoved('a', () => received.push('removed a'));
        receiver.onCalendarRemoved('b', () => received.push('removed b'));
        unrelated.onCalendarRemoved('a', () => received.push('other owner'));
        receiver.subscribe('a', () => received.push('mutation a'));
        unrelated.subscribe('a', () => received.push('other owner mutation'));

        sender.broadcast({ type: 'deleted', calendarId: 'a', event: { id: 'entry' } });
        sender.notifyCalendarRemoved('a');
        unsubscribe();
        sender.notifyCalendarRemoved('a');

        expect(received).to.deep.equal(['mutation a', 'removed a']);
    });
});
