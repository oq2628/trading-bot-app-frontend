import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#3b82f6',
    },
    background: {
      default: '#06070a',
      paper: 'rgba(20, 22, 33, 0.45)',
    },
    text: {
      primary: '#f3f4f6',
      secondary: '#9ca3af',
    },
    success: {
      main: '#10b981',
    },
    warning: {
      main: '#f59e0b',
    },
    error: {
      main: '#ef4444',
    },
  },
  typography: {
    fontFamily: '"Outfit", sans-serif',
    h1: {
      fontWeight: 800,
      color: '#fff',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      color: '#fff',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 700,
      color: '#fff',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontWeight: 700,
      color: '#fff',
    },
    h5: {
      fontWeight: 700,
      color: '#fff',
    },
    h6: {
      fontWeight: 700,
      color: '#fff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#06070a',
          backgroundImage: `
            radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(168, 85, 247, 0.1) 0px, transparent 50%),
            radial-gradient(circle, rgba(99, 102, 241, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 100% 100%, 24px 24px',
          color: '#f3f4f6',
          minHeight: '100vh',
          overflowX: 'hidden',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
          '::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '::-webkit-scrollbar-track': {
            background: '#06070a',
          },
          '::-webkit-scrollbar-thumb': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(99, 102, 241, 0.4)',
          },
        },
        '*': {
          boxSizing: 'border-box',
        },
        'input, select, textarea': {
          fontFamily: 'inherit',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontFamily: '"Outfit", sans-serif',
        },
      },
    },
  },
});

// Custom component style helper objects using `sx` properties
export const glassPanelSx = {
  background: 'rgba(20, 22, 33, 0.45)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(99, 102, 241, 0.15)',
  },
  '@media (max-width: 600px)': {
    borderRadius: '14px',
    '&:hover': {
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    }
  }
};

export const pageContainerSx = {
  maxWidth: '1600px !important',
  paddingBottom: { xs: '2.5rem', md: '4rem' },
  paddingLeft: { xs: '1rem', sm: '1.5rem', md: '2rem' },
  paddingRight: { xs: '1rem', sm: '1.5rem', md: '2rem' },
  animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  '@keyframes fadeIn': {
    from: { opacity: 0, transform: 'translateY(10px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
};

export const authContainerSx = {
  ...pageContainerSx,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: { xs: 'calc(100vh - 120px)', md: 'calc(100vh - 160px)' },
  paddingTop: { xs: '1rem', sm: '2rem' },
  paddingBottom: { xs: '2rem', sm: '2rem' },
};

export const pageTitleSx = {
  fontSize: { xs: '1.8rem', sm: '2.1rem', md: '2.5rem' },
  fontWeight: 800,
  lineHeight: 1.12,
};

// Panels keep a tighter inner gutter on phones so their content is not squeezed
// into ~260px once the page container padding is taken into account.
export const panelPaddingSx = { xs: '1.25rem', sm: '2rem' };

// MUI defaults a Dialog paper to 32px of margin on every side, which leaves a
// 360px screen with under 300px of usable width. Halve it on phones.
export const dialogPaperSx = {
  padding: panelPaddingSx,
  margin: { xs: '16px', sm: '32px' },
  width: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
  maxHeight: { xs: 'calc(100% - 32px)', sm: 'calc(100% - 64px)' },
};

// Long unbroken values (UUIDs, transfer references, API keys) must be allowed to
// wrap, otherwise they push their container wider than the viewport.
export const breakLongValueSx = { wordBreak: 'break-word' as const, overflowWrap: 'anywhere' as const };

// A label/value row that stays readable when the value is long: the value wraps
// and aligns right instead of overflowing the row.
export const labelValueRowSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: '0.75rem',
  minWidth: 0,
};

// The admin panel's form field styling. Defined here rather than inside
// Admin.tsx so the settings panels split out of that file share one definition
// instead of each carrying a copy that drifts.
export const adminInputSx = {
  width: '100%',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '8px',
  padding: '0.65rem 0.85rem',
  color: '#fff',
  fontSize: '0.9rem',
  fontFamily: '"Outfit", sans-serif',
  '& input': { padding: 0, '&::placeholder': { color: '#6b7280', opacity: 1 } },
};

export const glassCardSx = {
  background: 'rgba(20, 22, 33, 0.3)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.04)',
  borderRadius: '16px',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    transform: 'translateY(-6px)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
    boxShadow: '0 12px 30px 0 rgba(99, 102, 241, 0.12)',
  }
};

export const btnPrimarySx = {
  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '0.75rem 1.5rem',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  textTransform: 'none',
  fontFamily: '"Outfit", sans-serif',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  minWidth: 'auto',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.15)',
    opacity: 0,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  '&:hover': {
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    boxShadow: '0 0 20px 2px rgba(168, 85, 247, 0.4)',
    transform: 'translateY(-2px)',
    '&::before': {
      opacity: 1,
    }
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    opacity: 0.6,
    color: 'rgba(255,255,255,0.5)',
    cursor: 'not-allowed'
  }
};

export const btnSecondarySx = {
  background: 'rgba(255, 255, 255, 0.05)',
  color: '#f3f4f6',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '10px',
  padding: '0.75rem 1.5rem',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  textTransform: 'none',
  fontFamily: '"Outfit", sans-serif',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed'
  }
};

export const btnOutlineGradientSx = {
  background: 'transparent',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  padding: '0.75rem 1.5rem',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  position: 'relative',
  textTransform: 'none',
  fontFamily: '"Outfit", sans-serif',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  zIndex: 1,
  boxSizing: 'border-box',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -1, bottom: -1, left: -1, right: -1,
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
    borderRadius: '10px',
    zIndex: -2,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    background: '#06070a',
    borderRadius: '9px',
    zIndex: -1,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    '&::before': {
      opacity: 0.85,
    }
  }
};
