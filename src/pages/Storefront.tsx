import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, ArrowUpRight, Cpu, LineChart, FileCode } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  created_at: string;
}

export const Storefront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.get<Product[]>('/api/products');
      setProducts(data);
      setFilteredProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load tools catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    let result = products;

    if (activeCategory !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());
    }

    if (searchQuery.trim() !== '') {
      result = result.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(result);
  }, [activeCategory, searchQuery, products]);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'ea':
        return <Cpu size={16} color="var(--primary-solid)" />;
      case 'indicator':
        return <LineChart size={16} color="#06b6d4" />;
      case 'script':
        return <FileCode size={16} color="#10b981" />;
      default:
        return null;
    }
  };

  return (
    <div className="container animate-fade-in" style={{ paddingBottom: '4rem' }}>
      {/* Hero Header */}
      <header style={{ textAlign: 'center', margin: '3rem 0 4rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(135deg, #fff 30%, var(--text-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Unleash the Power of Automated Trading
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
          Download elite-tier Expert Advisors, high-accuracy indicators, and automated execution scripts built by professional quantitative researchers.
        </p>
      </header>

      {/* Catalog Filters and Search */}
      <div className="glass-panel" style={{
        padding: '1rem 1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search trading tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.75rem' }}
          />
        </div>

        {/* Categories Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'EA', 'Indicator', 'Script'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'btn-primary' : 'btn-secondary'}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.85rem',
                borderRadius: '8px',
                transform: 'none',
                boxShadow: 'none'
              }}
            >
              {cat === 'All' ? 'All Tools' : cat + 's'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(99, 102, 241, 0.1)',
            borderTopColor: 'var(--primary-solid)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : error ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <p style={{ color: 'var(--error-color)', fontWeight: 600 }}>{error}</p>
          <button className="btn-primary" onClick={loadProducts} style={{ marginTop: '1rem' }}>Try Again</button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No trading tools found matching this criteria.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="glass-card">
              {/* Product Thumbnail */}
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img 
                  src={product.image_url} 
                  alt={product.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-smooth)' }} 
                  className="product-thumbnail"
                />
                <div style={{
                  position: 'absolute',
                  top: '0.75rem',
                  left: '0.75rem',
                  background: 'rgba(10, 11, 14, 0.8)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: '1px solid var(--panel-border)'
                }}>
                  {getCategoryIcon(product.category)}
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                    {product.category}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                    {product.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {product.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Price
                    </span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                      ${product.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <Link to={`/products/${product.id}`} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}>
                    View Tool
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
