import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, LogOut, FolderLock, LayoutDashboard, LogIn, Settings, Menu, X } from 'lucide-react';


export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const updateNavbarBottom = () => {
      if (!navRef.current) return;
      const { bottom } = navRef.current.getBoundingClientRect();
      document.documentElement.style.setProperty('--navbar-bottom', `${Math.max(0, bottom)}px`);
    };

    updateNavbarBottom();

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateNavbarBottom) : null;
    if (resizeObserver && navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    window.addEventListener('resize', updateNavbarBottom);
    window.addEventListener('scroll', updateNavbarBottom, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateNavbarBottom);
      window.removeEventListener('scroll', updateNavbarBottom);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav ref={navRef} className="glass-panel" style={{
      position: 'sticky',
      top: '1rem',
      zIndex: 100,
      margin: '1rem auto 2.5rem',
      padding: '0.85rem 2rem',
      maxWidth: '1600px',
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

      <div className="nav-links-desktop">
        <Link to="/" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="nav-link">
          Storefront
        </Link>
        <Link to="/support" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="nav-link">
          Support
        </Link>
        <Link to="/about" style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }} className="nav-link">
          About Us
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <div 
            ref={dropdownRef}
            style={{ position: 'relative' }}
          >
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(255,255,255,0.04)',
                padding: '0.45rem 1.1rem',
                borderRadius: '24px',
                border: '1px solid var(--panel-border)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                height: '38px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'var(--transition-smooth)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
              }}
              onMouseEnter={(e) => { 
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; 
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => { 
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; 
                e.currentTarget.style.borderColor = 'var(--panel-border)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span>
                {user.full_name ? user.full_name.trim().split(' ')[0] : 'My Account'} (${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </span>
              <span style={{ 
                fontSize: '0.55rem', 
                marginLeft: '0.15rem', 
                transition: 'transform 0.2s', 
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                display: 'inline-block'
              }}>▼</span>
            </button>

            {showDropdown && (
              <div 
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 0.6rem)',
                  right: 0,
                  width: '280px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(15, 17, 23, 0.92)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(25px)',
                  WebkitBackdropFilter: 'blur(25px)',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 200,
                  overflow: 'hidden'
                }}
              >
                {/* User Header Section */}
                <div style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)'
                }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-glow), #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
                    flexShrink: 0
                  }}>
                    {user.full_name ? user.full_name.trim().charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.full_name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </span>
                  </div>
                </div>

                {/* Wallet Balance Section */}
                <div style={{
                  padding: '0 1rem 1rem 1rem'
                }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)'
                  }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Wallet Balance
                    </span>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <Link 
                        to="/profile" 
                        onClick={() => setShowDropdown(false)}
                        style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: '#818cf8', 
                          textDecoration: 'none',
                          transition: 'color 0.2s' 
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#a5b4fc'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#818cf8'; }}
                      >
                        Top Up
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }}></div>

                {/* Menu Options */}
                <div style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <Link 
                    to="/profile" 
                    onClick={() => setShowDropdown(false)}
                    style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.65rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      transition: 'var(--transition-smooth)',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Settings size={15} />
                    Profile Settings
                  </Link>

                  <Link 
                    to="/dashboard" 
                    onClick={() => setShowDropdown(false)}
                    style={{ 
                      fontSize: '0.85rem', 
                      fontWeight: 500, 
                      color: 'var(--text-secondary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.65rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      transition: 'var(--transition-smooth)',
                      textDecoration: 'none'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                  >
                    <LayoutDashboard size={15} />
                    My orders
                  </Link>

                  {user.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      onClick={() => setShowDropdown(false)}
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 500, 
                        color: 'var(--text-secondary)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.65rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        transition: 'var(--transition-smooth)',
                        textDecoration: 'none'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <FolderLock size={15} />
                      Admin Panel
                    </Link>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }}></div>

                {/* Logout Button */}
                <div style={{ padding: '0.75rem 0.5rem' }}>
                  <button
                    onClick={() => { setShowDropdown(false); handleLogout(); }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.15)',
                      borderRadius: '8px',
                      color: '#f87171',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      padding: '0.6rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      fontFamily: 'inherit',
                      transition: 'var(--transition-smooth)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.15)'; }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem', height: '36px' }}>
            <LogIn size={14} />
            Sign In
          </Link>
        )}
        <button 
          className="nav-menu-mobile-btn" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{ marginLeft: '0.5rem' }}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile navigation links */}
      <div className={`nav-links-mobile ${isMobileMenuOpen ? 'open' : ''}`}>
        <Link 
          to="/" 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
          className="nav-link"
        >
          Storefront
        </Link>
        <Link 
          to="/support" 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
          className="nav-link"
        >
          Support
        </Link>
        <Link 
          to="/about" 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', padding: '0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
          className="nav-link"
        >
          About Us
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;
