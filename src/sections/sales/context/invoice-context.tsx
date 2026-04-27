import type { ReactNode } from 'react';
import type { Invoice } from 'src/_mock/_data';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { tvaDB, isElectron, invoicesDB, settingsDB } from 'src/services/db'; // Import database services for invoices, TVA, and settings

// ======================================================================

type SalesSummary = {
  today: { totalSales: number; profit: number; count: number };
  pending: { totalAmount: number; count: number };
  thisMonth: { totalSales: number; profit: number; count: number };
  overdue: { totalAmount: number; count: number };
};

type TvaDeclaration = {
  id: string;
  period: string;
  amount: number;
  dateDeclared: string;
};

type InvoiceContextType = {
  invoices: Invoice[];
  getInvoice: (id: string) => Invoice | undefined;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Invoice;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => Invoice | undefined;
  recordPayment: (id: string, amount: number) => void;
  markAsPaid: (id: string) => void;
  getSummary: () => SalesSummary;
  getInvoicesForClient: (clientName: string) => Invoice[];
  getNextInvoiceNumber: () => string;
  resetInvoiceCounter: () => void;
  tvaDeclarations: TvaDeclaration[];
  tvaResetDate: string | null;
  declareTVA: (amount: number) => void;
  getTvaCollectedSinceReset: () => number;
  clearTvaDeclarations: () => void;
  clearAll: () => void;
};

const InvoiceContext = createContext<InvoiceContextType | null>(null);

export function useInvoices() {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoices must be used within an InvoiceProvider');
  }
  return context;
}

type ProviderProps = {
  children: ReactNode;
};

