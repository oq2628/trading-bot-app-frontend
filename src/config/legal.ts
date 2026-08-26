/**
 * Legal document identity, shared between the public page, the footer links
 * and the admin panel.
 *
 * These live outside LegalPage.tsx so that file only exports a component:
 * mixing constants into a component module breaks React Fast Refresh.
 */

export interface LegalDocument {
  slug: string;
  title: string;
  content: string;
  updated_at: string | null;
}

// The backend owns this list; keeping the labels here lets the footer render
// links before any document has been fetched.
export const LEGAL_SLUGS = ['terms', 'privacy', 'refund'] as const;
export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export const LEGAL_TITLES: Record<LegalSlug, string> = {
  terms: 'Điều khoản sử dụng',
  privacy: 'Chính sách bảo mật',
  refund: 'Chính sách hoàn tiền & bảo hành',
};
