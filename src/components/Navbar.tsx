import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, LogOut, FolderLock, LayoutDashboard, LogIn, Settings, Menu, X, Coins } from 'lucide-react';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { glassPanelSx, btnPrimarySx } from '../theme';

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
    <Box
      component="nav"
      ref={navRef}
      sx={{
        ...glassPanelSx,
        position: 'sticky',
        top: '1rem',
        zIndex: 100,
        margin: '1rem auto 2.5rem',
        padding: '0.85rem 2rem',
        maxWidth: '1600px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: 'calc(100% - 2rem)',
        boxSizing: 'border-box'
      }}
    >
      <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <Box sx={{
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)'
        }}>
          <TrendingUp size={22} color="#fff" />
        </Box>
        <Typography
          component="span"
          sx={{
            fontSize: '1.25rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, #fff, #9ca3af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontFamily: '"Outfit", sans-serif',
          }}
        >
          AlgoForge
        </Typography>
      </Box>

      {/* Desktop navigation links */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: '1.5rem' }}>
        <Box
          component={Link}
          to="/"
          sx={{
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none',
            transition: 'color 0.2s',
            '&:hover': { color: '#fff' }
          }}
        >
          Storefront
        </Box>
        <Box
          component={Link}
          to="/support"
          sx={{
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none',
            transition: 'color 0.2s',
            '&:hover': { color: '#fff' }
          }}
        >
          Support
        </Box>
        <Box
          component={Link}
          to="/about"
          sx={{
            fontSize: '0.95rem',
            fontWeight: 500,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            textDecoration: 'none',
            transition: 'color 0.2s',
            '&:hover': { color: '#fff' }
          }}
        >
          About Us
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user ? (
          <Box
            ref={dropdownRef}
            sx={{ position: 'relative' }}
          >
            <Button
              onClick={() => setShowDropdown(!showDropdown)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: 'rgba(255,255,255,0.04)',
                padding: '0.45rem 1.1rem',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'text.primary',
                height: '38px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                textTransform: 'none',
                '&:hover': {
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)',
                }
              }}
            >
              <Box sx={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', textTransform: 'none' }}>
                {user.full_name ? user.full_name.trim().split(' ')[0] : 'My Account'} (${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </Typography>
              <Box component="span" sx={{
                fontSize: '0.55rem',
                marginLeft: '0.15rem',
                transition: 'transform 0.2s',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                display: 'inline-block'
              }}>▼</Box>
            </Button>

            {showDropdown && (
              <Box
                sx={{
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
                <Box sx={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0.03), transparent)'
                }}>
                  <Box sx={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
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
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Typography component="span" sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.full_name}
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </Typography>
                  </Box>
                </Box>

                {/* Wallet Balance Section */}
                <Box sx={{ padding: '0 1rem 1rem 1rem' }}>
                  <Box sx={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)'
                  }}>
                    <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Wallet Balance
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Typography>
                      <Box
                        component={Link}
                        to="/top-ups"
                        onClick={() => setShowDropdown(false)}
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#818cf8',
                          textDecoration: 'none',
                          transition: 'color 0.2s',
                          '&:hover': { color: '#a5b4fc' }
                        }}
                      >
                        Top Up
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Divider */}
                <Box sx={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                {/* Menu Options */}
                <Box sx={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                  <Box
                    component={Link}
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                      '&:hover': {
                        color: '#fff',
                        background: 'rgba(255,255,255,0.04)',
                      }
                    }}
                  >
                    <Settings size={15} />
                    Profile Settings
                  </Box>

                  <Box
                    component={Link}
                    to="/dashboard"
                    onClick={() => setShowDropdown(false)}
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                      '&:hover': {
                        color: '#fff',
                        background: 'rgba(255,255,255,0.04)',
                      }
                    }}
                  >
                    <LayoutDashboard size={15} />
                    My orders
                  </Box>

                  <Box
                    component={Link}
                    to="/top-ups"
                    onClick={() => setShowDropdown(false)}
                    sx={{
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      color: 'text.secondary',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      transition: 'all 0.2s',
                      textDecoration: 'none',
                      '&:hover': {
                        color: '#fff',
                        background: 'rgba(255,255,255,0.04)',
                      }
                    }}
                  >
                    <Coins size={15} />
                    My TopUps
                  </Box>

                  {user.role === 'admin' && (
                    <Box
                      component={Link}
                      to="/admin"
                      onClick={() => setShowDropdown(false)}
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        color: 'text.secondary',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        transition: 'all 0.2s',
                        textDecoration: 'none',
                        '&:hover': {
                          color: '#fff',
                          background: 'rgba(255,255,255,0.04)',
                        }
                      }}
                    >
                      <FolderLock size={15} />
                      Admin Panel
                    </Box>
                  )}
                </Box>

                {/* Divider */}
                <Box sx={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

                {/* Logout Button */}
                <Box sx={{ padding: '0.75rem 0.5rem' }}>
                  <Button
                    onClick={() => { setShowDropdown(false); handleLogout(); }}
                    sx={{
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
                      transition: 'all 0.2s',
                      textTransform: 'none',
                      '&:hover': {
                        background: 'rgba(239, 68, 68, 0.15)',
                        borderColor: 'rgba(239, 68, 68, 0.25)',
                      }
                    }}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Button
            component={Link}
            to="/login"
            sx={{
              ...btnPrimarySx,
              padding: '0.5rem 1.25rem',
              fontSize: '0.85rem',
              height: '36px'
            }}
          >
            <LogIn size={14} />
            Sign In
          </Button>
        )}
        <IconButton
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          sx={{
            display: { xs: 'flex', md: 'none' },
            background: 'none',
            border: 'none',
            color: 'text.primary',
            cursor: 'pointer',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.5rem',
            marginLeft: '0.5rem'
          }}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </IconButton>
      </Box>

      {/* Mobile navigation links */}
      <Box
        sx={{
          display: isMobileMenuOpen ? 'flex' : 'none',
          flexDirection: 'column',
          gap: '1rem',
          padding: '1.5rem',
          background: 'rgba(15, 17, 23, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          position: 'absolute',
          top: 'calc(100% + 0.5rem)',
          left: 0,
          right: 0,
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          zIndex: 99
        }}
      >
        <Box
          component={Link}
          to="/"
          onClick={() => setIsMobileMenuOpen(false)}
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'text.secondary',
            padding: '0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            '&:hover': { color: '#fff' }
          }}
        >
          Storefront
        </Box>
        <Box
          component={Link}
          to="/support"
          onClick={() => setIsMobileMenuOpen(false)}
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'text.secondary',
            padding: '0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            '&:hover': { color: '#fff' }
          }}
        >
          Support
        </Box>
        <Box
          component={Link}
          to="/about"
          onClick={() => setIsMobileMenuOpen(false)}
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            color: 'text.secondary',
            padding: '0.5rem 0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
            '&:hover': { color: '#fff' }
          }}
        >
          About Us
        </Box>
      </Box>
    </Box>
  );
};

export default Navbar;
