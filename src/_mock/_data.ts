import {
  _id,
  _price,
  _times,
  _fullName,
  _productNames,
} from './_mock';

// ----------------------------------------------------------------------

// ======================================================================
// INVOICE / SALES TYPES & MOCK DATA
// ======================================================================

export type InvoiceProduct = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit?: ProductUnit;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  client: {
    name: string;
    phone: string;
    address: string;
    nif?: string;
    nis?: string;
    rc?: string;
    ai?: string;
  };
  products: InvoiceProduct[];
  subtotal: number;
  tvaRate: number;
  tvaAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  status: 'paid' | 'partly-paid' | 'unpaid';
  createdAt: string;
  dueDate: string;
};

const buildInvoice = (
  index: number,
  invoiceNumber: string,
  clientName: string,
  phone: string,
  address: string,
  products: Omit<InvoiceProduct, 'id' | 'total'>[],
  tvaRate: number,
  status: Invoice['status'],
  amountPaidOverride?: number,
  date?: string,
  dueDate?: string
): Invoice => {
  const invoiceProducts: InvoiceProduct[] = products.map((p, i) => ({
    id: `prod-${index}-${i}`,
    name: p.name,
    quantity: p.quantity,
    unitPrice: p.unitPrice,
    total: p.quantity * p.unitPrice,
  }));
  // TVA is taken directly from the price (19% of total)
  const totalTTC = invoiceProducts.reduce((sum, p) => sum + p.total, 0);
  const tvaAmount = totalTTC * (tvaRate / 100);
  const subtotHT = totalTTC - tvaAmount;
  const total = totalTTC;
  const amountPaid =
    status === 'paid' ? total : status === 'unpaid' ? 0 : (amountPaidOverride ?? 0);

  return {
    id: _id(index),
    invoiceNumber,
    client: { name: clientName, phone, address },
    products: invoiceProducts,
    subtotal: subtotHT,
    tvaRate,
    tvaAmount,
    total,
    amountPaid,
    amountDue: total - amountPaid,
    status,
    createdAt: date ?? _times(index),
    dueDate: dueDate ?? (() => {
      const d = new Date(date ?? _times(index));
      d.setDate(d.getDate() + 30);
      return d.toLocaleDateString('en-US');
    })(),
  };
};

export const _invoices: Invoice[] = [
  buildInvoice(0, 'INV-0001', 'Ahmed Bensalem', '0555 12 34 56', '12 Rue Didouche Mourad, Algiers',
    [{ name: 'Wireless Mouse', quantity: 10, unitPrice: 2500 }, { name: 'USB-C Hub', quantity: 5, unitPrice: 4800 }],
    19, 'paid', undefined, '02/18/2026'),
  buildInvoice(1, 'INV-0002', 'Fatima Zerhouni', '0661 98 76 54', '45 Blvd Colonel Amirouche, Oran',
    [{ name: 'Mechanical Keyboard', quantity: 3, unitPrice: 8500 }, { name: 'Monitor Stand', quantity: 3, unitPrice: 3200 }],
    19, 'partly-paid', 20000, '02/18/2026'),
  buildInvoice(2, 'INV-0003', 'Youcef Hamdani', '0770 55 44 33', '8 Rue Ben M\'hidi, Constantine',
    [{ name: 'Laptop Stand Pro', quantity: 2, unitPrice: 6200 }],
    19, 'unpaid', undefined, '02/17/2026'),
  buildInvoice(3, 'INV-0004', 'Nadia Boudiaf', '0542 11 22 33', '33 Rue Larbi Ben M\'hidi, Blida',
    [{ name: 'Bluetooth Speaker', quantity: 8, unitPrice: 3800 }, { name: 'Wireless Mouse', quantity: 15, unitPrice: 2500 }],
    19, 'paid', undefined, '02/17/2026'),
  buildInvoice(4, 'INV-0005', 'Karim Messaoudi', '0699 88 77 66', '21 Rue de la Liberté, Sétif',
    [{ name: 'USB-C Hub', quantity: 20, unitPrice: 4800 }],
    19, 'unpaid', undefined, '02/16/2026'),
  buildInvoice(5, 'INV-0006', 'Samira Belkacem', '0555 66 77 88', '5 Place des Martyrs, Annaba',
    [{ name: 'Mechanical Keyboard', quantity: 5, unitPrice: 8500 }, { name: 'Monitor Stand', quantity: 10, unitPrice: 3200 }, { name: 'Laptop Stand Pro', quantity: 4, unitPrice: 6200 }],
    19, 'paid', undefined, '02/15/2026'),
  buildInvoice(6, 'INV-0007', 'Mohamed Tahi', '0661 22 33 44', '78 Rue Hassiba Ben Bouali, Tlemcen',
    [{ name: 'Wireless Mouse', quantity: 50, unitPrice: 2500 }],
    19, 'partly-paid', 100000, '02/14/2026'),
  buildInvoice(7, 'INV-0008', 'Leila Benali', '0770 99 88 77', '15 Rue Abane Ramdane, Bejaia',
    [{ name: 'Bluetooth Speaker', quantity: 12, unitPrice: 3800 }],
    19, 'paid', undefined, '02/13/2026'),
  buildInvoice(8, 'INV-0009', 'Omar Khelif', '0542 44 55 66', '42 Blvd Emir Abdelkader, Mostaganem',
    [{ name: 'USB-C Hub', quantity: 8, unitPrice: 4800 }, { name: 'Mechanical Keyboard', quantity: 2, unitPrice: 8500 }],
    19, 'unpaid', undefined, '02/12/2026'),
  buildInvoice(9, 'INV-0010', 'Amina Djebbar', '0699 11 00 99', '3 Rue du 1er Novembre, Djelfa',
    [{ name: 'Laptop Stand Pro', quantity: 6, unitPrice: 6200 }, { name: 'Monitor Stand', quantity: 8, unitPrice: 3200 }],
    19, 'partly-paid', 40000, '02/11/2026'),
];

