import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { InventoryProduct, StockBatch } from 'src/_mock/_data';

// ======================================================================

type InventoryContextType = {
  products: InventoryProduct[];
  getProduct: (id: string) => InventoryProduct | undefined;
  getProductByName: (name: string) => InventoryProduct | undefined;
  addProduct: (product: Omit<InventoryProduct, 'id' | 'status'>) => InventoryProduct;
  addBatch: (productId: string, batch: Omit<StockBatch, 'id'>) => void;
  updateProduct: (id: string, data: Partial<InventoryProduct>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (id: string, quantity: number, type: 'add' | 'remove') => boolean;
  deductStockForInvoice: (items: { name: string; quantity: number }[]) => {
    success: boolean;
    errors: string[];
  };
  restoreStockForInvoice: (items: { name: string; quantity: number }[]) => void;
  resetAllStock: () => void;
  clearAll: () => void;
};

const InventoryContext = createContext<InventoryContextType | null>(null);

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}

type ProviderProps = {
  children: ReactNode;
};

const computeStockStatus = (stock: number, minStock: number): InventoryProduct['status'] => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= minStock) return 'low-stock';
  return 'in-stock';
};

export function InventoryProvider({ children }: ProviderProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const getProductByName = useCallback(
    (name: string) => products.find((p) => p.name.toLowerCase() === name.toLowerCase()),
    [products]
  );

  const addProduct = useCallback((data: Omit<InventoryProduct, 'id' | 'status'>) => {
    console.log('InventoryContext.addProduct called with:', data);
    const status = computeStockStatus(data.stock, data.minStock);
    
    // Auto-generate SKU if not provided
    const autoSku = data.sku || `PROD-${String(products.length + 1).padStart(3, '0')}`;
    
    const newProduct: InventoryProduct = {
      ...data,
      sku: autoSku,
      id: `inv-${Date.now()}`,
      status,
    };
    setProducts((prev) => {
      console.log('Previous products count:', prev.length, 'Adding:', newProduct.name);
      return [newProduct, ...prev];
    });
    return newProduct;
  }, [products.length]);

  const addBatch = useCallback((productId: string, batch: Omit<StockBatch, 'id'>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        // Wrap existing stock into an initial batch if the product has none yet
        const existingBatches: StockBatch[] = p.batches ??
          (p.stock > 0
            ? [{ id: `batch-init-${p.id}`, buyingPrice: p.buyingPrice, sellPrice: p.sellPrice, quantity: p.stock, purchaseDate: new Date().toISOString().split('T')[0] }]
            : []);
        const newBatch: StockBatch = { ...batch, id: `batch-${Date.now()}` };
        const updatedBatches = [...existingBatches, newBatch];
        const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);
        // Displayed prices always reflect the oldest (currently-selling) batch
        const oldest = updatedBatches[0];
        return {
          ...p,
          batches: updatedBatches,
          stock: newStock,
          buyingPrice: oldest.buyingPrice,
          sellPrice: oldest.sellPrice,
          status: computeStockStatus(newStock, p.minStock),
        };
      })
    );
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<InventoryProduct>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...data };
        // Explicitly clear batches when undefined is passed (FIFO → single price merge)
        if ('batches' in data && data.batches === undefined) {
          delete updated.batches;
        }
        // Recalculate status if stock changed
        if (data.stock !== undefined || data.minStock !== undefined) {
          updated.status = computeStockStatus(updated.stock, updated.minStock);
        }
        return updated;
      })
    );
  }, []);

  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const adjustStock = useCallback((id: string, quantity: number, type: 'add' | 'remove') => {
    let success = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newStock = type === 'add' ? p.stock + quantity : Math.max(0, p.stock - quantity);
        if (type === 'remove' && p.stock < quantity) {
          success = false;
          return p;
        }
        success = true;
        return {
          ...p,
          stock: newStock,
          status: computeStockStatus(newStock, p.minStock),
        };
      })
    );
    return success;
  }, []);

  // Deduct stock for all items in an invoice
  const deductStockForInvoice = useCallback(
    (items: { name: string; quantity: number }[]) => {
      const errors: string[] = [];

      // First, validate all items have sufficient stock
      for (const item of items) {
        const product = products.find((p) => p.name.toLowerCase() === item.name.toLowerCase());
        if (!product) {
          // Product not in inventory - skip (might be a custom product)
          continue;
        }
        if (product.stock < item.quantity) {
          errors.push(
            `Insufficient stock for "${item.name}": Available ${product.stock}, Requested ${item.quantity}`
          );
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Deduct stock
      setProducts((prev) =>
        prev.map((p) => {
          const item = items.find((i) => i.name.toLowerCase() === p.name.toLowerCase());
          if (!item) return p;

          if (!p.batches || p.batches.length === 0) {
            // No FIFO batches — simple deduction
            const newStock = Math.max(0, p.stock - item.quantity);
            return { ...p, stock: newStock, status: computeStockStatus(newStock, p.minStock) };
          }

          // FIFO: consume oldest batches first
          let remaining = item.quantity;
          const updatedBatches = p.batches
            .map((batch) => {
              if (remaining <= 0) return batch;
              const deducted = Math.min(batch.quantity, remaining);
              remaining -= deducted;
              return { ...batch, quantity: batch.quantity - deducted };
            })
            .filter((batch) => batch.quantity > 0);

          const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);
          const oldest = updatedBatches[0];
          return {
            ...p,
            batches: updatedBatches,
            stock: newStock,
            buyingPrice: oldest?.buyingPrice ?? p.buyingPrice,
            sellPrice: oldest?.sellPrice ?? p.sellPrice,
            status: computeStockStatus(newStock, p.minStock),
          };
        })
      );

      return { success: true, errors: [] };
    },
    [products]
  );

  // Restore stock when an invoice is deleted or edited
  const restoreStockForInvoice = useCallback((items: { name: string; quantity: number }[]) => {
    setProducts((prev) =>
      prev.map((p) => {
        const item = items.find((i) => i.name.toLowerCase() === p.name.toLowerCase());
        if (!item) return p;

        const newStock = p.stock + item.quantity;
        // For FIFO products, add restored qty back to the oldest remaining batch
        const updatedBatches = p.batches
          ? p.batches.map((batch, idx) =>
              idx === 0 ? { ...batch, quantity: batch.quantity + item.quantity } : batch
            )
          : undefined;

        return {
          ...p,
          stock: newStock,
          batches: updatedBatches,
          status: computeStockStatus(newStock, p.minStock),
        };
      })
    );
  }, []);

  const resetAllStock = useCallback(() => {
    setProducts((prev) =>
      prev.map((p) => ({ ...p, stock: 0, batches: undefined, status: 'out-of-stock' as const }))
    );
  }, []);

  const clearAll = useCallback(() => {
    setProducts([]);
  }, []);

  const value = useMemo(
    () => ({
      products,
      getProduct,
      getProductByName,
      addProduct,
      addBatch,
      updateProduct,
      deleteProduct,
      adjustStock,
      deductStockForInvoice,
      restoreStockForInvoice,
      resetAllStock,
      clearAll,
    }),
    [
      products,
      getProduct,
      getProductByName,
      addProduct,
      addBatch,
      updateProduct,
      deleteProduct,
      adjustStock,
      deductStockForInvoice,
      restoreStockForInvoice,
      resetAllStock,
      clearAll,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
