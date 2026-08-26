import React, { useState } from 'react';
import { History, ChevronDown, ChevronUp, CalendarCheck2 } from 'lucide-react';
import { StreakBadge } from './StreakBadge';
import { CheckInForm } from './CheckInForm';

export interface HabitData {
  id: string;
  name: string;
  description?: string | null;
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
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="habit-card">
      <div className="habit-header">
        <div>
          <h3 className="habit-title">{habit.name}</h3>
          {habit.description && (
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {habit.description}
            </p>
          )}
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

        <div style={{ width: '100%', marginTop: '0.5rem' }}>
          <button
            type="button"
            className="backfill-toggle-btn"
            onClick={() => setShowHistory(!showHistory)}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.7rem' }}
          >
            <History size={13} />
            <span>History ({habit.checkInDates.length})</span>
            {showHistory ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {showHistory && (
            <div className="backfill-panel" style={{ marginTop: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <CalendarCheck2 size={14} color="#10b981" />
                <span>Logged Local Days:</span>
              </div>
              {habit.checkInDates.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No check-ins recorded yet.</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {habit.checkInDates.slice().reverse().map((dateStr) => (
                    <span
                      key={dateStr}
                      style={{
                        fontSize: '0.75rem',
                        fontFamily: 'monospace',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#86efac',
                      }}
                    >
                      {dateStr}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
