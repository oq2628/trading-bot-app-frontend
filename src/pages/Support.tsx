import React, { useEffect } from 'react';
import { HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { Box, Container, Typography, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, btnSecondarySx, pageContainerSx, pageTitleSx } from '../theme';

export const Support: React.FC = () => {
  useEffect(() => {
    const CRISP_WEBSITE_ID = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
    const win = window as any;
    win.$crisp = win.$crisp || [];
    win.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;

    let script = document.getElementById('crisp-inject') as HTMLScriptElement | null;
    if (!script) {
      const newScript = document.createElement('script');
      newScript.id = 'crisp-inject';
      newScript.src = 'https://client.crisp.chat/l.js';
      newScript.async = true;
      document.head.appendChild(newScript);
    }

    // Show chat on mount
    try {
      if (win.$crisp && typeof win.$crisp.push === 'function') {
        win.$crisp.push(["do", "chat:show"]);
      }
    } catch (e) {
      console.warn("Failed to show Crisp chat launcher:", e);
    }

    // Hide chat on unmount
    return () => {
      try {
        if (win.$crisp && typeof win.$crisp.push === 'function') {
          win.$crisp.push(["do", "chat:hide"]);
        }
      } catch (e) {
        console.warn("Failed to hide Crisp chat launcher:", e);
      }
    };
  }, []);

  return (
    <Container
      maxWidth="xl"
      sx={{ ...pageContainerSx, paddingTop: { xs: '0.5rem', md: '2rem' } }}
    >
      <Box component="header" sx={{ textAlign: 'center', margin: '2rem 0 3rem' }}>
        <Typography
          variant="h1"
          sx={{
            ...pageTitleSx,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff 30%, #9ca3af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Hỗ trợ Khách hàng
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontSize: '1.1rem',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.6,
          }}
        >
          Bạn có câu hỏi hoặc cần hỗ trợ kỹ thuật cho robot giao dịch của mình? Đội ngũ kỹ sư định lượng chuyên nghiệp của chúng tôi luôn sẵn sàng hỗ trợ.
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ marginTop: '2rem' }}>
        {/* Support Card 1 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              ...glassPanelSx,
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%',
            }}
          >
            <Box
              sx={{
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MessageSquare size={24} color="#6366f1" />
            </Box>
            <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Cộng đồng Discord Trực tiếp
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Tham gia máy chủ Discord chuyên nghiệp của chúng tôi để cùng thảo luận trực tiếp, chia sẻ cấu hình cài đặt và nhận trợ giúp từ các nhà phát triển.
            </Typography>
            <Button
              component="a"
              href="#"
              onClick={(e) => e.preventDefault()}
              sx={{
                ...btnSecondarySx,
                marginTop: 'auto',
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.85rem',
              }}
            >
              Tham gia Máy chủ
            </Button>
          </Box>
        </Grid>

        {/* Support Card 2 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              ...glassPanelSx,
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%',
            }}
          >
            <Box
              sx={{
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Mail size={24} color="#06b6d4" />
            </Box>
            <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Hỗ trợ qua Email
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Gửi cho chúng tôi các câu hỏi kỹ thuật hoặc yêu cầu liên kết bản quyền. Chúng tôi phản hồi mọi thắc mắc trong vòng 24 giờ làm việc.
            </Typography>
            <Button
              component="a"
              href="mailto:support@algoforge.com"
              sx={{
                ...btnSecondarySx,
                marginTop: 'auto',
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.85rem',
              }}
            >
              Gửi Email
            </Button>
          </Box>
        </Grid>

        {/* Support Card 3 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
            sx={{
              ...glassPanelSx,
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              alignItems: 'center',
              textAlign: 'center',
              height: '100%',
            }}
          >
            <Box
              sx={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                width: '50px',
                height: '50px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={24} color="#10b981" />
            </Box>
            <Typography variant="h3" sx={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
              Câu hỏi thường gặp & Hướng dẫn
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Đọc hướng dẫn cách cài đặt tệp tin EX5 trong phần mềm MT5, cấu hình WebRequests trên terminal và khắc phục sự cố mã phiên đăng nhập.
            </Typography>
            <Button
              component="a"
              href="#"
              onClick={(e) => e.preventDefault()}
              sx={{
                ...btnSecondarySx,
                marginTop: 'auto',
                width: '100%',
                padding: '0.5rem',
                fontSize: '0.85rem',
              }}
            >
              Xem Hướng dẫn
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Support;
