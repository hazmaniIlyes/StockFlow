// src/types/database.d.ts — TypeScript type declarations for the window.database API
// This file tells TypeScript about the window.database object that is created
// by the Electron preload script. It provides full type safety for all database calls.
// When running in the browser (non-Electron), window.database will be undefined,
// so the database service layer checks for this and falls back gracefully.

import type { Client, Expense, Invoice, Supplier, StockBatch, SupplierProduct,
  InventoryProduct, SupplierPurchase, SupplierPaymentRecord } from 'src/_mock/_data';

// ======================================================================

/** Shape of the database API exposed on window.database by the Electron preload script */
interface DatabaseAPI {

  // ── Products ─────────────────────────────────────────────────────────
  getProducts: () => Promise<InventoryProduct[]>;                          // Fetch all products from SQLite
  getProduct: (id: string) => Promise<InventoryProduct | undefined>;      // Fetch one product by ID
  getProductByName: (name: string) => Promise<InventoryProduct | undefined>; // Fetch by name (case-insensitive)
  addProduct: (data: InventoryProduct) => Promise<InventoryProduct>;      // Insert a product
  updateProduct: (id: string, data: Partial<InventoryProduct>) => Promise<void>; // Update product fields
  deleteProduct: (id: string) => Promise<void>;                           // Delete a product
  clearProducts: () => Promise<void>;                                     // Delete all products
  resetAllStock: () => Promise<void>;                                     // Set all stock to 0

  // ── Stock Batches ────────────────────────────────────────────────────
  getBatches: (productId: string) => Promise<(StockBatch & { productId: string })[]>; // Get batches for a product
  addBatch: (data: StockBatch & { productId: string }) => Promise<StockBatch & { productId: string }>; // Add a batch
  updateBatch: (id: string, data: Partial<StockBatch>) => Promise<void>;  // Update batch quantity
  deleteBatch: (id: string) => Promise<void>;                             // Delete a batch
  clearBatches: (productId: string) => Promise<void>;                     // Clear all batches for a product

  // ── Clients ──────────────────────────────────────────────────────────
  getClients: () => Promise<Client[]>;                                    // Fetch all clients
  getClient: (id: string) => Promise<Client | undefined>;                // Fetch one client
  getClientByName: (name: string) => Promise<Client | undefined>;        // Fetch by name
  addClient: (data: Client) => Promise<Client>;                          // Insert a client
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;    // Update client fields
  deleteClient: (id: string) => Promise<void>;                           // Delete a client
  clearClients: () => Promise<void>;                                     // Delete all clients

  // ── Suppliers ────────────────────────────────────────────────────────
  getSuppliers: () => Promise<Omit<Supplier, 'catalog' | 'purchases' | 'payments'>[]>; // Fetch all suppliers (flat)
  getSupplier: (id: string) => Promise<Omit<Supplier, 'catalog' | 'purchases' | 'payments'> | undefined>;
  addSupplier: (data: any) => Promise<any>;                               // Insert a supplier
  updateSupplier: (id: string, data: Partial<Supplier>) => Promise<void>; // Update supplier fields
  deleteSupplier: (id: string) => Promise<void>;                         // Delete a supplier
  clearSuppliers: () => Promise<void>;                                   // Delete all suppliers

  // ── Supplier Catalog ─────────────────────────────────────────────────
  getCatalogProducts: (supplierId: string) => Promise<SupplierProduct[]>; // Get catalog for a supplier
  addCatalogProduct: (data: SupplierProduct & { supplierId: string }) => Promise<any>; // Add to catalog
  removeCatalogProduct: (id: string) => Promise<void>;                   // Remove from catalog

  // ── Supplier Purchases ───────────────────────────────────────────────
  getPurchases: (supplierId: string) => Promise<SupplierPurchase[]>;      // Get purchases for a supplier
  addPurchase: (data: SupplierPurchase) => Promise<SupplierPurchase>;     // Record a purchase

  // ── Supplier Payments ────────────────────────────────────────────────
  getSupplierPayments: (supplierId: string) => Promise<SupplierPaymentRecord[]>; // Get payment history
  addSupplierPayment: (data: SupplierPaymentRecord) => Promise<SupplierPaymentRecord>; // Record a payment

  // ── Invoices ─────────────────────────────────────────────────────────
  getInvoices: () => Promise<Invoice[]>;                                  // Fetch all invoices with products
  getInvoice: (id: string) => Promise<Invoice | undefined>;              // Fetch one invoice
  addInvoice: (data: Invoice) => Promise<Invoice>;                       // Insert an invoice with products
  updateInvoice: (id: string, data: Partial<Invoice>) => Promise<void>;  // Update invoice fields
  deleteInvoice: (id: string) => Promise<Invoice | undefined>;           // Delete and return the invoice
  clearInvoices: () => Promise<void>;                                    // Delete all invoices
  getInvoiceCounter: () => Promise<number>;                              // Get current counter
  setInvoiceCounter: (val: number) => Promise<void>;                     // Set/reset counter

  // ── Expenses ─────────────────────────────────────────────────────────
  getExpenses: () => Promise<Expense[]>;                                  // Fetch all expenses
  getExpense: (id: string) => Promise<Expense | undefined>;              // Fetch one expense
  addExpense: (data: Expense) => Promise<Expense>;                       // Insert an expense
  updateExpense: (id: string, data: Partial<Expense>) => Promise<void>;  // Update expense fields
  deleteExpense: (id: string) => Promise<void>;                          // Delete an expense
  clearExpenses: () => Promise<void>;                                    // Delete all expenses

  // ── TVA Declarations ─────────────────────────────────────────────────
  getTvaDeclarations: () => Promise<{ id: string; period: string; amount: number; dateDeclared: string }[]>;
  addTvaDeclaration: (data: { id: string; period: string; amount: number; dateDeclared: string }) => Promise<any>;
  clearTvaDeclarations: () => Promise<void>;

  // ── Settings ─────────────────────────────────────────────────────────
  getSetting: (key: string) => Promise<string | null>;                   // Get a setting value
  setSetting: (key: string, value: string) => Promise<void>;            // Set a setting value
  getAllSettings: () => Promise<Record<string, string>>;                  // Get all settings
  // ── Action Items ─────────────────────────────────────────────────────
  getActionItems: () => Promise<{ id: string; title: string; completed: boolean }[]>;
  addActionItem: (data: { id: string; title: string; completed: boolean }) => Promise<void>;
  toggleActionItem: (id: string) => Promise<void>;
  deleteActionItem: (id: string) => Promise<void>;
}

/** Shell/OS actions exposed on window.appShell by the Electron preload script */
interface AppShellAPI {
  openLogsFolder: () => Promise<void>;
}

/** Logger API exposed on window.appLog by the Electron preload script */
interface AppLogAPI {
  error: (msg: string, ...args: unknown[]) => void;
  warn:  (msg: string, ...args: unknown[]) => void;
  info:  (msg: string, ...args: unknown[]) => void;
}

// Augment the global Window interface so TypeScript knows about window.database and window.appLog
declare global {
  interface Window {
    database?: DatabaseAPI; // Optional because it only exists in Electron, not in browser
    appLog?: AppLogAPI;     // Optional persistent logger — writes to AppData/Roaming/StockFlow/logs/main.log
    appShell?: AppShellAPI; // Optional OS actions (open folders, etc.)
  }
}

// This export makes this file a module (required for global augmentation)
export {};
