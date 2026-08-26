export type SupportChannelKey = 'email' | 'zalo' | 'discord' | 'telegram' | 'facebook';

export interface SupportChannel {
  key: SupportChannelKey;
  label: string;
  description: string;
  actionLabel: string;
}

export interface TeamMember {
  name: string;
  role: string;
  description: string;
}

// Mirrors the backend PartnerInfo schema (GET /api/settings/partner). Field
// names are snake_case to match the API payload exactly.
export interface PartnerInfo {
  name: string;
  relationship: string;
  website: string;
  founded_year: string;
  introduction: string;
  note: string;
  benefits: string[];
}

// Used until the API responds, and as the fallback when it is unreachable.
// The backend ships the same defaults in app/services/partner_settings.py.
export const defaultPartner: PartnerInfo = {
  name: 'GTC',
  relationship: 'Đối tác đồng thương hiệu',
  // Blank rather than a placeholder: Home and About hide these fields when
  // empty, so an unconfigured install shows nothing instead of '20XX'.
  website: '',
  founded_year: '',
  introduction:
    'GTC là đối tác sàn giao dịch được giới thiệu trong hệ sinh thái AlgoForge, hướng tới trải nghiệm tiếp cận thị trường minh bạch, linh hoạt và giàu tính công nghệ.',
  note: '',
  benefits: [
    'Hạ tầng giao dịch định hướng công nghệ',
    'Kết nối hệ sinh thái công cụ AlgoForge',
    'Đồng hành cùng nhà giao dịch trong quá trình vận hành',
  ],
};

// Mirrors the backend ContactInfo schema (GET /api/settings/contact).
// Every field is optional: a blank value means the channel is not published
// yet, and the UI hides it rather than rendering a dead link.
export interface ContactInfo {
  email: string;
  zalo: string;
  discord: string;
  telegram: string;
  facebook: string;
  hotline: string;
  business_name: string;
  business_address: string;
  business_tax_id: string;
}

export const defaultContact: ContactInfo = {
  email: '',
  zalo: '',
  discord: '',
  telegram: '',
  facebook: '',
  hotline: '',
  business_name: '',
  business_address: '',
  business_tax_id: '',
};

// Mirrors the backend AboutInfo schema (GET /api/settings/about). Empty by
// default: the About page hides the timeline rather than showing placeholder
// years, which is what the hardcoded "20XX" entries used to do.
export interface Milestone {
  year: string;
  title: string;
  description: string;
}

export interface AboutInfo {
  milestones: Milestone[];
}

export const defaultAbout: AboutInfo = { milestones: [] };

export const siteContent = {
  brand: {
    name: 'AlgoForge',
    tagline: 'Công nghệ vững vàng cho hành trình giao dịch kỷ luật.',
    description:
      'Nền tảng tuyển chọn công cụ giao dịch tự động, chỉ báo và tiện ích MetaTrader dành cho nhà giao dịch hiện đại.',
  },
  team: [
    {
      name: 'Nhóm Phát triển Sản phẩm',
      role: 'AlgoForge Engineering',
      description: 'Xây dựng, kiểm thử và duy trì các công cụ giao dịch trong danh mục.',
    },
    {
      name: 'Nhóm Đồng hành Đối tác',
      role: 'Partner Success',
      description: 'Cung cấp thông tin kết nối và hướng dẫn trải nghiệm dịch vụ từ đối tác.',
    },
    {
      name: 'Nhóm Hỗ trợ Khách hàng',
      role: 'Customer Support',
      description: 'Tiếp nhận câu hỏi về cài đặt, bản quyền và quá trình sử dụng sản phẩm.',
    },
  ] as TeamMember[],
  supportChannels: [
    {
      key: 'email',
      label: 'Email',
      description: 'Gửi câu hỏi chi tiết về sản phẩm, tài khoản hoặc bản quyền.',
      actionLabel: 'Gửi email',
    },
    {
      key: 'zalo',
      label: 'Zalo',
      description: 'Trao đổi nhanh với tài khoản hoặc Official Account của AlgoForge.',
      actionLabel: 'Nhắn qua Zalo',
    },
    {
      key: 'discord',
      label: 'Discord',
      description: 'Tham gia cộng đồng để trao đổi cấu hình và kinh nghiệm sử dụng.',
      actionLabel: 'Vào Discord',
    },
    {
      key: 'telegram',
      label: 'Telegram',
      description: 'Mở cuộc trò chuyện trực tiếp hoặc tham gia nhóm hỗ trợ Telegram.',
      actionLabel: 'Mở Telegram',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      description: 'Bắt đầu cuộc trò chuyện với AlgoForge qua Facebook Messenger.',
      actionLabel: 'Mở Messenger',
    },
  ] as SupportChannel[],
};

const normalizeSuffix = (value: string): string => value.trim().replace(/^@/, '').replace(/^\/+/, '');

export const isDemoValue = (value: string): boolean => {
  const normalized = value.trim();
  return normalized.length === 0 || normalized.startsWith('REPLACE_');
};

export const getPartnerWebsite = (partner: PartnerInfo): string | null => {
  const value = partner.website.trim();
  if (isDemoValue(value)) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

export const getSupportHref = (key: SupportChannelKey, contact: ContactInfo): string | null => {
  const raw = (contact[key] || '').trim();
  if (isDemoValue(raw)) return null;

  const suffix = normalizeSuffix(raw);
  switch (key) {
    case 'email':
      return `mailto:${raw}?subject=${encodeURIComponent('Yêu cầu hỗ trợ từ website AlgoForge')}`;
    case 'zalo':
      return `https://zalo.me/${suffix}`;
    case 'discord':
      // A full invite URL is accepted as-is so an admin can paste what Discord gives them.
      return /^https?:\/\//i.test(raw) ? raw : `https://discord.gg/${suffix}`;
    case 'telegram':
      return /^https?:\/\//i.test(raw) ? raw : `https://t.me/${suffix}`;
    case 'facebook':
      return /^https?:\/\//i.test(raw) ? raw : `https://m.me/${suffix}`;
    default:
      return null;
  }
};

export const getSupportChannel = (key: SupportChannelKey): SupportChannel =>
  siteContent.supportChannels.find(channel => channel.key === key) as SupportChannel;
