import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bot, ChartNoAxesCombined, FileCode2, PackageOpen } from 'lucide-react';
import { Box, Button, Typography } from '@mui/material';
import { shortestVariant } from '../utils/variants';
import type { Product } from '../types/product';
import { btnPrimarySx, glassCardSx } from '../theme';

interface ProductCardProps {
  product: Product;
  badge?: string;
}

const categoryMeta = (category: string) => {
  switch (category.toLowerCase()) {
    case 'ea':
      return { icon: <Bot size={15} />, color: '#8b5cf6' };
    case 'indicator':
      return { icon: <ChartNoAxesCombined size={15} />, color: '#22d3ee' };
    case 'script':
      return { icon: <FileCode2 size={15} />, color: '#34d399' };
    default:
      return { icon: <PackageOpen size={15} />, color: '#94a3b8' };
  }
};

export const ProductCard: React.FC<ProductCardProps> = ({ product, badge }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const variant = shortestVariant(product.variants);
  const meta = categoryMeta(product.category);
  const hasDiscount = Boolean(
    variant?.original_price && variant.original_price > variant.price,
  );

  return (
    <Box
      component="article"
      sx={{
        ...glassCardSx,
        width: '100%',
        minHeight: '100%',
        background: 'linear-gradient(180deg, rgba(22, 26, 42, 0.86), rgba(10, 12, 20, 0.92))',
      }}
    >
      <Box sx={{ height: { xs: 190, md: 210 }, overflow: 'hidden', position: 'relative', background: '#0b1020' }}>
        {product.image_url && !imageFailed ? (
          <Box
            component="img"
            src={product.image_url}
            alt={`Ảnh sản phẩm ${product.title}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.45s ease',
              '.MuiBox-root:hover > &': { transform: 'scale(1.04)' },
            }}
          />
        ) : (
          <Box
            role="img"
            aria-label={`Chưa có ảnh cho ${product.title}`}
            sx={{
              width: '100%',
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              color: meta.color,
              background: `radial-gradient(circle at 70% 20%, ${meta.color}33, transparent 35%), linear-gradient(135deg, #111827, #070a12)`,
            }}
          >
            <ChartNoAxesCombined size={56} strokeWidth={1.25} />
          </Box>
        )}
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 45%, rgba(5,7,12,0.86))' }} />

        <Box
          sx={{
            position: 'absolute',
            top: 14,
            left: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 0.7,
            px: 1.15,
            py: 0.55,
            borderRadius: '999px',
            color: '#fff',
            background: 'rgba(6, 8, 15, 0.78)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Box sx={{ color: meta.color, display: 'flex' }}>{meta.icon}</Box>
          <Typography component="span" sx={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {product.category}
          </Typography>
        </Box>

        {badge && (
          <Box
            sx={{
              position: 'absolute',
              top: 14,
              right: 14,
              px: 1.1,
              py: 0.55,
              borderRadius: '999px',
              color: '#dbeafe',
              background: 'rgba(79, 70, 229, 0.78)',
              border: '1px solid rgba(165, 180, 252, 0.35)',
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              backdropFilter: 'blur(10px)',
            }}
          >
            {badge}
          </Box>
        )}
      </Box>

      <Box sx={{ p: { xs: 2, md: 2.4 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h3" sx={{ fontSize: '1.2rem', lineHeight: 1.3, mb: 0.8 }}>
          {product.title}
        </Typography>
        <Typography
          sx={{
            color: 'text.secondary',
            fontSize: '0.9rem',
            lineHeight: 1.65,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2.2,
          }}
        >
          {product.description}
        </Typography>

        <Box sx={{ mt: 'auto', pt: 1.8, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Giá từ
            </Typography>
            {variant ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 0.7 }}>
                <Typography component="span" sx={{ color: '#fff', fontSize: '1.35rem', fontWeight: 800 }}>
                  ${variant.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                {hasDiscount && (
                  <Typography component="span" sx={{ color: 'text.disabled', fontSize: '0.78rem', textDecoration: 'line-through' }}>
                    ${variant.original_price!.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography sx={{ color: 'warning.main', fontSize: '0.86rem', fontWeight: 700 }}>Đang cập nhật</Typography>
            )}
          </Box>

          <Button
            component={Link}
            to={`/products/${product.id}`}
            aria-label={`Xem chi tiết ${product.title}`}
            sx={{ ...btnPrimarySx, flexShrink: 0, minWidth: 0, px: 1.3, py: 0.75, borderRadius: '9px', fontSize: '0.82rem' }}
          >
            Chi tiết <ArrowUpRight size={14} />
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ProductCard;
