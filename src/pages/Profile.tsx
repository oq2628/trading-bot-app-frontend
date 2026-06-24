import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Toast } from '../components/Toast';
import { User, Wallet, Save, ArrowUpRight, ArrowDownLeft, Calendar, MapPin, Phone } from 'lucide-react';

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

  const handleTransaction = async (type: 'deposit' | 'withdraw') => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setToast({ message: 'Please enter a valid amount greater than $0.', type: 'error' });
      return;
    }

    let newBalance = user.balance;
    if (type === 'deposit') {
      newBalance += numAmount;
    } else {
      if (numAmount > user.balance) {
        setToast({ message: 'Insufficient funds for withdrawal request.', type: 'error' });
        return;
      }
      newBalance -= numAmount;
    }

    try {
      setTransacting(true);
      await api.put('/api/auth/update', { balance: newBalance });
      await refreshUser();
      setAmount('');
      setToast({
        message: `${type === 'deposit' ? 'Deposited' : 'Withdrew'} ${numAmount.toLocaleString(undefined, { style: 'currency', currency: 'USD' })} successfully.`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({ message: err.message || 'Transaction failed.', type: 'error' });
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

            <div className="responsive-grid-2">
              <button
                type="button"
                disabled={transacting}
                onClick={() => handleTransaction('deposit')}
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
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'; }}
              >
                <ArrowUpRight size={16} />
                Deposit
              </button>

              <button
                type="button"
                disabled={transacting}
                onClick={() => handleTransaction('withdraw')}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: '8px',
                  color: '#f87171',
                  padding: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
              >
                <ArrowDownLeft size={16} />
                Withdraw
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Profile;
