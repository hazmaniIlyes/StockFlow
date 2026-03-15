import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';

import type { ProductUnit } from 'src/_mock/_data';

export const ALL_UNITS: ProductUnit[] = ['pcs', 'g', 'kg', 'mg', 'ton', 'quintar', 'l', 'ml', 'm', 'cm', 'mm'];

// ======================================================================

type Category = {
  id: string;
  label: string;
  color: string;
};

type InvoiceSettings = {
  tvaRate: number;
  invoicePrefix: string;
  paymentTerms: number;
  currency: string;
  footerNote: string;
};

export type ColorMode = 'light' | 'dark';
export type AppRole = 'admin' | 'worker';

type Preferences = {
  lowStockThreshold: number;
  showExpenses: boolean;
  colorMode: ColorMode;
  enabledUnits: ProductUnit[];
};

type SettingsState = {
  invoice: InvoiceSettings;
  productCategories: Category[];
  expenseCategories: Category[];
  preferences: Preferences;
};

type SettingsContextType = SettingsState & {
  updateInvoiceSettings: (settings: Partial<InvoiceSettings>) => void;
  updatePreferences: (prefs: Partial<Preferences>) => void;
  addProductCategory: (category: Omit<Category, 'id'>) => void;
  deleteProductCategory: (id: string) => void;
  addExpenseCategory: (category: Omit<Category, 'id'>) => void;
  deleteExpenseCategory: (id: string) => void;
  role: AppRole;
  setRole: (role: AppRole) => void;
  workerModeEnabled: boolean;
  setWorkerModeEnabled: (enabled: boolean) => void;
};

// ======================================================================

const STORAGE_KEY = 'app_settings';
const ROLE_STORAGE_KEY = 'app_role';
const WORKER_MODE_KEY = 'worker_mode_enabled';

const DEFAULT_PRODUCT_CATEGORIES: Category[] = [
  { id: 'pc-1', label: 'Peripherals', color: '#1976D2' },
  { id: 'pc-2', label: 'Accessories', color: '#9C27B0' },
  { id: 'pc-3', label: 'Audio', color: '#ED6C02' },
  { id: 'pc-4', label: 'Storage', color: '#2E7D32' },
  { id: 'pc-5', label: 'Cables', color: '#0288D1' },
  { id: 'pc-6', label: 'Other', color: '#757575' },
];

const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'ec-1', label: 'Rent', color: '#FF6B6B' },
  { id: 'ec-2', label: 'Utilities', color: '#4ECDC4' },
  { id: 'ec-3', label: 'Transport', color: '#45B7D1' },
  { id: 'ec-4', label: 'Salaries', color: '#96CEB4' },
  { id: 'ec-5', label: 'Maintenance', color: '#FECA57' },
  { id: 'ec-6', label: 'Other', color: '#A29BFE' },
];

const DEFAULT_SETTINGS: SettingsState = {
  invoice: {
    tvaRate: 19,
    invoicePrefix: 'INV-',
    paymentTerms: 30,
    currency: 'DA',
    footerNote: 'Thank you for your business.',
  },
  productCategories: DEFAULT_PRODUCT_CATEGORIES,
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  preferences: {
    lowStockThreshold: 10,
    showExpenses: true,
    colorMode: 'light',
    enabledUnits: ALL_UNITS,
  },
};

// ======================================================================

const SettingsContext = createContext<SettingsContextType | null>(null);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

// ======================================================================

type ProviderProps = {
  children: ReactNode;
};

export function SettingsProvider({ children }: ProviderProps) {
  const [role, setRole] = useState<AppRole>(() => {
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    return (stored === 'worker' ? 'worker' : 'admin') as AppRole;
  });
  const [workerModeEnabled, setWorkerModeEnabledState] = useState(() => {
    return localStorage.getItem(WORKER_MODE_KEY) === 'true';
  });

  // When worker mode is disabled, always reset role to admin
  const setWorkerModeEnabled = useCallback((enabled: boolean) => {
    setWorkerModeEnabledState(enabled);
    if (!enabled) setRole('admin');
  }, []);

  const [settings, setSettings] = useState<SettingsState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          invoice: { ...DEFAULT_SETTINGS.invoice, ...parsed.invoice },
          productCategories: parsed.productCategories ?? DEFAULT_SETTINGS.productCategories,
          expenseCategories: parsed.expenseCategories ?? DEFAULT_SETTINGS.expenseCategories,
          preferences: {
            ...DEFAULT_SETTINGS.preferences,
            ...parsed.preferences,
            enabledUnits: parsed.preferences?.enabledUnits ?? DEFAULT_SETTINGS.preferences.enabledUnits,
          },
        };
      }
    } catch {
      // Ignore parse errors
    }
    return DEFAULT_SETTINGS;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(WORKER_MODE_KEY, String(workerModeEnabled));
  }, [workerModeEnabled]);

  const updateInvoiceSettings = useCallback((updates: Partial<InvoiceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      invoice: { ...prev.invoice, ...updates },
    }));
  }, []);

  const updatePreferences = useCallback((updates: Partial<Preferences>) => {
    setSettings((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...updates },
    }));
  }, []);

  const addProductCategory = useCallback((category: Omit<Category, 'id'>) => {
    setSettings((prev) => ({
      ...prev,
      productCategories: [
        ...prev.productCategories,
        { ...category, id: `pc-${Date.now()}` },
      ],
    }));
  }, []);

  const deleteProductCategory = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      productCategories: prev.productCategories.filter((c) => c.id !== id),
    }));
  }, []);

  const addExpenseCategory = useCallback((category: Omit<Category, 'id'>) => {
    setSettings((prev) => ({
      ...prev,
      expenseCategories: [
        ...prev.expenseCategories,
        { ...category, id: `ec-${Date.now()}` },
      ],
    }));
  }, []);

  const deleteExpenseCategory = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter((c) => c.id !== id),
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...settings,
      updateInvoiceSettings,
      updatePreferences,
      addProductCategory,
      deleteProductCategory,
      addExpenseCategory,
      deleteExpenseCategory,
      role,
      setRole,
      workerModeEnabled,
      setWorkerModeEnabled,
    }),
    [
      settings,
      updateInvoiceSettings,
      updatePreferences,
      addProductCategory,
      deleteProductCategory,
      addExpenseCategory,
      deleteExpenseCategory,
      role,
      setRole,
      workerModeEnabled,
      setWorkerModeEnabled,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}
