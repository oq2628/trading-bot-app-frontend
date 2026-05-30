import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { LogIn, UserPlus, Mail, Key, User } from 'lucide-react';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterResponse {
  id: string;
  email: string;
}

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        // Authenticate user via JSON login endpoint
        const data = await api.post<LoginResponse>('/api/auth/login-json', {
          email,
          password
        });
        
        await login(data.access_token);
        
        // Fetch current user details to redirect appropriately (handled inside auth context, but we can check if token is valid)
        // Let's decode or just query. Since me is loaded in login(), we check role.
        // Wait, since current user role could be admin, let's delay a fraction to let context bind and navigate.
        if (email.toLowerCase() === 'admin@tradingbot.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        // Registration Flow
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        
        await api.post<RegisterResponse>('/api/auth/register', {
          email,
          password,
          full_name: fullName
        });
        
        setSuccess('Registration successful! Please sign in below.');
        setIsLogin(true);
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
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem',
        border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        
        {/* Toggle tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--panel-border)',
          marginBottom: '2rem',
          paddingBottom: '0.5rem'
        }}>
          <button
            onClick={() => { setIsLogin(true); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: isLogin ? '#fff' : 'var(--text-muted)',
              fontSize: '1.1rem',
              fontWeight: 700,
              padding: '0.5rem 0',
              cursor: 'pointer',
              borderBottom: isLogin ? '2px solid var(--primary-solid)' : 'none',
              transition: 'var(--transition-smooth)'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); setSuccess(''); }}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: !isLogin ? '#fff' : 'var(--text-muted)',
              fontSize: '1.1rem',
              fontWeight: 700,
              padding: '0.5rem 0',
              cursor: 'pointer',
              borderBottom: !isLogin ? '2px solid var(--primary-solid)' : 'none',
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

        {/* Auth form */}
        <form onSubmit={handleSubmit}>
          {!isLogin && (
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
            <label className="form-label">Password</label>
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

          {!isLogin && (
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
            ) : isLogin ? (
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
        
        {/* Bootstrap Hint */}
        {isLogin && (
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
