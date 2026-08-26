import React from 'react';
import { AtSign, Headphones, Mail, MessageCircle, MessagesSquare, Send } from 'lucide-react';
import { Box, Button, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { getSupportHref, siteContent, type SupportChannelKey } from '../config/siteContent';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { btnPrimarySx, glassPanelSx, pageContainerSx, pageTitleSx } from '../theme';

const channelVisual: Record<SupportChannelKey, { icon: React.ReactNode; color: string }> = {
  email: { icon: <Mail size={24} />, color: '#22d3ee' },
  zalo: { icon: <MessageCircle size={24} />, color: '#38bdf8' },
  discord: { icon: <AtSign size={24} />, color: '#818cf8' },
  telegram: { icon: <Send size={24} />, color: '#60a5fa' },
  facebook: { icon: <MessagesSquare size={24} />, color: '#3b82f6' },
};

export const Support: React.FC = () => {
  const { contact } = useSiteSettings();

  return (
  <Container maxWidth="xl" sx={{ ...pageContainerSx, pt: { xs: 1, md: 2 } }}>
    <Box component="header" sx={{ textAlign: 'center', maxWidth: 760, mx: 'auto', mb: { xs: 4, md: 6 } }}>
      <Box sx={{ width: 54, height: 54, mx: 'auto', mb: 2, display: 'grid', placeItems: 'center', borderRadius: '16px', color: '#c7d2fe', background: 'rgba(79,70,229,.16)', border: '1px solid rgba(129,140,248,.25)' }}>
        <Headphones size={26} />
      </Box>
      <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 1 }}>Trung tâm hỗ trợ</Typography>
      <Typography variant="h1" sx={{ ...pageTitleSx, fontSize: { xs: '2.2rem', md: '3.2rem' }, mb: 1.4 }}>Kết nối với AlgoForge theo cách thuận tiện nhất</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.98rem', md: '1.08rem' }, lineHeight: 1.75 }}>
        Chọn email hoặc nền tảng nhắn tin bạn thường sử dụng. Các kênh chưa được cấu hình sẽ hiển thị trạng thái đang cập nhật.
      </Typography>
    </Box>

    <Grid container spacing={3} sx={{ justifyContent: 'center' }}>
      {siteContent.supportChannels.map(channel => {
        const href = getSupportHref(channel.key, contact);
        const visual = channelVisual[channel.key];
        const opensNewTab = channel.key !== 'email';

        return (
          <Grid key={channel.key} size={{ xs: 12, sm: 6, lg: 4 }} sx={{ display: 'flex' }}>
            <Box component="article" sx={{ ...glassPanelSx, p: { xs: 2.6, md: 3.2 }, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', background: 'linear-gradient(155deg, rgba(20,24,39,.82), rgba(8,10,17,.9))' }}>
              <Box sx={{ width: 50, height: 50, borderRadius: '14px', display: 'grid', placeItems: 'center', color: visual.color, background: `${visual.color}16`, border: `1px solid ${visual.color}35`, mb: 2.2 }}>
                {visual.icon}
              </Box>
              <Typography variant="h2" sx={{ fontSize: '1.3rem', mb: 0.8 }}>{channel.label}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.65, mb: 2.5 }}>{channel.description}</Typography>
              <Box sx={{ mt: 'auto', width: '100%' }}>
                {href ? (
                  <Button
                    component="a"
                    href={href}
                    target={opensNewTab ? '_blank' : undefined}
                    rel={opensNewTab ? 'noopener noreferrer' : undefined}
                    aria-label={opensNewTab ? `${channel.actionLabel}, mở trong tab mới` : channel.actionLabel}
                    sx={{ ...btnPrimarySx, width: '100%' }}
                  >
                    {channel.actionLabel}
                  </Button>
                ) : (
                  <Button disabled sx={{ ...btnPrimarySx, width: '100%' }}>Đang cập nhật</Button>
                )}
              </Box>
            </Box>
          </Grid>
        );
      })}
    </Grid>

    <Box sx={{ mt: { xs: 5, md: 7 }, p: { xs: 2.5, md: 3.2 }, borderRadius: '16px', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, gap: 2, background: 'rgba(99,102,241,.07)', border: '1px solid rgba(129,140,248,.18)' }}>
      <MessageCircle size={24} color="#818cf8" />
      <Box>
        <Typography sx={{ color: '#fff', fontWeight: 750, mb: 0.35 }}>Lưu ý về dữ liệu demo</Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', lineHeight: 1.6 }}>{siteContent.demoNotice}</Typography>
      </Box>
    </Box>
  </Container>
  );
};

export default Support;
