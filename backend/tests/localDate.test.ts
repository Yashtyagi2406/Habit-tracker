import { describe, it, expect } from 'vitest';
import {
  isValidIanaTimezone,
  isValidLocalDateString,
  getLocalToday,
  toLocalDateString,
  isFutureLocalDate,
  parseLocalDateToDbDate,
  formatDbDateToLocalDateString,
} from '../src/lib/localDate';

describe('localDate module', () => {
  describe('isValidIanaTimezone', () => {
    it('accepts valid IANA timezones', () => {
      expect(isValidIanaTimezone('Asia/Kolkata')).toBe(true);
      expect(isValidIanaTimezone('America/New_York')).toBe(true);
      expect(isValidIanaTimezone('Europe/London')).toBe(true);
      expect(isValidIanaTimezone('Pacific/Auckland')).toBe(true);
      expect(isValidIanaTimezone('UTC')).toBe(true);
    });

    it('rejects invalid timezone strings', () => {
      expect(isValidIanaTimezone('Foo/Bar')).toBe(false);
      expect(isValidIanaTimezone('Invalid/Zone')).toBe(false);
      expect(isValidIanaTimezone('UTC+5')).toBe(false);
      expect(isValidIanaTimezone('')).toBe(false);
      expect(isValidIanaTimezone('   ')).toBe(false);
      expect(isValidIanaTimezone(null as unknown as string)).toBe(false);
    });
  });

  describe('isValidLocalDateString', () => {
    it('accepts valid YYYY-MM-DD format dates', () => {
      expect(isValidLocalDateString('2026-08-25')).toBe(true);
      expect(isValidLocalDateString('2024-02-29')).toBe(true); // leap year
      expect(isValidLocalDateString('2000-01-01')).toBe(true);
    });

    it('rejects invalid date formats and impossible dates', () => {
      expect(isValidLocalDateString('2026-8-25')).toBe(false);
      expect(isValidLocalDateString('25-08-2026')).toBe(false);
      expect(isValidLocalDateString('2026/08/25')).toBe(false);
      expect(isValidLocalDateString('2026-02-30')).toBe(false); // Feb 30 does not exist
      expect(isValidLocalDateString('2025-02-29')).toBe(false); // not a leap year
      expect(isValidLocalDateString('2026-13-01')).toBe(false);
      expect(isValidLocalDateString('')).toBe(false);
    });
  });

  describe('getLocalToday and UTC offset boundary edges', () => {
    it('correctly shifts date ahead when UTC is late night and local timezone crossed midnight', () => {
      // 2026-08-25 at 23:00:00 UTC
      const lateUtcInstant = new Date('2026-08-25T23:00:00.000Z');

      // In UTC, today is 2026-08-25
      expect(getLocalToday('UTC', lateUtcInstant)).toBe('2026-08-25');

      // In Asia/Kolkata (+05:30), local time is 2026-08-26 04:30:00
      expect(getLocalToday('Asia/Kolkata', lateUtcInstant)).toBe('2026-08-26');

      // In Pacific/Auckland (+12:00), local time is 2026-08-26 11:00:00
      expect(getLocalToday('Pacific/Auckland', lateUtcInstant)).toBe('2026-08-26');

      // In America/New_York (-04:00 EDT), local time is 2026-08-25 19:00:00
      expect(getLocalToday('America/New_York', lateUtcInstant)).toBe('2026-08-25');
    });

    it('correctly shifts date behind when UTC is early morning and local timezone is previous day', () => {
      // 2026-08-25 at 02:00:00 UTC
      const earlyUtcInstant = new Date('2026-08-25T02:00:00.000Z');

      // In UTC, today is 2026-08-25
      expect(getLocalToday('UTC', earlyUtcInstant)).toBe('2026-08-25');

      // In America/Los_Angeles (-07:00 PDT), local time is 2026-08-24 19:00:00
      expect(getLocalToday('America/Los_Angeles', earlyUtcInstant)).toBe('2026-08-24');

      // In Pacific/Honolulu (-10:00), local time is 2026-08-24 16:00:00
      expect(getLocalToday('Pacific/Honolulu', earlyUtcInstant)).toBe('2026-08-24');

      // In Asia/Tokyo (+09:00), local time is 2026-08-25 11:00:00
      expect(getLocalToday('Asia/Tokyo', earlyUtcInstant)).toBe('2026-08-25');
    });
  });

  describe('Daylight Saving Time (DST) edge cases', () => {
    it('handles Spring Forward transition correctly in America/New_York', () => {
      // On 2026-03-08, America/New_York springs forward from 02:00 EST to 03:00 EDT (clock skips 2am)
      // 06:59:00 UTC is 01:59:00 EST -> 2026-03-08
      const beforeTransition = new Date('2026-03-08T06:59:00.000Z');
      expect(getLocalToday('America/New_York', beforeTransition)).toBe('2026-03-08');

      // 07:01:00 UTC is 03:01:00 EDT -> 2026-03-08
      const afterTransition = new Date('2026-03-08T07:01:00.000Z');
      expect(getLocalToday('America/New_York', afterTransition)).toBe('2026-03-08');
    });

    it('handles Fall Back transition correctly in America/New_York', () => {
      // On 2026-11-01, America/New_York falls back from 02:00 EDT to 01:00 EST (clock repeats 1am)
      // 05:59:00 UTC is 01:59:00 EDT -> 2026-11-01
      const beforeFallBack = new Date('2026-11-01T05:59:00.000Z');
      expect(getLocalToday('America/New_York', beforeFallBack)).toBe('2026-11-01');

      // 06:01:00 UTC is 01:01:00 EST -> 2026-11-01
      const afterFallBack = new Date('2026-11-01T06:01:00.000Z');
      expect(getLocalToday('America/New_York', afterFallBack)).toBe('2026-11-01');
    });

    it('handles Europe/London Spring Forward transition', () => {
      // On 2026-03-29, London switches from GMT (+0) to BST (+1) at 01:00 UTC
      const gmtTime = new Date('2026-03-29T00:30:00.000Z');
      expect(getLocalToday('Europe/London', gmtTime)).toBe('2026-03-29');

      const bstTime = new Date('2026-03-29T01:30:00.000Z');
      expect(getLocalToday('Europe/London', bstTime)).toBe('2026-03-29');
    });
  });

  describe('isFutureLocalDate', () => {
    const refInstant = new Date('2026-08-25T23:00:00.000Z');

    it('identifies future vs non-future dates based on user local today', () => {
      // In Asia/Kolkata at 23:00 UTC on 2026-08-25, local today is 2026-08-26
      expect(isFutureLocalDate('2026-08-26', 'Asia/Kolkata', refInstant)).toBe(false); // today
      expect(isFutureLocalDate('2026-08-25', 'Asia/Kolkata', refInstant)).toBe(false); // past
      expect(isFutureLocalDate('2026-08-27', 'Asia/Kolkata', refInstant)).toBe(true);  // future

      // In America/New_York at 23:00 UTC on 2026-08-25, local today is 2026-08-25
      expect(isFutureLocalDate('2026-08-25', 'America/New_York', refInstant)).toBe(false); // today
      expect(isFutureLocalDate('2026-08-24', 'America/New_York', refInstant)).toBe(false); // past
      expect(isFutureLocalDate('2026-08-26', 'America/New_York', refInstant)).toBe(true);  // future in NY!
    });
  });

  describe('toLocalDateString', () => {
    it('converts Date object, timestamp number, and ISO string consistently', () => {
      const instant = new Date('2026-08-25T23:30:00.000Z');
      expect(toLocalDateString(instant, 'Asia/Kolkata')).toBe('2026-08-26');
      expect(toLocalDateString(instant.getTime(), 'Asia/Kolkata')).toBe('2026-08-26');
      expect(toLocalDateString('2026-08-25T23:30:00.000Z', 'Asia/Kolkata')).toBe('2026-08-26');
    });
  });

  describe('parseLocalDateToDbDate and formatDbDateToLocalDateString', () => {
    it('round trips calendar date string through Date object without timezone drift', () => {
      const dateStr = '2026-08-25';
      const dbDate = parseLocalDateToDbDate(dateStr);
      expect(dbDate.toISOString()).toBe('2026-08-25T00:00:00.000Z');
      expect(formatDbDateToLocalDateString(dbDate)).toBe(dateStr);
    });
  });
});
