import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Coins,
  FolderLock,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  X,
} from 'lucide-react';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { btnPrimarySx, glassPanelSx } from '../theme';

const navItems = [
  { label: 'Trang chủ', path: '/' },
  { label: 'Sản phẩm', path: '/products' },
  { label: 'Hỗ trợ', path: '/support' },
  { label: 'Về chúng tôi', path: '/about' },
];

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const updateNavbarBottom = () => {
      if (!navRef.current) return;
      const { bottom } = navRef.current.getBoundingClientRect();
      document.documentElement.style.setProperty('--navbar-bottom', `${Math.max(0, bottom)}px`);
    };
    updateNavbarBottom();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateNavbarBottom) : null;
    if (observer && navRef.current) observer.observe(navRef.current);
    window.addEventListener('resize', updateNavbarBottom);
    window.addEventListener('scroll', updateNavbarBottom, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateNavbarBottom);
      window.removeEventListener('scroll', updateNavbarBottom);
    };
  }, []);

  const isActive = (path: string) => path === '/'
    ? pathname === '/'
    : pathname === path || pathname.startsWith(`${path}/`);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.full_name?.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'US';

  const navLinkSx = (active: boolean, mobile = false) => ({
    color: active ? '#fff' : 'text.secondary',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: active ? 750 : 550,
    px: 1.2,
    py: 0.8,
    borderRadius: '9px',
    position: 'relative',
    background: active ? 'rgba(99,102,241,.12)' : 'transparent',
    transition: 'color .2s ease, background .2s ease',
    ...(active && !mobile ? {
      '&::after': {
        content: '""',
        position: 'absolute',
        left: '24%',
        right: '24%',
        bottom: 3,
        height: 2,
        borderRadius: 2,
        background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
      },
    } : {}),
    '&:hover': { color: '#fff', background: 'rgba(255,255,255,.04)' },
  });

  return (
    <Box
      component="nav"
      ref={navRef}
      aria-label="Điều hướng chính"
      sx={{
        ...glassPanelSx,
        position: 'sticky',
        top: { xs: 8, md: 16 },
        zIndex: 100,
        width: { xs: 'calc(100% - 16px)', md: 'calc(100% - 32px)' },
        maxWidth: 1536,
        mx: 'auto',
        mb: { xs: 3, md: 4 },
        px: { xs: 1.1, sm: 1.5, md: 2.2 },
        py: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(8,10,18,.78)',
        borderColor: 'rgba(255,255,255,.08)',
      }}
    >
      <Box component={Link} to="/" onClick={() => setIsMobileMenuOpen(false)} aria-label="AlgoForge - Trang chủ" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#fff', textDecoration: 'none', minWidth: 0 }}>
        <Box sx={{ width: { xs: 34, sm: 40 }, height: { xs: 34, sm: 40 }, borderRadius: '11px', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)', boxShadow: '0 8px 24px rgba(79,70,229,.28)', flexShrink: 0 }}>
          <TrendingUp size={21} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ color: '#fff', fontSize: { xs: '1rem', sm: '1.18rem' }, fontWeight: 850, lineHeight: 1.05, letterSpacing: '-.02em' }}>AlgoForge</Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' }, color: '#818cf8', fontSize: '0.58rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mt: 0.35 }}>Partnered with GTC</Typography>
        </Box>
      </Box>

      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.35 }}>
        {navItems.map(item => (
          <Box key={item.path} component={Link} to={item.path} onClick={() => setShowDropdown(false)} aria-current={isActive(item.path) ? 'page' : undefined} sx={navLinkSx(isActive(item.path))}>
            {item.label}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 1 }, flexShrink: 0 }}>
        {user ? (
          <Box ref={dropdownRef} sx={{ position: 'relative' }}>
            <Button
              onClick={() => setShowDropdown(value => !value)}
              aria-haspopup="menu"
              aria-expanded={showDropdown}
              sx={{ minWidth: 0, height: 38, px: { xs: 0.4, sm: 0.8 }, borderRadius: '999px', color: '#fff', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', '&:hover': { background: 'rgba(255,255,255,.08)' } }}
            >
              <Box sx={{ width: 30, height: 30, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: '0.7rem', fontWeight: 850, background: 'linear-gradient(135deg, #4f46e5, #ec4899)' }}>{initials}</Box>
              <Typography sx={{ display: { xs: 'none', sm: 'block' }, ml: 0.8, mr: 0.4, color: '#fff', fontSize: '0.8rem', fontWeight: 650 }}>
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Button>

            {showDropdown && (
              <Box role="menu" sx={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 286, overflow: 'hidden', borderRadius: '16px', border: '1px solid rgba(255,255,255,.09)', background: 'rgba(9,11,19,.96)', boxShadow: '0 24px 70px rgba(0,0,0,.6)', backdropFilter: 'blur(24px)' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.full_name}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.73rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</Typography>
                </Box>
                <Box sx={{ p: 0.7 }}>
                  {[
                    { label: 'Cài đặt cá nhân', path: '/profile', icon: <Settings size={15} /> },
                    { label: 'Đơn hàng của tôi', path: '/dashboard', icon: <LayoutDashboard size={15} /> },
                    { label: 'Lịch sử nạp tiền', path: '/top-ups', icon: <Coins size={15} /> },
                  ].map(item => (
                    <Box key={item.path} role="menuitem" component={Link} to={item.path} onClick={() => setShowDropdown(false)} sx={{ px: 1.2, py: 0.9, borderRadius: '9px', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', fontSize: '0.82rem', '&:hover': { color: '#fff', background: 'rgba(255,255,255,.05)' } }}>
                      {item.icon}{item.label}
                    </Box>
                  ))}
                  {user.role === 'admin' && (
                    <Box role="menuitem" component={Link} to="/admin" onClick={() => setShowDropdown(false)} sx={{ px: 1.2, py: 0.9, borderRadius: '9px', color: '#c7d2fe', display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none', fontSize: '0.82rem', '&:hover': { color: '#fff', background: 'rgba(99,102,241,.1)' } }}>
                      <FolderLock size={15} /> Trang quản trị
                    </Box>
                  )}
                </Box>
                <Box sx={{ p: 0.7, borderTop: '1px solid rgba(255,255,255,.06)' }}>
                  <Button role="menuitem" onClick={handleLogout} sx={{ width: '100%', color: '#f87171', background: 'rgba(239,68,68,.06)', fontSize: '0.82rem', '&:hover': { background: 'rgba(239,68,68,.12)' } }}>
                    <LogOut size={15} /> Đăng xuất
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Button component={Link} to="/login" sx={{ ...btnPrimarySx, height: 38, px: { xs: 1.1, sm: 1.5 }, py: 0.6, fontSize: '0.82rem' }}>
            <LogIn size={14} /><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Đăng nhập</Box>
          </Button>
        )}

        <IconButton
          onClick={() => setIsMobileMenuOpen(value => !value)}
          aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          sx={{ display: { xs: 'flex', md: 'none' }, color: '#fff' }}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </IconButton>
      </Box>

      {isMobileMenuOpen && (
        <Box id="mobile-navigation" sx={{ position: 'absolute', top: 'calc(100% + 9px)', left: 0, right: 0, p: 1, borderRadius: '14px', background: 'rgba(9,11,19,.97)', border: '1px solid rgba(255,255,255,.09)', boxShadow: '0 20px 50px rgba(0,0,0,.55)', display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 0.25 }}>
          {navItems.map(item => (
            <Box key={item.path} component={Link} to={item.path} onClick={() => setIsMobileMenuOpen(false)} aria-current={isActive(item.path) ? 'page' : undefined} sx={{ ...navLinkSx(isActive(item.path), true), px: 1.5, py: 1.1 }}>
              {item.label}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Navbar;
