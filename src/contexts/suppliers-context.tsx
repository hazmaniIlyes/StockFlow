import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { Supplier, SupplierProduct, SupplierPaymentRecord, SupplierPurchase } from 'src/_mock/_data';

// ======================================================================

type PurchaseItem = { productName: string; quantity: number; unitPrice: number };

type SuppliersContextType = {
  suppliers: Supplier[];
  getSupplier: (id: string) => Supplier | undefined;
  getSupplierByName: (name: string) => Supplier | undefined;
  addSupplier: (data: Omit<Supplier, 'id' | 'catalog' | 'totalPaid'> & { catalog?: Omit<SupplierProduct, 'id'>[] }) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addProductToCatalog: (supplierId: string, product: Omit<SupplierProduct, 'id'>) => void;
  removeProductFromCatalog: (supplierId: string, productId: string) => void;
  recordPayment: (id: string, amount: number, note?: string) => void;
  recordPurchase: (id: string, items: PurchaseItem[], amountPaid: number) => SupplierPurchase;
  activeSuppliers: Supplier[];
  clearAll: () => void;
};

const SuppliersContext = createContext<SuppliersContextType | null>(null);

export function useSuppliers() {
  const context = useContext(SuppliersContext);
  if (!context) {
    throw new Error('useSuppliers must be used within a SuppliersProvider');
  }
  return context;
}

type ProviderProps = {
  children: ReactNode;
};

export function SuppliersProvider({ children }: ProviderProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const getSupplier = useCallback((id: string) => suppliers.find((s) => s.id === id), [suppliers]);

  const getSupplierByName = useCallback(
    (name: string) => suppliers.find((s) => s.name.toLowerCase() === name.toLowerCase()),
    [suppliers]
  );

  const addSupplier = useCallback(
    (data: Omit<Supplier, 'id' | 'catalog' | 'totalPaid'> & { catalog?: Omit<SupplierProduct, 'id'>[] }) => {
      const catalog: SupplierProduct[] = (data.catalog || []).map((p, idx) => ({
        ...p,
        id: `cat-${Date.now()}-${idx}`,
      }));
      const newSupplier: Supplier = {
        ...data,
        id: `sup-${Date.now()}`,
        catalog,
        totalPurchased: data.totalPurchased || 0,
        totalPaid: 0,
        totalOwed: data.totalOwed || 0,
      };
      console.log('Adding supplier:', newSupplier);
      setSuppliers((prev) => {
        console.log('Previous suppliers:', prev.length, 'New total:', prev.length + 1);
        return [newSupplier, ...prev];
      });
      return newSupplier;
    },
    []
  );

  const updateSupplier = useCallback((id: string, data: Partial<Supplier>) => {
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addProductToCatalog = useCallback(
    (supplierId: string, product: Omit<SupplierProduct, 'id'>) => {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== supplierId) return s;
          const newProduct: SupplierProduct = {
            ...product,
            id: `cat-${Date.now()}`,
          };
          return { ...s, catalog: [...s.catalog, newProduct] };
        })
      );
    },
    []
  );

  const removeProductFromCatalog = useCallback((supplierId: string, productId: string) => {
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return { ...s, catalog: s.catalog.filter((p) => p.id !== productId) };
      })
    );
  }, []);

  const recordPayment = useCallback((id: string, amount: number, note?: string) => {
    const paymentRecord: SupplierPaymentRecord = {
      id: `pay-${Date.now()}`,
      supplierId: id,
      date: new Date().toISOString().split('T')[0],
      amount,
      note: note || '',
    };
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newTotalPaid = s.totalPaid + amount;
        const newTotalOwed = Math.max(0, s.totalOwed - amount);
        const existingPayments = s.payments || [];
        return {
          ...s,
          totalPaid: newTotalPaid,
          totalOwed: newTotalOwed,
          payments: [paymentRecord, ...existingPayments],
        };
      })
    );
  }, []);

  const recordPurchase = useCallback((id: string, items: PurchaseItem[], amountPaid: number) => {
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const status: 'paid' | 'partial' | 'unpaid' =
      amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';
    const purchaseRecord: SupplierPurchase = {
      id: `pur-${Date.now()}`,
      supplierId: id,
      date: new Date().toISOString().split('T')[0],
      items,
      total,
      amountPaid,
      status,
    };
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const existingPurchases = s.purchases || [];
        return {
          ...s,
          totalPurchased: s.totalPurchased + total,
          totalPaid: s.totalPaid + amountPaid,
          totalOwed: s.totalOwed + (total - amountPaid),
          purchases: [purchaseRecord, ...existingPurchases],
        };
      })
    );
    return purchaseRecord;
  }, []);

  const activeSuppliers = useMemo(
    () => suppliers.filter((s) => s.status === 'active'),
    [suppliers]
  );

  const clearAll = useCallback(() => setSuppliers([]), []);

  const value = useMemo(
    () => ({
      suppliers,
      getSupplier,
      getSupplierByName,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addProductToCatalog,
      removeProductFromCatalog,
      recordPayment,
      recordPurchase,
      activeSuppliers,
      clearAll,
    }),
    [
      suppliers,
      getSupplier,
      getSupplierByName,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addProductToCatalog,
      removeProductFromCatalog,
      recordPayment,
      recordPurchase,
      activeSuppliers,
      clearAll,
    ]
  );

  return <SuppliersContext.Provider value={value}>{children}</SuppliersContext.Provider>;
}
