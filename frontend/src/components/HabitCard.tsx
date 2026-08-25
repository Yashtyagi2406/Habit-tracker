import React from 'react';
import { StreakBadge } from './StreakBadge';
import { CheckInForm } from './CheckInForm';

export interface HabitData {
  id: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  checkedInToday: boolean;
  totalCheckIns: number;
  checkInDates: string[];
  createdAt: string;
}

interface HabitCardProps {
  habit: HabitData;
  onRefresh: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({ habit, onRefresh }) => {
  return (
    <div className="habit-card">
      <div className="habit-header">
        <div>
          <h3 className="habit-title">{habit.name}</h3>
          <span className="habit-meta">
            Started {new Date(habit.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="habit-streaks">
        <StreakBadge type="current" count={habit.currentStreak} />
        <StreakBadge type="longest" count={habit.longestStreak} />
        <div className="streak-badge streak-badge-total">
          <span>Total: {habit.totalCheckIns}</span>
        </div>
      </div>

      <div className="habit-actions">
        <CheckInForm
          habitId={habit.id}
          habitName={habit.name}
          checkedInToday={habit.checkedInToday}
          onCheckInSuccess={onRefresh}
        />
      </div>
    </div>
  );
};
