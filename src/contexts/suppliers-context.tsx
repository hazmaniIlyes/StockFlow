import type { ReactNode } from 'react';
import type { Supplier, SupplierProduct, SupplierPurchase, SupplierPaymentRecord } from 'src/_mock/_data';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { isElectron, suppliersDB } from 'src/services/db'; // Import database service for SQLite supplier operations

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

  // ── Load suppliers from SQLite on mount ────────────────────────────
  // Loads all suppliers and their associated catalog, purchases, and payments from the database.
  // This replaces the old useState([]) that had no initial or mock data.
  useEffect(() => {
    if (isElectron()) {
      // Load all suppliers from SQLite, then enrich each with catalog/purchases/payments
      suppliersDB.getAll().then(async (dbSuppliers) => {
        console.log('[SuppliersContext] Loaded suppliers from SQLite:', dbSuppliers.length);
        // For each supplier, load their catalog, purchases, and payments from related tables
        const enrichedSuppliers: Supplier[] = await Promise.all(
          dbSuppliers.map(async (sup: any) => {
            const catalog = await suppliersDB.getCatalog(sup.id);       // Load the supplier's product catalog
            const purchases = await suppliersDB.getPurchases(sup.id);   // Load purchase history
            const payments = await suppliersDB.getPayments(sup.id);     // Load payment history
            return {
              ...sup,
              catalog: catalog || [],     // Ensure catalog is always an array, even if empty
              purchases: purchases || [], // Ensure purchases is always an array
              payments: payments || [],   // Ensure payments is always an array
            } as Supplier;
          })
        );
        setSuppliers(enrichedSuppliers); // Set React state with fully loaded supplier data
      }).catch((err) => {
        console.error('[SuppliersContext] Failed to load suppliers from SQLite:', err);
      });
    }
  }, []); // Empty deps = run once on mount

  const getSupplier = useCallback((id: string) => suppliers.find((s) => s.id === id), [suppliers]);

  const getSupplierByName = useCallback(
    (name: string) => suppliers.find((s) => s.name.toLowerCase() === name.toLowerCase()),
    [suppliers]
  );

  const addSupplier = useCallback(
    (data: Omit<Supplier, 'id' | 'catalog' | 'totalPaid'> & { catalog?: Omit<SupplierProduct, 'id'>[] }) => {
      // Generate IDs for each catalog product
      const catalog: SupplierProduct[] = (data.catalog || []).map((p, idx) => ({
        ...p,
        id: `cat-${Date.now()}-${idx}`, // Generate unique ID for each catalog entry
      }));
      const newSupplier: Supplier = {
        ...data,
        id: `sup-${Date.now()}`, // Generate unique supplier ID
        catalog,
        totalPurchased: data.totalPurchased || 0,
        totalPaid: 0,
        totalOwed: data.totalOwed || 0,
      };
      console.log('Adding supplier:', newSupplier);

      // ── Persist supplier to SQLite ─────────────────────────────────
      if (isElectron()) {
        // Insert the supplier row (without catalog — those are in a separate table)
        suppliersDB.add({
          id: newSupplier.id,
          name: newSupplier.name,
          phone: newSupplier.phone,
          address: newSupplier.address,
          email: newSupplier.email,
          nif: newSupplier.nif,
          nis: newSupplier.nis,
          rc: newSupplier.rc,
          ai: newSupplier.ai,
          totalPurchased: newSupplier.totalPurchased,
          totalPaid: newSupplier.totalPaid,
          totalOwed: newSupplier.totalOwed,
          debtDueDate: newSupplier.debtDueDate,
          status: newSupplier.status,
        }).catch((err) => {
          console.error('[SuppliersContext] Failed to add supplier to SQLite:', err);
        });
        // Insert each catalog product into the supplier_catalog table
        catalog.forEach((catProduct) => {
          suppliersDB.addCatalogProduct({
            ...catProduct,
            supplierId: newSupplier.id, // Link catalog product to the supplier
          }).catch((err) => {
            console.error('[SuppliersContext] Failed to add catalog product to SQLite:', err);
          });
        });
      }

      setSuppliers((prev) => {
        console.log('Previous suppliers:', prev.length, 'New total:', prev.length + 1);
        return [newSupplier, ...prev]; // Add to front of list
      });
      return newSupplier;
    },
    []
  );

  const updateSupplier = useCallback((id: string, data: Partial<Supplier>) => {
    // ── Persist supplier update to SQLite ─────────────────────────────
    if (isElectron()) {
      // Strip out catalog/purchases/payments — those are in separate tables
      const dbData = { ...data } as any;
      delete dbData.catalog;    // Catalog is managed via supplier_catalog table
      delete dbData.purchases;  // Purchases are managed via supplier_purchases table
      delete dbData.payments;   // Payments are managed via supplier_payments table
      if (Object.keys(dbData).length > 0) {
        suppliersDB.update(id, dbData).catch((err) => {
          console.error('[SuppliersContext] Failed to update supplier in SQLite:', err);
        });
      }
    }

    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
  }, []);

  const deleteSupplier = useCallback((id: string) => {
    // ── Delete supplier from SQLite (CASCADE handles catalog/purchases/payments) ──
    if (isElectron()) {
      suppliersDB.delete(id).catch((err) => {
        console.error('[SuppliersContext] Failed to delete supplier from SQLite:', err);
      });
    }

    setSuppliers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addProductToCatalog = useCallback(
    (supplierId: string, product: Omit<SupplierProduct, 'id'>) => {
      const newProduct: SupplierProduct = {
        ...product,
        id: `cat-${Date.now()}`, // Generate unique catalog product ID
      };

      // ── Persist catalog product to SQLite ──────────────────────────
      if (isElectron()) {
        suppliersDB.addCatalogProduct({
          ...newProduct,
          supplierId, // Link the catalog product to the supplier
        }).catch((err) => {
          console.error('[SuppliersContext] Failed to add product to catalog in SQLite:', err);
        });
      }

      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id !== supplierId) return s;
          return { ...s, catalog: [...s.catalog, newProduct] };
        })
      );
    },
    []
  );

  const removeProductFromCatalog = useCallback((supplierId: string, productId: string) => {
    // ── Remove catalog product from SQLite ────────────────────────────
    if (isElectron()) {
      suppliersDB.removeCatalogProduct(productId).catch((err) => {
        console.error('[SuppliersContext] Failed to remove product from catalog in SQLite:', err);
      });
    }

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== supplierId) return s;
        return { ...s, catalog: s.catalog.filter((p) => p.id !== productId) };
      })
    );
  }, []);

  const recordPayment = useCallback((id: string, amount: number, note?: string) => {
    const paymentRecord: SupplierPaymentRecord = {
      id: `pay-${Date.now()}`, // Generate unique payment ID
      supplierId: id,
      date: new Date().toISOString().split('T')[0], // Today's date in ISO format
      amount,
      note: note || '',
    };

    // ── Persist payment record to SQLite ──────────────────────────────
    if (isElectron()) {
      suppliersDB.addPayment(paymentRecord).catch((err) => {
        console.error('[SuppliersContext] Failed to record supplier payment in SQLite:', err);
      });
    }

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newTotalPaid = s.totalPaid + amount;
        const newTotalOwed = Math.max(0, s.totalOwed - amount);
        const existingPayments = s.payments || [];

        // ── Also update the supplier's financial totals in SQLite ────
        if (isElectron()) {
          suppliersDB.update(id, {
            totalPaid: newTotalPaid,
            totalOwed: newTotalOwed,
          }).catch((err) => {
            console.error('[SuppliersContext] Failed to update supplier totals after payment in SQLite:', err);
          });
        }

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
      amountPaid >= total ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'; // Determine purchase status
    const purchaseRecord: SupplierPurchase = {
      id: `pur-${Date.now()}`, // Generate unique purchase ID
      supplierId: id,
      date: new Date().toISOString().split('T')[0],
      items,
      total,
      amountPaid,
      status,
    };

    // ── Persist purchase record to SQLite ─────────────────────────────
    if (isElectron()) {
      suppliersDB.addPurchase(purchaseRecord).catch((err) => {
        console.error('[SuppliersContext] Failed to record purchase in SQLite:', err);
      });
    }

    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const existingPurchases = s.purchases || [];
        const newTotalPurchased = s.totalPurchased + total;
        const newTotalPaid = s.totalPaid + amountPaid;
        const newTotalOwed = s.totalOwed + (total - amountPaid);

        // ── Update supplier financial totals in SQLite ────────────────
        if (isElectron()) {
          suppliersDB.update(id, {
            totalPurchased: newTotalPurchased,
            totalPaid: newTotalPaid,
            totalOwed: newTotalOwed,
          }).catch((err) => {
            console.error('[SuppliersContext] Failed to update supplier totals after purchase in SQLite:', err);
          });
        }

        return {
          ...s,
          totalPurchased: newTotalPurchased,
          totalPaid: newTotalPaid,
          totalOwed: newTotalOwed,
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

  const clearAll = useCallback(() => {
    // ── Clear all suppliers from SQLite ───────────────────────────────
    if (isElectron()) {
      suppliersDB.clearAll().catch((err) => {
        console.error('[SuppliersContext] Failed to clear all suppliers from SQLite:', err);
      });
    }

    setSuppliers([]);
  }, []);

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
