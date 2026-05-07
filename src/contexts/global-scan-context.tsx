import { useLocation } from 'react-router-dom';
import { useMemo, useState, useEffect, useContext, createContext } from 'react';

type GlobalScanContextType = {
  isFormOpen: boolean;
  setFormOpen: (open: boolean) => void;
};

export const GlobalScanContext = createContext<GlobalScanContextType | null>(null);

export function GlobalScanProvider({ children }: { children: React.ReactNode }) {
  const [isFormOpen, setFormOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setFormOpen(false);
    (document.activeElement as HTMLElement)?.blur();
    document.body.focus();
  }, [location.pathname]);

  const value = useMemo(() => ({ isFormOpen, setFormOpen }), [isFormOpen]);

  return (
    <GlobalScanContext.Provider value={value}>
      {children}
    </GlobalScanContext.Provider>
  );
}

export function useGlobalScan() {
  const context = useContext(GlobalScanContext);
  if (!context) {
    throw new Error('useGlobalScan must be used within a GlobalScanProvider');
  }
  return context;
}
