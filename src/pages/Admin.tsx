import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Upload, Trash2, History, Plus, FileCode, CreditCard, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  product_id: string;
  product_title: string;
  amount_paid: number;
  purchase_date: string;
  status: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
}

export const Admin: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Guard routing
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
    }
  }, [user]);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('EA');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lists states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'catalog' | 'transactions'>('upload');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const prodData = await api.get<Product[]>('/api/products');
      setProducts(prodData);

      const txData = await api.get<Transaction[]>('/api/admin/transactions');
      setTransactions(txData);
    } catch (err: any) {
      setError(err.message || 'Failed to load system datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUploadProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Please select a trading tool file (e.g., .ex5, .mq5, .zip).');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      if (imageUrl) {
        formData.append('image_url', imageUrl);
      }
      formData.append('file', file);

      await api.postForm('/api/admin/products', formData);
      
      setSuccessMsg('Trading tool uploaded and listed successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('EA');
      setImageUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload product listing
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Failed to compile and publish product.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this tool? This action is permanent and deletes both database records and physical file storage.')) {
      return;
    }

    try {
      await api.delete(`/api/admin/products/${productId}`);
      setProducts(products.filter(p => p.id !== productId));
      setSuccessMsg('Product deleted successfully.');
      loadAdminData();
    } catch (err: any) {
      setError(err.message || 'Deletion execution failed.');
    }
  };

  // Calculate quick stats
  const totalRevenue = transactions.reduce((acc, tx) => acc + tx.amount_paid, 0);
  const totalSalesCount = transactions.length;

  if (loading && products.length === 0) {
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
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem', maxWidth: '1200px' }}>
      
      {/* Title section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Portal Administration
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage products inventory list, upload indicator/EA updates, and inspect system logs.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
            <DollarSign size={24} color="var(--success-color)" />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', display: 'block' }}>Total Gross Sales</span>
            <strong style={{ fontSize: '1.5rem', color: '#fff' }}>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
            <CreditCard size={24} color="var(--primary-solid)" />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', display: 'block' }}>Transactions Processed</span>
            <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{totalSalesCount} purchases</strong>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.85rem', borderRadius: '12px' }}>
            <FileCode size={24} color="#06b6d4" />
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', display: 'block' }}>Products Listed</span>
            <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{products.length} active</strong>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="glass-panel" style={{ display: 'inline-flex', padding: '0.35rem', gap: '0.35rem', borderRadius: '10px', marginBottom: '2.5rem' }}>
        <button 
          onClick={() => setActiveTab('upload')} 
          className={activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <Plus size={14} />
          Upload Tool
        </button>
        <button 
          onClick={() => setActiveTab('catalog')} 
          className={activeTab === 'catalog' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <FileCode size={14} />
          Inventory List
        </button>
        <button 
          onClick={() => setActiveTab('transactions')} 
          className={activeTab === 'transactions' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px', transform: 'none', boxShadow: 'none' }}
        >
          <History size={14} />
          System Ledger
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--error-color)', fontWeight: 600 }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--success-color)', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'upload' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', maxWidth: '700px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} color="var(--primary-solid)" />
            Upload New Quant Tool
          </h2>

          <form onSubmit={handleUploadProduct}>
            <div className="form-group">
              <label className="form-label">Tool Title</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Trend Scalper Pro EA"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Price (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-control"
                  required
                  placeholder="e.g. 199.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ appearance: 'none', background: 'rgba(255,255,255,0.03)' }}
                >
                  <option value="EA">Expert Advisor (EA)</option>
                  <option value="Indicator">Technical Indicator</option>
                  <option value="Script">Execution Script</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mock Thumbnail Image URL (Optional)</label>
              <input
                type="url"
                className="form-control"
                placeholder="e.g. https://images.unsplash.com/... or blank for default"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description / Features Checklist</label>
              <textarea
                className="form-control"
                rows={5}
                required
                placeholder="Detail strategy mechanics, compatibility settings, and inputs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Binary Tool File (.ex5, .mq5, .zip)</label>
              <div style={{
                border: '2px dashed var(--panel-border)',
                borderRadius: '10px',
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer'
              }} onClick={() => fileInputRef.current?.click()}>
                <Upload size={32} color="var(--text-muted)" style={{ marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Click to browse and upload file
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const fname = e.target.files?.[0]?.name;
                    if (fname) setSuccessMsg(`Selected: ${fname}`);
                  }}
                />
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}>
              {submitting ? 'Publishing package...' : 'Compile & Upload Tool'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'catalog' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Active Catalog Inventory</h2>
          
          {products.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No products listed.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {products.map((p) => (
                <div key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.5rem',
                  border: '1px solid var(--panel-border)',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '10px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', padding: '0.15rem 0.4rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', color: 'var(--text-secondary)', marginRight: '0.75rem' }}>
                      {p.category}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{p.title}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '1rem' }}>ID: {p.id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>${p.price.toFixed(2)}</span>
                    <button onClick={() => handleDeleteProduct(p.id)} className="btn-secondary" style={{ padding: '0.5rem', height: '36px', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                      <Trash2 size={16} color="var(--error-color)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem', overflowX: 'auto' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Full Sales Transactions Ledger</h2>
          
          {transactions.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No purchases recorded in the database ledger.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Buyer Details</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Item Purchased</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Price Paid</th>
                  <th style={{ padding: '1rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.95rem' }}>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: 'var(--text-primary)' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      {new Date(tx.purchase_date).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <strong style={{ display: 'block', color: '#fff' }}>{tx.user_name}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx.user_email}</span>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', color: 'var(--text-secondary)' }}>
                      {tx.product_title}
                    </td>
                    <td style={{ padding: '1rem 0.5rem', fontWeight: 600 }}>
                      ${tx.amount_paid.toFixed(2)}
                    </td>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--success-color)',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '12px',
                        textTransform: 'uppercase'
                      }}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
export default Admin;
