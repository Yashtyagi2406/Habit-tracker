import React, { useState, useEffect, useCallback } from 'react';
import { Flame, Plus, LogOut, Globe, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch, ApiError } from '../api/client';
import { HabitCard, HabitData } from '../components/HabitCard';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      const data = await apiFetch<{ habits: HabitData[] }>('/habits');
      setHabits(data.habits);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to fetch habits');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    setError(null);
    setIsCreating(true);

    try {
      await apiFetch('/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: newHabitName.trim(),
          description: newHabitDescription.trim() || undefined,
        }),
      });
      setNewHabitName('');
      setNewHabitDescription('');
      await fetchHabits();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create habit');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const totalCheckInsAll = habits.reduce((acc, h) => acc + h.totalCheckIns, 0);
  const maxLongestStreakAll = habits.length > 0 ? Math.max(...habits.map((h) => h.longestStreak)) : 0;
  const completedTodayCount = habits.filter((h) => h.checkedInToday).length;

  return (
    <div className="app-container">
      {/* Navigation */}
      <header className="navbar">
        <div className="navbar-brand">
          <Flame size={24} color="#6366f1" />
          <span>HabitTracker</span>
        </div>

        <div className="navbar-user">
          <div className="user-badge">
            <span>{user?.email}</span>
            <span className="timezone-pill" title="User local timezone for streak calculations">
              <Globe size={12} style={{ display: 'inline', marginRight: '3px', verticalAlign: 'middle' }} />
              {user?.timezone}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn-outline"
            title="Sign Out"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-title">
            <h1>Habit Dashboard</h1>
            <p>Your streaks are calculated strictly against your local calendar day.</p>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1.5rem' }}>
            <span>{error}</span>
          </div>
        )}

        {/* Metric Cards */}
        <section className="summary-cards">
          <div className="summary-card">
            <div className="summary-card-title">Active Habits</div>
            <div className="summary-card-value">{habits.length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Completed Today</div>
            <div className="summary-card-value" style={{ color: '#10b981' }}>
              {completedTodayCount} / {habits.length}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Best Overall Streak</div>
            <div className="summary-card-value" style={{ color: '#f59e0b' }}>
              {maxLongestStreakAll} {maxLongestStreakAll === 1 ? 'day' : 'days'}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card-title">Total Check-Ins</div>
            <div className="summary-card-value">{totalCheckInsAll}</div>
          </div>
        </section>

        {/* Create Habit Form */}
        <section className="create-habit-card">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} color="#6366f1" />
            <span>Create New Habit</span>
          </h2>
          <form className="create-habit-form" onSubmit={handleCreateHabit} style={{ flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Habit name (e.g. Read 20 pages, Drink 3L water...)"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                required
                maxLength={100}
                style={{ flex: 2 }}
              />
              <input
                type="text"
                placeholder="Optional description (e.g. In the morning after coffee)"
                value={newHabitDescription}
                onChange={(e) => setNewHabitDescription(e.target.value)}
                maxLength={500}
                style={{ flex: 3 }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={isCreating || !newHabitName.trim()}
                style={{ width: 'auto', whiteSpace: 'nowrap', padding: '0.75rem 1.5rem' }}
              >
                {isCreating ? 'Adding...' : 'Add Habit'}
              </button>
            </div>
          </form>
        </section>

        {/* Habits List */}
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={18} color="#f59e0b" />
            <span>Your Habits & Streaks</span>
          </h2>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Loading habits...
            </div>
          ) : habits.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={42} color="#64748b" style={{ margin: '0 auto 0.75rem' }} />
              <h3>No habits tracked yet</h3>
              <p>Create your first habit above to begin building streaks!</p>
            </div>
          ) : (
            <div className="habits-list">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onRefresh={fetchHabits}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
