import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { Toast } from '../components/Toast';
import { Box, Container, Typography, Button, InputBase } from '@mui/material';
import { glassPanelSx, btnPrimarySx, btnSecondarySx, authContainerSx } from '../theme';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setToast({ message: 'Vui lòng nhập địa chỉ email.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/api/auth/forgot-password', { email: email.trim() });
      setToast({ message: res.message, type: 'success' });
      setSubmitted(true);
    } catch (err) {
      const error = err as { message?: string };
      setToast({ message: error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.', type: 'error' });
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
      sx={authContainerSx}
    >
      <Box
        sx={{
          ...glassPanelSx,
          maxWidth: '460px',
          width: '100%',
          padding: { xs: '1.5rem', sm: '2.5rem' },
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
          Quay lại Đăng nhập
        </Box>

        <Typography variant="h2" sx={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
          Quên mật khẩu
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Nhập email của bạn bên dưới để nhận liên kết khôi phục mật khẩu.
        </Typography>

        {/* Tab content */}
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
                  Kiểm tra email của bạn
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                  Nếu địa chỉ email tồn tại trên hệ thống, chúng tôi đã gửi liên kết khôi phục mật khẩu. Vui lòng kiểm tra hộp thư đến và thư mục thư rác (spam).
                </Typography>
                <Button
                  onClick={() => setSubmitted(false)}
                  sx={{
                    ...btnSecondarySx,
                    width: '100%',
                    justifyContent: 'center',
                  }}
                >
                  Gửi lại Email
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
                    Địa chỉ Email
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
                      placeholder="Ví dụ: buyer@algo.com"
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
                    'Đang gửi liên kết...'
                  ) : (
                    <>
                      <Send size={15} />
                      Gửi liên kết khôi phục
                    </>
                  )}
                </Button>
              </Box>
            )}
          </Box>
      </Box>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Container>
  );
};

export default ForgotPassword;
