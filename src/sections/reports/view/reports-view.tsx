import { useState, useMemo, useCallback } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { _invoices, _clients, _suppliers, _expenses, _inventory } from 'src/_mock';

import { ReportsSummaryCards } from '../reports-summary-cards';
import { ReportsRevenueExpensesChart } from '../reports-revenue-expenses-chart';
import { ReportsProfitMarginChart } from '../reports-profit-margin-chart';
import { ReportsBreakdownTabs } from '../reports-breakdown-tabs';

// ======================================================================

const DATE_RANGES = [
  { value: 'this-month', label: 'This Month' },
  { value: 'last-month', label: 'Last Month' },
  { value: 'this-year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
] as const;

type DateRange = (typeof DATE_RANGES)[number]['value'];

// ======================================================================

function filterByDateRange<T>(items: T[], dateExtractor: (item: T) => string, range: DateRange): T[] {
  if (range === 'all') return items;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return items.filter((item) => {
    const d = new Date(dateExtractor(item));
    if (range === 'this-month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    if (range === 'last-month') {
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    }
    if (range === 'this-year') return d.getFullYear() === currentYear;
    return true;
  });
}

// ======================================================================

export function ReportsView() {
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // Filter data by selected range
  const filteredInvoices = useMemo(
    () => filterByDateRange(_invoices, (i) => i.createdAt, dateRange),
    [dateRange]
  );
  const filteredExpenses = useMemo(
    () => filterByDateRange(_expenses, (e) => e.date, dateRange),
    [dateRange]
  );

  // Summary metrics
  const summary = useMemo(() => {
    const revenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
    const supplierCosts = _suppliers.reduce((s, sp) => s + sp.totalPurchased, 0);
    const overheadExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);
    const totalExpenses = dateRange === 'all' ? supplierCosts + overheadExpenses : overheadExpenses;
    const netProfit = revenue - totalExpenses;
    const clientReceivables = _clients.reduce((s, c) => s + c.remainingBalance, 0);
    const supplierPayables = _suppliers.reduce((s, sp) => s + sp.totalOwed, 0);
    const outstandingBalance = clientReceivables - supplierPayables;

    return { revenue, totalExpenses, netProfit, outstandingBalance };
  }, [filteredInvoices, filteredExpenses, dateRange]);

  // Monthly data for charts — always show all 12 months for this year
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth = new Array(12).fill(0);
    const expensesByMonth = new Array(12).fill(0);

    _invoices.forEach((inv) => {
      const d = new Date(inv.createdAt);
      const m = d.getMonth();
      revenueByMonth[m] += inv.total;
    });

    _expenses.forEach((exp) => {
      const d = new Date(exp.date);
      const m = d.getMonth();
      expensesByMonth[m] += exp.amount;
    });

    // Profit margin per month
    const profitMargin = months.map((_, i) => {
      const rev = revenueByMonth[i];
      return rev > 0 ? ((rev - expensesByMonth[i]) / rev) * 100 : 0;
    });

    return {
      categories: months,
      revenueSeries: revenueByMonth,
      expensesSeries: expensesByMonth,
      profitMargin,
    };
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <DashboardContent maxWidth="xl">
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: { xs: 3, md: 5 },
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h4">Reports</Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            sx={{ minWidth: 160 }}
          >
            {DATE_RANGES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            startIcon={<Iconify icon="solar:printer-bold-duotone" width={20} />}
            onClick={handlePrint}
          >
            Print
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ mb: 3 }}>
        <ReportsSummaryCards
          revenue={summary.revenue}
          totalExpenses={summary.totalExpenses}
          netProfit={summary.netProfit}
          outstandingBalance={summary.outstandingBalance}
        />
      </Box>

      {/* Charts */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <ReportsRevenueExpensesChart
            title="Revenue vs Expenses"
            subheader="Monthly comparison"
            chart={{
              categories: monthlyData.categories,
              series: [
                { name: 'Revenue', data: monthlyData.revenueSeries },
                { name: 'Expenses', data: monthlyData.expensesSeries },
              ],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <ReportsProfitMarginChart
            title="Profit Margin"
            subheader="Monthly trend"
            chart={{
              categories: monthlyData.categories,
              series: monthlyData.profitMargin,
            }}
          />
        </Grid>
      </Grid>

      {/* Breakdown Tabs */}
      <ReportsBreakdownTabs
        invoices={filteredInvoices}
        clients={_clients}
        suppliers={_suppliers}
        expenses={filteredExpenses}
        inventory={_inventory}
      />
    </DashboardContent>
  );
}
