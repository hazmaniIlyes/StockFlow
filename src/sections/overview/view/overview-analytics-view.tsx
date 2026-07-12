import type { Invoice, ProductUnit, InvoiceProduct } from 'src/_mock/_data';

import { useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Grid from '@mui/material/Grid';
import Collapse from '@mui/material/Collapse';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { useClients, useExpenses, useSettings, useInventory, useSuppliers, useTranslation } from 'src/contexts';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { useInvoices } from 'src/sections/sales/context';
import { InventoryFormDialog } from 'src/sections/inventory/inventory-form-dialog';
import { SuppliersFormDialog } from 'src/sections/suppliers/suppliers-form-dialog';
import { SalesNewInvoiceDialog } from 'src/sections/sales/sales-new-invoice-dialog';

import { AnalyticsLowStock } from '../analytics-low-stock';
import { AnalyticsCashFlow } from '../analytics-cash-flow';
import { AnalyticsTodoList } from '../analytics-todo-list';
import { AnalyticsRecentSales } from '../analytics-recent-sales';
import { AnalyticsQuickActions } from '../analytics-quick-actions';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsWidgetSecondary } from '../analytics-widget-secondary';
import { AnalyticsRevenueBreakdown } from '../analytics-revenue-breakdown';

// ======================================================================