export const _salesSummary = {
  today: { totalSales: 73410, profit: 18352, count: 2 },
  pending: { totalAmount: 162554, count: 4 },
  thisMonth: { totalSales: 523880, profit: 130970, count: 10 },
};

// ======================================================================
// CLIENTS & PAYMENT HISTORY MOCK DATA
// ======================================================================

export type Client = {
  id: string;
  name: string;
  phone: string;
  address: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  totalPurchases: number;
  totalPaid: number;
  remainingBalance: number;
  lastInvoiceDate: string;
  status: 'paid' | 'unpaid';
};

export type PaymentRecord = {
  id: string;
  clientId: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  note: string;
};

/** Derive clients from invoice data */
const deriveClients = (invoices: Invoice[]): Client[] => {
  const clientMap = new Map<string, Client>();

  invoices.forEach((inv) => {
    const key = inv.client.name;
    const existing = clientMap.get(key);

    if (existing) {
      existing.totalPurchases += inv.total;
      existing.totalPaid += inv.amountPaid;
      existing.remainingBalance += inv.amountDue;
      if (new Date(inv.createdAt) > new Date(existing.lastInvoiceDate)) {
        existing.lastInvoiceDate = inv.createdAt;
      }
      if (inv.amountDue > 0) existing.status = 'unpaid';
    } else {
      clientMap.set(key, {
        id: `client-${clientMap.size}`,
        name: inv.client.name,
        phone: inv.client.phone,
        address: inv.client.address,
        totalPurchases: inv.total,
        totalPaid: inv.amountPaid,
        remainingBalance: inv.amountDue,
        lastInvoiceDate: inv.createdAt,
        status: inv.amountDue > 0 ? 'unpaid' : 'paid',
      });
    }
  });

  return Array.from(clientMap.values());
};

export const _clients: Client[] = deriveClients(_invoices);

export const _paymentHistory: PaymentRecord[] = [
  { id: 'pay-1', clientId: 'client-1', invoiceNumber: 'INV-0002', date: '02/18/2026', amount: 20000, note: 'Partial payment - cash' },
  { id: 'pay-2', clientId: 'client-0', invoiceNumber: 'INV-0001', date: '02/18/2026', amount: 49980, note: 'Full payment - bank transfer' },
  { id: 'pay-3', clientId: 'client-3', invoiceNumber: 'INV-0004', date: '02/17/2026', amount: 81410, note: 'Full payment - check' },
  { id: 'pay-4', clientId: 'client-6', invoiceNumber: 'INV-0007', date: '02/14/2026', amount: 100000, note: 'Partial payment - cash' },
  { id: 'pay-5', clientId: 'client-5', invoiceNumber: 'INV-1006', date: '02/15/2026', amount: 118762, note: 'Full payment - bank transfer' },
  { id: 'pay-6', clientId: 'client-7', invoiceNumber: 'INV-1008', date: '02/13/2026', amount: 54264, note: 'Full payment - cash' },
  { id: 'pay-7', clientId: 'client-9', invoiceNumber: 'INV-1010', date: '02/12/2026', amount: 40000, note: 'Partial payment - cash' },
];

