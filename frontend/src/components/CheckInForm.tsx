import React, { useState } from 'react';
import { Check, Calendar, AlertCircle } from 'lucide-react';
import { apiFetch, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface CheckInFormProps {
  habitId: string;
  habitName: string;
  checkedInToday: boolean;
  onCheckInSuccess: () => void;
}

export const CheckInForm: React.FC<CheckInFormProps> = ({
  habitId,
  habitName,
  checkedInToday,
  onCheckInSuccess,
}) => {
  const { user } = useAuth();
  const [showBackfill, setShowBackfill] = useState(false);
  const [backfillDate, setBackfillDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derive local today string for client-side max date constraint (using user's timezone if available)
  const getTodayDateString = (): string => {
    try {
      if (user?.timezone) {
        const formatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: user.timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
        return formatter.format(new Date());
      }
    } catch {
      // Fallback
    }
    return new Date().toISOString().slice(0, 10);
  };

  const todayStr = getTodayDateString();

  const handleCheckIn = async (date?: string) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/habits/${habitId}/checkins`, {
        method: 'POST',
        body: JSON.stringify(date ? { date } : {}),
      });
      if (date) {
        setBackfillDate('');
        setShowBackfill(false);
      }
      onCheckInSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to log check-in');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '0.75rem' }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button
          className="btn-success"
          onClick={() => handleCheckIn()}
          disabled={checkedInToday || isSubmitting}
          title={checkedInToday ? `Already checked in today for ${habitName}` : 'Check in for today'}
        >
          <Check size={16} />
          <span>{checkedInToday ? 'Completed Today' : 'Check In Today'}</span>
        </button>

        <button
          type="button"
          className="backfill-toggle-btn"
          onClick={() => {
            setShowBackfill(!showBackfill);
            setError(null);
          }}
        >
          <Calendar size={14} />
          <span>{showBackfill ? 'Cancel Backfill' : 'Backfill Past Date'}</span>
        </button>
      </div>

      {showBackfill && (
        <form
          className="backfill-panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (backfillDate) {
              handleCheckIn(backfillDate);
            }
          }}
        >
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            Select past date to backfill:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="date"
              max={todayStr}
              value={backfillDate}
              onChange={(e) => setBackfillDate(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
              disabled={!backfillDate || isSubmitting}
            >
              Log
            </button>
          </div>
          <span className="form-hint">
            Future dates beyond {todayStr} ({user?.timezone || 'local'}) are disabled.
          </span>
        </form>
      )}
    </div>
  );
};
