import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Box, CircularProgress, Container, Typography } from '@mui/material';
import api from '../utils/api';
import { LEGAL_TITLES, type LegalDocument, type LegalSlug } from '../config/legal';
import { glassPanelSx, pageContainerSx, pageTitleSx, breakLongValueSx } from '../theme';

/**
 * One page renders every legal document, keyed by the :slug route param.
 * Three near-identical components would drift apart the first time one of them
 * was restyled.
 */
export const LegalPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<LegalDocument>(`/api/settings/legal/${slug}`);
        if (!cancelled) setDocument(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Không tải được nội dung.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    // A slug change remounts the content, and an in-flight response for the
    // previous slug must not overwrite the new one.
    return () => { cancelled = true; };
  }, [slug]);

  const formattedDate = document?.updated_at
    ? new Date(document.updated_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  return (
    <Container maxWidth="lg" sx={{ ...pageContainerSx, pt: { xs: 1, md: 2 } }}>
      <Box component="header" sx={{ mb: { xs: 4, md: 6 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5, color: '#818cf8' }}>
          <FileText size={20} />
          <Typography component="span" sx={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '.13em', textTransform: 'uppercase' }}>
            Pháp lý
          </Typography>
        </Box>
        <Typography variant="h1" sx={{ ...pageTitleSx, ...breakLongValueSx }}>
          {document?.title || LEGAL_TITLES[(slug as LegalSlug)] || 'Nội dung pháp lý'}
        </Typography>
        {formattedDate && (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 1.5 }}>
            Cập nhật lần cuối: {formattedDate}
          </Typography>
        )}
      </Box>

      <Box sx={{ ...glassPanelSx, p: { xs: 2.5, md: 4.5 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={28} />
          </Box>
        ) : error ? (
          <Typography sx={{ color: 'error.main' }}>{error}</Typography>
        ) : document?.content ? (
          // The admin edits plain text, so newlines are the only formatting to
          // preserve. Rendering it as text rather than HTML also means an admin
          // account cannot inject script into a public page.
          <Typography
            component="div"
            sx={{
              color: 'text.secondary',
              lineHeight: 1.9,
              fontSize: '0.95rem',
              whiteSpace: 'pre-wrap',
              ...breakLongValueSx,
            }}
          >
            {document.content}
          </Typography>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ color: 'text.secondary', mb: 1 }}>
              Nội dung đang được cập nhật.
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>
              Vui lòng liên hệ đội ngũ hỗ trợ nếu bạn cần thông tin này ngay.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default LegalPage;