// ======================================================================
// SUPPLIERS MOCK DATA
// ======================================================================

export type SupplierProduct = {
  id: string;
  name: string;
  buyingPrice: number;
  category: string;
  purchaseDate: string;
  expiryDate?: string;
  unit?: ProductUnit;
};

export type SupplierPurchase = {
  id: string;
  supplierId: string;
  date: string;
  items: { productName: string; quantity: number; unitPrice: number }[];
  total: number;
  amountPaid: number;
  status: 'paid' | 'partial' | 'unpaid';
};

export type SupplierPaymentRecord = {
  id: string;
  supplierId: string;
  date: string;
  amount: number;
  note: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  nif?: string;
  nis?: string;
  rc?: string;
  ai?: string;
  catalog: SupplierProduct[];
  totalPurchased: number;
  totalPaid: number;
  totalOwed: number;
  debtDueDate?: string;
  status: 'active' | 'inactive';
  purchases?: SupplierPurchase[];
  payments?: SupplierPaymentRecord[];
};

export const _suppliers: Supplier[] = [
  {
    id: 'sup-0',
    name: 'TechZone Algérie',
    phone: '0550 10 20 30',
    address: '22 Zone Industrielle, Rouiba, Algiers',
    email: 'contact@techzone-dz.com',
    catalog: [
      { id: 'sp-0-0', name: 'Wireless Mouse', buyingPrice: 1500, category: 'Peripherals', purchaseDate: '2024-11-15' },
      { id: 'sp-0-1', name: 'Mechanical Keyboard', buyingPrice: 5200, category: 'Peripherals', purchaseDate: '2024-11-15' },
      { id: 'sp-0-2', name: 'USB-C Hub', buyingPrice: 3000, category: 'Accessories', purchaseDate: '2024-11-15' },
    ],
    totalPurchased: 505000,
    totalOwed: 125000,
    totalPaid: 380000,
    status: 'active',
  },
  {
    id: 'sup-1',
    name: 'MédiaPlus Distribution',
    phone: '0661 40 50 60',
    address: '8 Rue des Frères Bouadou, Bir Mourad Raïs',
    email: 'orders@mediaplus.dz',
    catalog: [
      { id: 'sp-1-0', name: 'Bluetooth Speaker', buyingPrice: 2200, category: 'Audio', purchaseDate: '2024-10-20' },
      { id: 'sp-1-1', name: 'Monitor Stand', buyingPrice: 1800, category: 'Accessories', purchaseDate: '2024-10-20' },
      { id: 'sp-1-2', name: 'Laptop Stand Pro', buyingPrice: 3800, category: 'Accessories', purchaseDate: '2024-10-20' },
    ],
    totalPurchased: 283000,
    totalOwed: 68000,
    totalPaid: 215000,
    status: 'active',
  },
  {
    id: 'sup-2',
    name: 'InfoStar SARL',
    phone: '0770 70 80 90',
    address: '15 Blvd Mohamed V, Oran',
    email: 'info@infostar.dz',
    catalog: [
      { id: 'sp-2-0', name: 'Webcam HD 1080p', buyingPrice: 2800, category: 'Peripherals', purchaseDate: '2024-09-10' },
      { id: 'sp-2-1', name: 'USB Flash Drive 64GB', buyingPrice: 600, category: 'Storage', purchaseDate: '2024-09-10' },
      { id: 'sp-2-2', name: 'External SSD 500GB', buyingPrice: 7500, category: 'Storage', purchaseDate: '2024-09-10' },
    ],
    totalPurchased: 156000,
    totalOwed: 0,
    totalPaid: 156000,
    status: 'active',
  },
  {
    id: 'sup-3',
    name: 'ElectroNet Import',
    phone: '0542 30 40 50',
    address: '3 Cité des Affaires, Constantine',
    email: 'supply@electronet.dz',
    catalog: [
      { id: 'sp-3-0', name: 'HDMI Cable 2m', buyingPrice: 350, category: 'Cables', purchaseDate: '2024-12-01' },
      { id: 'sp-3-1', name: 'Power Strip 6-Port', buyingPrice: 900, category: 'Accessories', purchaseDate: '2024-12-01' },
      { id: 'sp-3-2', name: 'Surge Protector', buyingPrice: 1400, category: 'Accessories', purchaseDate: '2024-12-01' },
    ],
    totalPurchased: 111500,
    totalOwed: 22500,
    totalPaid: 89000,
    status: 'active',
  },
  {
    id: 'sup-4',
    name: 'Global Micro DZ',
    phone: '0699 60 70 80',
    address: '41 Rue Hassiba Ben Bouali, Sétif',
    email: 'commande@globalmicro.dz',
    catalog: [
      { id: 'sp-4-0', name: 'Wireless Headset', buyingPrice: 4200, category: 'Audio', purchaseDate: '2024-08-05' },
      { id: 'sp-4-1', name: 'Mouse Pad XL', buyingPrice: 800, category: 'Peripherals', purchaseDate: '2024-08-05' },
    ],
    totalPurchased: 62000,
    totalOwed: 0,
    totalPaid: 62000,
    status: 'inactive',
  },
];

