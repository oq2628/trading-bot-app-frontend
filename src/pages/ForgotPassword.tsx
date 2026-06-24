import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Phone, ArrowLeft, Send } from 'lucide-react';
import { Toast } from '../components/Toast';

export const ForgotPassword: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setToast({ message: 'Email address is required.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/api/auth/forgot-password', { email: email.trim() });
      setToast({ message: res.message, type: 'success' });
      setSubmitted(true);
    } catch (err) {
      const error = err as { message?: string };
      setToast({ message: error.message || 'An error occurred. Please try again.', type: 'error' });
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
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }} className="nav-link">
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>Forgot Password</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Select how you want to recover your password credentials.
        </p>

        {/* Tabs switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--panel-border)',
          marginBottom: '2rem',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => { setActiveTab('email'); setSubmitted(false); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: activeTab === 'email' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              cursor: 'pointer',
              borderBottom: activeTab === 'email' ? '2px solid var(--primary-solid)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Email Link
          </button>
          <button
            onClick={() => setActiveTab('phone')}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: activeTab === 'phone' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              cursor: 'pointer',
              borderBottom: activeTab === 'phone' ? '2px solid var(--primary-solid)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Phone OTP
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'email' ? (
          <div>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
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
                  <Mail size={22} color="var(--success-color)" />
                </div>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Check your email</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  If the email address exists in our system, we have sent a secure password reset link to it. Please check your inbox and spam folders.
                </p>
                <button 
                  onClick={() => setSubmitted(false)} 
                  className="btn-secondary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Resend Email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="email"
                      required
                      className="form-control"
                      placeholder="e.g. buyer@algo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                >
                  {loading ? (
                    'Sending Link...'
                  ) : (
                    <>
                      <Send size={15} />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}>
              <Phone size={22} color="var(--warning-color)" />
            </div>
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Coming Soon</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 0 }}>
              Phone OTP reset is coming soon. Please use the Email reset link tab in the meantime to recover your credentials.
            </p>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ForgotPassword;
