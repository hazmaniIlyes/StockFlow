import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type { ReactNode } from 'react';

import { settingsDB, isElectron } from 'src/services/db'; // Import SQLite database wrapper for persistent settings
import { setActiveCurrency } from 'src/utils/format-number';

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

const ACCOUNT_STORAGE_KEY = 'account'; // New unified JSON key mapping profile, passwords, and roles
const INVOICE_STORAGE_KEY = 'invoice_settings'; // New dedicated key for invoices only
const CATEGORIES_STORAGE_KEY = 'categories'; // Dedicated key for combined product and expense categories
const PREFERENCES_STORAGE_KEY = 'preferences'; // Dedicated key for preferences

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
  const [role, setRole] = useState<AppRole>('admin'); // Default role, populated on mount
  const [workerModeEnabled, setWorkerModeEnabledState] = useState(false); // Default mode, populated on mount
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS); // Default settings
  const [isInitialized, setIsInitialized] = useState(false); // Flag prevents overwriting database with component defaults

  // Load from SQLite on mount
  useEffect(() => {
    async function loadData() { // Async loader function
      try {
        let storedInvoiceSettings: string | null = null; // Prepare variable for the newly split invoice row
        let storedCategoriesSettings: string | null = null; // Prepare variable for split categories row
        let storedPreferencesSettings: string | null = null; // Prepare variable for split preferences row
        let storedAccountSettings: string | null = null; // Prepare variable for the unified account JSON row

        if (isElectron()) { // If in Electron, fetch from SQLite table securely
          storedInvoiceSettings = await settingsDB.get(INVOICE_STORAGE_KEY); // Fetch isolated key
          storedCategoriesSettings = await settingsDB.get(CATEGORIES_STORAGE_KEY); // Fetch categories key
          storedPreferencesSettings = await settingsDB.get(PREFERENCES_STORAGE_KEY); // Fetch preferences key
          storedAccountSettings = await settingsDB.get(ACCOUNT_STORAGE_KEY); // Fetch unified account parameter
        } else { // Fallback to localStorage if coding in browser mode
          storedInvoiceSettings = localStorage.getItem(INVOICE_STORAGE_KEY);
          storedCategoriesSettings = localStorage.getItem(CATEGORIES_STORAGE_KEY);
          storedPreferencesSettings = localStorage.getItem(PREFERENCES_STORAGE_KEY);
          storedAccountSettings = localStorage.getItem(ACCOUNT_STORAGE_KEY);
        }

        // Apply loaded variables natively (New Explicit Object Only)
        if (storedAccountSettings) {
          const parsedAcc = JSON.parse(storedAccountSettings); // Parse JSON unified payload
          setRole(parsedAcc.role ?? 'admin'); // Default string if unavailable
          setWorkerModeEnabledState(parsedAcc.workerModeEnabled ?? false); // Default boolean if unavailable
        }
        
        let newInvoice = { ...DEFAULT_SETTINGS.invoice }; // Temporary holding variables
        let newProdCategories = DEFAULT_SETTINGS.productCategories;
        let newExpCategories = DEFAULT_SETTINGS.expenseCategories;
        let newPrefs = { ...DEFAULT_SETTINGS.preferences };

        // Apply the newly split preferences explicitly (Old backup is entirely removed)
        if (storedPreferencesSettings) {
          const parsedPrefs = JSON.parse(storedPreferencesSettings); // Safely parse JSON structure
          newPrefs = { ...newPrefs, ...parsedPrefs, enabledUnits: parsedPrefs?.enabledUnits ?? newPrefs.enabledUnits };
        }

        // Apply the split invoice parameters
        if (storedInvoiceSettings) {
          newInvoice = { ...newInvoice, ...JSON.parse(storedInvoiceSettings) };
        }

        // Apply the split categories object 
        if (storedCategoriesSettings) {
          const parsedCats = JSON.parse(storedCategoriesSettings);
          newProdCategories = parsedCats.product ?? newProdCategories; // Extract mapped product property
          newExpCategories = parsedCats.expense ?? newExpCategories; // Extract mapped expense property
        }

        // Commit hydration state
        setSettings({
          invoice: newInvoice,
          productCategories: newProdCategories,
          expenseCategories: newExpCategories,
          preferences: newPrefs,
        });

      } catch (err) {
        window.appLog?.error('Failed to load settings:', err);
      } finally {
        setIsInitialized(true); // Always unlock persistence syncing even if parse fails
      }
    }

    loadData(); // Launch bootstrapper
  }, []);

  // When worker mode is disabled, always reset role to admin
  const setWorkerModeEnabled = useCallback((enabled: boolean) => {
    setWorkerModeEnabledState(enabled);
    if (!enabled) setRole('admin');
  }, []);

  // Persist the newly isolated invoice settings precisely onto its own SQLite key
  useEffect(() => {
    if (!isInitialized) return; // Discard sync events prior to hydration
    const save = async () => {
      const jsonStr = JSON.stringify(settings.invoice); // Grab ONLY the invoice state
      if (isElectron()) await settingsDB.set(INVOICE_STORAGE_KEY, jsonStr); // Save exactly as requested
      else localStorage.setItem(INVOICE_STORAGE_KEY, jsonStr);
    };
    save();
  }, [settings.invoice, isInitialized]); // Effect triggers ONLY when invoices settings mutate

  // Keep fCurrency module-level currency in sync with the invoice.currency setting
  useEffect(() => {
    setActiveCurrency(settings.invoice.currency || 'DA');
  }, [settings.invoice.currency]);

  // Persist combined categories natively into their dedicated JSON structure
  useEffect(() => {
    if (!isInitialized) return;
    const save = async () => {
      const jsonStr = JSON.stringify({
        product: settings.productCategories,
        expense: settings.expenseCategories
      }); // Format precisely as requested: {"product":[...],"expense":[...]}
      
      if (isElectron()) await settingsDB.set(CATEGORIES_STORAGE_KEY, jsonStr);
      else localStorage.setItem(CATEGORIES_STORAGE_KEY, jsonStr);
    };
    save();
  }, [settings.productCategories, settings.expenseCategories, isInitialized]); // Triggered when either array mutates

  // Persist the preferences settings exclusively onto its own SQLite key
  useEffect(() => {
    if (!isInitialized) return; // Discard sync events prior to hydration
    const save = async () => {
      const jsonStr = JSON.stringify(settings.preferences); // Extract solely the preferences object
      if (isElectron()) await settingsDB.set(PREFERENCES_STORAGE_KEY, jsonStr); // Save exactly as requested
      else localStorage.setItem(PREFERENCES_STORAGE_KEY, jsonStr); // Local fallback
    };
    save();
  }, [settings.preferences, isInitialized]); // Triggered every time SettingsState preferences update

  // Persist role & worker mode natively to the unified "account" SQLite JSON object
  useEffect(() => {
    if (!isInitialized) return; // Discard sync events prior to hydration
    
    // We construct a specific updater function so we never destruct unrelated variables (like passwords)
    const updateAccountKeys = async () => {
      let accountObj: Record<string, any> = {};
      
      // Attempt to retrieve existing database payload to prevent overwriting parallel configurations
      if (isElectron()) {
        const existingStr = await settingsDB.get(ACCOUNT_STORAGE_KEY);
        if (existingStr) accountObj = JSON.parse(existingStr);
      } else {
        const existingStr = localStorage.getItem(ACCOUNT_STORAGE_KEY);
        if (existingStr) accountObj = JSON.parse(existingStr);
      }

      // Map Context states cleanly to unified object
      accountObj.role = role;
      accountObj.workerModeEnabled = workerModeEnabled;

      const unifiedJsonStr = JSON.stringify(accountObj);
      
      // Commit merged block back into the explicit row
      if (isElectron()) await settingsDB.set(ACCOUNT_STORAGE_KEY, unifiedJsonStr);
      else localStorage.setItem(ACCOUNT_STORAGE_KEY, unifiedJsonStr);
    };
    
    updateAccountKeys(); // Execute
  }, [role, workerModeEnabled, isInitialized]); // Trigger unified database sequence whenever either parameter shifts

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
        { ...category, id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
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
        { ...category, id: `ec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
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