export const _supplierPayments: SupplierPaymentRecord[] = [
  { id: 'spay-1', supplierId: 'sup-0', date: '02/20/2026', amount: 150000, note: 'Bank transfer — first batch' },
  { id: 'spay-2', supplierId: 'sup-0', date: '02/05/2026', amount: 130000, note: 'Bank transfer — second batch' },
  { id: 'spay-3', supplierId: 'sup-0', date: '01/18/2026', amount: 100000, note: 'Cash payment' },
  { id: 'spay-4', supplierId: 'sup-1', date: '02/15/2026', amount: 115000, note: 'Bank transfer' },
  { id: 'spay-5', supplierId: 'sup-1', date: '01/25/2026', amount: 100000, note: 'Cash payment' },
  { id: 'spay-6', supplierId: 'sup-2', date: '02/10/2026', amount: 80000, note: 'Bank transfer' },
  { id: 'spay-7', supplierId: 'sup-2', date: '01/15/2026', amount: 76000, note: 'Cash payment' },
  { id: 'spay-8', supplierId: 'sup-3', date: '02/08/2026', amount: 50000, note: 'Check payment' },
  { id: 'spay-9', supplierId: 'sup-3', date: '01/20/2026', amount: 39000, note: 'Bank transfer' },
  { id: 'spay-10', supplierId: 'sup-4', date: '12/15/2025', amount: 62000, note: 'Final payment — account closed' },
];

// ======================================================================
// INVENTORY MOCK DATA
// ======================================================================

export type ProductUnit = 'pcs' | 'g' | 'kg' | 'mg' | 'ton' | 'quintar' | 'l' | 'ml' | 'm' | 'cm' | 'mm';

export type StockBatch = {
  id: string;
  buyingPrice: number;
  sellPrice: number;
  quantity: number;
  purchaseDate: string;
};

export type InventoryProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  supplierId: string;
  supplierName: string;
  buyingPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  unit: ProductUnit;
  expiryDate?: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  batches?: StockBatch[];
};

export type StockAdjustment = {
  id: string;
  productId: string;
  type: 'add' | 'remove';
  quantity: number;
  reason: string;
  date: string;
};

const computeStockStatus = (stock: number, minStock: number): InventoryProduct['status'] => {
  if (stock === 0) return 'out-of-stock';
  if (stock <= minStock) return 'low-stock';
  return 'in-stock';
};

