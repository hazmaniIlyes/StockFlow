import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';

import { fCurrency, fNumber } from 'src/utils/format-number';

import { useSettings, useTranslation } from 'src/contexts';

import { Label } from 'src/components/label';

import type { Invoice, Client, Supplier, Expense, InventoryProduct } from 'src/_mock/_data';

// ======================================================================

type Props = {
  invoices: Invoice[];
  clients: Client[];
  suppliers: Supplier[];
  expenses: Expense[];
  inventory: InventoryProduct[];
};

export function ReportsBreakdownTabs({ invoices, clients, suppliers, expenses, inventory }: Props) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const { expenseCategories } = useSettings();
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        boxShadow: theme.vars.customShadows.z8,
        border: `1px solid ${theme.vars.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          px: 2,
          pt: 1,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }}
      >
        <Tab label={t('reports.salesReport')} />
        <Tab label={t('reports.clientBalances')} />
        <Tab label={t('reports.supplierBalances')} />
        <Tab label={t('reports.expenses')} />
        <Tab label={t('reports.inventoryValuation')} />
      </Tabs>

      <Box sx={{ p: 0 }}>
        {tab === 0 && <SalesReport invoices={invoices} />}
        {tab === 1 && <ClientBalances clients={clients} />}
        {tab === 2 && <SupplierBalances suppliers={suppliers} />}
        {tab === 3 && <ExpensesReport expenses={expenses} expenseCategories={expenseCategories} />}
        {tab === 4 && <InventoryValuation inventory={inventory} />}
      </Box>
    </Card>
  );
}

// ======================================================================
// Tab 1 — Sales Report
// ======================================================================

function SalesReport({ invoices }: { invoices: Invoice[] }) {
  const { t, dir } = useTranslation();
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0);
  const totalPending = invoices.reduce((s, i) => s + i.amountDue, 0);
  const paginated = invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('reports.invoiceNumber')}</TableCell>
            <TableCell>{t('reports.client')}</TableCell>
            <TableCell>{t('common.date')}</TableCell>
            <TableCell align="right">{t('common.total')}</TableCell>
            <TableCell align="right">{t('reports.paid')}</TableCell>
            <TableCell align="right">{t('reports.due')}</TableCell>
            <TableCell align="center">{t('common.status')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((inv) => (
            <TableRow key={inv.id} hover>
              <TableCell>{inv.invoiceNumber}</TableCell>
              <TableCell>{inv.client.name}</TableCell>
              <TableCell>{inv.createdAt}</TableCell>
              <TableCell align="right">{fCurrency(inv.total)}</TableCell>
              <TableCell align="right">{fCurrency(inv.amountPaid)}</TableCell>
              <TableCell align="right">{fCurrency(inv.amountDue)}</TableCell>
              <TableCell align="center">
                <Label
                  color={
                    inv.status === 'paid' ? 'success' : inv.status === 'partly-paid' ? 'warning' : 'error'
                  }
                >
                  {inv.status === 'partly-paid' ? t('reports.partial') : inv.status === 'paid' ? t('reports.paid') : t('reports.unpaid')}
                </Label>
              </TableCell>
            </TableRow>
          ))}

          {/* Totals row */}
          <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid', borderColor: 'divider' } }}>
            <TableCell colSpan={3}>{t('common.total')} ({invoices.length} {t('reports.invoices')})</TableCell>
            <TableCell align="right">{fCurrency(totalRevenue)}</TableCell>
            <TableCell align="right">{fCurrency(totalCollected)}</TableCell>
            <TableCell align="right">{fCurrency(totalPending)}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={invoices.length}
      page={page}
      onPageChange={(_e, newPage) => setPage(newPage)}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[20]}
      labelRowsPerPage={t('common.rowsPerPage')}
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
      dir={dir}
    />
    </>
  );
}

// ======================================================================
// Tab 2 — Client Balances
// ======================================================================

function ClientBalances({ clients }: { clients: Client[] }) {
  const { t, dir } = useTranslation();
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const sorted = [...clients].sort((a, b) => b.remainingBalance - a.remainingBalance);
  const totalPurchases = clients.reduce((s, c) => s + c.totalPurchases, 0);
  const totalPaid = clients.reduce((s, c) => s + c.totalPaid, 0);
  const totalRemaining = clients.reduce((s, c) => s + c.remainingBalance, 0);
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('reports.client')}</TableCell>
            <TableCell>{t('common.phone')}</TableCell>
            <TableCell align="right">{t('reports.totalPurchases')}</TableCell>
            <TableCell align="right">{t('reports.totalPaid')}</TableCell>
            <TableCell align="right">{t('reports.remaining')}</TableCell>
            <TableCell align="center">{t('common.status')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((c) => (
            <TableRow key={c.id} hover>
              <TableCell>{c.name}</TableCell>
              <TableCell>{c.phone}</TableCell>
              <TableCell align="right">{fCurrency(c.totalPurchases)}</TableCell>
              <TableCell align="right">{fCurrency(c.totalPaid)}</TableCell>
              <TableCell align="right">{fCurrency(c.remainingBalance)}</TableCell>
              <TableCell align="center">
                <Label color={c.status === 'paid' ? 'success' : 'error'}>
                  {c.status === 'paid' ? t('reports.paid') : t('reports.unpaid')}
                </Label>
              </TableCell>
            </TableRow>
          ))}

          <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid', borderColor: 'divider' } }}>
            <TableCell colSpan={2}>{t('common.total')} ({clients.length} {t('reports.clients')})</TableCell>
            <TableCell align="right">{fCurrency(totalPurchases)}</TableCell>
            <TableCell align="right">{fCurrency(totalPaid)}</TableCell>
            <TableCell align="right">{fCurrency(totalRemaining)}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={clients.length}
      page={page}
      onPageChange={(_e, newPage) => setPage(newPage)}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[20]}
      labelRowsPerPage={t('common.rowsPerPage')}
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
      dir={dir}
    />
    </>
  );
}

// ======================================================================
// Tab 3 — Supplier Balances
// ======================================================================

function SupplierBalances({ suppliers }: { suppliers: Supplier[] }) {
  const { t, dir } = useTranslation();
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const sorted = [...suppliers].sort((a, b) => b.totalOwed - a.totalOwed);
  const totalPurchased = suppliers.reduce((s, sp) => s + sp.totalPurchased, 0);
  const totalPaid = suppliers.reduce((s, sp) => s + sp.totalPaid, 0);
  const totalOwed = suppliers.reduce((s, sp) => s + sp.totalOwed, 0);
  const paginated = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('reports.supplier')}</TableCell>
            <TableCell>{t('common.email')}</TableCell>
            <TableCell align="right">{t('reports.totalPurchased')}</TableCell>
            <TableCell align="right">{t('reports.totalPaid')}</TableCell>
            <TableCell align="right">{t('reports.owed')}</TableCell>
            <TableCell align="center">{t('common.status')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginated.map((sp) => (
            <TableRow key={sp.id} hover>
              <TableCell>{sp.name}</TableCell>
              <TableCell>{sp.email}</TableCell>
              <TableCell align="right">{fCurrency(sp.totalPurchased)}</TableCell>
              <TableCell align="right">{fCurrency(sp.totalPaid)}</TableCell>
              <TableCell align="right">{fCurrency(sp.totalOwed)}</TableCell>
              <TableCell align="center">
                <Label color={sp.totalOwed === 0 ? 'success' : 'error'}>
                  {sp.totalOwed === 0 ? t('reports.settled') : t('reports.owing')}
                </Label>
              </TableCell>
            </TableRow>
          ))}

          <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid', borderColor: 'divider' } }}>
            <TableCell colSpan={2}>{t('common.total')} ({suppliers.length} {t('reports.suppliers')})</TableCell>
            <TableCell align="right">{fCurrency(totalPurchased)}</TableCell>
            <TableCell align="right">{fCurrency(totalPaid)}</TableCell>
            <TableCell align="right">{fCurrency(totalOwed)}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component="div"
      count={suppliers.length}
      page={page}
      onPageChange={(_e, newPage) => setPage(newPage)}
      rowsPerPage={rowsPerPage}
      rowsPerPageOptions={[20]}
      labelRowsPerPage={t('common.rowsPerPage')}
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} ${t('common.of')} ${count}`}
      dir={dir}
    />
    </>
  );
}

