import type { ReactNode } from 'react';
import type { StockBatch, InventoryProduct } from 'src/_mock/_data';

import { useMemo, useState, useEffect, useContext, useCallback, createContext } from 'react';

import { batchesDB, isElectron, productsDB } from 'src/services/db'; // Import the database service layer for SQLite operations

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
  canDeductAfterRestore: (
    oldItems: { name: string; quantity: number }[],
    newItems: { name: string; quantity: number }[]
  ) => { ok: boolean; errors: string[] };
  deductStockForInvoice: (items: { name: string; quantity: number }[]) => { // return type extended to carry FIFO-weighted prices
    success: boolean;
    errors: string[];
    pricedItems?: { name: string; unitPrice: number; total: number }[]; // added: FIFO-weighted average sell price per batched product (absent for non-batched products)
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

// Helper function to compute stock status from stock and minStock values
// This is used both when reading from DB and when updating in-memory state
const computeStockStatus = (stock: number, minStock: number): InventoryProduct['status'] => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= minStock) return 'low-stock';
  return 'in-stock';
};

export function InventoryProvider({ children }: ProviderProps) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);

  // ── Load products from SQLite on mount ─────────────────────────────
  // This useEffect runs once when the provider mounts and loads all products from the database.
  // It replaces the old useState([]) initialization that used hardcoded mock data.
  useEffect(() => {
    if (isElectron()) {
      // We are running inside Electron — load products then hydrate each with its batch rows.
      // Without the second pass products always boot with batches: undefined, causing all
      // per-batch prices to be lost across every app restart (FIFO persistence bug fix).
      productsDB.getAll().then(async (dbProducts) => { // added async: needed to await batch loads inside the callback
        console.log('[InventoryContext] Loaded products from SQLite:', dbProducts.length); // Log how many products were loaded

        // added: for every product, fetch its persisted rows from the stock_batches table in parallel
        const withBatches = await Promise.all( // added: run all batch lookups concurrently for performance
          dbProducts.map(async (p) => { // added: each product becomes an async lookup
            const batches = await batchesDB.getByProduct(p.id); // added: query stock_batches for this product's rows
            if (batches.length > 0) { // added: only attach the array when at least one batch row exists
              return { ...p, batches }; // added: return the product with its batches array restored
            }
            return p; // added: no batch rows found – return product unchanged (batches stays undefined)
          })
        );

        setProducts(withBatches); // added: set state once after all products are fully hydrated with batches
      }).catch((err) => {
        window.appLog?.error('[InventoryContext] Failed to load products from SQLite:', err); // Log any database errors
      });
    }
    // If not in Electron, products starts as empty array (no mock data)
  }, []); // Empty dependency array = run only once on mount

  const getProduct = useCallback((id: string) => products.find((p) => p.id === id), [products]);

  const getProductByName = useCallback(
    (name: string) => products.find((p) => p.name.toLowerCase() === name.toLowerCase()),
    [products]
  );

  const addProduct = useCallback((data: Omit<InventoryProduct, 'id' | 'status'>) => {
    console.log('InventoryContext.addProduct called with:', data);
    const status = computeStockStatus(data.stock, data.minStock); // Compute initial status from stock/minStock values

    // Auto-generate SKU if not provided
    const autoSku = data.sku || `PROD-${String(products.length + 1).padStart(3, '0')}`;

    const newProduct: InventoryProduct = {
      ...data,
      sku: autoSku,
      id: `inv-${Date.now()}`, // Generate unique ID using timestamp
      status,
    };

    // ── Persist to SQLite database ───────────────────────────────────
    if (isElectron()) {
      productsDB.add(newProduct).catch((err) => {
        window.appLog?.error('[InventoryContext] Failed to add product to SQLite:', err); // Log database write errors
      });
    }

    setProducts((prev) => {
      console.log('Previous products count:', prev.length, 'Adding:', newProduct.name);
      return [newProduct, ...prev]; // Add to front of array so newest appears first
    });
    return newProduct;
  }, [products.length]);

  const addBatch = useCallback((productId: string, batch: Omit<StockBatch, 'id'>) => {
    const newBatchId = `batch-${Date.now()}`; // Generate unique batch ID

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;

        // added: remember whether this product had no prior batches — determines if init-batch must be persisted
        const hadNoBatches = !p.batches; // added: true when p.batches was undefined before this call

        // added: build the synthetic init-batch as a named variable so we can persist it if it is newly created
        const initBatch: StockBatch | null = // added: null when product already has batches or has zero stock
          hadNoBatches && p.stock > 0 // added: only create init-batch on the very first addBatch call for this product
            ? { // added: snapshot the product's current price/stock as the 'original' batch
                id: `batch-init-${p.id}`,          // added: stable ID so duplicate inserts can be detected
                buyingPrice: p.buyingPrice,         // added: original buying price before any new batch is added
                sellPrice: p.sellPrice,             // added: original sell price before any new batch is added
                quantity: p.stock,                  // added: all existing stock belongs to this original batch
                purchaseDate: new Date().toISOString().split('T')[0], // added: use today as a fallback date
              }
            : null; // added: null means p.batches already existed or stock was 0 — no init-batch needed

        // Wrap existing stock into an initial batch if the product has none yet
        const existingBatches: StockBatch[] = p.batches ?? // use persisted batches if available
          (initBatch ? [initBatch] : []); // added: use the tracked initBatch or empty array (replaces inline literal)

        const newBatch: StockBatch = { ...batch, id: newBatchId };
        const updatedBatches = [...existingBatches, newBatch];
        const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);
        // Displayed prices always reflect the oldest (currently-selling) batch
        const oldest = updatedBatches[0];
        const newStatus = computeStockStatus(newStock, p.minStock); // Recompute status after stock change

        // ── Persist batch and updated product to SQLite ─────────────
        if (isElectron()) {
          // added: if this is the first batch ever, persist the synthetic init-batch so it survives app restart
          if (initBatch) { // added: only run when p.batches was undefined — i.e. init-batch was just created
            batchesDB.add({ ...initBatch, productId }).catch((err) => { // added: write original-stock batch to stock_batches
              window.appLog?.error('[InventoryContext] Failed to persist init-batch to SQLite:', err); // added: error log
            }); // added: end of initBatch persist call
          } // added: end initBatch guard
          batchesDB.add({ ...newBatch, productId }).catch((err) => {
            window.appLog?.error('[InventoryContext] Failed to add batch to SQLite:', err);
          });
          productsDB.update(productId, {
            stock: newStock,
            buyingPrice: oldest.buyingPrice,
            sellPrice: oldest.sellPrice,
            status: newStatus,
          }).catch((err) => {
            window.appLog?.error('[InventoryContext] Failed to update product stock in SQLite:', err);
          });
        }

        return {
          ...p,
          batches: updatedBatches,
          stock: newStock,
          buyingPrice: oldest.buyingPrice,
          sellPrice: oldest.sellPrice,
          status: newStatus,
        };
      })
    );
  }, []);

  const updateProduct = useCallback((id: string, data: Partial<InventoryProduct>) => {
    // ── Persist update to SQLite database ─────────────────────────────
    if (isElectron()) {
      // Prepare the data for SQLite — remove the batches field since it's stored in a separate table
      const dbData = { ...data }; // Clone to avoid mutating the original
      delete (dbData as any).batches; // Batches are in the stock_batches table, not the products table
      productsDB.update(id, dbData).catch((err) => {
        window.appLog?.error('[InventoryContext] Failed to update product in SQLite:', err);
      });
    }

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
    // ── Delete from SQLite database ──────────────────────────────────
    if (isElectron()) {
      productsDB.delete(id).catch((err) => {
        window.appLog?.error('[InventoryContext] Failed to delete product from SQLite:', err);
      });
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const adjustStock = useCallback((id: string, quantity: number, type: 'add' | 'remove') => {
    // 1. Synchronous pre-check using current products state — avoids stale-closure boolean bug
    const product = products.find((p) => p.id === id);
    if (!product) return false;
    if (type === 'remove' && product.stock < quantity) return false;

    // 2. Compute new stock and status synchronously
    const newStock = type === 'add' ? product.stock + quantity : product.stock - quantity;
    const newStatus = computeStockStatus(newStock, product.minStock);

    // 3. Sync FIFO batches when the product has batch rows
    let updatedBatches = product.batches; // undefined for non-FIFO products — leave untouched
    let newBuyingPrice = product.buyingPrice;
    let newSellPrice = product.sellPrice;

    if (product.batches && product.batches.length > 0) {
      if (type === 'add') {
        const mostRecentBatch = product.batches[product.batches.length - 1];
        if (mostRecentBatch) {
          // Top up the most recent batch — no price input in the dialog so we reuse existing price
          const updatedMostRecent = { ...mostRecentBatch, quantity: mostRecentBatch.quantity + quantity };
          updatedBatches = [...product.batches.slice(0, -1), updatedMostRecent];
          if (isElectron()) {
            batchesDB.update(mostRecentBatch.id, { quantity: updatedMostRecent.quantity }).catch((err) => {
              window.appLog?.error('[InventoryContext] Failed to update most-recent batch in SQLite:', err);
            });
          }
        } else {
          // Fallback: no batches exist — create one using current product price
          const fallbackBatch: StockBatch = {
            id: `batch-${Date.now()}`,
            buyingPrice: product.buyingPrice,
            sellPrice: product.sellPrice,
            quantity,
            purchaseDate: new Date().toISOString().split('T')[0],
          };
          updatedBatches = [fallbackBatch];
          if (isElectron()) {
            batchesDB.add({ ...fallbackBatch, productId: id }).catch((err) => {
              window.appLog?.error('[InventoryContext] Failed to persist fallback batch to SQLite:', err);
            });
          }
        }
      } else {
        // FIFO removal: consume oldest batches first
        let remaining = quantity;
        updatedBatches = product.batches
          .map((batch) => {
            if (remaining <= 0) return batch;
            const deducted = Math.min(batch.quantity, remaining);
            remaining -= deducted;
            const updatedBatch = { ...batch, quantity: batch.quantity - deducted };
            if (isElectron()) {
              if (updatedBatch.quantity <= 0) {
                batchesDB.delete(batch.id).catch((err) => {
                  window.appLog?.error('[InventoryContext] Failed to delete depleted batch from SQLite:', err);
                });
              } else {
                batchesDB.update(batch.id, { quantity: updatedBatch.quantity }).catch((err) => {
                  window.appLog?.error('[InventoryContext] Failed to update batch quantity in SQLite:', err);
                });
              }
            }
            return updatedBatch;
          })
          .filter((batch) => batch.quantity > 0);
        // Update displayed prices to reflect the new oldest (active) batch
        if (updatedBatches.length > 0) {
          newBuyingPrice = updatedBatches[0].buyingPrice;
          newSellPrice = updatedBatches[0].sellPrice;
        }
      }
    }

    // 4. Persist product row to SQLite
    if (isElectron()) {
      productsDB.update(id, {
        stock: newStock,
        status: newStatus,
        buyingPrice: newBuyingPrice,
        sellPrice: newSellPrice,
      }).catch((err) => {
        window.appLog?.error('[InventoryContext] Failed to adjust stock in SQLite:', err);
      });
    }

    // 5. Apply pre-computed values to in-memory state
    setProducts((prev) =>
      prev.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              stock: newStock,
              status: newStatus,
              buyingPrice: newBuyingPrice,
              sellPrice: newSellPrice,
              ...(updatedBatches !== undefined ? { batches: updatedBatches } : {}),
            }
      )
    );

    return true;
  }, [products]); // depends on products for synchronous pre-check

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

      // added: compute FIFO-weighted sell prices BEFORE calling setProducts.
      // setProducts runs asynchronously and its updater function cannot return values,
      // so we walk the batches here using the 'products' array captured in this closure.
      const pricedItems: { name: string; unitPrice: number; total: number }[] = []; // added: accumulates the weighted-price result for each batched product

      for (const item of items) { // added: process each invoice line item to determine its FIFO price
        const product = products.find( // added: look up the matching product in current in-memory state
          (p) => p.name.toLowerCase() === item.name.toLowerCase()
        );
        if (!product || !product.batches || product.batches.length === 0) continue; // added: no batch rows → the UI-entered sell price remains unchanged

        // added: walk batches oldest-first to compute the blended sell cost for this quantity
        let remaining = item.quantity; // added: units still to be allocated across batches
        let fifoTotal = 0; // added: running sell-price total across all consumed batch slices

        for (const batch of product.batches) { // added: batches are ordered oldest-first (ascending purchaseDate)
          if (remaining <= 0) break; // added: all quantity allocated — stop early
          const taken = Math.min(batch.quantity, remaining); // added: consume as many units as this batch holds, capped at remaining demand
          fifoTotal += taken * batch.sellPrice; // added: add this batch slice's contribution at its own sell price
          remaining -= taken; // added: deduct allocated units from the remaining demand counter
        }

        // added: weighted average = total FIFO revenue / total units ordered for this product
        const weightedUnitPrice = item.quantity > 0 ? fifoTotal / item.quantity : 0; // added: guard against divide-by-zero
        pricedItems.push({ name: item.name, unitPrice: weightedUnitPrice, total: fifoTotal }); // added: record the FIFO-weighted result for the caller to apply
      }

      // Deduct stock
      setProducts((prev) =>
        prev.map((p) => {
          const item = items.find((i) => i.name.toLowerCase() === p.name.toLowerCase());
          if (!item) return p;

          if (!p.batches || p.batches.length === 0) {
            // No FIFO batches — simple deduction
            const newStock = Math.max(0, p.stock - item.quantity);
            const newStatus = computeStockStatus(newStock, p.minStock); // Recompute status

            // ── Persist simple deduction to SQLite ─────────────────
            if (isElectron()) {
              productsDB.update(p.id, { stock: newStock, status: newStatus }).catch((err) => {
                window.appLog?.error('[InventoryContext] Failed to deduct stock in SQLite:', err);
              });
            }

            return { ...p, stock: newStock, status: newStatus };
          }

          // FIFO: consume oldest batches first
          let remaining = item.quantity;
          const updatedBatches = p.batches
            .map((batch) => {
              if (remaining <= 0) return batch;
              const deducted = Math.min(batch.quantity, remaining);
              remaining -= deducted;
              const updatedBatch = { ...batch, quantity: batch.quantity - deducted };

              // ── Update or delete batch in SQLite ─────────────────
              if (isElectron()) {
                if (updatedBatch.quantity <= 0) {
                  batchesDB.delete(batch.id).catch((err) => {
                    window.appLog?.error('[InventoryContext] Failed to delete empty batch from SQLite:', err);
                  });
                } else {
                  batchesDB.update(batch.id, { quantity: updatedBatch.quantity }).catch((err) => {
                    window.appLog?.error('[InventoryContext] Failed to update batch quantity in SQLite:', err);
                  });
                }
              }

              return updatedBatch;
            })
            .filter((batch) => batch.quantity > 0);

          const newStock = updatedBatches.reduce((sum, b) => sum + b.quantity, 0);
          const oldest = updatedBatches[0];
          const newStatus = computeStockStatus(newStock, p.minStock);

          // ── Persist updated product to SQLite ───────────────────
          if (isElectron()) {
            productsDB.update(p.id, {
              stock: newStock,
              buyingPrice: oldest?.buyingPrice ?? p.buyingPrice,
              sellPrice: oldest?.sellPrice ?? p.sellPrice,
              status: newStatus,
            }).catch((err) => {
              window.appLog?.error('[InventoryContext] Failed to update product after FIFO deduction in SQLite:', err);
            });
          }

          return {
            ...p,
            batches: updatedBatches,
            stock: newStock,
            buyingPrice: oldest?.buyingPrice ?? p.buyingPrice,
            sellPrice: oldest?.sellPrice ?? p.sellPrice,
            status: newStatus,
          };
        })
      );

      return { success: true, errors: [], pricedItems }; // added: pass FIFO-weighted prices back to the caller alongside the success flag
    },
    [products]
  );

  // Pure read-only check: simulates restoring oldItems then validates newItems fit.
  // Does NOT mutate any state.
  const canDeductAfterRestore = useCallback(
    (
      oldItems: { name: string; quantity: number }[],
      newItems: { name: string; quantity: number }[]
    ): { ok: boolean; errors: string[] } => {
      const errors: string[] = [];
      for (const newItem of newItems) {
        const product = products.find((p) => p.name.toLowerCase() === newItem.name.toLowerCase());
        if (!product) continue; // custom / non-inventory product — skip
        const oldItem = oldItems.find((o) => o.name.toLowerCase() === newItem.name.toLowerCase());
        const restoredStock = product.stock + (oldItem?.quantity ?? 0);
        if (restoredStock < newItem.quantity) {
          errors.push(
            `"${newItem.name}": insufficient stock (${restoredStock} available, ${newItem.quantity} needed)`
          );
        }
      }
      return { ok: errors.length === 0, errors };
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
        const newStatus = computeStockStatus(newStock, p.minStock);
        // For FIFO products, add restored qty back to the oldest remaining batch
        const updatedBatches = p.batches
          ? p.batches.map((batch, idx) =>
              idx === 0 ? { ...batch, quantity: batch.quantity + item.quantity } : batch
            )
          : undefined;

        // ── Persist stock restoration to SQLite ──────────────────────
        if (isElectron()) {
          productsDB.update(p.id, { stock: newStock, status: newStatus }).catch((err) => {
            window.appLog?.error('[InventoryContext] Failed to restore stock in SQLite:', err);
          });
          // Also update the first batch quantity if FIFO
          if (updatedBatches && updatedBatches.length > 0) {
            batchesDB.update(updatedBatches[0].id, { quantity: updatedBatches[0].quantity }).catch((err) => {
              window.appLog?.error('[InventoryContext] Failed to update batch during stock restore in SQLite:', err);
            });
          }
        }

        return {
          ...p,
          stock: newStock,
          batches: updatedBatches,
          status: newStatus,
        };
      })
    );
  }, []);

  const resetAllStock = useCallback(() => {
    // ── Reset all stock in SQLite ────────────────────────────────────
    if (isElectron()) {
      productsDB.resetAllStock().catch((err) => {
        window.appLog?.error('[InventoryContext] Failed to reset all stock in SQLite:', err);
      });
    }

    setProducts((prev) =>
      prev.map((p) => ({ ...p, stock: 0, batches: undefined, status: 'out-of-stock' as const }))
    );
  }, []);

  const clearAll = useCallback(() => {
    // ── Clear all products from SQLite ────────────────────────────────
    if (isElectron()) {
      productsDB.clearAll().catch((err) => {
        window.appLog?.error('[InventoryContext] Failed to clear all products from SQLite:', err);
      });
    }

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
      canDeductAfterRestore,
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
      canDeductAfterRestore,
      deductStockForInvoice,
      restoreStockForInvoice,
      resetAllStock,
      clearAll,
    ]
  );

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
