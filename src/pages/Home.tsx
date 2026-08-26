import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Boxes,
  Building2,
  ExternalLink,
  Gauge,
  Headphones,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Box, Button, CircularProgress, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import api from '../utils/api';
import type { Product } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { getPartnerWebsite, siteContent } from '../config/siteContent';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { btnOutlineGradientSx, btnPrimarySx, glassPanelSx, pageContainerSx } from '../theme';
import heroImage from '../assets/algoforge-hero.webp';

interface ProductShowcaseProps {
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  loading: boolean;
  error: string;
  badge: string;
  onRetry: () => void;
}

const ProductShowcase: React.FC<ProductShowcaseProps> = ({ eyebrow, title, description, products, loading, error, badge, onRetry }) => (
  <Box component="section" sx={{ mt: { xs: 8, md: 11 } }}>
    <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'flex-end' }, flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2, mb: 3.2 }}>
      <Box>
        <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', mb: 1 }}>
          {eyebrow}
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.4rem' }, mb: 0.8 }}>{title}</Typography>
        <Typography sx={{ color: 'text.secondary', maxWidth: 650, lineHeight: 1.7 }}>{description}</Typography>
      </Box>
      <Button component={Link} to="/products" sx={{ ...btnOutlineGradientSx, flexShrink: 0 }}>
        Xem toàn bộ <ArrowRight size={16} />
      </Button>
    </Box>

    {loading ? (
      <Box sx={{ ...glassPanelSx, minHeight: 250, display: 'grid', placeItems: 'center' }}>
        <CircularProgress size={32} />
      </Box>
    ) : error ? (
      <Box sx={{ ...glassPanelSx, p: 4, textAlign: 'center', borderColor: 'rgba(239,68,68,.24)' }}>
        <Typography sx={{ color: 'error.main', mb: 1.5 }}>{error}</Typography>
        <Button onClick={onRetry} sx={btnPrimarySx}>Thử lại</Button>
      </Box>
    ) : products.length === 0 ? (
      <Box sx={{ ...glassPanelSx, p: 5, textAlign: 'center' }}>
        <Boxes size={34} color="#64748b" />
        <Typography sx={{ color: 'text.secondary', mt: 1.5 }}>Danh mục đang được cập nhật. Sản phẩm sẽ xuất hiện tại đây khi được đăng tải.</Typography>
      </Box>
    ) : (
      <Grid container spacing={3}>
        {products.map(product => (
          <Grid key={product.id} size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: 'flex' }}>
            <ProductCard product={product} badge={badge} />
          </Grid>
        ))}
      </Grid>
    )}
  </Box>
);

const financeCandles = [
  { height: 74, body: 28, positive: true, delay: 0 },
  { height: 116, body: 45, positive: true, delay: -1.8 },
  { height: 88, body: 34, positive: false, delay: -3.2 },
  { height: 146, body: 58, positive: true, delay: -0.9 },
  { height: 122, body: 42, positive: false, delay: -4.1 },
  { height: 176, body: 66, positive: true, delay: -2.4 },
  { height: 142, body: 52, positive: true, delay: -5.2 },
  { height: 198, body: 72, positive: false, delay: -1.3 },
  { height: 168, body: 58, positive: true, delay: -3.7 },
  { height: 228, body: 84, positive: true, delay: -0.4 },
  { height: 188, body: 64, positive: false, delay: -4.7 },
  { height: 252, body: 92, positive: true, delay: -2.8 },
];