// ======================================================================
// Tab 4 — Expenses Report
// ======================================================================

type ExpenseCategory = { id: string; label: string; color: string };

function ExpensesReport({ expenses, expenseCategories }: { expenses: Expense[]; expenseCategories: ExpenseCategory[] }) {
  const { t } = useTranslation();
  // Group by category
  const categoryMap = new Map<string, { label: string; total: number; count: number }>();

  expenses.forEach((e) => {
    // Category is now stored as label directly (e.g., "Rent", "Utilities")
    const cat = expenseCategories.find((c) => c.label === e.category);
    const label = cat?.label ?? e.category;
    const existing = categoryMap.get(label);

    if (existing) {
      existing.total += e.amount;
      existing.count += 1;
    } else {
      categoryMap.set(label, { label, total: e.amount, count: 1 });
    }
  });

  const categories = Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  const grandTotal = categories.reduce((s, c) => s + c.total, 0);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('common.category')}</TableCell>
            <TableCell align="center">{t('reports.transactions')}</TableCell>
            <TableCell align="right">{t('common.total')}</TableCell>
            <TableCell align="right">{t('reports.percentOfTotal')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.label} hover>
              <TableCell>{cat.label}</TableCell>
              <TableCell align="center">{cat.count}</TableCell>
              <TableCell align="right">{fCurrency(cat.total)}</TableCell>
              <TableCell align="right">
                {grandTotal > 0 ? `${((cat.total / grandTotal) * 100).toFixed(1)}%` : '0%'}
              </TableCell>
            </TableRow>
          ))}

          <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid', borderColor: 'divider' } }}>
            <TableCell>{t('reports.grandTotal')}</TableCell>
            <TableCell align="center">{expenses.length}</TableCell>
            <TableCell align="right">{fCurrency(grandTotal)}</TableCell>
            <TableCell align="right">100%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ======================================================================
