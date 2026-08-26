import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { errorMessage } from '../utils/errors';
import { getExchangeRate } from '../api/exchange';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Toast } from '../components/Toast';
import { activeSortedVariants, formatVariantDuration } from '../utils/variants';
import { Box, Container, Typography, Button, Dialog, DialogTitle, DialogContent, CircularProgress, InputBase } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, btnPrimarySx, btnSecondarySx, pageContainerSx, panelPaddingSx, dialogPaperSx, breakLongValueSx, labelValueRowSx } from '../theme';

interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  created_at: string;
  variants?: {
    id: string;
    product_id: string;
    name: string;
    price: number;
    original_price: number | null;
    duration_days: number | null;
    duration_months: number | null;
    is_lifetime: boolean;
    is_deleted: boolean;
  }[];
}

interface Purchase {
  id: string;
  product_id: string;
  status: string;
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [owned, setOwned] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [exchangeRate, setExchangeRate] = useState(25000);
  
  // Voucher states
  const [voucherCode, setVoucherCode] = useState('');
  const [validatingVoucher, setValidatingVoucher] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState('');

  // Clear voucher on variant change
  useEffect(() => {
    setVoucherCode('');
    setAppliedVoucher(null);
    setVoucherError('');
  }, [selectedVariantId]);

  const loadProductAndOwnership = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const prodData = await api.get<Product>(`/api/products/${id}`);
      setProduct(prodData);
      const activeVariants = activeSortedVariants(prodData.variants);
      if (activeVariants.length > 0) {
        setSelectedVariantId(activeVariants[0].id);
      }

      if (user) {
        const purchases = await api.get<Purchase[]>('/api/purchases/my-purchases');
        const isOwned = purchases.some(p => p.product_id === id);
        setOwned(isOwned);
      }

