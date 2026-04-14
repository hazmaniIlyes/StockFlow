// electron/database/init.cjs — SQLite database initialization and table creation
// This file creates the inventory.db file and defines all table schemas.
// It runs once when the Electron app starts. Tables are created with IF NOT EXISTS
// so re-running this is safe and won't destroy existing data.

const Database = require('better-sqlite3'); // better-sqlite3 is a synchronous SQLite driver for Node.js
const path = require('path');               // Node path module for cross-platform file paths
const { app } = require('electron');        // Electron app module to get the userData directory

// ======================================================================

/**
 * initDatabase() — Creates or opens the SQLite database file and ensures all tables exist.
 * The database file is stored in the user's app data directory so it persists across app updates.
 * On Windows this is typically: C:\Users\<username>\AppData\Roaming\<appName>\inventory.db
 * @returns {Database.Database} The better-sqlite3 database instance
 */
function initDatabase() {
  // Determine where to store the database file
  const dbPath = path.join(app.getPath('userData'), 'inventory.db'); // Store in Electron's userData folder for persistence

  // Open (or create) the SQLite database file with WAL mode for better concurrent read performance
  const db = new Database(dbPath); // better-sqlite3 opens synchronously — no async needed

  // Enable WAL (Write-Ahead Logging) mode for better performance with concurrent reads
  db.pragma('journal_mode = WAL'); // WAL is faster than the default journal mode for desktop apps

  // Enable foreign keys enforcement so CASCADE deletes work correctly
  db.pragma('foreign_keys = ON'); // Without this, foreign key constraints are not enforced in SQLite

  // ── Create all tables ────────────────────────────────────────────────
  // Using db.exec() for multi-statement DDL. IF NOT EXISTS ensures idempotency.

  db.exec(`
    /* ================================================================
       PRODUCTS TABLE — Stores all inventory products
       Each product has pricing, stock levels, supplier reference, and status.
       The 'status' column is computed from stock and minStock values.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,                    /* Unique product ID (e.g., 'inv-1234567890') */
      sku TEXT NOT NULL DEFAULT '',            /* Stock Keeping Unit code for the product */
      name TEXT NOT NULL,                     /* Product display name */
      category TEXT NOT NULL DEFAULT '',       /* Product category (e.g., 'Peripherals', 'Audio') */
      supplierId TEXT NOT NULL DEFAULT '',     /* Foreign reference to the supplier who provides this product */
      supplierName TEXT NOT NULL DEFAULT '',   /* Denormalized supplier name for display without joins */
      buyingPrice REAL NOT NULL DEFAULT 0,    /* Cost price — what we pay to buy this product */
      sellPrice REAL NOT NULL DEFAULT 0,      /* Selling price — what we charge customers */
      stock REAL NOT NULL DEFAULT 0,          /* Current stock quantity (REAL to support fractional units like kg) */
      minStock REAL NOT NULL DEFAULT 0,       /* Minimum stock threshold — triggers low-stock alerts */
      unit TEXT NOT NULL DEFAULT 'pcs',       /* Unit of measurement (pcs, kg, l, m, etc.) */
      expiryDate TEXT,                        /* Optional expiry date for perishable products (ISO format) */
      status TEXT NOT NULL DEFAULT 'in-stock' /* Computed status: 'in-stock', 'low-stock', or 'out-of-stock' */
    );

    /* ================================================================
       STOCK_BATCHES TABLE — Supports FIFO (First In, First Out) stock management
       Each batch represents a shipment of products bought at a specific price.
       When selling, oldest batches are consumed first.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS stock_batches (
      id TEXT PRIMARY KEY,                    /* Unique batch ID */
      productId TEXT NOT NULL,                /* Which product this batch belongs to */
      buyingPrice REAL NOT NULL DEFAULT 0,    /* Cost price for this specific batch */
      sellPrice REAL NOT NULL DEFAULT 0,      /* Sell price for this specific batch */
      quantity REAL NOT NULL DEFAULT 0,       /* Remaining quantity in this batch */
      purchaseDate TEXT NOT NULL,             /* When this batch was purchased (ISO date) */
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE  /* Delete batches when product is deleted */
    );

    /* ================================================================
       CLIENTS TABLE — Stores customer information and financial summaries
       Financial fields (totalPurchases, totalPaid, remainingBalance) are
       denormalized for fast dashboard/KPI access without joins.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,                    /* Unique client ID */
      name TEXT NOT NULL,                     /* Client's full name */
      phone TEXT NOT NULL DEFAULT '',         /* Contact phone number */
      address TEXT NOT NULL DEFAULT '',       /* Physical address */
      nif TEXT,                               /* Tax ID: Numéro d'Identification Fiscale */
      nis TEXT,                               /* Tax ID: Numéro d'Identification Statistique */
      rc TEXT,                                /* Tax ID: Registre de Commerce */
      ai TEXT,                                /* Tax ID: Article d'Imposition */
      totalPurchases REAL NOT NULL DEFAULT 0,  /* Total amount of all invoices for this client */
      totalPaid REAL NOT NULL DEFAULT 0,       /* Total amount the client has paid */
      remainingBalance REAL NOT NULL DEFAULT 0, /* Outstanding balance (totalPurchases - totalPaid) */
      lastInvoiceDate TEXT NOT NULL DEFAULT '', /* Date of the most recent invoice */
      status TEXT NOT NULL DEFAULT 'paid'      /* Payment status: 'paid' or 'unpaid' */
    );

    /* ================================================================
       SUPPLIERS TABLE — Stores supplier/vendor information and financial summaries
       Similar denormalization as clients for fast access.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,                    /* Unique supplier ID */
      name TEXT NOT NULL,                     /* Supplier company name */
      phone TEXT NOT NULL DEFAULT '',         /* Contact phone */
      address TEXT NOT NULL DEFAULT '',       /* Business address */
      email TEXT NOT NULL DEFAULT '',         /* Contact email */
      nif TEXT,                               /* Tax identification numbers (same as clients) */
      nis TEXT,
      rc TEXT,
      ai TEXT,
      totalPurchased REAL NOT NULL DEFAULT 0,  /* Total amount purchased from this supplier */
      totalPaid REAL NOT NULL DEFAULT 0,       /* Total amount paid to this supplier */
      totalOwed REAL NOT NULL DEFAULT 0,       /* Outstanding balance owed to supplier */
      debtDueDate TEXT,                        /* When the debt is due */
      status TEXT NOT NULL DEFAULT 'active'    /* active or inactive */
    );

    /* ================================================================
       SUPPLIER_CATALOG TABLE — Products that a supplier offers
       Links suppliers to the products they sell to us.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS supplier_catalog (
      id TEXT PRIMARY KEY,                    /* Unique catalog entry ID */
      supplierId TEXT NOT NULL,               /* Which supplier offers this product */
      name TEXT NOT NULL,                     /* Product name in the supplier's catalog */
      buyingPrice REAL NOT NULL DEFAULT 0,    /* Price from this supplier */
      category TEXT NOT NULL DEFAULT '',       /* Product category */
      purchaseDate TEXT NOT NULL DEFAULT '',   /* When we last purchased from this supplier */
      expiryDate TEXT,                         /* Optional expiry date */
      unit TEXT DEFAULT 'pcs',                 /* Unit of measurement */
      FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE  /* Remove catalog when supplier deleted */
    );

    /* ================================================================
       SUPPLIER_PURCHASES TABLE — Records of purchases made from suppliers
       Each purchase can contain multiple line items stored as JSON.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS supplier_purchases (
      id TEXT PRIMARY KEY,                    /* Unique purchase ID */
      supplierId TEXT NOT NULL,               /* Which supplier we bought from */
      date TEXT NOT NULL,                     /* Purchase date (ISO format) */
      items TEXT NOT NULL DEFAULT '[]',       /* JSON array of purchase items: [{productName, quantity, unitPrice}] */
      total REAL NOT NULL DEFAULT 0,          /* Total purchase amount */
      amountPaid REAL NOT NULL DEFAULT 0,     /* How much we paid on this purchase */
      status TEXT NOT NULL DEFAULT 'unpaid',  /* paid, partial, or unpaid */
      FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE
    );

    /* ================================================================
       SUPPLIER_PAYMENTS TABLE — Records of payments made TO suppliers
       Tracks each individual payment to reduce supplier debt.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS supplier_payments (
      id TEXT PRIMARY KEY,                    /* Unique payment ID */
      supplierId TEXT NOT NULL,               /* Which supplier received the payment */
      date TEXT NOT NULL,                     /* Payment date */
      amount REAL NOT NULL DEFAULT 0,         /* Payment amount */
      note TEXT NOT NULL DEFAULT '',           /* Payment description/note */
      FOREIGN KEY (supplierId) REFERENCES suppliers(id) ON DELETE CASCADE
    );

    /* ================================================================
       INVOICES TABLE — Sales invoices issued to clients
       The client info is stored as JSON to preserve the snapshot at invoice time.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,                    /* Unique invoice ID */
      invoiceNumber TEXT NOT NULL,            /* Human-readable invoice number (e.g., 'INV-0001') */
      clientName TEXT NOT NULL DEFAULT '',    /* Client name (denormalized for quick access) */
      clientPhone TEXT NOT NULL DEFAULT '',   /* Client phone at time of invoice */
      clientAddress TEXT NOT NULL DEFAULT '', /* Client address at time of invoice */
      clientNif TEXT,                          /* Client tax IDs at time of invoice */
      clientNis TEXT,
      clientRc TEXT,
      clientAi TEXT,
      subtotal REAL NOT NULL DEFAULT 0,       /* Subtotal before TVA (HT) */
      tvaRate REAL NOT NULL DEFAULT 0,        /* TVA rate applied (e.g., 19) */
      tvaAmount REAL NOT NULL DEFAULT 0,      /* TVA amount in currency */
      total REAL NOT NULL DEFAULT 0,          /* Grand total (TTC) */
      amountPaid REAL NOT NULL DEFAULT 0,     /* How much the client has paid */
      amountDue REAL NOT NULL DEFAULT 0,      /* Remaining balance (total - amountPaid) */
      status TEXT NOT NULL DEFAULT 'unpaid',  /* paid, partly-paid, or unpaid */
      createdAt TEXT NOT NULL,                /* Invoice creation date */
      dueDate TEXT NOT NULL                   /* Payment due date */
    );

    /* ================================================================
       INVOICE_PRODUCTS TABLE — Line items for each invoice
       Each row is one product line on an invoice.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS invoice_products (
      id TEXT PRIMARY KEY,                    /* Unique line item ID */
      invoiceId TEXT NOT NULL,                /* Which invoice this line belongs to */
      name TEXT NOT NULL,                     /* Product name */
      quantity REAL NOT NULL DEFAULT 0,       /* Quantity sold */
      unitPrice REAL NOT NULL DEFAULT 0,      /* Price per unit */
      total REAL NOT NULL DEFAULT 0,          /* Line total (quantity × unitPrice) */
      unit TEXT,                               /* Optional unit of measurement */
      FOREIGN KEY (invoiceId) REFERENCES invoices(id) ON DELETE CASCADE  /* Delete line items when invoice deleted */
    );

    /* ================================================================
       EXPENSES TABLE — Operational expenses (rent, utilities, salaries, etc.)
       ================================================================ */
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,                    /* Unique expense ID */
      description TEXT NOT NULL DEFAULT '',   /* What the expense is for */
      category TEXT NOT NULL DEFAULT '',       /* Expense category (Rent, Utilities, etc.) */
      amount REAL NOT NULL DEFAULT 0,         /* Expense amount */
      date TEXT NOT NULL,                     /* Date of the expense */
      recurring TEXT NOT NULL DEFAULT 'one-time', /* Recurrence: one-time, monthly, or yearly */
      note TEXT NOT NULL DEFAULT ''            /* Additional notes */
    );

    /* ================================================================
       TVA_DECLARATIONS TABLE — Records of TVA tax declarations
       When the user "declares" TVA, a snapshot is saved here.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS tva_declarations (
      id TEXT PRIMARY KEY,                    /* Unique declaration ID */
      period TEXT NOT NULL,                   /* Period covered (e.g., '2026-01-01 → 2026-03-01') */
      amount REAL NOT NULL DEFAULT 0,         /* TVA amount declared */
      dateDeclared TEXT NOT NULL              /* Date the declaration was made */
    );

    /* ================================================================
       SETTINGS TABLE — Key-value store for app configuration
       Stores things like invoice counter, TVA reset date, business info, etc.
       ================================================================ */
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,                   /* Setting name (e.g., 'invoice_counter', 'tva_reset_date') */
      value TEXT NOT NULL DEFAULT ''          /* Setting value stored as text (JSON for complex values) */
    );
    /* ================================================================
       ACTION_ITEMS TABLE — Dashboard notes and reminders
       ================================================================ */
    CREATE TABLE IF NOT EXISTS action_items (
      id TEXT PRIMARY KEY,                    /* Unique note ID */
      title TEXT NOT NULL,                    /* The note text content */
      completed BOOLEAN DEFAULT 0,            /* Whether the note is crossed off (0=false, 1=true) */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ── Initialize default settings if they don't exist yet ────────────
  // This ensures the app works correctly on first launch

  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)' // OR IGNORE prevents overwriting existing settings
  );

  insertSetting.run('invoice_counter', '1');    // Start invoice numbering at 1
  insertSetting.run('tva_reset_date', '');       // No TVA reset date initially (empty = count from beginning)

  // Log the database path for debugging
  console.log(`[SQLite] Database initialized at: ${dbPath}`); // Helps the developer find the .db file

  return db; // Return the database instance so it can be passed to IPC handlers
}

// ======================================================================

module.exports = { initDatabase }; // Export so main.cjs can call it
