import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Toast } from '../components/Toast';
import { activeSortedVariants, formatVariantDuration } from '../utils/variants';

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
  const [paymentMethod, setPaymentMethod] = useState<'payos' | 'momo'>('payos');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve trading tool information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductAndOwnership();
  }, [id, user]);

  const handleCheckout = async () => {
    if (!product) return;
    if (!selectedVariantId) {
      setToast({ message: 'Please select a license package before checkout.', type: 'error' });
      return;
    }
    try {
      setPurchasing(true);
      if (paymentMethod === 'payos') {
        const response = await api.post<{ checkout_url: string; order_code: number; purchase_id: string }>(
          '/api/purchases/checkout-payment',
          {
            product_id: product.id,
            variant_id: selectedVariantId,
            cancel_url: window.location.href,
            return_url: `${window.location.origin}/dashboard?payment=success`
          }
        );
        window.location.href = response.checkout_url;
      } else {
        setToast({ message: "Processing MoMo payment...", type: "info" });
        const purchase = await api.post<Purchase>('/api/purchases/checkout', {
          product_id: product.id,
          variant_id: selectedVariantId
        });
        if (purchase.status === 'pending') {
          await api.post<Purchase>(`/api/purchases/${purchase.id}/pay`, {});
        }
        setOwned(true);
        setShowCheckoutModal(false);
        await refreshUser();
        navigate('/dashboard?payment=success');
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Checkout failed.', type: 'error' });
    } finally {
      setPurchasing(false);
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

  if (error || !product) {
    return (
      <div className="container" style={{ margin: '4rem auto', maxWidth: '600px' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <p style={{ color: 'var(--error-color)', fontWeight: 600 }}>{error || 'Trading tool not found.'}</p>
          <Link to="/" className="btn-primary" style={{ marginTop: '1.5rem' }}>
            <ArrowLeft size={16} />
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 500 }} className="nav-link">
        <ArrowLeft size={16} />
        Back to Catalog
      </Link>

      <div className="product-detail-grid">
        {/* Left Column: Visual Mock and Description */}
        <div>
          <div className="glass-panel" style={{ overflow: 'hidden', padding: 0, marginBottom: '2rem' }}>
            <img 
              src={product.image_url} 
              alt={product.title} 
              style={{ width: '100%', height: '350px', objectFit: 'cover' }}
            />
          </div>

          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Description & Features</h2>
          <div className="glass-panel" style={{ padding: '1.5rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
            <p style={{ whiteSpace: 'pre-line' }}>{product.description}</p>
          </div>
        </div>

        {/* Right Column: Buying Box & Specifications */}
        <div>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 800,
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary-solid)',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              textTransform: 'uppercase',
              display: 'inline-block',
              marginBottom: '1rem',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              {product.category}
            </span>

            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: 800 }}>
              {product.title}
            </h1>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Product ID: {product.id}
            </p>

            {activeSortedVariants(product.variants).length > 0 ? (
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  Select License Package
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} role="radiogroup" aria-label="Licensing Package Selector">
                  {activeSortedVariants(product.variants).map(v => {
                    const isSelected = selectedVariantId === v.id;
                    const vndEstimate = (v.price * 25000).toLocaleString('vi-VN');
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '1rem',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #e0a96d' : '1px solid rgba(255,255,255,0.08)',
                          background: isSelected ? 'rgba(224, 169, 109, 0.08)' : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          minHeight: '56px'
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setSelectedVariantId(v.id); }}
                      >
                        <input
                          type="radio"
                          id={`variant-${v.id}`}
                          name="product-variant"
                          checked={isSelected}
                          onChange={() => setSelectedVariantId(v.id)}
                          style={{ cursor: 'pointer', accentColor: '#e0a96d' }}
                        />
                        <label htmlFor={`variant-${v.id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flex: 1, margin: 0 }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>{v.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {formatVariantDuration(v)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#e0a96d' }}>
                              ${v.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              ≈ {vndEstimate} VND
                            </span>
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={12} color="var(--success-color)" />
                  VND estimates use fixed rate: 1 USD = 25,000 VND. Webhooks verify and process payments in VND.
                </p>
              </div>
            ) : (
              <div style={{ color: 'var(--error-color)', fontWeight: 600, marginBottom: '2rem' }}>
                No active license packages are available for this product.
              </div>
            )}
 
             {owned ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--success-glow)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                   <CheckCircle2 size={20} color="var(--success-color)" />
                   <span style={{ fontWeight: 600, color: 'var(--success-color)', fontSize: '0.95rem' }}>
                     You own this tool
                   </span>
                 </div>
                 <Link to="/dashboard" className="btn-primary" style={{ justifyContent: 'center' }}>
                   Go to Downloads Dashboard
                 </Link>
               </div>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                 {user ? (
                   <button onClick={() => setShowCheckoutModal(true)} disabled={!selectedVariantId} className="btn-primary" style={{ justifyContent: 'center', padding: '1rem' }}>
                     <CreditCard size={18} />
                     Instant Checkout
                   </button>
                 ) : (
                   <Link to="/login" className="btn-primary" style={{ justifyContent: 'center', padding: '1rem' }}>
                     Sign In to Purchase
                   </Link>
                 )}
                 
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                   <ShieldCheck size={14} color="var(--success-color)" />
                   Secure mock checkout. No real money charged.
                 </div>
               </div>
             )}
           </div>
 
           {/* Specifications */}
           <div className="glass-panel" style={{ padding: '1.5rem' }}>
             <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
               Specifications
             </h3>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.9rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Format</span>
                 <span style={{ color: '#fff', fontWeight: 500 }}>
                   {product.category === 'EA' ? '.ex5 / .ex4' : product.category === 'Indicator' ? '.ex5 / .mq5' : '.mq5 / .txt'}
                 </span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Delivery</span>
                 <span style={{ color: '#fff', fontWeight: 500 }}>Instant Secure Download</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>License</span>
                 <span style={{ color: '#fff', fontWeight: 500 }}>Personal use (Unlimited Accounts)</span>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)' }}>Updates</span>
                 <span style={{ color: '#fff', fontWeight: 500 }}>Free Lifetime Updates</span>
               </div>
             </div>
           </div>
         </div>
       </div>
 
       {/* Checkout Modal Simulation */}
       {showCheckoutModal && (
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
               <CreditCard size={24} color="var(--primary-solid)" />
               Secure Checkout
             </h2>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
               Confirm your mock transaction details below.
             </p>
 
             {(() => {
               const selectedVariant = activeSortedVariants(product.variants).find(v => v.id === selectedVariantId);
               if (!selectedVariant) return null;
               const vndAmount = (selectedVariant.price * 25000).toLocaleString('vi-VN');
               return (
                 <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Trading Tool</span>
                     <span style={{ color: '#fff', fontWeight: 600 }}>{product.title}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                     <span style={{ color: 'var(--text-secondary)' }}>Package</span>
                     <span style={{ color: '#fff', fontWeight: 500 }}>{selectedVariant.name}</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '1.1rem' }}>
                     <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total Due</span>
                     <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                       <span style={{ color: '#e0a96d', fontWeight: 800 }}>
                         ${selectedVariant.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </span>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                         ≈ {vndAmount} VND
                       </span>
                     </div>
                   </div>
                 </div>
               );
             })()}


            {/* Select Payment Method */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Select Payment Method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} role="radiogroup" aria-label="Payment Method Selector">
                {/* PayOS card */}
                <div 
                  onClick={() => setPaymentMethod('payos')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'payos' ? '1px solid var(--primary-solid)' : '1px solid var(--panel-border)',
                    background: paymentMethod === 'payos' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    minHeight: '48px',
                    transition: 'all 0.2s ease'
                  }}
                  role="radio"
                  aria-checked={paymentMethod === 'payos'}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setPaymentMethod('payos'); }}
                >
                  <input 
                    type="radio" 
                    id="payos-radio"
                    name="payment-method" 
                    checked={paymentMethod === 'payos'} 
                    onChange={() => setPaymentMethod('payos')}
                    style={{ cursor: 'pointer', accentColor: 'var(--primary-solid)' }} 
                  />
                  <label htmlFor="payos-radio" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>PayOS (VietQR / Credit Card)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan QR code or pay with bank card</span>
                  </label>
                </div>

                {/* MoMo card */}
                <div 
                  onClick={() => setPaymentMethod('momo')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: paymentMethod === 'momo' ? '1px solid var(--primary-solid)' : '1px solid var(--panel-border)',
                    background: paymentMethod === 'momo' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    minHeight: '48px',
                    transition: 'all 0.2s ease'
                  }}
                  role="radio"
                  aria-checked={paymentMethod === 'momo'}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') setPaymentMethod('momo'); }}
                >
                  <input 
                    type="radio" 
                    id="momo-radio"
                    name="payment-method" 
                    checked={paymentMethod === 'momo'} 
                    onChange={() => setPaymentMethod('momo')}
                    style={{ cursor: 'pointer', accentColor: 'var(--primary-solid)' }} 
                  />
                  <label htmlFor="momo-radio" style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>MoMo Wallet</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan MoMo QR code (Demo Checkout)</span>
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setShowCheckoutModal(false)} 
                className="btn-secondary" 
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={purchasing}
              >
                Cancel
              </button>
              <button 
                onClick={handleCheckout} 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center' }}
                disabled={purchasing}
              >
                {purchasing ? 'Processing...' : (paymentMethod === 'payos' ? 'Pay Now (Redirect)' : 'Confirm Buy')}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
export default ProductDetail;
