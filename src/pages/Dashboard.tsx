import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { errorMessage } from '../utils/errors';
import { getExchangeRate } from '../api/exchange';
import { Download, ShoppingBag, ShieldCheck, RefreshCw, Info, Key, Copy, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { activeSortedVariants, formatVariantDuration } from '../utils/variants';
import { Box, Container, Typography, Button, InputBase, Dialog, DialogTitle, DialogContent, CircularProgress } from '@mui/material';
import { glassPanelSx, btnPrimarySx, btnSecondarySx, pageContainerSx, pageTitleSx, panelPaddingSx, dialogPaperSx, breakLongValueSx } from '../theme';

interface Variant {
  id: string;
  product_id: string;
  name: string;
  price: number;
  duration_days: number | null;
  duration_months: number | null;
  is_lifetime: boolean;
  is_deleted: boolean;
}

interface Product {
  id: string;
  title: string;
  category: string;
  image_url: string;
  file_path: string;
  variants?: Variant[];
}

interface License {
  id: string;
  purchase_id: string;
  user_id: string;
  product_id: string;
  mt5_account: string | null;
  mt5_accounts: string[];
  device_id: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  key_recoverable: boolean;
}

interface Purchase {
  id: string;
  product_id: string;
  amount_paid: number;
  purchase_date: string;
  status: string;
  product: Product;
  license: License | null;
  api_key?: string | null;
  variant_name?: string | null;
  variant_price?: number | null;
  variant_duration_days?: number | null;
  variant_duration_months?: number | null;
  variant_is_lifetime?: boolean | null;
}

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: Product;
  license: License | null;
}

interface OrderDetail extends Order {
  purchases: Purchase[];
}

