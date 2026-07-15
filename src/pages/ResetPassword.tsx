import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { Key, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Toast } from '../components/Toast';
import { Box, Container, Typography, Button, InputBase } from '@mui/material';
import { glassPanelSx, btnPrimarySx, authContainerSx } from '../theme';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setToast({ message: 'Thiếu mã khôi phục mật khẩu. Vui lòng yêu cầu liên kết mới.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setToast({ message: 'Mật khẩu phải dài ít nhất 6 ký tự.', type: 'error' });
      return;
    }

    if (password !== confirmPassword) {
      setToast({ message: 'Mật khẩu xác nhận không khớp.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/api/auth/reset-password', {
        token: token.trim(),
        new_password: password
      });
      setToast({ message: res.message, type: 'success' });
      setSuccess(true);
      // Wait a moment and navigate to login
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const error = err as { message?: string };
      setToast({ message: error.message || 'Khôi phục mật khẩu thất bại.', type: 'error' });
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
          border: '1px solid rgba(99, 102, 241, 0.2)'
        }}
      >
        {success ? (
          <Box sx={{ textAlign: 'center', padding: '1.5rem 0' }}>
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
                margin: '0 auto 1.25rem'
              }}
            >
              <CheckCircle2 size={22} color="#10b981" />
            </Box>
            <Typography variant="h3" sx={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem' }}>
              Hoàn tất Khôi phục Mật khẩu
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Mật khẩu của bạn đã được khôi phục thành công. Đang chuyển hướng bạn đến trang đăng nhập...
            </Typography>
            <Button
              component={Link}
              to="/login"
              sx={{
                ...btnPrimarySx,
                width: '100%',
                justifyContent: 'center'
              }}
            >
              Đăng nhập Ngay
            </Button>
          </Box>
        ) : (
          <Box>
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
              Đặt Mật khẩu mới
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', marginBottom: '2rem' }}>
              Chọn một mật khẩu mạnh và bảo mật cho tài khoản của bạn.
            </Typography>

            {!token && (
              <Box
                sx={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: 'error.main',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  marginBottom: '1.5rem'
                }}
              >
                Cảnh báo: Không tìm thấy mã khôi phục mật khẩu trong liên kết. Vui lòng yêu cầu một liên kết mới.
              </Box>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ marginBottom: '1.25rem' }}>
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
                  Mật khẩu mới
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Key size={16} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <InputBase
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                      ...inputSx,
                      paddingLeft: '2.5rem',
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ marginBottom: '2rem' }}>
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
                  Xác nhận mật khẩu mới
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Key size={16} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <InputBase
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    sx={{
                      ...inputSx,
                      paddingLeft: '2.5rem',
                    }}
                  />
                </Box>
              </Box>

              <Button
                type="submit"
                disabled={loading || !token}
                sx={{
                  ...btnPrimarySx,
                  width: '100%',
                  justifyContent: 'center',
                  padding: '1rem'
                }}
              >
                {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Container>
  );
};

export default ResetPassword;
