import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Building2, FileText, Handshake, ShieldAlert, Users } from 'lucide-react';
import { Box, Button, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { siteContent } from '../config/siteContent';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { btnPrimarySx, glassPanelSx, pageContainerSx, pageTitleSx } from '../theme';

export const About: React.FC = () => {
  const { partner } = useSiteSettings();

  return (
  <Container maxWidth="xl" sx={{ ...pageContainerSx, pt: { xs: 1, md: 2 } }}>
    <Box component="header" sx={{ position: 'relative', overflow: 'hidden', p: { xs: 3, sm: 5, md: 7 }, borderRadius: { xs: '20px', md: '28px' }, border: '1px solid rgba(129,140,248,.18)', background: 'radial-gradient(circle at 85% 15%, rgba(79,70,229,.28), transparent 35%), linear-gradient(135deg, rgba(18,22,38,.96), rgba(7,9,16,.96))', mb: { xs: 6, md: 9 } }}>
      <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 1.3 }}>Về AlgoForge</Typography>
      <Typography variant="h1" sx={{ ...pageTitleSx, fontSize: { xs: '2.3rem', md: '3.8rem' }, maxWidth: 800, mb: 1.8 }}>
        Nơi công nghệ giao dịch gặp trải nghiệm hỗ trợ có trách nhiệm
      </Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: { xs: '0.98rem', md: '1.1rem' }, lineHeight: 1.8, maxWidth: 760 }}>
        {siteContent.brand.name} được định hướng như một website bán và quản lý công cụ giao dịch số. Trong trải nghiệm đồng thương hiệu, {partner.name} là đối tác được giới thiệu để mở rộng điểm chạm cho nhà giao dịch.
      </Typography>
    </Box>

    <Grid container spacing={3} sx={{ mb: { xs: 7, md: 10 } }}>
      <Grid size={{ xs: 12, lg: 7 }} sx={{ display: 'flex' }}>
        <Box component="section" sx={{ ...glassPanelSx, p: { xs: 3, md: 4.5 }, width: '100%' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
            <Box sx={{ color: '#818cf8', display: 'flex' }}><Building2 size={23} /></Box>
            <Typography variant="h2" sx={{ fontSize: '1.55rem' }}>Câu chuyện thương hiệu</Typography>
          </Box>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.85, mb: 2.2 }}>
            AlgoForge tập trung xây dựng một điểm đến rõ ràng cho người dùng tìm hiểu, mua và quản lý bản quyền robot EA, chỉ báo cùng script MetaTrader. Thiết kế sản phẩm ưu tiên thông tin dễ hiểu, luồng mua hàng minh bạch và khả năng tiếp cận hỗ trợ sau mua.
          </Typography>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.85 }}>
            Nội dung hiện tại là khung demo để chủ website thay bằng lịch sử, pháp nhân, thành tựu và tài liệu đã được xác minh trước khi phát hành chính thức.
          </Typography>
        </Box>
      </Grid>
      <Grid size={{ xs: 12, lg: 5 }} sx={{ display: 'flex' }}>
        <Box component="section" sx={{ ...glassPanelSx, p: { xs: 3, md: 4.5 }, width: '100%', background: 'linear-gradient(145deg, rgba(79,70,229,.16), rgba(10,12,20,.85))' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
            <Box sx={{ color: '#a5b4fc', display: 'flex' }}><Handshake size={23} /></Box>
            <Typography variant="h2" sx={{ fontSize: '1.55rem', wordBreak: 'break-word' }}>{siteContent.brand.name} × {partner.name}</Typography>
          </Box>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 2 }}>{partner.introduction}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#cbd5e1', fontSize: '0.86rem' }}>
            <BadgeCheck size={17} color="#818cf8" />
            {partner.relationship}{partner.founded_year ? ` · Thành lập ${partner.founded_year}` : ''}
          </Box>
        </Box>
      </Grid>
    </Grid>

    <Box component="section" sx={{ mb: { xs: 7, md: 10 } }}>
      <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 1 }}>Đội ngũ</Typography>
      <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.45rem' }, mb: 1 }}>Những nhóm cùng vận hành trải nghiệm</Typography>
      <Typography sx={{ color: 'text.secondary', maxWidth: 680, lineHeight: 1.7, mb: 3 }}>Tên cá nhân và hình ảnh thật có thể được bổ sung sau; bản demo sử dụng mô tả theo chức năng để tránh tạo danh tính giả.</Typography>
      <Grid container spacing={3}>
        {siteContent.team.map((member, index) => (
          <Grid key={member.name} size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
            <Box sx={{ ...glassPanelSx, p: 3, width: '100%' }}>
              <Box sx={{ width: 48, height: 48, borderRadius: '14px', display: 'grid', placeItems: 'center', color: '#c7d2fe', background: index === 1 ? 'rgba(6,182,212,.12)' : 'rgba(99,102,241,.12)', border: '1px solid rgba(129,140,248,.2)', mb: 2 }}>
                <Users size={23} />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '1.15rem', mb: 0.4 }}>{member.name}</Typography>
              <Typography sx={{ color: '#818cf8', fontSize: '0.76rem', fontWeight: 750, letterSpacing: '.05em', textTransform: 'uppercase', mb: 1.2 }}>{member.role}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', lineHeight: 1.65 }}>{member.description}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>

    <Box component="section" sx={{ mb: { xs: 7, md: 10 } }}>
      <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 1 }}>Dòng thời gian demo</Typography>
      <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.45rem' }, mb: 3 }}>Các cột mốc phát triển</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {siteContent.timeline.map((item, index) => (
          <Box key={`${item.year}-${item.title}`} sx={{ p: 3, borderRadius: '16px', border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.025)', position: 'relative' }}>
            <Typography sx={{ color: '#818cf8', fontWeight: 850, fontSize: '0.8rem', mb: 1.1 }}>0{index + 1} · {item.year}</Typography>
            <Typography variant="h3" sx={{ fontSize: '1.12rem', mb: 0.8 }}>{item.title}</Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.86rem', lineHeight: 1.65 }}>{item.description}</Typography>
          </Box>
        ))}
      </Box>
    </Box>

    <Box component="section">
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'end' }, flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography sx={{ color: '#818cf8', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase', mb: 1 }}>Khung chính sách</Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.8rem', md: '2.45rem' } }}>Nội dung cần hoàn thiện trước khi công bố</Typography>
        </Box>
        <Box sx={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 0.8, fontSize: '0.82rem' }}><ShieldAlert size={17} /> Không phải tư vấn pháp lý</Box>
      </Box>
      <Grid container spacing={2}>
        {siteContent.policies.map(policy => (
          <Grid key={policy.title} size={{ xs: 12, sm: 6, lg: 4 }} sx={{ display: 'flex' }}>
            <Box sx={{ p: 2.6, borderRadius: '15px', width: '100%', border: '1px solid rgba(255,255,255,.07)', background: 'rgba(255,255,255,.025)' }}>
              <FileText size={20} color="#818cf8" />
              <Typography variant="h3" sx={{ fontSize: '1.05rem', mt: 1.3, mb: 0.7 }}>{policy.title}</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem', lineHeight: 1.65 }}>{policy.summary}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>

    <Box sx={{ mt: { xs: 7, md: 9 }, p: { xs: 3, md: 4 }, borderRadius: '18px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(79,70,229,.17), rgba(6,182,212,.07))', border: '1px solid rgba(129,140,248,.2)' }}>
      <Typography variant="h2" sx={{ fontSize: { xs: '1.45rem', md: '1.8rem' }, mb: 1 }}>Sẵn sàng khám phá hệ sinh thái AlgoForge?</Typography>
      <Typography sx={{ color: 'text.secondary', mb: 2.4 }}>Xem danh mục sản phẩm hoặc kết nối với đội ngũ hỗ trợ.</Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1.2 }}>
        <Button component={Link} to="/products" sx={btnPrimarySx}>Xem sản phẩm <ArrowRight size={16} /></Button>
        <Button component={Link} to="/support" sx={{ ...btnPrimarySx, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', '&:hover': { background: 'rgba(255,255,255,.11)' } }}>Liên hệ hỗ trợ</Button>
      </Box>
    </Box>
  </Container>
  );
};

export default About;