const AnimatedFinanceBackdrop: React.FC = () => (
  <Box
    aria-hidden="true"
    sx={{
      position: 'absolute',
      inset: 0,
      zIndex: 1,
      overflow: 'hidden',
      pointerEvents: 'none',
      '@keyframes gridFlow': {
        from: { backgroundPosition: '0 0, 0 0' },
        to: { backgroundPosition: '0 48px, 48px 0' },
      },
      '@keyframes candlePulse': {
        '0%, 100%': { transform: 'translateY(4px)', opacity: 0.62 },
        '50%': { transform: 'translateY(-10px)', opacity: 1 },
      },
      '@keyframes signalSweep': {
        '0%': { transform: 'translate3d(-15%, 0, 0)', opacity: 0 },
        '15%': { opacity: 0.9 },
        '85%': { opacity: 0.9 },
        '100%': { transform: 'translate3d(115%, 0, 0)', opacity: 0 },
      },
      '@keyframes scanLine': {
        '0%': { transform: 'translateY(-120px)', opacity: 0 },
        '18%': { opacity: 0.65 },
        '82%': { opacity: 0.65 },
        '100%': { transform: 'translateY(700px)', opacity: 0 },
      },
      '@keyframes tickerFlow': {
        from: { transform: 'translateX(0)' },
        to: { transform: 'translateX(-50%)' },
      },
      '@keyframes haloBreathe': {
        '0%, 100%': { transform: 'scale(0.9)', opacity: 0.28 },
        '50%': { transform: 'scale(1.12)', opacity: 0.52 },
      },
      '@media (prefers-reduced-motion: reduce)': {
        '&, & *, & *::before, & *::after': {
          animation: 'none !important',
        },
      },
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        inset: '-10%',
        opacity: 0.34,
        backgroundImage: 'linear-gradient(rgba(96,165,250,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,.12) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        maskImage: 'linear-gradient(90deg, rgba(0,0,0,.35), rgba(0,0,0,.95) 58%, transparent 100%)',
        animation: 'gridFlow 14s linear infinite',
      }}
    />

    <Box
      sx={{
        position: 'absolute',
        width: { xs: 300, md: 520 },
        height: { xs: 300, md: 520 },
        right: { xs: -150, md: -80 },
        top: { xs: 40, md: -100 },
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,.25), rgba(79,70,229,.13) 42%, transparent 70%)',
        filter: 'blur(16px)',
        animation: 'haloBreathe 8s ease-in-out infinite',
      }}
    />

    <Box
      sx={{
        position: 'absolute',
        right: { xs: -105, sm: 10, md: 40 },
        bottom: { xs: 108, md: 86 },
        width: { xs: 430, md: 610 },
        height: 300,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        gap: { xs: 8, md: 13 },
        opacity: { xs: 0.45, sm: 0.72, md: 0.82 },
        transform: { xs: 'scale(.78)', sm: 'scale(.9)', md: 'none' },
        transformOrigin: 'right bottom',
      }}
    >
      {financeCandles.map((candle, index) => {
        const color = candle.positive ? '#22d3ee' : '#8b5cf6';
        return (
          <Box
            key={`${candle.height}-${index}`}
            sx={{
              position: 'relative',
              width: { xs: 8, md: 11 },
              height: candle.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: `candlePulse ${5.5 + (index % 4) * 0.7}s ease-in-out ${candle.delay}s infinite`,
              filter: `drop-shadow(0 0 8px ${color}80)`,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '1px',
                background: `linear-gradient(transparent, ${color}, transparent)`,
              },
              '&::after': {
                content: '""',
                position: 'relative',
                width: '100%',
                height: candle.body,
                borderRadius: '2px',
                border: `1px solid ${color}`,
                background: candle.positive
                  ? 'linear-gradient(180deg, rgba(165,243,252,.95), rgba(6,182,212,.42))'
                  : 'linear-gradient(180deg, rgba(196,181,253,.9), rgba(124,58,237,.45))',
                boxShadow: `0 0 16px ${color}70`,
              },
            }}
          />
        );
      })}
    </Box>

    {[0, 1, 2].map(signal => (
      <Box
        key={signal}
        sx={{
          position: 'absolute',
          left: '44%',
          right: '-5%',
          top: `${30 + signal * 15}%`,
          height: 1,
          opacity: 0.65,
          background: 'linear-gradient(90deg, transparent, rgba(34,211,238,.85), rgba(129,140,248,.75), transparent)',
          boxShadow: '0 0 14px rgba(34,211,238,.65)',
          animation: `signalSweep ${7 + signal * 1.4}s linear ${-signal * 2.2}s infinite`,
          '&::after': {
            content: '""',
            position: 'absolute',
            right: '28%',
            top: -3,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#67e8f9',
            boxShadow: '0 0 18px 4px rgba(34,211,238,.7)',
          },
        }}
      />
    ))}

    <Box
      sx={{
        position: 'absolute',
        left: '42%',
        right: 0,
        top: -120,
        height: 90,
        background: 'linear-gradient(180deg, transparent, rgba(34,211,238,.08), rgba(129,140,248,.18), transparent)',
        borderBottom: '1px solid rgba(103,232,249,.35)',
        animation: 'scanLine 9s linear infinite',
      }}
    />

    <Box
      sx={{
        position: 'absolute',
        left: { xs: '38%', md: '48%' },
        right: 0,
        bottom: 22,
        overflow: 'hidden',
        py: 0.8,
        borderTop: '1px solid rgba(129,140,248,.18)',
        borderBottom: '1px solid rgba(34,211,238,.12)',
        background: 'rgba(3,7,18,.22)',
        maskImage: 'linear-gradient(90deg, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <Box
        sx={{
          width: 'max-content',
          display: 'flex',
          color: 'rgba(199,210,254,.58)',
          fontSize: '0.62rem',
          fontWeight: 800,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          animation: 'tickerFlow 20s linear infinite',
        }}
      >
        {[0, 1].map(copy => (
          <Box key={copy} component="span" sx={{ pr: 6 }}>
            Market data &nbsp;•&nbsp; Algorithmic systems &nbsp;•&nbsp; Financial technology &nbsp;•&nbsp; Automated execution &nbsp;•&nbsp;
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

export const Home: React.FC = () => {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { partner } = useSiteSettings();
  const partnerWebsite = getPartnerWebsite(partner);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const [latest, bestSelling] = await Promise.all([
        api.get<Product[]>('/api/products?sort=newest&limit=4'),
        api.get<Product[]>('/api/products?sort=best_selling&limit=4'),
      ]);
      setLatestProducts(latest);
      setBestSellingProducts(bestSelling);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách sản phẩm lúc này.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial catalog synchronization for the two homepage showcases.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProducts();
  }, []);

  return (
    <Container maxWidth="xl" sx={{ ...pageContainerSx, pt: { xs: 0, md: 1 } }}>
      <Box
        component="section"
        aria-labelledby="home-hero-title"
        sx={{
          minHeight: { xs: 630, md: 660 },
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '22px', md: '30px' },
          border: '1px solid rgba(129,140,248,.18)',
          boxShadow: '0 32px 90px rgba(0,0,0,.48)',
          display: 'flex',
          alignItems: 'center',
          isolation: 'isolate',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            background: 'linear-gradient(90deg, rgba(3,6,14,.97) 0%, rgba(3,6,14,.87) 39%, rgba(3,6,14,.32) 72%, rgba(3,6,14,.2) 100%), linear-gradient(0deg, rgba(3,6,14,.72), transparent 54%)',
          },
          '@keyframes heroDrift': {
            '0%, 100%': { transform: 'scale(1.02) translate3d(0,0,0)' },
            '50%': { transform: 'scale(1.07) translate3d(-1.2%, -0.6%, 0)' },
          },
        }}
      >
        <Box
          component="img"
          src={heroImage}
          alt="Không gian giao dịch công nghệ với biểu đồ thị trường và thành phố số"
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: { xs: '64% center', md: 'center' },
            animation: 'heroDrift 18s ease-in-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
        <AnimatedFinanceBackdrop />

        <Box sx={{ position: 'relative', zIndex: 3, maxWidth: 730, px: { xs: 2.5, sm: 5, md: 8 }, py: { xs: 7, md: 9 } }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.8, px: 1.25, py: 0.65, mb: 2.4, borderRadius: '999px', color: '#c7d2fe', border: '1px solid rgba(129,140,248,.3)', background: 'rgba(79,70,229,.12)', backdropFilter: 'blur(12px)' }}>
            <Sparkles size={14} />
            <Typography component="span" sx={{ fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {siteContent.brand.name} × {partner.name}
            </Typography>
          </Box>
          <Typography id="home-hero-title" variant="h1" sx={{ fontSize: { xs: '2.45rem', sm: '3.4rem', md: '4.5rem' }, lineHeight: 1.02, letterSpacing: '-0.045em', maxWidth: 720, mb: 2.2 }}>
            Công nghệ vững vàng cho hành trình giao dịch kỷ luật.
          </Typography>
          <Typography sx={{ color: '#b9c1d4', fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.75, maxWidth: 620, mb: 3.4 }}>
            Khám phá robot EA, chỉ báo và công cụ MetaTrader được tuyển chọn trong hệ sinh thái {siteContent.brand.name}, đồng hành cùng đối tác giao dịch {partner.name}.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.4 }}>
            <Button component={Link} to="/products" sx={{ ...btnPrimarySx, px: 2.2, py: 1.05 }}>
              Khám phá sản phẩm <ArrowRight size={17} />
            </Button>
            {partnerWebsite ? (
              <Button component="a" href={partnerWebsite} target="_blank" rel="noopener noreferrer" sx={{ ...btnOutlineGradientSx, px: 2.2, py: 1.05 }}>
                Website {partner.name} <ExternalLink size={16} />
              </Button>
            ) : (
              <Button disabled sx={{ ...btnOutlineGradientSx, px: 2.2, py: 1.05, opacity: 0.55 }}>
                Website {partner.name} đang cập nhật
              </Button>
            )}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 3 }, mt: 4 }}>
            {[['Sản phẩm số', <Bot size={16} />], ['Bản quyền quản lý', <ShieldCheck size={16} />], ['Hỗ trợ đa kênh', <Headphones size={16} />]].map(([label, icon]) => (
              <Box key={String(label)} sx={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 0.7, fontSize: '0.82rem' }}>
                <Box sx={{ color: '#818cf8', display: 'flex' }}>{icon}</Box>{label}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Box component="section" sx={{ mt: { xs: 8, md: 11 }, display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '0.9fr 1.1fr' }, gap: 3 }}>
        <Box sx={{ ...glassPanelSx, p: { xs: 3, md: 4.5 }, background: 'linear-gradient(145deg, rgba(79,70,229,.17), rgba(10,12,20,.82))' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, mb: 3 }}>
            <Box>
              <Typography sx={{ color: '#a5b4fc', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase' }}>{partner.relationship}</Typography>
              <Typography variant="h2" sx={{ fontSize: { xs: '2.3rem', md: '3.2rem' }, mt: 0.5, wordBreak: 'break-word' }}>{partner.name}</Typography>
            </Box>
            <Box aria-label={`Logo ${partner.name}`} sx={{ width: 72, height: 72, flexShrink: 0, borderRadius: '20px', display: 'grid', placeItems: 'center', color: '#fff', fontSize: '1.05rem', fontWeight: 900, letterSpacing: '.08em', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', boxShadow: '0 14px 38px rgba(79,70,229,.3)' }}>
              {partner.name.slice(0, 4).toUpperCase()}
            </Box>
          </Box>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 3 }}>{partner.introduction}</Typography>
          {partner.founded_year && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#cbd5e1' }}>
              <Building2 size={17} color="#818cf8" />
              <Typography sx={{ fontSize: '0.86rem' }}>Năm thành lập: {partner.founded_year}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ ...glassPanelSx, p: { xs: 3, md: 4.5 } }}>
          <Typography sx={{ color: '#818cf8', fontSize: '0.74rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', mb: 1 }}>Giá trị kết nối</Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.7rem', md: '2.1rem' }, mb: 2.6 }}>Một hệ sinh thái, nhiều điểm chạm hỗ trợ</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 1.5 }}>
            {partner.benefits.map((benefit, index) => {
              const icons = [<Gauge size={20} />, <BadgeCheck size={20} />, <Users size={20} />];
              return (
                <Box key={benefit} sx={{ p: 2, minHeight: 142, borderRadius: '14px', background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}>
                  <Box sx={{ color: '#818cf8', mb: 1.5 }}>{icons[index]}</Box>
                  <Typography sx={{ color: '#e5e7eb', fontSize: '0.88rem', fontWeight: 650, lineHeight: 1.5 }}>{benefit}</Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      <ProductShowcase
        eyebrow="Vừa ra mắt"
        title="Sản phẩm mới"
        description="Những công cụ mới nhất được bổ sung vào danh mục AlgoForge, sắp xếp theo ngày phát hành."
        products={latestProducts}
        loading={loading}
        error={error}
        badge="Mới"
        onRetry={loadProducts}
      />

      <ProductShowcase
        eyebrow="Được lựa chọn nhiều"
        title="Sản phẩm bán chạy"
        description="Thứ tự dựa trên số giao dịch hoàn tất trong hệ thống; số lượng bán không được công khai."
        products={bestSellingProducts}
        loading={loading}
        error={error}
        badge="Bán chạy"
        onRetry={loadProducts}
      />

    </Container>
  );
};

export default Home;
