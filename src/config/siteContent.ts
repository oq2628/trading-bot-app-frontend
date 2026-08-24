export type SupportChannelKey = 'email' | 'zalo' | 'discord' | 'telegram' | 'facebook';

export interface SupportChannel {
  key: SupportChannelKey;
  label: string;
  description: string;
  suffix: string;
  actionLabel: string;
}

export interface TeamMember {
  name: string;
  role: string;
  description: string;
}

export interface PolicyItem {
  title: string;
  summary: string;
}

export const siteContent = {
  brand: {
    name: 'AlgoForge',
    tagline: 'Công nghệ vững vàng cho hành trình giao dịch kỷ luật.',
    description:
      'Nền tảng tuyển chọn công cụ giao dịch tự động, chỉ báo và tiện ích MetaTrader dành cho nhà giao dịch hiện đại.',
  },
  partner: {
    name: 'GTC',
    relationship: 'Đối tác đồng thương hiệu',
    website: 'REPLACE_GTC_WEBSITE_URL',
    foundedYear: '20XX',
    introduction:
      'GTC là đối tác sàn giao dịch được giới thiệu trong hệ sinh thái AlgoForge, hướng tới trải nghiệm tiếp cận thị trường minh bạch, linh hoạt và giàu tính công nghệ.',
    note: 'Nội dung GTC hiện là dữ liệu minh họa. Hãy thay thế bằng thông tin đã được doanh nghiệp xác minh trước khi công bố chính thức.',
    benefits: [
      'Hạ tầng giao dịch định hướng công nghệ',
      'Kết nối hệ sinh thái công cụ AlgoForge',
      'Đồng hành cùng nhà giao dịch trong quá trình vận hành',
    ],
  },
  team: [
    {
      name: 'Nhóm Phát triển Sản phẩm',
      role: 'AlgoForge Engineering',
      description: 'Xây dựng, kiểm thử và duy trì các công cụ giao dịch trong danh mục.',
    },
    {
      name: 'Nhóm Đồng hành GTC',
      role: 'Partner Success',
      description: 'Cung cấp thông tin kết nối và hướng dẫn trải nghiệm dịch vụ GTC.',
    },
    {
      name: 'Nhóm Hỗ trợ Khách hàng',
      role: 'Customer Support',
      description: 'Tiếp nhận câu hỏi về cài đặt, bản quyền và quá trình sử dụng sản phẩm.',
    },
  ] as TeamMember[],
  timeline: [
    { year: '20XX', title: 'Khởi tạo AlgoForge', description: 'Bắt đầu xây dựng kho công cụ giao dịch có quy trình quản lý bản quyền tập trung.' },
    { year: '20XX', title: 'Mở rộng hệ sinh thái', description: 'Bổ sung robot EA, chỉ báo và script phục vụ nhiều phong cách giao dịch.' },
    { year: 'Hiện tại', title: 'Đồng hành cùng GTC', description: 'Phát triển trải nghiệm đồng thương hiệu và hệ thống hỗ trợ đa kênh.' },
  ],
  policies: [
    {
      title: 'Điều khoản sử dụng',
      summary: 'Quy định demo về tài khoản, phạm vi sử dụng website và trách nhiệm của người dùng.',
    },
    {
      title: 'Quyền riêng tư',
      summary: 'Mô tả demo về dữ liệu được thu thập, mục đích xử lý và cách người dùng yêu cầu hỗ trợ.',
    },
    {
      title: 'Mua hàng & bản quyền',
      summary: 'Mô tả demo về thời hạn gói, quyền tải xuống, kích hoạt và gia hạn sản phẩm.',
    },
    {
      title: 'Hoàn tiền',
      summary: 'Khung chính sách demo để thay bằng điều kiện hoàn tiền chính thức của doanh nghiệp.',
    },
    {
      title: 'Cảnh báo rủi ro',
      summary: 'Công cụ giao dịch không đảm bảo lợi nhuận; kết quả quá khứ không đại diện cho kết quả tương lai.',
    },
  ] as PolicyItem[],
  supportChannels: [
    {
      key: 'email',
      label: 'Email',
      description: 'Gửi câu hỏi chi tiết về sản phẩm, tài khoản hoặc bản quyền.',
      suffix: 'REPLACE_EMAIL_ADDRESS',
      actionLabel: 'Gửi email',
    },
    {
      key: 'zalo',
      label: 'Zalo',
      description: 'Trao đổi nhanh với tài khoản hoặc Official Account của AlgoForge.',
      suffix: 'REPLACE_ZALO_ID',
      actionLabel: 'Nhắn qua Zalo',
    },
    {
      key: 'discord',
      label: 'Discord',
      description: 'Tham gia cộng đồng để trao đổi cấu hình và kinh nghiệm sử dụng.',
      suffix: 'REPLACE_DISCORD_INVITE',
      actionLabel: 'Vào Discord',
    },
    {
      key: 'telegram',
      label: 'Telegram',
      description: 'Mở cuộc trò chuyện trực tiếp hoặc tham gia nhóm hỗ trợ Telegram.',
      suffix: 'REPLACE_TELEGRAM_USERNAME_OR_INVITE',
      actionLabel: 'Mở Telegram',
    },
    {
      key: 'facebook',
      label: 'Facebook',
      description: 'Bắt đầu cuộc trò chuyện với AlgoForge qua Facebook Messenger.',
      suffix: 'REPLACE_FACEBOOK_USERNAME',
      actionLabel: 'Mở Messenger',
    },
  ] as SupportChannel[],
  demoNotice:
    'Thông tin doanh nghiệp, đội ngũ, mốc thời gian, chính sách và liên kết liên hệ trên bản dựng này là nội dung minh họa.',
};

const normalizeSuffix = (value: string): string => value.trim().replace(/^@/, '').replace(/^\/+/, '');

export const isDemoValue = (value: string): boolean => {
  const normalized = value.trim();
  return normalized.length === 0 || normalized.startsWith('REPLACE_');
};

export const getPartnerWebsite = (): string | null => {
  const value = siteContent.partner.website.trim();
  if (isDemoValue(value)) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

export const getSupportHref = (channel: SupportChannel): string | null => {
  if (isDemoValue(channel.suffix)) return null;

  const suffix = normalizeSuffix(channel.suffix);
  switch (channel.key) {
    case 'email':
      return `mailto:${channel.suffix.trim()}?subject=${encodeURIComponent('Yêu cầu hỗ trợ từ website AlgoForge')}`;
    case 'zalo':
      return `https://zalo.me/${suffix}`;
    case 'discord':
      return `https://discord.gg/${suffix}`;
    case 'telegram':
      return `https://t.me/${suffix}`;
    case 'facebook':
      return `https://m.me/${suffix}`;
    default:
      return null;
  }
};

export const getSupportChannel = (key: SupportChannelKey): SupportChannel => {
  const channel = siteContent.supportChannels.find(item => item.key === key);
  if (!channel) throw new Error(`Unknown support channel: ${key}`);
  return channel;
};