export const _inventory: InventoryProduct[] = [
  { id: 'inv-0', sku: 'PRD-001', name: 'Wireless Mouse', category: 'Peripherals', supplierId: 'sup-0', supplierName: 'TechZone Algérie', buyingPrice: 1500, sellPrice: 2500, stock: 3, minStock: 20, unit: 'pcs', status: 'low-stock' },
  { id: 'inv-1', sku: 'PRD-002', name: 'Mechanical Keyboard', category: 'Peripherals', supplierId: 'sup-0', supplierName: 'TechZone Algérie', buyingPrice: 5200, sellPrice: 8500, stock: 1, minStock: 12, unit: 'pcs', status: 'low-stock' },
  { id: 'inv-2', sku: 'PRD-003', name: 'USB-C Hub', category: 'Accessories', supplierId: 'sup-0', supplierName: 'TechZone Algérie', buyingPrice: 3000, sellPrice: 4800, stock: 7, minStock: 15, unit: 'pcs', status: 'low-stock' },
  { id: 'inv-3', sku: 'PRD-004', name: 'Bluetooth Speaker', category: 'Audio', supplierId: 'sup-1', supplierName: 'MédiaPlus Distribution', buyingPrice: 2200, sellPrice: 3800, stock: 9, minStock: 20, unit: 'pcs', status: 'low-stock' },
  { id: 'inv-4', sku: 'PRD-005', name: 'Monitor Stand', category: 'Accessories', supplierId: 'sup-1', supplierName: 'MédiaPlus Distribution', buyingPrice: 1800, sellPrice: 3200, stock: 35, minStock: 10, unit: 'pcs', status: 'in-stock' },
  { id: 'inv-5', sku: 'PRD-006', name: 'Laptop Stand Pro', category: 'Accessories', supplierId: 'sup-1', supplierName: 'MédiaPlus Distribution', buyingPrice: 3800, sellPrice: 6200, stock: 2, minStock: 10, unit: 'pcs', status: 'low-stock' },
  { id: 'inv-6', sku: 'PRD-007', name: 'Webcam HD 1080p', category: 'Peripherals', supplierId: 'sup-2', supplierName: 'InfoStar SARL', buyingPrice: 2800, sellPrice: 4500, stock: 18, minStock: 8, unit: 'pcs', status: 'in-stock' },
  { id: 'inv-7', sku: 'PRD-008', name: 'USB Flash Drive 64GB', category: 'Storage', supplierId: 'sup-2', supplierName: 'InfoStar SARL', buyingPrice: 600, sellPrice: 1000, stock: 50, minStock: 30, unit: 'pcs', status: 'in-stock' },
  { id: 'inv-8', sku: 'PRD-009', name: 'External SSD 500GB', category: 'Storage', supplierId: 'sup-2', supplierName: 'InfoStar SARL', buyingPrice: 7500, sellPrice: 11500, stock: 0, minStock: 5, unit: 'pcs', status: 'out-of-stock' },
  { id: 'inv-9', sku: 'PRD-010', name: 'HDMI Cable 2m', category: 'Cables', supplierId: 'sup-3', supplierName: 'ElectroNet Import', buyingPrice: 350, sellPrice: 650, stock: 120, minStock: 40, unit: 'pcs', status: 'in-stock' },
  { id: 'inv-10', sku: 'PRD-011', name: 'Power Strip 6-Port', category: 'Accessories', supplierId: 'sup-3', supplierName: 'ElectroNet Import', buyingPrice: 900, sellPrice: 1500, stock: 25, minStock: 15, unit: 'pcs', status: 'in-stock' },
  { id: 'inv-11', sku: 'PRD-012', name: 'Surge Protector', category: 'Accessories', supplierId: 'sup-3', supplierName: 'ElectroNet Import', buyingPrice: 1400, sellPrice: 2300, stock: 0, minStock: 10, unit: 'pcs', status: 'out-of-stock' },
  { id: 'inv-12', sku: 'PRD-013', name: 'Wireless Headset', category: 'Audio', supplierId: 'sup-4', supplierName: 'Global Micro DZ', buyingPrice: 4200, sellPrice: 6800, stock: 14, minStock: 8, unit: 'pcs', status: 'in-stock' },
  { id: 'inv-13', sku: 'PRD-014', name: 'Mouse Pad XL', category: 'Peripherals', supplierId: 'sup-4', supplierName: 'Global Micro DZ', buyingPrice: 800, sellPrice: 1400, stock: 40, minStock: 20, unit: 'pcs', status: 'in-stock' },
];

export const _stockAdjustments: StockAdjustment[] = [
  { id: 'adj-0', productId: 'inv-0', type: 'remove', quantity: 10, reason: 'Sold - INV-1001', date: '02/18/2026' },
  { id: 'adj-1', productId: 'inv-2', type: 'remove', quantity: 5, reason: 'Sold - INV-1001', date: '02/18/2026' },
  { id: 'adj-2', productId: 'inv-4', type: 'add', quantity: 20, reason: 'New shipment from MédiaPlus', date: '02/17/2026' },
  { id: 'adj-3', productId: 'inv-8', type: 'remove', quantity: 3, reason: 'Damaged items', date: '02/16/2026' },
  { id: 'adj-4', productId: 'inv-1', type: 'remove', quantity: 5, reason: 'Sold - INV-1006', date: '02/15/2026' },
];

