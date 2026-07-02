import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Toast } from '../components/Toast';
import { User, Wallet, Save, ArrowUpRight, Calendar, MapPin, Phone, X, RefreshCw } from 'lucide-react';

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
          setToast({ message: `Top-up of $${data.amount} USD completed successfully!`, type: 'success' });
          await refreshUser();
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          setToast({ message: `Top-up transaction failed: ${data.error_message || 'Unknown error'}`, type: 'error' });
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
        setToast({ message: `Top-up completed successfully!`, type: 'success' });
        await refreshUser();
        handleCloseTopUp();
      } else if (data.status === 'failed') {
        setToast({ message: `Top-up failed: ${data.error_message}`, type: 'error' });
        handleCloseTopUp();
      } else {
        setToast({ message: 'Transaction is still pending payment.', type: 'info' });
      }
    } catch (err) {
      setToast({ message: 'Failed to refresh status.', type: 'error' });
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Please sign in to view your profile settings.</p>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      setToast({ message: 'Full name must be at least 2 characters long.', type: 'error' });
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
      setToast({ message: 'Profile details updated successfully.', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to update profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTransaction = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setToast({ message: 'Please enter a valid amount greater than $0.', type: 'error' });
      return;
    }

    try {
      setTransacting(true);
      const data = await api.post<any>('/api/top-ups', { amount: numAmount });
      setActiveTopUp(data);
      setAmount('');
      setToast({ message: 'Top-up QR code generated successfully. Please pay to proceed.', type: 'success' });
      startPolling(data.id);
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to generate QR Code.', type: 'error' });
    } finally {
      setTransacting(false);
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
        gap: '1.5rem',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        background: 'linear-gradient(135deg, rgba(15, 17, 23, 0.6), rgba(99, 102, 241, 0.05))'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-glow), #ec4899)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: '1.5rem',
          color: '#fff',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)'
        }}>
          {user.full_name ? user.full_name.trim().charAt(0).toUpperCase() : 'U'}
        </div>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            My Account Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage your personal profile, contact information, and simulated wallet balance.
          </p>
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '2rem'
      }}>
        {/* Left Column: Account Profile */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', margin: 0 }}>
            <User size={18} color="var(--primary-solid)" />
            Profile Details
          </h2>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Email Address (ReadOnly)
              </label>
              <input 
                type="text" 
                value={user.email} 
                disabled 
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-muted)',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="fullNameInput" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Full Name
              </label>
              <input 
                id="fullNameInput"
                type="text" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--panel-border)',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.9rem',
                  color: '#fff',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-solid)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--panel-border)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="phoneInput" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  id="phoneInput"
                  type="text" 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    fontSize: '0.9rem',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-solid)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--panel-border)'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="dobInput" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Date of Birth
              </label>
              <div style={{ position: 'relative' }}>
                <Calendar size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  id="dobInput"
                  type="date" 
                  value={dob} 
                  onChange={(e) => setDob(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    fontSize: '0.9rem',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    colorScheme: 'dark'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-solid)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--panel-border)'}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="addressInput" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Address
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '1.25rem' }} />
                <textarea 
                  id="addressInput"
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your street address"
                  rows={3}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem 0.75rem 2.5rem',
                    fontSize: '0.9rem',
                    color: '#fff',
                    outline: 'none',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary-solid)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--panel-border)'}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                fontSize: '0.9rem',
                width: '100%',
                cursor: 'pointer'
              }}
            >
              {saving ? (
                <>
                  <div style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderTopColor: '#fff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                  Saving changes...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Wallet Transactions */}
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.75rem', margin: 0 }}>
            <Wallet size={18} color="var(--primary-solid)" />
            Simulated Wallet
          </h2>

          {/* Current Balance Display */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(236, 72, 153, 0.05))',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '16px',
            padding: '1.5rem',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Current Available Balance
            </span>
            <div style={{ 
              fontSize: '2.25rem', 
              fontWeight: 900, 
              color: '#fff', 
              marginTop: '0.5rem',
              background: 'linear-gradient(to right, #fff, #a5b4fc, #f472b6)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent'
            }}>
              ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {/* Transaction Section */}
          {activeTopUp ? (
            <div style={{
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
              <button 
                onClick={handleCloseTopUp}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <X size={16} />
              </button>
              
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--primary-glow)' }}>
                ACB VietQR Payment
              </h3>
              
              {activeTopUp.qr_image_base64 ? (
                <div style={{
                  padding: '8px',
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  <img 
                    src={activeTopUp.qr_image_base64} 
                    alt="ACB VietQR" 
                    style={{ width: '160px', height: '160px', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ width: '160px', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                  Loading QR Code...
                </div>
              )}
              
              <div style={{ width: '100%', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount (USD):</span>
                  <span style={{ fontWeight: 700 }}>${activeTopUp.amount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Amount (VND):</span>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>{activeTopUp.amount_vnd.toLocaleString()} VND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Payment Content:</span>
                  <span style={{ fontWeight: 700, color: '#a5b4fc', fontFamily: 'monospace' }}>{activeTopUp.payment_reference}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Status:</span>
                  <span style={{ 
                    fontWeight: 700,
                    color: activeTopUp.status === 'completed' ? '#34d399' : activeTopUp.status === 'failed' ? '#f87171' : '#fbbf24',
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    background: activeTopUp.status === 'completed' ? 'rgba(52, 211, 153, 0.1)' : activeTopUp.status === 'failed' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {activeTopUp.status}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <RefreshCw size={14} className={polling ? 'animate-spin' : ''} />
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleCloseTopUp}
                  style={{
                    flex: 1,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    color: '#f87171',
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
                Please transfer correct amount and content to top up automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="transactionAmount" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Transaction Amount ($)
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem' }}>$</span>
                  <input 
                    id="transactionAmount"
                    type="number" 
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--panel-border)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem 0.75rem 2rem',
                      fontSize: '1rem',
                      color: '#fff',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary-solid)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--panel-border)'}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', width: '100%' }}>
                <button
                  type="button"
                  disabled={transacting}
                  onClick={() => handleTransaction()}
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    borderRadius: '8px',
                    color: '#34d399',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    width: '100%',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; }}
                >
                  <ArrowUpRight size={16} />
                  Top Up
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Profile;
