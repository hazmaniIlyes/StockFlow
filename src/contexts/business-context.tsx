import type { ReactNode } from 'react';
import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { settingsDB, isElectron } from 'src/services/db'; // Added import for SQLite database bridge

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
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(defaultBusinessInfo); // Start with empty defaults
  const [isInitialized, setIsInitialized] = useState(false); // Added flag to prevent overwriting DB on first mount before load

  // Load from SQLite on mount
  useEffect(() => {
    async function loadData() { // Added async function to handle DB fetch
      try {
        let stored: string | null = null; // Added variable to hold the stored string

        if (isElectron()) { // Check if we are inside Electron
          stored = await settingsDB.get(STORAGE_KEY); // Added call to SQLite settings table
        } else {
          stored = localStorage.getItem(STORAGE_KEY); // Fallback to localStorage if in browser
        }

        if (stored) {
          setBusinessInfo({ ...defaultBusinessInfo, ...JSON.parse(stored) }); // Parse and load the data into state
        }
      } catch (err) {
        window.appLog?.error('Failed to load business info:', err);
      } finally {
        setIsInitialized(true); // Mark as loaded so we can safely save future changes
      }
    }

    loadData(); // Execute the load function
  }, []);

  // Persist to SQLite when changed
  useEffect(() => {
    if (!isInitialized) return; // Prevent saving the empty default values back to DB immediately on app load

    async function saveData() { // Added async function to save changes securely
      try {
        const jsonStr = JSON.stringify(businessInfo); // Stringify the business object
        if (isElectron()) {
          await settingsDB.set(STORAGE_KEY, jsonStr); // Save JSON string to the SQLite settings table
        } else {
          localStorage.setItem(STORAGE_KEY, jsonStr); // Fallback to browser storage
        }
      } catch (err) {
        window.appLog?.error('Failed to save business info:', err);
      }
    }

    saveData(); // Execute the save function whenever businessInfo mutates
  }, [businessInfo, isInitialized]); // Dependency array specifically monitors businessInfo

  const updateBusinessInfo = useCallback((data: Partial<BusinessInfo>) => {
    setBusinessInfo((prev) => ({ ...prev, ...data })); // Merge new fields with existing fields
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