export const _myAccount = {
  displayName: 'Jaydon Frankie',
  email: 'demo@stockflow.app',
  photoURL: '/assets/images/avatar/avatar-25.webp',
};

// ----------------------------------------------------------------------

export const _langs = [
  {
    value: 'en',
    label: 'English',
    code: 'EN',
    color: '#1976D2',
  },
  {
    value: 'fr',
    label: 'Français',
    code: 'FR',
    color: '#D32F2F',
  },
  {
    value: 'ar',
    label: 'العربية',
    code: 'AR',
    color: '#2E7D32',
  },
];

// ----------------------------------------------------------------------

export const _notifications = [
  {
    id: _id(1),
    title: 'Your order is placed',
    description: 'waiting for shipping',
    avatarUrl: null,
    type: 'order-placed',
    postedAt: _times(1),
    isUnRead: true,
  },
  {
    id: _id(2),
    title: _fullName(2),
    description: 'answered to your comment on the Minimal',
    avatarUrl: '/assets/images/avatar/avatar-2.webp',
    type: 'friend-interactive',
    postedAt: _times(2),
    isUnRead: true,
  },
  {
    id: _id(3),
    title: 'You have new message',
    description: '5 unread messages',
    avatarUrl: null,
    type: 'chat-message',
    postedAt: _times(3),
    isUnRead: false,
  },
  {
    id: _id(4),
    title: 'You have new mail',
    description: 'sent from Guido Padberg',
    avatarUrl: null,
    type: 'mail',
    postedAt: _times(4),
    isUnRead: false,
  },
  {
    id: _id(5),
    title: 'Delivery processing',
    description: 'Your order is being shipped',
    avatarUrl: null,
    type: 'order-shipped',
    postedAt: _times(5),
    isUnRead: false,
  },
];

// ======================================================================
// INVENTORY DASHBOARD MOCK DATA
// ======================================================================

export const _dashboardMetrics = {
  todayRevenue: {
    percent: 2.6,
    total: 18765,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [12, 18, 14, 22, 16, 24, 20, 18],
    },
  },
  thisMonthRevenue: {
    percent: 0.2,
    total: 478623,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [350, 410, 380, 450, 420, 460, 440, 478],
    },
  },
  pendingPayments: {
    percent: -0.1,
    total: 27340,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [30, 25, 36, 28, 32, 24, 29, 27],
    },
  },
  todayProfit: {
    percent: 3.6,
    total: 6234,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [4, 5, 3, 7, 5, 8, 6, 6],
    },
  },
};

export const _secondaryMetrics = {
  suppliersOwed: {
    percent: -1.2,
    total: 45230,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [50, 48, 52, 46, 44, 47, 45, 45],
    },
  },
  tvaCollected: {
    percent: 1.8,
    total: 12480,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [8, 10, 9, 11, 10, 12, 11, 12],
    },
  },
  lastMonthRevenue: {
    percent: -0.5,
    total: 462100,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [340, 400, 370, 440, 410, 450, 430, 462],
    },
  },
  ordersThisMonth: {
    percent: 4.1,
    total: 1247,
    chart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [900, 1020, 980, 1100, 1050, 1180, 1120, 1247],
    },
  },
};

export const _cashFlowData = {
  categories: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
  moneyIn: [285000, 340000, 310000, 420000, 390000, 464416],
  moneyOut: [195000, 248000, 220000, 310000, 275000, 317200],
};

export const _expensesBreakdown = {
  series: [
    { label: 'Suppliers', value: 52 },
    { label: 'Shipping', value: 18 },
    { label: 'TVA Owed', value: 15 },
    { label: 'Operating', value: 15 },
  ],
};

export const _productsSold = [...Array(8)].map((_, index) => ({
  id: _id(index),
  name: _productNames(index),
  quantity: (index + 1) * 12,
  amount: _price(index),
}));

export const _lowStockAlerts = [
  { id: _id(0), name: 'Wireless Mouse', currentStock: 3, minStock: 20, status: 'critical' as const },
  { id: _id(1), name: 'USB-C Hub Adapter', currentStock: 7, minStock: 15, status: 'warning' as const },
  { id: _id(2), name: 'Laptop Stand Pro', currentStock: 2, minStock: 10, status: 'critical' as const },
  { id: _id(3), name: 'Bluetooth Speaker', currentStock: 9, minStock: 20, status: 'warning' as const },
  { id: _id(4), name: 'Mechanical Keyboard', currentStock: 1, minStock: 12, status: 'critical' as const },
];

