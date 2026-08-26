import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, InputBase, Typography } from '@mui/material';
import { FileText, Save, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import type { LegalDocument } from '../../config/legal';
import { adminInputSx, btnPrimarySx, btnSecondarySx, glassPanelSx, panelPaddingSx } from '../../theme';

interface Props {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const LegalSettingsPanel: React.FC<Props> = ({ onToast }) => {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>('terms');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // The first setState happens after the await, so this never updates state
    // synchronously during the effect. The cancelled flag stops a late response
    // from overwriting an edit made after unmount.
    const load = async () => {
      try {
        const data = await api.get<LegalDocument[]>('/api/admin/settings/legal');
        if (cancelled) return;
        setDocuments(data);
        const current = data[0];
        if (current) {
          setActiveSlug(current.slug);
          setTitle(current.title);
          setContent(current.content);
        }
      } catch (err) {
        if (!cancelled) {
          onToast(err instanceof Error ? err.message : 'Không tải được nội dung pháp lý.', 'error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [onToast]);

  const selectDocument = (slug: string) => {
    const doc = documents.find(d => d.slug === slug);
    if (!doc) return;
    setActiveSlug(slug);
    setTitle(doc.title);
    setContent(doc.content);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const saved = await api.put<LegalDocument>(`/api/admin/settings/legal/${activeSlug}`, { title, content });
      setDocuments(prev => prev.map(d => (d.slug === saved.slug ? saved : d)));
      setTitle(saved.title);
      setContent(saved.content);
      onToast(`Đã lưu "${saved.title}". Trang công khai đã được cập nhật.`, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Không thể lưu nội dung.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const activeDocument = documents.find(d => d.slug === activeSlug);

  return (
    <Box component="form" onSubmit={handleSave} sx={{ ...glassPanelSx, padding: panelPaddingSx }}>
      <Box sx={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="h2" sx={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={19} color="#6366f1" />
          Trang pháp lý
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', marginTop: '0.35rem' }}>
          Điều khoản, bảo mật và hoàn tiền. Nội dung để trống sẽ hiển thị "đang cập nhật" thay vì làm hỏng liên kết ở chân trang.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress size={26} />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {documents.map(doc => {
              const isSelected = doc.slug === activeSlug;
              return (
                <Button
                  key={doc.slug}
                  type="button"
                  onClick={() => selectDocument(doc.slug)}
                  sx={{
                    ...(isSelected ? btnPrimarySx : btnSecondarySx),
                    height: '36px',
                    fontSize: '0.82rem',
                    // An empty document is the thing an admin most needs to
                    // notice, so mark it in the selector itself.
                    opacity: doc.content ? 1 : 0.75,
                  }}
                >
                  {doc.title}{!doc.content && ' (trống)'}
                </Button>
              );
            })}
          </Box>

          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Tiêu đề
          </Typography>
          <InputBase
            value={title}
            onChange={e => setTitle(e.target.value)}
            sx={adminInputSx}
            inputProps={{ maxLength: 200 }}
          />

          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5, mt: 2 }}>
            Nội dung ({content.length.toLocaleString('vi-VN')} ký tự)
          </Typography>
          <InputBase
            multiline
            rows={18}
            value={content}
            onChange={e => setContent(e.target.value)}
            sx={{ ...adminInputSx, fontFamily: '"Outfit", sans-serif', lineHeight: 1.7 }}
            placeholder={'Nhập nội dung chính sách.\n\nXuống dòng được giữ nguyên khi hiển thị. Nội dung được hiển thị dưới dạng văn bản thuần, không phải HTML.'}
          />
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', marginTop: '0.35rem' }}>
            Xuống dòng được giữ nguyên. Nội dung hiển thị dạng văn bản thuần nên không chèn được HTML hay script.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: '1rem', marginTop: '1.5rem' }}>
            <Box>
              {activeDocument?.updated_at && (
                <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>
                  Cập nhật lần cuối: {new Date(activeDocument.updated_at).toLocaleString('vi-VN')}
                </Typography>
              )}
              <Typography
                component={Link}
                to={`/legal/${activeSlug}`}
                target="_blank"
                sx={{ fontSize: '0.78rem', color: 'primary.main', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                Xem trang công khai <ExternalLink size={12} />
              </Typography>
            </Box>
            <Button type="submit" disabled={saving} sx={{ ...btnPrimarySx, height: '42px', width: { xs: '100%', sm: 'auto' } }}>
              <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu nội dung'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default LegalSettingsPanel;
