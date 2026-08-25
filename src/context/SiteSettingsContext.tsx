import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';
import { defaultPartner, type PartnerInfo } from '../config/siteContent';

interface SiteSettingsContextType {
  partner: PartnerInfo;
  loading: boolean;
  /** Re-reads the partner block, e.g. right after an admin saves it. */
  refreshPartner: () => Promise<void>;
  /** Lets the admin form push a saved payload without a second round trip. */
  setPartner: (partner: PartnerInfo) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start from the shipped defaults so the first paint is never blank; the API
  // response replaces them once it arrives.
  const [partner, setPartner] = useState<PartnerInfo>(defaultPartner);
  const [loading, setLoading] = useState(true);

  const fetchPartner = useCallback(async () => {
    try {
      const data = await api.get<PartnerInfo>('/api/settings/partner');
      setPartner({ ...defaultPartner, ...data });
    } catch (err) {
      // A missing or unreachable settings endpoint must not break the page —
      // the defaults already loaded stay in place.
      console.error('Failed to load partner settings; using defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial sync from the settings API — the same fetch-on-mount pattern the
    // other pages in this app use for their server data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPartner();
  }, [fetchPartner]);

  return (
    <SiteSettingsContext.Provider value={{ partner, loading, refreshPartner: fetchPartner, setPartner }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
