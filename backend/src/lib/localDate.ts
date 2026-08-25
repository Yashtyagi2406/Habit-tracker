// THE CORE MODULE — all timezone-aware local-day logic lives here.
// Responsibilities:
// - getLocalToday(timezone): returns today's date string (YYYY-MM-DD) in the user's IANA timezone
// - toLocalDateString(utcTimestamp, timezone): converts any UTC instant to a local YYYY-MM-DD
// - isValidIanaTimezone(tz): validates a timezone string
// - isFutureLocalDate(dateStr, timezone): true if dateStr is after the user's local today
// Nothing outside this file should do its own timezone math.