      try {
        const rateData = await getExchangeRate();
        if (rateData && rateData.conversion_rate) {
          setExchangeRate(rateData.conversion_rate);
        }
      } catch (rateErr) {
        console.error("Failed to fetch exchange rate", rateErr);
      }
    } catch (err) {
      setError(errorMessage(err, 'Không thể lấy thông tin công cụ giao dịch.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductAndOwnership();
  }, [id, user]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Vui lòng nhập mã khuyến mãi');
      return;
    }
    const selectedVariant = activeSortedVariants(product?.variants).find(v => v.id === selectedVariantId);
    if (!selectedVariant) return;

    setValidatingVoucher(true);
    setVoucherError('');
    try {
      const res = await api.post<any>('/api/purchases/validate-voucher', {
        voucher_code: voucherCode.trim(),
        product_id: product?.id,
        original_price: selectedVariant.price
      });
      setAppliedVoucher(res);
      setToast({ message: 'Áp dụng mã giảm giá thành công!', type: 'success' });
    } catch (err) {
      setVoucherError(errorMessage(err, 'Mã giảm giá không hợp lệ.'));
      setAppliedVoucher(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  const handleCloseCheckoutModal = () => {
    setShowCheckoutModal(false);
    setVoucherCode('');
    setAppliedVoucher(null);
    setVoucherError('');
  };

  const handleCheckout = async () => {
    if (!product) return;
    if (!selectedVariantId) {
      setToast({ message: 'Vui lòng chọn gói bản quyền trước khi thanh toán.', type: 'error' });
      return;
    }
    try {
      setPurchasing(true);
      const purchase = await api.post<Purchase>('/api/purchases/checkout', {
        product_id: product.id,
        variant_id: selectedVariantId,
        voucher_code: appliedVoucher ? appliedVoucher.code : undefined
      });
      if (purchase.status === 'pending') {
        await api.post<Purchase>(`/api/purchases/${purchase.id}/pay`, {});
      }
      setOwned(true);
      setShowCheckoutModal(false);
      await refreshUser();
      navigate('/dashboard?payment=success');
    } catch (err) {
      setToast({ message: errorMessage(err, 'Thanh toán thất bại.'), type: 'error' });
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="sm" sx={{ margin: '4rem auto' }}>
        <Box sx={{ ...glassPanelSx, padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <Typography sx={{ color: 'error.main', fontWeight: 600, mb: 2 }}>{error || 'Không tìm thấy công cụ giao dịch.'}</Typography>
          <Button
            component={Link}
            to="/"
            sx={{
              ...btnPrimarySx,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ArrowLeft size={16} />
            Quay lại Cửa hàng
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <>
      <Container
        maxWidth="xl"
        sx={pageContainerSx}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'text.secondary',
            marginBottom: '2rem',
            fontWeight: 500,
            textDecoration: 'none',
            '&:hover': { color: '#fff' }
          }}
        >
          <ArrowLeft size={16} />
          Quay lại Cửa hàng
        </Box>

        <Grid container spacing={5}>
          {/* Left Column: Visual Mock and Description */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ ...glassPanelSx, overflow: 'hidden', padding: 0, marginBottom: '2rem' }}>
              <Box 
                component="img"
                src={product.image_url} 
                alt={product.title} 
                sx={{ width: '100%', height: { xs: '220px', md: '350px' }, objectFit: 'cover' }}
              />
            </Box>

            <Typography variant="h2" sx={{ fontSize: { xs: '1.35rem', md: '1.75rem' }, marginBottom: '1rem' }}>Mô tả & Tính năng</Typography>
            <Box sx={{ ...glassPanelSx, padding: '1.5rem', lineHeight: 1.7, color: 'text.secondary' }}>
              <Typography sx={{ whiteSpace: 'pre-line', fontSize: '0.95rem', color: 'text.secondary', lineHeight: 1.7 }}>
                {product.description}
              </Typography>
            </Box>
          </Grid>

          {/* Right Column: Buying Box & Specifications */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ ...glassPanelSx, padding: panelPaddingSx, marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
              <Box component="span" sx={{
                fontSize: '0.75rem',
                fontWeight: 800,
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'primary.main',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
                textTransform: 'uppercase',
                display: 'inline-block',
                marginBottom: '1rem',
                border: '1px solid rgba(99, 102, 241, 0.2)'
              }}>
                {product.category}
              </Box>

              <Typography variant="h1" sx={{ fontSize: { xs: '1.75rem', md: '2rem' }, marginBottom: '0.5rem', fontWeight: 800 }}>
                {product.title}
              </Typography>
              
              <Typography sx={{ color: 'text.disabled', fontSize: '0.85rem', marginBottom: '1.5rem', ...breakLongValueSx }}>
                Mã sản phẩm: {product.id}
              </Typography>

              {activeSortedVariants(product.variants).length > 0 ? (
                <Box sx={{ marginBottom: '2rem' }}>
                  <Typography component="label" sx={{ fontSize: '0.85rem', color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                    Chọn Gói Bản quyền
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {activeSortedVariants(product.variants).map(v => {
                      const isSelected = selectedVariantId === v.id;
                      const vndEstimate = (v.price * exchangeRate).toLocaleString('vi-VN');
                      return (
                        <Box
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: '56px',
                            userSelect: 'none',
                            outline: 'none',
                            '&:focus': {
                              borderColor: 'primary.main',
                            }
                          }}
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setSelectedVariantId(v.id); }}
                        >
                          <input
                            type="radio"
                            id={`variant-${v.id}`}
                            name="product-variant"
                            checked={isSelected}
                            onChange={() => setSelectedVariantId(v.id)}
                            style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                          />
                          <Box component="label" htmlFor={`variant-${v.id}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: '0.5rem', sm: 0 }, cursor: 'pointer', flex: 1, margin: 0 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{v.name}</Typography>
                              <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                                {formatVariantDuration(v)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {v.original_price && v.original_price > v.price && (
                                  <>
                                    <Typography component="span" sx={{ fontSize: '0.8rem', color: 'text.disabled', textDecoration: 'line-through', fontWeight: 500 }}>
                                      ${v.original_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </Typography>
                                    <Box component="span" sx={{
                                      fontSize: '0.65rem',
                                      fontWeight: 700,
                                      color: '#ef4444',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      padding: '0.1rem 0.25rem',
                                      borderRadius: '3px',
                                      display: 'inline-block'
                                    }}>
                                      -{Math.round(((v.original_price - v.price) / v.original_price) * 100)}%
                                    </Box>
                                  </>
                                )}
                                <Typography component="span" sx={{ fontWeight: 800, fontSize: '1.1rem', color: 'primary.main' }}>
                                  ${v.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Typography>
                              </Box>
                              <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                                ≈ {vndEstimate} VND
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={12} color="#10b981" />
                    Ước tính VND sử dụng tỷ giá 1 USD = {exchangeRate.toLocaleString('vi-VN')} VND. Hệ thống xác thực và xử lý thanh toán bằng VND.
                  </Typography>
                </Box>
              ) : (
                <Typography sx={{ color: 'error.main', fontWeight: 600, marginBottom: '2rem' }}>
                  Sản phẩm này chưa có gói bản quyền nào hoạt động.
                </Typography>
              )}
   
              {owned ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <CheckCircle2 size={20} color="#10b981" />
                    <Typography component="span" sx={{ fontWeight: 600, color: 'success.main', fontSize: '0.95rem' }}>
                      Bạn đã sở hữu công cụ này
                    </Typography>
                  </Box>
                  <Button
                    component={Link}
                    to="/dashboard"
                    sx={{
                      ...btnPrimarySx,
                      justifyContent: 'center',
                      width: '100%'
                    }}
                  >
                    Đi đến Trang Tải xuống & Bản quyền
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {user ? (
                    <Button
                      onClick={() => setShowCheckoutModal(true)}
                      disabled={!selectedVariantId}
                      sx={{
                        ...btnPrimarySx,
                        justifyContent: 'center',
                        padding: '1rem',
                        width: '100%'
                      }}
                    >
                      <CreditCard size={18} />
                      Thanh toán Ngay
                    </Button>
                  ) : (
                    <Button
                      component={Link}
                      to="/login"
                      sx={{
                        ...btnPrimarySx,
                        justifyContent: 'center',
                        padding: '1rem',
                        width: '100%'
                      }}
                    >
                      Đăng nhập để Mua hàng
                    </Button>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'text.disabled', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    <ShieldCheck size={14} color="#10b981" />
                    Thanh toán mô phỏng bảo mật. Không trừ tiền thật.
                  </Box>
                </Box>
              )}
            </Box>
   
            {/* Specifications */}
            <Box sx={{ ...glassPanelSx, padding: '1.5rem' }}>
              <Typography variant="h3" sx={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                Thông số kỹ thuật
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Định dạng</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>
                    {product.category === 'EA' ? '.ex5 / .ex4' : product.category === 'Indicator' ? '.ex5 / .mq5' : '.mq5 / .txt'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Hình thức</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>Tải xuống bảo mật tức thì</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Bản quyền</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>Sử dụng cá nhân (Không giới hạn tài khoản)</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Cập nhật</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '0.9rem' }}>Cập nhật miễn phí trọn đời</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
 
      {/* Checkout Modal Simulation */}
      <Dialog
        open={showCheckoutModal}
        onClose={handleCloseCheckoutModal}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              ...dialogPaperSx,
              maxWidth: '480px',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              background: 'rgba(20, 22, 33, 0.9)',
              backgroundImage: 'none',
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <CreditCard size={24} color="#6366f1" />
          <Typography variant="h2" sx={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>
            Thanh toán Bảo mật
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Xác nhận chi tiết giao dịch của bạn dưới đây.
          </Typography>

          {(() => {
            const selectedVariant = activeSortedVariants(product.variants).find(v => v.id === selectedVariantId);
            if (!selectedVariant) return null;
            const originalPrice = selectedVariant.price;
            const finalPrice = appliedVoucher ? appliedVoucher.discounted_price : originalPrice;
            const vndAmount = (finalPrice * exchangeRate).toLocaleString('vi-VN');
            return (
              <>
                <Box sx={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
                  <Box sx={{ ...labelValueRowSx, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', flexShrink: 0 }}>Công cụ</Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', textAlign: 'right', ...breakLongValueSx }}>{product.title}</Typography>
                  </Box>
                  <Box sx={{ ...labelValueRowSx, marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', flexShrink: 0 }}>Gói bản quyền</Typography>
                    <Typography sx={{ color: '#fff', fontWeight: 500, fontSize: '0.95rem', textAlign: 'right', ...breakLongValueSx }}>{selectedVariant.name}</Typography>
                  </Box>
                  <Box sx={{ ...labelValueRowSx, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '1.1rem' }}>
                    <Typography sx={{ color: 'text.primary', fontWeight: 600, fontSize: '1.1rem', flexShrink: 0 }}>Tổng tiền</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      {appliedVoucher && (
                        <Typography sx={{ color: 'text.disabled', textDecoration: 'line-through', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                          ${originalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Typography>
                      )}
                      <Typography sx={{ color: 'primary.main', fontWeight: 800, fontSize: '1.1rem' }}>
                        ${finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                        ≈ {vndAmount} VND
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Voucher Input */}
                <Box sx={{ marginBottom: '1.5rem' }}>
                  <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary', marginBottom: '0.5rem' }}>
                    Mã khuyến mãi
                  </Typography>
                  <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                    <InputBase
                      placeholder="Nhập mã (ví dụ: NEWLIFE)"
                      value={voucherCode}
                      onChange={e => {
                        setVoucherCode(e.target.value);
                        if (voucherError) setVoucherError('');
                      }}
                      disabled={validatingVoucher || purchasing}
                      sx={{
                        flex: 1,
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '8px',
                        padding: '0.5rem 0.75rem',
                        color: '#fff',
                        fontSize: '0.9rem',
                        fontFamily: '"Outfit", sans-serif',
                        '&.Mui-focused': {
                          borderColor: '#6366f1',
                        },
                        '& input': {
                          padding: 0
                        }
                      }}
                    />
                    <Button
                      onClick={handleApplyVoucher}
                      disabled={validatingVoucher || purchasing || !voucherCode.trim()}
                      sx={{
                        ...btnPrimarySx,
                        padding: '0 1rem',
                        height: '38px',
                        fontSize: '0.85rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {validatingVoucher ? 'Đang áp dụng...' : 'Áp dụng'}
                    </Button>
                  </Box>
                  {voucherError && (
                    <Typography sx={{ color: 'error.main', fontSize: '0.75rem', marginTop: '0.35rem' }}>
                      {voucherError}
                    </Typography>
                  )}
                  {appliedVoucher && (
                    <Typography sx={{ color: 'success.main', fontSize: '0.75rem', marginTop: '0.35rem', fontWeight: 600 }}>
                      Đã áp dụng mã {appliedVoucher.code} thành công (-{appliedVoucher.discount_type === 'percentage' ? `${appliedVoucher.discount_value}%` : `$${appliedVoucher.discount_value}`})
                    </Typography>
                  )}
                </Box>
              </>
            );
          })()}

          <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <Button 
              onClick={handleCloseCheckoutModal} 
              sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}
              disabled={purchasing}
            >
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleCheckout} 
              sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}
              disabled={purchasing}
            >
              {purchasing ? 'Đang xử lý...' : 'Xác nhận Mua'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default ProductDetail;
