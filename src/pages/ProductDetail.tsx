import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  created_at: string;
}

interface Purchase {
  id: string;
  product_id: string;
}

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [owned, setOwned] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const loadProductAndOwnership = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const prodData = await api.get<Product>(`/api/products/${id}`);
      setProduct(prodData);

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
    try {
      setPurchasing(true);
      await api.post('/api/purchases/checkout', { product_id: product.id });
      setOwned(true);
      setShowCheckoutModal(false);
      // Wait a tiny moment to show success notification, then navigate
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Checkout failed.');
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
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: '1000px' }}>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 500 }} className="nav-link">
        <ArrowLeft size={16} />
        Back to Catalog
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2.5rem' }}>
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

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>
                ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                USD (One-time payment)
              </span>
            </div>

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
                  <button onClick={() => setShowCheckoutModal(true)} className="btn-primary" style={{ justifyContent: 'center', padding: '1rem' }}>
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

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Trading Tool</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{product.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Category</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>{product.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem', fontSize: '1.1rem' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Total Due</span>
                <span style={{ color: 'var(--primary-solid)', fontWeight: 800 }}>
                  ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
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
                {purchasing ? 'Simulating...' : 'Confirm Buy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProductDetail;
