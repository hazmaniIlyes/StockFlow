// electron/database/ipc-handlers.cjs — All IPC handlers for SQLite CRUD operations
// This file registers handlers on the Electron main process that respond to
// ipcRenderer.invoke() calls from the preload script. Each handler executes
// a SQLite query using better-sqlite3's synchronous API.

// ======================================================================

/**
 * registerAllHandlers() — Registers all IPC handlers for database operations.
 * Called once from main.cjs when the app starts.
 * @param {Electron.IpcMain} ipcMain - Electron's IPC main module
 * @param {import('better-sqlite3').Database} db - The better-sqlite3 database instance
 */
function registerAllHandlers(ipcMain, db) {

  // ====================================================================
  // PRODUCTS (Inventory)
  // ====================================================================

  // GET ALL — Returns every product row from the products table
  ipcMain.handle('db:products:getAll', () => {
    const stmt = db.prepare('SELECT * FROM products ORDER BY rowid DESC'); // ORDER BY rowid DESC so newest products appear first
    return stmt.all(); // .all() returns an array of row objects
  });

  // GET BY ID — Returns a single product matching the given ID
  ipcMain.handle('db:products:getById', (_event, id) => {
    const stmt = db.prepare('SELECT * FROM products WHERE id = ?'); // Parameterized query prevents SQL injection
    return stmt.get(id); // .get() returns one row or undefined
  });

  // GET BY NAME — Case-insensitive product name lookup (used when creating invoices)
  ipcMain.handle('db:products:getByName', (_event, name) => {
    const stmt = db.prepare('SELECT * FROM products WHERE LOWER(name) = LOWER(?)'); // LOWER() for case-insensitive comparison
    return stmt.get(name); // Returns first matching product or undefined
  });

  // ADD — Inserts a new product and returns the complete inserted row
  ipcMain.handle('db:products:add', (_event, data) => {
    // Guard: reject duplicate non-empty SKUs before attempting the INSERT.
    // The UI should have already blocked this, but this is a second line of defense.
    if (data.sku && data.sku.trim() !== '') {
      const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(data.sku.trim());
      if (existing) {
        throw new Error(`SKU_DUPLICATE:${data.sku.trim()}`); // Structured error so the UI can show a friendly message
      }
    }

    const stmt = db.prepare(`
      INSERT INTO products (id, sku, name, category, supplierId, supplierName, buyingPrice, sellPrice, retailPrice, stock, minStock, unit, expiryDate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `); // 14 columns — retailPrice is nullable (NULL when not set)
    stmt.run(
      data.id,           // Pre-generated ID from the context layer
      data.sku,          // SKU code
      data.name,         // Product name
      data.category,     // Category label
      data.supplierId,   // Supplier reference
      data.supplierName, // Denormalized supplier name
      data.buyingPrice,  // Cost price
      data.sellPrice,    // Selling price (wholesale / default)
      data.retailPrice ?? null, // Retail price — NULL if not set (falls back to sellPrice in the UI)
      data.stock,        // Initial stock quantity
      data.minStock,     // Minimum stock threshold
      data.unit,         // Unit of measurement
      data.expiryDate || null, // Nullable expiry date
      data.status        // Computed status string
    );
    return data; // Return the inserted data so the context can use it immediately
  });

  // UPDATE — Updates only the fields provided in the data object
  ipcMain.handle('db:products:update', (_event, id, data) => {
    // Build a dynamic UPDATE statement based on which fields are provided
    const fields = Object.keys(data);        // Get the field names that need updating
    if (fields.length === 0) return;          // Nothing to update — skip the query
    const setClause = fields.map(f => `${f} = ?`).join(', '); // Build "field1 = ?, field2 = ?" string
    const values = fields.map(f => data[f]);  // Extract the corresponding values in the same order
    const stmt = db.prepare(`UPDATE products SET ${setClause} WHERE id = ?`); // Dynamic SQL with parameterized values
    stmt.run(...values, id);                  // Spread values + append the ID for the WHERE clause
  });

  // DELETE — Removes a product by ID (CASCADE will also delete its batches)
  ipcMain.handle('db:products:delete', (_event, id) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?'); // CASCADE in schema handles batch cleanup
    stmt.run(id);
  });

  // CLEAR ALL — Deletes every product from the table (admin reset feature)
  ipcMain.handle('db:products:clearAll', () => {
    db.exec('DELETE FROM products');          // Remove all rows from the products table
    db.exec('DELETE FROM stock_batches');     // Also clear all batches since they reference products
  });

  // RESET ALL STOCK — Sets stock to 0 for every product without deleting them
  ipcMain.handle('db:products:resetAllStock', () => {
    db.exec("UPDATE products SET stock = 0, status = 'out-of-stock'"); // Set all products to zero stock
    db.exec('DELETE FROM stock_batches');     // Clear all FIFO batches since stock is now 0
  });

  // ====================================================================
  // STOCK BATCHES (FIFO support)
  // ====================================================================

  // GET BATCHES BY PRODUCT — Returns all batches for a product, oldest first (FIFO order)
  ipcMain.handle('db:batches:getByProduct', (_event, productId) => {
    const stmt = db.prepare('SELECT * FROM stock_batches WHERE productId = ? ORDER BY purchaseDate ASC'); // ASC = oldest first for FIFO
    return stmt.all(productId);
  });

  // ADD BATCH — Inserts a new stock batch for a product
  ipcMain.handle('db:batches:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO stock_batches (id, productId, buyingPrice, sellPrice, quantity, purchaseDate)
      VALUES (?, ?, ?, ?, ?, ?)
    `); // INSERT OR IGNORE: silently skips if a batch with the same id already exists (e.g. init-batch on re-launch)
    stmt.run(data.id, data.productId, data.buyingPrice, data.sellPrice, data.quantity, data.purchaseDate);
    return data;
  });

  // UPDATE BATCH — Updates batch fields (typically quantity during FIFO deduction)
  ipcMain.handle('db:batches:update', (_event, id, data) => {
    const fields = Object.keys(data);
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f]);
    const stmt = db.prepare(`UPDATE stock_batches SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
  });

  // DELETE BATCH — Removes a single batch (when quantity reaches 0)
  ipcMain.handle('db:batches:delete', (_event, id) => {
    const stmt = db.prepare('DELETE FROM stock_batches WHERE id = ?');
    stmt.run(id);
  });

  // CLEAR BATCHES BY PRODUCT — Removes all batches for a specific product
  ipcMain.handle('db:batches:clearByProduct', (_event, productId) => {
    const stmt = db.prepare('DELETE FROM stock_batches WHERE productId = ?');
    stmt.run(productId);
  });

  // ====================================================================
  // CLIENTS
  // ====================================================================

  // GET ALL — Returns all clients ordered by most recently added first
  ipcMain.handle('db:clients:getAll', () => {
    const stmt = db.prepare('SELECT * FROM clients ORDER BY rowid DESC'); // Newest clients first
    return stmt.all();
  });

  // GET BY ID — Returns a single client by ID
  ipcMain.handle('db:clients:getById', (_event, id) => {
    const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
    return stmt.get(id);
  });

  // GET BY NAME — Case-insensitive client name lookup (used during invoice creation)
  ipcMain.handle('db:clients:getByName', (_event, name) => {
    const stmt = db.prepare('SELECT * FROM clients WHERE LOWER(name) = LOWER(?)');
    return stmt.get(name);
  });

  // ADD — Inserts a new client row
  ipcMain.handle('db:clients:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO clients (id, name, phone, address, nif, nis, rc, ai, totalPurchases, totalPaid, remainingBalance, lastInvoiceDate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `); // All client fields including financial summary
    stmt.run(
      data.id, data.name, data.phone, data.address,
      data.nif || null, data.nis || null, data.rc || null, data.ai || null, // Nullable tax fields
      data.totalPurchases, data.totalPaid, data.remainingBalance,
      data.lastInvoiceDate, data.status
    );
    return data;
  });

  // UPDATE — Updates specific client fields
  ipcMain.handle('db:clients:update', (_event, id, data) => {
    const fields = Object.keys(data);
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f]);
    const stmt = db.prepare(`UPDATE clients SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
  });

  // DELETE — Removes a client by ID
  ipcMain.handle('db:clients:delete', (_event, id) => {
    const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
    stmt.run(id);
  });

  // CLEAR ALL — Deletes all clients (admin reset)
  ipcMain.handle('db:clients:clearAll', () => {
    db.exec('DELETE FROM clients');
  });

  // ====================================================================
  // SUPPLIERS
  // ====================================================================

  // GET ALL — Returns all suppliers (catalog, purchases, and payments are loaded separately)
  ipcMain.handle('db:suppliers:getAll', () => {
    const stmt = db.prepare('SELECT * FROM suppliers ORDER BY rowid DESC');
    return stmt.all();
  });

  // GET BY ID
  ipcMain.handle('db:suppliers:getById', (_event, id) => {
    const stmt = db.prepare('SELECT * FROM suppliers WHERE id = ?');
    return stmt.get(id);
  });

  // ADD — Inserts a new supplier
  ipcMain.handle('db:suppliers:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO suppliers (id, name, phone, address, email, nif, nis, rc, ai, totalPurchased, totalPaid, totalOwed, debtDueDate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      data.id, data.name, data.phone, data.address, data.email,
      data.nif || null, data.nis || null, data.rc || null, data.ai || null,
      data.totalPurchased, data.totalPaid, data.totalOwed,
      data.debtDueDate || null, data.status
    );
    return data;
  });

  // UPDATE
  ipcMain.handle('db:suppliers:update', (_event, id, data) => {
    const fields = Object.keys(data);
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f]);
    const stmt = db.prepare(`UPDATE suppliers SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
  });

  // DELETE — Removes supplier and cascades to catalog, purchases, payments
  ipcMain.handle('db:suppliers:delete', (_event, id) => {
    const stmt = db.prepare('DELETE FROM suppliers WHERE id = ?'); // CASCADE handles cleanup of related tables
    stmt.run(id);
  });

  // CLEAR ALL
  ipcMain.handle('db:suppliers:clearAll', () => {
    db.exec('DELETE FROM suppliers');           // CASCADE deletes related catalog, purchases, payments
    db.exec('DELETE FROM supplier_catalog');    // Explicit cleanup for safety
    db.exec('DELETE FROM supplier_purchases');
    db.exec('DELETE FROM supplier_payments');
  });

  // ====================================================================
  // SUPPLIER CATALOG
  // ====================================================================

  // GET BY SUPPLIER ID — Returns all catalog products for a specific supplier
  ipcMain.handle('db:catalog:getBySupplierId', (_event, supplierId) => {
    const stmt = db.prepare('SELECT * FROM supplier_catalog WHERE supplierId = ?');
    return stmt.all(supplierId);
  });

  // ADD — Inserts a product into a supplier's catalog
  ipcMain.handle('db:catalog:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO supplier_catalog (id, supplierId, name, buyingPrice, category, purchaseDate, expiryDate, unit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(data.id, data.supplierId, data.name, data.buyingPrice, data.category,
      data.purchaseDate, data.expiryDate || null, data.unit || 'pcs');
    return data;
  });

  // DELETE — Removes a product from a supplier's catalog
  ipcMain.handle('db:catalog:delete', (_event, id) => {
    const stmt = db.prepare('DELETE FROM supplier_catalog WHERE id = ?');
    stmt.run(id);
  });

  // ====================================================================
  // SUPPLIER PURCHASES
  // ====================================================================

  // GET BY SUPPLIER ID — Returns all purchases for a supplier, newest first
  ipcMain.handle('db:purchases:getBySupplierId', (_event, supplierId) => {
    const stmt = db.prepare('SELECT * FROM supplier_purchases WHERE supplierId = ? ORDER BY date DESC');
    const rows = stmt.all(supplierId);
    // Parse the JSON items column — guard against corrupt/null rows so one bad record doesn't crash the page
    return rows.map(row => {
      let items = [];
      try { items = JSON.parse(row.items); } catch {}
      return { ...row, items };
    });
  });

  // ADD — Records a new purchase from a supplier
  ipcMain.handle('db:purchases:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO supplier_purchases (id, supplierId, date, items, total, amountPaid, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(data.id, data.supplierId, data.date,
      JSON.stringify(data.items), // Store items array as JSON string in the database
      data.total, data.amountPaid, data.status);
    return data;
  });

  // ====================================================================
  // SUPPLIER PAYMENTS
  // ====================================================================

  // GET BY SUPPLIER ID — Returns payment history for a supplier
  ipcMain.handle('db:supplierPayments:getBySupplierId', (_event, supplierId) => {
    const stmt = db.prepare('SELECT * FROM supplier_payments WHERE supplierId = ? ORDER BY date DESC');
    return stmt.all(supplierId);
  });

  // ADD — Records a payment made to a supplier
  ipcMain.handle('db:supplierPayments:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO supplier_payments (id, supplierId, date, amount, note)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(data.id, data.supplierId, data.date, data.amount, data.note);
    return data;
  });

  // ====================================================================
  // INVOICES
  // ====================================================================

  // GET ALL — Returns all invoices with their line items (products)
  ipcMain.handle('db:invoices:getAll', () => {
    const invoiceStmt = db.prepare('SELECT * FROM invoices ORDER BY rowid DESC'); // Newest invoices first
    const productStmt = db.prepare('SELECT * FROM invoice_products WHERE invoiceId = ?');
    const invoices = invoiceStmt.all();
    // For each invoice, attach its products array (reconstructing the original Invoice type)
    return invoices.map(inv => ({
      ...inv,
      client: {
        name: inv.clientName,       // Reconstruct the client object from flat columns
        phone: inv.clientPhone,
        address: inv.clientAddress,
        nif: inv.clientNif,
        nis: inv.clientNis,
        rc: inv.clientRc,
        ai: inv.clientAi,
      },
      products: productStmt.all(inv.id), // Attach line items from the invoice_products table
    }));
  });

  // GET BY ID — Returns a single invoice with its products
  ipcMain.handle('db:invoices:getById', (_event, id) => {
    const invStmt = db.prepare('SELECT * FROM invoices WHERE id = ?');
    const prodStmt = db.prepare('SELECT * FROM invoice_products WHERE invoiceId = ?');
    const inv = invStmt.get(id);
    if (!inv) return undefined; // Invoice not found
    return {
      ...inv,
      client: {
        name: inv.clientName,
        phone: inv.clientPhone,
        address: inv.clientAddress,
        nif: inv.clientNif,
        nis: inv.clientNis,
        rc: inv.clientRc,
        ai: inv.clientAi,
      },
      products: prodStmt.all(inv.id),
    };
  });

  // ADD — Inserts a new invoice and its product line items (wrapped in a transaction)
  ipcMain.handle('db:invoices:add', (_event, data) => {
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (id, invoiceNumber, type, clientName, clientPhone, clientAddress, clientNif, clientNis, clientRc, clientAi,
        subtotal, tvaRate, tvaAmount, total, amountPaid, amountDue, status, createdAt, dueDate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertProduct = db.prepare(`
      INSERT INTO invoice_products (id, invoiceId, name, quantity, unitPrice, total, unit, buyingPrice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Use a transaction to ensure both invoice and products are inserted atomically
    const insertTransaction = db.transaction((invoiceData) => {
      insertInvoice.run(
        invoiceData.id, invoiceData.invoiceNumber,
        invoiceData.type || 'wholesale',
        invoiceData.client.name, invoiceData.client.phone, invoiceData.client.address,
        invoiceData.client.nif || null, invoiceData.client.nis || null,
        invoiceData.client.rc || null, invoiceData.client.ai || null,
        invoiceData.subtotal, invoiceData.tvaRate, invoiceData.tvaAmount,
        invoiceData.total, invoiceData.amountPaid, invoiceData.amountDue,
        invoiceData.status, invoiceData.createdAt, invoiceData.dueDate
      );
      // Insert each product line item — buyingPrice is a snapshot at time of sale
      invoiceData.products.forEach(p => {
        insertProduct.run(p.id, invoiceData.id, p.name, p.quantity, p.unitPrice, p.total, p.unit || null, p.buyingPrice ?? 0);
      });
    });

    insertTransaction(data); // Execute the transaction
    return data;
  });

  // UPDATE — Updates invoice fields and replaces product line items if provided
  ipcMain.handle('db:invoices:update', (_event, id, data) => {
    // Capture the products array BEFORE flattening/deleting — it may be undefined
    // for payment-only updates (recordPayment, markAsPaid) which never pass products
    const updatedProducts = data.products;

    // Handle client object flattening if present
    const flatData = { ...data };           // Copy to avoid mutating the original
    if (flatData.client) {
      flatData.clientName    = flatData.client.name;
      flatData.clientPhone   = flatData.client.phone;
      flatData.clientAddress = flatData.client.address;
      flatData.clientNif     = flatData.client.nif;
      flatData.clientNis     = flatData.client.nis;
      flatData.clientRc      = flatData.client.rc;
      flatData.clientAi      = flatData.client.ai;
      delete flatData.client;               // Remove the nested object since we flattened it
    }
    delete flatData.products;               // Products are handled separately below via invoice_products

    const fields = Object.keys(flatData);
    if (fields.length === 0 && !updatedProducts) return; // Nothing to do — skip entirely

    // Whitelist of valid invoice columns — guards against unknown fields crashing the UPDATE
    // (e.g. if caller passes a field that doesn't exist yet on older DB schemas)
    const ALLOWED_INVOICE_FIELDS = new Set([
      'invoiceNumber', 'type', 'clientName', 'clientPhone', 'clientAddress',
      'clientNif', 'clientNis', 'clientRc', 'clientAi',
      'subtotal', 'tvaRate', 'tvaAmount', 'total',
      'amountPaid', 'amountDue', 'status', 'createdAt', 'dueDate',
    ]);
    const safeFields = fields.filter(f => ALLOWED_INVOICE_FIELDS.has(f));

    // Prepare all statements once outside the transaction for efficiency
    const updateInvoiceStmt = safeFields.length > 0
      ? db.prepare(`UPDATE invoices SET ${safeFields.map(f => `${f} = ?`).join(', ')} WHERE id = ?`)
      : null;

    const deleteProductsStmt = db.prepare('DELETE FROM invoice_products WHERE invoiceId = ?');
    const insertProductStmt  = db.prepare(`
      INSERT INTO invoice_products (id, invoiceId, name, quantity, unitPrice, total, unit, buyingPrice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Wrap the invoice row update + line-item replacement in a single atomic transaction
    const updateTransaction = db.transaction(() => {
      // 1. Update the scalar invoice fields (amounts, status, client info, etc.)
      if (updateInvoiceStmt) {
        const values = safeFields.map(f => flatData[f]);
        updateInvoiceStmt.run(...values, id);
      }

      // 2. Replace product line items only when a products array was provided
      //    (payment-only calls omit products entirely so this block is skipped)
      if (updatedProducts) {
        deleteProductsStmt.run(id);         // Remove all existing line items for this invoice
        updatedProducts.forEach(p => {
          insertProductStmt.run(            // Re-insert each updated product row — buyingPrice snapshot preserved
            p.id, id, p.name, p.quantity, p.unitPrice, p.total, p.unit || null, p.buyingPrice ?? 0
          );
        });
      }
    });

    updateTransaction();                    // Execute all three steps atomically
  });

  // DELETE — Removes an invoice and returns the deleted data (for stock restoration)
  ipcMain.handle('db:invoices:delete', (_event, id) => {
    // First get the invoice data before deleting (needed for stock restoration)
    const getStmt = db.prepare('SELECT * FROM invoices WHERE id = ?');
    const prodStmt = db.prepare('SELECT * FROM invoice_products WHERE invoiceId = ?');
    const inv = getStmt.get(id);
    let result = undefined;
    if (inv) {
      result = {
        ...inv,
        client: { name: inv.clientName, phone: inv.clientPhone, address: inv.clientAddress },
        products: prodStmt.all(inv.id),
      };
    }
    const deleteStmt = db.prepare('DELETE FROM invoices WHERE id = ?'); // CASCADE deletes invoice_products
    deleteStmt.run(id);
    return result; // Return the deleted invoice so the context can restore stock
  });

  // CLEAR ALL — Deletes all invoices (admin reset)
  ipcMain.handle('db:invoices:clearAll', () => {
    db.exec('DELETE FROM invoices');
    db.exec('DELETE FROM invoice_products');
  });

  // GET COUNTER — Returns the current invoice counter value
  ipcMain.handle('db:invoices:getCounter', () => {
    const stmt = db.prepare("SELECT value FROM settings WHERE key = 'invoice_counter'");
    const row = stmt.get();
    return row ? parseInt(row.value, 10) : 1; // Parse as integer, default to 1
  });

  // SET COUNTER — Updates the invoice counter (used when creating invoices and resetting)
  ipcMain.handle('db:invoices:setCounter', (_event, val) => {
    const stmt = db.prepare("UPDATE settings SET value = ? WHERE key = 'invoice_counter'");
    stmt.run(String(val)); // Store as string in the settings key-value store
  });

  // ====================================================================
  // EXPENSES
  // ====================================================================

  // GET ALL — Returns all expenses, newest first
  ipcMain.handle('db:expenses:getAll', () => {
    const stmt = db.prepare('SELECT * FROM expenses ORDER BY rowid DESC');
    return stmt.all();
  });

  // GET BY ID
  ipcMain.handle('db:expenses:getById', (_event, id) => {
    const stmt = db.prepare('SELECT * FROM expenses WHERE id = ?');
    return stmt.get(id);
  });

  // ADD — Inserts a new expense
  ipcMain.handle('db:expenses:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO expenses (id, description, category, amount, date, recurring, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(data.id, data.description, data.category, data.amount, data.date, data.recurring, data.note);
    return data;
  });

  // UPDATE
  ipcMain.handle('db:expenses:update', (_event, id, data) => {
    const fields = Object.keys(data);
    if (fields.length === 0) return;
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => data[f]);
    const stmt = db.prepare(`UPDATE expenses SET ${setClause} WHERE id = ?`);
    stmt.run(...values, id);
  });

  // DELETE
  ipcMain.handle('db:expenses:delete', (_event, id) => {
    const stmt = db.prepare('DELETE FROM expenses WHERE id = ?');
    stmt.run(id);
  });

  // CLEAR ALL
  ipcMain.handle('db:expenses:clearAll', () => {
    db.exec('DELETE FROM expenses');
  });

  // ====================================================================
  // TVA DECLARATIONS
  // ====================================================================

  // GET ALL — Returns all TVA declarations, newest first
  ipcMain.handle('db:tva:getAll', () => {
    const stmt = db.prepare('SELECT * FROM tva_declarations ORDER BY rowid DESC');
    return stmt.all();
  });

  // ADD — Records a new TVA declaration
  ipcMain.handle('db:tva:add', (_event, data) => {
    const stmt = db.prepare(`
      INSERT INTO tva_declarations (id, period, amount, dateDeclared)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(data.id, data.period, data.amount, data.dateDeclared);
    return data;
  });

  // CLEAR ALL — Deletes all TVA declarations
  ipcMain.handle('db:tva:clearAll', () => {
    db.exec('DELETE FROM tva_declarations');
  });

  // ====================================================================
  // SETTINGS (Key-Value Store)
  // ====================================================================

  // GET — Returns the value for a specific setting key
  ipcMain.handle('db:settings:get', (_event, key) => {
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const row = stmt.get(key);
    return row ? row.value : null; // Return null if the key doesn't exist
  });

  // SET — Inserts or updates a setting (upsert pattern)
  ipcMain.handle('db:settings:set', (_event, key, value) => {
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)'); // Upsert: insert or replace
    stmt.run(key, value);
  });

  // GET ALL — Returns all settings as a key-value object
  ipcMain.handle('db:settings:getAll', () => {
    const stmt = db.prepare('SELECT * FROM settings');
    const rows = stmt.all();
    const result = {};                      // Build a plain object from the rows
    rows.forEach(row => {
      result[row.key] = row.value;          // Map each row's key to its value
    });
    return result;
  });

  // ====================================================================
  // ACTION ITEMS (Dashboard Notes)
  // ====================================================================

  // GET ALL — Retrieves all action items
  ipcMain.handle('db:actionItems:getAll', () => {
    const stmt = db.prepare('SELECT * FROM action_items ORDER BY created_at ASC');
    const rows = stmt.all();
    return rows.map(r => ({ id: r.id, title: r.title, completed: Boolean(r.completed) }));
  });

  // ADD — Inserts a new action item
  ipcMain.handle('db:actionItems:add', (_event, data) => {
    const stmt = db.prepare('INSERT INTO action_items (id, title, completed) VALUES (?, ?, ?)');
    stmt.run(data.id, data.title, data.completed ? 1 : 0);
  });

  // TOGGLE — Inverts completed status directly within SQLite using Boolean arithmetic
  ipcMain.handle('db:actionItems:toggle', (_event, id) => {
    const stmt = db.prepare('UPDATE action_items SET completed = NOT completed WHERE id = ?');
    stmt.run(id);
  });

  // DELETE — Removes an action item
  ipcMain.handle('db:actionItems:delete', (_event, id) => {
    const stmt = db.prepare('DELETE FROM action_items WHERE id = ?');
    stmt.run(id);
  });
}

// ======================================================================

module.exports = { registerAllHandlers }; // Export for main.cjs to use
