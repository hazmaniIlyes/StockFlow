// electron/preload.cjs — Preload script that bridges Electron's main process with the React renderer
// This script runs in a special context that has access to both Node.js and the DOM.
// It uses contextBridge to safely expose a 'database' API object to the renderer window.
// The renderer (React app) calls window.database.someMethod() which triggers ipcRenderer.invoke()
// which sends a message to the main process where the actual SQLite query happens.

const { contextBridge, ipcRenderer } = require('electron'); // Electron APIs for secure IPC bridging

// ======================================================================
// Expose a safe 'database' API to the renderer process via contextBridge
// Each method corresponds to an IPC channel registered in ipc-handlers.cjs
// All methods return Promises because ipcRenderer.invoke() is async
// ======================================================================

contextBridge.exposeInMainWorld('database', {

  // ── Products (Inventory) ─────────────────────────────────────────────
  // These methods map to the products table in SQLite

  getProducts: () => ipcRenderer.invoke('db:products:getAll'),                          // Fetch all products from the database
  getProduct: (id) => ipcRenderer.invoke('db:products:getById', id),                    // Fetch a single product by its ID
  getProductByName: (name) => ipcRenderer.invoke('db:products:getByName', name),        // Fetch a product by its name (case-insensitive)
  addProduct: (data) => ipcRenderer.invoke('db:products:add', data),                    // Insert a new product into the database
  updateProduct: (id, data) => ipcRenderer.invoke('db:products:update', id, data),      // Update an existing product by ID
  deleteProduct: (id) => ipcRenderer.invoke('db:products:delete', id),                  // Delete a product from the database by ID
  clearProducts: () => ipcRenderer.invoke('db:products:clearAll'),                      // Delete ALL products (used by admin reset)
  resetAllStock: () => ipcRenderer.invoke('db:products:resetAllStock'),                 // Set all product stock to 0 (used by stock reset)

  // ── Stock Batches ────────────────────────────────────────────────────
  // Batches support FIFO (First In, First Out) stock management
  
  getBatches: (productId) => ipcRenderer.invoke('db:batches:getByProduct', productId),  // Get all batches for a specific product
  addBatch: (data) => ipcRenderer.invoke('db:batches:add', data),                       // Insert a new stock batch
  updateBatch: (id, data) => ipcRenderer.invoke('db:batches:update', id, data),         // Update a batch (e.g., reduce quantity during FIFO deduction)
  deleteBatch: (id) => ipcRenderer.invoke('db:batches:delete', id),                     // Delete a batch (when its quantity reaches 0)
  clearBatches: (productId) => ipcRenderer.invoke('db:batches:clearByProduct', productId), // Delete all batches for a product

  // ── Clients ──────────────────────────────────────────────────────────

  getClients: () => ipcRenderer.invoke('db:clients:getAll'),                            // Fetch all clients from the database
  getClient: (id) => ipcRenderer.invoke('db:clients:getById', id),                      // Fetch a single client by ID
  getClientByName: (name) => ipcRenderer.invoke('db:clients:getByName', name),          // Fetch a client by name (case-insensitive)
  addClient: (data) => ipcRenderer.invoke('db:clients:add', data),                      // Insert a new client
  updateClient: (id, data) => ipcRenderer.invoke('db:clients:update', id, data),        // Update client data by ID
  deleteClient: (id) => ipcRenderer.invoke('db:clients:delete', id),                    // Delete a client by ID
  clearClients: () => ipcRenderer.invoke('db:clients:clearAll'),                        // Delete ALL clients (admin reset)

  // ── Suppliers ────────────────────────────────────────────────────────

  getSuppliers: () => ipcRenderer.invoke('db:suppliers:getAll'),                        // Fetch all suppliers with their catalogs
  getSupplier: (id) => ipcRenderer.invoke('db:suppliers:getById', id),                  // Fetch a single supplier by ID
  addSupplier: (data) => ipcRenderer.invoke('db:suppliers:add', data),                  // Insert a new supplier
  updateSupplier: (id, data) => ipcRenderer.invoke('db:suppliers:update', id, data),    // Update supplier data by ID
  deleteSupplier: (id) => ipcRenderer.invoke('db:suppliers:delete', id),                // Delete a supplier by ID
  clearSuppliers: () => ipcRenderer.invoke('db:suppliers:clearAll'),                    // Delete ALL suppliers (admin reset)

  // ── Supplier Catalog Products ────────────────────────────────────────

  getCatalogProducts: (supplierId) => ipcRenderer.invoke('db:catalog:getBySupplierId', supplierId), // Get catalog for a supplier
  addCatalogProduct: (data) => ipcRenderer.invoke('db:catalog:add', data),              // Add a product to supplier's catalog
  removeCatalogProduct: (id) => ipcRenderer.invoke('db:catalog:delete', id),            // Remove a product from supplier's catalog

  // ── Supplier Purchases ───────────────────────────────────────────────

  getPurchases: (supplierId) => ipcRenderer.invoke('db:purchases:getBySupplierId', supplierId), // Get purchases for a supplier
  addPurchase: (data) => ipcRenderer.invoke('db:purchases:add', data),                  // Record a new purchase from a supplier

  // ── Supplier Payments ────────────────────────────────────────────────

  getSupplierPayments: (supplierId) => ipcRenderer.invoke('db:supplierPayments:getBySupplierId', supplierId), // Get payments to a supplier
  addSupplierPayment: (data) => ipcRenderer.invoke('db:supplierPayments:add', data),    // Record a payment to a supplier

  // ── Invoices ─────────────────────────────────────────────────────────

  getInvoices: () => ipcRenderer.invoke('db:invoices:getAll'),                          // Fetch all invoices with their products
  getInvoice: (id) => ipcRenderer.invoke('db:invoices:getById', id),                    // Fetch a single invoice by ID
  addInvoice: (data) => ipcRenderer.invoke('db:invoices:add', data),                    // Insert a new invoice with its products
  updateInvoice: (id, data) => ipcRenderer.invoke('db:invoices:update', id, data),      // Update invoice data (payment, status, etc.)
  deleteInvoice: (id) => ipcRenderer.invoke('db:invoices:delete', id),                  // Delete an invoice and its products
  clearInvoices: () => ipcRenderer.invoke('db:invoices:clearAll'),                      // Delete ALL invoices (admin reset)
  getInvoiceCounter: () => ipcRenderer.invoke('db:invoices:getCounter'),                // Get the current invoice counter value
  setInvoiceCounter: (val) => ipcRenderer.invoke('db:invoices:setCounter', val),        // Set/reset the invoice counter

  // ── Expenses ─────────────────────────────────────────────────────────

  getExpenses: () => ipcRenderer.invoke('db:expenses:getAll'),                          // Fetch all expenses
  getExpense: (id) => ipcRenderer.invoke('db:expenses:getById', id),                    // Fetch a single expense by ID
  addExpense: (data) => ipcRenderer.invoke('db:expenses:add', data),                    // Insert a new expense
  updateExpense: (id, data) => ipcRenderer.invoke('db:expenses:update', id, data),      // Update an expense by ID
  deleteExpense: (id) => ipcRenderer.invoke('db:expenses:delete', id),                  // Delete an expense by ID
  clearExpenses: () => ipcRenderer.invoke('db:expenses:clearAll'),                      // Delete ALL expenses (admin reset)

  // ── TVA Declarations ─────────────────────────────────────────────────

  getTvaDeclarations: () => ipcRenderer.invoke('db:tva:getAll'),                        // Fetch all TVA declaration records
  addTvaDeclaration: (data) => ipcRenderer.invoke('db:tva:add', data),                  // Record a new TVA declaration
  clearTvaDeclarations: () => ipcRenderer.invoke('db:tva:clearAll'),                    // Delete ALL TVA declarations

  // ── Settings (Key-Value Store) ───────────────────────────────────────

  getSetting: (key) => ipcRenderer.invoke('db:settings:get', key),                      // Get a setting value by key
  setSetting: (key, value) => ipcRenderer.invoke('db:settings:set', key, value),        // Set a setting value by key
  getAllSettings: () => ipcRenderer.invoke('db:settings:getAll'),                        // Get all settings as an object

  // ── Action Items (Dashboard Notes) ───────────────────────────────────

  getActionItems: () => ipcRenderer.invoke('db:actionItems:getAll'),
  addActionItem: (data) => ipcRenderer.invoke('db:actionItems:add', data),
  toggleActionItem: (id) => ipcRenderer.invoke('db:actionItems:toggle', id),
  deleteActionItem: (id) => ipcRenderer.invoke('db:actionItems:delete', id),

  // ── Printing ─────────────────────────────────────────────────────────

  printHtml: (html) => ipcRenderer.invoke('print-html', html),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printHtmlSilent: (html, printerName) => ipcRenderer.invoke('print-html-silent', html, printerName),
  savePdf: (html, name) => ipcRenderer.invoke('save-pdf', html, name),

  // ── Disk space ─────────────────────────────────────────────────
  checkDiskSpace: () => ipcRenderer.invoke('check-disk-space'),
  onDiskWarning:  (cb) => ipcRenderer.on('disk:warning', (_e, data) => cb(data)),
  offDiskWarning: (cb) => ipcRenderer.removeListener('disk:warning', cb),

});

