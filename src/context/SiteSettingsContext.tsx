import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';
import { defaultAbout, defaultContact, defaultPartner, type AboutInfo, type ContactInfo, type PartnerInfo } from '../config/siteContent';

interface SiteSettingsContextType {
  partner: PartnerInfo;
  contact: ContactInfo;
  about: AboutInfo;
  loading: boolean;
  /** Re-reads the partner block, e.g. right after an admin saves it. */
  refreshPartner: () => Promise<void>;
  /** Lets the admin form push a saved payload without a second round trip. */
  setPartner: (partner: PartnerInfo) => void;
  /** Re-reads the contact block. */
  refreshContact: () => Promise<void>;
  setContact: (contact: ContactInfo) => void;
  /** Re-reads the about block. */
  refreshAbout: () => Promise<void>;
  setAbout: (about: AboutInfo) => void;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start from the shipped defaults so the first paint is never blank; the API
  // response replaces them once it arrives.
  const [partner, setPartner] = useState<PartnerInfo>(defaultPartner);
  const [contact, setContact] = useState<ContactInfo>(defaultContact);
  const [about, setAbout] = useState<AboutInfo>(defaultAbout);
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

  const fetchContact = useCallback(async () => {
    try {
      const data = await api.get<ContactInfo>('/api/settings/contact');
      setContact({ ...defaultContact, ...data });
    } catch (err) {
      // Same reasoning as the partner block: an unreachable settings endpoint
      // must not break the page. Blank channels are simply hidden.
      console.error('Failed to load contact settings; using defaults:', err);
    }
  }, []);

  const fetchAbout = useCallback(async () => {
    try {
      const data = await api.get<AboutInfo>('/api/settings/about');
      setAbout({ milestones: data.milestones ?? [] });
    } catch (err) {
      // An empty milestone list simply hides the timeline section.
      console.error('Failed to load about settings; using defaults:', err);
    }
  }, []);

  useEffect(() => {
    // Initial sync from the settings API — the same fetch-on-mount pattern the
    // other pages in this app use for their server data.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPartner();
    fetchContact();
    fetchAbout();
  }, [fetchPartner, fetchContact, fetchAbout]);

  return (
    <SiteSettingsContext.Provider
      value={{
        partner,
        contact,
        about,
        loading,
        refreshPartner: fetchPartner,
        setPartner,
        refreshContact: fetchContact,
        setContact,
        refreshAbout: fetchAbout,
        setAbout,
      }}
    >
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
