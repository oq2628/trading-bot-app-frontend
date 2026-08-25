import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, MessageCircle, MessagesSquare, Send, TrendingUp } from 'lucide-react';
import { Box, Container, IconButton, Typography } from '@mui/material';
import { getSupportChannel, getSupportHref, siteContent, type SupportChannelKey } from '../config/siteContent';
import { useSiteSettings } from '../context/SiteSettingsContext';

const footerChannels: SupportChannelKey[] = ['zalo', 'telegram', 'facebook'];

const channelIcon = (key: SupportChannelKey) => {
  if (key === 'telegram') return <Send size={18} />;
  if (key === 'facebook') return <MessagesSquare size={18} />;
  return <MessageCircle size={18} />;
};

export const Footer: React.FC = () => {
  const { partner } = useSiteSettings();

  return (
    <Box component="footer" sx={{ mt: { xs: 7, md: 10 }, borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(5, 7, 12, 0.75)' }}>
      <Container maxWidth="xl" sx={{ maxWidth: '1600px !important', py: { xs: 5, md: 6 }, px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.4fr 0.8fr 1fr' }, gap: { xs: 4, md: 8 } }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.4 }}>
              <Box sx={{ width: 38, height: 38, borderRadius: '11px', display: 'grid', placeItems: 'center', color: '#fff', background: 'linear-gradient(135deg, #4f46e5, #8b5cf6)' }}>
                <TrendingUp size={21} />
              </Box>
              <Typography sx={{ color: '#fff', fontSize: '1.15rem', fontWeight: 800 }}>{siteContent.brand.name}</Typography>
              <Typography component="span" sx={{ color: '#a5b4fc', fontSize: '0.68rem', fontWeight: 800, px: 0.9, py: 0.35, borderRadius: '999px', border: '1px solid rgba(129,140,248,.3)', background: 'rgba(79,70,229,.12)' }}>
                × {partner.name}
              </Typography>
            </Box>
            <Typography sx={{ color: 'text.secondary', maxWidth: 480, lineHeight: 1.75, fontSize: '0.9rem' }}>
              {siteContent.brand.description}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 750, mb: 1.4 }}>Khám phá</Typography>
            <Box component="nav" aria-label="Liên kết cuối trang" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
              {[['Trang chủ', '/'], ['Sản phẩm', '/products'], ['Hỗ trợ', '/support'], ['Về chúng tôi', '/about']].map(([label, path]) => (
                <Box key={path} component={Link} to={path} sx={{ color: 'text.secondary', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#fff' } }}>
                  {label}
                </Box>
              ))}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 750, mb: 0.6 }}>Kết nối hỗ trợ</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mb: 1.5 }}>Điền suffix trong cấu hình để kích hoạt liên kết.</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {footerChannels.map(key => {
                const channel = getSupportChannel(key);
                const href = getSupportHref(channel);
                return href ? (
                  <IconButton
                    key={key}
                    component="a"
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${channel.label} - mở trong tab mới`}
                    sx={{ color: '#c7d2fe', border: '1px solid rgba(129,140,248,.24)', background: 'rgba(79,70,229,.1)', '&:hover': { background: 'rgba(79,70,229,.24)' } }}
                  >
                    {channelIcon(key)}
                  </IconButton>
                ) : (
                  <IconButton key={key} disabled aria-label={`${channel.label} chưa được cấu hình`} sx={{ border: '1px solid rgba(255,255,255,.08)' }}>
                    {channelIcon(key)}
                  </IconButton>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 5, pt: 2.5, borderTop: '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.76rem' }}>© {new Date().getFullYear()} AlgoForge Marketplace. All rights reserved.</Typography>
          <Typography component={Link} to="/about" sx={{ color: 'text.disabled', textDecoration: 'none', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: 0.5, '&:hover': { color: 'text.secondary' } }}>
            Nội dung demo & chính sách <ExternalLink size={12} />
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
