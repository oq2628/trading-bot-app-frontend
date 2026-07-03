import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Toast } from '../components/Toast';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { CheckCircle2, XCircle, AlertTriangle, Coins, RefreshCw, Plus, CreditCard, ArrowRight, X } from 'lucide-react';
import { Box, Container, Typography, Button, InputBase, Table, TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle, DialogContent, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, btnPrimarySx, btnSecondarySx } from '../theme';

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
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: 'success.main', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <CheckCircle2 size={12} />
            Completed
          </Box>
        );
      case 'cancelled':
        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.05)', color: 'text.secondary', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <XCircle size={12} />
            Cancelled
          </Box>
        );
      case 'failed':
        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', color: 'error.main', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <AlertTriangle size={12} />
            Failed
          </Box>
        );
      default:
        return (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.2rem 0.5rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: 'warning.main', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
            <Box sx={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block', marginRight: '2px', boxShadow: '0 0 6px #f59e0b' }} />
            Pending
          </Box>
        );
    }
  };

  const inputSx = {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#fff',
    fontSize: '1rem',
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
    }
  };

  return (
    <>
      <Container
        maxWidth="xl"
        sx={{
          maxWidth: '1600px !important',
          paddingBottom: '4rem',
          animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'translateY(10px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* Page Header */}
        <Box
          sx={{
            ...glassPanelSx,
            padding: '2rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            border: '1px solid rgba(99, 102, 241, 0.15)',
            background: 'linear-gradient(135deg, rgba(15, 17, 23, 0.6), rgba(99, 102, 241, 0.05))'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <Box sx={{
              width: '60px',
              height: '60px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
              flexShrink: 0
            }}>
              <Coins size={28} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                My Top-Up Transactions
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
                Top up your wallet balance using instant VietQR wire transfer.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: '0.75rem' }}>
            <Button
              onClick={() => loadTopUps()}
              sx={{
                ...btnSecondarySx,
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={15} />
              Refresh
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              sx={{
                ...btnPrimarySx,
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              Top Up Wallet
            </Button>
          </Box>
        </Box>

        <Grid container spacing={4}>
          {/* Balance Status Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ ...glassPanelSx, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', height: 'fit-content' }}>
              <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem' }}>
                <CreditCard size={18} color="#6366f1" />
                Wallet Account
              </Typography>
              <Box>
                <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Available Balance (USD)
                </Typography>
                <Typography sx={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '0.25rem', background: 'linear-gradient(to right, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  ${user ? user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                </Typography>
              </Box>
              <Box sx={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', fontSize: '0.825rem', color: 'text.secondary', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Box>• Exchange Rate: <Typography component="strong" sx={{ color: '#fff', fontSize: '0.825rem', fontWeight: 700 }}>1 USD = 25,000 VND</Typography></Box>
                <Box>• Processing Type: <Typography component="strong" sx={{ color: '#fff', fontSize: '0.825rem', fontWeight: 700 }}>Dynamic VietQR</Typography></Box>
                <Box>• Wire Settlement: <Typography component="strong" sx={{ color: '#fff', fontSize: '0.825rem', fontWeight: 700 }}>Automatic & Instant</Typography></Box>
              </Box>
            </Box>
          </Grid>

          {/* Transactions list */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ ...glassPanelSx, padding: '2rem', height: '100%' }}>
              <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', margin: 0 }}>
                Transaction History
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                  <CircularProgress size={32} />
                </Box>
              ) : topUps.length === 0 ? (
                <Box sx={{ textAlign: 'center', padding: '4rem 0', color: 'text.disabled' }}>
                  <Coins size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <Typography sx={{ color: 'text.secondary' }}>You have not made any top-up requests yet.</Typography>
                  <Button onClick={() => setShowCreateModal(true)} sx={{ ...btnSecondarySx, marginTop: '1rem', fontSize: '0.85rem' }}>Create First Request</Button>
                </Box>
              ) : (
                <Box sx={{ overflowX: 'auto', width: '100%' }}>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <TableCell sx={{ padding: '0.75rem 0.5rem', color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: 'none' }}>Created At</TableCell>
                        <TableCell sx={{ padding: '0.75rem 0.5rem', color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: 'none' }}>Reference</TableCell>
                        <TableCell align="right" sx={{ padding: '0.75rem 0.5rem', color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: 'none' }}>Amount (USD)</TableCell>
                        <TableCell align="right" sx={{ padding: '0.75rem 0.5rem', color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: 'none' }}>Amount (VND)</TableCell>
                        <TableCell align="center" sx={{ padding: '0.75rem 0.5rem', color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: 'none' }}>Status</TableCell>
                        <TableCell align="right" sx={{ padding: '0.75rem 0.5rem', color: 'text.secondary', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: 'none' }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topUps.map((t) => (
                        <TableRow key={t.id} sx={{ borderBottom: '1px solid rgba(255,255,255,0.02)', '&:hover': { background: 'rgba(255,255,255,0.01)' } }}>
                          <TableCell sx={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', color: 'text.secondary', borderBottom: 'none' }}>
                            {new Date(t.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </TableCell>
                          <TableCell sx={{ padding: '0.85rem 0.5rem', fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 600, borderBottom: 'none' }}>
                            {t.payment_reference}
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '0.85rem 0.5rem', fontWeight: 600, borderBottom: 'none' }}>
                            ${t.amount.toFixed(2)}
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: 'success.main', fontSize: '0.85rem', borderBottom: 'none' }}>
                            {t.amount_vnd.toLocaleString()} đ
                          </TableCell>
                          <TableCell align="center" sx={{ padding: '0.85rem 0.5rem', borderBottom: 'none' }}>
                            {getStatusBadge(t.status)}
                          </TableCell>
                          <TableCell align="right" sx={{ padding: '0.85rem 0.5rem', borderBottom: 'none' }}>
                            <Box sx={{ display: 'inline-flex', gap: '0.5rem' }}>
                              <Button
                                onClick={() => handleOpenDetail(t)}
                                sx={{
                                  ...btnSecondarySx,
                                  padding: '0.35rem 0.75rem',
                                  fontSize: '0.75rem',
                                  height: '28px',
                                  borderRadius: '6px'
                                }}
                              >
                                Details
                              </Button>
                              {t.status === 'pending' && (
                                <Button
                                  onClick={() => handleCancelTopUp(t)}
                                  sx={{
                                    ...btnSecondarySx,
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.75rem',
                                    height: '28px',
                                    borderRadius: '6px',
                                    borderColor: 'rgba(239,68,68,0.2)',
                                    color: 'error.main',
                                    '&:hover': {
                                      background: 'rgba(239, 68, 68, 0.08)',
                                      borderColor: 'rgba(239, 68, 68, 0.3)'
                                    }
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* MODAL: CREATE TOP UP */}
      <Dialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '420px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.9)',
              backgroundImage: 'none',
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff' }}>
            Top Up Wallet Balance
          </Typography>
          <Box component="button" onClick={() => setShowCreateModal(false)} sx={{ background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>

        <DialogContent sx={{ padding: 0 }}>
          <Box component="form" onSubmit={handleCreateTopUp} sx={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Box>
              <Typography component="label" sx={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary', marginBottom: '0.5rem' }}>
                Amount in USD *
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <Typography component="span" sx={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'text.disabled', zIndex: 2 }}>$</Typography>
                <InputBase
                  type="number"
                  inputProps={{ step: '0.01', min: '1', max: '10000' }}
                  required
                  placeholder="e.g. 50.00"
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  sx={{
                    ...inputSx,
                    paddingLeft: '2rem'
                  }}
                />
              </Box>
              {newAmount && !isNaN(parseFloat(newAmount)) && (
                <Box sx={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Typography component="span" sx={{ fontSize: '0.8rem' }}>Conversion:</Typography>
                  <Typography component="strong" sx={{ color: 'success.main', fontSize: '0.8rem', fontWeight: 700 }}>
                    {(parseFloat(newAmount) * 25000).toLocaleString()} VND
                  </Typography>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <Button type="button" onClick={() => setShowCreateModal(false)} sx={{ ...btnSecondarySx, flex: 1, justifyContent: 'center' }}>Cancel</Button>
              <Button type="submit" disabled={submitting} sx={{ ...btnPrimarySx, flex: 1, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {submitting ? 'Creating...' : <>Next <ArrowRight size={14} /></>}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* MODAL: DETAIL & QR VIEW */}
      <Dialog
        open={!!activeTopUp}
        onClose={handleCloseDetail}
        slotProps={{
          paper: {
            sx: {
              ...glassPanelSx,
              padding: '2rem',
              maxWidth: '480px',
              width: '100%',
              background: 'rgba(20, 22, 33, 0.9)',
              backgroundImage: 'none',
            }
          }
        }}
      >
        <DialogTitle sx={{ padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: '1.25rem', fontFamily: '"Outfit", sans-serif' }}>
          <Typography variant="h2" sx={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#fff', textAlign: 'center', width: '100%' }}>
            Top Up Transaction Detail
          </Typography>
          <Box component="button" onClick={handleCloseDetail} sx={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'text.secondary', display: 'flex', '&:hover': { color: '#fff' } }}>
            <X size={20} />
          </Box>
        </DialogTitle>

        {activeTopUp && (
          <DialogContent sx={{ padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
            {/* QR Code Container */}
            {activeTopUp.status === 'pending' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
                {activeTopUp.qr_image_base64 ? (
                  <Box sx={{ padding: '8px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                    <Box
                      component="img"
                      src={activeTopUp.qr_image_base64}
                      alt="ACB VietQR Code"
                      sx={{ width: '180px', height: '180px', display: 'block' }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ width: '180px', height: '180px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', color: 'text.disabled' }}>
                    Loading VietQR...
                  </Box>
                )}
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center' }}>
                  Scan code using any Banking App to pay instantly.
                </Typography>
              </Box>
            )}

            {/* Status Icons */}
            {activeTopUp.status === 'completed' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <Box sx={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={36} />
                </Box>
                <Typography component="strong" sx={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Transaction Completed Successfully</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Your wallet has been credited.</Typography>
              </Box>
            )}

            {activeTopUp.status === 'cancelled' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <Box sx={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <XCircle size={36} />
                </Box>
                <Typography component="strong" sx={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Transaction Cancelled</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Cancelled by request.</Typography>
              </Box>
            )}

            {activeTopUp.status === 'failed' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem 0' }}>
                <Box sx={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'error.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={36} />
                </Box>
                <Typography component="strong" sx={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>Transaction Failed</Typography>
                {activeTopUp.error_message && (
                  <Typography sx={{ fontSize: '0.85rem', color: 'error.main', textAlign: 'center' }}>{activeTopUp.error_message}</Typography>
                )}
              </Box>
            )}

            {/* Info Table */}
            <Box sx={{ width: '100%', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Status:</Typography>
                <Box>{getStatusBadge(activeTopUp.status)}</Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Amount (USD):</Typography>
                <Typography component="span" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>${activeTopUp.amount.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Amount (VND):</Typography>
                <Typography component="span" sx={{ fontWeight: 700, color: 'success.main', fontSize: '0.875rem' }}>{activeTopUp.amount_vnd.toLocaleString()} VND</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Payment Content:</Typography>
                <Typography component="span" sx={{ fontWeight: 700, color: 'primary.main', fontFamily: 'monospace', fontSize: '0.875rem' }}>{activeTopUp.payment_reference}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Created At:</Typography>
                <Typography component="span" sx={{ fontSize: '0.875rem' }}>{new Date(activeTopUp.created_at).toLocaleString()}</Typography>
              </Box>
              {activeTopUp.acb_transaction_id && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.35rem' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>ACB Trans ID:</Typography>
                  <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{activeTopUp.acb_transaction_id}</Typography>
                </Box>
              )}
              {activeTopUp.paid_at && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>Settled At:</Typography>
                  <Typography component="span" sx={{ fontSize: '0.875rem' }}>{new Date(activeTopUp.paid_at).toLocaleString()}</Typography>
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: '0.75rem', width: '100%', marginTop: '0.5rem' }}>
              <Button
                type="button"
                onClick={handleCloseDetail}
                sx={{
                  ...btnSecondarySx,
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                Close
              </Button>
              {activeTopUp.status === 'pending' && (
                <>
                  <Button
                    type="button"
                    onClick={() => handleManualRefresh(activeTopUp.id)}
                    sx={{
                      ...btnPrimarySx,
                      flex: 1,
                      justifyContent: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <RefreshCw size={14} className={polling ? 'animate-spin' : ''} />
                    Verify Payment
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleCancelTopUp(activeTopUp)}
                    sx={{
                      ...btnSecondarySx,
                      flex: 1,
                      justifyContent: 'center',
                      borderColor: 'rgba(239,68,68,0.2)',
                      color: 'error.main',
                      '&:hover': {
                        background: 'rgba(239, 68, 68, 0.08)',
                        borderColor: 'rgba(239, 68, 68, 0.3)'
                      }
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          </DialogContent>
        )}
      </Dialog>

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
    </>
  );
};

export default MyTopUps;
