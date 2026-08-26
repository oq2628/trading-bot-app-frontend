import React, { useState } from 'react';
import api from '../utils/api';
import { errorMessage } from '../utils/errors';
import { Toast } from '../components/Toast';
import { User, Wallet, Save, ArrowUpRight, Calendar, MapPin, Phone, X, RefreshCw } from 'lucide-react';
import { Box, Container, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, btnPrimarySx, btnSecondarySx, pageContainerSx, pageTitleSx, panelPaddingSx, breakLongValueSx, labelValueRowSx } from '../theme';

export const Profile: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [dob, setDob] = useState(user?.date_of_birth || '');
  const [address, setAddress] = useState(user?.address || '');
  
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [transacting, setTransacting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const [activeTopUp, setActiveTopUp] = useState<any>(null);
  const [polling, setPolling] = useState(false);
  const [activeInterval, setActiveInterval] = useState<any>(null);

  React.useEffect(() => {
    return () => {
      if (activeInterval) {
        clearInterval(activeInterval);
      }
    };
  }, [activeInterval]);

  const startPolling = (topUpId: string) => {
    if (activeInterval) clearInterval(activeInterval);
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const data = await api.get<any>(`/api/top-ups/${topUpId}`);
        setActiveTopUp(data);
        if (data.status === 'completed') {
          clearInterval(interval);
          setPolling(false);
          setToast({ message: `Nạp tiền thành công $${data.amount} USD!`, type: 'success' });
          await refreshUser();
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          setToast({ message: `Giao dịch nạp tiền thất bại: ${data.error_message || 'Lỗi không xác định'}`, type: 'error' });
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 5000);
    setActiveInterval(interval);
  };

  const handleCloseTopUp = () => {
    if (activeInterval) {
      clearInterval(activeInterval);
      setActiveInterval(null);
    }
    setActiveTopUp(null);
    setPolling(false);
  };

  const handleRefreshStatus = async () => {
    if (!activeTopUp) return;
    try {
      const data = await api.get<any>(`/api/top-ups/${activeTopUp.id}`);
      setActiveTopUp(data);
      if (data.status === 'completed') {
        setToast({ message: `Nạp tiền thành công!`, type: 'success' });
        await refreshUser();
        handleCloseTopUp();
      } else if (data.status === 'failed') {
        setToast({ message: `Nạp tiền thất bại: ${data.error_message}`, type: 'error' });
        handleCloseTopUp();
      } else {
        setToast({ message: 'Giao dịch đang chờ thanh toán.', type: 'info' });
      }
    } catch (err) {
      setToast({ message: 'Lỗi cập nhật trạng thái.', type: 'error' });
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography sx={{ color: 'text.secondary' }}>Vui lòng đăng nhập để xem cài đặt hồ sơ của bạn.</Typography>
      </Box>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setToast({ message: 'Họ và tên phải dài ít nhất 2 ký tự.', type: 'error' });
      return;
    }
    try {
      setSaving(true);
      await api.put('/api/auth/update', { 
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim() || null,
        date_of_birth: dob || null,
        address: address.trim() || null
      });
      await refreshUser();
      setToast({ message: 'Thông tin cá nhân được cập nhật thành công.', type: 'success' });
    } catch (err) {
      setToast({ message: errorMessage(err, 'Cập nhật hồ sơ thất bại.'), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTransaction = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setToast({ message: 'Vui lòng nhập số tiền hợp lệ lớn hơn $0.', type: 'error' });
      return;
    }

    try {
      setTransacting(true);
      const data = await api.post<any>('/api/top-ups', { amount: numAmount });
      setActiveTopUp(data);
      setAmount('');
      setToast({ message: 'Đã tạo mã QR nạp tiền thành công. Vui lòng thanh toán để tiếp tục.', type: 'success' });
      startPolling(data.id);
    } catch (err) {
      setToast({ message: errorMessage(err, 'Không thể tạo mã QR.'), type: 'error' });
    } finally {
      setTransacting(false);
    }
  };

  const inputSx = {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: '"Outfit", sans-serif',
    transition: 'border-color 0.2s',
    '&.Mui-focused': {
      borderColor: '#6366f1',
    },
    '& input': {
      padding: 0,
      '&::placeholder': {
        color: '#6b7280',
        opacity: 1,
      }
    },
    '&.Mui-disabled': {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderColor: 'rgba(255, 255, 255, 0.05)',
      color: 'text.disabled',
      cursor: 'not-allowed',
      '& input': {
        cursor: 'not-allowed'
      }
    }
  };

  const labelSx = {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'text.secondary'
  };

  return (
    <Container
      maxWidth="xl"
      sx={pageContainerSx}
    >
      {/* Page Header */}
      <Box
        sx={{
          ...glassPanelSx,
          padding: { xs: '1.5rem', sm: '2rem' },
          marginBottom: '2.5rem',
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: '1.5rem',
          border: '1px solid rgba(99, 102, 241, 0.15)',
          background: 'linear-gradient(135deg, rgba(15, 17, 23, 0.6), rgba(99, 102, 241, 0.05))'
        }}
      >
        <Box
          sx={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.5rem',
            color: '#fff',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            flexShrink: 0
          }}
        >
          {user.full_name ? user.full_name.trim().charAt(0).toUpperCase() : 'U'}
        </Box>
        <Box>
          <Typography variant="h1" sx={{ ...pageTitleSx, fontSize: { xs: '1.75rem', md: '2rem' }, marginBottom: '0.25rem' }}>
            Cài đặt Tài khoản
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
            Quản lý thông tin hồ sơ cá nhân, liên hệ và số dư ví giả lập của bạn.
          </Typography>
        </Box>
      </Box>

      {/* Two Column Grid */}
      <Grid container spacing={4}>
        {/* Left Column: Account Profile */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ ...glassPanelSx, padding: panelPaddingSx, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <Typography variant="h2" sx={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', margin: 0 }}>
              <User size={18} color="#6366f1" />
              Thông tin Cá nhân
            </Typography>

            <Box component="form" onSubmit={handleUpdateProfile} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography component="label" sx={labelSx}>
                  Địa chỉ Email (Chỉ đọc)
                </Typography>
                <InputBase 
                  type="text" 
                  value={user.email} 
                  disabled 
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography component="label" htmlFor="fullNameInput" sx={labelSx}>
                  Họ và Tên
                </Typography>
                <InputBase 
                  id="fullNameInput"
                  type="text" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  required
                  sx={inputSx}
                />
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography component="label" htmlFor="phoneInput" sx={labelSx}>
                  Số điện thoại
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Phone size={16} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <InputBase 
                    id="phoneInput"
                    type="text" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Nhập số điện thoại"
                    sx={{
                      ...inputSx,
                      paddingLeft: '2.5rem',
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography component="label" htmlFor="dobInput" sx={labelSx}>
                  Ngày sinh
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Calendar size={16} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
                  <InputBase 
                    id="dobInput"
                    type="date" 
                    value={dob} 
                    onChange={(e) => setDob(e.target.value)}
                    sx={{
                      ...inputSx,
                      paddingLeft: '2.5rem',
                      '& input': {
                        colorScheme: 'dark',
                        padding: 0
                      }
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Typography component="label" htmlFor="addressInput" sx={labelSx}>
                  Địa chỉ
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <MapPin size={16} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '1rem', zIndex: 2 }} />
                  <InputBase 
                    id="addressInput"
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập địa chỉ nhà của bạn"
                    multiline
                    rows={3}
                    sx={{
                      ...inputSx,
                      paddingLeft: '2.5rem',
                    }}
                  />
                </Box>
              </Box>

              <Button 
                type="submit" 
                disabled={saving}
                sx={{
                  ...btnPrimarySx,
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '0.9rem'
                }}
              >
                {saving ? (
                  <>
                    <CircularProgress size={16} color="inherit" />
                    Đang lưu thay đổi...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Lưu Thay đổi
                  </>
                )}
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Right Column: Wallet Transactions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ ...glassPanelSx, padding: panelPaddingSx, display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
            <Typography variant="h2" sx={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', margin: 0 }}>
              <Wallet size={18} color="#6366f1" />
              Ví Giả lập
            </Typography>

            {/* Current Balance Display */}
            <Box sx={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.05))',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
            }}>
              <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Số dư hiện tại
              </Typography>
              <Typography sx={{ 
                fontSize: '2.25rem', 
                fontWeight: 900, 
                color: '#fff', 
                marginTop: '0.5rem',
                background: 'linear-gradient(to right, #fff, #a5b4fc, #f472b6)', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent'
              }}>
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </Box>

            {/* Transaction Section */}
            {activeTopUp ? (
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                alignItems: 'center',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
                position: 'relative'
              }}>
                <Box 
                  component="button"
                  onClick={handleCloseTopUp}
                  sx={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    color: 'text.secondary',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&:hover': { color: '#fff' }
                  }}
                >
                  <X size={16} />
                </Box>
                
                <Typography variant="h3" sx={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'primary.main' }}>
                  Thanh toán ACB VietQR
                </Typography>
                
                {activeTopUp.qr_image_base64 ? (
                  <Box sx={{
                    padding: '8px',
                    background: '#fff',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}>
                    <Box 
                      component="img"
                      src={activeTopUp.qr_image_base64} 
                      alt="ACB VietQR" 
                      sx={{ width: '160px', height: '160px', display: 'block' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: 'text.secondary' }}>
                    Đang tải mã QR...
                  </Box>
                )}
                
                <Box sx={{ width: '100%', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
                    <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Số tiền (USD):</Typography>
                    <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>${activeTopUp.amount.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ ...labelValueRowSx, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
                    <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.85rem', flexShrink: 0 }}>Số tiền (VND):</Typography>
                    <Typography component="span" sx={{ fontWeight: 700, color: '#34d399', fontSize: '0.85rem', textAlign: 'right' }}>{activeTopUp.amount_vnd.toLocaleString()} VND</Typography>
                  </Box>
                  <Box sx={{ ...labelValueRowSx, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
                    <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.85rem', flexShrink: 0 }}>Nội dung chuyển khoản:</Typography>
                    <Typography component="span" sx={{ fontWeight: 700, color: '#a5b4fc', fontFamily: 'monospace', fontSize: '0.85rem', textAlign: 'right', ...breakLongValueSx }}>{activeTopUp.payment_reference}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Trạng thái:</Typography>
                    <Typography component="span" sx={{ 
                      fontWeight: 700,
                      color: activeTopUp.status === 'completed' ? '#10b981' : activeTopUp.status === 'failed' ? '#ef4444' : '#f59e0b',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      background: activeTopUp.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : activeTopUp.status === 'failed' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {activeTopUp.status === 'completed' ? 'Hoàn thành' : activeTopUp.status === 'failed' ? 'Thất bại' : 'Chờ xử lý'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                  <Button
                    type="button"
                    onClick={handleRefreshStatus}
                    sx={{
                      ...btnSecondarySx,
                      flex: 1,
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem'
                    }}
                  >
                    <RefreshCw size={14} className={polling ? 'animate-spin' : ''} />
                    Cập nhật
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCloseTopUp}
                    sx={{
                      flex: 1,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '8px',
                      color: '#f87171',
                      padding: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      fontFamily: '"Outfit", sans-serif',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'rgba(239, 68, 68, 0.18)',
                        borderColor: 'rgba(239, 68, 68, 0.3)'
                      }
                    }}
                  >
                    Hủy bỏ
                  </Button>
                </Box>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', margin: 0, textAlign: 'center' }}>
                  Vui lòng chuyển đúng số tiền và nội dung chuyển khoản để được cộng tiền tự động.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Typography component="label" htmlFor="transactionAmount" sx={labelSx}>
                    Số tiền giao dịch ($)
                  </Typography>
                  <Box sx={{ position: 'relative' }}>
                    <Typography component="span" sx={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'text.secondary', fontWeight: 600, fontSize: '1rem', zIndex: 2 }}>$</Typography>
                    <InputBase 
                      id="transactionAmount"
                      type="number" 
                      inputProps={{ step: '0.01', min: '0.01' }}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      sx={{
                        ...inputSx,
                        paddingLeft: '2rem',
                      }}
                    />
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', width: '100%' }}>
                  <Button
                    type="button"
                    disabled={transacting}
                    onClick={() => handleTransaction()}
                    sx={{
                      background: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.15)',
                      borderRadius: '8px',
                      color: '#34d399',
                      padding: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      width: '100%',
                      textTransform: 'none',
                      fontFamily: '"Outfit", sans-serif',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: 'rgba(16, 185, 129, 0.15)'
                      }
                    }}
                  >
                    <ArrowUpRight size={16} />
                    Nạp tiền
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </Container>
  );
};

// Simple context proxy since AuthContext exports useAuth, and we use it locally
import { useAuth } from '../context/AuthContext';

export default Profile;