export function OverviewAnalyticsView() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useSnackbar();
  const { t, language } = useTranslation();

  // Contexts
  const { updateClientFromInvoice } = useClients();
  const { products, addProduct, deductStockForInvoice } = useInventory();
  const { suppliers, addSupplier, recordPurchase } = useSuppliers();
  const { invoices, addInvoice, getTvaCollectedSinceReset } = useInvoices();
  const { expenses } = useExpenses();
  const { expenseCategories, role } = useSettings();

  // Auto-reset at midnight: updates todayDate state, forcing memos to recompute
  const [todayDate, setTodayDate] = useState(() => new Date().toDateString());
  useEffect(() => {
    const scheduleReset = () => {
      const now = new Date();
      const msUntilMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime();
      return setTimeout(() => {
        setTodayDate(new Date().toDateString());
        timerId = scheduleReset();
      }, msUntilMidnight);
    };
    let timerId = scheduleReset();
    return () => clearTimeout(timerId);
  }, []);

  // UI State
  const [showSecondary, setShowSecondary] = useState(true);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);

  const dateLocale = language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-DZ' : 'en-US';
  const formattedDate = new Date().toLocaleDateString(dateLocale, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // ============ COMPUTED METRICS ============
  const metrics = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let todayRevenue = 0;
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let pendingPayments = 0;
    let tvaCollected = 0;

    const productBuyMap = new Map(products.map((p) => [p.name, p.buyingPrice]));
    let lastMonthCOGS = 0;

    invoices.forEach((inv) => {
      const invDate = new Date(inv.createdAt);
      const invMonth = invDate.getMonth();
      const invYear = invDate.getFullYear();

      // Today
      if (invDate.toDateString() === today) {
        todayRevenue += inv.total;
      }

      // This month
      if (invMonth === currentMonth && invYear === currentYear) {
        thisMonthRevenue += inv.total;
        tvaCollected += inv.tvaAmount || 0;
      }

      // Last month
      if (invMonth === lastMonth && invYear === lastMonthYear) {
        lastMonthRevenue += inv.total;
        inv.products.forEach((item) => {
          const buyingPrice = (item as any).buyingPrice ?? productBuyMap.get(item.name) ?? 0;
          lastMonthCOGS += buyingPrice * item.quantity;
        });
      }

      // Pending payments (unpaid amount)
      if (inv.status !== 'paid') {
        pendingPayments += inv.total - inv.amountPaid;
      }
    });

    // Suppliers owed
    const suppliersOwed = suppliers.reduce((sum, s) => sum + (s.totalOwed || 0), 0);

    // Today's profit = Revenue - COGS - operational expenses for today
    let todayCOGS = 0;
    invoices.forEach((inv) => {
      if (new Date(inv.createdAt).toDateString() === today) {
        inv.products.forEach((item) => {
          const buyingPrice = (item as any).buyingPrice ?? productBuyMap.get(item.name) ?? 0;
          todayCOGS += buyingPrice * item.quantity;
        });
      }
    });
    let todayOpExpenses = 0;
    expenses.forEach((exp) => {
      if (new Date(exp.date).toDateString() === today) todayOpExpenses += exp.amount;
    });
    const todayProfit = todayRevenue - todayCOGS - todayOpExpenses;

    // Last month profit = Last month revenue - COGS - operational expenses in last month
    let lastMonthOpExpenses = 0;
    expenses.forEach((exp) => {
      const expDate = new Date(exp.date);
      if (expDate.getMonth() === lastMonth && expDate.getFullYear() === lastMonthYear) {
        lastMonthOpExpenses += exp.amount;
      }
    });
    const lastMonthProfit = lastMonthRevenue - lastMonthCOGS - lastMonthOpExpenses;

    return {
      todayRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      pendingPayments,
      todayProfit,
      lastMonthProfit,
      suppliersOwed,
      tvaCollected: getTvaCollectedSinceReset(),
    };
  }, [invoices, suppliers, expenses, products, getTvaCollectedSinceReset, todayDate]);

  // ============ KPI SPARKLINE CHART DATA ============
  const kpiChartData = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Today Revenue — last 7 days daily (today is rightmost point)
    const revenueByHour = new Array(7).fill(0);
    const hourLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const ds = d.toDateString();
      let dayRev = 0;
      invoices.forEach((inv) => {
        if (new Date(inv.createdAt).toDateString() === ds) dayRev += inv.total;
      });
      revenueByHour[6 - i] = dayRev;
      hourLabels.push(d.toLocaleDateString(dateLocale, { weekday: 'short' }));
    }

    // This Month Revenue — daily buckets
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const revenueByDay = new Array(daysInMonth).fill(0);
    invoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        revenueByDay[d.getDate() - 1] += inv.total;
      }
    });
    const dayLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

    // Pending Payments — last 7 days of newly created unpaid invoice amounts
    const pendingByMonth: number[] = [];
    const pendingMonthLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const ds = d.toDateString();
      let dayPending = 0;
      invoices.forEach((inv) => {
        if (new Date(inv.createdAt).toDateString() === ds && inv.status !== 'paid') {
          dayPending += inv.total - inv.amountPaid;
        }
      });
      pendingByMonth.push(dayPending);
      pendingMonthLabels.push(d.toLocaleDateString(dateLocale, { weekday: 'short' }));
    }

    // Today Profit — last 7 days daily profit = Revenue - COGS - operational expenses
    const chartProductBuyMap = new Map(products.map((p) => [p.name, p.buyingPrice]));
    const profitByDay: number[] = [];
    const profitDayLabels: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const ds = d.toDateString();
      let dayRevenue = 0;
      let dayCOGS = 0;
      let dayOpExpenses = 0;
      invoices.forEach((inv) => {
        if (new Date(inv.createdAt).toDateString() === ds) {
          dayRevenue += inv.total;
          inv.products.forEach((item) => {
            const buyingPrice = (item as any).buyingPrice ?? chartProductBuyMap.get(item.name) ?? 0;
            dayCOGS += buyingPrice * item.quantity;
          });
        }
      });
      expenses.forEach((exp) => {
        if (new Date(exp.date).toDateString() === ds) dayOpExpenses += exp.amount;
      });
      profitByDay.push(Math.max(0, dayRevenue - dayCOGS - dayOpExpenses));
      profitDayLabels.push(d.toLocaleDateString(dateLocale, { weekday: 'short' }));
    }

    return {
      todayRevenue: { categories: hourLabels, series: revenueByHour },
      thisMonthRevenue: { categories: dayLabels, series: revenueByDay },
      pendingPayments: { categories: pendingMonthLabels, series: pendingByMonth },
      todayProfit: { categories: profitDayLabels, series: profitByDay },
    };
  }, [invoices, expenses, products, dateLocale, todayDate]);

  // ============ CASH FLOW DATA (last 6 months) ============
  const cashFlowData = useMemo(() => {
    const now = new Date();
    const months: string[] = [];
    const moneyIn: number[] = [];
    const moneyOut: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      months.push(monthName);

      const m = d.getMonth();
      const y = d.getFullYear();

      // Money in from invoices
      let monthIn = 0;
      invoices.forEach((inv) => {
        const invDate = new Date(inv.createdAt);
        if (invDate.getMonth() === m && invDate.getFullYear() === y) {
          const paid = Number(inv.amountPaid);
          if (Number.isFinite(paid)) monthIn += paid;
        }
      });
      moneyIn.push(monthIn);

      // Money out = overhead expenses + supplier payments (cash actually paid)
      let monthOut = 0;
      expenses.forEach((exp) => {
        const expDate = new Date(exp.date);
        if (expDate.getMonth() === m && expDate.getFullYear() === y) {
          const amt = Number(exp.amount);
          if (Number.isFinite(amt)) monthOut += amt;
        }
      });
      suppliers.forEach((sup) => {
        // Cash paid upfront at time of purchase
        (sup.purchases ?? []).forEach((purchase) => {
          const purchaseDate = new Date(purchase.date);
          if (purchaseDate.getMonth() === m && purchaseDate.getFullYear() === y) {
            const amt = Number(purchase.amountPaid);
            if (Number.isFinite(amt)) monthOut += amt;
          }
        });
        // Cash paid later via separate supplier payments
        (sup.payments ?? []).forEach((payment) => {
          const payDate = new Date(payment.date);
          if (payDate.getMonth() === m && payDate.getFullYear() === y) {
            const amt = Number(payment.amount);
            if (Number.isFinite(amt)) monthOut += amt;
          }
        });
      });
      moneyOut.push(monthOut);
    }

    return { categories: months, moneyIn, moneyOut };
  }, [invoices, expenses, suppliers]);

  // ============ EXPENSES BREAKDOWN ============
  const expensesBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};
    expenses.forEach((exp) => {
      // Category is now stored as label directly (e.g., "Rent", "Utilities")
      const label = expenseCategories.find((c) => c.label === exp.category)?.label ?? exp.category;
      totals[label] = (totals[label] ?? 0) + exp.amount;
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses, expenseCategories]);

  // ============ LOW STOCK ALERTS ============
  const lowStockAlerts = useMemo(() => products
    .filter((p) => p.stock <= p.minStock)
    .map((p) => ({
      id: p.id,
      name: p.name,
      currentStock: p.stock,
      minStock: p.minStock,
      status: (p.stock === 0 ? 'critical' : 'warning') as 'critical' | 'warning',
    }))
    .sort((a, b) => a.currentStock - b.currentStock), [products]);

  // ============ RECENT SALES ============
  const recentSales = useMemo(() => invoices
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((inv) => ({
      id: inv.id,
      orderNumber: inv.invoiceNumber,
      customer: inv.client.name,
      amount: inv.total,
      date: inv.createdAt,
      status: (inv.status === 'paid' ? 'completed' : 'pending') as 'completed' | 'pending' | 'shipped',
    })), [invoices]);

  // --- Invoice Save Handler (same as sales-view) ---
  const handleInvoiceSave = useCallback(
    (
      data: Omit<Invoice, 'id'>,
      options: { isEdit: boolean; originalProducts?: InvoiceProduct[]; printMode?: 'invoice' | 'delivery'; isRetail?: boolean }
    ) => {
      try {
        const productItems = data.products.map((p) => ({ name: p.name, quantity: p.quantity }));

        // Deduct stock
        const stockResult = deductStockForInvoice(productItems);
        if (!stockResult.success) {
          showError(`Stock error: ${stockResult.errors.join(', ')}`);
          return;
        }

        // Stamp buying price snapshot on every line item (for accurate profit history)
        const stamped = data.products.map((p) => {
          const fromFifo = stockResult.pricedItems?.find((pi) => pi.name.toLowerCase() === p.name.toLowerCase());
          if (fromFifo) return { ...p, buyingPrice: fromFifo.buyingPrice };
          const fromInventory = products.find((ip) => ip.name.toLowerCase() === p.name.toLowerCase());
          return { ...p, buyingPrice: fromInventory?.buyingPrice ?? 0 };
        });
        data = { ...data, products: stamped };

        const newInvoice = addInvoice(data);

        // Update client record (skip for retail walk-in sales)
        if (!options.isRetail) {
          updateClientFromInvoice(
            data.client.name,
            data.client.phone,
            data.client.address,
            data.total,
            data.amountPaid,
            { nif: data.client.nif, nis: data.client.nis, rc: data.client.rc, ai: data.client.ai }
          );
        }

        showSuccess(t('sales.invoiceCreated'), !options.printMode ? {
          label: t('common.view'),
          onClick: () => navigate(`/sales/${newInvoice.id}`),
        } : undefined);
        setInvoiceDialogOpen(false);

        // Navigate to print view if requested
        if (options.printMode && newInvoice.id) {
          navigate(`/sales/${newInvoice.id}?printMode=${options.printMode}`);
        }
      } catch (e) {
        showError(t('common.error'));
      }
    },
    [addInvoice, deductStockForInvoice, updateClientFromInvoice, navigate, showSuccess, showError, t]
  );

  // --- Product Save Handler ---
  const handleProductSubmit = useCallback(
    (data: {
      name: string;
      sku: string;
      category: string;
      supplierId: string;
      supplierName: string;
      buyingPrice: number;
      sellPrice: number;
      stock: number;
      minStock: number;
      unit: ProductUnit;
      expiryDate?: string;
    }) => {
      try {
        const newProduct = addProduct(data);
        showSuccess(t('inventory.productAdded'), {
          label: t('common.view'),
          onClick: () => navigate(`/inventory/${newProduct.id}`),
        });
        setProductDialogOpen(false);
      } catch (e) {
        showError(t('common.error'));
      }
    },
    [addProduct, navigate, showSuccess, showError, t]
  );

  // --- Supplier Save Handler ---
  const handleSupplierSubmit = useCallback(
    (data: {
      name: string;
      phone: string;
      address: string;
      email: string;
      nif?: string;
      nis?: string;
      rc?: string;
      ai?: string;
      status: 'active' | 'inactive';
      catalog: { name: string; buyingPrice: number; sellPrice: number; stock: number; unit: string; category: string; purchaseDate?: string; expiryDate?: string }[];
      initialDebt: number;
      debtDueDate?: string;
    }) => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const catalogProducts = data.catalog.filter((p) => p.name.trim());

        const newSupplier = addSupplier({
          name: data.name,
          phone: data.phone,
          address: data.address,
          email: data.email,
          nif: data.nif,
          nis: data.nis,
          rc: data.rc,
          ai: data.ai,
          status: data.status,
          catalog: catalogProducts.map((p) => ({
            ...p,
            purchaseDate: p.purchaseDate || today,
            expiryDate: p.expiryDate || undefined,
            unit: (p.unit || 'pcs') as any,
          })),
          totalPurchased: 0,
          totalOwed: 0,
          debtDueDate: data.debtDueDate,
        });

        // Record initial purchase so supplier financials are correct
        const purchaseItems = catalogProducts.map((p) => ({
          productName: p.name,
          quantity: p.stock || 1,
          unitPrice: p.buyingPrice,
        }));
        if (purchaseItems.length > 0) {
          const purchaseTotal = purchaseItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
          const amountPaid = Math.max(0, purchaseTotal - (data.initialDebt || 0));
          recordPurchase(newSupplier.id, purchaseItems, amountPaid);
        }

        // Add catalog products to inventory
        catalogProducts.forEach((p) => {
          addProduct({
            name: p.name,
            sku: '',
            category: p.category,
            supplierId: newSupplier.id,
            supplierName: data.name,
            buyingPrice: p.buyingPrice,
            sellPrice: p.sellPrice || 0,
            stock: p.stock || 0,
            minStock: 5,
            unit: (p.unit as any) || 'pcs',
            expiryDate: p.expiryDate || undefined,
          });
        });

        showSuccess(t('suppliers.supplierAdded'));
        setSupplierDialogOpen(false);
      } catch (e) {
        showError(t('common.error'));
      }
    },
    [addSupplier, recordPurchase, addProduct, showSuccess, showError, t]
  );

  // Quick Action Handlers
  const handleAddProduct = () => setProductDialogOpen(true);
  const handleAddSale = () => setInvoiceDialogOpen(true);
  const handleAddSupplier = () => setSupplierDialogOpen(true);
  const handleViewReports = () => navigate('/reports');

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        {formattedDate}
      </Typography>

      <Grid container spacing={3}>
        {/* ============ MAIN CARDS ROW ============ */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title={t('dashboard.todayRevenue')}
            percent={0}
            total={metrics.todayRevenue}
            isCurrency
            color="primary"
            icon={<Iconify icon="solar:dollar-minimalistic-bold-duotone" width={40} />}
            chart={kpiChartData.todayRevenue}
          />
        </Grid>

        {role !== 'worker' && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AnalyticsWidgetSummary
              title={t('dashboard.thisMonthRevenue')}
              percent={0}
              total={metrics.thisMonthRevenue}
              isCurrency
              color="info"
              icon={<Iconify icon="solar:graph-up-bold-duotone" width={40} />}
              chart={kpiChartData.thisMonthRevenue}
            />
          </Grid>
        )}

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title={t('dashboard.pendingPayments')}
            percent={0}
            total={metrics.pendingPayments}
            isCurrency
            color="error"
            icon={<Iconify icon="solar:danger-triangle-bold-duotone" width={40} />}
            chart={kpiChartData.pendingPayments}
          />
        </Grid>

        {role !== 'worker' && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <AnalyticsWidgetSummary
              title={t('dashboard.todayProfit')}
              percent={0}
              total={metrics.todayProfit}
              isCurrency
              color="success"
              icon={<Iconify icon="solar:graph-new-up-bold-duotone" width={40} />}
              chart={kpiChartData.todayProfit}
            />
          </Grid>
        )}

        {/* ============ COLLAPSIBLE SECONDARY CARDS ============ */}
        <Grid size={{ xs: 12 }}>
          <ButtonBase
            onClick={() => setShowSecondary(!showSecondary)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              py: 0.5,
              px: 1,
              borderRadius: 1,
              typography: 'subtitle2',
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <Iconify
              icon="solar:alt-arrow-down-bold"
              width={18}
              sx={{
                transition: 'transform 0.2s',
                transform: showSecondary ? 'rotate(0deg)' : 'rotate(-90deg)',
              }}
            />
            {showSecondary ? t('dashboard.hideDetails') : t('dashboard.showDetails')}
          </ButtonBase>

          <Collapse in={showSecondary}>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              {role !== 'worker' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsWidgetSecondary
                    title={t('dashboard.suppliersOwed')}
                    percent={0}
                    total={metrics.suppliersOwed}
                    isCurrency
                    icon={<Iconify icon="solar:delivery-bold-duotone" width={22} />}
                    chart={{
                      categories: [],
                      series: [],
                    }}
                  />
                </Grid>
              )}

              {role !== 'worker' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsWidgetSecondary
                    title={t('dashboard.tvaCollected')}
                    percent={0}
                    total={metrics.tvaCollected}
                    isCurrency
                    color="success"
                    icon={<Iconify icon="solar:check-circle-bold-duotone" width={22} />}
                    chart={{
                      categories: [],
                      series: [],
                    }}
                  />
                </Grid>
              )}

              {role !== 'worker' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsWidgetSecondary
                    title={t('dashboard.lastMonthRevenue')}
                    percent={0}
                    total={metrics.lastMonthRevenue}
                    isCurrency
                    color="info"
                    icon={<Iconify icon="solar:pie-chart-2-bold-duotone" width={22} />}
                    chart={{
                      categories: [],
                      series: [],
                    }}
                  />
                </Grid>
              )}

              {role !== 'worker' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <AnalyticsWidgetSecondary
                    title={t('dashboard.lastMonthProfit')}
                    percent={0}
                    total={metrics.lastMonthProfit}
                    color="success"
                    icon={<Iconify icon="solar:graph-new-up-bold-duotone" width={22} />}
                    chart={{
                      categories: [],
                      series: [],
                    }}
                  />
                </Grid>
              )}
            </Grid>
          </Collapse>
        </Grid>

        {/* ============ STATS & QUICK ACTIONS ROW ============ */}
        <Grid size={{ xs: 12, md: 8 }}>
          <AnalyticsCashFlow
            title={t('dashboard.cashFlow')}
            subheader={t('dashboard.lastSixMonths')}
            hideStats={role === 'worker'}
            chart={{
              categories: cashFlowData.categories,
              moneyIn: cashFlowData.moneyIn,
              moneyOut: cashFlowData.moneyOut,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsQuickActions
            onAddProduct={handleAddProduct}
            onAddSale={handleAddSale}
            onAddSupplier={handleAddSupplier}
            onViewReports={handleViewReports}
          />
        </Grid>

        {/* ============ REVENUE BREAKDOWN & LOW STOCK & ACTION ITEMS ============ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsRevenueBreakdown
            title={t('dashboard.expensesBreakdown')}
            chart={{
              series: expensesBreakdown,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsLowStock
            title={t('dashboard.lowStockAlert')}
            list={lowStockAlerts}
          />
        </Grid>

        {/* ============ ACTION ITEMS ============ */}
        <Grid size={{ xs: 12, md: 4 }}>
          <AnalyticsTodoList title={t('dashboard.actionItems')} />
        </Grid>

        {/* ============ RECENT SALES ROW ============ */}
        <Grid size={{ xs: 12 }}>
          <AnalyticsRecentSales
            title={t('dashboard.recentSales')}
            list={recentSales}
          />
        </Grid>
      </Grid>

      {/* ============ QUICK ACTION DIALOGS ============ */}
      <SalesNewInvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => setInvoiceDialogOpen(false)}
        onSave={handleInvoiceSave}
      />

      <InventoryFormDialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        onSubmit={handleProductSubmit}
      />

      <SuppliersFormDialog
        open={supplierDialogOpen}
        onClose={() => setSupplierDialogOpen(false)}
        onSubmit={handleSupplierSubmit}
      />
    </DashboardContent>
  );
}
