import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Coins, Plus, RefreshCw, X, CreditCard, CheckCircle2, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import { Toast } from '../components/Toast';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

interface TopUp {
  id: string;
  user_id: string;
  amount: number;
  amount_vnd: number;
  currency: string;
  status: string;
  error_message: string | null;
  payment_reference: string;
  acb_transaction_id: string | null;
  qr_code: string | null;
  qr_image_url: string | null;
  qr_image_base64: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
}

export const MyTopUps: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [topUps, setTopUps] = useState<TopUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [activeTopUp, setActiveTopUp] = useState<TopUp | null>(null);
  const [polling, setPolling] = useState(false);
  const pollingRef = useRef<any>(null);
  const [confirmingTopUpCancel, setConfirmingTopUpCancel] = useState<TopUp | null>(null);
  const [confirmingTopUpCancelLoading, setConfirmingTopUpCancelLoading] = useState(false);

  const loadTopUps = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await api.get<TopUp[]>('/api/top-ups');
      setTopUps(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to fetch top-up requests.', type: 'error' });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadTopUps();
    return () => stopPolling();
  }, []);

  const startPolling = (topUpId: string) => {
    stopPolling();
    setPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const data = await api.get<TopUp>(`/api/top-ups/${topUpId}`);
        // Update detail modal
        setActiveTopUp(data);
        // If completed or failed, show toast, refresh user, and stop polling
        if (data.status === 'completed') {
          setToast({ message: 'Top-up completed successfully!', type: 'success' });
          await refreshUser();
          loadTopUps(false);
          stopPolling();
        } else if (data.status === 'failed') {
          setToast({ message: `Top-up failed: ${data.error_message}`, type: 'error' });
          loadTopUps(false);
          stopPolling();
        } else if (data.status === 'cancelled') {
          stopPolling();
        }
      } catch (err) {
        // Suppress background errors
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
  };

  const handleOpenDetail = (topUp: TopUp) => {
    setActiveTopUp(topUp);
    if (topUp.status === 'pending') {
      startPolling(topUp.id);
    }
  };

  const handleCloseDetail = () => {
    stopPolling();
    setActiveTopUp(null);
  };

  const handleCreateTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(newAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setToast({ message: 'Please enter a valid amount greater than 0 USD.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.post<TopUp>('/api/top-ups', { amount: amountVal });
      setToast({ message: 'Top-up QR code generated successfully!', type: 'success' });
      setShowCreateModal(false);
      setNewAmount('');
      loadTopUps();
      // Open the detail modal directly for the newly created transaction
      handleOpenDetail(data);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to generate top-up QR.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelTopUp = (topUp: TopUp) => {
    setConfirmingTopUpCancel(topUp);
  };

  const handleConfirmCancelTopUp = async () => {
    if (!confirmingTopUpCancel || confirmingTopUpCancelLoading) return;
    const topUp = confirmingTopUpCancel;
    try {
      setConfirmingTopUpCancelLoading(true);
      const data = await api.post<TopUp>(`/api/top-ups/${topUp.id}/cancel`, {});
      setToast({ message: 'Top-up request cancelled successfully!', type: 'success' });
      
      // Update topUps list
      setTopUps(prev => prev.map(t => t.id === topUp.id ? data : t));
      
      // Update active detail modal if open
      if (activeTopUp && activeTopUp.id === topUp.id) {
        setActiveTopUp(data);
        stopPolling();
      }
      setConfirmingTopUpCancel(null);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to cancel top-up.', type: 'error' });
    } finally {
      setConfirmingTopUpCancelLoading(false);
    }
  };

  const handleManualRefresh = async (topUpId: string) => {
    try {
      const data = await api.get<TopUp>(`/api/top-ups/${topUpId}`);
      setActiveTopUp(data);
      if (data.status === 'completed') {
        setToast({ message: 'Top-up completed successfully!', type: 'success' });
        await refreshUser();
        loadTopUps(false);
        stopPolling();
      } else if (data.status === 'failed') {
        setToast({ message: `Top-up failed: ${data.error_message}`, type: 'error' });
        loadTopUps(false);
        stopPolling();
      } else if (data.status === 'cancelled') {
        setToast({ message: 'Top-up request has been cancelled.', type: 'info' });
        loadTopUps(false);
        stopPolling();
      } else {
        setToast({ message: 'Transaction is still pending payment.', type: 'info' });
      }
    } catch (err: any) {
      setToast({ message: 'Failed to refresh status.', type: 'error' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <XCircle size={12} />
            Cancelled
          </span>
        );
      case 'failed':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error-color)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <AlertTriangle size={12} />
            Failed
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning-color)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--warning-color)', display: 'inline-block', marginRight: '2px', boxShadow: '0 0 6px var(--warning-color)' }} />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>

      {/* Page Header */}
      <div className="glass-panel" style={{
        padding: '2rem',
        marginBottom: '2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        background: 'linear-gradient(135deg, rgba(15, 17, 23, 0.6), rgba(99, 102, 241, 0.05))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--primary-glow), #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Coins size={28} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              My Top-Up Transactions
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Top up your wallet balance using instant VietQR wire transfer.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => loadTopUps()}
            className="btn-secondary"
            style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
            style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            Top Up Wallet
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>

        {/* Balance Status Card */}
        <div className="glass-panel" style={{ gridColumn: 'span 4', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
            <CreditCard size={18} color="var(--primary-glow)" />
            Wallet Account
          </h2>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Available Balance (USD)
            </span>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '0.25rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ${user ? user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div>• Exchange Rate: <strong>1 USD = 25,000 VND</strong></div>
            <div>• Processing Type: <strong>Dynamic VietQR</strong></div>
            <div>• Wire Settlement: <strong>Automatic & Instant</strong></div>
          </div>
        </div>

        {/* Transactions list */}
        <div className="glass-panel" style={{ gridColumn: 'span 8', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', margin: 0 }}>
            Transaction History
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
              <div style={{ width: '32px', height: '32px', border: '2px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--primary-solid)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : topUps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
              <Coins size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
              <p>You have not made any top-up requests yet.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-secondary" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>Create First Request</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Created At</th>
                    <th style={{ padding: '0.75rem 0.5rem' }}>Reference</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Amount (USD)</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Amount (VND)</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {topUps.map((t) => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600 }}>
                        {t.payment_reference}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 600 }}>
                        ${t.amount.toFixed(2)}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right', fontWeight: 600, color: 'var(--success-color)', fontSize: '0.85rem' }}>
                        {t.amount_vnd.toLocaleString()} đ
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'center' }}>
                        {getStatusBadge(t.status)}
                      </td>
                      <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleOpenDetail(t)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: '28px' }}
                          >
                            Details
                          </button>
                          {t.status === 'pending' && (
                            <button
                              onClick={() => handleCancelTopUp(t)}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', height: '28px', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error-color)' }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE TOP UP */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6, 7, 10, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '420px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Top Up Wallet Balance</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTopUp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.8rem' }}>Amount in USD *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="10000"
                    required
                    placeholder="e.g. 50.00"
                    value={newAmount}
                    onChange={e => setNewAmount(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '2rem' }}
                  />
                </div>
                {newAmount && !isNaN(parseFloat(newAmount)) && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span>Conversion:</span>
                    <strong style={{ color: 'var(--success-color)' }}>
                      {(parseFloat(newAmount) * 25000).toLocaleString()} VND
                    </strong>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  {submitting ? 'Creating...' : <>Next <ArrowRight size={14} /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL & QR VIEW */}
      {activeTopUp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(6, 7, 10, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '480px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', position: 'relative' }}>

            <button
              onClick={handleCloseDetail}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, width: '100%', textAlign: 'center' }}>
              Top Up Transaction Detail
            </h2>

            {/* QR Code Container */}
            {activeTopUp.status === 'pending' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                {activeTopUp.qr_image_base64 ? (
                  <div style={{ padding: '8px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    <img
                      src={activeTopUp.qr_image_base64}
                      alt="ACB VietQR Code"
                      style={{ width: '180px', height: '180px', display: 'block' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '180px', height: '180px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'var(--text-muted)' }}>
                    Loading VietQR...
                  </div>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  Scan code using any Banking App to pay instantly.
                </span>
              </div>
            )}

            {/* Status Icons */}
            {activeTopUp.status === 'completed' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={36} />
                </div>
                <strong style={{ fontSize: '1.1rem', color: '#fff' }}>Transaction Completed Successfully</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Your wallet has been credited.</span>
              </div>
            )}

            {activeTopUp.status === 'cancelled' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={36} />
                </div>
                <strong style={{ fontSize: '1.1rem', color: '#fff' }}>Transaction Cancelled</strong>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cancelled by request.</span>
              </div>
            )}

            {activeTopUp.status === 'failed' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={36} />
                </div>
                <strong style={{ fontSize: '1.1rem', color: '#fff' }}>Transaction Failed</strong>
                {activeTopUp.error_message && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--error-color)', textAlign: 'center' }}>{activeTopUp.error_message}</span>
                )}
              </div>
            )}

            {/* Info Table */}
            <div style={{ width: '100%', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                <span>{getStatusBadge(activeTopUp.status)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount (USD):</span>
                <span style={{ fontWeight: 700 }}>${activeTopUp.amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount (VND):</span>
                <span style={{ fontWeight: 700, color: 'var(--success-color)' }}>{activeTopUp.amount_vnd.toLocaleString()} VND</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Content:</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-glow)', fontFamily: 'monospace' }}>{activeTopUp.payment_reference}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Created At:</span>
                <span>{new Date(activeTopUp.created_at).toLocaleString()}</span>
              </div>
              {activeTopUp.acb_transaction_id && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>ACB Trans ID:</span>
                  <span style={{ fontFamily: 'monospace' }}>{activeTopUp.acb_transaction_id}</span>
                </div>
              )}
              {activeTopUp.paid_at && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Settled At:</span>
                  <span>{new Date(activeTopUp.paid_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Close
              </button>
              {activeTopUp.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => handleManualRefresh(activeTopUp.id)}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <RefreshCw size={14} className={polling ? 'animate-spin' : ''} />
                    Verify Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancelTopUp(activeTopUp)}
                    className="btn-secondary"
                    style={{ flex: 1, justifyContent: 'center', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--error-color)' }}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmationDialog
        open={!!confirmingTopUpCancel}
        title="Cancel top-up request?"
        message={
          <>
            Are you sure you want to cancel this top-up request? (Reference: <strong style={{ color: '#fff' }}>{confirmingTopUpCancel?.payment_reference}</strong>)
          </>
        }
        confirmLabel="Yes, Cancel"
        cancelLabel="No"
        loading={confirmingTopUpCancelLoading}
        onConfirm={handleConfirmCancelTopUp}
        onCancel={() => {
          if (!confirmingTopUpCancelLoading) setConfirmingTopUpCancel(null);
        }}
      />
    </div>
  );
};
export default MyTopUps;