// ======================================================================
// Expose a safe 'appLog' API so the React renderer can write to the
// persistent electron-log file (visible in production builds).
// Usage: window.appLog?.error('Something failed', err)
// ======================================================================

contextBridge.exposeInMainWorld('appLog', {
  error: (msg, ...args) => ipcRenderer.send('log:error', msg, ...args),
  warn:  (msg, ...args) => ipcRenderer.send('log:warn',  msg, ...args),
  info:  (msg, ...args) => ipcRenderer.send('log:info',  msg, ...args),
});

// ======================================================================
// Expose 'appShell' — OS-level actions like opening the logs folder
// ======================================================================

contextBridge.exposeInMainWorld('appShell', {
  openLogsFolder: () => ipcRenderer.invoke('app:openLogsFolder'),
  getHardwareId: () => ipcRenderer.invoke('app:getHardwareId'),           // Returns deterministic XXXX-XXXX-XXXX-XXXX hardware fingerprint
  verifyActivation: (hardwareId, code) => ipcRenderer.invoke('app:verifyActivation', hardwareId, code), // Verify code + save activation file
  checkActivation: () => ipcRenderer.invoke('app:checkActivation'),       // Check if activation file exists and HWID matches
  resetActivation: () => ipcRenderer.invoke('app:resetActivation'),       // Delete activation file (settings reset)
});
