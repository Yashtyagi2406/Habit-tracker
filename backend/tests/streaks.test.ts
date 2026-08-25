import { describe, it, expect } from 'vitest';
import { computeCurrentStreak, computeLongestStreak } from '../src/streaks/streaks';

describe('streaks calculation engine', () => {
  const TODAY = '2026-08-25';

  describe('empty check-ins', () => {
    it('returns 0 for both current and longest streaks when no check-ins exist', () => {
      expect(computeCurrentStreak([], TODAY)).toBe(0);
      expect(computeLongestStreak([])).toBe(0);
    });
  });

  describe('single-day check-in scenarios', () => {
    it('returns streak of 1 when check-in is logged for today', () => {
      const checkIns = ['2026-08-25'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(1);
      expect(computeLongestStreak(checkIns)).toBe(1);
    });

    it('returns current streak of 1 when check-in was logged yesterday (still active)', () => {
      const checkIns = ['2026-08-24'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(1);
      expect(computeLongestStreak(checkIns)).toBe(1);
    });

    it('returns current streak 0 and longest streak 1 when check-in was logged 2 days ago', () => {
      const checkIns = ['2026-08-23'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(0);
      expect(computeLongestStreak(checkIns)).toBe(1);
    });
  });

  describe('multi-day active streaks', () => {
    it('calculates active streak ending today', () => {
      const checkIns = ['2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(5);
      expect(computeLongestStreak(checkIns)).toBe(5);
    });

    it('calculates active streak ending yesterday (not yet checked in today)', () => {
      const checkIns = ['2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(4);
      expect(computeLongestStreak(checkIns)).toBe(4);
    });
  });

  describe('gaps and broken streaks', () => {
    it('returns current streak 0 if broken yesterday', () => {
      // Checked in Aug 20, 21, 22, 23, missed 24, today is 25
      const checkIns = ['2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(0);
      expect(computeLongestStreak(checkIns)).toBe(4);
    });

    it('handles historical gaps with smaller active streak', () => {
      // 5-day streak in past, 2-day gap, 2-day active streak (Aug 24, 25)
      const checkIns = [
        '2026-08-10',
        '2026-08-11',
        '2026-08-12',
        '2026-08-13',
        '2026-08-14',
        '2026-08-24',
        '2026-08-25',
      ];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(2);
      expect(computeLongestStreak(checkIns)).toBe(5);
    });

    it('handles historical gaps with larger active streak', () => {
      // 3-day streak in past, gap, 6-day active streak ending today
      const checkIns = [
        '2026-08-01',
        '2026-08-02',
        '2026-08-03',
        '2026-08-20',
        '2026-08-21',
        '2026-08-22',
        '2026-08-23',
        '2026-08-24',
        '2026-08-25',
      ];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(6);
      expect(computeLongestStreak(checkIns)).toBe(6);
    });
  });

  describe('backfills and unordered / duplicate dates', () => {
    it('correctly sorts unordered check-in dates', () => {
      const checkIns = ['2026-08-25', '2026-08-23', '2026-08-24'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(3);
      expect(computeLongestStreak(checkIns)).toBe(3);
    });

    it('deduplicates duplicate check-in entries gracefully', () => {
      const checkIns = ['2026-08-24', '2026-08-24', '2026-08-25', '2026-08-25'];
      expect(computeCurrentStreak(checkIns, TODAY)).toBe(2);
      expect(computeLongestStreak(checkIns)).toBe(2);
    });
  });

  describe('month and year boundary transitions', () => {
    it('correctly counts streaks crossing month boundaries', () => {
      const checkIns = ['2026-07-30', '2026-07-31', '2026-08-01', '2026-08-02'];
      expect(computeCurrentStreak(checkIns, '2026-08-02')).toBe(4);
      expect(computeLongestStreak(checkIns)).toBe(4);
    });

    it('correctly counts streaks crossing year boundaries', () => {
      const checkIns = ['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02'];
      expect(computeCurrentStreak(checkIns, '2026-01-02')).toBe(4);
      expect(computeLongestStreak(checkIns)).toBe(4);
    });

    it('correctly handles leap year February 29th', () => {
      const checkIns = ['2024-02-28', '2024-02-29', '2024-03-01'];
      expect(computeCurrentStreak(checkIns, '2024-03-01')).toBe(3);
      expect(computeLongestStreak(checkIns)).toBe(3);
    });
  });
});
