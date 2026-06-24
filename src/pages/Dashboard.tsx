import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Download, ShoppingBag, ShieldCheck, RefreshCw, Info, Key, Copy, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { activeSortedVariants, formatVariantDuration } from '../utils/variants';

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

  const [bindInputs, setBindInputs] = useState<Record<string, string>>({});
  const [bindErrors, setBindErrors] = useState<Record<string, string>>({});
  const [bindingId, setBindingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [removingAccountKey, setRemovingAccountKey] = useState<string | null>(null);
  const [copyingKeyId, setCopyingKeyId] = useState<string | null>(null);

  // States for renewal flow
  const [renewingOrder, setRenewingOrder] = useState<Order | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [renewPaymentMethod, setRenewPaymentMethod] = useState<'payos' | 'momo'>('payos');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setToast({ message: 'Payment completed successfully! Your LicenseKey is available from the Copy LicenseKey button.', type: 'success' });
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
      setBindErrors(prev => ({ ...prev, [licenseId]: 'Account number must contain digits only.' }));
    } else if (val.length < 4 || val.length > 12) {
      setBindErrors(prev => ({ ...prev, [licenseId]: 'Account number must be between 4 and 12 digits.' }));
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
      setToast({ message: 'This MT4/MT5 account is already bound to this license.', type: 'error' });
      return;
    }

    try {
      setBindingId(licenseId);
      await api.post('/api/license/bind', { license_id: licenseId, mt5_account: val });
      setToast({ message: 'License successfully bound to MT4/MT5 account.', type: 'success' });
      setBindInputs(prev => ({ ...prev, [licenseId]: '' }));
      loadOrders();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to bind account.', type: 'error' });
    } finally {
      setBindingId(null);
    }
  };

  const handleResetLicense = async (licenseId: string) => {
    try {
      setResettingId(licenseId);
      await api.post('/api/license/reset', { license_id: licenseId });
      setToast({ message: 'License bindings cleared successfully.', type: 'success' });
      setBindInputs(prev => ({ ...prev, [licenseId]: '' }));
      loadOrders();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to reset license bindings.', type: 'error' });
    } finally {
      setResettingId(null);
    }
  };

  const handleRemoveAccountBinding = async (licenseId: string, account: string) => {
    const loadingKey = `${licenseId}:${account}`;
    try {
      setRemovingAccountKey(loadingKey);
      await api.delete(`/api/license/${licenseId}/bindings/${encodeURIComponent(account)}`);
      setToast({ message: 'MT4/MT5 account binding removed successfully.', type: 'success' });
      loadOrders();
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Failed to remove account binding.', type: 'error' });
    } finally {
      setRemovingAccountKey(null);
    }
  };

  const handleCopyLicenseKey = async (licenseId: string) => {
    try {
      setCopyingKeyId(licenseId);
      const data = await api.get<{ api_key: string }>(`/api/license/${licenseId}/key`);
      await navigator.clipboard.writeText(data.api_key);
      setToast({ message: 'LicenseKey copied to clipboard.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Unable to copy LicenseKey.', type: 'error' });
    } finally {
      setCopyingKeyId(null);
    }
  };

  const calculateNewExpiryDate = (expiresAtStr: string | null, variant: { is_lifetime: boolean; duration_days: number | null; duration_months: number | null }) => {
    if (variant.is_lifetime) {
      return 'Lifetime (Never Expires)';
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
      if (renewPaymentMethod === 'payos') {
        const response = await api.post<{ checkout_url: string; order_code: number; purchase_id: string }>(
          '/api/purchases/checkout-payment',
          {
            product_id: renewingOrder.product.id,
            variant_id: selectedVariantId,
            cancel_url: window.location.href,
            return_url: `${window.location.origin}/dashboard?payment=success`
          }
        );
        window.location.href = response.checkout_url;
      } else {
        setToast({ message: "Processing MoMo payment...", type: "info" });
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
        setToast({ message: "License renewed successfully!", type: "success" });
        setRenewingOrder(null);
        setSelectedVariantId('');
        await loadOrders();
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Checkout failed.', type: 'error' });
    } finally {
      setRenewing(false);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<Order[]>('/api/orders/my-orders');
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchased tools ledger.');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = async (orderId: string) => {
    const isExpanded = !!expandedOrders[orderId];
    if (!isExpanded && !orderDetails[orderId]) {
      try {
        const detail = await api.get<OrderDetail>(`/api/orders/${orderId}`);
        setOrderDetails(prev => ({ ...prev, [orderId]: detail.purchases }));
      } catch (err: any) {
        setToast({ message: err.message || 'Failed to load order details.', type: 'error' });
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
      setToast({ message: 'Secure file download completed successfully.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to securely download file.', type: 'error' });
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(99, 102, 241, 0.1)',
          borderTopColor: 'var(--primary-solid)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Header Profile Dashboard */}
      <div className="glass-panel" style={{
        padding: '2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        border: '1px solid rgba(99, 102, 241, 0.15)'
      }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>
            Client Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Logged in as: <strong style={{ color: '#fff' }}>{user?.full_name}</strong> ({user?.email})
          </p>
        </div>
        <button onClick={loadOrders} className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={14} />
          Sync Orders
        </button>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShoppingBag size={20} color="var(--primary-solid)" />
        My Orders
      </h2>

      {error && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error-color)', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Info size={40} color="var(--text-muted)" style={{ marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>
            You haven't purchased any quantitative trading tools yet.
          </p>
          <Link to="/" className="btn-primary">
            Explore Storefront
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            const remainingSlots = Math.max(0, 3 - boundAccounts.length);
            return (
              <div key={order.id} className="glass-panel" style={{
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                <div className="dashboard-purchase-item" style={{ width: '100%' }}>
                  {/* Thumbnail */}
                  <div style={{ height: '80px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img
                      src={prod.image_url}
                      alt={prod.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  {/* Details */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                        {prod.title}
                      </h3>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--panel-border)'
                      }}>
                        {prod.category}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Order created on: {new Date(order.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <p style={{ color: 'var(--success-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem' }}>
                      <ShieldCheck size={12} />
                      Verified & cryptographically signed download license.
                    </p>
                  </div>

                  {/* CTA Action */}
                  <div className="purchase-cta" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                      onClick={() => handleDownload(prod.id, prod.title)}
                      disabled={isExpired || downloadingId === prod.id}
                      className="btn-primary"
                      style={{
                        padding: '0.75rem 1.25rem',
                        fontSize: '0.9rem',
                        opacity: isExpired ? 0.5 : 1,
                        cursor: isExpired ? 'not-allowed' : 'pointer'
                      }}
                      title={isExpired ? "License has expired. Please renew to download." : "Download quantitative bot tool"}
                    >
                      {downloadingId === prod.id ? (
                        <>
                          <div style={{
                            width: '14px',
                            height: '14px',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            borderTopColor: '#fff',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Secure Download
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* License Section */}
                {order.license && (
                  <div style={{
                    padding: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                      <Key size={16} color="var(--primary-solid)" />
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        License & Active Bindings
                      </h4>
                    </div>

                    {isExpired && (
                      <div style={{
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
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--error-color)' }}></span>
                          License Deactivated - Expiration Alert
                        </div>
                        <div>
                          Your active trading license for this bot has expired. MT4/MT5 bindings and device activations are locked. Please renew below to reactivate.
                        </div>
                      </div>
                    )}

                    {isExpiringSoon && (
                      <div style={{
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
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--warning-color)' }}></span>
                          License Expiring Soon ({daysRemaining} days left)
                        </div>
                        <div>
                          Your trading license expires on {expiresAt ? expiresAt.toLocaleDateString() : ''}. Renew early to extend coverage and keep your automated strategies running.
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {/* Left: Key and Expiry */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: '1 1 250px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>License Key:</span>
                          <code style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--primary-solid)', fontWeight: 600, fontSize: '0.8rem', wordBreak: 'break-all' }}>
                            {order.license.key_recoverable ? 'Stored encrypted' : 'Legacy key unavailable'}
                          </code>
                          {order.license.key_recoverable ? (
                            <button
                              onClick={() => handleCopyLicenseKey(order.license!.id)}
                              disabled={copyingKeyId === order.license.id}
                              className="btn-secondary"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Copy size={13} /> {copyingKeyId === order.license.id ? 'Copying...' : 'Copy LicenseKey'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cannot recover this legacy key.</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Raw <code>lt_...</code> LicenseKey is fetched only when you click Copy. License ID / Order ID are not credentials.
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Status: <span style={{ color: isExpired ? 'var(--error-color)' : isExpiringSoon ? 'var(--warning-color)' : 'var(--success-color)', fontWeight: 700 }}>
                            {isLifetime ? 'ACTIVE' : isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING SOON' : 'ACTIVE'}
                          </span> | {isLifetime ? 'Lifetime (Never Expires)' : `Expires: ${expiresAt ? expiresAt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}`} {!isLifetime && !isExpired && `(${daysRemaining} days left)`}
                        </div>
                        <button
                          onClick={() => handleOpenRenewModal(order)}
                          className="btn-primary"
                          style={{
                            padding: '0.4rem 0.85rem',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            marginTop: '0.5rem',
                            background: isExpired ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.05)',
                            border: isExpired ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                            alignSelf: 'flex-start',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer',
                            boxShadow: isExpired ? '0 0 15px 1px rgba(99, 102, 241, 0.4)' : 'none'
                          }}
                        >
                          <RefreshCw size={12} />
                          {isExpired ? 'Renew License Now' : 'Renew / Extend License'}
                        </button>
                      </div>

                      {/* Right: Bindings and Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: '1 1 280px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Bound MT4/MT5:</span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{remainingSlots} of 3 slots remaining</span>
                          </div>
                          {boundAccounts.length > 0 ? (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {boundAccounts.map((account) => (
                                <span key={account} style={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  color: 'var(--success-color)',
                                  padding: '0.2rem 0.35rem 0.2rem 0.6rem',
                                  borderRadius: '20px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  border: '1px solid rgba(16, 185, 129, 0.2)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  Account: {account}
                                  <button
                                    type="button"
                                    title={`Remove account ${account}`}
                                    aria-label={`Remove account ${account}`}
                                    onClick={() => handleRemoveAccountBinding(order.license!.id, account)}
                                    disabled={isExpired || removingAccountKey === `${order.license!.id}:${account}`}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'var(--success-color)',
                                      cursor: (isExpired || removingAccountKey === `${order.license!.id}:${account}`) ? 'not-allowed' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '0.05rem',
                                      opacity: (isExpired || removingAccountKey === `${order.license!.id}:${account}`) ? 0.45 : 0.85
                                    }}
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No account bound yet.</span>
                          )}
                        </div>

                        {remainingSlots > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                              <label htmlFor={`bind-input-${order.license.id}`} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', minWidth: '90px' }}>Bind Account:</label>
                              <input
                                id={`bind-input-${order.license.id}`}
                                type="text"
                                className="form-control"
                                placeholder={isExpired ? "License expired" : "4-12 digit account no."}
                                value={bindInputs[order.license.id] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setBindInputs(prev => ({ ...prev, [order.license!.id]: val }));
                                  validateBindingInput(order.license!.id, val);
                                }}
                                disabled={isExpired}
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.85rem',
                                  borderRadius: '6px',
                                  borderColor: bindErrors[order.license.id] ? 'var(--error-color)' : 'var(--panel-border)',
                                  width: '160px',
                                  outline: bindErrors[order.license.id] ? 'none' : undefined,
                                  opacity: isExpired ? 0.5 : 1
                                }}
                              />
                              <button
                                onClick={() => handleBindLicense(order.license!.id)}
                                disabled={isExpired || !bindInputs[order.license.id] || !!bindErrors[order.license.id] || bindingId === order.license.id}
                                className="btn-primary"
                                style={{
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.8rem',
                                  borderRadius: '6px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: isExpired ? 0.5 : 1,
                                  cursor: isExpired ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {bindingId === order.license.id ? 'Binding...' : 'Bind Account'}
                              </button>
                            </div>
                            {bindErrors[order.license.id] && (
                              <div style={{ color: 'var(--error-color)', fontSize: '0.75rem', marginLeft: '95px' }}>
                                {bindErrors[order.license.id]}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                          <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                            Device ID: {order.license.device_id || 'No device registered yet'}
                          </div>

                          {(boundAccounts.length > 0 || order.license.device_id) && (
                            <button
                              onClick={() => handleResetLicense(order.license!.id)}
                              disabled={isExpired || resettingId === order.license.id}
                              className="btn-secondary"
                              style={{
                                padding: '0.2rem 0.5rem',
                                fontSize: '0.75rem',
                                borderRadius: '4px',
                                background: 'transparent',
                                borderColor: 'rgba(239, 68, 68, 0.3)',
                                color: 'var(--error-color)',
                                height: '24px',
                                transition: 'all 0.2s',
                                opacity: isExpired ? 0.5 : 1,
                                cursor: isExpired ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {resettingId === order.license.id ? 'Resetting...' : 'Reset License'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* View Details Accordion */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                  <button
                    onClick={() => toggleOrderDetails(order.id)}
                    className="btn-secondary"
                    style={{
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.8rem',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}
                  >
                    <span>{expandedOrders[order.id] ? 'Hide Purchase History' : 'View Purchase History'}</span>
                  </button>

                  {expandedOrders[order.id] && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="animate-fade-in">
                      {orderDetails[order.id] ? (
                        orderDetails[order.id].length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {orderDetails[order.id].map((p) => (
                              <div key={p.id} style={{
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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                                    {p.variant_name || 'Standard Package'}
                                  </span>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Date: {new Date(p.purchase_date).toLocaleString()}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                  <span style={{ fontSize: '0.85rem', color: '#e0a96d', fontWeight: 700 }}>
                                    ${p.amount_paid.toFixed(2)}
                                  </span>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '12px',
                                    textTransform: 'uppercase',
                                    background: p.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: p.status === 'completed' ? 'var(--success-color)' : p.status === 'pending' ? 'var(--warning-color)' : 'var(--error-color)',
                                    border: p.status === 'completed' ? '1px solid rgba(16, 185, 129, 0.2)' : p.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.2)' : p.status === 'pending' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                                  }}>
                                    {p.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No purchases found for this order.</p>
                        )
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            border: '2px solid rgba(255, 255, 255, 0.2)',
                            borderTopColor: 'var(--primary-solid)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
                          Loading history...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Renewal / Extension Modal */}
      {showRenewModal && renewingOrder && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(6, 7, 10, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '480px', width: '100%', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <RefreshCw size={24} color="var(--primary-solid)" />
              Extend / Renew License
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Choose a licensing package to renew or extend access for <strong>{renewingOrder.product.title}</strong>.
            </p>

            {/* Current Expiry info */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--panel-border)', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Current Expiry:</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>
                  {renewingOrder.license?.expires_at 
                    ? new Date(renewingOrder.license.expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                    : 'Lifetime (Never Expires)'}
                </span>
              </div>
              
              {/* Future Estimated Expiry */}
              {(() => {
                const selectedVariant = renewingOrder.product.variants?.find(v => v.id === selectedVariantId);
                if (!selectedVariant) return null;
                const newExpiry = calculateNewExpiryDate(renewingOrder.license?.expires_at || null, selectedVariant);
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Estimated New Expiry:</span>
                    <span style={{ color: 'var(--success-color)', fontWeight: 700 }}>
                      {newExpiry}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Variants selection */}
            {activeSortedVariants(renewingOrder.product.variants).length > 0 ? (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Select Package
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', paddingRight: '0.25rem' }} role="radiogroup" aria-label="Renewal Package Selector">
                  {activeSortedVariants(renewingOrder.product.variants).map(v => {
                    const isSelected = selectedVariantId === v.id;
                    const vndEstimate = (v.price * 25000).toLocaleString('vi-VN');
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #e0a96d' : '1px solid rgba(255,255,255,0.06)',
                          background: isSelected ? 'rgba(224, 169, 109, 0.06)' : 'rgba(255,255,255,0.01)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minHeight: '48px'
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setSelectedVariantId(v.id); }}
                      >
                        <input
                          type="radio"
                          id={`renew-variant-${v.id}`}
                          name="renew-variant"
                          checked={isSelected}
                          onChange={() => setSelectedVariantId(v.id)}
                          style={{ cursor: 'pointer', accentColor: '#e0a96d' }}
                        />
                        <label htmlFor={`renew-variant-${v.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flex: 1, margin: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{v.name}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {formatVariantDuration(v)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#e0a96d' }}>
                              ${v.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              ≈ {vndEstimate} VND
                            </span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                No active variants found for this product.
              </p>
            )}

            {/* Select Payment Method */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Payment Method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }} role="radiogroup" aria-label="Payment Method Selector">
                {/* PayOS card */}
                <div 
                  onClick={() => setRenewPaymentMethod('payos')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: renewPaymentMethod === 'payos' ? '1px solid var(--primary-solid)' : '1px solid var(--panel-border)',
                    background: renewPaymentMethod === 'payos' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    minHeight: '40px',
                    transition: 'all 0.2s ease'
                  }}
                  role="radio"
                  aria-checked={renewPaymentMethod === 'payos'}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setRenewPaymentMethod('payos'); }}
                >
                  <input 
                    type="radio" 
                    id="renew-payos-radio"
                    name="renew-payment-method" 
                    checked={renewPaymentMethod === 'payos'} 
                    onChange={() => setRenewPaymentMethod('payos')}
                    style={{ cursor: 'pointer', accentColor: 'var(--primary-solid)' }} 
                  />
                  <label htmlFor="renew-payos-radio" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, margin: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>PayOS (VietQR / Credit Card)</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scan VietQR or pay with credit cards</span>
                  </label>
                </div>

                {/* MoMo card */}
                <div 
                  onClick={() => setRenewPaymentMethod('momo')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    border: renewPaymentMethod === 'momo' ? '1px solid var(--primary-solid)' : '1px solid var(--panel-border)',
                    background: renewPaymentMethod === 'momo' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                    cursor: 'pointer',
                    minHeight: '40px',
                    transition: 'all 0.2s ease'
                  }}
                  role="radio"
                  aria-checked={renewPaymentMethod === 'momo'}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setRenewPaymentMethod('momo'); }}
                >
                  <input 
                    type="radio" 
                    id="renew-momo-radio"
                    name="renew-payment-method" 
                    checked={renewPaymentMethod === 'momo'} 
                    onChange={() => setRenewPaymentMethod('momo')}
                    style={{ cursor: 'pointer', accentColor: 'var(--primary-solid)' }} 
                  />
                  <label htmlFor="renew-momo-radio" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1, margin: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>MoMo Wallet</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scan MoMo QR code (Demo Checkout)</span>
                  </label>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={12} color="var(--success-color)" />
              Fixed exchange rate: 1 USD = 25,000 VND. Webhooks verify and process payments.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowRenewModal(false)} 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={renewing}
              >
                Cancel
              </button>
              <button 
                onClick={handleRenewCheckout} 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={renewing || !selectedVariantId}
              >
                {renewing ? 'Processing...' : (renewPaymentMethod === 'payos' ? 'Pay Now (Redirect)' : 'Confirm Pay')}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
export default Dashboard;
