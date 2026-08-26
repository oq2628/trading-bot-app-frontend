import React, { useEffect, useState } from 'react';
import { Box, Button, InputBase, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Save, Phone } from 'lucide-react';
import api from '../../utils/api';
import { getSupportHref, type ContactInfo } from '../../config/siteContent';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { adminInputSx, btnPrimarySx, glassPanelSx, panelPaddingSx, breakLongValueSx } from '../../theme';

interface Props {
  onToast: (message: string, type: 'success' | 'error') => void;
}

// key, label, placeholder, and the hint shown under the field.
const CHANNEL_FIELDS: Array<{
  key: keyof Pick<ContactInfo, 'email' | 'zalo' | 'discord' | 'telegram' | 'facebook' | 'hotline'>;
  label: string;
  placeholder: string;
}> = [
  { key: 'email', label: 'Email hỗ trợ', placeholder: 'hotro@tencongty.vn' },
  { key: 'hotline', label: 'Hotline', placeholder: '1900 1234' },
  { key: 'zalo', label: 'Zalo', placeholder: 'Số điện thoại hoặc ID Zalo' },
  { key: 'telegram', label: 'Telegram', placeholder: 'username hoặc link t.me/...' },
  { key: 'facebook', label: 'Facebook', placeholder: 'username hoặc link m.me/...' },
  { key: 'discord', label: 'Discord', placeholder: 'mã mời hoặc link discord.gg/...' },
];

const BUSINESS_FIELDS: Array<{ key: keyof ContactInfo; label: string; placeholder: string }> = [
  { key: 'business_name', label: 'Tên doanh nghiệp', placeholder: 'Công ty TNHH ...' },
  { key: 'business_tax_id', label: 'Mã số thuế', placeholder: '0101234567' },
  { key: 'business_address', label: 'Địa chỉ đăng ký', placeholder: 'Số nhà, đường, quận/huyện, tỉnh/thành' },
];

export const ContactSettingsPanel: React.FC<Props> = ({ onToast }) => {
  const { contact, setContact: setGlobalContact, refreshContact } = useSiteSettings();
  const [form, setForm] = useState<ContactInfo>(contact);
  const [saving, setSaving] = useState(false);

  // The provider may still be loading when this panel mounts. Adopt the value
  // when a new object arrives, without discarding an edit already in progress.
  const [synced, setSynced] = useState<ContactInfo>(contact);
  if (contact !== synced) {
    setSynced(contact);
    setForm(contact);
  }

  useEffect(() => {
    refreshContact();
  }, [refreshContact]);

  const update = (key: keyof ContactInfo, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const saved = await api.put<ContactInfo>('/api/admin/settings/contact', form);
      // Push straight into the provider so the footer and support page update
      // without a reload.
      setGlobalContact(saved);
      setForm(saved);
      onToast('Đã lưu thông tin liên hệ.', 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Không thể lưu thông tin liên hệ.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSave} sx={{ ...glassPanelSx, padding: panelPaddingSx }}>
      <Box sx={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="h2" sx={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Phone size={19} color="#6366f1" />
          Thông tin liên hệ
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', marginTop: '0.35rem' }}>
          Hiển thị ở chân trang và trang Hỗ trợ. Kênh để trống sẽ được ẩn đi thay vì hiện liên kết hỏng.
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {CHANNEL_FIELDS.map(field => {
          // Show the admin exactly where the button will send visitors, so a
          // malformed handle is obvious before it reaches the public site.
          const preview = field.key === 'hotline' ? null : getSupportHref(field.key, form);
          return (
            <Grid key={field.key} size={{ xs: 12, sm: 6 }}>
              <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {field.label}
              </Typography>
              <InputBase
                value={form[field.key]}
                onChange={e => update(field.key, e.target.value)}
                sx={adminInputSx}
                placeholder={field.placeholder}
                inputProps={{ maxLength: 300 }}
              />
              {field.key !== 'hotline' && (
                <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', marginTop: '0.35rem', ...breakLongValueSx }}>
                  {preview ? `Liên kết: ${preview}` : 'Để trống thì kênh này sẽ được ẩn.'}
                </Typography>
              )}
            </Grid>
          );
        })}
      </Grid>

      <Box sx={{ ...glassPanelSx, padding: '1.25rem', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
        <Typography variant="h3" sx={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
          Thông tin doanh nghiệp
        </Typography>
        <Typography sx={{ color: 'text.disabled', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Hiển thị ở chân trang. Website bán hàng thu tiền thật thường được yêu cầu công khai các thông tin này.
        </Typography>
        <Grid container spacing={2}>
          {BUSINESS_FIELDS.map(field => (
            <Grid key={field.key} size={{ xs: 12, sm: field.key === 'business_address' ? 12 : 6 }}>
              <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {field.label}
              </Typography>
              <InputBase
                value={form[field.key]}
                onChange={e => update(field.key, e.target.value)}
                sx={adminInputSx}
                placeholder={field.placeholder}
                inputProps={{ maxLength: 400 }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Button type="submit" disabled={saving} sx={{ ...btnPrimarySx, height: '42px', width: { xs: '100%', sm: 'auto' } }}>
          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu thông tin liên hệ'}
        </Button>
      </Box>
    </Box>
  );
};

export default ContactSettingsPanel;
