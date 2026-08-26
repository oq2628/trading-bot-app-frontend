import React, { useEffect, useState } from 'react';
import { Box, Button, CircularProgress, FormControl, InputBase, MenuItem, Select, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { Mail, Save, Send, ShieldCheck, AlertTriangle } from 'lucide-react';
import api from '../../utils/api';
import { adminInputSx, btnPrimarySx, btnSecondarySx, glassPanelSx, panelPaddingSx } from '../../theme';

interface Props {
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  sender: string;
  security: string;
  has_password: boolean;
}

const SECURITY_OPTIONS = [
  { value: 'starttls', label: 'STARTTLS (thường dùng cổng 587)' },
  { value: 'ssl', label: 'SSL/TLS (thường dùng cổng 465)' },
  { value: 'none', label: 'Không mã hoá (chỉ dùng cho relay nội bộ)' },
];

export const SmtpSettingsPanel: React.FC<Props> = ({ onToast }) => {
  const [config, setConfig] = useState<SmtpConfig | null>(null);
  const [password, setPassword] = useState('');
  const [clearPassword, setClearPassword] = useState(false);
  const [testAddress, setTestAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<SmtpConfig>('/api/admin/settings/smtp');
        setConfig(data);
      } catch (err) {
        onToast(err instanceof Error ? err.message : 'Không tải được cấu hình email.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [onToast]);

  const update = (key: keyof SmtpConfig, value: string | number) => {
    setConfig(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      setSaving(true);
      const saved = await api.put<SmtpConfig>('/api/admin/settings/smtp', {
        ...config,
        password,
        clear_password: clearPassword,
      });
      setConfig(saved);
      setPassword('');
      setClearPassword(false);
      onToast('Đã lưu cấu hình email. Hãy gửi email kiểm tra để xác nhận.', 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Không thể lưu cấu hình email.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testAddress.trim()) {
      onToast('Nhập địa chỉ email để nhận thư kiểm tra.', 'error');
      return;
    }
    try {
      setTesting(true);
      const res = await api.post<{ message: string }>('/api/admin/settings/smtp/test', { to_address: testAddress.trim() });
      onToast(res.message, 'success');
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Không gửi được email kiểm tra.', 'error');
    } finally {
      setTesting(false);
    }
  };

  if (loading || !config) {
    return (
      <Box sx={{ ...glassPanelSx, padding: panelPaddingSx, display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress size={26} />
      </Box>
    );
  }

  const isConfigured = Boolean(config.host.trim());

  return (
    <Box component="form" onSubmit={handleSave} sx={{ ...glassPanelSx, padding: panelPaddingSx }}>
      <Box sx={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="h2" sx={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mail size={19} color="#6366f1" />
          Cài đặt email (SMTP)
        </Typography>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', marginTop: '0.35rem' }}>
          Dùng để gửi email đặt lại mật khẩu. Chưa cấu hình thì người dùng quên mật khẩu sẽ không nhận được thư nào.
        </Typography>
      </Box>

      {!isConfigured && (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
          <Box sx={{ color: 'warning.main', display: 'flex', flexShrink: 0, mt: '2px' }}><AlertTriangle size={18} /></Box>
          <Typography sx={{ fontSize: '0.85rem', color: 'warning.main', lineHeight: 1.6 }}>
            Chưa cấu hình SMTP. Chức năng "Quên mật khẩu" hiện không gửi được email — người dùng mất mật khẩu sẽ không thể lấy lại tài khoản đang có số dư.
          </Typography>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Máy chủ SMTP *</Typography>
          <InputBase value={config.host} onChange={e => update('host', e.target.value)} sx={adminInputSx} placeholder="smtp.gmail.com" inputProps={{ maxLength: 255 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Cổng</Typography>
          <InputBase type="number" value={config.port} onChange={e => update('port', Number(e.target.value) || 0)} sx={adminInputSx} inputProps={{ min: 1, max: 65535 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Tài khoản đăng nhập</Typography>
          <InputBase value={config.username} onChange={e => update('username', e.target.value)} sx={adminInputSx} placeholder="mailer@tencongty.vn" inputProps={{ maxLength: 255 }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Địa chỉ người gửi</Typography>
          <InputBase value={config.sender} onChange={e => update('sender', e.target.value)} sx={adminInputSx} placeholder="no-reply@tencongty.vn" inputProps={{ maxLength: 255 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>Chế độ bảo mật</Typography>
          <FormControl sx={{ width: '100%' }}>
            <Select
              value={config.security}
              onChange={e => update('security', e.target.value)}
              sx={{ ...adminInputSx, padding: 0, '& .MuiSelect-select': { padding: '0.65rem 0.85rem' } }}
            >
              {SECURITY_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Typography component="label" sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
            Mật khẩu {config.has_password && !clearPassword ? '(đã lưu)' : ''}
          </Typography>
          <InputBase
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setClearPassword(false); }}
            sx={adminInputSx}
            placeholder={config.has_password ? 'Để trống nếu giữ mật khẩu hiện tại' : 'Mật khẩu hoặc app password'}
            inputProps={{ maxLength: 500 }}
            autoComplete="new-password"
          />
          {/* The stored password is encrypted and never sent back, so there is
              nothing to show here — only whether one exists. */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
            <ShieldCheck size={13} color="#10b981" />
            <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
              Mật khẩu được mã hoá khi lưu và không bao giờ hiển thị lại.
            </Typography>
          </Box>
          {config.has_password && (
            <Button
              type="button"
              onClick={() => { setClearPassword(true); setPassword(''); }}
              sx={{ ...btnSecondarySx, marginTop: '0.5rem', padding: '0.3rem 0.7rem', fontSize: '0.76rem' }}
            >
              {clearPassword ? 'Sẽ xoá mật khẩu khi lưu' : 'Xoá mật khẩu đã lưu'}
            </Button>
          )}
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
        <Button type="submit" disabled={saving} sx={{ ...btnPrimarySx, height: '42px', width: { xs: '100%', sm: 'auto' } }}>
          <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
        </Button>
      </Box>

      <Box sx={{ ...glassPanelSx, padding: '1.25rem', marginTop: '1.5rem', border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
        <Typography variant="h3" sx={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
          Gửi email kiểm tra
        </Typography>
        <Typography sx={{ color: 'text.disabled', fontSize: '0.8rem', marginBottom: '1rem' }}>
          Gửi một email thật tới địa chỉ bên dưới. Đây là cách duy nhất để chắc chắn cấu hình hoạt động trước khi người dùng phụ thuộc vào nó.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: '0.75rem' }}>
          <InputBase
            type="email"
            value={testAddress}
            onChange={e => setTestAddress(e.target.value)}
            sx={{ ...adminInputSx, flex: 1 }}
            placeholder="dia-chi-cua-ban@example.com"
          />
          <Button
            type="button"
            onClick={handleTest}
            disabled={testing}
            sx={{ ...btnSecondarySx, height: '42px', flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            <Send size={15} /> {testing ? 'Đang gửi...' : 'Gửi thử'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SmtpSettingsPanel;
