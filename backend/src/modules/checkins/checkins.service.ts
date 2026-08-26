import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  getLocalToday,
  toLocalDateString,
  isFutureLocalDate,
  parseLocalDateToDbDate,
  formatDbDateToLocalDateString,
} from '../../lib/localDate';
import { computeCurrentStreak, computeLongestStreak } from '../../streaks/streaks';
import { AppError } from '../../middleware/errorHandler';
import { LogCheckInInput } from './checkins.schema';

export async function logCheckIn(
  userId: string,
  userTimezone: string,
  habitId: string,
  input: LogCheckInInput
) {
  // 1. Verify habit ownership
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
  });

  if (!habit) {
    throw new AppError(404, 'HABIT_NOT_FOUND', 'Habit not found');
  }

  if (habit.userId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to check into this habit');
  }

  // 2. Resolve target date (defaults to user's local today)
  const targetLocalDate = input.date ? input.date.trim() : getLocalToday(userTimezone);

  // 3. Reject future dates relative to user's local timezone
  if (isFutureLocalDate(targetLocalDate, userTimezone)) {
    throw new AppError(
      400,
      'FUTURE_DATE_NOT_ALLOWED',
      `Cannot check in for future date "${targetLocalDate}" in timezone "${userTimezone}"`
    );
  }

  // 4. Reject dates before the habit's creation local day
  const habitCreationLocalDate = toLocalDateString(habit.createdAt, userTimezone);
  if (targetLocalDate < habitCreationLocalDate) {
    throw new AppError(
      400,
      'DATE_BEFORE_HABIT_CREATION',
      `Cannot check in for date "${targetLocalDate}" before habit creation date "${habitCreationLocalDate}"`
    );
  }

  // 5. Convert to canonical UTC midnight Date object for PostgreSQL DATE column
  const dbDate = parseLocalDateToDbDate(targetLocalDate);

  // 6. Insert check-in record, relying on DB unique constraint (habitId, localDate)
  let checkInRecord;
  try {
    checkInRecord = await prisma.checkIn.create({
      data: {
        habitId,
        localDate: dbDate,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(
        409,
        'DUPLICATE_CHECKIN',
        `A check-in for habit "${habit.name}" on local date "${targetLocalDate}" has already been logged`
      );
    }
    throw error;
  }

  // 7. Fetch all check-ins for this habit to compute updated streaks
  const allCheckIns = await prisma.checkIn.findMany({
    where: { habitId },
    select: { localDate: true },
    orderBy: { localDate: 'asc' },
  });

  const localDates = allCheckIns.map((ci) =>
    formatDbDateToLocalDateString(ci.localDate)
  );

  const todayLocalDate = getLocalToday(userTimezone);
  const currentStreak = computeCurrentStreak(localDates, todayLocalDate);
  const longestStreak = computeLongestStreak(localDates);
  const checkedInToday = localDates.includes(todayLocalDate);

  return {
    checkIn: {
      id: checkInRecord.id,
      habitId: checkInRecord.habitId,
      localDate: targetLocalDate,
      createdAt: checkInRecord.createdAt,
    },
    streaks: {
      currentStreak,
      longestStreak,
      checkedInToday,
      totalCheckIns: localDates.length,
      checkInDates: localDates,
    },
  };
}