export function InvoiceProvider({ children }: ProviderProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState(1);
  const [tvaDeclarations, setTvaDeclarations] = useState<TvaDeclaration[]>([]);
  const [tvaResetDate, setTvaResetDate] = useState<string | null>(null);

  // ── Load invoices, counter, TVA data from SQLite on mount ──────────
  // This replaces the old useState([]) with real database data.
  useEffect(() => {
    if (isElectron()) {
      // Load all invoices from the database
      invoicesDB.getAll().then((dbInvoices) => {
        console.log('[InvoiceContext] Loaded invoices from SQLite:', dbInvoices.length);
        setInvoices(dbInvoices); // Populate React state
      }).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to load invoices from SQLite:', err);
      });

      // Load the current invoice counter from the settings table
      invoicesDB.getCounter().then((counter) => {
        console.log('[InvoiceContext] Loaded invoice counter from SQLite:', counter);
        setInvoiceCounter(counter); // Set the counter so getNextInvoiceNumber works correctly
      }).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to load invoice counter from SQLite:', err);
      });

      // Load all TVA declarations
      tvaDB.getAll().then((dbTva) => {
        console.log('[InvoiceContext] Loaded TVA declarations from SQLite:', dbTva.length);
        setTvaDeclarations(dbTva); // Populate TVA declaration history
      }).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to load TVA declarations from SQLite:', err);
      });

      // Load the TVA reset date from settings
      settingsDB.get('tva_reset_date').then((value) => {
        setTvaResetDate(value && value !== '' ? value : null); // Convert empty string to null
      }).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to load TVA reset date from SQLite:', err);
      });
    }
  }, []); // Run once on mount

  const getInvoice = useCallback(
    (id: string) => invoices.find((inv) => inv.id === id),
    [invoices]
  );

  const addInvoice = useCallback((data: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = { ...data, id: `inv-${Date.now()}` }; // Generate unique invoice ID
    const newCounter = invoiceCounter + 1; // Increment the counter for the next invoice

    // ── Persist invoice to SQLite ────────────────────────────────────
    if (isElectron()) {
      invoicesDB.add(newInvoice).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to add invoice to SQLite:', err);
      });
      // Save the updated counter to settings so it persists across restarts
      invoicesDB.setCounter(newCounter).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to update invoice counter in SQLite:', err);
      });
    }

    setInvoices((prev) => [newInvoice, ...prev]); // Add to front of list
    setInvoiceCounter(newCounter);
    return newInvoice;
  }, [invoiceCounter]);

  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    // ── Persist invoice update to SQLite ──────────────────────────────
    if (isElectron()) {
      invoicesDB.update(id, data).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to update invoice in SQLite:', err);
      });
    }

    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)));
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    // Locate target invoice synchronously outside the React loop
    const deletedInvoice = invoices.find((inv) => inv.id === id);
    if (!deletedInvoice) return undefined;

    // ── Delete from SQLite securely ──────────────────────────────────
    if (isElectron()) {
      invoicesDB.delete(id).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to delete invoice from SQLite:', err);
      });
    }

    // Pass the pure operation to React
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    return deletedInvoice; // Return explicitly
  }, [invoices]);

  const recordPayment = useCallback((id: string, amount: number) => {
    // 1. Locate the invoice synchronously outside the loop
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return;

    const newAmountPaid = Math.min(target.amountPaid + amount, target.total);
    const newAmountDue = target.total - newAmountPaid;
    let newStatus: Invoice['status'] = 'unpaid';

    if (newAmountDue <= 0) {
      newStatus = 'paid'; // Fully paid
    } else if (newAmountPaid > 0) {
      newStatus = 'partly-paid'; // Partially paid
    }

    // 2. Safely trigger SQLite exactly once ───────────────────────────
    if (isElectron()) {
      invoicesDB.update(id, {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
      }).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to record invoice payment in SQLite:', err);
      });
    }

    // 3. Queue pure updates ───────────────────────────────────────────
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, amountPaid: newAmountPaid, amountDue: newAmountDue, status: newStatus }
          : inv
      )
    );
  }, [invoices]);

  const markAsPaid = useCallback((id: string) => {
    const target = invoices.find((inv) => inv.id === id);
    if (!target) return;

    // 1. Safely execute SQLite side-effect EXACTLY ONCE block
    if (isElectron()) {
      invoicesDB.update(id, {
        amountPaid: target.total,
        amountDue: 0,
        status: 'paid',
      }).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to mark invoice as paid in SQLite:', err);
      });
    }

    // 2. Pass pure logic
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? { ...inv, amountPaid: target.total, amountDue: 0, status: 'paid' }
          : inv
      )
    );
  }, [invoices]);

  // Calculate dynamic summary from actual invoice data
  const getSummary = useCallback((): SalesSummary => {
    const today = new Date();
    const todayStr = today.toDateString();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();

    let todaySales = 0;
    let todayProfit = 0;
    let todayCount = 0;
    let pendingAmount = 0;
    let pendingCount = 0;
    let monthSales = 0;
    let monthProfit = 0;
    let monthCount = 0;
    let overdueAmount = 0;
    let overdueCount = 0;

    invoices.forEach((inv) => {
      const invDate = new Date(inv.createdAt);
      const dueDate = new Date(inv.dueDate);

      // Today's sales
      if (invDate.toDateString() === todayStr) {
        todaySales += inv.total;
        // Estimate profit as 25% of subtotal (before TVA)
        todayProfit += inv.subtotal * 0.25;
        todayCount += 1;
      }

      // This month's sales
      if (invDate.getMonth() === thisMonth && invDate.getFullYear() === thisYear) {
        monthSales += inv.total;
        monthProfit += inv.subtotal * 0.25;
        monthCount += 1;
      }

      // Pending payments
      if (inv.status !== 'paid') {
        pendingAmount += inv.amountDue;
        pendingCount += 1;

        // Overdue (past due date)
        if (dueDate < today) {
          overdueAmount += inv.amountDue;
          overdueCount += 1;
        }
      }
    });

    return {
      today: { totalSales: todaySales, profit: todayProfit, count: todayCount },
      pending: { totalAmount: pendingAmount, count: pendingCount },
      thisMonth: { totalSales: monthSales, profit: monthProfit, count: monthCount },
      overdue: { totalAmount: overdueAmount, count: overdueCount },
    };
  }, [invoices]);

  const getInvoicesForClient = useCallback(
    (clientName: string) =>
      invoices.filter((inv) => inv.client.name.toLowerCase() === clientName.toLowerCase()),
    [invoices]
  );

  const getNextInvoiceNumber = useCallback(() => 
     `INV-${String(invoiceCounter).padStart(4, '0')}` // Format: INV-0001, INV-0002, etc.
  , [invoiceCounter]);

  const resetInvoiceCounter = useCallback(() => {
    // ── Reset counter in SQLite ──────────────────────────────────────
    if (isElectron()) {
      invoicesDB.setCounter(1).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to reset invoice counter in SQLite:', err);
      });
    }

    setInvoiceCounter(1);
  }, []);

  const getTvaCollectedSinceReset = useCallback((): number => invoices.reduce((sum, inv) => {
      if (tvaResetDate) {
        const invDate = new Date(inv.createdAt);
        const resetDate = new Date(tvaResetDate);
        // Normalize both to midnight for safe date-only comparison
        invDate.setHours(0, 0, 0, 0);
        resetDate.setHours(0, 0, 0, 0);
        if (invDate <= resetDate) return sum; // Skip invoices before the reset date
      }
      return sum + (inv.tvaAmount || 0);
    }, 0), [invoices, tvaResetDate]);

  const declareTVA = useCallback((amount: number) => {
    const now = new Date().toISOString().split('T')[0]; // Today's date in ISO format
    const periodStart = tvaResetDate ?? '—';
    const declaration: TvaDeclaration = {
      id: `tva-${Date.now()}`, // Generate unique declaration ID
      period: `${periodStart} → ${now}`,
      amount,
      dateDeclared: now,
    };

    // ── Persist TVA declaration to SQLite ─────────────────────────────
    if (isElectron()) {
      tvaDB.add(declaration).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to add TVA declaration to SQLite:', err);
      });
      // Save the new reset date in settings
      settingsDB.set('tva_reset_date', now).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to update TVA reset date in SQLite:', err);
      });
    }

    setTvaDeclarations((prev) => [declaration, ...prev]);
    setTvaResetDate(now);
  }, [tvaResetDate]);

  const clearTvaDeclarations = useCallback(() => {
    // ── Clear TVA declarations in SQLite ──────────────────────────────
    if (isElectron()) {
      tvaDB.clearAll().catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to clear TVA declarations from SQLite:', err);
      });
      settingsDB.set('tva_reset_date', '').catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to clear TVA reset date in SQLite:', err);
      });
    }

    setTvaDeclarations([]);
    setTvaResetDate(null);
  }, []);

  const clearAll = useCallback(() => {
    // ── Clear all invoices and related data from SQLite ───────────────
    if (isElectron()) {
      invoicesDB.clearAll().catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to clear all invoices from SQLite:', err);
      });
      invoicesDB.setCounter(1).catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to reset invoice counter in SQLite:', err);
      });
      tvaDB.clearAll().catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to clear TVA declarations from SQLite:', err);
      });
      settingsDB.set('tva_reset_date', '').catch((err) => {
        window.appLog?.error('[InvoiceContext] Failed to clear TVA reset date in SQLite:', err);
      });
    }

    setInvoices([]);
    setInvoiceCounter(1);
    setTvaDeclarations([]);
    setTvaResetDate(null);
  }, []);

  const value = useMemo(
    () => ({
      invoices,
      getInvoice,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      recordPayment,
      markAsPaid,
      getSummary,
      getInvoicesForClient,
      getNextInvoiceNumber,
      resetInvoiceCounter,
      tvaDeclarations,
      tvaResetDate,
      declareTVA,
      getTvaCollectedSinceReset,
      clearTvaDeclarations,
      clearAll,
    }),
    [
      invoices,
      getInvoice,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      recordPayment,
      markAsPaid,
      getSummary,
      getInvoicesForClient,
      getNextInvoiceNumber,
      resetInvoiceCounter,
      tvaDeclarations,
      tvaResetDate,
      declareTVA,
      getTvaCollectedSinceReset,
      clearTvaDeclarations,
      clearAll,
    ]
  );

  return <InvoiceContext.Provider value={value}>{children}</InvoiceContext.Provider>;
}
