import React, { useEffect } from 'react';
import { HelpCircle, Mail, MessageSquare } from 'lucide-react';
import { Box, Container, Typography, Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, btnSecondarySx } from '../theme';

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
      sx={{
        maxWidth: '1600px !important',
        paddingBottom: '4rem',
        paddingTop: '2rem',
        animation: 'fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        '@keyframes fadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box component="header" sx={{ textAlign: 'center', margin: '2rem 0 3rem' }}>
        <Typography
          variant="h1"
          sx={{
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, #fff 30%, #9ca3af)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Customer Support
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
          Have questions or need technical assistance with your trading bot? Our dedicated team of quantitative engineers is here to help.
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
              Live Discord Community
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Join our professional quant discord server for real-time discussion, setups sharing, and direct developer help.
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
              Join Server
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
              Email Helpdesk
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Send us a technical query or license binding request. We respond to all inquiries within 24 business hours.
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
              Email Us
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
              FAQ & Documentation
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              Read instructions on how to install EX5 files in MT5, configure terminal WebRequests, and troubleshoot session tokens.
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
              Browse Guides
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Support;
