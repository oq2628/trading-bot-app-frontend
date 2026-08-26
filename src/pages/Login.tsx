import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { errorMessage } from '../utils/errors';
import { LogIn, UserPlus, Mail, Key, User } from 'lucide-react';
import { Box, Container, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import { glassPanelSx, btnPrimarySx, authContainerSx } from '../theme';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

interface RegisterResponse {
  id: string;
  email: string;
}

export const Login: React.FC = () => {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, authLoading, navigate]);

  // Mode can be: 'email' (Email Sign In), 'register' (Email Register)
  const [mode, setMode] = useState<'email' | 'register'>('email');
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'email') {
        const data = await api.post<LoginResponse>('/api/auth/login-json', {
          email,
          password
        });
        await login(data.access_token);
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Mật khẩu xác nhận không khớp.');
        }
        
        await api.post<RegisterResponse>('/api/auth/register', {
          email,
          password,
          full_name: fullName
        });
        
        setSuccess('Đăng ký thành công! Vui lòng đăng nhập bên dưới.');
        setMode('email');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError(errorMessage(err, 'Quá trình xác thực xảy ra lỗi.'));
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

  const labelSx = {
    display: 'block',
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'text.secondary',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
        {/* Toggle tabs */}
        <Box
          sx={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            marginBottom: '2rem',
            gap: '0.5rem',
            overflowX: 'auto'
          }}
        >
          <Button
            onClick={() => { setMode('email'); setError(''); setSuccess(''); }}
            sx={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: mode === 'email' ? '#fff' : 'text.secondary',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              borderRadius: 0,
              minWidth: 'auto',
              borderBottom: mode === 'email' ? '2px solid #6366f1' : 'none',
              '&:hover': { background: 'none', color: '#fff' }
            }}
          >
            Đăng nhập
          </Button>
          <Button
            onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
            sx={{
              flex: 1,
              background: 'none',
              border: 'none',
              color: mode === 'register' ? '#fff' : 'text.secondary',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.75rem 0',
              borderRadius: 0,
              minWidth: 'auto',
              borderBottom: mode === 'register' ? '2px solid #6366f1' : 'none',
              '&:hover': { background: 'none', color: '#fff' }
            }}
          >
            Đăng ký
          </Button>
        </Box>

        {/* Messaging Panels */}
        {error && (
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
            {error}
          </Box>
        )}

        {success && (
          <Box
            sx={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              color: 'success.main',
              fontSize: '0.85rem',
              fontWeight: 500,
              marginBottom: '1.5rem'
            }}
          >
            {success}
          </Box>
        )}

        {/* Auth form conditional on mode */}
          <Box component="form" onSubmit={handleSubmitEmail}>
            {mode === 'register' && (
              <Box sx={{ marginBottom: '1rem' }}>
                <Typography component="label" sx={labelSx}>Họ và Tên</Typography>
                <Box sx={{ position: 'relative' }}>
                  <User size={16} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <InputBase
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    sx={{
                      ...inputSx,
                      paddingLeft: '2.5rem',
                    }}
                  />
                </Box>
              </Box>
            )}

            <Box sx={{ marginBottom: '1rem' }}>
              <Typography component="label" sx={labelSx}>Địa chỉ Email</Typography>
              <Box sx={{ position: 'relative' }}>
                <Mail size={16} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
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

            <Box sx={{ marginBottom: '1rem' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography component="label" sx={labelSx}>Mật khẩu</Typography>
                {mode === 'email' && (
                  <Box
                    component={Link}
                    to="/forgot-password"
                    sx={{
                      fontSize: '0.8rem',
                      color: 'primary.main',
                      textDecoration: 'none',
                      marginBottom: '0.5rem',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Quên mật khẩu?
                  </Box>
                )}
              </Box>
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

            {mode === 'register' && (
              <Box sx={{ marginBottom: '2rem' }}>
                <Typography component="label" sx={labelSx}>Xác nhận Mật khẩu</Typography>
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
            )}

            <Button
              type="submit"
              disabled={loading}
              sx={{
                ...btnPrimarySx,
                width: '100%',
                justifyContent: 'center',
                padding: '1rem',
                marginTop: '1.5rem'
              }}
            >
              {loading ? (
                'Đang xử lý...'
              ) : mode === 'email' ? (
                <>
                  <LogIn size={16} />
                  Đăng nhập
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Đăng ký tài khoản
                </>
              )}
            </Button>
          </Box>
        
        {/* Bootstrap Hint */}
        {mode === 'email' && (
          <Box
            sx={{
              marginTop: '2rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '8px',
              padding: '1rem',
              fontSize: '0.8rem',
              color: 'text.secondary',
              lineHeight: '1.4',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere'
            }}
          >
            <Typography component="strong" sx={{ color: 'primary.main', display: 'block', marginBottom: '0.25rem', fontSize: '0.8rem', fontWeight: 700 }}>
              Tài khoản thử nghiệm hệ thống:
            </Typography>
            • Admin: <Box component="code" sx={{ color: '#fff' }}>admin@tradingbot.com</Box> / pass: <Box component="code" sx={{ color: '#fff' }}>admin123</Box><br/>
            • Buyer: <Box component="code" sx={{ color: '#fff' }}>buyer@tradingbot.com</Box> / pass: <Box component="code" sx={{ color: '#fff' }}>buyer123</Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Login;