export const _todoList = [
  { id: _id(0), title: 'Restock low-inventory items', completed: false },
  { id: _id(1), title: 'Review pending supplier invoices', completed: true },
  { id: _id(2), title: 'Update product pricing for Q1', completed: false },
  { id: _id(3), title: 'Audit warehouse stock levels', completed: false },
  { id: _id(4), title: 'Send monthly sales report', completed: true },
];

export const _recentSales = [...Array(10)].map((_, index) => ({
  id: _id(index),
  orderNumber: `INV-${1000 + index}`,
  customer: _fullName(index),
  amount: _price(index),
  date: _times(index),
  status: (['completed', 'pending', 'shipped'] as const)[index % 3],
}));

// ======================================================================
// EXPENSES MOCK DATA
// ======================================================================

export type ExpenseRecurring = 'one-time' | 'monthly' | 'yearly';

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  recurring: ExpenseRecurring;
  note: string;
};

export const _expenses: Expense[] = [
  { id: 'exp-1', description: 'Shop rent — February', category: 'Rent', amount: 45000, date: '02/01/2026', recurring: 'monthly', note: '' },
  { id: 'exp-2', description: 'Electricity bill — January', category: 'Utilities', amount: 8500, date: '02/05/2026', recurring: 'monthly', note: 'Sonelgaz' },
  { id: 'exp-3', description: 'Water bill — January', category: 'Utilities', amount: 2200, date: '02/05/2026', recurring: 'monthly', note: '' },
  { id: 'exp-4', description: 'Delivery van fuel', category: 'Transport', amount: 12000, date: '02/10/2026', recurring: 'monthly', note: 'Estimated monthly fuel cost' },
  { id: 'exp-5', description: 'Employee salary — Ahmed', category: 'Salaries', amount: 35000, date: '02/01/2026', recurring: 'monthly', note: '' },
  { id: 'exp-6', description: 'Employee salary — Karim', category: 'Salaries', amount: 30000, date: '02/01/2026', recurring: 'monthly', note: '' },
  { id: 'exp-7', description: 'AC unit repair', category: 'Maintenance', amount: 15000, date: '02/12/2026', recurring: 'one-time', note: 'Technician came twice' },
  { id: 'exp-8', description: 'Internet subscription', category: 'Utilities', amount: 4500, date: '02/01/2026', recurring: 'monthly', note: 'Algérie Télécom fiber' },
  { id: 'exp-9', description: 'Parking permit annual', category: 'Transport', amount: 18000, date: '01/15/2026', recurring: 'yearly', note: 'Valid until Jan 2027' },
  { id: 'exp-10', description: 'Shop rent — January', category: 'Rent', amount: 45000, date: '01/01/2026', recurring: 'monthly', note: '' },
  { id: 'exp-11', description: 'Electricity bill — December', category: 'Utilities', amount: 7800, date: '01/06/2026', recurring: 'monthly', note: '' },
  { id: 'exp-12', description: 'Delivery van fuel', category: 'Transport', amount: 11500, date: '01/10/2026', recurring: 'monthly', note: '' },
  { id: 'exp-13', description: 'Employee salary — Ahmed', category: 'Salaries', amount: 35000, date: '01/01/2026', recurring: 'monthly', note: '' },
  { id: 'exp-14', description: 'Employee salary — Karim', category: 'Salaries', amount: 30000, date: '01/01/2026', recurring: 'monthly', note: '' },
  { id: 'exp-15', description: 'Office supplies', category: 'Other', amount: 3200, date: '01/18/2026', recurring: 'one-time', note: 'Printer paper, pens, folders' },
  { id: 'exp-16', description: 'Signage update', category: 'Maintenance', amount: 8000, date: '01/22/2026', recurring: 'one-time', note: 'New shop sign installed' },
  { id: 'exp-17', description: 'Water bill — December', category: 'Utilities', amount: 2000, date: '01/05/2026', recurring: 'monthly', note: '' },
  { id: 'exp-18', description: 'Internet subscription', category: 'Utilities', amount: 4500, date: '01/01/2026', recurring: 'monthly', note: '' },
];
