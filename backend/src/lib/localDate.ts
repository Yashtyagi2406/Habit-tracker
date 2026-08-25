/**
 * ============================================================================
 * CORE TIMEZONE & LOCAL-DAY MODULE: localDate.ts
 * ============================================================================
 * 
 * ARCHITECTURAL DESIGN & DECISIONS:
 * 1. TIMEZONE ISOLATION:
 *    All timezone calculations across the entire application are strictly
 *    isolated in this module. No other service, controller, route, or utility
 *    should perform direct timezone conversions or import timezone libraries.
 * 
 * 2. LOCAL CALENDAR DAY AS SOURCE OF TRUTH:
 *    Streaks and check-ins are based strictly on the user's local calendar day
 *    ("YYYY-MM-DD"), never on 24-hour elapsed windows or server UTC time.
 *    For example: A user checking in at 11:30 PM UTC on Monday is already in
 *    Tuesday local time in Asia/Kolkata (+05:30). Their check-in belongs to
 *    Tuesday, not Monday.
 * 
 * 3. WHAT COUNTS AS "TODAY":
 *    The local calendar day string (YYYY-MM-DD) obtained by projecting the
 *    current UTC timestamp into the user's registered IANA timezone.
 * 
 * 4. WHAT COUNTS AS "FUTURE":
 *    Any local-date string that is lexicographically / chronologically greater
 *    than the user's current local today date string (YYYY-MM-DD).
 * 
 * 5. DST TRANSITION HANDLING:
 *    Luxon IANAZone database handles all Daylight Saving Time (DST) shifts
 *    (e.g., 23-hour spring forward and 25-hour fall back days). Since we map
 *    UTC instants to calendar dates (YYYY-MM-DD), clock shifts within a day do
 *    not disrupt the calendar date mapping.
 * 
 * 6. PERSISTENCE IN DATABASE:
 *    PostgreSQL stores check-in dates in a `DATE` column (without time component).
 *    We represent these as UTC midnight Date objects when interacting with Prisma,
 *    and format them back to standard "YYYY-MM-DD" strings for streak computation.
 */

import { DateTime, IANAZone } from 'luxon';

/**
 * Validates whether a given string is a valid IANA timezone name.
 * Rejects invalid strings such as "Foo/Bar", "UTC+5", or empty strings.
 *
 * @param tz - Timezone string to validate (e.g. "Asia/Kolkata", "America/New_York")
 * @returns True if the timezone is a valid IANA zone recognized by tzdb
 */
export function isValidIanaTimezone(tz: string): boolean {
  if (!tz || typeof tz !== 'string' || tz.trim() === '') {
    return false;
  }
  return IANAZone.isValidZone(tz.trim());
}

/**
 * Validates whether a string matches ISO-8601 calendar date format (YYYY-MM-DD)
 * and represents a valid calendar day (e.g. rejects "2026-02-30").
 *
 * @param dateStr - String to validate
 * @returns True if dateStr is a valid YYYY-MM-DD date
 */
export function isValidLocalDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== 'string') {
    return false;
  }
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateStr)) {
    return false;
  }
  const dt = DateTime.fromISO(dateStr, { zone: 'utc' });
  return dt.isValid && dt.toISODate() === dateStr;
}

/**
 * Gets today's calendar date string (YYYY-MM-DD) in the user's IANA timezone.
 *
 * @param timezone - User's valid IANA timezone (e.g. "Asia/Kolkata")
 * @param referenceInstant - Optional Date instance representing the "now" instant (defaults to current time)
 * @returns Date string in "YYYY-MM-DD" format
 * @throws Error if timezone is invalid
 */
export function getLocalToday(timezone: string, referenceInstant: Date = new Date()): string {
  if (!isValidIanaTimezone(timezone)) {
    throw new Error(`Invalid IANA timezone: "${timezone}"`);
  }
  const dt = DateTime.fromJSDate(referenceInstant, { zone: timezone });
  const isoDate = dt.toISODate();
  if (!isoDate) {
    throw new Error(`Failed to compute local date for timezone "${timezone}"`);
  }
  return isoDate;
}

/**
 * Converts any UTC timestamp / instant to a local calendar date string (YYYY-MM-DD)
 * in the specified IANA timezone.
 *
 * @param utcTimestamp - Date object, ISO string, or millisecond timestamp
 * @param timezone - User's valid IANA timezone
 * @returns Date string in "YYYY-MM-DD" format
 * @throws Error if timezone is invalid or timestamp cannot be parsed
 */
export function toLocalDateString(
  utcTimestamp: Date | string | number,
  timezone: string
): string {
  if (!isValidIanaTimezone(timezone)) {
    throw new Error(`Invalid IANA timezone: "${timezone}"`);
  }

  let dt: DateTime;
  if (utcTimestamp instanceof Date) {
    dt = DateTime.fromJSDate(utcTimestamp, { zone: timezone });
  } else if (typeof utcTimestamp === 'number') {
    dt = DateTime.fromMillis(utcTimestamp, { zone: timezone });
  } else if (typeof utcTimestamp === 'string') {
    dt = DateTime.fromISO(utcTimestamp, { zone: timezone });
  } else {
    throw new Error('Invalid timestamp format provided');
  }

  if (!dt.isValid) {
    throw new Error(`Invalid date/time value: ${dt.invalidReason}`);
  }

  const isoDate = dt.toISODate();
  if (!isoDate) {
    throw new Error(`Failed to convert timestamp to local date string`);
  }
  return isoDate;
}

/**
 * Checks if a given local date string (YYYY-MM-DD) is in the future relative
 * to the user's current local today in their timezone.
 *
 * @param dateStr - Date string in "YYYY-MM-DD" format
 * @param timezone - User's valid IANA timezone
 * @param referenceInstant - Optional Date instance representing "now" (defaults to current time)
 * @returns True if dateStr is after the user's local today
 */
export function isFutureLocalDate(
  dateStr: string,
  timezone: string,
  referenceInstant: Date = new Date()
): boolean {
  if (!isValidLocalDateString(dateStr)) {
    throw new Error(`Invalid local date string format: "${dateStr}". Expected YYYY-MM-DD.`);
  }
  const today = getLocalToday(timezone, referenceInstant);
  // Lexicographical comparison works reliably for YYYY-MM-DD format
  return dateStr > today;
}

/**
 * Parses a normalized "YYYY-MM-DD" string into a Date object at UTC midnight
 * for storing in PostgreSQL `@db.Date` column via Prisma.
 *
 * @param dateStr - Date string in "YYYY-MM-DD" format
 * @returns Date object representing UTC midnight of that calendar day
 */
export function parseLocalDateToDbDate(dateStr: string): Date {
  if (!isValidLocalDateString(dateStr)) {
    throw new Error(`Invalid local date string format: "${dateStr}". Expected YYYY-MM-DD.`);
  }
  return new Date(`${dateStr}T00:00:00.000Z`);
}

/**
 * Formats a Date object returned from PostgreSQL `@db.Date` column back into
 * a normalized "YYYY-MM-DD" local date string.
 *
 * @param dbDate - Date object from database
 * @returns Normalized "YYYY-MM-DD" string
 */
export function formatDbDateToLocalDateString(dbDate: Date): string {
  if (!(dbDate instanceof Date) || isNaN(dbDate.getTime())) {
    throw new Error('Invalid Date object provided');
  }
  return dbDate.toISOString().slice(0, 10);
}
