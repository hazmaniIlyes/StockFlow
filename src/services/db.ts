// src/services/db.ts — Database service layer
// This module provides a clean API for the React context providers to interact with SQLite.
// It wraps window.database calls and provides fallback behavior when running outside Electron.
// All context providers import from this file instead of calling window.database directly.

// Import types so we get proper typing throughout the service layer
import type { Client, Expense, Invoice, StockBatch,
  InventoryProduct, SupplierPurchase, SupplierPaymentRecord } from 'src/_mock/_data';

// ======================================================================

/**
 * isElectron() — Checks if the app is running inside Electron (vs a normal browser)
 * When window.database exists, we know the preload script has been loaded by Electron.
 * This lets us gracefully fall back to in-memory behavior during development without Electron.
 */
export function isElectron(): boolean {
  return typeof window !== 'undefined' && typeof window.database !== 'undefined';
}

/**
 * isDiskFullError() — Detects SQLITE_FULL and related disk-full errors.
 * better-sqlite3 throws synchronously; the error arrives as a rejected
 * Promise via ipcRenderer.invoke(). SQLite error code 13 = SQLITE_FULL.
 */
function isDiskFullError(err: unknown): boolean {
  const msg = String(err).toLowerCase();
  return (
    msg.includes('sqlite_full') ||
    msg.includes('database or disk full') ||
    msg.includes('disk i/o error') ||
    (err as any)?.code === 'SQLITE_FULL' ||
    (err as any)?.errno === 13
  );
}

/**
 * withDiskCheck() — Wraps a DB write Promise. If it rejects with a disk-full
 * error, dispatches a 'db:disk-full' DOM event so the DiskSpaceMonitor can
 * show a blocking dialog. The error is always re-thrown so callers can still
 * handle it (e.g. log it).
 */
function withDiskCheck<T>(promise: Promise<T>): Promise<T> {
  return promise.catch((err: unknown) => {
    if (isDiskFullError(err)) {
      window.dispatchEvent(new CustomEvent('db:disk-full'));
    }
    throw err;
  });
}


/**
 * getDB() — Returns the database API object, or throws if not available.
 * This is a convenience wrapper to avoid null checks everywhere.
 */
function getDB() {
  if (!window.database) {
    throw new Error('[db] window.database is not available — app is not running in Electron'); // Clear error message for debugging
  }
  return window.database; // Return the preload-exposed API object
}

// ======================================================================
// PRODUCTS SERVICE — Wraps all product-related database operations
// ======================================================================

export const productsDB = {
  getAll: (): Promise<InventoryProduct[]> => getDB().getProducts(),
  getById: (id: string): Promise<InventoryProduct | undefined> => getDB().getProduct(id),
  getByName: (name: string): Promise<InventoryProduct | undefined> => getDB().getProductByName(name),
  add: (product: InventoryProduct): Promise<InventoryProduct> => withDiskCheck(getDB().addProduct(product)),
  update: (id: string, data: Partial<InventoryProduct>): Promise<void> => withDiskCheck(getDB().updateProduct(id, data)),
  delete: (id: string): Promise<void> => withDiskCheck(getDB().deleteProduct(id)),
  clearAll: (): Promise<void> => withDiskCheck(getDB().clearProducts()),
  resetAllStock: (): Promise<void> => withDiskCheck(getDB().resetAllStock()),
};

export const batchesDB = {
  getByProduct: (productId: string) => getDB().getBatches(productId),
  add: (data: StockBatch & { productId: string }) => withDiskCheck(getDB().addBatch(data)),
  update: (id: string, data: Partial<StockBatch>) => withDiskCheck(getDB().updateBatch(id, data)),
  delete: (id: string) => withDiskCheck(getDB().deleteBatch(id)),
  clearByProduct: (productId: string) => withDiskCheck(getDB().clearBatches(productId)),
};

export const clientsDB = {
  getAll: (): Promise<Client[]> => getDB().getClients(),
  getById: (id: string): Promise<Client | undefined> => getDB().getClient(id),
  getByName: (name: string): Promise<Client | undefined> => getDB().getClientByName(name),
  add: (client: Client): Promise<Client> => withDiskCheck(getDB().addClient(client)),
  update: (id: string, data: Partial<Client>): Promise<void> => withDiskCheck(getDB().updateClient(id, data)),
  delete: (id: string): Promise<void> => withDiskCheck(getDB().deleteClient(id)),
  clearAll: (): Promise<void> => withDiskCheck(getDB().clearClients()),
};