// Tab 5 — Inventory Valuation
// ======================================================================

function InventoryValuation({ inventory }: { inventory: InventoryProduct[] }) {
  const { t } = useTranslation();
  // Group by category
  const categoryMap = new Map<
    string,
    { category: string; items: number; totalStock: number; costValue: number; retailValue: number }
  >();

  inventory.forEach((p) => {
    const existing = categoryMap.get(p.category);
    if (existing) {
      existing.items += 1;
      existing.totalStock += p.stock;
      existing.costValue += p.stock * p.buyingPrice;
      existing.retailValue += p.stock * p.sellPrice;
    } else {
      categoryMap.set(p.category, {
        category: p.category,
        items: 1,
        totalStock: p.stock,
        costValue: p.stock * p.buyingPrice,
        retailValue: p.stock * p.sellPrice,
      });
    }
  });

  const categories = Array.from(categoryMap.values()).sort((a, b) => b.retailValue - a.retailValue);
  const totals = categories.reduce(
    (acc, c) => ({
      items: acc.items + c.items,
      stock: acc.stock + c.totalStock,
      cost: acc.cost + c.costValue,
      retail: acc.retail + c.retailValue,
    }),
    { items: 0, stock: 0, cost: 0, retail: 0 }
  );

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t('common.category')}</TableCell>
            <TableCell align="center">{t('reports.products')}</TableCell>
            <TableCell align="center">{t('reports.totalStock')}</TableCell>
            <TableCell align="right">{t('reports.costValue')}</TableCell>
            <TableCell align="right">{t('reports.retailValue')}</TableCell>
            <TableCell align="right">{t('reports.potentialProfit')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((cat) => (
            <TableRow key={cat.category} hover>
              <TableCell>{cat.category}</TableCell>
              <TableCell align="center">{cat.items}</TableCell>
              <TableCell align="center">{fNumber(cat.totalStock)}</TableCell>
              <TableCell align="right">{fCurrency(cat.costValue)}</TableCell>
              <TableCell align="right">{fCurrency(cat.retailValue)}</TableCell>
              <TableCell align="right">{fCurrency(cat.retailValue - cat.costValue)}</TableCell>
            </TableRow>
          ))}

          <TableRow sx={{ '& td': { fontWeight: 'bold', borderTop: '2px solid', borderColor: 'divider' } }}>
            <TableCell>{t('common.total')}</TableCell>
            <TableCell align="center">{totals.items}</TableCell>
            <TableCell align="center">{fNumber(totals.stock)}</TableCell>
            <TableCell align="right">{fCurrency(totals.cost)}</TableCell>
            <TableCell align="right">{fCurrency(totals.retail)}</TableCell>
            <TableCell align="right">{fCurrency(totals.retail - totals.cost)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}
