import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Invoice } from 'src/_mock/_data';

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

  const getInvoice = useCallback(
    (id: string) => invoices.find((inv) => inv.id === id),
    [invoices]
  );

  const addInvoice = useCallback((data: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = { ...data, id: `inv-${Date.now()}` };
    setInvoices((prev) => [newInvoice, ...prev]);
    setInvoiceCounter((prev) => prev + 1);
    return newInvoice;
  }, []);

  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...data } : inv)));
  }, []);

  const deleteInvoice = useCallback((id: string) => {
    let deletedInvoice: Invoice | undefined;
    setInvoices((prev) => {
      deletedInvoice = prev.find((inv) => inv.id === id);
      return prev.filter((inv) => inv.id !== id);
    });
    return deletedInvoice;
  }, []);

  const recordPayment = useCallback((id: string, amount: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;

        const newAmountPaid = Math.min(inv.amountPaid + amount, inv.total);
        const newAmountDue = inv.total - newAmountPaid;
        let newStatus: Invoice['status'] = 'unpaid';

        if (newAmountDue <= 0) {
          newStatus = 'paid';
        } else if (newAmountPaid > 0) {
          newStatus = 'partly-paid';
        }

        return {
          ...inv,
          amountPaid: newAmountPaid,
          amountDue: newAmountDue,
          status: newStatus,
        };
      })
    );
  }, []);

  const markAsPaid = useCallback((id: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== id) return inv;
        return {
          ...inv,
          amountPaid: inv.total,
          amountDue: 0,
          status: 'paid',
        };
      })
    );
  }, []);

  // Calculate dynamic summary from actual invoice data
  const getSummary = useCallback((): SalesSummary => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-US');
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
      if (inv.createdAt === todayStr) {
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

  const getNextInvoiceNumber = useCallback(() => {
    return `INV-${String(invoiceCounter).padStart(4, '0')}`;
  }, [invoiceCounter]);

  const resetInvoiceCounter = useCallback(() => {
    setInvoiceCounter(1);
  }, []);

  const getTvaCollectedSinceReset = useCallback((): number => {
    return invoices.reduce((sum, inv) => {
      if (tvaResetDate) {
        const invDate = new Date(inv.createdAt);
        const resetDate = new Date(tvaResetDate);
        // Normalize both to midnight for safe date-only comparison
        invDate.setHours(0, 0, 0, 0);
        resetDate.setHours(0, 0, 0, 0);
        if (invDate <= resetDate) return sum;
      }
      return sum + (inv.tvaAmount || 0);
    }, 0);
  }, [invoices, tvaResetDate]);

  const declareTVA = useCallback((amount: number) => {
    const now = new Date().toISOString().split('T')[0];
    const periodStart = tvaResetDate ?? '—';
    const declaration: TvaDeclaration = {
      id: `tva-${Date.now()}`,
      period: `${periodStart} → ${now}`,
      amount,
      dateDeclared: now,
    };
    setTvaDeclarations((prev) => [declaration, ...prev]);
    setTvaResetDate(now);
  }, [tvaResetDate]);

  const clearTvaDeclarations = useCallback(() => {
    setTvaDeclarations([]);
    setTvaResetDate(null);
  }, []);

  const clearAll = useCallback(() => {
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
