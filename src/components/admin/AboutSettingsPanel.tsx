import React, { useEffect, useState } from 'react';
import { Box, Button, InputBase, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Milestone as MilestoneIcon, Plus, Save, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import type { AboutInfo, Milestone } from '../../config/siteContent';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { adminInputSx, btnPrimarySx, btnSecondarySx, glassPanelSx, panelPaddingSx } from '../../theme';

interface Props {
  onToast: (message: string, type: 'success' | 'error') => void;
}

const MAX_MILESTONES = 6;

const emptyMilestone: Milestone = { year: '', title: '', description: '' };

/**
 * Milestone timeline for the About page.
 *
 * The timeline used to be three hardcoded entries dated "20XX" under a heading
 * that read "Dòng thời gian demo". With no milestones stored the About page
 * hides the section entirely, so an unconfigured install shows nothing rather
 * than placeholder years.
 */
export const AboutSettingsPanel: React.FC<Props> = ({ onToast }) => {
  const { about, setAbout: setGlobalAbout, refreshAbout } = useSiteSettings();
  const [milestones, setMilestones] = useState<Milestone[]>(about.milestones);
  const [saving, setSaving] = useState(false);

  // Adopt the provider's value when a new object arrives, without discarding an
  // edit already in progress.
  const [synced, setSynced] = useState<AboutInfo>(about);
  if (about !== synced) {
    setSynced(about);
    setMilestones(about.milestones);
  }

  useEffect(() => {
    refreshAbout();
  }, [refreshAbout]);

  const updateField = (index: number, field: keyof Milestone, value: string) => {
    setMilestones(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addMilestone = () => {
    if (milestones.length >= MAX_MILESTONES) {
      onToast(`Tối đa ${MAX_MILESTONES} cột mốc.`, 'error');
      return;
    }
    setMilestones(prev => [...prev, { ...emptyMilestone }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      // The backend drops rows that are entirely blank, so a row the admin
      // added but never filled in never reaches the public page.
      const saved = await api.put<AboutInfo>('/api/admin/settings/about', { milestones });
      setGlobalAbout(saved);
      setMilestones(saved.milestones);
      onToast('Đã lưu các cột mốc. Trang Về chúng tôi đã được cập nhật.', 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Không thể lưu cột mốc.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSave} sx={{ ...glassPanelSx, padding: panelPaddingSx, marginTop: '1.5rem' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h2" sx={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MilestoneIcon size={19} color="#6366f1" />
            Cột mốc phát triển ({milestones.length}/{MAX_MILESTONES})
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            Hiển thị ở trang Về chúng tôi. Để trống danh sách thì cả mục "Các cột mốc phát triển" sẽ được ẩn.
          </Typography>
        </Box>
        <Button
          type="button"
          onClick={addMilestone}
          disabled={milestones.length >= MAX_MILESTONES}
          sx={{ ...btnSecondarySx, height: '40px', flexShrink: 0, whiteSpace: 'nowrap', width: { xs: '100%', sm: 'auto' } }}
        >
          <Plus size={15} /> Thêm cột mốc
        </Button>
      </Box>

      {milestones.length === 0 ? (
        <Typography sx={{ color: 'text.disabled', fontSize: '0.85rem' }}>
          Chưa có cột mốc nào. Mục này đang được ẩn trên trang Về chúng tôi.
        </Typography>
      ) : (
        milestones.map((item, index) => (
          <Box
            key={index}
            sx={{ ...glassPanelSx, padding: '1.25rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <Typography sx={{ color: 'primary.main', fontWeight: 800, fontSize: '0.8rem' }}>
                Cột mốc {String(index + 1).padStart(2, '0')}
              </Typography>
              <Button
                type="button"
                onClick={() => removeMilestone(index)}
                sx={{ ...btnSecondarySx, padding: '0.3rem 0.7rem', fontSize: '0.76rem', color: 'error.main', borderColor: 'rgba(239,68,68,0.25)' }}
              >
                <Trash2 size={14} /> Xoá
              </Button>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Năm</Typography>
                <InputBase
                  value={item.year}
                  onChange={e => updateField(index, 'year', e.target.value)}
                  sx={adminInputSx}
                  placeholder="Ví dụ: 2023"
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 9 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Tiêu đề</Typography>
                <InputBase
                  value={item.title}
                  onChange={e => updateField(index, 'title', e.target.value)}
                  sx={adminInputSx}
                  placeholder="Ví dụ: Khởi tạo AlgoForge"
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Mô tả</Typography>
                <InputBase
                  multiline
                  rows={2}
                  value={item.description}
                  onChange={e => updateField(index, 'description', e.target.value)}
                  sx={adminInputSx}
                  placeholder="Mô tả ngắn về cột mốc này..."
                  inputProps={{ maxLength: 600 }}
                />
              </Grid>
            </Grid>
          </Box>
        ))
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Button type="submit" disabled={saving} sx={{ ...btnPrimarySx, height: '42px', width: { xs: '100%', sm: 'auto' } }}>
          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cột mốc'}
        </Button>
      </Box>
    </Box>
  );
};

export default AboutSettingsPanel;
