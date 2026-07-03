import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, Phone, ArrowLeft, Send } from 'lucide-react';
import { Toast } from '../components/Toast';
import { Box, Container, Typography, Button, InputBase } from '@mui/material';
import { glassPanelSx, btnPrimarySx, btnSecondarySx } from '../theme';

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

  const inputSx = {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#fff',
    fontSize: '0.95rem',
    fontFamily: '"Outfit", sans-serif',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.Mui-focused': {
      borderColor: '#6366f1',
      boxShadow: '0 0 10px 0 rgba(99, 102, 241, 0.2)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    '& input': {
      padding: 0,
      '&::placeholder': {
        color: '#6b7280',
        opacity: 1,
      }
    }
  };

  return (
    <Container
      maxWidth="xl"
      sx={{
        maxWidth: '1600px !important',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 160px)',
        padding: '2rem 1rem',
        animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box
        sx={{
          ...glassPanelSx,
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}
      >
        <Box
          component={Link}
          to="/login"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'text.secondary',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '1.5rem',
            textDecoration: 'none',
            transition: 'color 0.2s',
            '&:hover': { color: '#fff' }
          }}
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Box>

        <Typography variant="h2" sx={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
          Forgot Password
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Select how you want to recover your password credentials.
        </Typography>

        {/* Tabs switcher */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '2rem',
            gap: '0.5rem',
          }}
        >
          <Button
            onClick={() => { setActiveTab('email'); setSubmitted(false); }}
            sx={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: activeTab === 'email' ? '#fff' : 'text.secondary',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              borderRadius: 0,
              minWidth: 'auto',
              borderBottom: activeTab === 'email' ? '2px solid #6366f1' : 'none',
              '&:hover': { background: 'none', color: '#fff' }
            }}
          >
            Email Link
          </Button>
          <Button
            onClick={() => setActiveTab('phone')}
            sx={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: activeTab === 'phone' ? '#fff' : 'text.secondary',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              borderRadius: 0,
              minWidth: 'auto',
              borderBottom: activeTab === 'phone' ? '2px solid #6366f1' : 'none',
              '&:hover': { background: 'none', color: '#fff' }
            }}
          >
            Phone OTP
          </Button>
        </Box>

        {/* Tab content */}
        {activeTab === 'email' ? (
          <Box>
            {submitted ? (
              <Box sx={{ textAlign: 'center', padding: '1rem 0' }}>
                <Box
                  sx={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  <Mail size={22} color="#10b981" />
                </Box>
                <Typography variant="h3" sx={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Check your email
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  If the email address exists in our system, we have sent a secure password reset link to it. Please check your inbox and spam folders.
                </Typography>
                <Button
                  onClick={() => setSubmitted(false)}
                  sx={{
                    ...btnSecondarySx,
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  Resend Email
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleEmailSubmit}>
                <Box sx={{ marginBottom: '1.5rem' }}>
                  <Typography
                    component="label"
                    sx={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'text.secondary',
                      marginBottom: '0.5rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Email Address
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <Mail
                      size={16}
                      color="#6b7280"
                      style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
                    />
                    <InputBase
                      type="email"
                      required
                      placeholder="e.g. buyer@algo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{
                        ...inputSx,
                        paddingLeft: '2.5rem',
                      }}
                    />
                  </Box>
                </Box>

                <Button
                  type="submit"
                  disabled={loading}
                  sx={{
                    ...btnPrimarySx,
                    width: '100%',
                    justifyContent: 'center',
                    padding: '1rem',
                  }}
                >
                  {loading ? (
                    'Sending Link...'
                  ) : (
                    <>
                      <Send size={15} />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </Box>
            )}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <Box
              sx={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Phone size={22} color="#f59e0b" />
            </Box>
            <Typography variant="h3" sx={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Coming Soon
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 0 }}>
              Phone OTP reset is coming soon. Please use the Email reset link tab in the meantime to recover your credentials.
            </Typography>
          </Box>
        )}
      </Box>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Container>
  );
};

export default ForgotPassword;
