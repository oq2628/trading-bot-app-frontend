import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Key, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Toast } from '../components/Toast';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setToast({ message: 'The password reset token is missing. Please request a new link.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/api/auth/reset-password', {
        token: token.trim(),
        new_password: password
      });
      setToast({ message: res.message, type: 'success' });
      setSuccess(true);
      // Wait a moment and navigate to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const error = err as { message?: string };
      setToast({ message: error.message || 'Reset password failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 160px)',
      padding: '2rem 1rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '2.5rem',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        {success ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--success-glow)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <CheckCircle2 size={22} color="var(--success-color)" />
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>Password Reset Complete</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Your password has been successfully reset. Redirecting you to the sign in page...
            </p>
            <Link to="/login" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In Now
            </Link>
          </div>
        ) : (
          <div>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }} className="nav-link">
              <ArrowLeft size={14} />
              Back to Sign In
            </Link>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>Set New Password</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Choose a strong, secure password for your account.
            </p>

            {!token && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                color: 'var(--error-color)',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '1.5rem'
              }}>
                Warning: No password reset token was found in the link. Submitting the form will fail. Please request a new link.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    className="form-control"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !token}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ResetPassword;