export const Dashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderDetails, setOrderDetails] = useState<Record<string, Purchase[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [exchangeRate, setExchangeRate] = useState(25000);

  const [bindInputs, setBindInputs] = useState<Record<string, string>>({});
  const [bindErrors, setBindErrors] = useState<Record<string, string>>({});
  const [bindingId, setBindingId] = useState<string | null>(null);
  const [copyingKeyId, setCopyingKeyId] = useState<string | null>(null);

  // States for renewal flow
  const [renewingOrder, setRenewingOrder] = useState<Order | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regeneratingLoading, setRegeneratingLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setToast({ message: 'Thanh toán thành công! Khóa bản quyền của bạn đã sẵn sàng tại nút Sao chép Khóa.', type: 'success' });
      window.history.replaceState({}, document.title, window.location.pathname);
      refreshUser();
      loadOrders();
    }
  }, []);

  const validateBindingInput = (licenseId: string, val: string) => {
    const isNumeric = /^\d+$/.test(val);
    if (!val) {
      setBindErrors(prev => ({ ...prev, [licenseId]: '' }));
    } else if (!isNumeric) {
      setBindErrors(prev => ({ ...prev, [licenseId]: 'Số tài khoản chỉ được chứa chữ số.' }));
    } else if (val.length < 4 || val.length > 12) {
      setBindErrors(prev => ({ ...prev, [licenseId]: 'Số tài khoản phải từ 4 đến 12 chữ số.' }));
    } else {
      setBindErrors(prev => ({ ...prev, [licenseId]: '' }));
    }
  };

  const handleBindLicense = async (licenseId: string) => {
    const val = bindInputs[licenseId]?.trim() || '';
    if (!val || bindErrors[licenseId]) return;

    const order = orders.find(item => item.license?.id === licenseId);
    const boundAccounts = order?.license
      ? (order.license.mt5_accounts?.length ? order.license.mt5_accounts : (order.license.mt5_account ? [order.license.mt5_account] : []))
      : [];
    if (boundAccounts.includes(val)) {
      setToast({ message: 'Tài khoản MT4/MT5 này đã được liên kết với bản quyền.', type: 'error' });
      return;
    }

    try {
      setBindingId(licenseId);
      await api.post('/api/license/bind', { license_id: licenseId, mt5_account: val });
      setToast({ message: 'Liên kết bản quyền với tài khoản MT4/MT5 thành công.', type: 'success' });
      setBindInputs(prev => ({ ...prev, [licenseId]: '' }));
      loadOrders(true);
    } catch (err) {
      setToast({ message: errorMessage(err, 'Liên kết tài khoản thất bại.'), type: 'error' });
    } finally {
      setBindingId(null);
    }
  };

  const handleCopyLicenseKey = async (licenseId: string) => {
    try {
      setCopyingKeyId(licenseId);
      const data = await api.get<{ api_key: string }>(`/api/license/${licenseId}/key`);
      await navigator.clipboard.writeText(data.api_key);
      setToast({ message: 'Đã sao chép Khóa bản quyền vào bộ nhớ tạm.', type: 'success' });
    } catch (err) {
      setToast({ message: errorMessage(err, 'Không thể sao chép Khóa bản quyền.'), type: 'error' });
    } finally {
      setCopyingKeyId(null);
    }
  };

  const handleRegenerateLicenseKey = async () => {
    if (!regeneratingId) return;
    try {
      setRegeneratingLoading(true);
      const data = await api.post<{ api_key: string }>(`/api/license/${regeneratingId}/regenerate`, {});
      await navigator.clipboard.writeText(data.api_key);
      setToast({ message: 'Đã tạo Khóa bản quyền mới và sao chép vào bộ nhớ tạm.', type: 'success' });
      setRegeneratingId(null);
      await loadOrders(true);
    } catch (err) {
      setToast({ message: errorMessage(err, 'Tạo lại Khóa bản quyền thất bại.'), type: 'error' });
    } finally {
      setRegeneratingLoading(false);
    }
  };

  const calculateNewExpiryDate = (expiresAtStr: string | null, variant: { is_lifetime: boolean; duration_days: number | null; duration_months: number | null }) => {
    if (variant.is_lifetime) {
      return 'Trọn đời (Không hết hạn)';
    }
    
    const now = new Date();
    let baseDate = now;
    
    if (expiresAtStr) {
      const currentExpiry = new Date(expiresAtStr);
      if (currentExpiry.getTime() > now.getTime()) {
        baseDate = currentExpiry;
      }
    }
    
    const newDate = new Date(baseDate);
    if (variant.duration_months) {
      newDate.setMonth(newDate.getMonth() + variant.duration_months);
    } else if (variant.duration_days) {
      newDate.setDate(newDate.getDate() + variant.duration_days);
    } else {
      newDate.setDate(newDate.getDate() + 30);
    }
    
    return newDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleOpenRenewModal = (order: Order) => {
    setRenewingOrder(order);
    const activeVariants = activeSortedVariants(order.product.variants);
    if (activeVariants.length > 0) {
      setSelectedVariantId(activeVariants[0].id);
    } else {
      setSelectedVariantId('');
    }
    setShowRenewModal(true);
  };

  const handleRenewCheckout = async () => {
    if (!renewingOrder || !selectedVariantId) return;
    try {
      setRenewing(true);
      const purchase = await api.post<Purchase>('/api/purchases/checkout', {
        product_id: renewingOrder.product.id,
        variant_id: selectedVariantId
      });
      if (purchase.status === 'pending') {
        await api.post<Purchase>(`/api/purchases/${purchase.id}/pay`, {});
      }
      
      try {
        const detail = await api.get<OrderDetail>(`/api/orders/${renewingOrder.id}`);
        setOrderDetails(prev => ({ ...prev, [renewingOrder.id]: detail.purchases }));
      } catch (detailErr) {
        console.error("Failed to refresh order details:", detailErr);
      }

      await refreshUser();
      setShowRenewModal(false);
      setToast({ message: "Gia hạn bản quyền thành công!", type: "success" });
      setRenewingOrder(null);
      setSelectedVariantId('');
      await loadOrders(true);
    } catch (err) {
      setToast({ message: errorMessage(err, 'Thanh toán thất bại.'), type: 'error' });
    } finally {
      setRenewing(false);
    }
  };

  const loadOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      setError('');
      const [data, rateData] = await Promise.all([
        api.get<Order[]>('/api/orders/my-orders'),
        getExchangeRate().catch(() => null)
      ]);
      setOrders(data);
      if (rateData && rateData.conversion_rate) {
        setExchangeRate(rateData.conversion_rate);
      }
    } catch (err) {
      setError(errorMessage(err, 'Không thể tải danh mục sản phẩm đã mua.'));
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const toggleOrderDetails = async (orderId: string) => {
    const isExpanded = !!expandedOrders[orderId];
    if (!isExpanded && !orderDetails[orderId]) {
      try {
        const detail = await api.get<OrderDetail>(`/api/orders/${orderId}`);
        setOrderDetails(prev => ({ ...prev, [orderId]: detail.purchases }));
      } catch (err) {
        setToast({ message: errorMessage(err, 'Không thể tải chi tiết đơn hàng.'), type: 'error' });
        return;
      }
    }
    setExpandedOrders(prev => ({ ...prev, [orderId]: !isExpanded }));
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const handleDownload = async (productId: string, title: string) => {
    try {
      setDownloadingId(productId);
      const cleanTitle = title.replace(/[^a-zA-Z0-9]/g, '_');
      const fallbackFilename = `${cleanTitle}.ex5`;

      await api.downloadFile(productId, fallbackFilename);
      setToast({ message: 'Tải xuống tệp tin bảo mật thành công.', type: 'success' });
    } catch (err) {
      setToast({ message: errorMessage(err, 'Tải xuống tệp tin thất bại.'), type: 'error' });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <>
      <Container
        maxWidth="xl"
        sx={pageContainerSx}
      >
        {/* Header Profile Dashboard */}
        <Box
          sx={{
            ...glassPanelSx,
            padding: panelPaddingSx,
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            border: '1px solid rgba(99, 102, 241, 0.15)'
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h1" sx={{ ...pageTitleSx, fontSize: { xs: '1.75rem', md: '2rem' }, marginBottom: '0.5rem' }}>
              Bảng Điều khiển
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', ...breakLongValueSx }}>
              Đăng nhập bởi: <strong style={{ color: '#fff' }}>{user?.full_name}</strong> ({user?.email})
            </Typography>
          </Box>
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              loadOrders();
            }}
            sx={{
              ...btnSecondarySx,
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <RefreshCw size={14} />
            Cập nhật đơn hàng
          </Button>
        </Box>

        <Typography variant="h2" sx={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShoppingBag size={20} color="#6366f1" />
          Đơn hàng của tôi
        </Typography>

        {error && (
          <Box sx={{ ...glassPanelSx, padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'error.main', fontWeight: 600 }}>
            {error}
          </Box>
        )}

        {orders.length === 0 ? (
          <Box sx={{ ...glassPanelSx, padding: '4rem 2rem', textAlign: 'center' }}>
            <Info size={40} style={{ marginBottom: '1rem', color: '#6b7280' }} />
            <Typography sx={{ color: 'text.secondary', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
              Bạn chưa mua bất kỳ công cụ giao dịch định lượng nào.
            </Typography>
            <Button component={Link} to="/" sx={btnPrimarySx}>
              Xem Cửa hàng
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order) => {
              const prod = order.product;
              if (!prod) return null; // Defensive check
              const now = new Date();
              const expiresAt = order.license?.expires_at ? new Date(order.license.expires_at) : null;
              const isLifetime = order.license ? order.license.expires_at === null : true;
              const isExpired = expiresAt ? expiresAt.getTime() <= now.getTime() : false;
              const daysRemaining = expiresAt && !isExpired
                ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              const isExpiringSoon = expiresAt && !isExpired && daysRemaining <= 7;

              const boundAccounts = order.license
                ? (order.license.mt5_accounts?.length ? order.license.mt5_accounts : (order.license.mt5_account ? [order.license.mt5_account] : []))
                : [];
              // One MT4/MT5 account per license, and the owner cannot release it.
              const hasBinding = boundAccounts.length > 0;
              return (
                <Box key={order.id} sx={{
                  ...glassPanelSx,
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: '1.5rem',
                    width: '100%',
                    justifyContent: 'space-between'
                  }}>
                    {/* Visual & Info wrapper */}
                    <Box sx={{ display: 'flex', gap: '1.25rem', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, flex: 1, minWidth: 0 }}>
                      {/* Thumbnail */}
                      <Box sx={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                        <Box
                          component="img"
                          src={prod.image_url}
                          alt={prod.title}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>

                      {/* Details */}
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                          <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
                            {prod.title}
                          </Typography>
                          <Box sx={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            color: 'text.secondary',
                            border: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            {prod.category}
                          </Box>
                        </Box>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                          Thời gian mua: {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </Typography>
                        <Typography sx={{ color: 'success.main', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem' }}>
                          <ShieldCheck size={12} />
                          Bản quyền tải xuống được xác thực & ký bảo mật.
                        </Typography>
                      </Box>
                    </Box>

                    {/* CTA Action */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
                      {isExpired ? (
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenRenewModal(order);
                          }}
                          sx={{
                            ...btnPrimarySx,
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.9rem',
                            width: { xs: '100%', sm: 'auto' },
                            boxShadow: '0 0 15px 1px rgba(99, 102, 241, 0.4)'
                          }}
                        >
                          <RefreshCw size={16} />
                          Gia hạn bản quyền
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleDownload(prod.id, prod.title)}
                          disabled={downloadingId === prod.id}
                          sx={{
                            ...btnPrimarySx,
                            padding: '0.75rem 1.25rem',
                            fontSize: '0.9rem',
                            width: { xs: '100%', sm: 'auto' }
                          }}
                          title="Tải xuống tệp tin bản quyền"
                        >
                          {downloadingId === prod.id ? (
                            <>
                              <CircularProgress size={14} color="inherit" />
                              Đang tải...
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              Tải xuống Bảo mật
                            </>
                          )}
                        </Button>
                      )}
                    </Box>
                  </Box>

                  {/* License Section */}
                  {order.license && (
                    <Box sx={{
                      padding: '1.25rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      width: '100%'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                        <Key size={16} color="#6366f1" />
                        <Typography variant="h4" sx={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Bản quyền & Tài khoản liên kết
                        </Typography>
                      </Box>

                      {isExpired && (
                        <Box sx={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: '8px',
                          padding: '1rem',
                          color: '#ff8a8a',
                          fontSize: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }} role="alert">
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Box component="span" sx={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></Box>
                            Bản quyền đã Khóa - Cảnh báo Hết hạn
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem' }}>
                            Bản quyền giao dịch định lượng của bạn cho robot này đã hết hạn. Các liên kết tài khoản MT4/MT5 và kích hoạt thiết bị đã bị khóa. Vui lòng gia hạn bên dưới để kích hoạt lại.
                          </Typography>
                        </Box>
                      )}

                      {isExpiringSoon && (
                        <Box sx={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          borderRadius: '8px',
                          padding: '1rem',
                          color: '#ffe08a',
                          fontSize: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.35rem'
                        }} role="alert">
                          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Box component="span" sx={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></Box>
                            Bản quyền sắp Hết hạn (Còn lại {daysRemaining} ngày)
                          </Typography>
                          <Typography sx={{ fontSize: '0.85rem' }}>
                            Bản quyền giao dịch của bạn sẽ hết hạn vào ngày {expiresAt ? expiresAt.toLocaleDateString() : ''}. Hãy gia hạn sớm để tiếp tục duy trì hoạt động các chiến lược giao dịch tự động của bạn.
                          </Typography>
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {/* Left: Key and Expiry */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 250px', minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Khóa Bản quyền:</Typography>
                            <Box component="code" sx={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'primary.main', fontWeight: 600, fontSize: '0.8rem', wordBreak: 'break-all' }}>
                              {order.license.key_recoverable ? 'Được lưu bảo mật' : 'Không thể khôi phục khóa cũ'}
                            </Box>
                              {order.license.key_recoverable ? (
                              <Box sx={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                               <Button
                                 type="button"
                                 onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   handleCopyLicenseKey(order.license!.id);
                                 }}
                                 disabled={isExpired || copyingKeyId === order.license.id}
                                 sx={{
                                   ...btnSecondarySx,
                                   padding: '0.25rem 0.6rem',
                                   fontSize: '0.75rem',
                                   height: 'auto',
                                   minWidth: 'auto',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '0.25rem'
                                 }}
                               >
                                 <Copy size={13} /> {copyingKeyId === order.license.id ? 'Đang sao chép...' : 'Sao chép Khóa'}
                               </Button>
                               <Button
                                 type="button"
                                 onClick={(e) => {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   setRegeneratingId(order.license!.id);
                                 }}
                                 disabled={isExpired || regeneratingLoading}
                                 sx={{
                                   ...btnSecondarySx,
                                   padding: '0.25rem 0.6rem',
                                   fontSize: '0.75rem',
                                   height: 'auto',
                                   minWidth: 'auto',
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: '0.25rem',
                                   borderColor: isExpired ? 'rgba(255,255,255,0.06)' : 'rgba(239, 68, 68, 0.3)',
                                   color: isExpired ? 'text.disabled' : '#ff8a8a',
                                   '&:hover': {
                                     borderColor: isExpired ? 'rgba(255,255,255,0.06)' : '#ef4444',
                                     background: isExpired ? 'rgba(255, 255, 255, 0.05)' : 'rgba(239, 68, 68, 0.08)'
                                   }
                                 }}
                               >
                                 <RefreshCw size={13} /> Tạo lại Khóa
                               </Button>
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>Không thể khôi phục khóa bản quyền cũ.</Typography>
                            )}
                          </Box>
                          <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                            Khóa bản quyền raw lt_... chỉ được hiển thị và lấy ra khi bạn click vào Sao chép. Mã bản quyền không phải thông tin đăng nhập.
                          </Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>
                            Trạng thái: <Box component="span" sx={{ color: isExpired ? 'error.main' : isExpiringSoon ? 'warning.main' : 'success.main', fontWeight: 700 }}>
                              {isLifetime ? 'HOẠT ĐỘNG' : isExpired ? 'HẾT HẠN' : isExpiringSoon ? 'SẮP HẾT HẠN' : 'HOẠT ĐỘNG'}
                            </Box> | {isLifetime ? 'Trọn đời (Không hết hạn)' : `Ngày hết hạn: ${expiresAt ? expiresAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}`} {!isLifetime && !isExpired && `(Còn lại ${daysRemaining} ngày)`}
                          </Typography>
                          <Button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleOpenRenewModal(order);
                            }}
                            sx={{
                              ...(isExpired ? btnPrimarySx : btnSecondarySx),
                              padding: '0.4rem 0.85rem',
                              fontSize: '0.8rem',
                              borderRadius: '8px',
                              marginTop: '0.5rem',
                              alignSelf: 'flex-start',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              boxShadow: isExpired ? '0 0 15px 1px rgba(99, 102, 241, 0.4)' : 'none',
                              '&:hover': {
                                ...(isExpired 
                                  ? { background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', boxShadow: '0 0 15px 2px rgba(99, 102, 241, 0.5)' } 
                                  : { background: 'rgba(255, 255, 255, 0.08)' })
                              }
                            }}
                          >
                            <RefreshCw size={12} />
                            {isExpired ? 'Gia hạn Bản quyền Ngay' : 'Gia hạn / Kéo dài Bản quyền'}
                          </Button>
                        </Box>

                        {/* Right: Bindings and Actions */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1 1 280px', width: '100%' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>MT4/MT5 đã liên kết:</Typography>
                              <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>Mỗi bản quyền chỉ liên kết 1 tài khoản</Typography>
                            </Box>
                            {hasBinding ? (
                              <Box sx={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                {boundAccounts.map((account) => (
                                  <Box key={account} sx={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    color: 'success.main',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem'
                                  }}>
                                    <Lock size={11} />
                                    Tài khoản: {account}
                                  </Box>
                                ))}
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>Chưa có tài khoản nào được liên kết.</Typography>
                            )}
                            {hasBinding && (
                              <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', lineHeight: 1.6 }}>
                                Tài khoản đã liên kết không thể tự gỡ. Nếu cần đổi sang tài khoản khác, vui lòng liên hệ quản trị viên để được hỗ trợ.
                              </Typography>
                            )}
                          </Box>

                          {!hasBinding && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <Typography component="label" htmlFor={`bind-input-${order.license.id}`} sx={{ fontSize: '0.85rem', color: 'text.secondary', minWidth: '90px' }}>Liên kết:</Typography>
                                <InputBase
                                  id={`bind-input-${order.license.id}`}
                                  type="text"
                                  placeholder={isExpired ? "Bản quyền hết hạn" : "Số tài khoản 4-12 chữ số"}
                                  value={bindInputs[order.license.id] || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setBindInputs(prev => ({ ...prev, [order.license!.id]: val }));
                                    validateBindingInput(order.license!.id, val);
                                  }}
                                  disabled={isExpired}
                                  sx={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid',
                                    borderColor: bindErrors[order.license.id] ? 'error.main' : 'rgba(255,255,255,0.06)',
                                    borderRadius: '6px',
                                    padding: '0.2rem 0.75rem',
                                    fontSize: '0.85rem',
                                    fontFamily: '"Outfit", sans-serif',
                                    color: '#fff',
                                    width: { xs: '100%', sm: '160px' },
                                    opacity: isExpired ? 0.5 : 1,
                                    '& input': { padding: 0 }
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleBindLicense(order.license!.id);
                                  }}
                                  disabled={isExpired || !bindInputs[order.license.id] || !!bindErrors[order.license.id] || bindingId === order.license.id}
                                  sx={{
                                    ...btnPrimarySx,
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    borderRadius: '6px',
                                    height: '32px',
                                    opacity: isExpired ? 0.5 : 1,
                                    minWidth: 'auto'
                                  }}
                                >
                                  {bindingId === order.license.id ? 'Đang liên kết...' : 'Liên kết Tài khoản'}
                                </Button>
                              </Box>
                              {bindErrors[order.license.id] && (
                                <Typography sx={{ color: 'error.main', fontSize: '0.75rem', marginLeft: { xs: 0, sm: '95px' } }}>
                                  {bindErrors[order.license.id]}
                                </Typography>
                              )}
                              <Typography sx={{ fontSize: '0.75rem', color: 'warning.main', lineHeight: 1.6 }}>
                                Lưu ý: mỗi bản quyền chỉ liên kết được 1 tài khoản MT4/MT5 và bạn không thể tự gỡ sau khi liên kết. Hãy kiểm tra kỹ số tài khoản trước khi xác nhận.
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                            <Typography sx={{ color: 'text.disabled', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px', fontSize: '0.8rem' }}>
                              Device ID: {order.license.device_id || 'Chưa có thiết bị nào đăng ký'}
                            </Typography>

                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}

                  {/* View Details Accordion */}
                  <Box sx={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                    <Button
                      onClick={() => toggleOrderDetails(order.id)}
                      sx={{
                        ...btnSecondarySx,
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.8rem',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderColor: 'rgba(255, 255, 255, 0.08)'
                      }}
                    >
                      <span>{expandedOrders[order.id] ? 'Ẩn Lịch sử Mua hàng' : 'Xem Lịch sử Mua hàng'}</span>
                    </Button>

                    {expandedOrders[order.id] && (
                      <Box sx={{
                        marginTop: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        animation: 'fadeIn 0.3s ease forwards',
                        '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } }
                      }}>
                        {orderDetails[order.id] ? (
                          orderDetails[order.id].length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {orderDetails[order.id].map((p) => (
                                <Box key={p.id} sx={{
                                  padding: '0.75rem 1rem',
                                  background: 'rgba(255, 255, 255, 0.01)',
                                  border: '1px solid rgba(255, 255, 255, 0.04)',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '0.5rem'
                                }}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                      {p.variant_name || 'Gói Standard'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>
                                      Ngày mua: {new Date(p.purchase_date).toLocaleString()}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Typography sx={{ fontSize: '0.85rem', color: 'primary.main', fontWeight: 700 }}>
                                      ${p.amount_paid.toFixed(2)}
                                    </Typography>
                                    <Box component="span" sx={{
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '12px',
                                      textTransform: 'uppercase',
                                      background: p.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                      color: p.status === 'completed' ? 'success.main' : p.status === 'pending' ? 'warning.main' : 'error.main',
                                      border: p.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.2)' : p.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                                    }}>
                                      {p.status === 'completed' ? 'Hoàn thành' : p.status === 'pending' ? 'Chờ thanh toán' : 'Thất bại'}
                                    </Box>
                                  </Box>
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>Không tìm thấy lịch sử giao dịch cho đơn hàng này.</Typography>
                          )
                        ) : (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'text.disabled' }}>
                            <CircularProgress size={12} color="inherit" />
                            Đang tải lịch sử giao dịch...
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Container>

      {/* Renewal / Extension Modal */}
      <Dialog
        open={showRenewModal}
        onClose={() => setShowRenewModal(false)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              ...dialogPaperSx,
              maxWidth: '480px',
              background: 'rgba(20, 22, 33, 0.9)',
              backgroundImage: 'none',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <RefreshCw size={24} color="#6366f1" />
          <Typography variant="h2" sx={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>
            Gia hạn / Kéo dài Bản quyền
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          {renewingOrder && (
            <Box>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Chọn một gói bản quyền để gia hạn hoặc kéo dài quyền sử dụng cho robot <strong>{renewingOrder.product.title}</strong>.
              </Typography>

              {/* Current Expiry info */}
              <Box sx={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Ngày hết hạn hiện tại:</Typography>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                    {renewingOrder.license?.expires_at 
                      ? new Date(renewingOrder.license.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                      : 'Trọn đời (Không hết hạn)'}
                  </Typography>
                </Box>
                
                {/* Future Estimated Expiry */}
                {(() => {
                  const selectedVariant = renewingOrder.product.variants?.find(v => v.id === selectedVariantId);
                  if (!selectedVariant) return null;
                  const newExpiry = calculateNewExpiryDate(renewingOrder.license?.expires_at || null, selectedVariant);
                  return (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Hạn sử dụng mới ước tính:</Typography>
                      <Typography sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.9rem' }}>
                        {newExpiry}
                      </Typography>
                    </Box>
                  );
                })()}
              </Box>

              {/* Variants selection */}
              {activeSortedVariants(renewingOrder.product.variants).length > 0 ? (
                <Box sx={{ marginBottom: '1.5rem' }}>
                  <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.disabled', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Chọn Gói Bản quyền
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {activeSortedVariants(renewingOrder.product.variants).map(v => {
                      const isSelected = selectedVariantId === v.id;
                      const vndEstimate = (v.price * exchangeRate).toLocaleString('vi-VN');
                      return (
                        <Box
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: isSelected ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.06)' : 'rgba(255,255,255,0.01)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minHeight: '48px',
                            userSelect: 'none',
                            outline: 'none',
                            '&:focus': { borderColor: 'primary.main' }
                          }}
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setSelectedVariantId(v.id); }}
                        >
                          <input
                            type="radio"
                            id={`renew-variant-${v.id}`}
                            name="renew-variant"
                            checked={isSelected}
                            onChange={() => setSelectedVariantId(v.id)}
                            style={{ cursor: 'pointer', accentColor: '#6366f1' }}
                          />
                          <Box component="label" htmlFor={`renew-variant-${v.id}`} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: '0.35rem', sm: '0.75rem' }, cursor: 'pointer', flex: 1, minWidth: 0, margin: 0 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{v.name}</Typography>
                              <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                                {formatVariantDuration(v)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' }, flexShrink: 0 }}>
                              <Typography component="span" sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'primary.main' }}>
                                ${v.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </Typography>
                              <Typography component="span" sx={{ fontSize: '0.7rem', color: 'text.disabled' }}>
                                ≈ {vndEstimate} VND
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              ) : (
                <Typography sx={{ color: 'error.main', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Không tìm thấy gói hoạt động nào cho sản phẩm này.
                </Typography>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button 
              onClick={() => setShowRenewModal(false)} 
              sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}
              disabled={renewing}
            >
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleRenewCheckout} 
              sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center' }}
              disabled={renewing || !selectedVariantId}
            >
              {renewing ? 'Đang xử lý...' : 'Xác nhận Thanh toán'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Regenerate Key Confirmation Dialog */}
      <Dialog
        open={!!regeneratingId}
        onClose={() => !regeneratingLoading && setRegeneratingId(null)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              ...dialogPaperSx,
              maxWidth: '480px',
              background: 'rgba(20, 22, 33, 0.95)',
              backgroundImage: 'none',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Key size={24} color="#ef4444" />
          <Typography variant="h2" sx={{ fontSize: '1.5rem', margin: 0, color: '#fff' }}>
            Tạo lại Khóa Bản quyền
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ padding: 0 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
            Bạn có chắc chắn muốn tạo lại khóa bản quyền của mình? Khóa cũ sẽ lập tức bị hủy kích hoạt và bạn sẽ cần cập nhật khóa mới trong phần mềm MT4/MT5.
          </Typography>
          <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <Button 
              onClick={() => setRegeneratingId(null)} 
              sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}
              disabled={regeneratingLoading}
            >
              Hủy bỏ
            </Button>
            <Button 
              onClick={handleRegenerateLicenseKey} 
              sx={{ 
                ...btnPrimarySx, 
                flex: 1, 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
                }
              }}
              disabled={regeneratingLoading}
            >
              {regeneratingLoading ? 'Đang tạo...' : 'Tạo lại'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default Dashboard;
