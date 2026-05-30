import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, LogOut, User, FolderLock, LayoutDashboard, LogIn } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-panel" style={{
      position: 'sticky',
      top: '1rem',
      zIndex: 100,
      margin: '1rem auto 2.5rem',
      padding: '0.85rem 2rem',
      maxWidth: '1200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: 'calc(100% - 2rem)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          background: 'var(--primary-glow)',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
        }}>
          <TrendingUp size={22} color="#fff" />
        </div>
        <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AlgoForge
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link to="/" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="nav-link">
          Storefront
        </Link>

        {user && (
          <Link to="/dashboard" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="nav-link">
            <LayoutDashboard size={16} />
            Dashboard
          </Link>
        )}

        {user && user.role === 'admin' && (
          <Link to="/admin" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="nav-link">
            <FolderLock size={16} />
            Admin Panel
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.4rem 0.8rem', borderRadius: '20px', border: '1px solid var(--panel-border)' }}>
              <User size={14} color="var(--primary-solid)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.full_name}
              </span>
              {user.role === 'admin' && (
                <span style={{ fontSize: '0.65rem', background: 'var(--primary-glow)', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 800 }}>
                  Admin
                </span>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="btn-secondary" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', height: '36px' }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', height: '36px' }}>
            <LogIn size={14} />
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};
