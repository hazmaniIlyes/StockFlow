import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

// ======================================================================

export type BusinessInfo = {
  businessName: string;
  phone: string;
  email: string;
  address: string;
  nif: string;
  nis: string;
  rc: string;
  ai: string;
  logo?: string; // Base64 or URL
};

type BusinessContextType = {
  businessInfo: BusinessInfo;
  updateBusinessInfo: (data: Partial<BusinessInfo>) => void;
};

const defaultBusinessInfo: BusinessInfo = {
  businessName: '',
  phone: '',
  email: '',
  address: '',
  nif: '',
  nis: '',
  rc: '',
  ai: '',
  logo: undefined,
};

const STORAGE_KEY = 'business_info';

const BusinessContext = createContext<BusinessContextType | null>(null);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(() => {
    // Try to load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultBusinessInfo, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Failed to load business info from storage:', e);
    }
    return defaultBusinessInfo;
  });

  // Persist to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(businessInfo));
    } catch (e) {
      console.error('Failed to save business info to storage:', e);
    }
  }, [businessInfo]);

  const updateBusinessInfo = useCallback((data: Partial<BusinessInfo>) => {
    setBusinessInfo((prev) => ({ ...prev, ...data }));
  }, []);

  const value = useMemo(
    () => ({
      businessInfo,
      updateBusinessInfo,
    }),
    [businessInfo, updateBusinessInfo]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within BusinessProvider');
  }
  return context;
}