// ======================================================================
// SUPPLIERS SERVICE — Supplier CRUD + catalog, purchases, payments
// ======================================================================

export const suppliersDB = {
  getAll: () => getDB().getSuppliers(),
  getById: (id: string) => getDB().getSupplier(id),
  add: (data: any) => withDiskCheck(getDB().addSupplier(data)),
  update: (id: string, data: any) => withDiskCheck(getDB().updateSupplier(id, data)),
  delete: (id: string) => withDiskCheck(getDB().deleteSupplier(id)),
  clearAll: () => withDiskCheck(getDB().clearSuppliers()),
  getCatalog: (supplierId: string) => getDB().getCatalogProducts(supplierId),
  addCatalogProduct: (data: any) => withDiskCheck(getDB().addCatalogProduct(data)),
  removeCatalogProduct: (id: string) => withDiskCheck(getDB().removeCatalogProduct(id)),
  getPurchases: (supplierId: string) => getDB().getPurchases(supplierId),
  addPurchase: (data: SupplierPurchase) => withDiskCheck(getDB().addPurchase(data)),
  getPayments: (supplierId: string) => getDB().getSupplierPayments(supplierId),
  addPayment: (data: SupplierPaymentRecord) => withDiskCheck(getDB().addSupplierPayment(data)),
};

export const invoicesDB = {
  getAll: (): Promise<Invoice[]> => getDB().getInvoices(),
  getById: (id: string): Promise<Invoice | undefined> => getDB().getInvoice(id),
  add: (invoice: Invoice): Promise<Invoice> => withDiskCheck(getDB().addInvoice(invoice)),
  update: (id: string, data: Partial<Invoice>): Promise<void> => withDiskCheck(getDB().updateInvoice(id, data)),
  delete: (id: string): Promise<Invoice | undefined> => withDiskCheck(getDB().deleteInvoice(id)),
  clearAll: (): Promise<void> => withDiskCheck(getDB().clearInvoices()),
  getCounter: (): Promise<number> => getDB().getInvoiceCounter(),
  setCounter: (val: number): Promise<void> => withDiskCheck(getDB().setInvoiceCounter(val)),
};

export const expensesDB = {
  getAll: (): Promise<Expense[]> => getDB().getExpenses(),
  getById: (id: string): Promise<Expense | undefined> => getDB().getExpense(id),
  add: (expense: Expense): Promise<Expense> => withDiskCheck(getDB().addExpense(expense)),
  update: (id: string, data: Partial<Expense>): Promise<void> => withDiskCheck(getDB().updateExpense(id, data)),
  delete: (id: string): Promise<void> => withDiskCheck(getDB().deleteExpense(id)),
  clearAll: (): Promise<void> => withDiskCheck(getDB().clearExpenses()),
};

// ======================================================================
// TVA DECLARATIONS SERVICE
// ======================================================================

export const tvaDB = {
  /** Fetch all TVA declarations */
  getAll: () => getDB().getTvaDeclarations(),

  /** Record a new TVA declaration */
  add: (data: { id: string; period: string; amount: number; dateDeclared: string }) => getDB().addTvaDeclaration(data),

  /** Clear all TVA declarations */
  clearAll: () => getDB().clearTvaDeclarations(),
};

// ======================================================================
// SETTINGS SERVICE — Key-value configuration store
// ======================================================================

export const settingsDB = {
  /** Get a setting value by key */
  get: (key: string): Promise<string | null> => getDB().getSetting(key),

  /** Set a setting value (upsert) */
  set: (key: string, value: string): Promise<void> => getDB().setSetting(key, value),

  /** Get all settings as key-value object */
  getAll: (): Promise<Record<string, string>> => getDB().getAllSettings(),
};

// ======================================================================
// ACTION ITEMS SERVICE — Dashboard actionable notes
// ======================================================================

export const actionItemsDB = {
  /** Fetch all action items */
  getAll: () => getDB().getActionItems(),

  /** Record a new action item */
  add: (data: { id: string; title: string; completed: boolean }) => getDB().addActionItem(data),

  /** Toggle the completed status of an action item */
  toggle: (id: string) => getDB().toggleActionItem(id),

  /** Delete an action item completely */
  delete: (id: string) => getDB().deleteActionItem(id),
};
