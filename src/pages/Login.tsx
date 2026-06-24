import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LogIn, UserPlus, Mail, Key, User, Phone, Shield } from 'lucide-react';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterResponse {
  id: string;
  email: string;
}

export const Login: React.FC = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  // Mode can be: 'email' (Email Sign In), 'phone' (Phone Sign In), 'register' (Email Register)
  const [mode, setMode] = useState<'email' | 'phone' | 'register'>('email');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // OTP Phone
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: 'var(--primary-solid)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!phoneNumber.trim()) {
      setError('Phone number is required.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/otp/request', { phone_number: phoneNumber.trim() });
      setOtpRequested(true);
      setSuccess('Verification code generated. Retrieve OTP from backend console logs.');
    } catch (err: any) {
      setError(err.message || 'Failed to request OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<LoginResponse>('/api/auth/otp/verify', {
        phone_number: phoneNumber.trim(),
        code: otpCode.trim()
      });
      await login(data.access_token);
    } catch (err: any) {
      setError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'email') {
        const data = await api.post<LoginResponse>('/api/auth/login-json', {
          email,
          password
        });
        await login(data.access_token);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        
        await api.post<RegisterResponse>('/api/auth/register', {
          email,
          password,
          full_name: fullName
        });
        
        setSuccess('Registration successful! Please sign in below.');
        setMode('email');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication process encountered an error.');
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
        
        {/* Toggle tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--panel-border)',
          marginBottom: '2rem',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => { setMode('email'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: mode === 'email' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              cursor: 'pointer',
              borderBottom: mode === 'email' ? '2px solid var(--primary-solid)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Email Sign In
          </button>
          <button
            onClick={() => { setMode('phone'); setError(''); setSuccess(''); setOtpRequested(false); setOtpCode(''); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: mode === 'phone' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              cursor: 'pointer',
              borderBottom: mode === 'phone' ? '2px solid var(--primary-solid)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Phone OTP
          </button>
          <button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: mode === 'register' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              cursor: 'pointer',
              borderBottom: mode === 'register' ? '2px solid var(--primary-solid)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Register
          </button>
        </div>

        {/* Messaging Panels */}
        {error && (
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
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            padding: '0.75rem 1rem',
            color: 'var(--success-color)',
            fontSize: '0.85rem',
            fontWeight: 500,
            marginBottom: '1.5rem'
          }}>
            {success}
          </div>
        )}

        {/* Auth form conditional on mode */}
        {mode === 'phone' ? (
          <div>
            {!otpRequested ? (
              <form onSubmit={handleRequestOTP}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="tel"
                      required
                      className="form-control"
                      placeholder="e.g. +1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
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
                  {loading ? 'Requesting...' : 'Request OTP Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP}>
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Verification code sent to: <strong style={{ color: '#fff' }}>{phoneNumber}</strong>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">6-Digit OTP Code</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      className="form-control"
                      placeholder="e.g. 123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ paddingLeft: '2.5rem', letterSpacing: '0.2em', fontSize: '1.1rem', fontWeight: 'bold' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <button
                    type="button"
                    onClick={() => { setOtpRequested(false); setOtpCode(''); setError(''); setSuccess(''); }}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem' }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 2, justifyContent: 'center', padding: '0.75rem', fontSize: '0.85rem' }}
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmitEmail}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
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

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                {mode === 'email' && (
                  <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--primary-solid)', textDecoration: 'none' }} className="nav-link">
                    Forgot Password?
                  </Link>
                )}
              </div>
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

            {mode === 'register' && (
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Confirm Password</label>
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
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', marginTop: '1rem' }}
            >
              {loading ? (
                'Processing...'
              ) : mode === 'email' ? (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Account
                </>
              )}
            </button>
          </form>
        )}
        
        {/* Bootstrap Hint */}
        {mode === 'email' && (
          <div style={{
            marginTop: '2rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--panel-border)',
            borderRadius: '8px',
            padding: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.4'
          }}>
            <strong style={{ color: 'var(--primary-solid)', display: 'block', marginBottom: '0.25rem' }}>Bootstrap Test Accounts:</strong>
            • Admin: <code style={{ color: '#fff' }}>admin@tradingbot.com</code> / pass: <code style={{ color: '#fff' }}>admin123</code><br/>
            • Buyer: <code style={{ color: '#fff' }}>buyer@tradingbot.com</code> / pass: <code style={{ color: '#fff' }}>buyer123</code>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
