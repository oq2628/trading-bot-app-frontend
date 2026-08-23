import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  InputBase,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import api from '../utils/api';
import { shortestVariant } from '../utils/variants';
import type { Product } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { btnPrimarySx, btnSecondarySx, glassPanelSx, pageContainerSx, pageTitleSx } from '../theme';

type SortMode = 'newest' | 'best_selling' | 'price_asc' | 'price_desc';

const categoryLabel = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'all': return 'Tất cả';
    case 'ea': return 'Robot EA';
    case 'indicator': return 'Chỉ báo';
    case 'script': return 'Script';
    default: return category;
  }
};

export const Storefront: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('newest');

  const serverSort = sortMode === 'best_selling' ? 'best_selling' : 'newest';

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get<Product[]>(`/api/products?sort=${serverSort}`);
      setProducts(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh mục công cụ giao dịch.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Product data is synchronized with the selected server-side ordering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, [serverSort]); // eslint-disable-line react-hooks/exhaustive-deps

  const categories = useMemo(() => {
    const available = Array.from(new Set(products.map(product => product.category).filter(Boolean)));
    const preferred = ['EA', 'Indicator', 'Script'].filter(category => available.some(item => item.toLowerCase() === category.toLowerCase()));
    const other = available.filter(category => !preferred.some(item => item.toLowerCase() === category.toLowerCase()));
    return ['All', ...preferred, ...other];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = products.filter(product => {
      const matchesCategory = activeCategory === 'All' || product.category.toLowerCase() === activeCategory.toLowerCase();
      const matchesSearch = !query || product.title.toLowerCase().includes(query) || product.description.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });

    if (sortMode === 'price_asc' || sortMode === 'price_desc') {
      result.sort((a, b) => {
        const aPrice = shortestVariant(a.variants)?.price ?? Number.POSITIVE_INFINITY;
        const bPrice = shortestVariant(b.variants)?.price ?? Number.POSITIVE_INFINITY;
        const diff = aPrice - bPrice;
        return sortMode === 'price_asc' ? diff : -diff;
      });
    }

    return result;
  }, [activeCategory, products, searchQuery, sortMode]);

  const resetFilters = () => {
    setActiveCategory('All');
    setSearchQuery('');
    setSortMode('newest');
  };

  const hasActiveFilters = activeCategory !== 'All' || searchQuery.trim() !== '' || sortMode !== 'newest';

  return (
    <Container maxWidth="xl" sx={{ ...pageContainerSx, pt: { xs: 1, md: 2 } }}>
      <Box component="header" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr .8fr' }, gap: 3, alignItems: 'end', mb: { xs: 4, md: 5 } }}>
        <Box>
          <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 1 }}>
            AlgoForge Marketplace
          </Typography>
          <Typography variant="h1" sx={{ ...pageTitleSx, fontSize: { xs: '2.25rem', md: '3.5rem' }, mb: 1.2 }}>
            Bộ công cụ cho nhà giao dịch hiện đại
          </Typography>
        </Box>
        <Typography sx={{ color: 'text.secondary', lineHeight: 1.75, maxWidth: 560, justifySelf: { md: 'end' } }}>
          Tìm kiếm robot EA, chỉ báo và script theo nhu cầu. Giá hiển thị bắt đầu từ gói có thời hạn ngắn nhất đang hoạt động.
        </Typography>
      </Box>

      <Box sx={{ ...glassPanelSx, p: { xs: 2, md: 2.5 }, mb: 3.5, background: 'rgba(14,17,28,.78)' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(280px, 1fr) 230px auto' }, gap: 1.5, alignItems: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            <Search size={18} color="#778199" style={{ position: 'absolute', left: 15, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
            <InputBase
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
              placeholder="Tìm theo tên hoặc mô tả sản phẩm..."
              inputProps={{ 'aria-label': 'Tìm kiếm sản phẩm' }}
              sx={{
                width: '100%',
                height: 46,
                pl: 5,
                pr: 1.5,
                color: '#fff',
                borderRadius: '11px',
                background: 'rgba(255,255,255,.035)',
                border: '1px solid rgba(255,255,255,.08)',
                '&.Mui-focused': { borderColor: 'rgba(129,140,248,.72)', boxShadow: '0 0 0 3px rgba(99,102,241,.12)' },
              }}
            />
          </Box>

          <Select
            value={sortMode}
            onChange={event => setSortMode(event.target.value as SortMode)}
            aria-label="Sắp xếp sản phẩm"
            startAdornment={<SlidersHorizontal size={16} color="#818cf8" style={{ marginRight: 9 }} />}
            sx={{ height: 46, color: '#e5e7eb', borderRadius: '11px', background: 'rgba(255,255,255,.035)', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,.08)' } }}
          >
            <MenuItem value="newest">Mới nhất</MenuItem>
            <MenuItem value="best_selling">Bán chạy</MenuItem>
            <MenuItem value="price_asc">Giá: thấp đến cao</MenuItem>
            <MenuItem value="price_desc">Giá: cao đến thấp</MenuItem>
          </Select>

          <Button onClick={resetFilters} disabled={!hasActiveFilters} sx={{ ...btnSecondarySx, height: 46, whiteSpace: 'nowrap' }}>
            <RotateCcw size={15} /> Đặt lại
          </Button>
        </Box>

        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {categories.map(category => {
            const active = activeCategory.toLowerCase() === category.toLowerCase();
            return (
              <Button
                key={category}
                onClick={() => setActiveCategory(category)}
                aria-pressed={active}
                sx={{
                  ...(active ? btnPrimarySx : btnSecondarySx),
                  px: 1.5,
                  py: 0.65,
                  borderRadius: '9px',
                  fontSize: '0.82rem',
                  boxShadow: 'none',
                  '&:hover': { transform: 'none', boxShadow: 'none' },
                }}
              >
                {categoryLabel(category)}
              </Button>
            );
          })}
        </Box>
      </Box>

      {!loading && !error && (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', mb: 2.2 }} aria-live="polite">
          Hiển thị <Box component="span" sx={{ color: '#fff', fontWeight: 750 }}>{filteredProducts.length}</Box> sản phẩm
        </Typography>
      )}

      {loading ? (
        <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Box sx={{ ...glassPanelSx, p: 4, textAlign: 'center', borderColor: 'rgba(239,68,68,.24)' }}>
          <Typography sx={{ color: 'error.main', fontWeight: 650, mb: 1.5 }}>{error}</Typography>
          <Button onClick={loadProducts} sx={btnPrimarySx}>Thử lại</Button>
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Box sx={{ ...glassPanelSx, p: { xs: 4, md: 7 }, textAlign: 'center' }}>
          <Search size={34} color="#64748b" />
          <Typography variant="h2" sx={{ fontSize: '1.25rem', mt: 1.5, mb: 0.7 }}>Không tìm thấy sản phẩm phù hợp</Typography>
          <Typography sx={{ color: 'text.secondary', mb: 2 }}>Hãy thử từ khóa khác hoặc đặt lại bộ lọc.</Typography>
          <Button onClick={resetFilters} sx={btnSecondarySx}>Đặt lại bộ lọc</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredProducts.map(product => (
            <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 4 }} sx={{ display: 'flex' }}>
              <ProductCard product={product} badge={sortMode === 'best_selling' ? 'Bán chạy' : undefined} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Storefront;
