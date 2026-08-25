// Streak calculation — pure functions, operate only on arrays of local-date strings.
// computeCurrentStreak(sortedLocalDates, todayLocalDate): number
// computeLongestStreak(sortedLocalDates): number
// Keep this pure and unit-testable — no DB or timezone conversion here,
// it should only consume dates already normalized by localDate.ts.
