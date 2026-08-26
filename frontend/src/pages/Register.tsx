import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { TimezoneSelect } from '../components/TimezoneSelect';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState('');
  const [detectedTz, setDetectedTz] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      let detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Canonicalize if needed (e.g. Asia/Calcutta -> Asia/Kolkata)
      if (detected === 'Asia/Calcutta') {
        detected = 'Asia/Kolkata';
      }
      if (detected) {
        setTimezone(detected);
        setDetectedTz(detected);
      } else {
        setTimezone('UTC');
        setDetectedTz('UTC');
      }
    } catch {
      setTimezone('UTC');
      setDetectedTz('UTC');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(email, password, timezone);
      navigate('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', padding: '0.75rem', borderRadius: '50%', marginBottom: '0.75rem' }}>
            <Flame size={32} color="#4f46e5" />
          </div>
          <h1>Create an Account</h1>
          <p>Track habits with precision local timezone streaks</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'block', marginBottom: '0.45rem' }}>
              IANA Timezone
            </label>
            <TimezoneSelect
              value={timezone}
              onChange={(tz) => setTimezone(tz)}
              detectedTz={detectedTz}
            />
            <span className="form-hint">
              Used strictly to calculate your local calendar day for check-ins and streaks.
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
            style={{ marginTop: '0.5rem' }}
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};
