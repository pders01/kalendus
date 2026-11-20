import { expect } from 'chai';

import { serializeEntryIcs } from '../../../src/components/serializeEntryIcs.js';
import type { CalendarEntry } from '../../../src/lms-calendar.js';

const date = { year: 2026, month: 3, day: 15 };
const appointment: CalendarEntry = {
    id: 'appointment',
    heading: 'Appointment',
    kind: 'timed',
    date: { start: date, end: date },
    time: { start: { hour: 9, minute: 0 }, end: { hour: 10, minute: 0 } },
};

describe('ICS time zone validation for entries that bypass ingestion', () => {
    for (const timeZone of ['local', 'UTC+1', '']) {
        it(`rejects the non-IANA zone ${JSON.stringify(timeZone)} on an ordinary day`, () => {
            expect(() => serializeEntryIcs({ ...appointment, timeZone }, false)).to.throw(
                'Invalid IANA time zone',
            );
        });
    }

    it('keeps floating times local and exports IANA-zoned times as UTC', () => {
        expect(serializeEntryIcs(appointment, false)).to.include('DTSTART:20260315T090000\r\n');
        expect(
            serializeEntryIcs({ ...appointment, timeZone: 'America/New_York' }, false),
        ).to.include('DTSTART:20260315T130000Z\r\n');
    });
});
