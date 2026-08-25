import React from 'react';
import { Flame, Trophy } from 'lucide-react';

interface StreakBadgeProps {
  type: 'current' | 'longest';
  count: number;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ type, count }) => {
  if (type === 'current') {
    return (
      <div className="streak-badge streak-badge-current" title={`${count} day current streak`}>
        <Flame size={16} />
        <span>{count} {count === 1 ? 'day' : 'days'}</span>
      </div>
    );
  }

  return (
    <div className="streak-badge streak-badge-longest" title={`Best streak: ${count} days`}>
      <Trophy size={16} />
      <span>Best: {count} {count === 1 ? 'day' : 'days'}</span>
    </div>
  );
};
