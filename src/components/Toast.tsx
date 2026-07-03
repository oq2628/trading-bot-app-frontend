import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  return (
    <Snackbar
      open={true}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{
        top: { xs: '5.5rem !important', md: '7.5rem !important' },
        right: { xs: '1rem', md: '2rem' },
        left: 'auto',
        transform: 'none',
        maxWidth: '400px',
        width: 'calc(100% - 2rem)',
        zIndex: 2000,
      }}
    >
      <Alert
        onClose={onClose}
        severity={type}
        sx={{
          width: '100%',
          fontFamily: '"Outfit", sans-serif',
          fontWeight: 500,
          background: 'rgba(20, 22, 33, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor:
            type === 'success'
              ? 'success.main'
              : type === 'error'
              ? 'error.main'
              : 'primary.main',
          color: '#fff',
          boxShadow:
            type === 'success'
              ? '0 8px 30px rgba(16, 185, 129, 0.15)'
              : type === 'error'
              ? '0 8px 30px rgba(239, 68, 68, 0.15)'
              : '0 8px 30px rgba(99, 102, 241, 0.15)',
          borderRadius: '12px',
          animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          '.MuiAlert-icon': {
            color:
              type === 'success'
                ? 'success.main'
                : type === 'error'
                ? 'error.main'
                : 'primary.main',
          },
          '.MuiAlert-message': {
            fontSize: '0.9rem',
          },
          '.MuiAlert-action': {
            color: 'text.secondary',
            '& button': {
              color: 'inherit',
              '&:hover': {
                color: '#fff',
              }
            }
          }
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
