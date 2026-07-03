import React from 'react';
import { Shield, Cpu, Zap, Target } from 'lucide-react';
import { Box, Container, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { glassPanelSx, pageContainerSx, pageTitleSx } from '../theme';

export const About: React.FC = () => {
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
          About AlgoForge
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
          Empowering quantitative traders with institutional-grade automation tools and expert execution systems.
        </Typography>
      </Box>

      <Box sx={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <Box component="section" sx={{ ...glassPanelSx, padding: { xs: '1.5rem', sm: '2.5rem' } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: '1.5rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fff',
            }}
          >
            <Target size={22} color="#6366f1" />
            Our Mission
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.7,
              fontSize: '0.95rem',
            }}
          >
            At AlgoForge, we bridge the gap between retail trading and high-frequency quantitative execution. We design and compile cutting-edge trading bots, Expert Advisors (EAs), and precise indicators for the MetaTrader 5 platform, helping traders automate their strategy execution with minimal latency and maximum reliability.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Feature 1 */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                ...glassPanelSx,
                padding: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
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
                <Cpu size={24} color="#06b6d4" />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>
                Institutional Algorithms
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Expert Advisors backtested on extensive historical tick data with real spread and slippage simulation.
              </Typography>
            </Box>
          </Grid>

          {/* Feature 2 */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                ...glassPanelSx,
                padding: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
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
                <Zap size={24} color="#6366f1" />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>
                Ultra-Low Latency
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Optimized MQL5 source code designed for rapid order execution and minimal terminal overhead.
              </Typography>
            </Box>
          </Grid>

          {/* Feature 3 */}
          <Grid size={{ xs: 12, sm: 4 }}>
            <Box
              sx={{
                ...glassPanelSx,
                padding: '1.5rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
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
                <Shield size={24} color="#10b981" />
              </Box>
              <Typography variant="h3" sx={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.25rem' }}>
                Secure Licensing
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', lineHeight: 1.5 }}>
                Our custom-built secure API key verification validates your license directly against our secure servers.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default About;
