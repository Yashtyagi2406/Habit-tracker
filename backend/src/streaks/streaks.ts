/**
 * ============================================================================
 * STREAK CALCULATION ENGINE: streaks.ts
 * ============================================================================
 * 
 * PURE & UNIT-TESTABLE:
 * This module operates strictly on already-normalized local calendar date
 * strings ("YYYY-MM-DD"). It performs NO database queries and NO timezone
 * conversions directly.
 * 
 * RULES:
 * 1. Current Streak:
 *    Consecutive local days ending at either:
 *    - today (user has checked in today)
 *    - yesterday (user checked in yesterday and has not yet checked in today;
 *      streak remains active until today ends)
 *    If the latest check-in is before yesterday, current streak is 0.
 * 
 * 2. Longest Streak:
 *    The maximum consecutive run of local days across all check-ins for
 *    the habit, regardless of when it occurred.
 */

const MILLISECONDS_PER_DAY = 86_400_000;

/**
 * Calculates the exact number of calendar days between two "YYYY-MM-DD" date strings.
 * Returns positive if dateB is after dateA.
 */
function getDayDifference(dateStrA: string, dateStrB: string): number {
  const timeA = new Date(`${dateStrA}T00:00:00.000Z`).getTime();
  const timeB = new Date(`${dateStrB}T00:00:00.000Z`).getTime();
  return Math.round((timeB - timeA) / MILLISECONDS_PER_DAY);
}

/**
 * Normalizes, deduplicates, and sorts local-date strings in ascending chronological order.
 */
function normalizeAndSortDates(localDates: string[]): string[] {
  if (!localDates || localDates.length === 0) {
    return [];
  }
  const uniqueDates = Array.from(new Set(localDates.filter(Boolean)));
  // Lexicographical sort works accurately for "YYYY-MM-DD"
  return uniqueDates.sort();
}

/**
 * Computes the current active streak for a habit.
 *
 * @param localDates - Array of check-in date strings ("YYYY-MM-DD")
 * @param todayLocalDate - The user's local today date string ("YYYY-MM-DD")
 * @returns The number of consecutive days in the active streak (0 or positive integer)
 */
export function computeCurrentStreak(
  localDates: string[],
  todayLocalDate: string
): number {
  if (!todayLocalDate) {
    throw new Error('todayLocalDate parameter is required');
  }

  const sortedDates = normalizeAndSortDates(localDates);
  if (sortedDates.length === 0) {
    return 0;
  }

  // Filter out any anomalous dates that might be beyond today
  const validDates = sortedDates.filter((date) => date <= todayLocalDate);
  if (validDates.length === 0) {
    return 0;
  }

  const lastDate = validDates[validDates.length - 1];
  const diffFromToday = getDayDifference(lastDate, todayLocalDate);

  // If last check-in is older than yesterday (diff > 1), streak is broken
  if (diffFromToday > 1) {
    return 0;
  }

  // Walk backwards from the latest check-in counting consecutive previous days
  let streak = 1;
  for (let i = validDates.length - 1; i > 0; i--) {
    const current = validDates[i];
    const previous = validDates[i - 1];
    const diff = getDayDifference(previous, current);

    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Computes the longest streak of consecutive check-ins ever recorded for a habit.
 *
 * @param localDates - Array of check-in date strings ("YYYY-MM-DD")
 * @returns The maximum consecutive days run across the entire history (0 or positive integer)
 */
export function computeLongestStreak(localDates: string[]): number {
  const sortedDates = normalizeAndSortDates(localDates);
  if (sortedDates.length === 0) {
    return 0;
  }

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = sortedDates[i - 1];
    const currDate = sortedDates[i];
    const diff = getDayDifference(prevDate, currDate);

    if (diff === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
}
