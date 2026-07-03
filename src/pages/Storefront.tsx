import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Search, ArrowUpRight, Cpu, LineChart, FileCode, AlertTriangle } from 'lucide-react';
import { shortestVariant } from '../utils/variants';
import { Box, Container, Typography, Button, InputBase, CircularProgress } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, glassCardSx, btnPrimarySx, btnSecondarySx, pageContainerSx, pageTitleSx } from '../theme';

interface ProductVariant {
  id: string;
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
  description: string;
  category: string;
  image_url: string;
  created_at: string;
  variants?: ProductVariant[];
}

export const Storefront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAlert, setShowAlert] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const alertEvent = {
    title: "High Gold Volatility Warning: US CPI Inflation Data Today",
    severity: "high", // high -> error-red, medium -> warning-orange
    details: "The US Consumer Price Index (CPI) inflation report is scheduled for release today at 13:30 UTC. Extreme price spikes and spread widening are anticipated on Gold (XAUUSD). We highly recommend pausing any active EAs 30 minutes before and after the release to mitigate slippage risks."
  };

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
        return <Cpu size={16} color="#6366f1" />;
      case 'indicator':
        return <LineChart size={16} color="#06b6d4" />;
      case 'script':
        return <FileCode size={16} color="#10b981" />;
      default:
        return null;
    }
  };

  const inputSx = {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#fff',
    fontSize: '0.95rem',
    fontFamily: '"Outfit", sans-serif',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.Mui-focused': {
      borderColor: '#6366f1',
      boxShadow: '0 0 10px 0 rgba(99, 102, 241, 0.2)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
    <Container
      maxWidth="xl"
      sx={pageContainerSx}
    >
      {/* News Alerts Banner */}
      {showAlert && (
        <Box
          sx={{
            ...glassPanelSx,
            marginTop: '1.5rem',
            borderRadius: '12px',
            border: alertEvent.severity === 'high' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            background: alertEvent.severity === 'high' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            boxShadow: alertEvent.severity === 'high' ? '0 8px 32px 0 rgba(239, 68, 68, 0.05)' : '0 8px 32px 0 rgba(245, 158, 11, 0.05)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              cursor: 'pointer',
            }}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
              <AlertTriangle
                size={18}
                color={alertEvent.severity === 'high' ? '#ef4444' : '#f59e0b'}
                style={{ flexShrink: 0 }}
              />
              <Typography
                component="span"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  color: '#fff',
                  whiteSpace: { xs: 'nowrap', sm: 'normal' },
                  overflow: { xs: 'hidden', sm: 'visible' },
                  textOverflow: { xs: 'ellipsis', sm: 'clip' },
                  maxWidth: { xs: '65vw', sm: 'none' }
                }}
              >
                {alertEvent.title}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
              <Box
                component="button"
                onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
                sx={{
                  background: 'none',
                  border: 'none',
                  color: 'text.secondary',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'transform 0.2s',
                  transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)',
                  '&:hover': { color: '#fff' }
                }}
              >
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
              <Box
                component="button"
                onClick={(e) => { e.stopPropagation(); setShowAlert(false); }}
                sx={{
                  background: 'none',
                  border: 'none',
                  color: 'text.disabled',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  '&:hover': { color: '#fff' }
                }}
                aria-label="Close Alert"
              >
                &times;
              </Box>
            </Box>
          </Box>
          
          {!isCollapsed && (
            <Box
              sx={{
                padding: '0.75rem 1.25rem 1.25rem 2.75rem',
                fontSize: '0.85rem',
                color: 'text.secondary',
                lineHeight: 1.6,
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                paddingTop: '0.75rem'
              }}
            >
              {alertEvent.details}
            </Box>
          )}
        </Box>
      )}

      {/* Hero Header */}
      <Box component="header" sx={{ textAlign: 'center', margin: { xs: '2rem 0 2.5rem', md: '3rem 0 4rem' } }}>
        <Typography
          variant="h1"
          sx={{
            ...pageTitleSx,
            fontSize: { xs: '2rem', sm: '2.4rem', md: '3rem' },
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff 30%, #9ca3af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Unleash the Power of Automated Trading
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontSize: '1.2rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6
          }}
        >
          Download elite-tier Expert Advisors, high-accuracy indicators, and automated execution scripts built by professional quantitative researchers.
        </Typography>
      </Box>

      {/* Catalog Filters and Search */}
      <Box
        sx={{
          ...glassPanelSx,
          padding: '1rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          marginBottom: '2.5rem'
        }}
      >
        {/* Search */}
        <Box sx={{ position: 'relative', flex: '1', minWidth: '280px' }}>
          <Search size={18} color="#6b7280" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }} />
          <InputBase
            type="text"
            placeholder="Search trading tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              ...inputSx,
              paddingLeft: '2.75rem'
            }}
          />
        </Box>

        {/* Categories Tabs */}
        <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['All', 'EA', 'Indicator', 'Script'].map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <Button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                sx={{
                  ...(isSelected ? btnPrimarySx : btnSecondarySx),
                  padding: '0.5rem 1.25rem',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  transform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    ...(isSelected
                      ? {
                          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                          boxShadow: 'none',
                          transform: 'none',
                        }
                      : {
                          background: 'rgba(255, 255, 255, 0.1)',
                          transform: 'none',
                        }),
                  },
                }}
              >
                {cat === 'All' ? 'All Tools' : cat + 's'}
              </Button>
            );
          })}
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Box sx={{ ...glassPanelSx, padding: '2rem', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <Typography sx={{ color: 'error.main', fontWeight: 600 }}>{error}</Typography>
          <Button sx={{ ...btnPrimarySx, marginTop: '1rem' }} onClick={loadProducts}>Try Again</Button>
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Box sx={{ ...glassPanelSx, padding: '4rem 2rem', textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>No trading tools found matching this criteria.</Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredProducts.map((product) => {
            const displayVariant = shortestVariant(product.variants);
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={product.id} sx={{ display: 'flex' }}>
                <Box sx={{ ...glassCardSx, width: '100%' }}>
                  {/* Product Thumbnail */}
                  <Box sx={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                    <Box 
                      component="img"
                      src={product.image_url} 
                      alt={product.title} 
                      sx={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover', 
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }} 
                    />
                    <Box sx={{
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
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      {getCategoryIcon(product.category)}
                      <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>
                        {product.category}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Product Info */}
                  <Box sx={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" sx={{ fontSize: '1.25rem', marginBottom: '0.5rem', fontWeight: 700 }}>
                        {product.title}
                      </Typography>
                      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {product.description}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', marginTop: 'auto' }}>
                      <Box>
                        <Typography component="span" sx={{ fontSize: '0.75rem', color: 'text.disabled', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Price
                        </Typography>
                        {displayVariant ? (
                          <Typography component="span" sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
                            ${displayVariant.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Typography>
                        ) : (
                          <Typography component="span" sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'error.main' }}>
                            No package
                          </Typography>
                        )}
                      </Box>

                      <Button
                        component={Link}
                        to={`/products/${product.id}`}
                        sx={{
                          ...btnPrimarySx,
                          padding: '0.5rem 1rem',
                          fontSize: '0.85rem',
                          borderRadius: '8px'
                        }}
                      >
                        View Tool
                        <ArrowUpRight size={14} />
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};
