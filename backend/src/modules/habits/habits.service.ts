import { prisma } from '../../lib/prisma';
import { getLocalToday, formatDbDateToLocalDateString } from '../../lib/localDate';
import { computeCurrentStreak, computeLongestStreak } from '../../streaks/streaks';
import { CreateHabitInput } from './habits.schema';

export interface HabitWithStreaks {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  currentStreak: number;
  longestStreak: number;
  checkedInToday: boolean;
  totalCheckIns: number;
  checkInDates: string[]; // sorted ascending YYYY-MM-DD
}

export async function createHabit(userId: string, input: CreateHabitInput) {
  const habit = await prisma.habit.create({
    data: {
      userId,
      name: input.name,
    },
    select: {
      id: true,
      userId: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ...habit,
    currentStreak: 0,
    longestStreak: 0,
    checkedInToday: false,
    totalCheckIns: 0,
    checkInDates: [],
  };
}

export async function listUserHabits(
  userId: string,
  userTimezone: string
): Promise<HabitWithStreaks[]> {
  const habits = await prisma.habit.findMany({
    where: { userId },
    include: {
      checkIns: {
        select: {
          localDate: true,
        },
        orderBy: {
          localDate: 'asc',
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const todayLocalDate = getLocalToday(userTimezone);

  return habits.map((habit) => {
    // Map DB dates to normalized "YYYY-MM-DD" local date strings
    const localDates = habit.checkIns.map((ci) =>
      formatDbDateToLocalDateString(ci.localDate)
    );

    const currentStreak = computeCurrentStreak(localDates, todayLocalDate);
    const longestStreak = computeLongestStreak(localDates);
    const checkedInToday = localDates.includes(todayLocalDate);

    return {
      id: habit.id,
      userId: habit.userId,
      name: habit.name,
      createdAt: habit.createdAt,
      updatedAt: habit.updatedAt,
      currentStreak,
      longestStreak,
      checkedInToday,
      totalCheckIns: localDates.length,
      checkInDates: localDates,
    };
  });
}
