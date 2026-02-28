import { expect } from 'chai';
import { EventBus } from '../../src/core/event-bus.js';

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

        expect(received).to.be.empty;
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

        expect(received).to.be.empty;
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
});
