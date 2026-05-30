import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Download, ShoppingBag, ShieldCheck, RefreshCw, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  category: string;
  image_url: string;
  file_path: string;
}

interface Purchase {
  id: string;
  product_id: string;
  amount_paid: number;
  purchase_date: string;
  product: Product;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<Purchase[]>('/api/purchases/my-purchases');
      setPurchases(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchased tools ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadPurchases();
    }
  }, [user]);

  const handleDownload = async (productId: string, originalFilename: string) => {
    try {
      setDownloadingId(productId);
      // Strip UUID prefix from DB file_path to suggest a nice filename
      let cleanFilename = originalFilename;
      if (originalFilename.includes('_')) {
        const parts = originalFilename.split('_', 1);
        if (parts.length > 0) {
          cleanFilename = originalFilename.substring(parts[0].length + 1);
        }
      }
      
      await api.downloadFile(productId, cleanFilename);
    } catch (err: any) {
      alert(err.message || 'Failed to securely download file.');
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
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: '1000px' }}>
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
        <button onClick={loadPurchases} className="btn-secondary" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RefreshCw size={14} />
          Sync Purchases
        </button>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShoppingBag size={20} color="var(--primary-solid)" />
        My Purchased Tools
      </h2>

      {error && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error-color)', fontWeight: 600 }}>
          {error}
        </div>
      )}

      {purchases.length === 0 ? (
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
          {purchases.map((purchase) => {
            const prod = purchase.product;
            if (!prod) return null; // Defensive check
            return (
              <div key={purchase.id} className="glass-panel" style={{
                padding: '1.5rem',
                display: 'grid',
                gridTemplateColumns: '120px 1fr auto',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap'
              }}>
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
                    Purchased on: {new Date(purchase.purchase_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} | Paid: ${purchase.amount_paid.toFixed(2)}
                  </p>
                  <p style={{ color: 'var(--success-color)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem' }}>
                    <ShieldCheck size={12} />
                    Verified & cryptographically signed download license.
                  </p>
                </div>

                {/* CTA Action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <button
                    onClick={() => handleDownload(prod.id, prod.file_path)}
                    disabled={downloadingId === prod.id}
                    className="btn-primary"
                    style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Dashboard;
