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
  return typeof window !== 'undefined' && typeof window.database !== 'undefined'; // Check if preload bridge exists
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
  /** Fetch all products from the database */
  getAll: (): Promise<InventoryProduct[]> => getDB().getProducts(),

  /** Fetch a single product by ID */
  getById: (id: string): Promise<InventoryProduct | undefined> => getDB().getProduct(id),

  /** Fetch a product by name (case-insensitive match) */
  getByName: (name: string): Promise<InventoryProduct | undefined> => getDB().getProductByName(name),

  /** Insert a new product into the database */
  add: (product: InventoryProduct): Promise<InventoryProduct> => getDB().addProduct(product),

  /** Update specific fields of an existing product */
  update: (id: string, data: Partial<InventoryProduct>): Promise<void> => getDB().updateProduct(id, data),

  /** Delete a product by ID */
  delete: (id: string): Promise<void> => getDB().deleteProduct(id),

  /** Delete ALL products from the database (admin reset) */
  clearAll: (): Promise<void> => getDB().clearProducts(),

  /** Set all product stock to 0 without deleting products */
  resetAllStock: (): Promise<void> => getDB().resetAllStock(),
};

// ======================================================================
// BATCHES SERVICE — Stock batch operations for FIFO management
// ======================================================================

export const batchesDB = {
  /** Get all batches for a product, ordered oldest first (FIFO) */
  getByProduct: (productId: string) => getDB().getBatches(productId),

  /** Insert a new batch */
  add: (data: StockBatch & { productId: string }) => getDB().addBatch(data),

  /** Update a batch (e.g., reduce quantity during deduction) */
  update: (id: string, data: Partial<StockBatch>) => getDB().updateBatch(id, data),

  /** Delete a batch */
  delete: (id: string) => getDB().deleteBatch(id),

  /** Clear all batches for a product */
  clearByProduct: (productId: string) => getDB().clearBatches(productId),
};

// ======================================================================
// CLIENTS SERVICE — Client CRUD operations
// ======================================================================

export const clientsDB = {
  /** Fetch all clients from the database */
  getAll: (): Promise<Client[]> => getDB().getClients(),

  /** Fetch a single client by ID */
  getById: (id: string): Promise<Client | undefined> => getDB().getClient(id),

  /** Fetch a client by name (case-insensitive) */
  getByName: (name: string): Promise<Client | undefined> => getDB().getClientByName(name),

  /** Insert a new client */
  add: (client: Client): Promise<Client> => getDB().addClient(client),

  /** Update specific client fields */
  update: (id: string, data: Partial<Client>): Promise<void> => getDB().updateClient(id, data),

  /** Delete a client by ID */
  delete: (id: string): Promise<void> => getDB().deleteClient(id),

  /** Delete ALL clients (admin reset) */
  clearAll: (): Promise<void> => getDB().clearClients(),
};

// ======================================================================
// SUPPLIERS SERVICE — Supplier CRUD + catalog, purchases, payments
// ======================================================================

export const suppliersDB = {
  /** Fetch all suppliers (flat — catalog/purchases/payments loaded separately) */
  getAll: () => getDB().getSuppliers(),

  /** Fetch a single supplier by ID */
  getById: (id: string) => getDB().getSupplier(id),

  /** Insert a new supplier */
  add: (data: any) => getDB().addSupplier(data),

  /** Update supplier fields */
  update: (id: string, data: any) => getDB().updateSupplier(id, data),

  /** Delete a supplier (cascades to catalog, purchases, payments) */
  delete: (id: string) => getDB().deleteSupplier(id),

  /** Delete ALL suppliers (admin reset) */
  clearAll: () => getDB().clearSuppliers(),

  // ── Catalog sub-operations ──
  getCatalog: (supplierId: string) => getDB().getCatalogProducts(supplierId),
  addCatalogProduct: (data: any) => getDB().addCatalogProduct(data),
  removeCatalogProduct: (id: string) => getDB().removeCatalogProduct(id),

  // ── Purchase sub-operations ──
  getPurchases: (supplierId: string) => getDB().getPurchases(supplierId),
  addPurchase: (data: SupplierPurchase) => getDB().addPurchase(data),

  // ── Payment sub-operations ──
  getPayments: (supplierId: string) => getDB().getSupplierPayments(supplierId),
  addPayment: (data: SupplierPaymentRecord) => getDB().addSupplierPayment(data),
};

// ======================================================================
// INVOICES SERVICE — Invoice CRUD with products
// ======================================================================

export const invoicesDB = {
  /** Fetch all invoices with their product line items */
  getAll: (): Promise<Invoice[]> => getDB().getInvoices(),

  /** Fetch a single invoice by ID */
  getById: (id: string): Promise<Invoice | undefined> => getDB().getInvoice(id),

  /** Insert a new invoice with its products */
  add: (invoice: Invoice): Promise<Invoice> => getDB().addInvoice(invoice),

  /** Update invoice fields (e.g., payment status) */
  update: (id: string, data: Partial<Invoice>): Promise<void> => getDB().updateInvoice(id, data),

  /** Delete an invoice and return the deleted data (for stock restoration) */
  delete: (id: string): Promise<Invoice | undefined> => getDB().deleteInvoice(id),

  /** Delete ALL invoices (admin reset) */
  clearAll: (): Promise<void> => getDB().clearInvoices(),

  /** Get the current invoice counter value */
  getCounter: (): Promise<number> => getDB().getInvoiceCounter(),

  /** Set the invoice counter to a specific value */
  setCounter: (val: number): Promise<void> => getDB().setInvoiceCounter(val),
};

// ======================================================================
// EXPENSES SERVICE — Expense CRUD operations
// ======================================================================

export const expensesDB = {
  /** Fetch all expenses */
  getAll: (): Promise<Expense[]> => getDB().getExpenses(),

  /** Fetch a single expense by ID */
  getById: (id: string): Promise<Expense | undefined> => getDB().getExpense(id),

  /** Insert a new expense */
  add: (expense: Expense): Promise<Expense> => getDB().addExpense(expense),

  /** Update expense fields */
  update: (id: string, data: Partial<Expense>): Promise<void> => getDB().updateExpense(id, data),

  /** Delete an expense */
  delete: (id: string): Promise<void> => getDB().deleteExpense(id),

  /** Delete ALL expenses (admin reset) */
  clearAll: (): Promise<void> => getDB().clearExpenses(),
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
